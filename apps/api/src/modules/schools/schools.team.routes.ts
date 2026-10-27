import { Router } from 'express';
import {
  assignTeachersRequestSchema,
  createConnectionCodeRequestSchema,
  createTeacherRequestSchema,
} from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { requireRole } from '../auth/index.js';
import {
  assignTeachers,
  createConnectionCode,
  createTeacher,
  deactivateStaff,
  issueSetupCode,
  listConnectionCodes,
  listStaff,
  reactivateStaff,
  revokeConnectionCode,
} from './schools.team.controller.js';

// Sub-router mounted inside schoolsRoutes, which already applies requireAuth.
// Everything except listing staff is limited to the school's ADMIN in the
// service, since only the role on the SchoolStaff row says who that is.
export const schoolsTeamRoutes = Router();

/** GET /api/v1/schools/staff — the school's admin and teachers. */
schoolsTeamRoutes.get('/staff', requireRole('SCHOOL'), listStaff);

/** POST /api/v1/schools/staff — create a teacher (username + setup code). */
schoolsTeamRoutes.post(
  '/staff',
  requireRole('SCHOOL'),
  validateBody(createTeacherRequestSchema),
  createTeacher,
);

/** POST /api/v1/schools/staff/:staffId/setup-code — replace the setup code. */
schoolsTeamRoutes.post('/staff/:staffId/setup-code', requireRole('SCHOOL'), issueSetupCode);

/** POST /api/v1/schools/staff/:staffId/deactivate */
schoolsTeamRoutes.post('/staff/:staffId/deactivate', requireRole('SCHOOL'), deactivateStaff);

/** POST /api/v1/schools/staff/:staffId/reactivate */
schoolsTeamRoutes.post('/staff/:staffId/reactivate', requireRole('SCHOOL'), reactivateStaff);

/** PUT /api/v1/schools/enrollments/:childId/teachers — replace assigned teachers. */
schoolsTeamRoutes.put(
  '/enrollments/:childId/teachers',
  requireRole('SCHOOL'),
  validateBody(assignTeachersRequestSchema),
  assignTeachers,
);

/** GET /api/v1/schools/connection-codes — open and recent family codes. */
schoolsTeamRoutes.get('/connection-codes', requireRole('SCHOOL'), listConnectionCodes);

/** POST /api/v1/schools/connection-codes — a new single-use family code. */
schoolsTeamRoutes.post(
  '/connection-codes',
  requireRole('SCHOOL'),
  validateBody(createConnectionCodeRequestSchema),
  createConnectionCode,
);

/** DELETE /api/v1/schools/connection-codes/:codeId — revoke an open code. */
schoolsTeamRoutes.delete('/connection-codes/:codeId', requireRole('SCHOOL'), revokeConnectionCode);
