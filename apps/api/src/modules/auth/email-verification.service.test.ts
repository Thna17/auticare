import { describe, expect, it, vi } from 'vitest';
import type { EmailVerificationCode, Parent } from '@prisma/client';
import { env } from '../../config/env.js';
import type { AuthRepository } from './auth.repository.js';
import type { EmailVerificationMailer } from './email-verification-mailer.js';
import {
  createVerificationCode,
  EmailVerificationService,
  isEmailVerificationRequired,
  MAX_VERIFICATION_ATTEMPTS,
  needsEmailVerification,
} from './email-verification.service.js';
import { hashShortCode } from './short-code.js';

const NOW = new Date('2026-11-01T10:00:00Z');

const parent = (overrides: Partial<Parent> = {}): Parent =>
  ({
    id: 'parent-1',
    email: 'new.parent@example.com',
    firstName: 'Dara',
    role: 'PARENT',
    emailVerifiedAt: null,
    ...overrides,
  }) as Parent;

const storedCode = (
  code: string,
  overrides: Partial<EmailVerificationCode> = {},
): EmailVerificationCode => ({
  id: 'code-1',
  parentId: 'parent-1',
  codeHash: hashShortCode(code, env.JWT_ACCESS_SECRET, 'email-verification'),
  attempts: 0,
  expiresAt: new Date(NOW.getTime() + 10 * 60_000),
  usedAt: null,
  createdAt: new Date(NOW.getTime() - 5 * 60_000),
  ...overrides,
});

const setup = (latest: EmailVerificationCode | null, account: Parent | null = parent()) => {
  const repository = {
    findParentByEmail: vi.fn().mockResolvedValue(account),
    findLatestVerificationCode: vi.fn().mockResolvedValue(latest),
    createVerificationCode: vi.fn().mockResolvedValue(undefined),
    recordFailedVerificationAttempt: vi.fn().mockResolvedValue(undefined),
    completeEmailVerification: vi
      .fn()
      .mockResolvedValue({ ...account, emailVerifiedAt: NOW } as Parent),
  };
  const mailer = { isConfigured: () => true, sendVerificationCode: vi.fn() };
  const service = new EmailVerificationService(
    repository as unknown as AuthRepository,
    mailer as unknown as EmailVerificationMailer,
    () => NOW,
  );
  return { service, repository };
};

describe('isEmailVerificationRequired', () => {
  it('in auto mode, asks only when email can be sent and not in tests', () => {
    expect(isEmailVerificationRequired('auto', true, false)).toBe(true);
    expect(isEmailVerificationRequired('auto', false, false)).toBe(false);
    expect(isEmailVerificationRequired('auto', true, true)).toBe(false);
  });

  it('can be forced on or switched off', () => {
    expect(isEmailVerificationRequired('on', false, true)).toBe(true);
    expect(isEmailVerificationRequired('off', true, false)).toBe(false);
  });
});

describe('needsEmailVerification', () => {
  it('asks only unverified, self-registered parents', () => {
    expect(needsEmailVerification(parent())).toBe(true);
    expect(needsEmailVerification(parent({ emailVerifiedAt: NOW }))).toBe(false);
    expect(needsEmailVerification(parent({ role: 'SCHOOL' }))).toBe(false);
    expect(needsEmailVerification(parent({ role: 'ADMIN' }))).toBe(false);
    expect(needsEmailVerification(parent({ email: 'teacher.sok@staff.auticare.invalid' }))).toBe(
      false,
    );
  });
});

describe('createVerificationCode', () => {
  it('is always six digits, keeping leading zeros', () => {
    for (let i = 0; i < 200; i++) expect(createVerificationCode()).toMatch(/^\d{6}$/);
  });
});

describe('EmailVerificationService.verify', () => {
  it('accepts the right code and marks the address verified', async () => {
    const { service, repository } = setup(storedCode('123456'));
    const verified = await service.verify('New.Parent@example.com', '123456');
    expect(repository.findParentByEmail).toHaveBeenCalledWith('new.parent@example.com');
    expect(repository.completeEmailVerification).toHaveBeenCalledWith('code-1', 'parent-1');
    expect(verified.emailVerifiedAt).toEqual(NOW);
  });

  it('rejects a wrong code and counts the attempt', async () => {
    const { service, repository } = setup(storedCode('123456'));
    await expect(service.verify('new.parent@example.com', '654321')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repository.recordFailedVerificationAttempt).toHaveBeenCalledWith('code-1');
    expect(repository.completeEmailVerification).not.toHaveBeenCalled();
  });

  it('rejects even the right code once it has expired', async () => {
    const { service, repository } = setup(
      storedCode('123456', { expiresAt: new Date(NOW.getTime() - 1) }),
    );
    await expect(service.verify('new.parent@example.com', '123456')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repository.completeEmailVerification).not.toHaveBeenCalled();
  });

  it('rejects even the right code after too many wrong guesses', async () => {
    const { service } = setup(storedCode('123456', { attempts: MAX_VERIFICATION_ATTEMPTS }));
    await expect(service.verify('new.parent@example.com', '123456')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a code that was already used, or a replaced one', async () => {
    const { service } = setup(storedCode('123456', { usedAt: NOW }));
    await expect(service.verify('new.parent@example.com', '123456')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('gives the same answer for an unknown email as for a wrong code', async () => {
    const { service } = setup(null, null);
    await expect(service.verify('nobody@example.com', '123456')).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('wrong or has expired'),
    });
  });
});

describe('EmailVerificationService.sendCode', () => {
  it('stores a new code that expires in 15 minutes', async () => {
    const { service, repository } = setup(null);
    expect(await service.sendCode(parent())).toBe(true);
    const saved = repository.createVerificationCode.mock.calls[0]?.[0];
    expect(saved.parentId).toBe('parent-1');
    expect(saved.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(saved.expiresAt).toEqual(new Date(NOW.getTime() + 15 * 60_000));
  });

  it('does not send another code within a minute of the last one', async () => {
    const { service, repository } = setup(
      storedCode('123456', { createdAt: new Date(NOW.getTime() - 20_000) }),
    );
    expect(await service.sendCode(parent())).toBe(false);
    expect(repository.createVerificationCode).not.toHaveBeenCalled();
  });

  it('sends a new code once the minute has passed', async () => {
    const { service, repository } = setup(
      storedCode('123456', { createdAt: new Date(NOW.getTime() - 61_000) }),
    );
    expect(await service.sendCode(parent())).toBe(true);
    expect(repository.createVerificationCode).toHaveBeenCalled();
  });
});
