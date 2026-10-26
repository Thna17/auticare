import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { InsightsService } from './insights.service.js';

const service = new InsightsService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

/** Undefined rather than NaN, so a malformed filter falls back to the default. */
const optionalNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const getChildInsight = async (req: Request, res: Response) =>
  ok(
    res,
    await service.forChild(req.auth!, requiredParam(req.params.childId), {
      ...(optionalNumber(req.query.days) !== undefined
        ? { days: optionalNumber(req.query.days)! }
        : {}),
      ...(optionalNumber(req.query.tzOffset) !== undefined
        ? { tzOffset: optionalNumber(req.query.tzOffset)! }
        : {}),
    }),
  );
