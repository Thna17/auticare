import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
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
