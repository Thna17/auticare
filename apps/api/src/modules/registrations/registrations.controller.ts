import type { Request, Response } from 'express';
import { schoolRegistrationStatuses, type SchoolRegistrationStatus } from '@auticare/contracts';
import { AppError } from '../../common/errors/app-error.js';
import { accepted, ok } from '../../common/http/response.js';
import { RegistrationsService } from './registrations.service.js';

const service = new RegistrationsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const submitRegistration = async (req: Request, res: Response) =>
  accepted(res, await service.submit(req.body));

export const listRegistrations = async (req: Request, res: Response) => {
  const { status } = req.query;
  if (status !== undefined && !schoolRegistrationStatuses.includes(status as never)) {
    throw new AppError('VALIDATION_ERROR', 'Unknown registration status.', 400);
  }
  return ok(res, await service.list(req.auth!, status as SchoolRegistrationStatus | undefined));
};

export const getPendingCount = async (req: Request, res: Response) =>
  ok(res, await service.pendingCount(req.auth!));

export const approveRegistration = async (req: Request, res: Response) =>
  ok(res, await service.approve(req.auth!, requiredParam(req.params.id)));

export const rejectRegistration = async (req: Request, res: Response) =>
  ok(res, await service.reject(req.auth!, requiredParam(req.params.id), req.body));
