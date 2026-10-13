import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SHUTDOWN_TIMEOUT_MS,
  getIsShuttingDown,
  gracefulShutdown,
  registerSignalHandlers,
  resetShutdownState,
  setupProcessErrorHandlers,
} from './server.js';
import { disconnectPrisma, prisma } from './database/prisma.js';

describe('Server Lifecycle & Graceful Shutdown', () => {
  beforeEach(() => {
    resetShutdownState();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetShutdownState();
    vi.restoreAllMocks();
  });

  describe('gracefulShutdown', () => {
    it('closes HTTP server, disconnects Prisma, and does not exit process when exitProcess=false', async () => {
      const mockServer = {
        listening: true,
        close: vi.fn((cb?: (err?: Error) => void) => {
          if (cb) cb();
          return mockServer;
        }),
        closeIdleConnections: vi.fn(),
      } as unknown as Server;

      const disconnectSpy = vi.spyOn(prisma, '$disconnect').mockResolvedValue();

      await gracefulShutdown('SIGTERM', mockServer, { exitProcess: false });

      expect(mockServer.closeIdleConnections).toHaveBeenCalled();
      expect(mockServer.close).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
      expect(getIsShuttingDown()).toBe(false);
    });

    it('gracefully handles server that is already closed or not listening', async () => {
      const mockServer = {
        listening: false,
        close: vi.fn(),
        closeIdleConnections: vi.fn(),
      } as unknown as Server;

      const disconnectSpy = vi.spyOn(prisma, '$disconnect').mockResolvedValue();

      await gracefulShutdown('SIGINT', mockServer, { exitProcess: false });

      expect(mockServer.close).not.toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('works when no server instance is passed', async () => {
      const disconnectSpy = vi.spyOn(prisma, '$disconnect').mockResolvedValue();

      await gracefulShutdown('SIGHUP', undefined, { exitProcess: false });

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('ignores concurrent duplicate shutdown calls', async () => {
      const mockServer = {
        listening: true,
        close: vi.fn((cb?: (err?: Error) => void) => {
          setTimeout(() => cb && cb(), 50);
          return mockServer;
        }),
        closeIdleConnections: vi.fn(),
      } as unknown as Server;

      const disconnectSpy = vi.spyOn(prisma, '$disconnect').mockResolvedValue();

      // Trigger first shutdown
      const p1 = gracefulShutdown('SIGTERM', mockServer, { exitProcess: false });
      expect(getIsShuttingDown()).toBe(true);

      // Trigger duplicate concurrent shutdown
      const p2 = gracefulShutdown('SIGTERM', mockServer, { exitProcess: false });

      await Promise.all([p1, p2]);

      expect(mockServer.close).toHaveBeenCalledTimes(1);
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(getIsShuttingDown()).toBe(false);
    });

    it('handles server close error and throws', async () => {
      const closeError = new Error('Failed to close server');
      const mockServer = {
        listening: true,
        close: vi.fn((cb?: (err?: Error) => void) => {
          if (cb) cb(closeError);
          return mockServer;
        }),
      } as unknown as Server;

      await expect(gracefulShutdown('SIGTERM', mockServer, { exitProcess: false })).rejects.toThrow(
        'Failed to close server',
      );
      expect(getIsShuttingDown()).toBe(false);
    });

    it('handles Prisma disconnect error and throws', async () => {
      const dbError = new Error('Database disconnect timeout');
      vi.spyOn(prisma, '$disconnect').mockRejectedValue(dbError);

      await expect(gracefulShutdown('SIGTERM', undefined, { exitProcess: false })).rejects.toThrow(
        'Database disconnect timeout',
      );
      expect(getIsShuttingDown()).toBe(false);
    });

    it('has SHUTDOWN_TIMEOUT_MS set to 15 seconds (15000 ms)', () => {
      expect(SHUTDOWN_TIMEOUT_MS).toBe(15_000);
    });
  });

  describe('registerSignalHandlers', () => {
    it('registers handlers for SIGTERM, SIGINT, and SIGHUP, and cleans them up', () => {
      const onSpy = vi.spyOn(process, 'on');
      const offSpy = vi.spyOn(process, 'off');

      const cleanup = registerSignalHandlers(undefined, { exitProcess: false });

      expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('SIGHUP', expect.any(Function));

      cleanup();

      expect(offSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(offSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(offSpy).toHaveBeenCalledWith('SIGHUP', expect.any(Function));
    });
  });

  describe('setupProcessErrorHandlers', () => {
    it('registers process listeners for uncaughtException and unhandledRejection', () => {
      const onSpy = vi.spyOn(process, 'on');

      setupProcessErrorHandlers();

      expect(onSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });
  });

  describe('disconnectPrisma helper', () => {
    it('calls prisma.$disconnect and resolves', async () => {
      const disconnectSpy = vi.spyOn(prisma, '$disconnect').mockResolvedValue();

      await expect(disconnectPrisma()).resolves.toBeUndefined();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });

    it('propagates error when prisma.$disconnect fails', async () => {
      const error = new Error('Prisma disconnect connection failed');
      vi.spyOn(prisma, '$disconnect').mockRejectedValue(error);

      await expect(disconnectPrisma()).rejects.toThrow('Prisma disconnect connection failed');
    });
  });
});
