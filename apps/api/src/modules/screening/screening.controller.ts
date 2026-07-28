import type { Request, Response } from 'express';
import { ageBands } from '@auticare/contracts';
import type { AgeBand } from '@auticare/contracts';
import { created, ok } from '../../common/http/response.js';
import { ScreeningService } from './screening.service.js';

const service = new ScreeningService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

const parseAgeBand = (value: unknown): AgeBand | undefined =>
  typeof value === 'string' && (ageBands as readonly string[]).includes(value)
    ? (value as AgeBand)
    : undefined;

export const listScreeningQuestions = async (req: Request, res: Response) =>
  ok(res, await service.listQuestions(parseAgeBand(req.query.ageBand)));

export const createScreeningSession = async (req: Request, res: Response) =>
  created(res, await service.createSession(req.auth!, req.body));

export const upsertScreeningAnswer = async (req: Request, res: Response) =>
  ok(res, await service.upsertAnswer(req.auth!, requiredParam(req.params.id), req.body));

export const submitScreeningSession = async (req: Request, res: Response) =>
  ok(res, await service.submitSession(req.auth!, requiredParam(req.params.id)));

export const getScreeningSession = async (req: Request, res: Response) =>
  ok(res, await service.getSession(req.auth!, requiredParam(req.params.id)));

export const listChildScreeningSessions = async (req: Request, res: Response) =>
  ok(res, await service.listSessionsForChild(req.auth!, requiredParam(req.params.childId)));
