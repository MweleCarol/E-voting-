// src/modules/votes/votes.service.ts

import { logger } from '@config/logger';
import { encryptVote } from '@security/encryption.service.js'; // ⚠️ path unconfirmed — same class of guess flagged throughout this project
import { signVoteCiphertext } from '@security/signature.service.js'; // ⚠️ path unconfirmed
import { generateVoteReceipt, verifyVoteReceipt } from '@security/receipt.service.js'; // ⚠️ path unconfirmed
import { prisma } from '@database/client.js';
import { validateAndConsumeToken } from '../ballots/ballots.service.js';
import {
  findApprovedCandidatesForElection,
  createVoteWithReceipt,
  findReceiptByCode,
} from './votes.repository.js';
import type { CastVoteInput, CastVoteResult, ReceiptVerificationResult } from './votes.types.js';
import type { Prisma } from '@generated/prisma/client';
import {
  DoubleVotingError,
  BallotNotFoundError,
  BallotExpiredError,
  NotFoundError,
} from '@shared/errors/errors.js';

import * as auditService from '../audit/audit.service.js';
import { SYSTEM_ANONYMIZED_ACTOR } from '../audit/audit.types.js';

// ─── INTERNAL ABORT SIGNAL ──────────────────────────────────────────────────
// Thrown, not returned, specifically to force prisma.$transaction's rollback
// — see design note above. Caught immediately outside the transaction and
// converted back into a normal CastVoteResult; never leaks past this file.
class CastAbort extends Error {
  constructor(public readonly domainError: Error) {
    super('cast-abort');
  }
}

async function validateSelections(
  electionId: string,
  selections: Record<string, string>,
  tx: Prisma.TransactionClient,
): Promise<{ valid: true } | { valid: false; positionId: string; reason: string }> {
  const positions = await findApprovedCandidatesForElection(electionId, tx);
  const approvedByPosition = new Map(
    positions.map((p) => [p.id, new Set(p.candidates.map((c) => c.id))]),
  );

  for (const [positionId, candidateId] of Object.entries(selections)) {
    const approved = approvedByPosition.get(positionId);
    if (!approved) {
      return { valid: false, positionId, reason: 'Position does not belong to this election' };
    }
    if (!approved.has(candidateId)) {
      return {
        valid: false,
        positionId,
        reason: 'Candidate is not an approved candidate for this position',
      };
    }
  }

  // Empty selections (full abstention) is legitimate under the partial-ballot
  // model — the loop simply never runs, valid: true falls through correctly.
  return { valid: true };
}

// ─── CAST ───────────────────────────────────────────────────────────────────
export async function castVote(input: CastVoteInput): Promise<CastVoteResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const tokenResult = await validateAndConsumeToken(input.token, tx);

      // ← this check was missing entirely — restored, narrows tokenResult
      // to the { valid: true } branch for everything below it
      if (!tokenResult.valid) {
        const domainError =
          tokenResult.reason === 'NOT_FOUND'
            ? new BallotNotFoundError()
            : tokenResult.reason === 'EXPIRED'
              ? new BallotExpiredError()
              : new DoubleVotingError('This ballot has already been used to cast a vote');
        throw new CastAbort(domainError);
      }

      const validation = await validateSelections(tokenResult.electionId, input.selections, tx);
      if (!validation.valid) {
        // ← this is the selections failure — a different error entirely,
        // not the token-rejection logic that was here before
        throw new CastAbort(
          new NotFoundError(
            `Position '${validation.positionId}' is not part of this election, or its candidate is not approved: ${validation.reason}`,
          ),
        );
      }

      const plaintext = JSON.stringify(input.selections);
      const encrypted = encryptVote(plaintext);
      const signature = signVoteCiphertext(encrypted.encryptedVote);

      const vote = await tx.vote.create({
        data: {
          ballotToken: input.token,
          encryptedVote: encrypted.encryptedVote,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          algorithmVersion: encrypted.algorithmVersion,
          signature,
        },
      });

      const receipt = generateVoteReceipt(vote.id);

      await tx.voteReceipt.create({
        data: {
          voteId: vote.id,
          receiptCode: receipt.receiptCode,
          salt: receipt.salt,
          createdAt: new Date(receipt.issuedAt),
        },
      });

      await auditService.appendAuditEvent(
        {
          actorId: SYSTEM_ANONYMIZED_ACTOR,
          eventType: 'VOTE_CAST',
          eventData: { electionId: tokenResult.electionId }, // deliberately nothing else — no selections, no receiptCode, no voteId
        },
        tx,
      );

      logger.info('vote.cast', { electionId: tokenResult.electionId }); // now valid — tokenResult is narrowed by this point

      return { receiptCode: receipt.receiptCode, castAt: receipt.issuedAt };
    });
  } catch (err) {
    if (err instanceof CastAbort) throw err.domainError;
    throw err;
  }
}

// ─── VERIFY RECEIPT ─────────────────────────────────────────────────────────
export async function verifyReceipt(receiptCode: string): Promise<ReceiptVerificationResult> {
  const receipt = await findReceiptByCode(receiptCode);
  if (!receipt) return { verified: false };

  const valid = verifyVoteReceipt(
    receipt.voteId,
    receipt.createdAt.toISOString(),
    receipt.salt,
    receiptCode,
  );
  if (!valid) return { verified: false };

  return { verified: true, castAt: receipt.createdAt.toISOString() };
}
