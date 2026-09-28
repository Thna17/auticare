import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireRole } from '../auth/index.js';
import {
  createStudent,
  getEnrollmentStats,
  getEnrolledStudents,
  getLeadSpecialists,
} from './schools.enrollments.controller.js';
import { createSchoolStudentRequestSchema } from '@auticare/contracts';

// Sub-router mounted inside schoolsRoutes which already applies requireAuth.
export const schoolsEnrollmentsRoutes = Router();

/**
 * GET /api/v1/schools/enrollments/stats
 * Returns dashboard statistics: total students, active programs, average progress,
 * needs attention count, etc. Strictly scoped to the authenticated school.
 */
schoolsEnrollmentsRoutes.get('/enrollments/stats', requireRole('SCHOOL'), getEnrollmentStats);

/**
 * GET /api/v1/schools/enrollments/students
 * Returns paginated enrolled students with child info, lead specialist,
 * communication progress, and enrollment status.
 * Query params: page, limit, status, specialistId, search
 */
schoolsEnrollmentsRoutes.get('/enrollments/students', requireRole('SCHOOL'), getEnrolledStudents);

/**
 * GET /api/v1/schools/enrollments/specialists
 * Returns list of staff members (lead specialists) for the filter dropdown.
 */
schoolsEnrollmentsRoutes.get('/enrollments/specialists', requireRole('SCHOOL'), getLeadSpecialists);

/**
 * POST /api/v1/schools/enrollments/students
 * Creates a new student: guardian account (Parent), child profile, and
 * a PENDING enrollment linking the child to the authenticated school.
 */
schoolsEnrollmentsRoutes.post(
  '/enrollments/students',
  requireRole('SCHOOL'),
  validateBody(createSchoolStudentRequestSchema),
  createStudent,
);
