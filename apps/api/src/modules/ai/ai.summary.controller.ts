import type { ChildSummaryQuery } from '@auticare/contracts';
import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { validatedQuery } from '../../common/middleware/validate-query.js';
import { AiSummaryService } from './ai.summary.service.js';

const service = new AiSummaryService();

const requiredParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string') throw new Error('Missing route parameter.');
  return value;
};

/** GET /api/v1/children/:childId/summary — the stored summary, or nothing. */
export const getChildSummary = async (req: Request, res: Response) =>
  ok(
    res,
    await service.latest(
      req.auth!,
      requiredParam(req.params.childId),
      validatedQuery<ChildSummaryQuery>(req).language,
    ),
  );

/**
 * POST /api/v1/children/:childId/summary — write one.
 *
 * 200 rather than 201 because the common case is a stored summary whose facts
 * have not changed: nothing was created, and the response says so with `cached`.
 */
export const generateChildSummary = async (req: Request, res: Response) =>
  ok(res, await service.generate(req.auth!, requiredParam(req.params.childId), req.body));
