import type { Server } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './database/prisma.js';

export const SHUTDOWN_TIMEOUT_MS = 15_000;

export interface ShutdownOptions {
  timeoutMs?: number;
  exitProcess?: boolean;
}

let isShuttingDown = false;

export function getIsShuttingDown(): boolean {
  return isShuttingDown;
}

export function resetShutdownState(): void {
  isShuttingDown = false;
}

/**
 * Gracefully shuts down the HTTP server and drains database connections.
 * Enforces a 15-second grace period timeout before aborting.
 */
export async function gracefulShutdown(
  signal: string,
  server?: Server,
  options: ShutdownOptions = {},
): Promise<void> {
  const { timeoutMs = SHUTDOWN_TIMEOUT_MS, exitProcess = true } = options;

  if (isShuttingDown) {
    logger.warn({ signal }, 'Graceful shutdown already in progress');
    return;
  }
  isShuttingDown = true;
  logger.info({ signal }, `Received ${signal}. Initiating graceful shutdown...`);

  // Force exit fallback timer if graceful cleanup exceeds grace period
  const timer = setTimeout(() => {
    logger.error({ timeoutMs, signal }, 'Graceful shutdown timed out. Forcing process exit.');
    if (exitProcess) {
      process.exit(1);
    }
  }, timeoutMs);
  timer.unref();

  try {
    // 1. Stop accepting new HTTP connections and close idle connections
    if (server && server.listening) {
      if (typeof server.closeIdleConnections === 'function') {
        server.closeIdleConnections();
      }

      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error({ err }, 'Error closing HTTP server');
            reject(err);
          } else {
            logger.info('HTTP server closed successfully');
            resolve();
          }
        });
      });
    }

    // 2. Cleanly drain and disconnect Prisma client
    await prisma.$disconnect();
    logger.info('Database connection pool drained and disconnected');

    clearTimeout(timer);
    logger.info('Graceful shutdown completed successfully');

    if (exitProcess) {
      process.exit(0);
    }
  } catch (error) {
    clearTimeout(timer);
    logger.error({ err: error }, 'Error occurred during graceful shutdown');
    if (exitProcess) {
      process.exit(1);
    }
    throw error;
  } finally {
    isShuttingDown = false;
  }
}

/**
 * Registers signal handlers for SIGTERM, SIGINT, and SIGHUP.
 */
export function registerSignalHandlers(server?: Server, options: ShutdownOptions = {}): () => void {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP'];

  const handlers = signals.map((signal) => {
    const handler = () => {
      void gracefulShutdown(signal, server, options);
    };
    process.on(signal, handler);
    return { signal, handler };
  });

  return () => {
    handlers.forEach(({ signal, handler }) => {
      process.off(signal, handler);
    });
  };
}

/**
 * Hooks process uncaughtException and unhandledRejection to Pino logger.
 */
export function setupProcessErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.fatal({ err: error }, 'Uncaught exception encountered');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection encountered');
    process.exit(1);
  });
}

/**
 * Boots the AutiCare API server and attaches signal/error handlers.
 */
export function startServer(port = env.PORT): Server {
  setupProcessErrorHandlers();
  const app = createApp();
  const server = app.listen(port, () => {
    logger.info({ port }, 'AutiCare API listening');
  });
  registerSignalHandlers(server);
  return server;
}

// Auto-start when executed directly as main script
const isMainScript =
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js') ||
    process.argv[1].endsWith('src/server') ||
    process.argv[1].endsWith('dist/server'));

if (isMainScript && process.env.NODE_ENV !== 'test') {
  startServer();
}
