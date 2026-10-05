import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.js';
import { loginRateLimit, passwordResetRateLimit } from '../../common/security/rate-limits.js';
import {
  login,
  logout,
  me,
  updateMe,
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
  updateMyProfileRequestSchema,
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
/**
 * PATCH /api/v1/auth/me
 * The signed-in account holder updates their own profile. Any role may call it —
 * every user is a Parent row — and the id comes from the session, never the body.
 */
authRoutes.patch('/me', requireAuth, validateBody(updateMyProfileRequestSchema), updateMe);
