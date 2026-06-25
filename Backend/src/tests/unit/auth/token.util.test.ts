import {
  signAccessToken,
  verifyAccessToken,
  signMfaPendingToken,
  verifyAccessToken as verifyAsAccess,
} from '@modules/auth/token.util';

describe('token.util', () => {
  it('round-trips an access token', () => {
    const token = signAccessToken('user-1', 'role-1');
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe('user-1');
    expect(decoded.purpose).toBe('access');
  });

  it('rejects an mfa_pending token presented as an access token', () => {
    const mfaToken = signMfaPendingToken('user-1');
    expect(() => verifyAsAccess(mfaToken)).toThrow();
  });
});