// src/modules/approvals/approvals.types.ts

import type {
  ApprovalActionType,
  ApprovalStatus,
  ApprovalDecision,
  Prisma,
} from '@generated/prisma/client';
import type { ApplyApprovalDecisionResult } from '../elections/elections.types.js';
import  type { CandidateApprovalResult } from '../candidates/candidates.types.js';

// ─── QUORUM POLICY ─────────────────────────────────────────────────────────
// How many independent ELECTION_OFFICER approvals are required to resolve
// a request to APPROVED. Kept as a per-actionType map (not a flat constant)
// so a future differentiated committee structure is a data change, not a
// rewrite — same precedent as elections.types.ts's ALLOWED_TRANSITIONS.
export const APPROVAL_QUORUM: Record<ApprovalActionType, number> = {
  ELECTION_ACTIVATE: 2,
  ELECTION_CLOSE: 2,
  RESULTS_PUBLISH: 2,
  CANDIDATE_APPROVE: 2,
};

// Reject is a veto, not a count: the first REJECT resolves the request to
// REJECTED regardless of how many APPROVEs already exist. Named as a policy
// flag rather than modeled as "threshold of 1" so the code states the rule
// instead of implying a count that isn't actually being accumulated.
export const VETO_ON_FIRST_REJECTION = true;

// ─── INPUT ──────────────────────────────────────────────────────────────────
export interface CastApprovalInput {
  requestId: string;
  officerId: string; // resolved from req.user by the controller, never trusted from body
  decision: ApprovalDecision;
  comment?: string;
}

export interface ListApprovalRequestsQuery {
  status?: ApprovalStatus;
  actionType?: ApprovalActionType;
  page?: number;
  pageSize?: number;
}

// ─── REPOSITORY SHAPES ──────────────────────────────────────────────────────
export interface ApprovalRequestWithTally {
  id: string;
  actionType: ApprovalActionType;
  requestedBy: string;
  electionId: string | null;
  status: ApprovalStatus;
  payload: unknown;
  createdAt: Date;
  resolvedAt: Date | null;
  approveCount: number;
  rejectCount: number;
}

// ─── DISPATCH CONTRACT (this module → owning module) ───────────────────────
// Every action type that has reached a final decision must be handed to the
// module that actually owns the side effect. M8 never mutates Election,
// Candidate, or Result rows itself — it only decides *that* a decision was
// reached, then calls into the owning module's exported resolver.
export interface ResolvedApprovalContext {
  request: ApprovalRequestWithTally;
  finalDecision: 'APPROVED' | 'REJECTED';
}

// New: a named union, so this list grows by one line per future module (M14 adds its own member here later)
// instead of every reference to the result type needing to be edited individually.
export type ActionDispatchResult = ApplyApprovalDecisionResult | CandidateApprovalResult;

export type ActionResolver = (
  ctx: ResolvedApprovalContext,
  tx: Prisma.TransactionClient,
) => Promise<ActionDispatchResult>;

// Deliberately Partial: RESULTS_PUBLISH (M14) and CANDIDATE_APPROVE (M10)
// have no resolver yet because those modules don't exist. A request of
// that type reaching quorum today must fail loudly, not silently no-op —
// see ApprovalOutcome below.
export type ActionResolverMap = Partial<Record<ApprovalActionType, ActionResolver>>;

// ─── OUTCOME (discriminated union — same pattern as M5's LoginResult) ──────
export type ApprovalOutcome =
  | {
      outcome: 'PENDING';
      approveCount: number;
      rejectCount: number;
      requiredApprovals: number;
    }
  | {
      outcome: 'RESOLVED';
      finalDecision: 'APPROVED' | 'REJECTED';
      approveCount: number;
      rejectCount: number;
      dispatchResult: ActionDispatchResult | null; // null only when veto-rejected — nothing to dispatch on a rejection
    }
 
