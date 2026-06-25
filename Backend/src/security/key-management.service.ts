import {
  createPrivateKey,
  createPublicKey,
  type KeyObject,
} from 'node:crypto';

const AES_256_KEY_LENGTH_BYTES = 32;

/**
 * Reads a required environment variable or throws immediately.
 *
 * This deliberately duplicates the spirit of requireEnv() from
 * config/index.ts rather than importing it. The generic config layer
 * should stay generic — strings, ports, URLs. The moment you bolt
 * "and also base64-decode this one and PEM-parse that one" onto the
 * shared config object, we've smuggled crypto-specific parsing into
 * infrastructure code every other module depends on. Security-critical
 * parsing stays colocated with its consumer.
 *
 *  VERIFY: check whether config/index.ts (M1) already reads
 * VOTE_ENCRYPTION_KEY. If it does, delete it there. One source of
 * truth per secret — two modules silently reading and validating the
 * same env var differently is exactly the kind of thing that looks
 * fine until one of them is updated and the other isn't.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[key-management] Missing required environment variable: ${name}. ` +
        `Server cannot start without it.`,
    );
  }
  return value;
}

/**
 * Decodes and validates the AES-256-GCM vote encryption key.
 * Stored in .env as base64 — see "Why base64" below.
 */
function loadEncryptionKey(): Buffer {
  const base64Key = requireEnv('VOTE_ENCRYPTION_KEY');
  const keyBuffer = Buffer.from(base64Key, 'base64');

  if (keyBuffer.length !== AES_256_KEY_LENGTH_BYTES) {
    throw new Error(
      `[key-management] VOTE_ENCRYPTION_KEY must decode to exactly ` +
        `${AES_256_KEY_LENGTH_BYTES} bytes for AES-256-GCM. Got ${keyBuffer.length} ` +
        `bytes instead. Generate a fresh one with scripts/generate-keys.ts.`,
    );
  }

  return keyBuffer;
}

/**
 * Parses the RSA-2048 private key used to sign vote-ciphertext hashes.
 * Stored as base64-encoded PEM (not raw PEM) — see "Why base64-encode
 * the PEM" below. createPrivateKey() doubles as validation: a
 * malformed key throws here, at startup, not on the first vote cast.
 */
function loadSigningPrivateKey(): KeyObject {
  const base64Pem = requireEnv('VOTE_SIGNING_PRIVATE_KEY');
  const pem = Buffer.from(base64Pem, 'base64').toString('utf8');
  return createPrivateKey(pem);
}

function loadSigningPublicKey(): KeyObject {
  const base64Pem = requireEnv('VOTE_SIGNING_PUBLIC_KEY');
  const pem = Buffer.from(base64Pem, 'base64').toString('utf8');
  return createPublicKey(pem);
}

// ---------------------------------------------------------------------
// Module-load-time initialization — the same singleton pattern as
// src/database/client.ts in M2. Computed ONCE on first import, not per
// call. There's no valid "running but key is malformed" state, so do
// the work up front and crash loud, not lazily mid-request.
// ---------------------------------------------------------------------

const encryptionKey = loadEncryptionKey();
const signingPrivateKey = loadSigningPrivateKey();
const signingPublicKey = loadSigningPublicKey();

export function getVoteEncryptionKey(): Buffer {
  return encryptionKey;
}

export function getSigningPrivateKey(): KeyObject {
  return signingPrivateKey;
}

export function getSigningPublicKey(): KeyObject {
  return signingPublicKey;
}

/**
 * Current key/algorithm version, stamped onto every encrypted vote
 * (Vote.algorithmVersion). This is the seam you'd use for key rotation
 * later: tally logic would branch on this value to pick the right key.
 * Out of scope for v1 — documented as a known limitation alongside the
 * HSM note in your report.
 */
export const CURRENT_KEY_VERSION = 'AES-256-GCM-v1' as const;