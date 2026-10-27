import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { HospitalTeamService } from './hospital.team.service.js';

const service = new HospitalTeamService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listHospitalStaff = async (req: Request, res: Response) =>
  ok(res, await service.listStaff(req.auth!));

export const createHospitalStaff = async (req: Request, res: Response) =>
  created(res, await service.createStaff(req.auth!, req.body));

export const issueHospitalStaffSetupCode = async (req: Request, res: Response) =>
  ok(
    res,
    await service.issueSetupCode(req.auth!, requiredParam(req.params.id ?? req.params.staffId)),
  );

export const deactivateHospitalStaff = async (req: Request, res: Response) =>
  ok(
    res,
    await service.deactivateStaff(req.auth!, requiredParam(req.params.id ?? req.params.staffId)),
  );

export const reactivateHospitalStaff = async (req: Request, res: Response) =>
  ok(
    res,
    await service.reactivateStaff(req.auth!, requiredParam(req.params.id ?? req.params.staffId)),
  );
