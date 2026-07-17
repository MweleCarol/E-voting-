// src/modules/candidates/candidates.router.ts

import { Router } from 'express';
import { authenticate } from '@middleware/authenticate.middleware';
import { requireRole } from '@middleware/requireRole.middleware';
import { validate } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/asyncHandler';
import {
  candidateIdParamSchema,
  createCandidacyBodySchema,
  listCandidatesQuerySchema,
} from './candidates.validation.js';
import {
  submitCandidacyHandler,
  withdrawCandidacyHandler,
  listCandidatesHandler,
  getCandidateHandler,
} from './candidates.controller.js';

export const candidatesRouter = Router();

candidatesRouter.use(authenticate);

// ─── READS — open to every authenticated role ──────────────────────────────
// Candidates are the ballot itself; every voter needs visibility. Unlike M8
// (internal governance, no student access) and M9 (private per-student data),
// there's no equivalent reason to restrict this.
candidatesRouter.get(
  '/',
  validate({ query: listCandidatesQuerySchema }),
  asyncHandler(listCandidatesHandler),
);

candidatesRouter.get(
  '/:candidateId',
  validate({ params: candidateIdParamSchema }),
  asyncHandler(getCandidateHandler),
);

// ─── STUDENT-ONLY WRITES ────────────────────────────────────────────────────
// No approve/reject routes here — deliberately. Approval happens through
// M8's existing POST /approvals/:requestId/vote. This module only creates
// the request and reacts to its resolution via resolveCandidacy.
candidatesRouter.post(
  '/',
  requireRole('STUDENT'),
  validate({ body: createCandidacyBodySchema }),
  asyncHandler(submitCandidacyHandler),
);

candidatesRouter.patch(
  '/:candidateId/withdraw',
  requireRole('STUDENT'),
  validate({ params: candidateIdParamSchema }),
  asyncHandler(withdrawCandidacyHandler),
);