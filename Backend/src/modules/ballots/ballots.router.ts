// src/modules/ballots/ballots.router.ts

import { Router } from 'express';
import { authenticate } from '@middleware/authenticate.middleware';
import { requireRole } from '@middleware/requireRole.middleware';
import { validate } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/asyncHandler';
import { electionIdParamSchema } from './ballots.validation.js';
import { requestBallotHandler } from './ballots.controller.js';

export const ballotsRouter = Router();

ballotsRouter.use(authenticate);

// ─── STUDENT-ONLY ───────────────────────────────────────────────────────────
// Single route for this milestone — no list/detail/admin surface. Ballots
// are anonymous by design; there is no legitimate "list all ballots" view
// for any role, officer or otherwise, unlike every prior module.
ballotsRouter.post(
  '/request/:electionId',
  requireRole('STUDENT'),
  validate({ params: electionIdParamSchema }),
  asyncHandler(requestBallotHandler),
);