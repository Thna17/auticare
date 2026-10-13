import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { env } from '../../config/env.js';

export const healthRoutes = Router();

healthRoutes.get('/live', (_req, res) => {
  res.json({
    data: {
      status: 'live',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    },
    meta: {},
  });
});

healthRoutes.get('/startup', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      data: {
        status: 'started',
        database: 'connected',
        version: '0.1.0',
      },
      meta: {},
    });
  } catch {
    res.status(503).json({
      data: {
        status: 'startup_failed',
        database: 'unavailable',
        version: '0.1.0',
      },
      meta: {},
    });
  }
});

healthRoutes.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      data: {
        status: 'ready',
        database: 'connected',
        storage: env.STORAGE_DRIVER,
        version: '0.1.0',
      },
      meta: {},
    });
  } catch {
    res.status(503).json({
      data: {
        status: 'not_ready',
        database: 'unavailable',
        version: '0.1.0',
      },
      meta: {},
    });
  }
});

healthRoutes.get('/metrics', (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    data: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryBytes: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
      },
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      version: '0.1.0',
    },
    meta: {},
  });
});
