// src/modules/verification/verification.repository.ts

import { prisma } from '@database/client.js';
import { Prisma, RegistrationStatus } from '@generated/prisma/client';
import { ConflictError } from '@shared/errors';
import type { RegisterForElectionInput, ListRegistrationsQuery } from './verification.types.js';

// ─── ELIGIBILITY — the method M11 will call via the service's isEligible() ──
// Single query, minimal select. All three facts isEligible() needs
// (exists, status, participated) come back together, no separate reads.
export async function findRegistrationForEligibility(studentId: string, electionId: string) {
  return prisma.voterRegistration.findUnique({
    where: { studentId_electionId: { studentId, electionId } },
    select: { id: true, status: true, participated: true },
  });
}

// ─── CREATE ─────────────────────────────────────────────────────────────────
// Relies on @@unique([studentId, electionId]) — insert directly, catch P2002.
// Same reasoning as M8's castApproval: no check-then-insert race.
export async function createRegistration(input: RegisterForElectionInput) {
  try {
    return await prisma.voterRegistration.create({
      data: {
        studentId: input.studentId,
        electionId: input.electionId,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('You have already registered for this election');
    }
    throw err;
  }
}

// ─── FETCH FOR RESOLUTION (approve/reject) ─────────────────────────────────
// Includes the nested student.userId — needed for the self-verification
// check: comparing the officer's own User.id against the *student's* linked
// User.id, not against Student.id (a different primary key entirely).
export async function findRegistrationForResolution(registrationId: string) {
  return prisma.voterRegistration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      status: true,
      electionId: true,
      student: {
        select: { id: true, userId: true },
      },
    },
  });
}

export async function resolveRegistration(
  registrationId: string,
  status: RegistrationStatus,
  officerId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return client.voterRegistration.update({
    where: { id: registrationId },
    data: { status, verifiedBy: officerId, verifiedAt: new Date() },
  });
}

// ─── STATUS QUERY (student checking their own registration) ───────────────
export async function findRegistrationByStudentAndElection(studentId: string, electionId: string) {
  return prisma.voterRegistration.findUnique({
    where: { studentId_electionId: { studentId, electionId } },
  });
}

// ─── LIST (officer view, filterable by status) ─────────────────────────────
export async function listRegistrations(query: ListRegistrationsQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.VoterRegistrationWhereInput = {
    electionId: query.electionId,
    ...(query.status && { status: query.status }),
  };

  const [registrations, total] = await prisma.$transaction([
    prisma.voterRegistration.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.voterRegistration.count({ where }),
  ]);

  return { registrations, total, page, pageSize };
}
