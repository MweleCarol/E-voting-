// src/modules/elections/elections.controller.ts

import type { Request, Response } from 'express';
import { sendSuccess }    from '@shared/helpers/response.helper';
import { getRoleName }    from '@shared/cache/role.cache';
import { HTTP_STATUS }    from '@shared/constants/http-status.constants';
import {
  createElection,
  getElectionById,
  listElections,
  listActiveElections,
  updateElection,
  submitElection,
  cancelElection,
  activateElection,
  initiateClose,
  addPosition,
  removePosition,
} from './elections.service.js';
import type {
  CreateElectionBody,
  UpdateElectionBody,
  AddPositionBody,
  ListElectionsQuery,
} from './elections.validation.js';

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createElectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId } = req.user!;
  const body = req.body as CreateElectionBody;

  const election = await createElection(
    {
      title:       body.title,
      description: body.description,
      startDate:   body.startDate,
      endDate:     body.endDate,
      positions:   body.positions,
    },
    userId,
  );

  sendSuccess(res, election, 'Election created successfully.', HTTP_STATUS.CREATED);
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function listElectionsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const { status, page, limit } = req.query as unknown as ListElectionsQuery;

  const result = await listElections({ status, page, limit });

  sendSuccess(res, result, 'Elections retrieved successfully.');
}

export async function listActiveElectionsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const { page = 1, limit = 20 } = req.query as unknown as Pick<ListElectionsQuery, 'page' | 'limit'>;

  const result = await listActiveElections({ page, limit });

  sendSuccess(res, result, 'Active elections retrieved successfully.');
}

export async function getElectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const { roleId } = req.user!;

  // Resolve roleId → role name for the student visibility guard.
  // Treating an unresolvable role as non-student is the safe default:
  // the student restriction limits visibility; unknown roles get full access.
  const roleName = await getRoleName(roleId) ?? 'UNKNOWN';

  const election = await getElectionById(id, roleName);

  sendSuccess(res, election, 'Election retrieved successfully.');
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateElectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const { userId } = req.user!;
  const body = req.body as UpdateElectionBody;

  const updated = await updateElection(
    id,
    {
      title:       body.title,
      description: body.description,
      startDate:   body.startDate,
      endDate:     body.endDate,
    },
    userId,
  );

  sendSuccess(res, updated, 'Election updated successfully.');
}

// ─── STATE TRANSITIONS ────────────────────────────────────────────────────────

export async function submitElectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const { userId } = req.user!;

  await submitElection(id, userId);

  sendSuccess(res, { electionId: id }, 'Election submitted for approval.');
}

export async function cancelElectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const { userId } = req.user!;

  await cancelElection(id, userId);

  sendSuccess(res, { electionId: id }, 'Election cancelled.');
}

export async function activateElectionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const { userId } = req.user!;

  await activateElection(id, userId);

  sendSuccess(res, { electionId: id }, 'Election activated.');
}

export async function initiateCloseHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const { userId } = req.user!;

  const result = await initiateClose(id, userId);

  sendSuccess(
    res,
    { electionId: id, approvalRequestId: result.approvalRequestId },
    'Election close request submitted for approval.',
  );
}

// ─── POSITIONS ────────────────────────────────────────────────────────────────

export async function addPositionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const { userId } = req.user!;
  const body = req.body as AddPositionBody;

  const position = await addPosition(id, { title: body.title }, userId);

  sendSuccess(res, position, 'Position added.', HTTP_STATUS.CREATED);
}

export async function removePositionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params['id'] as string;
  const posId = req.params['posId'] as string;
  const { userId } = req.user!;

  await removePosition(id, posId, userId);

  sendSuccess(res, { positionId: posId }, 'Position removed.');
}