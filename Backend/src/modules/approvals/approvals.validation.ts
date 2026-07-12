// src/modules/approvals/approvals.validation.ts

import { z } from 'zod';
import { ApprovalDecision, ApprovalStatus, ApprovalActionType } from '../../generated/prisma/client.js';

// ─── PARAMS ─────────────────────────────────────────────────────────────────
export const requestIdParamSchema = z.object({
  requestId: z.string().uuid('Invalid approval request ID'),
});

// ─── CAST VOTE BODY ─────────────────────────────────────────────────────────
export const castVoteBodySchema = z.object({
  decision: z.enum([ApprovalDecision.APPROVE, ApprovalDecision.REJECT], {
    error: 'decision must be APPROVE or REJECT', // Zod v4 unified error field — same fix M6 hit with otplib/Zod drift
  }),
  comment: z.string().max(1000).optional(),
});

// ─── LIST QUERY ─────────────────────────────────────────────────────────────
export const listApprovalRequestsQuerySchema = z.object({
  status: z.enum([ApprovalStatus.PENDING, ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]).optional(),
  actionType: z
    .enum([
      ApprovalActionType.ELECTION_ACTIVATE,
      ApprovalActionType.ELECTION_CLOSE,
      ApprovalActionType.RESULTS_PUBLISH,
      ApprovalActionType.CANDIDATE_APPROVE,
    ])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});