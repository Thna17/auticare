import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
const configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDir, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

if (process.env.NODE_ENV === 'test') {
  process.env.DATABASE_URL ??= 'mysql://auticare:auticare@localhost:3306/auticare';
  process.env.APP_ORIGIN ??= 'http://localhost:4200';
  process.env.API_ORIGIN ??= 'http://localhost:3000';
  process.env.JWT_ACCESS_SECRET ??= 'test_access_secret_with_32_characters_minimum';
  process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_with_32_characters_minimum';
}

const emptyStringToUndefined = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? undefined : val;

const optionalTrimmedString = z.preprocess(emptyStringToUndefined, z.string().min(1).optional());

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
    COOKIE_DOMAIN: z.preprocess(emptyStringToUndefined, z.string().optional()),
    LOG_LEVEL: z.string().default('info'),
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_S3_BUCKET: optionalTrimmedString,
    STORAGE_S3_REGION: z.string().default('us-east-1'),
    STORAGE_S3_ENDPOINT: optionalTrimmedString,
    STORAGE_S3_ACCESS_KEY_ID: optionalTrimmedString,
    STORAGE_S3_SECRET_ACCESS_KEY: optionalTrimmedString,
    STORAGE_UPLOAD_RETENTION_HOURS: z.coerce.number().int().positive().default(24),
    SMTP_HOST: optionalTrimmedString,
    SMTP_PORT: z.preprocess(
      (val) => (val === '' || val === undefined || val === null ? undefined : val),
      z.coerce.number().int().min(1).max(65535).optional(),
    ),
    SMTP_USER: optionalTrimmedString,
    SMTP_PASS: optionalTrimmedString,
    SMTP_FROM: optionalTrimmedString,
    /**
     * Model provider, deliberately provider-agnostic: any OpenAI-compatible
     * chat-completions endpoint. Nothing here is assumed to be a particular
     * vendor — no key means the assistant reports itself as unconfigured and the
     * rest of the app keeps working.
     */
    AI_BASE_URL: optionalTrimmedString,
    AI_API_KEY: optionalTrimmedString,
    AI_MODEL: optionalTrimmedString,
    AI_TIMEOUT_MS: z.coerce.number().int().positive().max(120000).default(20000),
    AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),
    AI_MAX_DAILY_MESSAGES: z.coerce.number().int().positive().max(500).default(40),
  })
  .superRefine((value, context) => {
    const hasAnySmtpCredential = Boolean(value.SMTP_HOST || value.SMTP_USER || value.SMTP_PASS);
    if (hasAnySmtpCredential) {
      if (!value.SMTP_HOST || !value.SMTP_PORT || !value.SMTP_USER || !value.SMTP_PASS) {
        context.addIssue({
          code: 'custom',
          message: 'SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured together.',
        });
      }
    }

    if (value.STORAGE_DRIVER === 's3') {
      if (!value.STORAGE_S3_BUCKET) {
        context.addIssue({
          code: 'custom',
          path: ['STORAGE_S3_BUCKET'],
          message: 'STORAGE_S3_BUCKET is required when STORAGE_DRIVER is "s3".',
        });
      }
      if (!value.STORAGE_S3_ACCESS_KEY_ID) {
        context.addIssue({
          code: 'custom',
          path: ['STORAGE_S3_ACCESS_KEY_ID'],
          message: 'STORAGE_S3_ACCESS_KEY_ID is required when STORAGE_DRIVER is "s3".',
        });
      }
      if (!value.STORAGE_S3_SECRET_ACCESS_KEY) {
        context.addIssue({
          code: 'custom',
          path: ['STORAGE_S3_SECRET_ACCESS_KEY'],
          message: 'STORAGE_S3_SECRET_ACCESS_KEY is required when STORAGE_DRIVER is "s3".',
        });
      }
    }

    // Base URL and model must arrive together: one without the other would let
    // the assistant claim to be configured and then fail on every request.
    if (Boolean(value.AI_BASE_URL) !== Boolean(value.AI_MODEL)) {
      context.addIssue({
        code: 'custom',
        path: ['AI_BASE_URL'],
        message: 'AI_BASE_URL and AI_MODEL must be configured together.',
      });
    }

    if (value.NODE_ENV === 'production') {
      if (value.JWT_ACCESS_SECRET.includes('test') || value.JWT_ACCESS_SECRET.includes('dev')) {
        context.addIssue({
          code: 'custom',
          path: ['JWT_ACCESS_SECRET'],
          message: 'Production JWT_ACCESS_SECRET must not contain test or dev tokens.',
        });
      }
      if (value.JWT_REFRESH_SECRET.includes('test') || value.JWT_REFRESH_SECRET.includes('dev')) {
        context.addIssue({
          code: 'custom',
          path: ['JWT_REFRESH_SECRET'],
          message: 'Production JWT_REFRESH_SECRET must not contain test or dev tokens.',
        });
      }
    }
  });
export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
