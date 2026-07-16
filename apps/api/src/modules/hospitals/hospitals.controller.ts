import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { HospitalsService } from './hospitals.service.js';

const service = new HospitalsService();

export const listHospitals = async (_req: Request, res: Response) => ok(res, await service.list());

export const createHospital = async (req: Request, res: Response) =>
  created(res, await service.create(req.auth!, req.body));
