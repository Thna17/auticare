import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
export const healthRoutes = Router();
healthRoutes.get('/live', (_req, res) =>
  res.json({ data: { status: 'live', version: '0.1.0' }, meta: {} }),
);
healthRoutes.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: 'ready', database: 'connected', version: '0.1.0' }, meta: {} });
  } catch {
    res
      .status(503)
      .json({ data: { status: 'not_ready', database: 'unavailable', version: '0.1.0' }, meta: {} });
  }
});
