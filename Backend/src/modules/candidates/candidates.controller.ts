// src/modules/candidates/candidates.controller.ts

import type { Request, Response } from 'express';
import { sendSuccess } from '@shared/helpers/response.helper.js';
import {
  submitCandidacy,
  withdrawCandidacy,
  listCandidates,
  getCandidateById,
} from './candidates.service.js';
import type { ListCandidatesQuery } from './candidates.types.js';

// ─── SUBMIT ─────────────────────────────────────────────────────────────────
// POST /candidates
export async function submitCandidacyHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const candidate = await submitCandidacy(userId, {
    positionId: req.body.positionId,
    manifesto: req.body.manifesto,
  });

  sendSuccess(res, candidate, 'Candidacy submitted, pending officer approval');
}

// ─── WITHDRAW ───────────────────────────────────────────────────────────────
// PATCH /candidates/:candidateId/withdraw
export async function withdrawCandidacyHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const candidateId = req.params.candidateId as string;

  const candidate = await withdrawCandidacy(userId, { candidateId });

  sendSuccess(res, candidate, 'Candidacy withdrawn');
}

// ─── LIST ───────────────────────────────────────────────────────────────────
// GET /candidates
export async function listCandidatesHandler(req: Request, res: Response): Promise<void> {
  const query: ListCandidatesQuery = {
    positionId: req.query.positionId as string | undefined,
    electionId: req.query.electionId as string | undefined,
    status: req.query.status as ListCandidatesQuery['status'],
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };

  const result = await listCandidates(query);

  sendSuccess(res, result, 'Candidates retrieved');
}

// ─── GET BY ID ──────────────────────────────────────────────────────────────
// GET /candidates/:candidateId
export async function getCandidateHandler(req: Request, res: Response): Promise<void> {
  const candidateId = req.params.candidateId as string;
  const candidate = await getCandidateById(candidateId);

  sendSuccess(res, candidate, 'Candidate retrieved');
}