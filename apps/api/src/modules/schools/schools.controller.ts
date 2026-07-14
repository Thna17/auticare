import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { SchoolsService } from './schools.service.js';

const service = new SchoolsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const getSchoolStaffMe = async (req: Request, res: Response) =>
  ok(res, await service.me(req.auth!));

export const createEnrollment = async (req: Request, res: Response) =>
  created(
    res,
    await service.createEnrollment(req.auth!, requiredParam(req.params.schoolId), req.body),
  );

export const endEnrollment = async (req: Request, res: Response) =>
  ok(
    res,
    await service.endEnrollment(
      req.auth!,
      requiredParam(req.params.schoolId),
      requiredParam(req.params.childId),
    ),
  );

export const listEnrollments = async (req: Request, res: Response) =>
  ok(res, await service.listEnrollments(req.auth!));

export const createActivityReport = async (req: Request, res: Response) =>
  created(res, await service.createActivityReport(req.auth!, req.body));

export const listActivityReports = async (req: Request, res: Response) =>
  ok(res, await service.listActivityReports(req.auth!));
