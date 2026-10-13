import { Router } from 'express';
import { parentDashboardQuerySchema } from '@auticare/contracts';
import { validateQuery } from '../../common/middleware/validate-query.js';
import { requireAuth, requireRole } from '../auth/index.js';
import { getAdminDashboard, getParentDashboard } from './dashboard.controller.js';

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

// GET /api/v1/dashboard/parent
dashboardRoutes.get(
  '/parent',
  requireRole('PARENT'),
  validateQuery(parentDashboardQuerySchema),
  getParentDashboard,
);

// GET /api/v1/dashboard/admin
dashboardRoutes.get('/admin', requireRole('ADMIN'), getAdminDashboard);
