// src/modules/audit/audit.controller.ts

import type { Request, Response } from 'express';
import { sendSuccess } from '@shared/helpers/response.helper.js';
import { listAuditLogs, verifyChainIntegrity } from './audit.service.js';
import type { ListAuditLogQuery } from './audit.types.js';

// ─── LIST ───────────────────────────────────────────────────────────────────
// GET /audit
export async function listAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const query: ListAuditLogQuery = {
    eventType: req.query.eventType as ListAuditLogQuery['eventType'],
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };

  const result = await listAuditLogs(query);

  sendSuccess(res, result, 'Audit logs retrieved');
}

// ─── VERIFY CHAIN ───────────────────────────────────────────────────────────
// GET /audit/verify
export async function verifyChainHandler(req: Request, res: Response): Promise<void> {
  const result = await verifyChainIntegrity();

  sendSuccess(
    res,
    result,
    result.valid ? 'Audit chain integrity verified — no tampering detected' : 'Audit chain integrity check FAILED',
  );
}