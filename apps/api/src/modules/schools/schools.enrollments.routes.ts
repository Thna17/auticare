import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireRole } from '../auth/index.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
import { listEnrolledStudentsQuerySchema } from '@auticare/contracts';
import {
  createStudent,
  getEnrollmentStats,
  getEnrolledStudents,
  getLeadSpecialists,
  removeEnrolledStudent,
  updateEnrolledStudent,
} from './schools.enrollments.controller.js';
import {
  createSchoolStudentRequestSchema,
  updateSchoolEnrollmentRequestSchema,
} from '@auticare/contracts';

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
schoolsEnrollmentsRoutes.get(
  '/enrollments/students',
  requireRole('SCHOOL'),
  validateQuery(listEnrolledStudentsQuerySchema),
  getEnrolledStudents,
);

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

/**
 * PATCH /api/v1/schools/enrollments/:childId
 * Edit an enrolled student: child profile fields (firstName, lastName,
 * dateOfBirth, notes...) and/or this school's enrollment (status,
 * leadSpecialistId). Scoped to the authenticated school via the
 * schoolId+childId unique constraint — other schools' rows are untouchable.
 * NOTE: registered AFTER the fixed `/enrollments/students` path so "students"
 * is never captured as a :childId.
 */
schoolsEnrollmentsRoutes.patch(
  '/enrollments/:childId',
  requireRole('SCHOOL'),
  validateBody(updateSchoolEnrollmentRequestSchema),
  updateEnrolledStudent,
);

/**
 * DELETE /api/v1/schools/enrollments/:childId
 * Remove the student FROM THIS SCHOOL: ends (REJECTED + endDate) the
 * enrollment row. The parent-owned Child record is NEVER deleted.
 */
schoolsEnrollmentsRoutes.delete(
  '/enrollments/:childId',
  requireRole('SCHOOL'),
  removeEnrolledStudent,
);
