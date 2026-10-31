import { describe, expect, it, vi } from 'vitest';
import { createMailTransport, mailSender } from './mail-transport.js';

const none = {
  RESEND_API_KEY: undefined,
  MAILJET_API_KEY: undefined,
  MAILJET_SECRET_KEY: undefined,
  EMAIL_FROM: undefined,
  SMTP_HOST: undefined,
  SMTP_PORT: undefined,
  SMTP_USER: undefined,
  SMTP_PASS: undefined,
  SMTP_FROM: undefined,
};

const message = {
  to: 'parent@example.com',
  subject: 'Reset your AutiCare password',
  text: 'plain',
  html: '<p>html</p>',
};

const okFetch = () =>
  vi.fn().mockResolvedValue(new Response('{}', { status: 200 })) as unknown as typeof fetch &
    ReturnType<typeof vi.fn>;

describe('createMailTransport', () => {
  it('sends nothing when no provider is configured', () => {
    expect(createMailTransport(none)).toBeUndefined();
  });

  it('prefers Resend, then Mailjet, then SMTP', () => {
    const all = {
      ...none,
      RESEND_API_KEY: 're_test',
      MAILJET_API_KEY: 'mj_key',
      MAILJET_SECRET_KEY: 'mj_secret',
      EMAIL_FROM: 'AutiCare <hello@example.com>',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: 587,
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
    };
    expect(createMailTransport(all)?.provider).toBe('resend');
    expect(createMailTransport({ ...all, RESEND_API_KEY: undefined })?.provider).toBe('mailjet');
    expect(
      createMailTransport({
        ...all,
        RESEND_API_KEY: undefined,
        MAILJET_API_KEY: undefined,
        MAILJET_SECRET_KEY: undefined,
      })?.provider,
    ).toBe('smtp');
  });

  it('posts to the Resend API over HTTPS with the configured sender', async () => {
    const fetchImpl = okFetch();
    const transport = createMailTransport(
      { ...none, RESEND_API_KEY: 're_test', EMAIL_FROM: 'AutiCare <hello@example.com>' },
      fetchImpl,
    );
    await transport!.sendMail(message);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers).toMatchObject({ authorization: 'Bearer re_test' });
    expect(JSON.parse(init.body as string)).toMatchObject({
      from: 'AutiCare <hello@example.com>',
      to: ['parent@example.com'],
      subject: message.subject,
    });
  });

  it('falls back to the Resend test sender when no sender is set', async () => {
    const fetchImpl = okFetch();
    await createMailTransport({ ...none, RESEND_API_KEY: 're_test' }, fetchImpl)!.sendMail(message);
    const body = JSON.parse((fetchImpl.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.from).toBe('AutiCare <onboarding@resend.dev>');
  });

  it('posts to Mailjet with the sender split into name and address', async () => {
    const fetchImpl = okFetch();
    const transport = createMailTransport(
      {
        ...none,
        MAILJET_API_KEY: 'mj_key',
        MAILJET_SECRET_KEY: 'mj_secret',
        EMAIL_FROM: '"AutiCare" <hello@example.com>',
      },
      fetchImpl,
    );
    await transport!.sendMail(message);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.mailjet.com/v3.1/send');
    expect(init.headers).toMatchObject({
      authorization: `Basic ${Buffer.from('mj_key:mj_secret').toString('base64')}`,
    });
    expect(JSON.parse(init.body as string).Messages[0]).toMatchObject({
      From: { Email: 'hello@example.com', Name: 'AutiCare' },
      To: [{ Email: 'parent@example.com' }],
      Subject: message.subject,
    });
  });

  it('does not use Mailjet without a sender, since Mailjet would reject it', () => {
    expect(
      createMailTransport({ ...none, MAILJET_API_KEY: 'k', MAILJET_SECRET_KEY: 's' }),
    ).toBeUndefined();
  });

  it('throws when the provider refuses, so the mailer can log it', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response('domain not verified', { status: 403 }),
      ) as unknown as typeof fetch;
    await expect(
      createMailTransport({ ...none, RESEND_API_KEY: 're_test' }, fetchImpl)!.sendMail(message),
    ).rejects.toThrow(/Resend rejected the email \(403\): domain not verified/);
  });
});

describe('mailSender', () => {
  it('prefers EMAIL_FROM, then SMTP_FROM, then the SMTP user', () => {
    expect(mailSender({ ...none, EMAIL_FROM: 'a@x.com', SMTP_FROM: 'b@x.com' })).toBe('a@x.com');
    expect(mailSender({ ...none, SMTP_FROM: 'b@x.com', SMTP_USER: 'c@x.com' })).toBe('b@x.com');
    expect(mailSender({ ...none, SMTP_USER: 'c@x.com' })).toBe('c@x.com');
  });
});
