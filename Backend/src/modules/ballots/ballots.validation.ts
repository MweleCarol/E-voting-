// src/modules/ballots/ballots.validation.ts

import { z } from 'zod';

export const electionIdParamSchema = z.object({
  electionId: z.string().uuid('Invalid election ID'),
});