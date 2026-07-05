// src/modules/elections/elections.service.ts

import { logger } from '@config/logger';
import {
  NotFoundError,
  ElectionStateError,
  ValidationError,
} from '@shared/errors';
import {
  ALLOWED_TRANSITIONS,
  type CreateElectionInput,
  type UpdateElectionInput,
  type AddPositionInput,
  type ListElectionsInput,
  type ElectionDetailResponse,
  type ElectionPositionResponse,
  type PaginatedElectionsResponse,
  type ApplyApprovalDecisionInput,
  type ApplyApprovalDecisionResult,
  type ElectionStatus,
} from './elections.types.js';
import {
  createElection       as dbCreateElection,
  findElectionById,
  findElectionForTransition,
  listElections        as dbListElections,
  listActiveElections  as dbListActiveElections,
  updateElection       as dbUpdateElection,
  updateElectionStatus,
  addPosition          as dbAddPosition,
  removePosition       as dbRemovePosition,
  findPositionById,
  createApprovalRequest,
} from './elections.repository.js';

// ─── PRIVATE GUARD ────────────────────────────────────────────────────────────

// Fetches the election and asserts the transition is allowed from its current
// status. Throws 404 if not found, 422 if the transition is disallowed.
// Returns the fetched record so callers don't need a second query.
async function assertTransitionAllowed(
  electionId: string,
  action: keyof typeof ALLOWED_TRANSITIONS,
): Promise<{ id: string; status: ElectionStatus }> {
  const election = await findElectionForTransition(electionId);

  if (!election) {
    throw new NotFoundError(`Election '${electionId}' not found`);
  }

  const allowed = ALLOWED_TRANSITIONS[action] as readonly ElectionStatus[];

  if (!allowed.includes(election.status)) {
    throw new ElectionStateError(
      `Cannot '${action}' an election with status '${election.status}'. ` +
      `Allowed from: ${allowed.join(', ')}.`,
    );
  }

  return election;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createElection(
  input: CreateElectionInput,
  actorId: string,
): Promise<ElectionDetailResponse> {
  const election = await dbCreateElection(input, actorId);

  logger.info('election.created', {
    electionId: election.id,
    actorId,
    title:      election.title,
    positions:  election.positions.length,
  });

  return election;
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getElectionById(
  electionId: string,
  actorRole: string,
): Promise<ElectionDetailResponse> {
  const election = await findElectionById(electionId);

  if (!election) {
    throw new NotFoundError(`Election '${electionId}' not found`);
  }

  // Students may only see ACTIVE elections.
  // Returning 404 (not 403) deliberately — a student should not be able to
  // confirm that a DRAFT election exists by observing the error code change.
  if (actorRole === 'STUDENT' && election.status !== 'ACTIVE') {
    throw new NotFoundError(`Election '${electionId}' not found`);
  }

  return election;
}

export async function listElections(
  input: ListElectionsInput,
): Promise<PaginatedElectionsResponse> {
  return dbListElections(input);
}

export async function listActiveElections(
  input: Pick<ListElectionsInput, 'page' | 'limit'>,
): Promise<PaginatedElectionsResponse> {
  return dbListActiveElections(input);
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateElection(
  electionId: string,
  input: UpdateElectionInput,
  actorId: string,
): Promise<ElectionDetailResponse> {
  // Fetch full record — we need current dates for cross-field validation.
  const current = await findElectionById(electionId);

  if (!current) {
    throw new NotFoundError(`Election '${electionId}' not found`);
  }

  if (current.status !== 'DRAFT') {
    throw new ElectionStateError(
      `Only DRAFT elections can be updated. Current status: '${current.status}'.`,
    );
  }

  // Cross-field date validation against stored values.
  // Zod only cross-validates when both dates are present in the request body.
  // Here we resolve the effective values against what is already stored.
  const effectiveStart = input.startDate ?? current.startDate;
  const effectiveEnd   = input.endDate   ?? current.endDate;

  if (effectiveEnd <= effectiveStart) {
    throw new ValidationError('endDate must be after startDate.');
  }

  const updated = await dbUpdateElection(electionId, input);

  logger.info('election.updated', {
    electionId,
    actorId,
    fields: Object.keys(input).filter(
      (k) => input[k as keyof UpdateElectionInput] !== undefined,
    ),
  });

  return updated;
}

// ─── STATE TRANSITIONS ────────────────────────────────────────────────────────

export async function submitElection(
  electionId: string,
  actorId: string,
): Promise<void> {
  const election = await assertTransitionAllowed(electionId, 'submit');

  // Create the approval request before changing status.
  // If ApprovalRequest creation fails, the election stays DRAFT — no partial state.
  const request = await createApprovalRequest(
    electionId,
    'ELECTION_ACTIVATE',
    actorId,
  );

  await updateElectionStatus(electionId, 'PENDING_APPROVAL');

  logger.info('election.submitted', {
    electionId,
    actorId,
    previousStatus:    election.status,
    approvalRequestId: request.id,
  });
}

export async function cancelElection(
  electionId: string,
  actorId: string,
): Promise<void> {
  const election = await assertTransitionAllowed(electionId, 'cancel');

  await updateElectionStatus(electionId, 'CANCELLED');

  logger.info('election.cancelled', {
    electionId,
    actorId,
    previousStatus: election.status,
  });
}

export async function activateElection(
  electionId: string,
  actorId: string,
): Promise<void> {
  const election = await assertTransitionAllowed(electionId, 'activate');

  await updateElectionStatus(electionId, 'ACTIVE');

  logger.info('election.activated', {
    electionId,
    actorId,
    previousStatus: election.status,
  });
}

export async function initiateClose(
  electionId: string,
  actorId: string,
): Promise<{ approvalRequestId: string }> {
  // Guard: must be ACTIVE to initiate a close request.
  const election = await assertTransitionAllowed(electionId, 'close');

  // Election stays ACTIVE — close is governance-gated (Design B).
  // Status only changes when M8 approves the ELECTION_CLOSE request.
  const request = await createApprovalRequest(
    electionId,
    'ELECTION_CLOSE',
    actorId,
  );

  logger.info('election.close_requested', {
    electionId,
    actorId,
    currentStatus:     election.status,
    approvalRequestId: request.id,
  });

  return { approvalRequestId: request.id };
}

// ─── POSITIONS ────────────────────────────────────────────────────────────────

export async function addPosition(
  electionId: string,
  input: AddPositionInput,
  actorId: string,
): Promise<ElectionPositionResponse> {
  const election = await findElectionForTransition(electionId);

  if (!election) {
    throw new NotFoundError(`Election '${electionId}' not found`);
  }

  if (election.status !== 'DRAFT') {
    throw new ElectionStateError(
      `Positions can only be added to DRAFT elections. ` +
      `Current status: '${election.status}'.`,
    );
  }

  const position = await dbAddPosition(electionId, input.title);

  logger.info('election.position_added', {
    electionId,
    positionId: position.id,
    title:      position.title,
    actorId,
  });

  return position;
}

export async function removePosition(
  electionId: string,
  positionId: string,
  actorId: string,
): Promise<void> {
  const election = await findElectionForTransition(electionId);

  if (!election) {
    throw new NotFoundError(`Election '${electionId}' not found`);
  }

  if (election.status !== 'DRAFT') {
    throw new ElectionStateError(
      `Positions can only be removed from DRAFT elections. ` +
      `Current status: '${election.status}'.`,
    );
  }

  // Ownership check — confirm this position belongs to this election.
  // Returns 404 on mismatch deliberately — a 403 would confirm the position
  // exists in another election, which is an information leak.
  const position = await findPositionById(positionId);

  if (!position || position.electionId !== electionId) {
    throw new NotFoundError(`Position '${positionId}' not found`);
  }

  await dbRemovePosition(positionId);

  logger.info('election.position_removed', {
    electionId,
    positionId,
    actorId,
  });
}

// ─── INTER-MODULE CONTRACT: CALLED BY M8 ─────────────────────────────────────

// M8 calls this after resolving an ApprovalRequest for an election action.
// Returns a discriminated union — never throws — so M8 can handle every
// branch in its own service logic without catching exceptions.
export async function applyApprovalDecision(
  input: ApplyApprovalDecisionInput,
): Promise<ApplyApprovalDecisionResult> {
  const election = await findElectionForTransition(input.electionId);

  if (!election) {
    return { outcome: 'not_found' };
  }

  // ELECTION_ACTIVATE: approved → SCHEDULED, rejected → revert to DRAFT
  if (input.actionType === 'ELECTION_ACTIVATE') {
    if (election.status !== 'PENDING_APPROVAL') {
      return { outcome: 'invalid_state', currentStatus: election.status };
    }

    if (input.approved) {
      await updateElectionStatus(input.electionId, 'SCHEDULED');
      logger.info('election.scheduled', {
        electionId: input.electionId,
        via:        'approval_decision',
      });
      return { outcome: 'election_scheduled', electionId: input.electionId };
    } else {
      await updateElectionStatus(input.electionId, 'DRAFT');
      logger.info('election.reverted_to_draft', {
        electionId: input.electionId,
        via:        'approval_decision',
      });
      return { outcome: 'election_reverted_to_draft', electionId: input.electionId };
    }
  }

  // ELECTION_CLOSE: approved → CLOSED, rejected → election stays ACTIVE
  if (input.actionType === 'ELECTION_CLOSE') {
    if (election.status !== 'ACTIVE') {
      return { outcome: 'invalid_state', currentStatus: election.status };
    }

    if (input.approved) {
      await updateElectionStatus(input.electionId, 'CLOSED');
      logger.info('election.closed', {
        electionId: input.electionId,
        via:        'approval_decision',
      });
      return { outcome: 'election_closed', electionId: input.electionId };
    } else {
      // Rejected — election continues running. No status change.
      logger.info('election.close_rejected', {
        electionId:    input.electionId,
        currentStatus: election.status,
      });
      return { outcome: 'election_close_rejected', electionId: input.electionId };
    }
  }

  // TypeScript exhaustiveness guard — unreachable given the Extract type
  // constraint on ApplyApprovalDecisionInput.actionType.
  return { outcome: 'invalid_state', currentStatus: election.status };
}