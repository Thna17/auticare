import { Router } from 'express';
import { doctorRequestSchema, updateAppointmentStatusRequestSchema } from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  appointments,
  changeStatus,
  createDoctor,
  deleteDoctor,
  doctors,
  me,
  updateDoctor,
} from './hospital-management.controller.js';
export const hospitalManagementRoutes = Router();
hospitalManagementRoutes.use(requireAuth, requireRole('HOSPITAL'));
hospitalManagementRoutes.get('/me', me);
hospitalManagementRoutes.get('/appointments', appointments);
hospitalManagementRoutes.patch(
  '/appointments/:appointmentId/status',
  validateBody(updateAppointmentStatusRequestSchema),
  changeStatus,
);
hospitalManagementRoutes.get('/doctors', doctors);
hospitalManagementRoutes.post('/doctors', validateBody(doctorRequestSchema), createDoctor);
hospitalManagementRoutes.patch(
  '/doctors/:doctorId',
  validateBody(doctorRequestSchema.partial()),
  updateDoctor,
);
hospitalManagementRoutes.delete('/doctors/:doctorId', deleteDoctor);
