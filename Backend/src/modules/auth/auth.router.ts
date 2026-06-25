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
} from './auth.controller.js';

const router = Router();

const activationInitiateLimiter = createRateLimiter(15, 5, 'Too many activation requests. Try again later.');
const activationVerifyLimiter = createRateLimiter(15, 10, 'Too many attempts. Try again later.');
const loginLimiter = createRateLimiter(15, 10, 'Too many login attempts. Try again later.');
const loginTotpLimiter = createRateLimiter(15, 10, 'Too many attempts. Try again later.');

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
router.post('/totp/confirm', authenticate, validate({ body: totpConfirmSchema }), confirmTotpHandler);

export default router;