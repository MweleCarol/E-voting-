// src/modules/candidates/candidates.repository.ts

import { prisma } from '@database/client.js';
import { Prisma, CandidateStatus } from '@generated/prisma/client';
import { ConflictError, NotFoundError } from '@shared/errors';
import type { CreateCandidacyInput, ListCandidatesQuery } from './candidates.types.js';

export async function createCandidacyWithApprovalRequest(input: {
  studentId: string;
  positionId: string;
  electionId: string;
  manifesto?: string;
  requestedBy: string; // the student's own User.id — see service for why
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const candidate = await tx.candidate.create({
        data: {
          studentId: input.studentId,
          positionId: input.positionId,
          manifesto: input.manifesto,
        },
      });

      const approvalRequest = await tx.approvalRequest.create({
        data: {
          actionType: 'CANDIDATE_APPROVE',
          requestedBy: input.requestedBy,
          electionId: input.electionId,
          payload: { candidateId: candidate.id },
        },
        select: { id: true },
      });

      return { candidate, approvalRequestId: approvalRequest.id };
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('You have already submitted a candidacy for this position');
    }
    throw err;
  }
}
// ─── FETCH FOR RESOLUTION (called via M8's dispatch, inside its transaction) ─
export async function findCandidacyForResolution(candidateId: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  return client.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, status: true, studentId: true, positionId: true },
  });
}

export async function updateCandidateStatus(
  candidateId: string,
  status: CandidateStatus,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return client.candidate.update({
    where: { id: candidateId },
    data: { status },
  });
}

// ─── WITHDRAW ───────────────────────────────────────────────────────────────
export async function findCandidacyForWithdrawal(candidateId: string) {
  return prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, studentId: true, status: true },
  });
}

export async function withdrawCandidacy(candidateId: string) {
  return prisma.candidate.update({
    where: { id: candidateId },
    data: { status: 'WITHDRAWN' },
  });
}

// ─── LIST ───────────────────────────────────────────────────────────────────
export async function listCandidates(query: ListCandidatesQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.CandidateWhereInput = {
    ...(query.positionId && { positionId: query.positionId }),
    ...(query.status && { status: query.status }),
    ...(query.electionId && { position: { electionId: query.electionId } }),
  };

  const [candidates, total] = await prisma.$transaction([
    prisma.candidate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.candidate.count({ where }),
  ]);

  return { candidates, total, page, pageSize };
}


// candidates.repository.ts — addition
export async function findCandidateById(candidateId: string) {
  return prisma.candidate.findUnique({ where: { id: candidateId } });
}

// candidates.service.ts — addition
export async function getCandidateById(candidateId: string) {
  const candidate = await findCandidateById(candidateId);
  if (!candidate) {
    throw new NotFoundError(`Candidate '${candidateId}' not found`);
  }
  return candidate;
}