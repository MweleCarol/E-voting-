// src/modules/elections/elections.types.ts

import type { ElectionStatus, ApprovalActionType } from '@generated/prisma/client';

// ─── RE-EXPORT ENUM FOR CONSUMERS ─────────────────────────────────────────────
// Downstream modules (M8, M10, M12) import ElectionStatus from here rather than
// directly from generated/prisma — insulates them from generator output path changes.
export type { ElectionStatus };

// ─── VALID TRANSITIONS ────────────────────────────────────────────────────────
// Explicit map of which states a transition is allowed FROM.
// Used by the service layer's guard checks — one place to update if rules change.
export const ALLOWED_TRANSITIONS: Record<string, ElectionStatus[]> = {
  submit:   ['DRAFT'],
  cancel:   ['DRAFT', 'PENDING_APPROVAL'],
  activate: ['SCHEDULED'],
  close:    ['ACTIVE'],
} as const;

// ─── INPUT TYPES ──────────────────────────────────────────────────────────────

export interface CreateElectionInput {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  positions: string[]; // position titles — at least one required
}

export interface UpdateElectionInput {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AddPositionInput {
  title: string;
}

// ─── RESPONSE TYPES ───────────────────────────────────────────────────────────

export interface ElectionPositionResponse {
  id: string;
  title: string;
  candidateCount?: number; // populated in detail view once M10 is built
}

// Returned by list endpoints — no positions array (avoid N+1 on list queries)
export interface ElectionSummaryResponse {
  id: string;
  title: string;
  description: string | null;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  positionCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Returned by get-by-id — includes full positions array
export interface ElectionDetailResponse {
  id: string;
  title: string;
  description: string | null;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  positions: ElectionPositionResponse[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── LIST QUERY INPUT ─────────────────────────────────────────────────────────

export interface ListElectionsInput {
  status?: ElectionStatus;
  page: number;
  limit: number;
}

export interface PaginatedElectionsResponse {
  elections: ElectionSummaryResponse[];
  total: number;
  page: number;
  limit: number;
}

// ─── INTER-MODULE CONTRACT: M8 → M7 ───────────────────────────────────────────
// M8 (Approvals) calls electionsService.applyApprovalDecision() when an
// ApprovalRequest for an election action is resolved. This type is the contract.

export interface ApplyApprovalDecisionInput {
  electionId: string;
  actionType: Extract<
    ApprovalActionType,
    'ELECTION_ACTIVATE' | 'ELECTION_CLOSE'
  >;
  approved: boolean; // true = APPROVE, false = REJECT
}

// Discriminated union — M8 must handle both branches explicitly.
export type ApplyApprovalDecisionResult =
  | { outcome: 'election_scheduled'; electionId: string }
  | { outcome: 'election_reverted_to_draft'; electionId: string }
  | { outcome: 'election_closed'; electionId: string }
  | { outcome: 'election_close_rejected'; electionId: string }
  | { outcome: 'not_found' }
  | { outcome: 'invalid_state'; currentStatus: ElectionStatus };