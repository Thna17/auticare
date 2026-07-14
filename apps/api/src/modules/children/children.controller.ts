import type { Request, Response } from 'express';
import { created, ok } from '../../common/http/response.js';
import { ChildrenService } from './children.service.js';

const service = new ChildrenService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

export const listChildren = async (req: Request, res: Response) =>
  ok(res, await service.list(req.auth!));

export const getChild = async (req: Request, res: Response) =>
  ok(res, await service.get(req.auth!, requiredParam(req.params.childId)));

export const createChild = async (req: Request, res: Response) =>
  created(res, await service.create(req.auth!, req.body));

export const updateChild = async (req: Request, res: Response) =>
  ok(res, await service.update(req.auth!, requiredParam(req.params.childId), req.body));

export const archiveChild = async (req: Request, res: Response) =>
  ok(res, await service.archive(req.auth!, requiredParam(req.params.childId)));
