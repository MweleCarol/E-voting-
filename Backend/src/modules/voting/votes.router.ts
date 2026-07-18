// src/modules/votes/votes.router.ts

import { Router } from 'express';
import { authenticate } from '@middleware/authenticate.middleware';
import { requireRole } from '@middleware/requireRole.middleware';
import { validate } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/asyncHandler';
import { castVoteBodySchema, receiptCodeParamSchema } from './votes.validation.js';
import { castVoteHandler, verifyReceiptHandler } from './votes.controller.js';

export const votesRouter = Router();

votesRouter.use(authenticate);

// ─── CAST — STUDENT only ────────────────────────────────────────────────────
votesRouter.post(
  '/cast',
  requireRole('STUDENT'),
  validate({ body: castVoteBodySchema }),
  asyncHandler(castVoteHandler),
);

// ─── VERIFY — open to any authenticated role ───────────────────────────────
// A receipt code proves inclusion, never choice (per receipt.service.ts's
// own design comment) — there's no anonymity cost to letting any
// authenticated user check one, unlike ballots.router.ts's total lockdown.
votesRouter.get(
  '/verify/:receiptCode',
  validate({ params: receiptCodeParamSchema }),
  asyncHandler(verifyReceiptHandler),
);