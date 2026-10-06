import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { validatedQuery } from '../../common/middleware/validate-query.js';
import type { PaginationQuery, ParentSchoolSearchQuery } from '@auticare/contracts';
import { SchoolsService } from './schools.service.js';

const service = new SchoolsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

/**
 * Search filters, already parsed by validateQuery on the route. Undefined keys
 * are dropped rather than passed through, because exactOptionalPropertyTypes
 * distinguishes an absent key from one set to undefined.
 */
const searchFilters = (req: Request): ParentSchoolSearchQuery => {
  const parsed = validatedQuery<ParentSchoolSearchQuery>(req);
  return {
    // page and limit always have values — the schema defaults them.
    page: parsed.page,
    limit: parsed.limit,
    ...(parsed.search !== undefined && { search: parsed.search }),
    ...(parsed.province !== undefined && { province: parsed.province }),
    ...(parsed.availability !== undefined && { availability: parsed.availability }),
    ...(parsed.specializations !== undefined && { specializations: parsed.specializations }),
  };
};

export const getSchoolStaffMe = async (req: Request, res: Response) =>
  ok(res, await service.me(req.auth!));

export const listSchools = async (req: Request, res: Response) =>
  ok(res, await service.listSchools(req.auth!, searchFilters(req)));

export const listSchoolCities = async (req: Request, res: Response) =>
  ok(res, await service.listSchoolCities(req.auth!));

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
  ok(res, await service.listActivityReports(req.auth!, validatedQuery<PaginationQuery>(req)));

export const deleteActivityReport = async (req: Request, res: Response) =>
  ok(res, await service.deleteActivityReport(req.auth!, requiredParam(req.params.id)));
