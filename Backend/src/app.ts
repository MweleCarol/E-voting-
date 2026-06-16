import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '@config/index.js';
import { logger } from '@config/logger';

const app: Application = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.server.nodeEnv === 'development' ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Request Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));        // Limit body size — prevents payload attacks
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Logging ──────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: ' API is running',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes (registered here as modules are built) ────────────────────────
// app.use(`/api/${config.server.apiVersion}/auth`, authRouter);
// app.use(`/api/${config.server.apiVersion}/users`, usersRouter);
// ... more routes added per milestone

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errorCode: 'ROUTE_NOT_FOUND',
  });
});

// ─── Global Error Handler (placeholder — full version in Milestone 3) ─────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errorCode: 'INTERNAL_ERROR',
  });
});

export default app;