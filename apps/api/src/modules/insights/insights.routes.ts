import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/index.js';
import { getChildInsight } from './insights.controller.js';

export const insightsRoutes = Router();

insightsRoutes.use(requireAuth, requireRole('PARENT'));

/**
 * GET /api/v1/insights/children/:childId?days=28&tzOffset=420
 *
 * `tzOffset` is the browser's minutes east of UTC. It is required for weekday and
 * time-of-day clustering to be right: a 2am waking in Phnom Penh must not be
 * filed under the previous evening.
 */
insightsRoutes.get('/children/:childId', getChildInsight);
