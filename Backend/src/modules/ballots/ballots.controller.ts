// src/modules/ballots/ballots.controller.ts

import type { Request, Response } from 'express';
import { sendSuccess } from '@shared/helpers/response.helper.js';
import { requestBallot } from './ballots.service.js';

// ─── REQUEST BALLOT ─────────────────────────────────────────────────────────
// POST /ballots/request/:electionId
export async function requestBallotHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const electionId = req.params.electionId as string;

  const ballot = await requestBallot(userId, electionId);

  sendSuccess(res, ballot, 'Ballot issued');
}