import { Request, Response, NextFunction } from 'express';
import { getRoleIds } from '@shared/cache/role.cache';
import { AuthorizationError } from '@shared/errors/errors'; // confirm this matches your actual filename/path
import { asyncHandler } from '@middleware/asyncHandler';   // confirm this matches your M3 file
import { RoleName } from '@shared/types/role.types';

export function requireRole(...roleNames: RoleName[]) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required before authorization can be checked.');
    }

    const allowedIds = await getRoleIds(roleNames);

    if (!allowedIds.includes(req.user.roleId)) {
      throw new AuthorizationError(); // default message — no role names leaked to the client
    }

    next();
  });
}