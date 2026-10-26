import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createScreeningSession,
  getLatestChildScreening,
  getScreeningSession,
  listChildScreeningSessions,
  listScreeningQuestions,
  submitScreeningSession,
  upsertScreeningAnswer,
} from './screening.controller.js';
import {
  createScreeningSessionRequestSchema,
  upsertScreeningAnswerRequestSchema,
} from './screening.schemas.js';

export const screeningRoutes = Router();
screeningRoutes.use(requireAuth);
// ?ageBand=TODDLER&formKind=SHORT — formKind defaults to FULL so the existing
// screens keep being served the long instrument.
screeningRoutes.get('/questions', requireRole('PARENT'), listScreeningQuestions);
screeningRoutes.post(
  '/sessions',
  requireRole('PARENT'),
  validateBody(createScreeningSessionRequestSchema),
  createScreeningSession,
);
screeningRoutes.patch(
  '/sessions/:id/answers',
  requireRole('PARENT'),
  validateBody(upsertScreeningAnswerRequestSchema),
  upsertScreeningAnswer,
);
screeningRoutes.post('/sessions/:id/submit', requireRole('PARENT'), submitScreeningSession);
screeningRoutes.get('/sessions/:id', requireRole('PARENT'), getScreeningSession);
screeningRoutes.get(
  '/children/:childId/sessions',
  requireRole('PARENT'),
  listChildScreeningSessions,
);
screeningRoutes.get('/children/:childId/latest', requireRole('PARENT'), getLatestChildScreening);
