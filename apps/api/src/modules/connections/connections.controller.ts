import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { ConnectionsService } from './connections.service.js';

const service = new ConnectionsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listConnections = async (req: Request, res: Response) =>
  ok(res, await service.list(req.auth!));

export const previewConnection = async (req: Request, res: Response) =>
  ok(res, await service.preview(req.auth!, req.body.code));

export const connectSchool = async (req: Request, res: Response) =>
  created(res, await service.connect(req.auth!, req.body));

export const disconnectSchool = async (req: Request, res: Response) =>
  ok(res, await service.disconnect(req.auth!, requiredParam(req.params.enrollmentId)));
