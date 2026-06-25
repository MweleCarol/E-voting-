import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@modules/auth/token.util';
import { AuthenticationError } from '@shared/errors';
import type { AuthenticatedUser } from '@modules/auth/auth.types';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new AuthenticationError('Authentication required.');
  }

  const token = header.slice('Bearer '.length).trim();

  /**
   * verifyAccessToken() ALREADY rejects anything that isn't purpose:
   * 'access' — that check lives inside token.util.ts's verifyToken,
   * enforced the moment this line runs. An mfa_pending token handed
   * to this middleware fails HERE, inside this single call, not via
   * a separate purpose check this file has to remember to write.
   * This is the payoff of the design from several files back: the
   * enforcement point is the token verification itself, not a
   * convention every middleware has to independently honor.
   */
  const payload = verifyAccessToken(token);

  const user: AuthenticatedUser = { userId: payload.userId, roleId: payload.roleId };
  req.user = user;

  next();
}