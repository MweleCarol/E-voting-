// src/modules/votes/votes.types.ts

// ─── PLAINTEXT BALLOT STRUCTURE (before encryption) ─────────────────────────
// One JSON object per cast vote, covering every contested position at once —
// the whole-ballot model. positionId -> candidateId.
export type BallotSelections = Record<string, string>;

// ─── INPUT ──────────────────────────────────────────────────────────────────
export interface CastVoteInput {
  token: string;
  selections: BallotSelections;
}

// ─── RESULT ─────────────────────────────────────────────────────────────────
// Covers token-validation failures inline, not just success — the
// controller needs to distinguish "expired" from "already voted" from
// "never valid" for the student, same reasoning as EligibilityResult (M9)
// and TokenValidationResult (M11) before it.
// votes.types.ts — CastVoteResult simplifies
export interface CastVoteResult {
  receiptCode: string;
  castAt: string;
}

// ─── RECEIPT VERIFICATION ───────────────────────────────────────────────────
export interface VerifyReceiptInput {
  receiptCode: string;
}

export type ReceiptVerificationResult =
  | { verified: true; castAt: string }
  | { verified: false };