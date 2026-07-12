// src/modules/approvals/approvals.controller.ts

import type { Request, Response } from 'express';
import { sendSuccess } from '@shared/helpers/response.helper.js';
import {
  castVote,
  getApprovalRequestById,
  listApprovalRequests,
} from './approvals.service.js';
import type {
  CastApprovalInput,
  ListApprovalRequestsQuery,
} from './approvals.types.js';

// ─── CAST VOTE ──────────────────────────────────────────────────────────────
// POST /approvals/:requestId/vote
export async function castVoteHandler(req: Request, res: Response): Promise<void> {
  const input: CastApprovalInput = {
    requestId: req.params.requestId as string, // ← narrowed for real once validation middleware runs (next file)
    officerId: req.user!.userId,
    decision: req.body.decision,
    comment: req.body.comment,
  };

  const outcome = await castVote(input);

  sendSuccess(res, outcome, 'Vote recorded');
}

// ─── GET BY ID ──────────────────────────────────────────────────────────────
// GET /approvals/:requestId
export async function getApprovalRequestHandler(req: Request, res: Response): Promise<void> {
  const requestId = req.params.requestId as string;

  const request = await getApprovalRequestById(requestId);

  sendSuccess(res, request, 'Approval request retrieved');
}

// ─── LIST ───────────────────────────────────────────────────────────────────
// GET /approvals
export async function listApprovalRequestsHandler(req: Request, res: Response): Promise<void> {
  const query: ListApprovalRequestsQuery = {
    status: req.query.status as ListApprovalRequestsQuery['status'],
    actionType: req.query.actionType as ListApprovalRequestsQuery['actionType'],
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };

  const result = await listApprovalRequests(query);

  sendSuccess(res, result, 'Approval requests retrieved');
}