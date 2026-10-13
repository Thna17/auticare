import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

type InvitationEmail = {
  recipient: string;
  firstName: string;
  role: string;
  invitationUrl: string;
};

export class InvitationMailer {
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

  async sendInvitation({
    recipient,
    firstName,
    role,
    invitationUrl,
  }: InvitationEmail): Promise<void> {
    if (!this.transporter) return;

    const greeting = firstName.trim() || 'there';
    const roleLabel =
      role === 'SCHOOL'
        ? 'School Staff'
        : role === 'HOSPITAL'
          ? 'Hospital Staff'
          : 'Guardian / Parent';

    const text = [
      `Hello ${greeting},`,
      '',
      `You have been invited to AutiCare as a ${roleLabel}.`,
      'Please click the link below to set your account password and activate your account:',
      invitationUrl,
      '',
      'This invitation is secure, single-use, and expires in 72 hours.',
      'If you were not expecting this invitation, please contact support or disregard this email.',
    ].join('\n');

    await this.transporter.sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: recipient,
      subject: 'Welcome to AutiCare: Set up your account',
      text,
      html: `<p>Hello ${escapeHtml(greeting)},</p><p>You have been invited to AutiCare as a <strong>${escapeHtml(roleLabel)}</strong>.</p><p><a href="${escapeHtml(invitationUrl)}">Set up your account and password</a></p><p>This invitation is secure, single-use, and expires in 72 hours.</p>`,
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
