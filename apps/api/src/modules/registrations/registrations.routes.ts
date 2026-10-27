import { Router } from 'express';
import {
  hospitalRegistrationRequestSchema,
  rejectHospitalRegistrationRequestSchema,
  rejectSchoolRegistrationRequestSchema,
  schoolRegistrationRequestSchema,
} from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { schoolRegistrationRateLimit } from '../../common/security/rate-limits.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  approveRegistration,
  getPendingCount,
  listRegistrations,
  rejectRegistration,
  submitRegistration,
} from './registrations.controller.js';
import {
  approveHospitalRegistration,
  getHospitalPendingCount,
  listHospitalRegistrations,
  rejectHospitalRegistration,
  submitHospitalRegistration,
} from './registrations.hospital.controller.js';

/** Public route for schools submitting a registration request. */
export const schoolRegistrationPublicRoutes = Router();

schoolRegistrationPublicRoutes.post(
  '/',
  schoolRegistrationRateLimit,
  validateBody(schoolRegistrationRequestSchema),
  submitRegistration,
);

/** Admin-only routes for reviewing and approving/rejecting registration requests. */
export const schoolRegistrationAdminRoutes = Router();

schoolRegistrationAdminRoutes.use(requireAuth, requireRole('ADMIN'));

schoolRegistrationAdminRoutes.get('/', listRegistrations);
schoolRegistrationAdminRoutes.get('/pending-count', getPendingCount);
schoolRegistrationAdminRoutes.post('/:id/approve', approveRegistration);
schoolRegistrationAdminRoutes.post(
  '/:id/reject',
  validateBody(rejectSchoolRegistrationRequestSchema),
  rejectRegistration,
);

/** Public route for hospitals submitting a registration request. */
export const hospitalRegistrationPublicRoutes = Router();

hospitalRegistrationPublicRoutes.post(
  '/',
  schoolRegistrationRateLimit,
  validateBody(hospitalRegistrationRequestSchema),
  submitHospitalRegistration,
);

/** Admin-only routes for reviewing and approving/rejecting hospital registration requests. */
export const hospitalRegistrationAdminRoutes = Router();

hospitalRegistrationAdminRoutes.use(requireAuth, requireRole('ADMIN'));

hospitalRegistrationAdminRoutes.get('/', listHospitalRegistrations);
hospitalRegistrationAdminRoutes.get('/pending-count', getHospitalPendingCount);
hospitalRegistrationAdminRoutes.post('/:id/approve', approveHospitalRegistration);
hospitalRegistrationAdminRoutes.post(
  '/:id/reject',
  validateBody(rejectHospitalRegistrationRequestSchema),
  rejectHospitalRegistration,
);
