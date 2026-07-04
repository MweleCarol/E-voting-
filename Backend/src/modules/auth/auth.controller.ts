import type { Request, Response } from 'express';
import { asyncHandler } from '@middleware/asyncHandler';
import { sendSuccess } from '@shared/helpers/response.helper';
import { HTTP_STATUS } from '@shared/constants/http-status.constants';
import {
  initiateActivation,
  verifyActivation,
  login,
  loginWithTotp,
  refreshSession,
  logout,
  setupTotp,
  confirmTotpSetup,
  verifyStaffActivation,
  initiateStaffActivation,
} from './auth.service.js';
import type {
  ActivationInitiateInput,
  ActivationVerifyInput,
  LoginInput,
  TotpLoginInput,
  RefreshInput,
  LogoutInput,
  TotpConfirmInput,
} from './auth.types.js';

const ACTIVATION_GENERIC_MESSAGE =
  'If a matching pending account exists, an activation code has been sent to the registered email.';

export const initiateActivationHandler = asyncHandler(async (req: Request, res: Response) => {
  await initiateActivation(req.body as ActivationInitiateInput);
  // SAME message regardless of what happened inside the service —
  // the anti-enumeration property is enforced HERE, by never
  // branching on the service's internal outcome.
  sendSuccess(res, null, ACTIVATION_GENERIC_MESSAGE, HTTP_STATUS.OK);
});

export const verifyActivationHandler = asyncHandler(async (req: Request, res: Response) => {
  await verifyActivation(req.body as ActivationVerifyInput);
  sendSuccess(res, null, 'Account activated successfully. You may now log in.', HTTP_STATUS.OK);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await login(req.body as LoginInput);

  if (result.status === 'MFA_REQUIRED') {
    sendSuccess(res, { mfaToken: result.mfaToken }, 'TOTP verification required.', HTTP_STATUS.OK);
    return;
  }

  if (result.status === 'TOTP_SETUP_REQUIRED') {
    sendSuccess(
      res,
      { totpSetupRequired: true, accessToken: result.accessToken },
      'Two-factor authentication setup required before your first login.',
      HTTP_STATUS.OK,
    );
    return;
  }

  // result.status === 'AUTHENTICATED' — TypeScript now knows this is
  // the only remaining member; result.tokens is safe without a cast.
  sendSuccess(res, result.tokens, 'Login successful.', HTTP_STATUS.OK);
});

export const loginTotpHandler = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await loginWithTotp(req.body as TotpLoginInput);
  sendSuccess(res, tokens, 'Login successful.', HTTP_STATUS.OK);
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await refreshSession(req.body as RefreshInput);
  sendSuccess(res, tokens, 'Session refreshed.', HTTP_STATUS.OK);
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  await logout(req.body as LogoutInput);
  sendSuccess(res, null, 'Logged out successfully.', HTTP_STATUS.OK);
});

export const setupTotpHandler = asyncHandler(async (req: Request, res: Response) => {
  /**
   * req.user is guaranteed set here — NOT by TypeScript's own
   * analysis (the `!` is overriding its uncertainty, not resolving
   * it), but by an invariant enforced at the ROUTING layer: this
   * handler is only ever reached after `authenticate` runs first on
   * this exact route. That's a trust boundary this file depends on
   * but cannot itself verify — worth naming explicitly rather than
   * letting the `!` quietly paper over where the guarantee actually
   * comes from.
   */
  const result = await setupTotp(req.user!.userId);
  sendSuccess(res, result, 'Scan this QR code with your authenticator app.', HTTP_STATUS.OK);
});

export const confirmTotpHandler = asyncHandler(async (req: Request, res: Response) => {
  await confirmTotpSetup(req.user!.userId, req.body as TotpConfirmInput);
  sendSuccess(res, null, 'TOTP enabled successfully.', HTTP_STATUS.OK);
});


export async function initiateStaffActivationHandler(req: Request, res: Response): Promise<void> {
  await initiateStaffActivation(req.body);
  sendSuccess(res, null, 'If that email matches a pending account, an activation code has been sent.');
}

export async function verifyStaffActivationHandler(req: Request, res: Response): Promise<void> {
  const result = await verifyStaffActivation(req.body);
  if (result.status === 'TOTP_SETUP_REQUIRED') {
    sendSuccess(
      res,
      { totpSetupRequired: true, accessToken: result.accessToken },
      'Account activated. You must set up two-factor authentication before your first login.',
    );
  } else {
    sendSuccess(res, result.tokens, 'Account activated successfully.');
  }
}