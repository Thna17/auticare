import {
  createHospitalAccountRequestSchema,
  createHospitalRequestSchema,
} from '@auticare/contracts';
import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createHospital,
  createHospitalAccount,
  listHospitalAccounts,
  listHospitals,
} from './hospitals.controller.js';

export const hospitalsRoutes = Router();
hospitalsRoutes.use(requireAuth);
hospitalsRoutes.get('/', listHospitals);
hospitalsRoutes.get('/admin/accounts', requireRole('ADMIN'), listHospitalAccounts);
hospitalsRoutes.post(
  '/admin/accounts',
  requireRole('ADMIN'),
  validateBody(createHospitalAccountRequestSchema),
  createHospitalAccount,
);
hospitalsRoutes.post(
  '/',
  requireRole('ADMIN'),
  validateBody(createHospitalRequestSchema),
  createHospital,
);
