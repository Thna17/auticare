import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
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
  deleteActivityReport,
  listEnrollments,
  listSchoolCities,
  listSchools,
  updateMySchool,
  updateSchool,
} from './schools.controller.js';
import {
  createSchoolAccountRequestSchema,
  createActivityReportRequestSchema,
  createSchoolChildEnrollmentRequestSchema,
  updateSchoolProfileRequestSchema,
  updateSchoolRequestSchema,
} from './schools.schemas.js';
import { parentSchoolSearchQuerySchema } from '@auticare/contracts';
import { schoolsProfileRoutes } from './schools.profile.routes.js';
import { schoolsStudentsRoutes } from './schools.students.routes.js';
import { schoolsReportsRoutes } from './schools.reports.routes.js';
import { schoolsNotificationsRoutes } from './schools.notifications.routes.js';
import { schoolsDashboardRoutes } from './schools.dashboard.routes.js';
import { schoolsEnrollmentsRoutes } from './schools.enrollments.routes.js';
import {
  uploadMiddleware,
  uploadPhotosMiddleware,
  uploadActivityFiles,
  uploadActivityPhotos,
} from '../uploads/uploads.controller.js';

export const schoolsRoutes = Router();
schoolsRoutes.use(requireAuth);

// Directory listing (parents/admins).
schoolsRoutes.get(
  '/',
  requireRole('PARENT', 'ADMIN'),
  validateQuery(parentSchoolSearchQuerySchema),
  listSchools,
);
// Distinct provinces (stored in the city column) for the filter dropdown.
schoolsRoutes.get('/cities', requireRole('PARENT', 'ADMIN'), listSchoolCities);

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

// School profile (my-profile).
schoolsRoutes.use(schoolsProfileRoutes);

// School students.
schoolsRoutes.use(schoolsStudentsRoutes);

// Activity reports.
schoolsRoutes.use(schoolsReportsRoutes);

// School notifications.
schoolsRoutes.use(schoolsNotificationsRoutes);

// School dashboard stats.
schoolsRoutes.use(schoolsDashboardRoutes);

// School enrollments (stats, student list, specialists).
schoolsRoutes.use(schoolsEnrollmentsRoutes);

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
  validateBody(createActivityReportRequestSchema),
  createActivityReport,
);
schoolsRoutes.delete('/activity-reports/:id', requireRole('SCHOOL'), deleteActivityReport);
schoolsRoutes.post(
  '/upload/activity-photos',
  requireRole('SCHOOL'),
  uploadPhotosMiddleware,
  uploadActivityPhotos,
);
schoolsRoutes.post(
  '/upload/activity-files',
  requireRole('SCHOOL'),
  uploadMiddleware,
  uploadActivityFiles,
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
