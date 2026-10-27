import { Router } from 'express';
import {
  createAiConversationRequestSchema,
  feedbackAiMessageRequestSchema,
  sendAiMessageRequestSchema,
} from '@auticare/contracts';
import { validateBody } from '../../common/middleware/validate.js';
import { requireAuth, requireRole } from '../auth/index.js';
import {
  createConversation,
  deleteConversation,
  getAiStatus,
  getConversation,
  listConversations,
  listSavedMessages,
  saveFeedback,
  sendMessage,
  toggleSaveMessage,
} from './ai.controller.js';

export const aiRoutes = Router();

aiRoutes.use(requireAuth, requireRole('PARENT'));

/** GET /api/v1/ai/status — configuration and today's remaining allowance. */
aiRoutes.get('/status', getAiStatus);

/** GET /api/v1/ai/saved — saved assistant responses for the current parent. */
aiRoutes.get('/saved', listSavedMessages);

/** GET /api/v1/ai/conversations — most recently active first. */
aiRoutes.get('/conversations', listConversations);

/** POST /api/v1/ai/conversations — start one, optionally attached to a child. */
aiRoutes.post(
  '/conversations',
  validateBody(createAiConversationRequestSchema),
  createConversation,
);

/** GET /api/v1/ai/conversations/:id — the conversation and its messages. */
aiRoutes.get('/conversations/:id', getConversation);

/** DELETE /api/v1/ai/conversations/:id — the parent stays in control. */
aiRoutes.delete('/conversations/:id', deleteConversation);

/**
 * POST /api/v1/ai/conversations/:id/messages — ask something.
 * Rate limiting for this path is the per-parent daily allowance enforced in the
 * service, which is visible to the parent in the UI. A second, opaque HTTP limit
 * here would only produce a different way to be told no.
 */
aiRoutes.post('/conversations/:id/messages', validateBody(sendAiMessageRequestSchema), sendMessage);

/** POST /api/v1/ai/messages/:id/save — toggle saving an assistant message. */
aiRoutes.post('/messages/:id/save', toggleSaveMessage);

/** POST /api/v1/ai/messages/:id/feedback — submit helpful/not helpful feedback. */
aiRoutes.post('/messages/:id/feedback', validateBody(feedbackAiMessageRequestSchema), saveFeedback);
