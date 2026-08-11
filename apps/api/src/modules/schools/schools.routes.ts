import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createActivityReport,
  createSchoolAccount,
  createEnrollment,
  endEnrollment,
  getMySchool,
  getSchoolById,
  getSchoolStaffMe,
  listSchoolAccounts,
  listActivityReports,
  listEnrollments,
  listSchools,
  updateMySchool,
  updateSchool,
} from './schools.controller.js';
import {
  createSchoolAccountRequestSchema,
  createSchoolActivityReportRequestSchema,
  createSchoolChildEnrollmentRequestSchema,
  updateSchoolProfileRequestSchema,
  updateSchoolRequestSchema,
} from './schools.schemas.js';

export const schoolsRoutes = Router();
schoolsRoutes.use(requireAuth);

// Directory listing (parents/admins).
schoolsRoutes.get('/', requireRole('PARENT', 'ADMIN'), listSchools);

// School-owned profile (scoped to the caller's own school via SchoolStaff, not by id).
// Registered before the `/:id` / `/:schoolId` param routes so "me" is never treated as an id.
schoolsRoutes.get('/me', requireRole('SCHOOL'), getMySchool);
schoolsRoutes.patch(
  '/me',
  requireRole('SCHOOL'),
  validateBody(updateSchoolProfileRequestSchema),
  updateMySchool,
);
schoolsRoutes.get('/staff/me', requireRole('SCHOOL'), getSchoolStaffMe);

// Admin account management.
schoolsRoutes.get('/admin/accounts', requireRole('ADMIN'), listSchoolAccounts);
schoolsRoutes.post(
  '/admin/accounts',
  requireRole('ADMIN'),
  validateBody(createSchoolAccountRequestSchema),
  createSchoolAccount,
);

// Enrollments & activity reports (fixed-path routes registered before param routes).
schoolsRoutes.get('/enrollments', requireRole('PARENT', 'SCHOOL'), listEnrollments);
schoolsRoutes.get(
  '/activity-reports',
  requireRole('PARENT', 'SCHOOL', 'ADMIN'),
  listActivityReports,
);
schoolsRoutes.post(
  '/activity-reports',
  requireRole('SCHOOL'),
  validateBody(createSchoolActivityReportRequestSchema),
  createActivityReport,
);
schoolsRoutes.post(
  '/:schoolId/enrollments',
  requireRole('PARENT', 'ADMIN'),
  validateBody(createSchoolChildEnrollmentRequestSchema),
  createEnrollment,
);
schoolsRoutes.delete(
  '/:schoolId/enrollments/:childId',
  requireRole('PARENT', 'ADMIN'),
  endEnrollment,
);
schoolsRoutes.patch(
  '/:schoolId',
  requireRole('ADMIN'),
  validateBody(updateSchoolRequestSchema),
  updateSchool,
);

// Public read-only detail (any authenticated account). Registered LAST so it never
// shadows the fixed-path GETs above.
schoolsRoutes.get('/:id', requireRole('PARENT', 'ADMIN', 'SCHOOL'), getSchoolById);
