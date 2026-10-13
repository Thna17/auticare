import { Router } from 'express';
import {
  createAppointmentRequestSchema,
  doctorAvailabilityQuerySchema,
  listAppointmentsQuerySchema,
  rescheduleAppointmentRequestSchema,
} from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  cancelAppointment,
  createAppointment,
  getDoctorSlots,
  listAppointments,
  listDoctors,
  rescheduleAppointment,
} from './appointments.controller.js';

export const appointmentsRoutes = Router();
appointmentsRoutes.use(requireAuth);

appointmentsRoutes.get(
  '/',
  requireRole('PARENT', 'ADMIN'),
  validateQuery(listAppointmentsQuerySchema),
  listAppointments,
);

appointmentsRoutes.post(
  '/',
  requireRole('PARENT'),
  validateBody(createAppointmentRequestSchema),
  createAppointment,
);

appointmentsRoutes.patch(
  '/:appointmentId/reschedule',
  requireRole('PARENT'),
  validateBody(rescheduleAppointmentRequestSchema),
  rescheduleAppointment,
);

appointmentsRoutes.patch('/:appointmentId/cancel', requireRole('PARENT'), cancelAppointment);

appointmentsRoutes.get(
  '/doctors/:doctorId/slots',
  requireRole('PARENT', 'HOSPITAL', 'ADMIN'),
  validateQuery(doctorAvailabilityQuerySchema),
  getDoctorSlots,
);

export const hospitalDoctorsRoutes = Router();
hospitalDoctorsRoutes.use(requireAuth);
hospitalDoctorsRoutes.get('/:hospitalId/doctors', requireRole('PARENT'), listDoctors);
