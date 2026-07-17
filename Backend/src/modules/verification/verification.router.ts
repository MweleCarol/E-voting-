// src/modules/verification/verification.router.ts

import { Router } from 'express';
import { authenticate } from '@middleware/authenticate.middleware';
import { requireRole } from '@middleware/requireRole.middleware';
import { validate } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/asyncHandler';
import {
  electionIdParamSchema,
  registrationIdParamSchema,
  listRegistrationsQuerySchema,
} from './verification.validation.js';
import {
  registerForElectionHandler,
  getRegistrationStatusHandler,
  listRegistrationsHandler,
  approveRegistrationHandler,
  rejectRegistrationHandler,
} from './verification.controller.js';

export const verificationRouter = Router();

verificationRouter.use(authenticate);

// ─── STUDENT ────────────────────────────────────────────────────────────────
verificationRouter.post(
  '/register/:electionId',
  requireRole('STUDENT'),
  validate({ params: electionIdParamSchema }),
  asyncHandler(registerForElectionHandler),
);

verificationRouter.get(
  '/status/:electionId',
  requireRole('STUDENT'),
  validate({ params: electionIdParamSchema }),
  asyncHandler(getRegistrationStatusHandler),
);

// ─── VERIFICATION_OFFICER ───────────────────────────────────────────────────
verificationRouter.get(
  '/elections/:electionId/registrations',
  requireRole('VERIFICATION_OFFICER'),
  validate({ params: electionIdParamSchema, query: listRegistrationsQuerySchema }),
  asyncHandler(listRegistrationsHandler),
);

verificationRouter.patch(
  '/:registrationId/approve',
  requireRole('VERIFICATION_OFFICER'),
  validate({ params: registrationIdParamSchema }),
  asyncHandler(approveRegistrationHandler),
);

verificationRouter.patch(
  '/:registrationId/reject',
  requireRole('VERIFICATION_OFFICER'),
  validate({ params: registrationIdParamSchema }),
  asyncHandler(rejectRegistrationHandler),
);