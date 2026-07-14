import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { loginRateLimit, passwordResetRateLimit } from '../../common/security/rate-limits.js';
import {
  login,
  logout,
  me,
  refresh,
  register,
  requestPasswordReset,
  resetPassword,
} from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';
import {
  loginRequestSchema,
  passwordResetRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
} from './auth.schemas.js';

export const authRoutes = Router();
authRoutes.post('/register', validateBody(registerRequestSchema), register);
authRoutes.post('/login', loginRateLimit, validateBody(loginRequestSchema), login);
authRoutes.post(
  '/forgot-password',
  passwordResetRateLimit,
  validateBody(passwordResetRequestSchema),
  requestPasswordReset,
);
authRoutes.post(
  '/reset-password',
  passwordResetRateLimit,
  validateBody(resetPasswordRequestSchema),
  resetPassword,
);
authRoutes.post('/logout', logout);
authRoutes.post('/refresh', refresh);
authRoutes.get('/me', requireAuth, me);
