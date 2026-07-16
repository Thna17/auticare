import { createHospitalRequestSchema } from '@auticare/contracts';
import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import { createHospital, listHospitals } from './hospitals.controller.js';

export const hospitalsRoutes = Router();
hospitalsRoutes.use(requireAuth);
hospitalsRoutes.get('/', listHospitals);
hospitalsRoutes.post(
  '/',
  requireRole('ADMIN'),
  validateBody(createHospitalRequestSchema),
  createHospital,
);
