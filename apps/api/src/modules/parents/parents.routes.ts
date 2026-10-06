import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/index.js';
import { validateBody } from '../../common/middleware/validate.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
import {
  createAdmissionRequestSchema,
  listParentNotificationsQuerySchema,
  paginationQuerySchema,
} from '@auticare/contracts';
import {
  createEnrollmentRequest,
  listActivityReports,
  listEnrollmentRequests,
  listParentNotifications,
} from './parents.controller.js';

export const parentsRoutes = Router();
parentsRoutes.use(requireAuth);

// GET /api/v1/parents/activity-reports/:childId
// Full path is /api/v1/parents/... — app.ts mounts at /api/v1/parents.
parentsRoutes.get(
  '/activity-reports/:childId',
  requireRole('PARENT'),
  validateQuery(paginationQuerySchema),
  listActivityReports,
);

// POST /api/v1/parents/enrollment-requests — request enrollment of one of the
// parent's children at a school. Creates the AdmissionRequest plus the
// school-facing ENROLLMENT_REQUEST notification.
parentsRoutes.post(
  '/enrollment-requests',
  requireRole('PARENT'),
  validateBody(createAdmissionRequestSchema),
  createEnrollmentRequest,
);

// GET /api/v1/parents/enrollment-requests — the parent's own requests.
parentsRoutes.get('/enrollment-requests', requireRole('PARENT'), listEnrollmentRequests);

// GET /api/v1/parents/notifications — the parent's own notifications, newest
// first (includes enrollment decision outcomes).
parentsRoutes.get(
  '/notifications',
  requireRole('PARENT'),
  validateQuery(listParentNotificationsQuerySchema),
  listParentNotifications,
);
