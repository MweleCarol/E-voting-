import 'dotenv/config'


import { config } from '@config/index.js';
import { logger } from '@config/logger';
import app from './app';

const startServer = async (): Promise<void> => {
  try {
    const server = app.listen(config.server.port, () => {
      logger.info(` Backend running`, {
        port: config.server.port,
        environment: config.server.nodeEnv,
        version: config.server.apiVersion,
      });
    });

    // ─── Graceful Shutdown ───────────────────────────────────────────────────
    const shutdown = (signal: string): void => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ─── Unhandled Rejections ────────────────────────────────────────────────
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection', { reason });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();