// src/tests/unit/auth/auth.service.test.ts
import bcrypt from 'bcryptjs';
import { login } from '@modules/auth/auth.service';
import * as repo from '@modules/auth/auth.repository';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'MOCKEDSECRETBASE32'),
  generateURI: jest.fn(() => 'otpauth://totp/mocked'),
  generate: jest.fn(async () => '654321'),
  verify: jest.fn(async ({ token }: { token: string }) => ({ valid: token === '654321' })),
}));
jest.mock('@modules/auth/auth.repository');

describe('auth.service login', () => {
  it('authenticates directly when TOTP is not enabled', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4); // low cost for test speed
    jest.spyOn(repo, 'findActiveUserByIdentifier').mockResolvedValue({
      id: 'user-1', passwordHash, roleId: 'role-1',
    });
    jest.spyOn(repo, 'findTotpSecretByUserId').mockResolvedValue(null);
    jest.spyOn(repo, 'createRefreshToken').mockResolvedValue(undefined);

    const result = await login({ identifier: 'a@dkut.ac.ke', password: 'correct-password' });
    expect(result.status).toBe('AUTHENTICATED');
  });

  it('requires MFA when a verified TOTP secret exists', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    jest.spyOn(repo, 'findActiveUserByIdentifier').mockResolvedValue({
      id: 'user-1', passwordHash, roleId: 'role-1',
    });
    jest.spyOn(repo, 'findTotpSecretByUserId').mockResolvedValue({ secret: 'x', verified: true });

    const result = await login({ identifier: 'a@dkut.ac.ke', password: 'correct-password' });
    expect(result.status).toBe('MFA_REQUIRED');
  });

  it('throws the SAME error for unknown identifier and wrong password', async () => {
    jest.spyOn(repo, 'findActiveUserByIdentifier').mockResolvedValue(null);
    await expect(login({ identifier: 'nobody@dkut.ac.ke', password: 'whatever' }))
      .rejects.toThrow('Invalid credentials.');
  });
});