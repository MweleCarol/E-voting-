// src/modules/votes/votes.repository.ts

import { prisma } from '@database/client.js';
import type { Prisma } from '@generated/prisma/client';

// ─── SELECTION VALIDATION SOURCE DATA ───────────────────────────────────────
export async function findApprovedCandidatesForElection(
  electionId: string,
  tx: Prisma.TransactionClient,
) {
  return tx.electionPosition.findMany({
    where: { electionId },
    select: {
      id: true,
      candidates: { where: { status: 'APPROVED' }, select: { id: true } },
    },
  });
}

// ─── CAST — Vote + VoteReceipt, same transaction as the ballot consume ─────
export async function createVoteWithReceipt(
  input: {
    ballotToken: string;
    encryptedVote: string;
    iv: string;
    authTag: string;
    algorithmVersion: string;
    signature: string;
    receiptCode: string;
    salt: string;
    issuedAt: Date;
  },
  tx: Prisma.TransactionClient,
) {
  const vote = await tx.vote.create({
    data: {
      ballotToken: input.ballotToken,
      encryptedVote: input.encryptedVote,
      iv: input.iv,
      authTag: input.authTag,
      algorithmVersion: input.algorithmVersion,
      signature: input.signature,
      createdAt: input.issuedAt, // pinned to the receipt's own issuedAt — see service note
    },
  });

  await tx.voteReceipt.create({
    data: {
      voteId: vote.id,
      receiptCode: input.receiptCode,
      salt: input.salt,
      createdAt: input.issuedAt,
    },
  });

  return vote;
}

// ─── RECEIPT VERIFICATION ───────────────────────────────────────────────────
export async function findReceiptByCode(receiptCode: string) {
  return prisma.voteReceipt.findUnique({ where: { receiptCode } });
}