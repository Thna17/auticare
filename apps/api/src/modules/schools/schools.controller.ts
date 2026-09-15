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

export const listSchools = async (req: Request, res: Response) =>
  ok(res, await service.listSchools(req.auth!));

export const getMySchool = async (req: Request, res: Response) =>
  ok(res, await service.getMySchool(req.auth!));

export const updateMySchool = async (req: Request, res: Response) =>
  ok(res, await service.updateMySchool(req.auth!, req.body));

export const getSchoolById = async (req: Request, res: Response) =>
  ok(res, await service.getSchoolById(req.auth!, requiredParam(req.params.id)));

export const createSchoolAccount = async (req: Request, res: Response) =>
  created(res, await service.createSchoolAccount(req.auth!, req.body));

export const listSchoolAccounts = async (req: Request, res: Response) =>
  ok(res, await service.listSchoolAccounts(req.auth!));

export const updateSchool = async (req: Request, res: Response) =>
  ok(res, await service.updateSchool(req.auth!, requiredParam(req.params.schoolId), req.body));

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
