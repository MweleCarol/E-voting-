// src/modules/approvals/approvals.repository.ts

import { prisma } from '@database/client.js';
import { ConflictError } from '@shared/errors/errors.js';
// Regular import — these three double as runtime values (ApprovalDecision.APPROVE, etc.)
// AND as types. import type here would silently strip the runtime half, same bug as Prisma.
import {
  Prisma,
  ApprovalActionType,
  ApprovalDecision,
  ApprovalStatus,
} from '@generated/prisma/client';

// Pure types — these are never referenced as runtime values, so import type is correct
// and keeps them erased at compile time as intended.

import type {
  CastApprovalInput,
  ListApprovalRequestsQuery,
  ApprovalRequestWithTally,
} from './approvals.types.js';

// ─── MINIMAL FETCH — used before casting a vote ────────────────────────────
// Deliberately narrow select. The service needs status + requestedBy +
// actionType to decide eligibility; it does not need the approvals array.
export async function findRequestForVoting(requestId: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  return client.approvalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      requestedBy: true,
      actionType: true,
      electionId: true,
      payload: true,
      createdAt: true,
      resolvedAt: true,
    },
  });
}

// ─── CAST A VOTE ────────────────────────────────────────────────────────────
// Relies on @@unique([requestId, officerId]) to make double-voting
// structurally impossible. No pre-check SELECT — insert directly, catch
// P2002. This avoids a check-then-insert race between two officers voting
// at nearly the same moment, which is the realistic case here, not an edge case.
export async function castApproval(input: CastApprovalInput) {
  try {
    return await prisma.approval.create({
      data: {
        requestId: input.requestId,
        officerId: input.officerId,
        decision: input.decision,
        comment: input.comment,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('You have already cast a decision on this approval request');
    }
    throw err;
  }
}

// ─── TALLY — single grouped query, not two separate counts ────────────────
export async function getTally(
  requestId: string,
): Promise<{ approveCount: number; rejectCount: number }> {
  const grouped = await prisma.approval.groupBy({
    by: ['decision'],
    where: { requestId },
    _count: { decision: true },
  });

  const approveCount = grouped.find((g) => g.decision === 'APPROVE')?._count.decision ?? 0;
  const rejectCount = grouped.find((g) => g.decision === 'REJECT')?._count.decision ?? 0;

  return { approveCount, rejectCount };
}

// ─── RESOLVE — records the decision, does not compute it ──────────────────
export async function resolveRequest(requestId: string, status: ApprovalStatus, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  return client.approvalRequest.update({
    where: { id: requestId },
    data: { status, resolvedAt: new Date() },
  });
}

// ─── GET BY ID (full detail, post-resolution or for display) ──────────────
export async function findRequestWithTally(
  requestId: string,
): Promise<ApprovalRequestWithTally | null> {
  const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });

  if (!request) return null;

  const { approveCount, rejectCount } = await getTally(requestId);

  return { ...request, approveCount, rejectCount };
}

// ─── LIST — thin summary, same list/detail split M7 used ──────────────────
export async function listApprovalRequests(query: ListApprovalRequestsQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.ApprovalRequestWhereInput = {
    ...(query.status && { status: query.status }),
    ...(query.actionType && { actionType: query.actionType }),
  };

  const [requests, total] = await prisma.$transaction([
    prisma.approvalRequest.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { approvals: true } } },
    }),
    prisma.approvalRequest.count({ where }),
  ]);

  return { requests, total, page, pageSize };
}
