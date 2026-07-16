import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

type PasswordResetEmail = {
  recipient: string;
  firstName: string;
  resetUrl: string;
};

export class PasswordResetMailer {
  private readonly transporter = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT!,
        secure: env.SMTP_PORT === 465,
        requireTLS: env.SMTP_PORT === 587,
        auth: {
          user: env.SMTP_USER!,
          pass: env.SMTP_PASS!,
        },
      })
    : undefined;

  isConfigured(): boolean {
    return this.transporter !== undefined;
  }

  async sendPasswordReset({ recipient, firstName, resetUrl }: PasswordResetEmail): Promise<void> {
    if (!this.transporter) return;

    const greeting = firstName.trim() || 'there';
    const text = [
      `Hello ${greeting},`,
      '',
      'We received a request to reset your AutiCare password.',
      'Use this link to choose a new password:',
      resetUrl,
      '',
      'This link expires in 30 minutes. If you did not request a reset, you can ignore this email.',
    ].join('\n');

    await this.transporter.sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: recipient,
      subject: 'Reset your AutiCare password',
      text,
      html: `<p>Hello ${escapeHtml(greeting)},</p><p>We received a request to reset your AutiCare password.</p><p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request a reset, you can ignore this email.</p>`,
    });
  }
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character] ?? character;
  });
