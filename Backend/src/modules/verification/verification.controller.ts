// src/modules/verification/verification.controller.ts

import type { Request, Response } from 'express';
import { sendSuccess } from '@shared/helpers/response.helper.js';
import {
  registerForElection,
  approveRegistration,
  rejectRegistration,
  getRegistrationStatus,
  listRegistrations,
} from './verification.service.js';
import type { ListRegistrationsQuery } from './verification.types.js';

// ─── REGISTER ───────────────────────────────────────────────────────────────
// POST /verification/register/:electionId
export async function registerForElectionHandler(req: Request, res: Response): Promise<void> {
  const electionId = req.params.electionId as string; // narrowed for real once validation runs (next file)
  const userId = req.user!.userId;

  const registration = await registerForElection(userId, electionId);

  sendSuccess(res, registration, 'Registration submitted');
}

// ─── STATUS (student's own) ────────────────────────────────────────────────
// GET /verification/status/:electionId
export async function getRegistrationStatusHandler(req: Request, res: Response): Promise<void> {
  const electionId = req.params.electionId as string;
  const userId = req.user!.userId;

  const registration = await getRegistrationStatus(userId, electionId);

  sendSuccess(res, registration, 'Registration status retrieved');
}

// ─── LIST (officer view) ───────────────────────────────────────────────────
// GET /verification/elections/:electionId/registrations
export async function listRegistrationsHandler(req: Request, res: Response): Promise<void> {
  const query: ListRegistrationsQuery = {
    electionId: req.params.electionId as string,
    status: req.query.status as ListRegistrationsQuery['status'],
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };

  const result = await listRegistrations(query);

  sendSuccess(res, result, 'Registrations retrieved');
}

// ─── APPROVE ────────────────────────────────────────────────────────────────
// PATCH /verification/:registrationId/approve
export async function approveRegistrationHandler(req: Request, res: Response): Promise<void> {
  const registrationId = req.params.registrationId as string;
  const officerId = req.user!.userId;

  const registration = await approveRegistration({ registrationId, officerId });

  sendSuccess(res, registration, 'Registration approved');
}

// ─── REJECT ─────────────────────────────────────────────────────────────────
// PATCH /verification/:registrationId/reject
export async function rejectRegistrationHandler(req: Request, res: Response): Promise<void> {
  const registrationId = req.params.registrationId as string;
  const officerId = req.user!.userId;

  const registration = await rejectRegistration({ registrationId, officerId });

  sendSuccess(res, registration, 'Registration rejected');
}