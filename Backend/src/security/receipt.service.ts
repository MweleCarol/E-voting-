import { timingSafeEqual } from 'node:crypto';
import { sha256, generateSalt ,timingSafeHexEqual} from './hashing.service.js';

/**
 * What gets persisted to the VoteReceipt table. Only `receiptCode` is
 * ever shown to the voter — `salt` and `issuedAt` stay server-side and
 * are looked up again later to re-verify a submitted receiptCode.
 * Giving the voter the salt would make this exactly as forgeable as
 * not having one at all, since anyone who knows voteId + issuedAt + salt
 * can recompute the same hash.
 */
export interface VoteReceiptPayload {
  receiptCode: string;
  salt: string;
  issuedAt: string;
}

/**
 * Generates a tamper-evident, privacy-preserving receipt for a cast
 * vote: SHA-256(voteId + issuedAt + salt).
 *
 * Notice what is deliberately NOT in this hash: the vote's content —
 * which candidate was selected. That omission is the entire privacy
 * guarantee of this file. A receipt proves "vote with this ID was
 * recorded at this time" — it proves INCLUSION, never CHOICE. If this
 * hash ever included candidateId, the receipt would become a
 * vote-selling instrument: a voter could prove to a third party
 * exactly who they voted for, which is precisely what your threat
 * model (identity-vote separation) exists to prevent.
 */
export function generateVoteReceipt(voteId: string): VoteReceiptPayload {
  const salt = generateSalt();
  const issuedAt = new Date().toISOString();
  const receiptCode = sha256(voteId + issuedAt + salt);

  return { receiptCode, salt, issuedAt };
}

/**
 * Re-derives the expected receipt code from stored (voteId, issuedAt,
 * salt) and checks it against what the voter submitted, using a
 * constant-time comparison.
 *
 * Why constant-time matters here specifically: a naive `===` on two
 * strings short-circuits at the first mismatched character. An
 * attacker submitting many guessed receiptCodes against this endpoint
 * could, in principle, measure how long each comparison takes to infer
 * how many leading characters they got right, byte by byte — a
 * timing side-channel. timingSafeEqual() always takes the same amount
 * of time regardless of where (or whether) the buffers differ. This
 * should be your default for ANY comparison of a value meant to prove
 * authenticity — not something you reach for only after deciding a
 * specific case feels risky enough to deserve it.
 */
export function verifyVoteReceipt(
  voteId: string,
  issuedAt: string,
  salt: string,
  submittedReceiptCode: string,
): boolean {
  const expected = sha256(voteId + issuedAt + salt);
  return timingSafeHexEqual(expected, submittedReceiptCode);
}

/**
 * timingSafeEqual() throws if the two buffers differ in length, rather
 * than returning false — an exception is the wrong signal here (this
 * is an expected, common outcome: any malformed or wrong-length
 * submitted code should just fail verification cleanly), so the
 * length check is handled explicitly before calling it.
 */
