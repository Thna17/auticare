import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  archiveChild,
  createChild,
  getChild,
  listChildren,
  updateChild,
} from './children.controller.js';
import { createChildRequestSchema, updateChildRequestSchema } from './children.schemas.js';

export const childrenRoutes = Router();
childrenRoutes.use(requireAuth);
childrenRoutes.get('/', requireRole('PARENT', 'ADMIN'), listChildren);
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
