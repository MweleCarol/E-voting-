import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config = {
  server: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '5000', 10),
    apiVersion: process.env.API_VERSION ?? 'v1',
  },
  database: {
    url: requireEnv('DATABASE_URL'),
  },
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    mfaPendingExpiresIn: process.env.JWT_MFA_EXPIRES_IN ?? '5m',
  },
  // encryption block removed — VOTE_ENCRYPTION_KEY, VOTE_SIGNING_PRIVATE_KEY,
  // and VOTE_SIGNING_PUBLIC_KEY are read and validated EXCLUSIVELY by
  // src/security/key-management.service.ts. No other module touches them.
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
    totpIssuer: process.env.TOTP_ISSUER ?? 'SEVS',
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
};
