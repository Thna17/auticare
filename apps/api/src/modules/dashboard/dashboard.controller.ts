import type { Request, Response } from 'express';
import type { ParentDashboardQuery } from '@auticare/contracts';
import { validatedQuery } from '../../common/middleware/validate-query.js';
import { ok } from '../../common/http/response.js';
import { dashboardService } from './dashboard.service.js';

export const getParentDashboard = async (req: Request, res: Response) => {
  const query = validatedQuery<ParentDashboardQuery>(req);
  const result = await dashboardService.getParentDashboard(req.auth!, query?.childId);
  return ok(res, result);
};

export const getAdminDashboard = async (req: Request, res: Response) => {
  const result = await dashboardService.getAdminDashboard(req.auth!);
  return ok(res, result);
};
