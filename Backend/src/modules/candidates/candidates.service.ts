// src/modules/candidates/candidates.service.ts

import { logger } from '@config/logger';
import { NotFoundError, ElectionStateError, NotImplementedError } from '@shared/errors';
import { findStudentByUserId } from '../users/users.repository.js';
import { findPositionById,findElectionForTransition } from '../elections/elections.repository.js';
import { isEligible } from '../verification/verification.service.js';
import { REGISTRATION_ALLOWED_ELECTION_STATUSES } from '../verification/verification.types.js';
import type { Prisma } from '@generated/prisma/client';
import type {
  CreateCandidacyInput,
  WithdrawCandidacyInput,
  ListCandidatesQuery,
  CandidateApprovalResult,
} from './candidates.types.js';
import {
  createCandidacyWithApprovalRequest,
  findCandidacyForResolution,
  updateCandidateStatus,
  findCandidacyForWithdrawal,
  withdrawCandidacy as dbWithdrawCandidacy,
  listCandidates as dbListCandidates,
  findCandidateById,
} from './candidates.repository.js';

// ─── SUBMIT CANDIDACY ────────────────────────────────────────────────────────
export async function submitCandidacy(userId: string, input: Omit<CreateCandidacyInput, 'studentId'>) {
  const student = await findStudentByUserId(userId);
  if (!student) {
    throw new NotFoundError('No student profile linked to this account');
  }

  const position = await findPositionById(input.positionId);
  if (!position) {
    throw new NotFoundError(`Position '${input.positionId}' not found`);
  }

  // Election-state gate — same allowed-states policy M9 uses for
  // registration, since candidacy and voter registration both close
  // at the same point in the election lifecycle.
  const election = await findElectionForTransition(position.electionId);
  if (!election) {
    throw new NotFoundError(`Election '${position.electionId}' not found`);
  }
  if (!REGISTRATION_ALLOWED_ELECTION_STATUSES.includes(election.status)) {
    throw new ElectionStateError(
      `Cannot submit a candidacy for an election with status '${election.status}'.`
    );
  }

  // Eligibility: must already be an approved voter for this election.
  // Reuses M9's isEligible() rather than a parallel check — see design note.
  const eligibility = await isEligible(student.id, position.electionId);
  if (!eligibility.eligible) {
    throw new ElectionStateError(
      `You must be an approved voter for this election before running for a position (${eligibility.reason}).`
    );
  }

  const { candidate, approvalRequestId } = await createCandidacyWithApprovalRequest({
    studentId: student.id,
    positionId: input.positionId,
    electionId: position.electionId,
    manifesto: input.manifesto,
    requestedBy: userId,
  });

  logger.info('candidacy.submitted', { candidateId: candidate.id, studentId: student.id, approvalRequestId });

  return candidate;
}

// ─── WITHDRAW ───────────────────────────────────────────────────────────────
export async function withdrawCandidacy(userId: string, input: Omit<WithdrawCandidacyInput, 'studentId'>) {
  const student = await findStudentByUserId(userId);
  if (!student) {
    throw new NotFoundError('No student profile linked to this account');
  }

  const candidacy = await findCandidacyForWithdrawal(input.candidateId);
  if (!candidacy) {
    throw new NotFoundError(`Candidacy '${input.candidateId}' not found`);
  }
  if (candidacy.studentId !== student.id) {
    throw new NotFoundError(`Candidacy '${input.candidateId}' not found`); // 404, not 403 — same info-leak precedent as M7
  }
  if (candidacy.status !== 'PENDING' && candidacy.status !== 'APPROVED') {
    throw new ElectionStateError(`Candidacy is already '${candidacy.status}' — cannot withdraw`);
  }

  const updated = await dbWithdrawCandidacy(input.candidateId);
  logger.info('candidacy.withdrawn', { candidateId: input.candidateId, studentId: student.id });
  return updated;
}

// ─── LIST ───────────────────────────────────────────────────────────────────
export async function listCandidates(query: ListCandidatesQuery) {
  return dbListCandidates(query);
}

// ─── RESOLVER — called by M8's ACTION_RESOLVERS, inside its transaction ────
export async function resolveCandidacy(
  request: { id: string; payload: unknown; actionType: string },
  finalDecision: 'APPROVED' | 'REJECTED',
  tx: Prisma.TransactionClient,
): Promise<CandidateApprovalResult> {
  const payload = request.payload as { candidateId?: unknown } | null;

  // payload is trusted (written by our own service code, never client input)
  // but has no DB-level shape guarantee — see prior turn's Option B tradeoff.
  if (!payload || typeof payload.candidateId !== 'string') {
    throw new NotImplementedError(
      `ApprovalRequest '${request.id}' (CANDIDATE_APPROVE) has a malformed payload — missing candidateId.`
    );
  }

  const candidate = await findCandidacyForResolution(payload.candidateId, tx);
  if (!candidate) {
    return { outcome: 'not_found' };
  }
  if (candidate.status !== 'PENDING') {
    return { outcome: 'invalid_state', currentStatus: candidate.status };
  }

  const newStatus = finalDecision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  await updateCandidateStatus(candidate.id, newStatus, tx);

  return finalDecision === 'APPROVED'
    ? { outcome: 'candidate_approved', candidateId: candidate.id }
    : { outcome: 'candidate_rejected', candidateId: candidate.id };
}


export async function getCandidateById(candidateId: string) {
  const candidate = await findCandidateById(candidateId);
  if (!candidate) {
    throw new NotFoundError(`Candidate '${candidateId}' not found`);
  }
  return candidate;
}