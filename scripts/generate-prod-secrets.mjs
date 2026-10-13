#!/usr/bin/env node
/**
 * @file generate-prod-secrets.mjs
 * Generates cryptographically secure secrets (64-character hex strings)
 * and emits a production-ready .env.production template for AutiCare.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  let outFile = path.join(rootDir, '.env.production');
  let write = false;
  let force = false;
  let stdoutOnly = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--out' || arg === '-o') {
      outFile = path.resolve(rootDir, args[++i]);
      write = true;
    } else if (arg === '--write' || arg === '-w') {
      write = true;
    } else if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--print' || arg === '-p') {
      stdoutOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
AutiCare Production Secret & Template Generator

Usage:
  node scripts/generate-prod-secrets.mjs [options]

Options:
  -w, --write        Write output directly to .env.production
  -o, --out <path>   Write output to a custom path (enables write)
  -f, --force        Overwrite destination file if it already exists
  -p, --print        Print only the generated .env content to stdout
  -h, --help         Show this help message
`);
      process.exit(0);
    }
  }

  return { outFile, write, force, stdoutOnly };
}

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function buildProductionEnv({
  jwtAccessSecret,
  jwtRefreshSecret,
  mysqlPassword,
  mysqlRootPassword,
}) {
  const timestamp = new Date().toISOString();
  return `# ==============================================================================
# AutiCare Production Environment Configuration
# Generated: ${timestamp}
# SECURITY NOTICE: Keep this file confidential. Never commit to version control.
# ==============================================================================

# --- Node & Application Runtime ---
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# --- MySQL 8.4 LTS Database ---
MYSQL_DATABASE=auticare
MYSQL_USER=auticare
MYSQL_PASSWORD=${mysqlPassword}
MYSQL_ROOT_PASSWORD=${mysqlRootPassword}

# Connection string used by Prisma ORM and API services
DATABASE_URL=mysql://auticare:${mysqlPassword}@mysql:3306/auticare?connection_limit=20&pool_timeout=30

# --- Public Web & API Host Domains ---
# Replace 'auticare.example.com' with your verified production DNS / domain
APP_ORIGIN=https://auticare.example.com
API_ORIGIN=https://auticare.example.com/api

# --- Cryptographic JWT Authentication Secrets (64-character hex) ---
JWT_ACCESS_SECRET=${jwtAccessSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# --- Object Storage Driver (Local or AWS S3 / MinIO) ---
STORAGE_DRIVER=local
# STORAGE_DRIVER=s3
# STORAGE_S3_BUCKET=auticare-clinical-attachments
# STORAGE_S3_REGION=ap-southeast-1
# STORAGE_S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
# STORAGE_S3_ACCESS_KEY_ID=
# STORAGE_S3_SECRET_ACCESS_KEY=
STORAGE_UPLOAD_RETENTION_HOURS=24

# --- Optional: Transactional Email Service (SMTP) ---
# SMTP_HOST=smtp.mailgun.org
# SMTP_PORT=587
# SMTP_USER=postmaster@auticare.example.com
# SMTP_PASS=
# SMTP_FROM=AutiCare Support <support@auticare.example.com>
`;
}

function mask(str) {
  if (!str || str.length < 12) return '********';
  return `${str.slice(0, 6)}...${str.slice(-6)} (${str.length} chars)`;
}

function main() {
  const { outFile, write, force, stdoutOnly } = parseArgs();

  const jwtAccessSecret = generateSecret(32); // 64 hex chars
  const jwtRefreshSecret = generateSecret(32); // 64 hex chars
  const mysqlPassword = generateSecret(32); // 64 hex chars
  const mysqlRootPassword = generateSecret(32); // 64 hex chars

  const envContent = buildProductionEnv({
    jwtAccessSecret,
    jwtRefreshSecret,
    mysqlPassword,
    mysqlRootPassword,
  });

  if (stdoutOnly) {
    process.stdout.write(envContent);
    return;
  }

  console.log('🔐 AutiCare Cryptographic Production Secret Generator');
  console.log('----------------------------------------------------');
  console.log(`✓ JWT_ACCESS_SECRET:     ${mask(jwtAccessSecret)}`);
  console.log(`✓ JWT_REFRESH_SECRET:    ${mask(jwtRefreshSecret)}`);
  console.log(`✓ MYSQL_PASSWORD:        ${mask(mysqlPassword)}`);
  console.log(`✓ MYSQL_ROOT_PASSWORD:   ${mask(mysqlRootPassword)}`);
  console.log('----------------------------------------------------');

  const fileExists = fs.existsSync(outFile);

  if (write || !fileExists) {
    if (fileExists && !force) {
      console.error(
        `\n⚠️  File already exists at: ${outFile}\n   Use --force (-f) to overwrite existing file, or specify --out <path>.`,
      );
      process.exit(1);
    }

    fs.writeFileSync(outFile, envContent, { encoding: 'utf8', mode: 0o600 });
    console.log(`✅ Production environment template successfully written to:`);
    console.log(`   ${outFile}`);
    console.log(`   (File permissions set to 0600 - Owner read/write only)\n`);
  } else {
    console.log(`\n💡 To write these secrets directly to ${outFile}, run:`);
    console.log(`   node scripts/generate-prod-secrets.mjs --write\n`);
  }
}

main();
