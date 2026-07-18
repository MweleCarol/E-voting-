// src/modules/ballots/ballots.types.ts

// ─── ISSUANCE POLICY ────────────────────────────────────────────────────────
// Named constant, not inline — same precedent as APPROVAL_QUORUM and
// REGISTRATION_ALLOWED_ELECTION_STATUSES: a number that needs real-world
// tuning, kept in one place.
export const BALLOT_SESSION_DURATION_MINUTES = 30;

// ─── INPUT ──────────────────────────────────────────────────────────────────
export interface RequestBallotInput {
  studentId: string; // resolved from the authenticated user's linked Student row
  electionId: string;
}

// ─── RESPONSE ───────────────────────────────────────────────────────────────
// Single shape, not a union — see design note. Failures are exceptions
// (NotFoundError, ElectionStateError, AuthorizationError), matching M9's
// registerForElection rather than M7/M8's multi-branch decision engines.
export interface BallotTokenResponse {
  token: string;
  issuedAt: Date;
  expiresAt: Date;
}

// ─── INTER-MODULE CONTRACT: WHAT M12 WILL CALL ──────────────────────────────
// A real discriminated union — unlike BallotTokenResponse above, these four
// branches are genuinely different situations M12's cast-vote flow needs to
// react to differently, same reasoning as M9's EligibilityResult.
//
// Deliberately carries no studentId or any identity field — only enough for
// M12 to perform its own atomic consume against VoterRegistration.id. The
// schema's one-way anonymity membrane holds at the type level, not just the DB.
export type TokenValidationResult =
  | { valid: true; registrationId: string; electionId: string }
  | { valid: false; reason: 'NOT_FOUND' }
  | { valid: false; reason: 'EXPIRED' }
  | { valid: false; reason: 'ALREADY_USED' };