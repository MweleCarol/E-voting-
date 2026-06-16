import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';

// Prevent multiple instances during hot reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const createPrismaClient = (): PrismaClient => {
  const adapter = new PrismaPg({
    connectionString: config.database.url,
  });
  return new PrismaClient({ adapter });
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
  logger.info('Database connected successfully');
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};
