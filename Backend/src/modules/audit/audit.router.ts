// src/modules/audit/audit.router.ts

import { Router } from 'express';
import { authenticate } from '@middleware/authenticate.middleware';
import { requireRole } from '@middleware/requireRole.middleware';
import { validate } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/asyncHandler';
import { listAuditLogsQuerySchema } from './audit.validation.js';
import { listAuditLogsHandler, verifyChainHandler } from './audit.controller.js';

export const auditRouter = Router();

auditRouter.use(authenticate);

// ─── READ — SYSTEM_ADMIN, AUDITOR, OBSERVER only ───────────────────────────
// Deliberately excludes ELECTION_OFFICER/VERIFICATION_OFFICER — the parties
// whose actions this log records should not also be its unsupervised
// reviewers. A different, narrower split than every other module's read
// gate, chosen specifically because oversight independence is this
// module's entire purpose.
auditRouter.get(
  '/',
  requireRole('SYSTEM_ADMIN', 'AUDITOR', 'OBSERVER'),
  validate({ query: listAuditLogsQuerySchema }),
  asyncHandler(listAuditLogsHandler),
);

auditRouter.get(
  '/verify',
  requireRole('SYSTEM_ADMIN', 'AUDITOR', 'OBSERVER'),
  asyncHandler(verifyChainHandler),
);