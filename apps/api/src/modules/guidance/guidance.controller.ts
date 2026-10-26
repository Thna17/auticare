import type { Request, Response } from 'express';
import type { GuidanceSearchQuery } from '@auticare/contracts';
import { ok } from '../../common/http/response.js';
import { validatedQuery } from '../../common/middleware/validate-query.js';
import { GuidanceService } from './guidance.service.js';

const service = new GuidanceService();

/**
 * GET /api/v1/guidance?q=bedtime&language=en
 *
 * Returns only reviewed passages. An empty list means the corpus has nothing that
 * answers this, which the UI must present honestly rather than filling the gap.
 */
export const searchGuidance = async (req: Request, res: Response) => {
  const query = validatedQuery<GuidanceSearchQuery>(req);
  ok(res, await service.search(query.q, query.language));
};
