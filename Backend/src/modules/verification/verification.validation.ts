// src/modules/verification/verification.validation.ts

import { z } from 'zod';
import { RegistrationStatus } from '@generated/prisma/client';

export const electionIdParamSchema = z.object({
  electionId: z.string().uuid('Invalid election ID'),
});

export const registrationIdParamSchema = z.object({
  registrationId: z.string().uuid('Invalid registration ID'),
});

export const listRegistrationsQuerySchema = z.object({
  status: z
    .enum([RegistrationStatus.PENDING, RegistrationStatus.APPROVED, RegistrationStatus.REJECTED])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});