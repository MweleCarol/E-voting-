// src/modules/candidates/candidates.types.ts

import type { CandidateStatus } from '@generated/prisma/client';

// ─── INPUT ──────────────────────────────────────────────────────────────────
export interface CreateCandidacyInput {
  studentId: string;   // resolved from the authenticated user's linked Student row
  positionId: string;  // electionId is derived from this, never accepted directly from the client
  manifesto?: string;
}

export interface WithdrawCandidacyInput {
  candidateId: string;
  studentId: string; // must match the candidacy's own studentId — a student can only withdraw their own candidacy
}

export interface ListCandidatesQuery {
  positionId?: string;
  electionId?: string;
  status?: CandidateStatus;
  page?: number;
  pageSize?: number;
}

// ─── RESPONSE ───────────────────────────────────────────────────────────────
export interface CandidateResponse {
  id: string;
  studentId: string;
  positionId: string;
  manifesto: string | null;
  status: CandidateStatus;
  createdAt: Date;
}

export interface PaginatedCandidatesResponse {
  candidates: CandidateResponse[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── INTER-MODULE CONTRACT: THE RESOLVER M8 WILL CALL ──────────────────────
// Mirrors elections.types.ts's ApplyApprovalDecisionResult exactly — same
// discriminated-union, never-throws contract, since this is about to occupy
// the same ACTION_RESOLVERS slot. Consistency here isn't cosmetic: it's what
// lets ActionResolver's return type generalize cleanly into a real union
// instead of two unrelated shapes forced together.
export type CandidateApprovalResult =
  | { outcome: 'not_found' }
  | { outcome: 'invalid_state'; currentStatus: CandidateStatus }
  | { outcome: 'candidate_approved'; candidateId: string }
  | { outcome: 'candidate_rejected'; candidateId: string };


// candidates.types.ts — new
export interface CandidateApprovalPayload {
  candidateId: string;
}