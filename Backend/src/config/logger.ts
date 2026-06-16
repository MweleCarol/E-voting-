import winston from 'winston';
import { config } from './index';

// Define custom log levels with SECURITY and AUDIT above standard levels
const customLevels = {
  levels: {
    audit: 0,
    security: 1,
    error: 2,
    warn: 3,
    info: 4,
    debug: 5,
  },
  colors: {
    audit: 'magenta',
    security: 'red',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
};

winston.addColors(customLevels.colors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.logging.level,
  format: logFormat,
  transports: [
    // Console output — human-readable in dev
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }),
      ),
    }),
    // Separate file for security events
    new winston.transports.File({
      filename: 'logs/security.log',
      level: 'security',
    }),
    // Separate file for audit events
    new winston.transports.File({
      filename: 'logs/audit.log',
      level: 'audit',
    }),
    // General error log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  ],
});

// Typed helper methods so we don't use logger.log('security', ...) everywhere
export const auditLog = (message: string, meta?: Record<string, unknown>): void => {
  logger.log('audit', message, meta);
};

export const securityLog = (message: string, meta?: Record<string, unknown>): void => {
  logger.log('security', message, meta);
};