// src/modules/audit/audit.repository.ts

import { prisma } from '@database/client.js';
import { computeChainHash } from '@security/hashing.service.js'; // ⚠️ path unconfirmed
import type { Prisma } from '@generated/prisma/client';
import { GENESIS_HASH, type AppendAuditEventInput, type ListAuditLogQuery } from './audit.types.js';

// ─── ADVISORY LOCK KEY ───────────────────────────────────────────────────────
// Fixed literal, not derived at runtime — every caller must reference this
// exact same constant, or the serialization guarantee silently breaks.
// Arbitrary but documented; no collision-avoidance computation needed since
// it's hardcoded once, here, and nowhere else.
const AUDIT_CHAIN_LOCK_KEY = 918_273_645_102_938n;

// ─── APPEND — the only write path into this table ──────────────────────────
// audit.repository.ts — appendAuditEvent revised

export async function appendAuditEvent(input: AppendAuditEventInput, tx?: Prisma.TransactionClient) {
  const run = async (client: Prisma.TransactionClient) => {
    await client.$executeRaw`SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_KEY})`;
    const last = await client.auditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { currentHash: true } });
    const previousHash = last?.currentHash ?? GENESIS_HASH;
    const chainedPayload = { actorId: input.actorId, eventType: input.eventType, eventData: input.eventData };
    const currentHash = computeChainHash(chainedPayload, previousHash);
    return client.auditLog.create({
      data: { actorId: input.actorId, eventType: input.eventType, eventData: input.eventData as Prisma.InputJsonValue, previousHash, currentHash },
    });
  };

  return tx ? run(tx) : prisma.$transaction(run);
}

// ─── SEQUENTIAL READ — for chain verification (service walks and recomputes) ─
export async function findAllEntriesInOrder() {
  return prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } });
}

// ─── LIST (paginated, filterable) ───────────────────────────────────────────
export async function listAuditLogs(query: ListAuditLogQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.AuditLogWhereInput = {
    ...(query.eventType && { eventType: query.eventType }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize };
}