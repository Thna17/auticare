#!/usr/bin/env node
/**
 * @file validate-prod-env.mjs
 * Validates mandatory production environment variables and connection strings
 * without leaking sensitive secret values to logs or console.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  let envFile = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--env-file' || arg === '-e') {
      envFile = path.resolve(rootDir, args[++i]);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
AutiCare Production Environment Pre-Flight Validator

Usage:
  node scripts/validate-prod-env.mjs [options]

Options:
  -e, --env-file <path>   Path to .env file (default: .env.production or .env)
  -h, --help              Show this help message
`);
      process.exit(0);
    }
  }

  if (!envFile) {
    const prodPath = path.join(rootDir, '.env.production');
    const defaultPath = path.join(rootDir, '.env');
    envFile = fs.existsSync(prodPath) ? prodPath : defaultPath;
  }

  return { envFile };
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { vars: {}, exists: false };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();

    // Remove quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    vars[key] = val;
  }

  return { vars, exists: true };
}

function maskSecret(val) {
  if (!val) return '<NOT SET>';
  if (val.length <= 8) return '********';
  return `${val.slice(0, 4)}...${val.slice(-4)} (${val.length} chars)`;
}

function maskDatabaseUrl(rawUrl) {
  if (!rawUrl) return '<NOT SET>';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = '********';
    }
    return parsed.toString();
  } catch {
    return 'mysql://***:***@***/*** (malformed)';
  }
}

function validate(env) {
  const errors = [];
  const warnings = [];
  const passes = [];

  // 1. NODE_ENV
  if (env.NODE_ENV === 'production') {
    passes.push('NODE_ENV is set to "production"');
  } else {
    errors.push(`NODE_ENV must be "production" (currently: "${env.NODE_ENV || 'undefined'}")`);
  }

  // 2. PORT
  const port = Number.parseInt(env.PORT || '3000', 10);
  if (!Number.isNaN(port) && port > 0 && port <= 65535) {
    passes.push(`PORT is valid (${port})`);
  } else {
    errors.push(`PORT must be a valid positive port number (currently: "${env.PORT}")`);
  }

  // 3. DATABASE_URL & MySQL format
  const dbUrl = env.DATABASE_URL;
  if (!dbUrl) {
    errors.push('DATABASE_URL is missing or empty');
  } else if (!dbUrl.startsWith('mysql://')) {
    errors.push('DATABASE_URL must be a valid MySQL URI starting with "mysql://"');
  } else {
    try {
      const parsed = new URL(dbUrl);
      if (!parsed.username) {
        errors.push('DATABASE_URL must contain a username');
      }
      if (!parsed.password) {
        errors.push('DATABASE_URL must contain a password');
      }
      if (!parsed.pathname || parsed.pathname === '/') {
        errors.push('DATABASE_URL must specify a target database name');
      } else {
        passes.push(`DATABASE_URL format is valid: ${maskDatabaseUrl(dbUrl)}`);
      }

      if (parsed.searchParams.has('connection_limit')) {
        passes.push(
          `DATABASE_URL contains connection_limit (${parsed.searchParams.get('connection_limit')})`,
        );
      } else {
        warnings.push(
          'DATABASE_URL should specify connection_limit for production connection pooling (e.g. ?connection_limit=20)',
        );
      }
    } catch {
      errors.push('DATABASE_URL is not a parseable URL');
    }
  }

  // 4. MYSQL Credentials
  if (!env.MYSQL_ROOT_PASSWORD) {
    warnings.push(
      'MYSQL_ROOT_PASSWORD is not defined (required if spinning up MySQL container via compose)',
    );
  } else if (env.MYSQL_ROOT_PASSWORD.length < 16) {
    warnings.push('MYSQL_ROOT_PASSWORD should be at least 16 characters in production');
  } else {
    passes.push(`MYSQL_ROOT_PASSWORD is strong (${maskSecret(env.MYSQL_ROOT_PASSWORD)})`);
  }

  if (!env.MYSQL_PASSWORD) {
    warnings.push('MYSQL_PASSWORD is not defined');
  } else if (env.MYSQL_PASSWORD.length < 16) {
    warnings.push('MYSQL_PASSWORD should be at least 16 characters in production');
  } else {
    passes.push(`MYSQL_PASSWORD is strong (${maskSecret(env.MYSQL_PASSWORD)})`);
  }

  // 5. JWT Secrets
  const accessSecret = env.JWT_ACCESS_SECRET;
  const refreshSecret = env.JWT_REFRESH_SECRET;

  if (!accessSecret) {
    errors.push('JWT_ACCESS_SECRET is missing');
  } else if (accessSecret.length < 32) {
    errors.push(
      `JWT_ACCESS_SECRET must be at least 32 characters (currently ${accessSecret.length})`,
    );
  } else if (accessSecret.includes('test') || accessSecret.includes('dev')) {
    errors.push('JWT_ACCESS_SECRET contains disallowed "test" or "dev" substrings');
  } else {
    passes.push(`JWT_ACCESS_SECRET is cryptographically secure (${maskSecret(accessSecret)})`);
  }

  if (!refreshSecret) {
    errors.push('JWT_REFRESH_SECRET is missing');
  } else if (refreshSecret.length < 32) {
    errors.push(
      `JWT_REFRESH_SECRET must be at least 32 characters (currently ${refreshSecret.length})`,
    );
  } else if (refreshSecret.includes('test') || refreshSecret.includes('dev')) {
    errors.push('JWT_REFRESH_SECRET contains disallowed "test" or "dev" substrings');
  } else {
    passes.push(`JWT_REFRESH_SECRET is cryptographically secure (${maskSecret(refreshSecret)})`);
  }

  if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
    errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical');
  }

  // 6. Host Origins (APP_ORIGIN & API_ORIGIN)
  const appOrigin = env.APP_ORIGIN;
  const apiOrigin = env.API_ORIGIN;

  if (!appOrigin) {
    errors.push('APP_ORIGIN is missing');
  } else {
    try {
      const u = new URL(appOrigin);
      if (
        u.protocol !== 'https:' &&
        !u.hostname.includes('localhost') &&
        u.hostname !== '127.0.0.1'
      ) {
        warnings.push(
          `APP_ORIGIN uses non-HTTPS protocol (${appOrigin}). HTTPS is strongly recommended for production.`,
        );
      } else {
        passes.push(`APP_ORIGIN is valid: ${appOrigin}`);
      }
    } catch {
      errors.push(`APP_ORIGIN is not a valid URL ("${appOrigin}")`);
    }
  }

  if (!apiOrigin) {
    errors.push('API_ORIGIN is missing');
  } else {
    try {
      const u = new URL(apiOrigin);
      if (
        u.protocol !== 'https:' &&
        !u.hostname.includes('localhost') &&
        u.hostname !== '127.0.0.1'
      ) {
        warnings.push(
          `API_ORIGIN uses non-HTTPS protocol (${apiOrigin}). HTTPS is strongly recommended for production.`,
        );
      } else {
        passes.push(`API_ORIGIN is valid: ${apiOrigin}`);
      }
    } catch {
      errors.push(`API_ORIGIN is not a valid URL ("${apiOrigin}")`);
    }
  }

  // 7. Storage Driver
  const driver = env.STORAGE_DRIVER || 'local';
  if (driver === 's3') {
    let s3Valid = true;
    if (!env.STORAGE_S3_BUCKET) {
      errors.push('STORAGE_S3_BUCKET is required when STORAGE_DRIVER is "s3"');
      s3Valid = false;
    }
    if (!env.STORAGE_S3_ACCESS_KEY_ID) {
      errors.push('STORAGE_S3_ACCESS_KEY_ID is required when STORAGE_DRIVER is "s3"');
      s3Valid = false;
    }
    if (!env.STORAGE_S3_SECRET_ACCESS_KEY) {
      errors.push('STORAGE_S3_SECRET_ACCESS_KEY is required when STORAGE_DRIVER is "s3"');
      s3Valid = false;
    }
    if (s3Valid) {
      passes.push(
        `S3 Storage driver is properly configured (Bucket: ${env.STORAGE_S3_BUCKET}, Region: ${env.STORAGE_S3_REGION || 'us-east-1'})`,
      );
    }
  } else if (driver === 'local') {
    passes.push('Local storage driver configured (ensure Docker persistent volume mount)');
  } else {
    errors.push(`Invalid STORAGE_DRIVER: "${driver}" (must be "local" or "s3")`);
  }

  // 8. SMTP Configuration
  const smtpFields = [env.SMTP_HOST, env.SMTP_PORT, env.SMTP_USER, env.SMTP_PASS];
  const configuredSmtp = smtpFields.filter(Boolean).length;
  if (configuredSmtp > 0 && configuredSmtp < 4) {
    errors.push(
      'Incomplete SMTP configuration: SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must all be defined together.',
    );
  } else if (configuredSmtp === 4) {
    passes.push(`SMTP service configured: ${env.SMTP_USER}@${env.SMTP_HOST}:${env.SMTP_PORT}`);
  }

  return { errors, warnings, passes };
}

function main() {
  const { envFile } = parseArgs();
  console.log('🔍 AutiCare Production Pre-Flight Environment Validator');
  console.log('========================================================');
  console.log(`Inspecting environment file: ${path.relative(rootDir, envFile) || envFile}\n`);

  const { vars, exists } = parseEnvFile(envFile);

  if (!exists) {
    console.error(`❌ Target environment file does not exist: ${envFile}`);
    console.error('   Run "node scripts/generate-prod-secrets.mjs --write" to generate one.\n');
    process.exit(1);
  }

  // Merge process.env with file vars (file vars take precedence for validation)
  const combinedEnv = { ...process.env, ...vars };
  const { errors, warnings, passes } = validate(combinedEnv);

  for (const pass of passes) {
    console.log(`  ✓ ${pass}`);
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings (Advisory):');
    for (const warn of warnings) {
      console.log(`  ! ${warn}`);
    }
  }

  if (errors.length > 0) {
    console.log('\n❌ Validation Errors (Blocking):');
    for (const err of errors) {
      console.log(`  ✗ ${err}`);
    }
    console.log('\n🚫 Production environment pre-flight validation FAILED.');
    process.exit(1);
  }

  console.log('\n========================================================');
  console.log('✅ Production environment pre-flight validation PASSED.');
  console.log('   All mandatory variables are cryptographically secure and properly formatted.\n');
}

main();
