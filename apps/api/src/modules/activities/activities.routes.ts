import { Router } from 'express';
import {
  listActivitiesQuerySchema,
  listActivityProgressQuerySchema,
  startActivityRequestSchema,
  updateActivityProgressRequestSchema,
} from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  listActivities,
  listActivityProgress,
  startActivity,
  updateActivityProgress,
} from './activities.controller.js';

export const activitiesRoutes = Router();

// The catalogue and a child's progress are both parent-facing: the whole point is
// helping a parent support their own child, and ownership is enforced per child
// in the service.
activitiesRoutes.use(requireAuth, requireRole('PARENT'));

/** GET /api/v1/activities — catalogue, optionally narrowed to a child's age. */
activitiesRoutes.get('/', validateQuery(listActivitiesQuerySchema), listActivities);

/** GET /api/v1/activities/progress?childId= — one child's activity history. */
activitiesRoutes.get(
  '/progress',
  validateQuery(listActivityProgressQuerySchema),
  listActivityProgress,
);

/** POST /api/v1/activities/:activityId/start — begin an activity for a child. */
activitiesRoutes.post(
  '/:activityId/start',
  validateBody(startActivityRequestSchema),
  startActivity,
);

/** PATCH /api/v1/activities/progress/:progressId — complete it, or add a note. */
activitiesRoutes.patch(
  '/progress/:progressId',
  validateBody(updateActivityProgressRequestSchema),
  updateActivityProgress,
);
