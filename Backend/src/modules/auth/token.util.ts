import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import {config} from "@config/index"
import { AuthenticationError } from '@shared/errors';
import type {
  AccessTokenPayload,

  MfaPendingTokenPayload,
  JwtPayload,
} from './auth.types';
import { randomBytes } from 'node:crypto';
import { sha256 } from '@security/hashing.service';

const REFRESH_TOKEN_BYTE_LENGTH = 32; // 256 bits — same entropy standard as the AES key in key-management.service.ts


/**
 * Single internal signing helper — every token type funnels through
 * here so there's exactly one place that calls jwt.sign, instead of
 * three near-identical call sites that could quietly drift apart.
 */
function signToken(payload: JwtPayload, secret: Secret, expiresIn: string): string {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}



/**
 * Single internal verification helper. Two distinct failure modes
 * collapse into the same generic AuthenticationError on purpose:
 *
 *  1. jwt.verify() itself throws — covers expired, malformed, AND
 *     signature-mismatched tokens (TokenExpiredError, JsonWebTokenError,
 *     NotBeforeError all land here).
 *  2. jwt.verify() succeeds but `purpose` doesn't match what THIS
 *     caller expects.
 *
 * Note that case 2 is NOT something jwt.verify() can ever catch for
 * you — the JWT spec validates signature, expiry, and a few standard
 * claims (exp, nbf, iat). It has no concept of "purpose"; that's
 * YOUR application-level semantics layered on top. A perfectly valid,
 * correctly-signed, non-expired token can still be the WRONG kind of
 * token for this call site — that's exactly the mfa_pending-token-
 * presented-as-an-access-token scenario the whole design exists to
 * prevent, and it's why this explicit check can't be skipped just
 * because jwt.verify() already "validated" the token.
 *
 * Both failure modes return the same generic message deliberately —
 * same principle as login's generic "Invalid credentials": telling a
 * caller WHICH specific way their token failed (expired vs tampered
 * vs wrong purpose) hands an attacker calibration information for
 * free. They don't need to know which; they just need it rejected.
 */
function verifyToken<T extends JwtPayload>(
  token: string,
  secret: Secret,
  expectedPurpose: T['purpose'],
): T {
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new AuthenticationError('Invalid or expired token.');
  }

  if (typeof decoded === 'string' || decoded.purpose !== expectedPurpose) {
    throw new AuthenticationError('Invalid or expired token.');
  }

  return decoded as T;
}

// ---------------------------------------------------------------------
// Access tokens — 15 minutes, stateless, no DB row backing them
// ---------------------------------------------------------------------

export function signAccessToken(userId: string, roleId: string): string {
  const payload: AccessTokenPayload = { purpose: 'access', userId, roleId };
  return signToken(payload, config.jwt.accessSecret, config.jwt.accessExpiresIn);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return verifyToken<AccessTokenPayload>(token, config.jwt.accessSecret, 'access');
}

/**
 * Generates the raw refresh token handed to the client. base64url —
 * not base64, not hex — because this value travels in an HTTP
 * response body and likely a cookie. Standard base64's `+`, `/`, `=`
 * characters need escaping in both contexts; base64url (RFC 4648 §5)
 * replaces them with `-`, `_`, and drops padding specifically so
 * tokens like this one never need escaping anywhere they're used.
 * Compare: hashing.service.ts used hex for the receipt code (also
 * URL-bound, but as a query param specifically, where any base64
 * variant's case-sensitivity is less of a concern than here); the
 * AES key uses standard base64 (file/DB storage only, never URL-bound
 * at all). Three different encodings, three different destinations —
 * same underlying question each time: where does this value actually
 * travel, and which encoding is cheapest THERE.
 */
export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTE_LENGTH).toString('base64url');
}

/**
 * What actually gets stored in RefreshToken.token. Never the raw
 * value — same principle as never storing a raw password or raw OTP.
 * A stolen hash is useless to present back to the server; a stolen
 * raw token is a live session.
 */
export function hashRefreshToken(rawToken: string): string {
  return sha256(rawToken);
}

export function signMfaPendingToken(userId: string): string {
  const payload: MfaPendingTokenPayload = { purpose: 'mfa_pending', userId };
  return signToken(payload, config.jwt.accessSecret, config.jwt.mfaPendingExpiresIn);
}

export function verifyMfaPendingToken(token: string): MfaPendingTokenPayload {
  return verifyToken<MfaPendingTokenPayload>(token, config.jwt.accessSecret, 'mfa_pending');
}