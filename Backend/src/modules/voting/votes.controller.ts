// src/modules/votes/votes.controller.ts

import type { Request, Response } from 'express';
import { sendSuccess } from '@shared/helpers/response.helper.js';
import { castVote, verifyReceipt } from './votes.service.js';

// ─── CAST ───────────────────────────────────────────────────────────────────
// POST /votes/cast
// Deliberately does not pass req.user anywhere into castVote — authenticate/
// requireRole gate WHO may attempt this call; the vote itself never records
// that identity. This is the anonymity boundary made explicit in code, not
// just implied by what arguments happen to be omitted.
export async function castVoteHandler(req: Request, res: Response): Promise<void> {
  const result = await castVote({ token: req.body.token, selections: req.body.selections });
  sendSuccess(res, result, 'Vote cast successfully');
}

// ─── VERIFY RECEIPT ─────────────────────────────────────────────────────────
// GET /votes/verify/:receiptCode
export async function verifyReceiptHandler(req: Request, res: Response): Promise<void> {
  const receiptCode = req.params.receiptCode as string;
  const result = await verifyReceipt(receiptCode);

  sendSuccess(res, result, result.verified ? 'Vote confirmed' : 'No matching vote found');
}