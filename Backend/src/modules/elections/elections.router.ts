// src/modules/elections/elections.router.ts

import { Router }       from 'express';
import { authenticate } from '@middleware/authenticate.middleware';
import { requireRole }  from '@middleware/requireRole.middleware';
import { validate }     from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/asyncHandler';
import {
  createElectionSchema,
  updateElectionSchema,
  addPositionSchema,
  listElectionsQuerySchema,
  electionIdParamSchema,
  positionIdParamSchema,
} from './elections.validation.js';
import {
  createElectionHandler,
  listElectionsHandler,
  listActiveElectionsHandler,
  getElectionHandler,
  updateElectionHandler,
  submitElectionHandler,
  cancelElectionHandler,
  activateElectionHandler,
  initiateCloseHandler,
  addPositionHandler,
  removePositionHandler,
} from './elections.controller.js';

export const electionsRouter = Router();

// ─── ALL ROUTES REQUIRE AUTHENTICATION ───────────────────────────────────────
// Applied at router level — no route in this module is public.
electionsRouter.use(authenticate);

// ─── ELECTIONS ────────────────────────────────────────────────────────────────

// IMPORTANT: /active must be declared before /:id.
// Express matches routes top-to-bottom. If /:id comes first, the string
// "active" is interpreted as a UUID parameter — Zod rejects it with 400.
electionsRouter.get(
  '/active',
  asyncHandler(listActiveElectionsHandler),
);

electionsRouter.get(
  '/',
  requireRole('SYSTEM_ADMIN', 'ELECTION_OFFICER', 'AUDITOR'),
  validate({ query: listElectionsQuerySchema }),
  asyncHandler(listElectionsHandler),
);

electionsRouter.post(
  '/',
  requireRole('SYSTEM_ADMIN'),
  validate({ body: createElectionSchema }),
  asyncHandler(createElectionHandler),
);

electionsRouter.get(
  '/:id',
  validate({ params: electionIdParamSchema }),
  asyncHandler(getElectionHandler),
);

electionsRouter.patch(
  '/:id',
  requireRole('SYSTEM_ADMIN'),
  validate({ params: electionIdParamSchema, body: updateElectionSchema }),
  asyncHandler(updateElectionHandler),
);

// DELETE /:id = cancel (moves status to CANCELLED, not a hard delete)
electionsRouter.delete(
  '/:id',
  requireRole('SYSTEM_ADMIN'),
  validate({ params: electionIdParamSchema }),
  asyncHandler(cancelElectionHandler),
);

// ─── STATE TRANSITIONS ────────────────────────────────────────────────────────

electionsRouter.post(
  '/:id/submit',
  requireRole('SYSTEM_ADMIN'),
  validate({ params: electionIdParamSchema }),
  asyncHandler(submitElectionHandler),
);

electionsRouter.post(
  '/:id/activate',
  requireRole('SYSTEM_ADMIN'),
  validate({ params: electionIdParamSchema }),
  asyncHandler(activateElectionHandler),
);

electionsRouter.post(
  '/:id/close',
  requireRole('SYSTEM_ADMIN'),
  validate({ params: electionIdParamSchema }),
  asyncHandler(initiateCloseHandler),
);

// ─── POSITIONS ────────────────────────────────────────────────────────────────

electionsRouter.post(
  '/:id/positions',
  requireRole('SYSTEM_ADMIN'),
  validate({ params: electionIdParamSchema, body: addPositionSchema }),
  asyncHandler(addPositionHandler),
);

electionsRouter.delete(
  '/:id/positions/:posId',
  requireRole('SYSTEM_ADMIN'),
  validate({ params: positionIdParamSchema }),
  asyncHandler(removePositionHandler),
);