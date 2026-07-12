import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '@config/index.js';
import { logger } from '@config/logger';
import { notFound } from '@middleware/notFound.middleware';
import { errorHandler } from '@middleware/errorHandler.middleware';

//Routes
import authRouter from '@modules/auth/auth.router'
import  userRouter from '@modules/users/users.router'
import {electionsRouter} from '@modules/elections/elections.router'
import {approvalsRouter} from '@modules/approvals/approvals.router'

const app: Application = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.server.nodeEnv === 'development' ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:true
}));

// ─── Request Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));        // Limit body size — prevents payload attacks
app.use(express.urlencoded({ extended: true }));


// ---------------------------------------------------------------------------
// HTTP request logging
// 'combined' format logs: IP, method, URL, status, response time, user agent.
// Skip logging in test environment to keep test output clean.
// ---------------------------------------------------------------------------
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
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users',userRouter)
app.use('/api/v1/elections', electionsRouter);
app.use('/api/v1/approvals', approvalsRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Throws a NotFoundError which flows into the global error handler below,
// so the response shape is identical to every other error in the system
// instead of being a one-off hardcoded JSON.
app.use(notFound);

// ─── Global Error Handler ──────────────────────────────────────────────────────
// Distinguishes AppError subclasses from Prisma errors, JWT errors, and
// unknown bugs, logs each at the right severity, and never leaks stack
// traces outside development. Must stay registered last.
app.use(errorHandler);

export default app;
