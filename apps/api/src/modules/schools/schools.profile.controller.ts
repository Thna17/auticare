import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { SchoolProfileService } from './schools.profile.service.js';

const service = new SchoolProfileService();

export const getMyProfile = async (req: Request, res: Response) =>
  ok(res, await service.getMyProfile(req.auth!));

export const updateMyProfile = async (req: Request, res: Response) =>
  ok(res, await service.updateMyProfile(req.auth!, req.body));
