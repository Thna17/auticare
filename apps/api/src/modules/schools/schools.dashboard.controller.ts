import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { SchoolDashboardService } from './schools.dashboard.service.js';

const service = new SchoolDashboardService();

export const getDashboardStats = async (req: Request, res: Response) =>
  ok(res, await service.getDashboard(req.auth!));
