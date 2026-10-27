import { Router } from 'express';
import { connectionCodeInputSchema, connectSchoolRequestSchema } from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { connectionCodeRateLimit } from '../../common/security/rate-limits.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  connectSchool,
  disconnectSchool,
  listConnections,
  previewConnection,
} from './connections.controller.js';

/** A parent's connections between their children and schools. */
export const connectionsRoutes = Router();

connectionsRoutes.use(requireAuth, requireRole('PARENT'));

/** GET /api/v1/connections — every school each of my children is connected to. */
connectionsRoutes.get('/', listConnections);

/**
 * POST /api/v1/connections/preview — which school a code belongs to.
 * POST rather than GET so the code never lands in URLs or access logs.
 */
connectionsRoutes.post(
  '/preview',
  connectionCodeRateLimit,
  validateBody(connectionCodeInputSchema),
  previewConnection,
);

/** POST /api/v1/connections — redeem a code for one child, with consent. */
connectionsRoutes.post(
  '/',
  connectionCodeRateLimit,
  validateBody(connectSchoolRequestSchema),
  connectSchool,
);

/** DELETE /api/v1/connections/:enrollmentId — the parent ends a connection. */
connectionsRoutes.delete('/:enrollmentId', disconnectSchool);
