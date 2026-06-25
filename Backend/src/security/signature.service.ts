import { sign as cryptoSign, verify as cryptoVerify, constants } from 'node:crypto';
import { CryptographicError } from '@shared/errors';
import {
  getSigningPrivateKey,
  getSigningPublicKey,
} from './key-management.service.js';

const SIGNATURE_DIGEST = 'sha256';

/**
 * Signs the stored ciphertext (Vote.encryptedVote), proving the
 * election authority's private key produced this exact value.
 *
 * Note: 'sha256' passed to crypto.sign() is the digest algorithm
 * Node hashes the input WITH internally, before RSA-signing the
 * digest. That is the entire "RSA-2048 signs SHA-256 hash of
 * ciphertext" requirement from the architecture doc — there is no
 * separate manual hashing step. Calling sha256() from
 * hashing.service.ts first and then signing THAT would double-hash
 * and produce a signature that verifies fine internally but is
 * needlessly nonstandard — any external tool checking your signature
 * against the raw ciphertext, the standard expectation, would fail.
 * Let crypto.sign do the one hash it's already designed to do.
 */
export function signVoteCiphertext(ciphertext: string): string {
  const privateKey = getSigningPrivateKey();
  const signature = cryptoSign(SIGNATURE_DIGEST, Buffer.from(ciphertext, 'utf8'), {
    key: privateKey,
    padding: constants.RSA_PKCS1_PADDING,
  });
  return signature.toString('base64');
}

/**
 * Verifies a vote's signature against its stored ciphertext.
 * Returns false for a bad signature — this is a normal, expected
 * outcome at tally time if tampering occurred, NOT an exceptional
 * code path, so it returns a boolean rather than throwing.
 * Only genuinely malformed input (corrupt base64, wrong-shaped
 * signature) throws CryptographicError — that IS a programmer/data
 * error, not a tampering verdict.
 */
export function verifyVoteSignature(
  ciphertext: string,
  signatureBase64: string,
): boolean {
  const publicKey = getSigningPublicKey();

  let signatureBuffer: Buffer;
  try {
    signatureBuffer = Buffer.from(signatureBase64, 'base64');
  } catch {
    throw new CryptographicError('Malformed signature: not valid base64.');
  }

  return cryptoVerify(
    SIGNATURE_DIGEST,
    Buffer.from(ciphertext, 'utf8'),
    { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
    signatureBuffer,
  );
}