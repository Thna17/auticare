import crypto from 'node:crypto';
import type { Parent } from '@prisma/client';
import type { ResendVerificationResponse } from '@auticare/contracts';
import { AppError } from '../../common/errors/app-error.js';
import { env, isProduction } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { isStaffPlaceholderEmail } from '../schools/staff-usernames.js';
import { AuthRepository } from './auth.repository.js';
import { EmailVerificationMailer } from './email-verification-mailer.js';
import { hashShortCode } from './short-code.js';

/**
 * Confirming that a new parent owns the email they signed up with.
 *
 * A six-digit code is emailed; it works once, for 15 minutes, and five wrong
 * guesses spend it. Six digits are a million possibilities, so with five tries
 * per code, a new code at most once a minute and the route's rate limit,
 * guessing is not a practical attack. Only an HMAC of the code is stored.
 *
 * Only self-registered parents are asked. Teachers sign in with a username and
 * a code their school gave them, school and hospital staff arrive through an
 * emailed invitation (which already proves the address), and accounts that
 * existed before this feature were marked verified by its migration.
 */

export const VERIFICATION_CODE_TTL_MINUTES = 15;
export const MAX_VERIFICATION_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;

const isTestRun = () => env.NODE_ENV === 'test' || process.env.VITEST === 'true';

/**
 * `auto` asks for a code only when email can actually be sent, so an install
 * without a provider never locks parents out. Test runs stay on the old,
 * code-free flow unless a test switches it on explicitly.
 */
export const isEmailVerificationRequired = (
  mode: 'auto' | 'on' | 'off',
  emailConfigured: boolean,
  testRun = isTestRun(),
): boolean => mode === 'on' || (mode === 'auto' && emailConfigured && !testRun);

export const needsEmailVerification = (
  parent: Pick<Parent, 'role' | 'email' | 'emailVerifiedAt'>,
): boolean =>
  parent.role === 'PARENT' &&
  parent.emailVerifiedAt === null &&
  !isStaffPlaceholderEmail(parent.email);

export const createVerificationCode = (): string =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

const hashCode = (code: string) => hashShortCode(code, env.JWT_ACCESS_SECRET, 'email-verification');

const sameHash = (a: string, b: string) =>
  a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export class EmailVerificationService {
  constructor(
    private readonly repository = new AuthRepository(),
    private readonly mailer = new EmailVerificationMailer(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  get required(): boolean {
    return isEmailVerificationRequired(env.EMAIL_VERIFICATION, this.mailer.isConfigured());
  }

  /**
   * Emails a fresh code, unless one went out less than a minute ago (the
   * parent should use that one). Returns whether a new code was sent.
   */
  async sendCode(parent: Pick<Parent, 'id' | 'email' | 'firstName'>): Promise<boolean> {
    const latest = await this.repository.findLatestVerificationCode(parent.id);
    if (
      latest &&
      !latest.usedAt &&
      this.now().getTime() - latest.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
    ) {
      return false;
    }

    const code = createVerificationCode();
    await this.repository.createVerificationCode({
      parentId: parent.id,
      codeHash: hashCode(code),
      expiresAt: new Date(this.now().getTime() + VERIFICATION_CODE_TTL_MINUTES * 60_000),
    });

    if (this.mailer.isConfigured() && !isTestRun()) {
      void this.mailer
        .sendVerificationCode({
          recipient: parent.email,
          firstName: parent.firstName,
          code,
          expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
        })
        .catch((err: unknown) => {
          logger.warn({ err, email: parent.email }, 'Failed to send email verification code');
        });
    } else if (!isProduction) {
      // Verification forced on without an email provider: development only.
      logger.info({ email: parent.email, code }, 'Email verification code (not emailed)');
    } else {
      logger.warn(
        { email: parent.email },
        'Email verification is on but no email provider is configured; the code was not sent',
      );
    }
    return true;
  }

  /** Checks the code and, if it is right, marks the address verified. */
  async verify(email: string, code: string): Promise<Parent> {
    const rejected = () =>
      new AppError(
        'VALIDATION_ERROR',
        'That code is wrong or has expired. Use the code from the latest email, or ask for a new one.',
        400,
      );

    const parent = await this.repository.findParentByEmail(email.trim().toLowerCase());
    if (!parent || !needsEmailVerification(parent)) throw rejected();

    const latest = await this.repository.findLatestVerificationCode(parent.id);
    if (
      !latest ||
      latest.usedAt ||
      latest.expiresAt <= this.now() ||
      latest.attempts >= MAX_VERIFICATION_ATTEMPTS
    ) {
      throw rejected();
    }

    if (!sameHash(hashCode(code.trim()), latest.codeHash)) {
      await this.repository.recordFailedVerificationAttempt(latest.id);
      throw rejected();
    }

    return this.repository.completeEmailVerification(latest.id, parent.id);
  }

  /** The same answer whether or not the account exists, so emails cannot be probed. */
  async resend(email: string): Promise<ResendVerificationResponse> {
    const message =
      'If that account is waiting to be verified, a new code is on its way. Check your inbox and spam folder.';
    const parent = await this.repository.findParentByEmail(email.trim().toLowerCase());
    if (parent && this.required && needsEmailVerification(parent)) {
      await this.sendCode(parent);
    }
    return { message };
  }
}
