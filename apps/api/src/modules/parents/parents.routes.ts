import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/index.js';
import { validateBody } from '../../common/middleware/validate.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
import {
  createAdmissionRequestSchema,
  listParentNotificationsQuerySchema,
  paginationQuerySchema,
  updateParentPreferencesRequestSchema,
} from '@auticare/contracts';
import {
  createEnrollmentRequest,
  getParentPreferences,
  listActivityReports,
  listEnrollmentRequests,
  listParentNotifications,
  markAllNotificationsRead,
  archiveNotification,
  markNotificationRead,
  updateParentPreferences,
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

// GET /api/v1/parents/me/admission-requests — alias for parent admission requests.
parentsRoutes.get('/me/admission-requests', requireRole('PARENT'), listEnrollmentRequests);

// GET /api/v1/parents/notifications — the parent's own notifications, newest
// first (includes enrollment decision outcomes).
parentsRoutes.get(
  '/notifications',
  requireRole('PARENT'),
  validateQuery(listParentNotificationsQuerySchema),
  listParentNotifications,
);

// PATCH /api/v1/parents/notifications/read-all
// Mark all notifications for this parent as read.
// Must be registered BEFORE the /:id param route.
parentsRoutes.patch('/notifications/read-all', requireRole('PARENT'), markAllNotificationsRead);

// PATCH /api/v1/parents/notifications/:id/read
// Mark a specific notification as read.
parentsRoutes.patch('/notifications/:id/read', requireRole('PARENT'), markNotificationRead);

// PATCH /api/v1/parents/notifications/:id/archive — hide one from the default list.
parentsRoutes.patch('/notifications/:id/archive', requireRole('PARENT'), archiveNotification);

// GET /api/v1/parents/preferences — load parent preferences
parentsRoutes.get('/preferences', getParentPreferences);

// PATCH /api/v1/parents/preferences — update parent preferences
parentsRoutes.patch(
  '/preferences',
  validateBody(updateParentPreferencesRequestSchema),
  updateParentPreferences,
);
