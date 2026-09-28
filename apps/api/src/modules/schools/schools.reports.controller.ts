import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { SchoolsReportsService } from './schools.reports.service.js';

const service = new SchoolsReportsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const createReport = async (req: Request, res: Response) =>
  created(res, await service.createReport(req.auth!, req.body));

export const listReports = async (req: Request, res: Response) =>
  ok(res, await service.listReports(req.auth!, req.query as Record<string, string | undefined>));

export const getReportById = async (req: Request, res: Response) =>
  ok(res, await service.getReportById(req.auth!, requiredParam(req.params.id)));

export const updateReport = async (req: Request, res: Response) =>
  ok(res, await service.updateReport(req.auth!, requiredParam(req.params.id), req.body));
