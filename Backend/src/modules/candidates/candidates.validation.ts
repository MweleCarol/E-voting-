// src/modules/candidates/candidates.validation.ts

import { z } from 'zod';
import { CandidateStatus } from '../../generated/prisma/client.js';

export const candidateIdParamSchema = z.object({
  candidateId: z.string().uuid('Invalid candidate ID'),
});

export const createCandidacyBodySchema = z.object({
  positionId: z.string().uuid('Invalid position ID'),
  manifesto: z.string().max(5000).optional(),
});

export const listCandidatesQuerySchema = z.object({
  positionId: z.string().uuid().optional(),
  electionId: z.string().uuid().optional(),
  status: z
    .enum([
      CandidateStatus.PENDING,
      CandidateStatus.APPROVED,
      CandidateStatus.REJECTED,
      CandidateStatus.WITHDRAWN,
    ])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});