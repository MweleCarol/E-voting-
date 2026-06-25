// src/tests/integration/auth.router.test.ts
import express from 'express';
import request from 'supertest';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'MOCKEDSECRET'),
  generateURI: jest.fn(() => 'otpauth://totp/mocked'),
  generate: jest.fn(async () => '654321'),
  verify: jest.fn(async () => ({ valid: true })),
}));
jest.mock('@modules/auth/auth.service');

import authRouter from '@modules/auth/auth.router';
import {errorHandler} from '@middleware/errorHandler.middleware'; // adjust to named import if this throws
import * as authService from '@modules/auth/auth.service';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);
app.use(errorHandler);

describe('auth.router', () => {
  it('rejects login with a missing password — proves validation is actually wired', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: 'a@dkut.ac.ke' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('reaches the controller and returns tokens on valid input', async () => {
    jest.spyOn(authService, 'login').mockResolvedValue({
      status: 'AUTHENTICATED',
      tokens: { accessToken: 'a', refreshToken: 'b' },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'a@dkut.ac.ke', password: 'whatever-12345' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe('a');
  });
});