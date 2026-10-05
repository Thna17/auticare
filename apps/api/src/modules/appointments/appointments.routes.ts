import { Router } from 'express';
import { createAppointmentRequestSchema } from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  cancelAppointment,
  createAppointment,
  listAppointments,
  listDoctors,
} from './appointments.controller.js';
export const appointmentsRoutes = Router();
appointmentsRoutes.use(requireAuth);
appointmentsRoutes.get('/', requireRole('PARENT'), listAppointments);
appointmentsRoutes.post(
  '/',
  requireRole('PARENT'),
  validateBody(createAppointmentRequestSchema),
  createAppointment,
);
appointmentsRoutes.patch('/:appointmentId/cancel', requireRole('PARENT'), cancelAppointment);
export const hospitalDoctorsRoutes = Router();
hospitalDoctorsRoutes.use(requireAuth);
hospitalDoctorsRoutes.get('/:hospitalId/doctors', requireRole('PARENT'), listDoctors);
