// src/modules/audit/audit.service.ts

import { logger } from '@config/logger';
import { computeChainHash } from '@security/hashing.service.js';
import { appendAuditEvent as dbAppendAuditEvent, findAllEntriesInOrder, listAuditLogs as dbListAuditLogs } from './audit.repository.js';
import { GENESIS_HASH, type AppendAuditEventInput, type ChainVerificationResult, type ListAuditLogQuery } from './audit.types.js';
import { Prisma } from '@prisma/client/scripts/default-index.js';

// ─── APPEND ─────────────────────────────────────────────────────────────────
export async function appendAuditEvent(input: AppendAuditEventInput, tx?: Prisma.TransactionClient) {
  const entry = await dbAppendAuditEvent(input, tx);
  logger.info('audit.appended', { eventType: input.eventType, auditLogId: entry.id });
  return entry;
}

// ─── LIST ───────────────────────────────────────────────────────────────────
export async function listAuditLogs(query: ListAuditLogQuery) {
  return dbListAuditLogs(query);
}

// ─── VERIFY CHAIN INTEGRITY ─────────────────────────────────────────────────
// Recomputes each entry's hash INDEPENDENTLY from its own actorId/eventType/
// eventData, and checks that against the NEXT entry's stored previousHash —
// not against the current entry's own stored currentHash. This is what
// actually catches a two-row-consistent tamper (see design note above);
// checking only "does my hash match my own recomputation" would miss it.
export async function verifyChainIntegrity(): Promise<ChainVerificationResult> {
  const entries = await findAllEntriesInOrder();

  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenAtId: entry.id,
        entriesChecked: i,
        reason: `Entry references previousHash '${entry.previousHash}', but the chain expected '${expectedPreviousHash}' at this position.`,
      };
    }

    const recomputed = computeChainHash(
      { actorId: entry.actorId, eventType: entry.eventType, eventData: entry.eventData as Record<string, unknown> },
      entry.previousHash,
    );

    if (recomputed !== entry.currentHash) {
      return {
        valid: false,
        brokenAtId: entry.id,
        entriesChecked: i,
        reason: `Stored currentHash does not match a fresh recomputation from this entry's own fields — content has been altered.`,
      };
    }

    expectedPreviousHash = entry.currentHash;
  }

  return { valid: true, entriesChecked: entries.length };
}