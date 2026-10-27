import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { SchoolTeamService } from './schools.team.service.js';

const service = new SchoolTeamService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listStaff = async (req: Request, res: Response) =>
  ok(res, await service.listStaff(req.auth!));

export const createTeacher = async (req: Request, res: Response) =>
  created(res, await service.createTeacher(req.auth!, req.body));

export const issueSetupCode = async (req: Request, res: Response) =>
  ok(res, await service.issueSetupCode(req.auth!, requiredParam(req.params.staffId)));

export const deactivateStaff = async (req: Request, res: Response) =>
  ok(res, await service.deactivateStaff(req.auth!, requiredParam(req.params.staffId)));

export const reactivateStaff = async (req: Request, res: Response) =>
  ok(res, await service.reactivateStaff(req.auth!, requiredParam(req.params.staffId)));

export const assignTeachers = async (req: Request, res: Response) =>
  ok(res, await service.assignTeachers(req.auth!, requiredParam(req.params.childId), req.body));

export const listConnectionCodes = async (req: Request, res: Response) =>
  ok(res, await service.listConnectionCodes(req.auth!));

export const createConnectionCode = async (req: Request, res: Response) =>
  created(res, await service.createConnectionCode(req.auth!, req.body));

export const revokeConnectionCode = async (req: Request, res: Response) =>
  ok(res, await service.revokeConnectionCode(req.auth!, requiredParam(req.params.codeId)));
