import { PrismaClient, type Prisma } from '@prisma/client';
import { env, isProduction } from '../config/env.js';
import { logger } from '../config/logger.js';

const logLevels: Prisma.LogLevel[] = isProduction
  ? ['error']
  : env.NODE_ENV === 'test'
    ? ['error']
    : ['info', 'warn', 'error'];

if (!isProduction && env.NODE_ENV !== 'test') {
  logger.info(
    { nodeEnv: env.NODE_ENV, logLevels },
    'Prisma database client configured with development logging',
  );
}

export const prisma = new PrismaClient({
  log: logLevels,
});

/**
 * Cleanly disconnects the Prisma client connection pool.
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection pool drained and disconnected');
  } catch (error) {
    logger.error({ error }, 'Failed to cleanly disconnect Prisma client');
    throw error;
  }
}

export const disconnectDatabase = disconnectPrisma;
