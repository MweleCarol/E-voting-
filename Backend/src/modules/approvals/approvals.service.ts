// src/modules/approvals/approvals.service.ts

import { logger } from '@config/logger';
import { NotFoundError, AuthorizationError, NotImplementedError } from '@shared/errors';
import { applyApprovalDecision as electionsApplyApprovalDecision } from '../elections/elections.service.js';
import type { ApplyApprovalDecisionResult } from '../elections/elections.types.js';
import {
  APPROVAL_QUORUM,
  VETO_ON_FIRST_REJECTION,
  type CastApprovalInput,
  type ApprovalOutcome,
  type ActionResolverMap,
  type ResolvedApprovalContext,
  type ApprovalRequestWithTally,
  type ListApprovalRequestsQuery,
  type ActionDispatchResult,
} from './approvals.types.js';
import {
  findRequestForVoting,
  castApproval,
  getTally,
  resolveRequest,
  findRequestWithTally,
  listApprovalRequests as dbListApprovalRequests,
} from './approvals.repository.js';
import {resolveCandidacy} from '../candidates/candidates.service.js';

import { Prisma } from '@generated/prisma/client';
import { prisma } from '@database/client.js';

// ─── DISPATCH TABLE ─────────────────────────────────────────────────────────
// Only ELECTION_ACTIVATE / ELECTION_CLOSE have owning modules today.
// RESULTS_PUBLISH (M14) and CANDIDATE_APPROVE (M10) are deliberately absent —
// see castVote's resolver lookup below for what happens if one resolves anyway.
const ACTION_RESOLVERS: ActionResolverMap = {
  ELECTION_ACTIVATE: (ctx, tx) => dispatchToElections(ctx, tx),
  ELECTION_CLOSE: (ctx, tx) => dispatchToElections(ctx, tx),
  CANDIDATE_APPROVE: (ctx, tx) => dispatchToCandidates(ctx, tx),
};

async function dispatchToCandidates(ctx: ResolvedApprovalContext, tx: Prisma.TransactionClient) {
  const { request, finalDecision } = ctx;
  return resolveCandidacy(request, finalDecision, tx);
}

async function dispatchToElections(ctx: ResolvedApprovalContext, tx?: Prisma.TransactionClient) {
  const { request, finalDecision } = ctx;

  // electionId is nullable at the schema level (CANDIDATE_APPROVE/RESULTS_PUBLISH
  // requests won't have one), but ELECTION_ACTIVATE/ELECTION_CLOSE requests must.
  // Fail loudly here rather than pass null into M7 and let it fail unpredictably.
  if (!request.electionId) {
    throw new NotImplementedError(
      `ApprovalRequest '${request.id}' has actionType '${request.actionType}' ` +
        `but no electionId — this request row is malformed.`,
    );
  }

  return electionsApplyApprovalDecision(
    {
      electionId: request.electionId,
      actionType: request.actionType as 'ELECTION_ACTIVATE' | 'ELECTION_CLOSE',
      approved: finalDecision === 'APPROVED',
    },
    tx,
  );
}

// ─── CAST VOTE ──────────────────────────────────────────────────────────────
export async function castVote(input: CastApprovalInput): Promise<ApprovalOutcome> {
  const request = await findRequestForVoting(input.requestId);

  if (!request) {
    throw new NotFoundError(`Approval request '${input.requestId}' not found`);
  }

  if (request.status !== 'PENDING') {
    throw new NotFoundError(
      `Approval request '${input.requestId}' is already resolved (${request.status})`,
    );
  }

  // Self-approval: the role permits voting in general, but never on your own
  // request — this is an AuthorizationError (role-level), not ForbiddenError
  // (resource-level), per errors.ts's own distinction between the two.
  if (request.requestedBy === input.officerId) {
    throw new AuthorizationError('You cannot vote on an approval request you created');
  }

  // Double-voting is already structurally blocked at the DB layer
  // (@@unique([requestId, officerId])) — castApproval surfaces that as
  // ConflictError if it fires. No pre-check needed here.
  await castApproval(input);

  const { approveCount, rejectCount } = await getTally(input.requestId);

  logger.info('approval.vote_cast', {
    requestId: input.requestId,
    officerId: input.officerId,
    decision: input.decision,
    approveCount,
    rejectCount,
  });

  // Veto check first, unconditionally — a single REJECT resolves the request
  // regardless of how many APPROVEs already exist, per your explicit design.
  if (VETO_ON_FIRST_REJECTION && rejectCount >= 1) {
    return resolveAndDispatch(request.id, 'REJECTED', approveCount, rejectCount);
  }

  const requiredApprovals = APPROVAL_QUORUM[request.actionType];

  if (approveCount >= requiredApprovals) {
    return resolveAndDispatch(request.id, 'APPROVED', approveCount, rejectCount);
  }

  return {
    outcome: 'PENDING',
    approveCount,
    rejectCount,
    requiredApprovals,
  };
}

// ─── RESOLVE + DISPATCH (private) ──────────────────────────────────────────
async function resolveAndDispatch(
  requestId: string,
  finalDecision: 'APPROVED' | 'REJECTED',
  approveCount: number,
  rejectCount: number,
): Promise<ApprovalOutcome> {
  let dispatchResult: ActionDispatchResult | null = null;

  await prisma.$transaction(async (tx) => {
    await resolveRequest(requestId, finalDecision, tx);

    if (finalDecision === 'APPROVED') {
      const request = await findRequestForVoting(requestId, tx);

      if (!request) {
        // Structurally shouldn't happen — we just wrote this row ourselves, inside this same tx.
        throw new NotFoundError(`Approval request '${requestId}' vanished after resolution`);
      }

      const resolver = ACTION_RESOLVERS[request.actionType];

      if (!resolver) {
        throw new NotImplementedError(
          `No resolver registered for action type '${request.actionType}'. M10/M14 may not be built yet.`,
        );
      }

      dispatchResult = await resolver(
        { request: { ...request, approveCount, rejectCount }, finalDecision },
        tx,
      );
    }
  });

  logger.info('approval.request_resolved', { requestId, finalDecision, approveCount, rejectCount });

  return {
    outcome: 'RESOLVED',
    finalDecision,
    approveCount,
    rejectCount,
    dispatchResult,
  };
}

// add to approvals.service.ts

export async function getApprovalRequestById(requestId: string): Promise<ApprovalRequestWithTally> {
  const request = await findRequestWithTally(requestId);

  if (!request) {
    throw new NotFoundError(`Approval request '${requestId}' not found`);
  }

  return request;
}

export async function listApprovalRequests(query: ListApprovalRequestsQuery) {
  return dbListApprovalRequests(query);
}
