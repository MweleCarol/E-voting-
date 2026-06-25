import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import { CryptographicError } from '@shared/errors';
import {
  getVoteEncryptionKey,
  CURRENT_KEY_VERSION,
} from './key-management.service.js';

const ALGORITHM = 'aes-256-gcm' as const;
const GCM_IV_LENGTH_BYTES = 12; // NIST SP 800-38D recommended length for GCM — never make this configurable
const GCM_AUTH_TAG_LENGTH_BYTES = 16; // 128-bit auth tag, the GCM standard

/**
 * Shape of an encrypted vote, mirroring the Vote model's columns
 * exactly: encryptedVote, iv, authTag, algorithmVersion. This is the
 * single source of truth for that shape — voting.service.ts (M12)
 * imports this type rather than redefining it.
 */
export interface EncryptedVotePayload {
  encryptedVote: string;
  iv: string;
  authTag: string;
  algorithmVersion: string;
}

/**
 * Encrypts a plaintext vote using AES-256-GCM.
 *
 * What "plaintext" actually contains (e.g. a JSON string of which
 * candidate was selected for which position) is deliberately none of
 * this function's business — that's a decision the voting module
 * makes. This function's only job is: take a string, return ciphertext
 * + the metadata needed to reverse it later. Keeping it generic like
 * this is what makes it reusable and testable in isolation.
 */
export function encryptVote(plaintext: string): EncryptedVotePayload {
  const key = getVoteEncryptionKey();
  const iv = randomBytes(GCM_IV_LENGTH_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: GCM_AUTH_TAG_LENGTH_BYTES,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedVote: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithmVersion: CURRENT_KEY_VERSION,
  };
}

/**
 * Decrypts a vote and verifies it hasn't been tampered with.
 *
 * GCM is "authenticated encryption" — decryption and integrity
 * verification are the SAME operation, not two separate steps. If the
 * ciphertext, IV, or auth tag have been altered in any way since
 * encryption — by a bug, by a malicious DB admin, by disk corruption —
 * decipher.final() throws. That's not an edge case to handle, that's
 * the entire reason you chose GCM over a non-authenticated mode like
 * CBC. The catch block below isn't hiding a bug; it's where your
 * "vote tampering" threat mitigation actually fires.
 */
export function decryptVote(payload: EncryptedVotePayload): string {
  if (payload.algorithmVersion !== CURRENT_KEY_VERSION) {
    throw new CryptographicError(
      `Cannot decrypt vote: stored algorithm version "${payload.algorithmVersion}" ` +
        `does not match the currently loaded key version "${CURRENT_KEY_VERSION}". ` +
        `This vote may require a rotated key that isn't currently loaded.`,
    );
  }

  const key = getVoteEncryptionKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const ciphertext = Buffer.from(payload.encryptedVote, 'base64');

  if (iv.length !== GCM_IV_LENGTH_BYTES) {
    throw new CryptographicError(
      `Vote decryption failed: stored IV is ${iv.length} bytes, expected ${GCM_IV_LENGTH_BYTES}.`,
    );
  }
  if (authTag.length !== GCM_AUTH_TAG_LENGTH_BYTES) {
    throw new CryptographicError(
      `Vote decryption failed: stored auth tag is ${authTag.length} bytes, expected ${GCM_AUTH_TAG_LENGTH_BYTES}.`,
    );
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: GCM_AUTH_TAG_LENGTH_BYTES,
    });
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return plaintext.toString('utf8');
  } catch {
    // Deliberately swallow Node's raw crypto error. The only reason
    // decipher.final() throws here is failed GCM authentication —
    // i.e. someone or something altered this vote after encryption.
    // That's reported as a domain-level integrity event, not leaked
    // as a low-level crypto internals message.
    throw new CryptographicError(
      'Vote decryption failed integrity verification. The vote record may have been tampered with.',
    );
  }
}