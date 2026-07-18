// src/modules/votes/votes.validation.ts

import { z } from 'zod';

export const castVoteBodySchema = z.object({
  token: z.string().uuid('Invalid ballot token'),
  selections: z.record(
    z.string().uuid('Position ID must be a valid UUID'),
    z.string().uuid('Candidate ID must be a valid UUID'),
  ), // empty object permitted — full abstention is valid
});

export const receiptCodeParamSchema = z.object({
  receiptCode: z.string().length(64, 'Invalid receipt code'), // sha256 hex digest is always 64 chars
});