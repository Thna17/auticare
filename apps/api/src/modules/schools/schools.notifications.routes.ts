import { Router } from 'express';
import { requireRole } from '../auth/index.js';
import { validateBody } from '../../common/middleware/validate.js';
import { decideNotificationRequestSchema, listNotificationsQuerySchema } from '@auticare/contracts';
import {
  decideEnrollmentRequest,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './schools.notifications.controller.js';

// Sub-router mounted inside schoolsRoutes which already applies requireAuth.
export const schoolsNotificationsRoutes = Router();

/**
 * GET /api/v1/schools/notifications
 * Notifications for the authenticated school, newest first, enriched with the
 * sender's name and (for enrollment requests) the linked admission request.
 * Optional query param: isRead (boolean string, e.g. ?isRead=true).
 * Strictly scoped to the staff member's school.
 */
schoolsNotificationsRoutes.get(
  '/notifications',
  requireRole('SCHOOL'),
  (req, _res, next) => {
    // Express 5: req.query is getter-only — validate in place, never reassign.
    listNotificationsQuerySchema.parse(req.query);
    next();
  },
  listNotifications,
);

/**
 * PATCH /api/v1/schools/notifications/read-all
 * Mark all notifications for this school as read.
 * Must be registered BEFORE the /:id param route.
 */
schoolsNotificationsRoutes.patch(
  '/notifications/read-all',
  requireRole('SCHOOL'),
  markAllNotificationsRead,
);

/**
 * PATCH /api/v1/schools/notifications/:id/decision
 * School's decision on an enrollment-request notification.
 * Body: { decision: 'APPROVED' | 'REJECTED' | 'PENDING' }
 * APPROVED/REJECTED also upsert the SchoolChildEnrollment (ACTIVE/REJECTED) so
 * the student appears in the Student Enrollment page immediately.
 */
schoolsNotificationsRoutes.patch(
  '/notifications/:id/decision',
  requireRole('SCHOOL'),
  validateBody(decideNotificationRequestSchema),
  decideEnrollmentRequest,
);

/**
 * PATCH /api/v1/schools/notifications/:id/read
 * Mark a specific notification as read.
 */
schoolsNotificationsRoutes.patch(
  '/notifications/:id/read',
  requireRole('SCHOOL'),
  markNotificationRead,
);
