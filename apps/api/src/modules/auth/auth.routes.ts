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
  changePassword,
  verifyInvitation,
  acceptInvitation,
  resendInvitation,
  staffSetup,
} from './auth.controller.js';
import { optionalAuth, requireAuth } from './auth.middleware.js';
import {
  acceptInvitationRequestSchema,
  changePasswordRequestSchema,
  loginRequestSchema,
  passwordResetRequestSchema,
  registerRequestSchema,
  resendInvitationRequestSchema,
  resetPasswordRequestSchema,
  staffSetupRequestSchema,
  updateMyProfileRequestSchema,
} from './auth.schemas.js';

export const authRoutes = Router();
authRoutes.post('/register', validateBody(registerRequestSchema), register);
authRoutes.post('/login', loginRateLimit, validateBody(loginRequestSchema), login);
// Shares the login limiter: it is a sign-in, and the setup code is short.
authRoutes.post('/staff-setup', loginRateLimit, validateBody(staffSetupRequestSchema), staffSetup);
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
authRoutes.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordRequestSchema),
  changePassword,
);

authRoutes.get('/invitations/verify', verifyInvitation);
authRoutes.post(
  '/invitations/accept',
  loginRateLimit,
  validateBody(acceptInvitationRequestSchema),
  acceptInvitation,
);
authRoutes.post(
  '/invitations/resend',
  optionalAuth,
  validateBody(resendInvitationRequestSchema),
  resendInvitation,
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
