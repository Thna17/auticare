#!/usr/bin/env node
/**
 * @file test-email.mjs
 * CLI utility to verify SMTP connectivity and send a test email.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const apiRequire = createRequire(path.join(rootDir, 'apps/api/package.json'));
const nodemailer = apiRequire('nodemailer');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let envFile = path.join(rootDir, '.env');
  let to = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--env-file' || arg === '-e') {
      envFile = path.resolve(rootDir, args[++i]);
    } else if (arg === '--to' || arg === '-t') {
      to = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
AutiCare SMTP Email Connection Test Utility

Usage:
  node scripts/test-email.mjs [options]

Options:
  -t, --to <email>        Recipient email address for the test message (required)
  -e, --env-file <path>   Environment file containing SMTP configuration (default: .env)
  -h, --help              Show this help message
`);
      process.exit(0);
    }
  }

  return { envFile, to };
}

async function main() {
  const { envFile, to } = parseArgs();
  console.log('📬 AutiCare SMTP Email Diagnostic & Test Suite');
  console.log('==============================================');

  const fileVars = parseEnvFile(envFile);
  const host = process.env.SMTP_HOST || fileVars.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || fileVars.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || fileVars.SMTP_USER;
  const pass = process.env.SMTP_PASS || fileVars.SMTP_PASS;
  const from = process.env.SMTP_FROM || fileVars.SMTP_FROM || user;
  const recipient = to || process.env.TEST_EMAIL_TO || user;

  console.log(
    `Config Source: ${fs.existsSync(envFile) ? path.relative(rootDir, envFile) : 'process.env'}`,
  );
  console.log(`SMTP Host:     ${host || '<NOT SET>'}`);
  console.log(`SMTP Port:     ${port}`);
  console.log(`SMTP User:     ${user ? user.slice(0, 4) + '***' : '<NOT SET>'}`);
  console.log(`From Address:  ${from || '<NOT SET>'}`);
  console.log(`Recipient:     ${recipient || '<NOT SET>'}\n`);

  if (!host || !user || !pass) {
    console.error('❌ Incomplete SMTP configuration!');
    console.error(
      '   Please define SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file.',
    );
    console.error('\nExamples:\n');
    console.error('  # Gmail (App Password):');
    console.error('  SMTP_HOST=smtp.gmail.com');
    console.error('  SMTP_PORT=587');
    console.error('  SMTP_USER=your-email@gmail.com');
    console.error('  SMTP_PASS=xxxx-xxxx-xxxx-xxxx');
    console.error('  SMTP_FROM="AutiCare Support <your-email@gmail.com>"\n');
    console.error('  # Resend:');
    console.error('  SMTP_HOST=smtp.resend.com');
    console.error('  SMTP_PORT=465');
    console.error('  SMTP_USER=resend');
    console.error('  SMTP_PASS=re_your_api_key');
    console.error('  SMTP_FROM="AutiCare <onboarding@resend.dev>"\n');
    process.exit(1);
  }

  if (!recipient) {
    console.error('❌ Please specify a recipient email using --to <email>');
    console.error('   Example: node scripts/test-email.mjs --to user@example.com\n');
    process.exit(1);
  }

  const isSecure = port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    requireTLS: port === 587,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: true,
    },
  });

  try {
    process.stdout.write('  ⏳ Connecting and verifying SMTP server handshake... ');
    await transporter.verify();
    console.log('✓ SUCCESS (SMTP connection established)');
  } catch (err) {
    console.log('✗ FAILED');
    console.error(`\n❌ SMTP Connection Handshake Failed: ${err.message}`);
    if (host.includes('gmail.com')) {
      console.error('\n💡 Gmail Tip:');
      console.error('   1. Ensure 2-Step Verification is turned ON for your Google account.');
      console.error(
        '   2. Generate a 16-character "App Password" at https://myaccount.google.com/apppasswords',
      );
      console.error(
        '   3. Use that App Password for SMTP_PASS (do not use your regular account password).',
      );
    }
    process.exit(1);
  }

  try {
    process.stdout.write(`  ⏳ Dispatching test email to ${recipient}... `);
    const timestamp = new Date().toISOString();
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: '✅ AutiCare Email Setup Verification',
      text: `Hello!\n\nThis is a verification message from your AutiCare application.\nSent at: ${timestamp}\n\nYour SMTP email service is correctly configured and operational!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #294a5a; margin-top: 0;">🎉 AutiCare Email Verification</h2>
          <p style="color: #41484b; font-size: 15px; line-height: 1.5;">Your email configuration is working perfectly!</p>
          <div style="background: #e8f6ff; border: 1px solid #d4e6ef; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 14px; color: #164f68;">
            <strong>SMTP Host:</strong> ${host}<br/>
            <strong>Port:</strong> ${port}<br/>
            <strong>Timestamp:</strong> ${timestamp}
          </div>
          <p style="color: #66747a; font-size: 13px; margin-bottom: 0;">This email confirms that password resets and invitation links will be delivered reliably.</p>
        </div>
      `,
    });
    console.log(`✓ SENT (Message ID: ${info.messageId})`);
    console.log('\n==============================================');
    console.log('🎉 Email configuration is verified and fully functional!');
  } catch (err) {
    console.log('✗ FAILED');
    console.error(`\n❌ Message Delivery Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
