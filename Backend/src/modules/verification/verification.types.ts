// src/modules/verification/verification.types.ts

import type { RegistrationStatus, ElectionStatus } from '@generated/prisma/client';

// ─── ELECTION STATE GATE ────────────────────────────────────────────────────
// Registration is only possible before an election goes ACTIVE — same
// ALLOWED_TRANSITIONS-style precedent as elections.types.ts and
// approvals.types.ts before it: policy as data, not scattered conditionals.
export const REGISTRATION_ALLOWED_ELECTION_STATUSES: readonly ElectionStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'SCHEDULED',
];

// ─── INPUT ──────────────────────────────────────────────────────────────────
export interface RegisterForElectionInput {
  studentId: string; // resolved from the authenticated user's linked Student row, not passed by the client
  electionId: string;
}

export interface ResolveRegistrationInput {
  registrationId: string;
  officerId: string;
}

export interface ListRegistrationsQuery {
  electionId: string;
  status?: RegistrationStatus;
  page?: number;
  pageSize?: number;
}

// ─── RESPONSE ───────────────────────────────────────────────────────────────
export interface VoterRegistrationResponse {
  id: string;
  studentId: string;
  electionId: string;
  status: RegistrationStatus;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  participated: boolean;
  createdAt: Date;
}

export interface PaginatedRegistrationsResponse {
  registrations: VoterRegistrationResponse[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── ELIGIBILITY CHECK (internal — called by M11, no HTTP surface) ─────────
// A discriminated union, not a bare boolean — deliberate departure from the
// spec's literal isEligible(): boolean signature. A flat `false` can't tell
// M11 whether the student never registered, was rejected, or already voted —
// three different situations a caller may need to react to differently.
// M11 can still do a simple `.eligible === true` check for the common case.
export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: 'NOT_REGISTERED' }
  | { eligible: false; reason: 'NOT_APPROVED'; currentStatus: RegistrationStatus }
  | { eligible: false; reason: 'ALREADY_PARTICIPATED' };