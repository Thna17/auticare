import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createActivityReport,
  createEnrollment,
  endEnrollment,
  getSchoolStaffMe,
  listActivityReports,
  listEnrollments,
} from './schools.controller.js';
import {
  createSchoolActivityReportRequestSchema,
  createSchoolChildEnrollmentRequestSchema,
} from './schools.schemas.js';

export const schoolsRoutes = Router();
schoolsRoutes.use(requireAuth);
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
schoolsRoutes.get('/activity-reports', requireRole('PARENT', 'SCHOOL'), listActivityReports);
schoolsRoutes.post(
  '/activity-reports',
  requireRole('SCHOOL'),
  validateBody(createSchoolActivityReportRequestSchema),
  createActivityReport,
);
