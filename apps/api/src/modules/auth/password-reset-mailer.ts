import { createMailTransport } from './mail-transport.js';
import { logger } from '../../config/logger.js';

type PasswordResetEmail = {
  recipient: string;
  firstName: string;
  resetUrl: string;
};

export class PasswordResetMailer {
  // Resend, Mailjet or SMTP, whichever is configured (see mail-transport.ts).
  private readonly transporter = createMailTransport();

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

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your AutiCare Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f6fa; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(29, 91, 121, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1d5b79 0%, #2e86ab 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">AutiCare</h1>
              <p style="margin: 6px 0 0 0; color: #dbeafe; font-size: 13px; font-weight: 500;">Connected Support Continuum for Neurodivergent Children</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Hello ${escapeHtml(greeting)},</h2>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                We received a request to reset your password for your <strong>AutiCare</strong> account.
              </p>
              <p style="margin: 0 0 28px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Click the secure button below to choose a new password:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #1d5b79;">
                    <a href="${escapeHtml(resetUrl)}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; background-color: #1d5b79;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f8fafc; border-left: 4px solid #2e86ab; padding: 14px 16px; border-radius: 6px; margin: 0 0 24px 0;">
                <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                  <strong>Security Note:</strong> This reset link expires in <strong>30 minutes</strong>. If the button does not work, copy and paste this link:
                </p>
                <p style="margin: 8px 0 0 0; word-break: break-all; color: #1d5b79; font-size: 12px; font-family: monospace;">
                  ${escapeHtml(resetUrl)}
                </p>
              </div>
              <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} AutiCare. Empowering every neurodivergent child in Cambodia.
              </p>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 11px;">
                Phnom Penh, Cambodia &bull; Crisis Resources: Kantha Bopha &amp; TPO Cambodia
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    try {
      await this.transporter.sendMail({
        to: recipient,
        subject: 'Reset your AutiCare password',
        text,
        html,
      });
    } catch (error) {
      logger.warn(
        { err: error, recipient },
        'Failed to deliver password reset email; request handled safely',
      );
    }
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
