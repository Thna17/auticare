import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type MailProvider = 'resend' | 'mailjet' | 'smtp';

/** One way of delivering email. The mailers own the wording; this only sends. */
export interface MailTransport {
  readonly provider: MailProvider;
  sendMail(message: MailMessage): Promise<void>;
}

type MailConfig = Pick<
  typeof env,
  | 'RESEND_API_KEY'
  | 'MAILJET_API_KEY'
  | 'MAILJET_SECRET_KEY'
  | 'EMAIL_FROM'
  | 'SMTP_HOST'
  | 'SMTP_PORT'
  | 'SMTP_USER'
  | 'SMTP_PASS'
  | 'SMTP_FROM'
>;

const HTTP_TIMEOUT_MS = 15_000;

/**
 * The sender address. Resend has a shared test sender, which only delivers to
 * the Resend account's own address; anything else needs EMAIL_FROM on a domain
 * verified in Resend.
 */
export const mailSender = (config: MailConfig = env): string | undefined =>
  config.EMAIL_FROM ?? config.SMTP_FROM ?? config.SMTP_USER;

/** `"Name" <a@b.c>` or `a@b.c`, in the shape Mailjet wants. */
const parseAddress = (value: string): { Email: string; Name?: string } => {
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(value);
  if (!match) return { Email: value.trim() };
  const name = (match[1] ?? '').trim();
  return { Email: (match[2] ?? '').trim(), ...(name ? { Name: name } : {}) };
};

const failure = async (provider: string, response: Response): Promise<Error> =>
  new Error(
    `${provider} rejected the email (${response.status}): ${(await response.text()).slice(0, 300)}`,
  );

/**
 * Picks how email goes out: Resend, then Mailjet, then SMTP. Resend and Mailjet
 * are HTTPS APIs on port 443, which is what works on hosts that block SMTP ports
 * (Render's free tier). Returns undefined when nothing is configured, and the
 * mailers then skip sending, exactly as they did before any provider existed.
 */
export const createMailTransport = (
  config: MailConfig = env,
  fetchImpl: typeof fetch = fetch,
): MailTransport | undefined => {
  const from = mailSender(config);

  if (config.RESEND_API_KEY) {
    const key = config.RESEND_API_KEY;
    return {
      provider: 'resend',
      async sendMail(message) {
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            from: from ?? 'AutiCare <onboarding@resend.dev>',
            to: [message.to],
            subject: message.subject,
            text: message.text,
            html: message.html,
          }),
          signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        });
        if (!response.ok) throw await failure('Resend', response);
      },
    };
  }

  if (config.MAILJET_API_KEY && config.MAILJET_SECRET_KEY && from) {
    const auth = Buffer.from(`${config.MAILJET_API_KEY}:${config.MAILJET_SECRET_KEY}`).toString(
      'base64',
    );
    return {
      provider: 'mailjet',
      async sendMail(message) {
        const response = await fetchImpl('https://api.mailjet.com/v3.1/send', {
          method: 'POST',
          headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            Messages: [
              {
                From: parseAddress(from),
                To: [{ Email: message.to }],
                Subject: message.subject,
                TextPart: message.text,
                HTMLPart: message.html,
              },
            ],
          }),
          signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        });
        if (!response.ok) throw await failure('Mailjet', response);
      },
    };
  }

  if (config.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT!,
      secure: config.SMTP_PORT === 465,
      requireTLS: config.SMTP_PORT === 587,
      auth: {
        user: config.SMTP_USER!,
        pass: config.SMTP_PASS!,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
    return {
      provider: 'smtp',
      async sendMail(message) {
        await transporter.sendMail({ from, ...message });
      },
    };
  }

  return undefined;
};
