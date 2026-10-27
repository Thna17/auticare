import { Router } from 'express';
import { createHospitalStaffRequestSchema } from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createHospitalStaff,
  deactivateHospitalStaff,
  issueHospitalStaffSetupCode,
  listHospitalStaff,
  reactivateHospitalStaff,
} from './hospital.team.controller.js';

export const hospitalTeamRoutes = Router();
hospitalTeamRoutes.use(requireAuth);

hospitalTeamRoutes.get('/staff', requireRole('HOSPITAL'), listHospitalStaff);

hospitalTeamRoutes.post(
  '/staff',
  requireRole('HOSPITAL'),
  validateBody(createHospitalStaffRequestSchema),
  createHospitalStaff,
);

hospitalTeamRoutes.post(
  '/staff/:id/setup-code',
  requireRole('HOSPITAL'),
  issueHospitalStaffSetupCode,
);

hospitalTeamRoutes.post('/staff/:id/deactivate', requireRole('HOSPITAL'), deactivateHospitalStaff);

hospitalTeamRoutes.post('/staff/:id/reactivate', requireRole('HOSPITAL'), reactivateHospitalStaff);
