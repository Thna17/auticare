import type { Request, Response } from 'express';
import type { ListActivitiesQuery, ListActivityProgressQuery } from '@auticare/contracts';
import { created, ok } from '../../common/http/response.js';
import { validatedQuery } from '../../common/middleware/validate-query.js';
import { ActivitiesService } from './activities.service.js';

const service = new ActivitiesService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listActivities = async (req: Request, res: Response) =>
  ok(res, await service.list(req.auth!, validatedQuery<ListActivitiesQuery>(req)));

export const toggleFavorite = async (req: Request, res: Response) =>
  ok(res, await service.toggleFavorite(req.auth!, requiredParam(req.params.activityId)));

export const listActivityProgress = async (req: Request, res: Response) =>
  ok(
    res,
    await service.listProgress(req.auth!, validatedQuery<ListActivityProgressQuery>(req).childId),
  );

export const startActivity = async (req: Request, res: Response) =>
  created(res, await service.start(req.auth!, requiredParam(req.params.activityId), req.body));

export const updateProgress = async (req: Request, res: Response) =>
  ok(res, await service.updateProgress(req.auth!, requiredParam(req.params.progressId), req.body));
