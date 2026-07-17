// src/modules/approvals/approvals.router.ts

import { Router }       from 'express';
import { authenticate } from '@middleware/authenticate.middleware';
import { requireRole }  from '@middleware/requireRole.middleware';
import { validate }     from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/asyncHandler';
import {
  requestIdParamSchema,
  castVoteBodySchema,
  listApprovalRequestsQuerySchema,
} from './approvals.validation.js';
import {
  castVoteHandler,
  getApprovalRequestHandler,
  listApprovalRequestsHandler,
} from './approvals.controller.js';

export const approvalsRouter = Router();

// ─── ALL ROUTES REQUIRE AUTHENTICATION ──────────────────────────────────────
approvalsRouter.use(authenticate);

// ─── READS — SYSTEM_ADMIN, ELECTION_OFFICER, AUDITOR (not STUDENT) ─────────
// Same non-student read-access set M7 uses for its own list route. Unlike
// M7's GET /:id, there's no per-row visibility nuance to defer to the service
// here — a student has no legitimate reason to see any approval request, so
// the gate belongs at the router for both list and detail, not just list.


approvalsRouter.get(
  '/',
  requireRole('SYSTEM_ADMIN', 'ELECTION_OFFICER', 'AUDITOR', 'OBSERVER'),
  validate({ query: listApprovalRequestsQuerySchema }),
  asyncHandler(listApprovalRequestsHandler),
);

approvalsRouter.get(
  '/:requestId',
  requireRole('SYSTEM_ADMIN', 'ELECTION_OFFICER', 'AUDITOR', 'OBSERVER'),
  validate({ params: requestIdParamSchema }),
  asyncHandler(getApprovalRequestHandler),
);

// ─── VOTE — ELECTION_OFFICER only ───────────────────────────────────────────
approvalsRouter.post(
  '/:requestId/vote',
  requireRole('ELECTION_OFFICER'),
  validate({ params: requestIdParamSchema, body: castVoteBodySchema }),
  asyncHandler(castVoteHandler),
);