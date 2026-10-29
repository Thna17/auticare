import { Router } from 'express';
import { childSummaryQuerySchema, generateChildSummaryRequestSchema } from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
import { generateChildSummary, getChildSummary } from '../ai/ai.summary.controller.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  archiveChild,
  createChild,
  getChild,
  listChildren,
  restoreChild,
  updateChild,
} from './children.controller.js';
import {
  createChildRequestSchema,
  listChildrenQuerySchema,
  updateChildRequestSchema,
} from './children.schemas.js';

export const childrenRoutes = Router();
childrenRoutes.use(requireAuth);
childrenRoutes.get(
  '/',
  requireRole('PARENT', 'ADMIN'),
  validateQuery(listChildrenQuerySchema),
  listChildren,
);
childrenRoutes.post(
  '/',
  requireRole('PARENT'),
  validateBody(createChildRequestSchema),
  createChild,
);
childrenRoutes.get('/:childId', requireRole('PARENT', 'ADMIN'), getChild);
childrenRoutes.patch(
  '/:childId',
  requireRole('PARENT', 'ADMIN'),
  validateBody(updateChildRequestSchema),
  updateChild,
);
childrenRoutes.delete('/:childId', requireRole('PARENT', 'ADMIN'), archiveChild);
childrenRoutes.post('/:childId/restore', requireRole('PARENT', 'ADMIN'), restoreChild);

// The educational summary lives with the child it describes. Parents only: staff
// have their own views and never read a family's generated text.
childrenRoutes.get(
  '/:childId/summary',
  requireRole('PARENT'),
  validateQuery(childSummaryQuerySchema),
  getChildSummary,
);
childrenRoutes.post(
  '/:childId/summary',
  requireRole('PARENT'),
  validateBody(generateChildSummaryRequestSchema),
  generateChildSummary,
);
