import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { HospitalsService } from './hospitals.service.js';

const service = new HospitalsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listHospitals = async (req: Request, res: Response) =>
  ok(res, await service.list(req.auth));

export const toggleFavorite = async (req: Request, res: Response) =>
  ok(res, await service.toggleFavorite(req.auth!, requiredParam(req.params.id)));

export const createHospital = async (req: Request, res: Response) =>
  created(res, await service.create(req.auth!, req.body));

export const createHospitalAccount = async (req: Request, res: Response) =>
  created(res, await service.createAccount(req.auth!, req.body));

export const listHospitalAccounts = async (req: Request, res: Response) =>
  ok(res, await service.listAccounts(req.auth!));
