import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { publicAiChatRequestSchema } from '@auticare/contracts';
import { ok } from '../../common/http/response.js';
import { validateBody } from '../../common/middleware/validate.js';
import { isProduction } from '../../config/env.js';
import { PublicChatService } from './public-chat.service.js';

const service = new PublicChatService();
const publicChatLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 20 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Please wait before sending more questions.' },
  },
});

export const publicAiChatRoutes = Router();
publicAiChatRoutes.post(
  '/',
  publicChatLimit,
  validateBody(publicAiChatRequestSchema),
  async (req, res) => {
    ok(res, await service.answer(req.body));
  },
);
