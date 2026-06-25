import { prisma } from '@database/client';

// ---------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------

/**
 * Returns null on no match — NEVER throws "not found". The service
 * layer must return the exact same generic response whether the
 * admission number doesn't exist, the email doesn't match, or the
 * account is already ACTIVE. A thrown error here would force the
 * service to distinguish those cases, which is precisely what the
 * anti-enumeration design forbids exposing.
 */
export async function findPendingUserByAdmissionAndEmail(
  admissionNumber: string,
  email: string,
): Promise<{ id: string } | null> {
  return prisma.user.findFirst({
    where: {
      email,
      status: 'PENDING_ACTIVATION',
      student: { admissionNo: admissionNumber },
    },
    select: { id: true },
  });
}

export async function createActivationCode(
  userId: string,
  codeHash: string,
  expiresAt: Date,
): Promise<void> {
  await prisma.accountActivation.create({
    data: { userId, codeHash, expiresAt },
  });
}

/**
 * "Most recent" matters: a student might request a code twice (the
 * first email was slow). Only the newest should ever verify
 * successfully — older ones simply age out via their own expiresAt
 * rather than needing an explicit "invalidate previous codes" write
 * every time a new one is issued. Simpler write path, same security
 * property.
 */
export async function findValidActivationCode(
  userId: string,
): Promise<{ id: string; codeHash: string } | null> {
  return prisma.accountActivation.findFirst({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, codeHash: true },
  });
}

/**
 * Atomic: marks the code used AND activates the user together. The
 * array form of $transaction (not the interactive callback form) is
 * sufficient because neither write depends on reading the other's
 * result — they're two independent updates that must succeed or fail
 * as one unit. There is no reachable state where a code is consumed
 * but the account stays PENDING_ACTIVATION, or vice versa.
 */
export async function consumeActivationCodeAndActivateUser(
  activationId: string,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.accountActivation.update({
      where: { id: activationId },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', passwordHash },
    }),
  ]);
}

// ---------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------

/**
 * Matches email OR admission number, restricted to ACTIVE only.
 * PENDING_ACTIVATION accounts have no real passwordHash to compare
 * against yet; SUSPENDED ones might still have a valid old one and
 * must be rejected regardless of password correctness.
 */
export async function findActiveUserByIdentifier(
  identifier: string,
): Promise<{ id: string; passwordHash: string; roleId: string } | null> {
  return prisma.user.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [{ email: identifier }, { student: { admissionNo: identifier } }],
    },
    select: { id: true, passwordHash: true, roleId: true },
  });
}

export async function findTotpSecretByUserId(
  userId: string,
): Promise<{ secret: string; verified: boolean } | null> {
  return prisma.totpSecret.findUnique({
    where: { userId },
    select: { secret: true, verified: true },
  });
}

export async function findPendingUserByAdmissionNumber(
  admissionNumber: string,
): Promise<{ id: string } | null> {
  return prisma.user.findFirst({
    where: { status: 'PENDING_ACTIVATION', student: { admissionNo: admissionNumber } },
    select: { id: true },
  });
}

// auth.repository.ts
export async function findUserById(
  userId: string,
): Promise<{ email: string; roleId: string } | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, roleId: true },
  });
}

// ---------------------------------------------------------------------
// Refresh token lifecycle — opaque + hashed, per the correction above
// ---------------------------------------------------------------------

export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await prisma.refreshToken.create({
    data: { userId, token: tokenHash, expiresAt },
  });
}

/**
 * "Valid" — not revoked, not expired — is encoded directly in the
 * query, same style as findValidActivationCode above. The service
 * layer never separately checks revokedAt/expiresAt; if this returns
 * null, the token is invalid for some reason, and per the
 * anti-enumeration principle, the caller shouldn't be told which one.
 */
export async function findValidRefreshTokenByHash(
  tokenHash: string,
): Promise<{ id: string; userId: string } | null> {
  return prisma.refreshToken.findFirst({
    where: { token: tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, userId: true },
  });
}

export async function revokeRefreshToken(tokenRowId: string): Promise<void> {
  await prisma.refreshToken.update({
    where: { id: tokenRowId },
    data: { revokedAt: new Date() },
  });
}

// ---------------------------------------------------------------------
// TOTP enrollment
// ---------------------------------------------------------------------

/**
 * upsert, not create: a user re-running /totp/setup (lost their
 * authenticator app before ever confirming) overwrites the previous
 * unconfirmed secret rather than colliding on the unique userId
 * constraint. verified is force-reset to false on every upsert — an
 * existing secret can never be silently "renewed" into confirmed
 * status; it must pass through /totp/confirm again, every time.
 */
export async function upsertTotpSecret(
  userId: string,
  secret: string,
): Promise<void> {
  await prisma.totpSecret.upsert({
    where: { userId },
    create: { userId, secret, verified: false },
    update: { secret, verified: false },
  });
}

export async function confirmTotpSecret(userId: string): Promise<void> {
  await prisma.totpSecret.update({
    where: { userId },
    data: { verified: true },
  });
}


