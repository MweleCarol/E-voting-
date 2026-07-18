// src/modules/audit/audit.validation.ts

import { z } from 'zod';

const AUDIT_EVENT_TYPES = [
  'ELECTION_SCHEDULED',
  'ELECTION_ACTIVATED',
  'ELECTION_CLOSED',
  'CANDIDATE_APPROVED',
  'CANDIDATE_REJECTED',
  'REGISTRATION_APPROVED',
  'REGISTRATION_REJECTED',
  'VOTE_CAST',
] as const;

export const listAuditLogsQuerySchema = z.object({
  eventType: z.enum(AUDIT_EVENT_TYPES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});