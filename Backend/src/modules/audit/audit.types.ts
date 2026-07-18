// src/modules/audit/audit.types.ts

import { sha256 } from '@security/hashing.service.js'; // ⚠️ path unconfirmed

// ─── GENESIS ─────────────────────────────────────────────────────────────────
// Institution-and-year-bound, not a generic literal — computed from a visible
// source string rather than a pasted hex constant, so the derivation itself
// is auditable. Defends against single-entry, in-place tampering with an
// intact chain. Does NOT defend against a full deliberate wipe-and-reseed by
// an actor with database write access — that would require external
// publication of the latest hash, out of scope for this milestone.
export const GENESIS_SEED = 'SEVS-DEKUT-GENESIS-2026';
export const GENESIS_HASH = sha256(GENESIS_SEED);

// ─── EVENT TYPES — narrow, deliberate scope ─────────────────────────────────
// Closed union, not `string` — adding a 9th event type is a visible, one-line
// change here, never a silent possibility scattered across the codebase.
export type AuditEventType =
  | 'ELECTION_SCHEDULED'
  | 'ELECTION_ACTIVATED'
  | 'ELECTION_CLOSED'
  | 'CANDIDATE_APPROVED'
  | 'CANDIDATE_REJECTED'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'VOTE_CAST';
  // APPROVAL_RESOLVED removed — superseded by the specific outcomes above,
  // would otherwise sit in the union unused, same dead-code discipline as
  // M6's flagged (and never-fired) ForbiddenError stub.

export const QUORUM_DECISION_ACTOR = 'QUORUM_DECISION' as const;

// ─── ANONYMIZATION SENTINEL ──────────────────────────────────────────────────
// VOTE_CAST entries MUST use this, never a real studentId/userId — logging
// the real actor here would recreate the exact identity-vote link the
// Vote/Ballot schema was deliberately built to prevent. Named and exported
// explicitly so the omission is a visible, documented choice, not a
// suspicious-looking unexplained placeholder buried in votes.service.ts.
export const SYSTEM_ANONYMIZED_ACTOR = 'SYSTEM_ANONYMIZED_VOTER' as const;

// ─── APPEND ─────────────────────────────────────────────────────────────────
export interface AppendAuditEventInput {
  actorId: string; // must be SYSTEM_ANONYMIZED_ACTOR for VOTE_CAST events
  eventType: AuditEventType;
  eventData: Record<string, unknown>;
}

// ─── RESPONSE ───────────────────────────────────────────────────────────────
export interface AuditLogResponse {
  id: string;
  actorId: string;
  eventType: string;
  eventData: unknown;
  previousHash: string;
  currentHash: string;
  createdAt: Date;
}

export interface ListAuditLogQuery {
  eventType?: AuditEventType;
  page?: number;
  pageSize?: number;
}

// ─── CHAIN VERIFICATION ──────────────────────────────────────────────────────
// A specific "broken at" pointer, not a bare boolean — an auditor needs to
// know WHERE a chain breaks, not just THAT it does.
export type ChainVerificationResult =
  | { valid: true; entriesChecked: number }
  | { valid: false; brokenAtId: string; entriesChecked: number; reason: string };