import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { HospitalManagementService } from './hospital-management.service.js';
const service = new HospitalManagementService();
const param = (value: string | readonly string[] | undefined) => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};
export const me = async (req: Request, res: Response) => ok(res, await service.me(req.auth!));
export const appointments = async (req: Request, res: Response) =>
  ok(res, await service.appointments(req.auth!, req.query));
export const changeStatus = async (req: Request, res: Response) =>
  ok(res, await service.changeStatus(req.auth!, param(req.params.appointmentId), req.body));
export const doctors = async (req: Request, res: Response) =>
  ok(res, await service.doctors(req.auth!));
export const createDoctor = async (req: Request, res: Response) =>
  created(res, await service.createDoctor(req.auth!, req.body));
export const updateDoctor = async (req: Request, res: Response) =>
  ok(res, await service.updateDoctor(req.auth!, param(req.params.doctorId), req.body));
export const deleteDoctor = async (req: Request, res: Response) => {
  await service.deleteDoctor(req.auth!, param(req.params.doctorId));
  res.status(204).send();
};
