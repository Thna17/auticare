import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    APP_ORIGIN: z.string().url(),
    API_ORIGIN: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL: z.string().default('7d'),
    COOKIE_DOMAIN: z.string().optional(),
    LOG_LEVEL: z.string().default('info'),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_USER: z.string().email().optional(),
    SMTP_PASS: z.string().min(1).optional(),
    SMTP_FROM: z.string().min(1).optional(),
  })
  .superRefine((value, context) => {
    const configuredFields = [value.SMTP_HOST, value.SMTP_PORT, value.SMTP_USER, value.SMTP_PASS];
    const configuredCount = configuredFields.filter((field) => field !== undefined).length;

    if (configuredCount > 0 && configuredCount < configuredFields.length) {
      context.addIssue({
        code: 'custom',
        message: 'SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured together.',
      });
    }
  });
export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
