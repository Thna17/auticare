import { Router } from 'express';
import {
  createObservationRequestSchema,
  listObservationsQuerySchema,
  updateObservationRequestSchema,
} from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { validateQuery } from '../../common/middleware/validate-query.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createObservation,
  deleteObservation,
  listObservations,
  updateObservation,
} from './observations.controller.js';

export const observationsRoutes = Router();

// Observations are a parent's own record of their own child. Ownership is
// enforced per row in the service, not by trusting a childId from the client.
observationsRoutes.use(requireAuth, requireRole('PARENT'));

/** GET /api/v1/observations?childId=&category=&from=&to=&limit= */
observationsRoutes.get('/', validateQuery(listObservationsQuerySchema), listObservations);

/** POST /api/v1/observations — record what happened. */
observationsRoutes.post('/', validateBody(createObservationRequestSchema), createObservation);

/** PATCH /api/v1/observations/:id — correct a category, intensity, time or note. */
observationsRoutes.patch('/:id', validateBody(updateObservationRequestSchema), updateObservation);

/**
 * DELETE /api/v1/observations/:id — the parent stays in control.
 * Removing a child profile removes its observations through the cascade.
 */
observationsRoutes.delete('/:id', deleteObservation);
