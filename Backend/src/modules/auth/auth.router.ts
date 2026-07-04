import { Router } from 'express';
import { validate } from '@middleware/validate.middleware';
import { authenticate } from '@middleware/authenticate.middleware';
import { createRateLimiter } from '@middleware/rateLimiter.middleware';
import {
  activationInitiateSchema,
  activationVerifySchema,
  loginSchema,
  totpLoginSchema,
  refreshSchema,
  logoutSchema,
  totpConfirmSchema,
  staffActivationVerifySchema,
  staffActivationInitiateSchema,
} from './auth.validation.js';
import {
  initiateActivationHandler,
  verifyActivationHandler,
  loginHandler,
  loginTotpHandler,
  refreshHandler,
  logoutHandler,
  setupTotpHandler,
  confirmTotpHandler,
  verifyStaffActivationHandler,
  initiateStaffActivationHandler,
} from './auth.controller.js';
import { asyncHandler } from '@middleware/asyncHandler.js';

const router = Router();

const activationInitiateLimiter = createRateLimiter(
  15,
  5,
  'Too many activation requests. Try again later.',
);
const activationVerifyLimiter = createRateLimiter(15, 10, 'Too many attempts. Try again later.');
const loginLimiter = createRateLimiter(15, 10, 'Too many login attempts. Try again later.');
const loginTotpLimiter = createRateLimiter(15, 10, 'Too many attempts. Try again later.');
const staffActivationInitiateRateLimiter = createRateLimiter(
  15,
  5,
  'Too many activation requests. Try again later.',
);
const staffActivationVerifyRateLimiter = createRateLimiter(
  15,
  10,
  'Too many attempts. Try again later.',
);

router.post(
  '/activation/initiate',
  activationInitiateLimiter,
  validate({ body: activationInitiateSchema }),
  initiateActivationHandler,
);
router.post(
  '/activation/verify',
  activationVerifyLimiter,
  validate({ body: activationVerifySchema }),
  verifyActivationHandler,
);

router.post('/login', loginLimiter, validate({ body: loginSchema }), loginHandler);
router.post('/login/totp', loginTotpLimiter, validate({ body: totpLoginSchema }), loginTotpHandler);

router.post('/refresh', validate({ body: refreshSchema }), refreshHandler);
router.post('/logout', validate({ body: logoutSchema }), logoutHandler);

router.post('/totp/setup', authenticate, setupTotpHandler);
router.post(
  '/totp/confirm',
  authenticate,
  validate({ body: totpConfirmSchema }),
  confirmTotpHandler,
);

// Add after the existing activation routes

router.post(
  '/activate/staff/initiate',
  staffActivationInitiateRateLimiter, // reuse your existing activation rate limiter, or create a parallel one
  validate({ body: staffActivationInitiateSchema }),
  asyncHandler(initiateStaffActivationHandler),
);

router.post(
  '/activate/staff/verify',
  staffActivationVerifyRateLimiter,
  validate({ body: staffActivationVerifySchema }),
  asyncHandler(verifyStaffActivationHandler),
);

export default router;
