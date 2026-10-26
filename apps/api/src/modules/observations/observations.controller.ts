import type { Request, Response } from 'express';
import type { ListObservationsQuery } from '@auticare/contracts';
import { created, ok } from '../../common/http/response.js';
import { validatedQuery } from '../../common/middleware/validate-query.js';
import { ObservationsService } from './observations.service.js';

const service = new ObservationsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listObservations = async (req: Request, res: Response) =>
  ok(res, await service.list(req.auth!, validatedQuery<ListObservationsQuery>(req)));

export const createObservation = async (req: Request, res: Response) =>
  created(res, await service.create(req.auth!, req.body));

export const updateObservation = async (req: Request, res: Response) =>
  ok(res, await service.update(req.auth!, requiredParam(req.params.id), req.body));

export const deleteObservation = async (req: Request, res: Response) =>
  ok(res, await service.remove(req.auth!, requiredParam(req.params.id)));
