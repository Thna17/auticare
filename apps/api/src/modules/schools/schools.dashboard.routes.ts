import { Router } from 'express';
import { requireRole } from '../auth/index.js';
import { getDashboardStats } from './schools.dashboard.controller.js';

// Sub-router mounted inside schoolsRoutes which already applies requireAuth.
export const schoolsDashboardRoutes = Router();

/**
 * GET /api/v1/schools/me/dashboard
 * Full dashboard response for the authenticated school.
 * Returns stats, recent reports, reminders, and staff info.
 */
schoolsDashboardRoutes.get('/me/dashboard', requireRole('SCHOOL'), getDashboardStats);
