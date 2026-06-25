// src/tests/unit/middleware/authenticate.middleware.test.ts
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '@middleware/authenticate.middleware';
import { signAccessToken, signMfaPendingToken } from '@modules/auth/token.util';

function mockReq(authHeader?: string): Request {
  return { headers: { authorization: authHeader } } as unknown as Request;
}

describe('authenticate.middleware', () => {
  const res = {} as Response;
  const next = jest.fn() as NextFunction;

  afterEach(() => jest.clearAllMocks());

  it('throws when no Authorization header is present', () => {
    expect(() => authenticate(mockReq(), res, next)).toThrow();
  });

  it('throws when the header has no Bearer prefix', () => {
    expect(() => authenticate(mockReq('Token abc123'), res, next)).toThrow();
  });

  it('attaches req.user and calls next() for a valid access token', () => {
    const token = signAccessToken('user-1', 'role-1');
    const req = mockReq(`Bearer ${token}`);
    authenticate(req, res, next);
    expect(req.user).toEqual({ userId: 'user-1', roleId: 'role-1' });
    expect(next).toHaveBeenCalled();
  });

  it('rejects an mfa_pending token presented as a real session', () => {
    const token = signMfaPendingToken('user-1');
    expect(() => authenticate(mockReq(`Bearer ${token}`), res, next)).toThrow();
  });
});