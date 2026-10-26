import { Router } from 'express';
import { guidanceSearchQuerySchema } from '@auticare/contracts';
import { validateQuery } from '../../common/middleware/validate-query.js';
import { requireAuth, requireRole } from '../auth/index.js';
import { searchGuidance } from './guidance.controller.js';

export const guidanceRoutes = Router();

guidanceRoutes.use(requireAuth, requireRole('PARENT'));

guidanceRoutes.get('/', validateQuery(guidanceSearchQuerySchema), searchGuidance);
