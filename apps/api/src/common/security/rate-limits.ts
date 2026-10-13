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

export const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTesting ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTesting,
});
