// src/modules/ballots/ballots.repository.ts

import { randomUUID } from 'crypto';
import { prisma } from '@database/client.js';
import type { Prisma } from '@generated/prisma/client';

// ─── LOOKUP — used before deciding whether to issue or reuse ──────────────
export async function findRegistrationForToken(studentId: string, electionId: string) {
  return prisma.voterRegistration.findUnique({
    where: { studentId_electionId: { studentId, electionId } },
    select: { id: true, status: true, participated: true, activeBallotToken: true },
  });
}

// ─── LOOKUP — resolve a token to its Ballot row (expiry/used checks, and
// later, M12's token-validation path) ────────────────────────────────────
export async function findBallotByToken(token: string) {
  return prisma.ballot.findUnique({ where: { token } });
}

// ─── CLEAR — used when an outstanding token has expired, before reissuing ──
export async function clearActiveToken(registrationId: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  await client.voterRegistration.update({
    where: { id: registrationId },
    data: { activeBallotToken: null },
  });
}

// ─── ISSUE — atomic claim + create, in one transaction ─────────────────────
// Token generated here, in application code, specifically so the same value
// can be written to both VoterRegistration.activeBallotToken (the claim) and
// Ballot.token (the actual row) — see design note on why DB-default ordering
// doesn't work for this.
export async function issueBallot(
  registrationId: string,
  electionId: string,
  sessionDurationMinutes: number,
): Promise<{ token: string; issuedAt: Date; expiresAt: Date } | null> {
  const token = randomUUID();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + sessionDurationMinutes * 60_000);

  return prisma.$transaction(async (tx) => {
    const claim = await tx.voterRegistration.updateMany({
      where: { id: registrationId, activeBallotToken: null },
      data: { activeBallotToken: token },
    });

    if (claim.count === 0) {
      // Someone else claimed the slot between the service's read and this
      // write — genuine concurrent-request race, not an expected path.
      return null;
    }

    const ballot = await tx.ballot.create({
      data: { electionId, token, expiresAt },
      select: { token: true, issuedAt: true, expiresAt: true },
    });

    return ballot;
  });
}

// ballots.repository.ts — addition

export async function consumeBallotToken(token: string, tx: Prisma.TransactionClient) {
  const ballot = await tx.ballot.findUnique({ where: { token } });
  if (!ballot) return { outcome: 'not_found' as const };
  if (ballot.used) return { outcome: 'already_used' as const };
  if (ballot.expiresAt < new Date()) return { outcome: 'expired' as const };

  const registration = await tx.voterRegistration.findFirst({
    where: { activeBallotToken: token },
    select: { id: true, electionId: true },
  });
  if (!registration) {
    // Ballot exists but no registration currently points to it as active —
    // a genuine inconsistency, not a normal path. Report as not_found
    // rather than throw: the caller's job is to reject the token cleanly,
    // not to diagnose why the pointer's missing.
    return { outcome: 'not_found' as const };
  }

  // Atomic claim on Ballot.used itself — the same conditional-updateMany
  // pattern as every prior race guard, now protecting the actual cast,
  // not just the issuance.
  const claim = await tx.ballot.updateMany({
    where: { token, used: false },
    data: { used: true },
  });
  if (claim.count === 0) {
    return { outcome: 'already_used' as const }; // lost a genuine concurrent double-cast race
  }

  await tx.voterRegistration.update({
    where: { id: registration.id },
    data: { participated: true, activeBallotToken: null },
  });

  return { outcome: 'valid' as const, registrationId: registration.id, electionId: registration.electionId };
}