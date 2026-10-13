import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { REDACT_PATHS } from './logger.js';

describe('Logger secret and credential redaction', () => {
  it('redacts sensitive headers, cookies, tokens, credentials, and child notes', () => {
    const logs: string[] = [];
    const testLogger = pino(
      {
        level: 'trace',
        redact: {
          paths: REDACT_PATHS,
          censor: '[Redacted]',
        },
      },
      {
        write: (msg: string) => {
          logs.push(msg);
        },
      },
    );

    testLogger.info(
      {
        req: {
          headers: {
            cookie: 'auticare_access=secretAccess123; auticare_refresh=secretRefresh456',
            authorization: 'Bearer super-secret-jwt-token',
          },
          body: {
            password: 'MySecretPassword123!',
          },
        },
        res: {
          headers: {
            'set-cookie': [
              'auticare_access=secretAccess123; Path=/; HttpOnly',
              'auticare_refresh=secretRefresh456; Path=/; HttpOnly',
            ],
          },
        },
        password: 'rawPassword',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$someHashValue',
        tokenHash: 'sha256TokenHashValue',
        resetToken: 'rawResetTokenValue789',
        invitationToken: 'rawInvitationTokenSecret999',
        token: 'plainTokenValue000',
        nested: {
          invitationToken: 'nestedInvitationSecret',
        },
        notes: 'Child sensitive diagnosis and therapist notes',
        child: {
          notes: 'Nested child sensitive note content',
        },
        smtpUser: 'smtp-account@auticare.test',
        smtpPass: 'super-secret-smtp-password',
        auth: {
          user: 'mail-user',
          pass: 'mail-pass-secret',
        },
      },
      'Test secret redaction in logging',
    );

    expect(logs.length).toBe(1);
    const logOutput = logs[0]!;

    // Sensitive values must NOT appear in log output
    expect(logOutput).not.toContain('secretAccess123');
    expect(logOutput).not.toContain('secretRefresh456');
    expect(logOutput).not.toContain('super-secret-jwt-token');
    expect(logOutput).not.toContain('MySecretPassword123!');
    expect(logOutput).not.toContain('rawPassword');
    expect(logOutput).not.toContain('$argon2id$v=19$m=65536,t=3,p=4$someHashValue');
    expect(logOutput).not.toContain('sha256TokenHashValue');
    expect(logOutput).not.toContain('rawResetTokenValue789');
    expect(logOutput).not.toContain('rawInvitationTokenSecret999');
    expect(logOutput).not.toContain('nestedInvitationSecret');
    expect(logOutput).not.toContain('plainTokenValue000');
    expect(logOutput).not.toContain('Child sensitive diagnosis');
    expect(logOutput).not.toContain('Nested child sensitive note');
    expect(logOutput).not.toContain('smtp-account@auticare.test');
    expect(logOutput).not.toContain('super-secret-smtp-password');
    expect(logOutput).not.toContain('mail-pass-secret');

    // Parsed JSON must show [Redacted] on all target fields
    const parsed = JSON.parse(logOutput);
    expect(parsed.req.headers.cookie).toBe('[Redacted]');
    expect(parsed.req.headers.authorization).toBe('[Redacted]');
    expect(parsed.req.body.password).toBe('[Redacted]');
    expect(parsed.res.headers['set-cookie']).toBe('[Redacted]');
    expect(parsed.password).toBe('[Redacted]');
    expect(parsed.passwordHash).toBe('[Redacted]');
    expect(parsed.tokenHash).toBe('[Redacted]');
    expect(parsed.resetToken).toBe('[Redacted]');
    expect(parsed.invitationToken).toBe('[Redacted]');
    expect(parsed.nested.invitationToken).toBe('[Redacted]');
    expect(parsed.token).toBe('[Redacted]');
    expect(parsed.notes).toBe('[Redacted]');
    expect(parsed.child.notes).toBe('[Redacted]');
    expect(parsed.smtpUser).toBe('[Redacted]');
    expect(parsed.smtpPass).toBe('[Redacted]');
    expect(parsed.auth.user).toBe('[Redacted]');
    expect(parsed.auth.pass).toBe('[Redacted]');
  });
});
