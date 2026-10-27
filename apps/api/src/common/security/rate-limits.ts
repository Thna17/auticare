import rateLimit from 'express-rate-limit';
import { env, isProduction } from '../../config/env.js';

const isTesting =
  !isProduction ||
  env.NODE_ENV === 'test' ||
  process.env.VITEST === 'true' ||
  process.env.PLAYWRIGHT === 'true';

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTesting ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTesting,
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTesting ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTesting,
});

/** Previewing and redeeming school connection codes, which are short. */
export const connectionCodeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTesting ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTesting,
});

export const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTesting ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTesting,
});

export const schoolRegistrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isTesting ? 10000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTesting,
});

export const inquiryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTesting ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTesting,
});
