import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Computes a SHA-256 hash of a UTF-8 string and returns it as a hex string.
 *
 * This is the single low-level primitive that everything else in the
 * security module builds on: the audit hash chain, vote receipts, and
 * the pre-signature digest all reduce to a call to this function.
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Deterministically serializes a JS object to JSON.
 *
 * Why this exists instead of plain JSON.stringify:
 * JSON.stringify preserves insertion order, not alphabetical order.
 * Two objects with identical data but fields constructed in a different
 * order produce DIFFERENT strings — and therefore different hashes.
 * For a tamper-evident audit chain, that's catastrophic: a legitimate
 * verification check could fail not because data was tampered with,
 * but because some other developer (or future you) built the event
 * object with `{ userId, action }` instead of `{ action, userId }`.
 *
 * Sorting keys recursively removes that footgun.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>).sort();
    const sorted: Record<string, unknown> = {};
    for (const key of entries) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalStringify(value: Record<string, unknown>): string {
  return JSON.stringify(canonicalize(value));
}

/**
 * Computes the next link in a SHA-256 hash chain.
 *
 *   chainHash = SHA256(canonicalEventJSON + previousHash)
 *
 * This is the exact mechanism your audit log (M13) will use: every log
 * entry's hash incorporates the previous entry's hash, so altering or
 * deleting any entry breaks every hash after it. The chain is what
 * makes the log tamper-EVIDENT (you can prove it was changed) as
 * opposed to tamper-PROOF (you can prevent it being changed) — those
 * are different guarantees and you should be precise about which one
 * you're claiming in your report.
 */
export function computeChainHash(
  eventData: Record<string, unknown>,
  previousHash: string,
): string {
  return sha256(canonicalStringify(eventData) + previousHash);
}

/**
 * Generates a cryptographically secure random salt, hex-encoded.
 * Used by receipt.service.ts so two voters who happen to vote for the
 * same candidate at the same millisecond still get unlinkable receipts.
 */
export function generateSalt(byteLength = 16): string {
  return randomBytes(byteLength).toString('hex');
}




export function timingSafeHexEqual(hexA: string, hexB: string): boolean {
  const bufA = Buffer.from(hexA, 'hex');
  const bufB = Buffer.from(hexB, 'hex');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}