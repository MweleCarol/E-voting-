import rateLimit from 'express-rate-limit';

export function createRateLimiter(windowMinutes: number, max: number, message: string) {
  return rateLimit({
    windowMs: windowMinutes * 60_000,
    max,
    message: { success: false, message, errorCode: 'RATE_LIMITED' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}