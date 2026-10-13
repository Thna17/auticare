import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { AppointmentsService } from './appointments.service.js';
import type { DoctorAvailabilityQuery, ListAppointmentsQuery } from '@auticare/contracts';
import { validatedQuery } from '../../common/middleware/validate-query.js';

const service = new AppointmentsService();
const param = (value: string | readonly string[] | undefined) => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listDoctors = async (req: Request, res: Response) =>
  ok(res, await service.listDoctors(req.auth!, param(req.params.hospitalId)));

export const getDoctorSlots = async (req: Request, res: Response) =>
  ok(
    res,
    await service.getDoctorSlots(
      req.auth!,
      param(req.params.doctorId),
      validatedQuery<DoctorAvailabilityQuery>(req),
    ),
  );

export const createAppointment = async (req: Request, res: Response) =>
  created(res, await service.create(req.auth!, req.body));

export const rescheduleAppointment = async (req: Request, res: Response) =>
  ok(res, await service.reschedule(req.auth!, param(req.params.appointmentId), req.body));

export const listAppointments = async (req: Request, res: Response) =>
  ok(res, await service.list(req.auth!, validatedQuery<ListAppointmentsQuery>(req)));

export const cancelAppointment = async (req: Request, res: Response) =>
  ok(res, await service.cancel(req.auth!, param(req.params.appointmentId)));
