import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { AppointmentsService } from './appointments.service.js';
const service = new AppointmentsService();
const param = (value: string | readonly string[] | undefined) => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};
export const listDoctors = async (req: Request, res: Response) =>
  ok(res, await service.listDoctors(req.auth!, param(req.params.hospitalId)));
export const createAppointment = async (req: Request, res: Response) =>
  created(res, await service.create(req.auth!, req.body));
export const listAppointments = async (req: Request, res: Response) =>
  ok(res, await service.list(req.auth!));
export const cancelAppointment = async (req: Request, res: Response) =>
  ok(res, await service.cancel(req.auth!, param(req.params.appointmentId)));
