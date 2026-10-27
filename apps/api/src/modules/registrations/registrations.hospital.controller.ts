import type { Request, Response } from 'express';
import { hospitalRegistrationStatuses, type HospitalRegistrationStatus } from '@auticare/contracts';
import { AppError } from '../../common/errors/app-error.js';
import { accepted, ok } from '../../common/http/response.js';
import { RegistrationsHospitalService } from './registrations.hospital.service.js';

const service = new RegistrationsHospitalService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const submitHospitalRegistration = async (req: Request, res: Response) =>
  accepted(res, await service.submit(req.body));

export const listHospitalRegistrations = async (req: Request, res: Response) => {
  const { status } = req.query;
  if (status !== undefined && !hospitalRegistrationStatuses.includes(status as never)) {
    throw new AppError('VALIDATION_ERROR', 'Unknown registration status.', 400);
  }
  return ok(res, await service.list(req.auth!, status as HospitalRegistrationStatus | undefined));
};

export const getHospitalPendingCount = async (req: Request, res: Response) =>
  ok(res, await service.pendingCount(req.auth!));

export const approveHospitalRegistration = async (req: Request, res: Response) =>
  ok(res, await service.approve(req.auth!, requiredParam(req.params.id)));

export const rejectHospitalRegistration = async (req: Request, res: Response) =>
  ok(res, await service.reject(req.auth!, requiredParam(req.params.id), req.body));
