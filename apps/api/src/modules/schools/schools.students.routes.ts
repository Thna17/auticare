import { Router } from 'express';
import { requireRole } from '../auth/index.js';
import { listMyStudents, listEnrolledStudents } from './schools.students.controller.js';

// Sub-router mounted inside schoolsRoutes which already applies requireAuth.
export const schoolsStudentsRoutes = Router();

/**
 * GET /api/v1/schools/my-students
 * Returns a list of children currently enrolled (ACTIVE or PENDING) in the
 * authenticated staff member's school. Includes the child's basic info
 * (firstName, dateOfBirth), the enrollment status, and the start date.
 *
 * Strict data isolation: the schoolId is derived from the SchoolStaff record
 * linked to the caller's session — no schoolId parameter is accepted.
 */
schoolsStudentsRoutes.get('/my-students', requireRole('SCHOOL'), listMyStudents);

/**
 * GET /api/v1/schools/enrolled-students
 * Student picker for the activity report form: ACTIVE enrollments with
 * firstName, guardian lastName, dateOfBirth, and a server-computed age.
 */
schoolsStudentsRoutes.get('/enrolled-students', requireRole('SCHOOL'), listEnrolledStudents);
