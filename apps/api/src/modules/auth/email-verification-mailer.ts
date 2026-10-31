import { createMailTransport } from './mail-transport.js';
import { logger } from '../../config/logger.js';

type VerificationEmail = {
  recipient: string;
  firstName: string;
  code: string;
  expiresInMinutes: number;
};

/**
 * The six-digit code a new parent types to confirm their email. Sent in Khmer
 * and English together: at sign-up we do not yet know which the parent reads.
 */
export class EmailVerificationMailer {
  // Resend, Mailjet or SMTP, whichever is configured (see mail-transport.ts).
  private readonly transporter = createMailTransport();

  isConfigured(): boolean {
    return this.transporter !== undefined;
  }

  async sendVerificationCode({
    recipient,
    firstName,
    code,
    expiresInMinutes,
  }: VerificationEmail): Promise<void> {
    if (!this.transporter) return;

    const greeting = firstName.trim() || 'there';
    const text = [
      `សួស្តី ${greeting},`,
      '',
      `លេខកូដផ្ទៀងផ្ទាត់អ៊ីមែល AutiCare របស់អ្នកគឺ៖ ${code}`,
      `លេខកូដនេះប្រើបានរយៈពេល ${expiresInMinutes} នាទី។ កុំចែករំលែកវាជាមួយនរណាម្នាក់។`,
      '',
      '---',
      '',
      `Hello ${greeting},`,
      '',
      `Your AutiCare email verification code is: ${code}`,
      `It works for ${expiresInMinutes} minutes. Do not share it with anyone.`,
      '',
      'If you did not create an AutiCare account, you can ignore this email.',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AutiCare verification code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f6fa; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(29, 91, 121, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1d5b79 0%, #2e86ab 100%); padding: 28px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">AutiCare</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 36px 8px 36px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 19px; font-weight: 600;">សួស្តី ${escapeHtml(greeting)},</h2>
              <p style="margin: 0 0 6px 0; color: #475569; font-size: 15px; line-height: 1.7;">
                សូមបញ្ចូលលេខកូដខាងក្រោម ដើម្បីផ្ទៀងផ្ទាត់អ៊ីមែលរបស់អ្នក។
              </p>
              <p style="margin: 0 0 18px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Enter the code below to verify your email address.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #f0f6fa; border: 1px solid #cfe0ea; border-radius: 12px; padding: 22px 16px; text-align: center;">
                    <div style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1d5b79; padding-left: 10px;">${escapeHtml(code)}</div>
                    <div style="margin-top: 8px; font-size: 13px; color: #64748b;">
                      ប្រើបាន ${expiresInMinutes} នាទី · Works for ${expiresInMinutes} minutes
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 22px 36px 32px 36px;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 13px; line-height: 1.7;">
                កុំចែករំលែកលេខកូដនេះជាមួយនរណាម្នាក់។ ប្រសិនបើអ្នកមិនបានបង្កើតគណនី AutiCare ទេ អ្នកអាចមិនអើពើអ៊ីមែលនេះបាន។
              </p>
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                Never share this code. If you did not create an AutiCare account, you can ignore this email.
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
        subject: `AutiCare: ${code} គឺជាលេខកូដរបស់អ្នក · is your verification code`,
        text,
        html,
      });
    } catch (error) {
      logger.warn(
        { err: error, recipient },
        'Failed to deliver email verification code; the parent can ask for another',
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
