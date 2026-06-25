import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '@config/index';
import { logger } from '@config/logger';
import { generateSecret, generateURI, generate, verify } from 'otplib';
import { AuthenticationError,NotFoundError } from '@shared/errors';
import { sha256, timingSafeHexEqual } from '@security/hashing.service';

import {
  signAccessToken,
  signMfaPendingToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyMfaPendingToken
} from './token.util.js';
import {
  findPendingUserByAdmissionAndEmail,
  findPendingUserByAdmissionNumber,
  createActivationCode,
  findValidActivationCode,
  consumeActivationCodeAndActivateUser,
  findActiveUserByIdentifier,
  findTotpSecretByUserId,
  createRefreshToken,
  upsertTotpSecret,
  confirmTotpSecret,
  findUserById,
  findValidRefreshTokenByHash,
  revokeRefreshToken,
} from './auth.repository.js';
import type {
  ActivationInitiateInput,
  ActivationVerifyInput,
  LoginInput,
  LoginResult,
  TokenPair,
  RefreshInput,
  LogoutInput,
  TotpSetupResult,
  TotpConfirmInput,
  TotpLoginInput,
} from './auth.types.js';


const ACTIVATION_CODE_LENGTH = 6;
const ACTIVATION_CODE_TTL_MINUTES = 10; // tunable in principle, hardcoded for now — not a crypto-mandated value like the GCM IV length, just not worth a config entry yet

/**
 * A REAL bcrypt hash (cost 12, matching BCRYPT_ROUNDS) for a password
 * nobody will ever enter. Used to keep login's response time roughly
 * constant whether the identifier matches a real account or not — see
 * the explanation below this code block; this single constant is the
 * entire fix for a real timing side-channel. Regenerate this if
 * BCRYPT_ROUNDS ever changes in .env, or the cost factors drift apart
 * and the timing match degrades.
 */
const DUMMY_PASSWORD_HASH = '$2b$12$r.AKzDvo9HJLXPyfqOI8au2NR60biX.D8JHUVEJ5d2Q9951T.u.D6';

function generateNumericOtp(): string {
  const max = 10 ** ACTIVATION_CODE_LENGTH;
  return randomInt(0, max).toString().padStart(ACTIVATION_CODE_LENGTH, '0');
}

/**
 * Minimal duration parser for the JWT-style "7d" / "15m" strings
 * already in .env. NOT a general utility, NOT pulling in a dependency
 * for one regex's worth of logic. It exists ONLY because refresh
 * tokens are no longer JWTs (per the correction earlier this
 * milestone) and therefore need their expiresAt computed by hand for
 * the database row — jsonwebtoken still parses these same strings
 * internally for the access token, entirely separately. Two systems
 * independently interpreting "7d" is a duplicated CONCEPT, not
 * duplicated code worth merging.
 */
function parseDurationToMs(duration: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Expected e.g. "7d", "15m".`);
  }
  const value = Number(match[1]);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * unitMs[match[2]];
}

/**
 * Shared by login (pass 1) and the TOTP-login step (pass 2) — both
 * end at the same place: a real, authenticated session.
 */
export async function issueTokenPair(userId: string, roleId: string): Promise<TokenPair> {
  const accessToken = signAccessToken(userId, roleId);

  const rawRefreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + parseDurationToMs(config.jwt.refreshExpiresIn));

  await createRefreshToken(userId, refreshTokenHash, expiresAt);

  return { accessToken, refreshToken: rawRefreshToken };
}

// ---------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------

export async function initiateActivation(input: ActivationInitiateInput): Promise<void> {
  const user = await findPendingUserByAdmissionAndEmail(input.admissionNumber, input.schoolEmail);

  // No match → do nothing, but DON'T tell the caller that. The
  // controller returns the identical generic message either way.
  if (!user) {
    return;
  }

  const otp = generateNumericOtp();
  const codeHash = sha256(otp);
  const expiresAt = new Date(Date.now() + ACTIVATION_CODE_TTL_MINUTES * 60_000);

  await createActivationCode(user.id, codeHash, expiresAt);

  // TODO: replace with real email delivery. No notifications
  // capability exists yet anywhere in the milestone roadmap — this is
  // a genuine gap worth flagging in your report, not something to
  // silently build around. Logged at `info`, not `security`/`audit`,
  // since this is an operational delivery event, not itself a
  // security-relevant action.
  logger.info(`[DEV ONLY] Activation OTP for ${input.schoolEmail}: ${otp}`);
}

export async function verifyActivation(input: ActivationVerifyInput): Promise<void> {
  const user = await findPendingUserByAdmissionNumber(input.admissionNumber);
  if (!user) {
    throw new AuthenticationError('Invalid or expired activation code.');
  }

  const activation = await findValidActivationCode(user.id);
  if (!activation) {
    throw new AuthenticationError('Invalid or expired activation code.');
  }

  const submittedHash = sha256(input.otp);
  if (!timingSafeHexEqual(activation.codeHash, submittedHash)) {
    throw new AuthenticationError('Invalid or expired activation code.');
  }

  const passwordHash = await bcrypt.hash(input.password, config.security.bcryptRounds);
  await consumeActivationCodeAndActivateUser(activation.id, user.id, passwordHash);
}

// ---------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await findActiveUserByIdentifier(input.identifier);

  /**
   * THE TIMING FIX: bcrypt.compare's cost is dominated by the bcrypt
   * work factor, NOT by whether the strings match — that's the whole
   * point of bcrypt. But if `user` is null, skipping the compare
   * entirely makes "unknown identifier" respond measurably FASTER
   * than "known identifier, wrong password." An attacker measuring
   * response times across many attempts could use that gap to
   * enumerate which identifiers are real accounts — defeating the
   * exact anti-enumeration goal the generic error message is
   * supposed to guarantee. Always running bcrypt.compare — against a
   * real password hash when one exists, against the dummy constant
   * otherwise — means the expensive work happens every time,
   * regardless of outcome.
   */
  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches) {
    throw new AuthenticationError('Invalid credentials.');
  }

  const totpSecret = await findTotpSecretByUserId(user.id);

  if (totpSecret?.verified) {
    const mfaToken = signMfaPendingToken(user.id);
    return { status: 'MFA_REQUIRED', mfaToken };
  }

  const tokens = await issueTokenPair(user.id, user.roleId);
  return { status: 'AUTHENTICATED', tokens };
}



// ---------------------------------------------------------------------
// TOTP enrollment
// ---------------------------------------------------------------------
/**
 * Allows the submitted code to be off by up to 1 time-step (30s) in
 * either direction. otplib 13 defaults to epochTolerance: 0 — exact
 * match only — which is RFC-compliant but unrealistically strict: a
 * phone's clock and this server's clock are never perfectly in sync,
 * and a real user would occasionally get locked out by a server that
 * insists on exact-second agreement. A small symmetric window is
 * standard practice for production TOTP implementations.
 */
const TOTP_EPOCH_TOLERANCE_STEPS = 1;


export async function setupTotp(userId: string): Promise<TotpSetupResult> {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const secret = generateSecret();
  await upsertTotpSecret(userId, secret);

  const otpAuthUrl = generateURI({
    issuer: config.security.totpIssuer,
    label: user.email,
    secret,
  });

  return { otpAuthUrl };
}

export async function confirmTotpSetup(userId: string, input: TotpConfirmInput): Promise<void> {
  const record = await findTotpSecretByUserId(userId);
  if (!record) {
    throw new NotFoundError('No pending TOTP setup found for this account.');
  }

  const result = await verify({
    secret: record.secret,
    token: input.code,
    epochTolerance: TOTP_EPOCH_TOLERANCE_STEPS,
  });
  if (!result.valid) {
    throw new AuthenticationError('Invalid TOTP code.');
  }

  await confirmTotpSecret(userId);
}

// ---------------------------------------------------------------------
// TOTP login step — completes what login() started
// ---------------------------------------------------------------------
export async function loginWithTotp(input: TotpLoginInput): Promise<TokenPair> {
  const { userId } = verifyMfaPendingToken(input.mfaToken);

  const totpRecord = await findTotpSecretByUserId(userId);
  if (!totpRecord?.verified) {
    throw new AuthenticationError('Invalid or expired session.');
  }

  const result = await verify({
    secret: totpRecord.secret,
    token: input.code,
    epochTolerance: TOTP_EPOCH_TOLERANCE_STEPS,
  });
  if (!result.valid) {
    throw new AuthenticationError('Invalid TOTP code.');
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new AuthenticationError('Invalid or expired session.');
  }

  return issueTokenPair(userId, user.roleId);
}

// ---------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------

export async function refreshSession(input: RefreshInput): Promise<TokenPair> {
  const tokenHash = hashRefreshToken(input.refreshToken);
  const existing = await findValidRefreshTokenByHash(tokenHash);
  if (!existing) {
    throw new AuthenticationError('Invalid or expired session.');
  }

  /**
   * Revoke BEFORE issuing the replacement — not after. If something
   * fails between these two lines (a DB blip on the create call), the
   * old token is already dead. Worst case: the user has to log in
   * again. The alternative ordering's worst case is far worse: an old
   * token that's still valid AND a new one that's also valid — two
   * live sessions where exactly one should exist. When an operation
   * can partially fail, order it so the failure leans toward "locked
   * out, try again" rather than "more access than intended."
   */
  await revokeRefreshToken(existing.id);

  const user = await findUserById(existing.userId);
  if (!user) {
    throw new AuthenticationError('Invalid or expired session.');
  }

  return issueTokenPair(existing.userId, user.roleId);
}

export async function logout(input: LogoutInput): Promise<void> {
  const tokenHash = hashRefreshToken(input.refreshToken);
  const existing = await findValidRefreshTokenByHash(tokenHash);

  // Already invalid, expired, or revoked — logout is idempotent;
  // there's no "more logged out" state to reach. Silently succeed
  // rather than erroring on a no-op.
  if (!existing) {
    return;
  }

  await revokeRefreshToken(existing.id);
}