// src/tests/unit/auth/auth.service.session.test.ts
import { refreshSession, logout } from '@modules/auth/auth.service';
import * as repo from '@modules/auth/auth.repository';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'MOCKEDSECRETBASE32'),
  generateURI: jest.fn(() => 'otpauth://totp/mocked'),
  generate: jest.fn(async () => '654321'),
  verify: jest.fn(async ({ token }: { token: string }) => ({ valid: token === '654321' })),
}));
jest.mock('@modules/auth/auth.repository');

describe('auth.service session lifecycle', () => {
  it('rotates a valid refresh token into a new pair', async () => {
    jest.spyOn(repo, 'findValidRefreshTokenByHash').mockResolvedValue({ id: 'row-1', userId: 'user-1' });
    const revokeSpy = jest.spyOn(repo, 'revokeRefreshToken').mockResolvedValue(undefined);
    jest.spyOn(repo, 'findUserById').mockResolvedValue({ email: 'a@dkut.ac.ke', roleId: 'role-1' });
    jest.spyOn(repo, 'createRefreshToken').mockResolvedValue(undefined);

    const tokens = await refreshSession({ refreshToken: 'raw-value' });
    expect(revokeSpy).toHaveBeenCalledWith('row-1');
    expect(tokens.accessToken).toBeDefined();
  });

  it('rejects an invalid or already-revoked token', async () => {
    jest.spyOn(repo, 'findValidRefreshTokenByHash').mockResolvedValue(null);
    await expect(refreshSession({ refreshToken: 'bad' })).rejects.toThrow();
  });

  it('logout is idempotent on an already-invalid token', async () => {
    jest.spyOn(repo, 'findValidRefreshTokenByHash').mockResolvedValue(null);
    await expect(logout({ refreshToken: 'already-gone' })).resolves.not.toThrow();
  });
});