import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { ParentsService } from './parents.service.js';

const service = new ParentsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listActivityReports = async (req: Request, res: Response) =>
  ok(res, await service.listActivityReports(req.auth!, requiredParam(req.params.childId)));

export const createEnrollmentRequest = async (req: Request, res: Response) =>
  ok(res, await service.createEnrollmentRequest(req.auth!, req.body));

export const listEnrollmentRequests = async (req: Request, res: Response) =>
  ok(res, await service.listEnrollmentRequests(req.auth!));

export const listParentNotifications = async (req: Request, res: Response) =>
  ok(res, await service.listNotifications(req.auth!));
