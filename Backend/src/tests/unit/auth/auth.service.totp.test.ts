import { generateSecret, generate, verify } from 'otplib';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'MOCKEDSECRETBASE32'),
  generateURI: jest.fn(() => 'otpauth://totp/mocked'),
  generate: jest.fn(async () => '654321'),
  verify: jest.fn(async ({ token }: { token: string }) => ({ valid: token === '654321' })),
}));

import { setupTotp, confirmTotpSetup, loginWithTotp } from '@modules/auth/auth.service';
import { signMfaPendingToken } from '@modules/auth/token.util';
import * as repo from '@modules/auth/auth.repository';

jest.mock('@modules/auth/auth.repository');

describe('auth.service TOTP', () => {
  it('confirms setup with a valid code', async () => {
    jest.spyOn(repo, 'findTotpSecretByUserId').mockResolvedValue({ secret: 'x', verified: false });
    const confirmSpy = jest.spyOn(repo, 'confirmTotpSecret').mockResolvedValue(undefined);

    await confirmTotpSetup('user-1', { code: '654321' }); // matches the mock's fixed "correct" code
    expect(confirmSpy).toHaveBeenCalledWith('user-1');
  });

  it('rejects an invalid code', async () => {
    jest.spyOn(repo, 'findTotpSecretByUserId').mockResolvedValue({ secret: 'x', verified: false });
    await expect(confirmTotpSetup('user-1', { code: '000000' })).rejects.toThrow();
  });

  it('completes login given a valid mfaToken and TOTP code', async () => {
    jest.spyOn(repo, 'findTotpSecretByUserId').mockResolvedValue({ secret: 'x', verified: true });
    jest.spyOn(repo, 'findUserById').mockResolvedValue({ email: 'a@dkut.ac.ke', roleId: 'role-1' });
    jest.spyOn(repo, 'createRefreshToken').mockResolvedValue(undefined);

    const mfaToken = signMfaPendingToken('user-1');
    const tokens = await loginWithTotp({ mfaToken, code: '654321' });
    expect(tokens.accessToken).toBeDefined();
  });
});