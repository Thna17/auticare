import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createActivityReport,
  createSchoolAccount,
  createEnrollment,
  endEnrollment,
  getSchoolStaffMe,
  listSchoolAccounts,
  listActivityReports,
  listEnrollments,
  listSchools,
  updateSchool,
} from './schools.controller.js';
import {
  createSchoolAccountRequestSchema,
  createSchoolActivityReportRequestSchema,
  createSchoolChildEnrollmentRequestSchema,
  updateSchoolRequestSchema,
} from './schools.schemas.js';

export const schoolsRoutes = Router();
schoolsRoutes.use(requireAuth);
schoolsRoutes.get('/', requireRole('PARENT', 'ADMIN'), listSchools);
schoolsRoutes.get('/admin/accounts', requireRole('ADMIN'), listSchoolAccounts);
schoolsRoutes.post(
  '/admin/accounts',
  requireRole('ADMIN'),
  validateBody(createSchoolAccountRequestSchema),
  createSchoolAccount,
);
schoolsRoutes.get('/staff/me', requireRole('SCHOOL'), getSchoolStaffMe);
schoolsRoutes.get('/enrollments', requireRole('PARENT', 'SCHOOL'), listEnrollments);
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
