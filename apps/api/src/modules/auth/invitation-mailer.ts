import { createMailTransport } from './mail-transport.js';
import { logger } from '../../config/logger.js';

type InvitationEmail = {
  recipient: string;
  firstName: string;
  role: string;
  invitationUrl: string;
};

export class InvitationMailer {
  // Resend, Mailjet or SMTP, whichever is configured (see mail-transport.ts).
  private readonly transporter = createMailTransport();

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
      "Set a password to finish setting up your account. You'll be signed in straight away.",
      invitationUrl,
      '',
      'This invitation is secure, single-use, and expires in 72 hours.',
      'If you were not expecting this invitation, please contact support or disregard this email.',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AutiCare</title>
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
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Welcome, ${escapeHtml(greeting)}!</h2>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                You have been invited to join <strong>AutiCare</strong> as a <strong>${escapeHtml(roleLabel)}</strong>.
              </p>
              <p style="margin: 0 0 28px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Set a password to finish setting up your account. You'll be signed in straight away. Click the button below to set up your password:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #1d5b79;">
                    <a href="${escapeHtml(invitationUrl)}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; background-color: #1d5b79;">
                      Set Up Your Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f8fafc; border-left: 4px solid #2e86ab; padding: 14px 16px; border-radius: 6px; margin: 0 0 24px 0;">
                <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                  <strong>Security Note:</strong> This invitation is secure, single-use, and expires in <strong>72 hours</strong>. If the button does not work, copy and paste this link:
                </p>
                <p style="margin: 8px 0 0 0; word-break: break-all; color: #1d5b79; font-size: 12px; font-family: monospace;">
                  ${escapeHtml(invitationUrl)}
                </p>
              </div>
              <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                If you were not expecting this invitation, you can safely disregard this email or contact support.
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
        subject: 'Welcome to AutiCare: Set up your account',
        text,
        html,
      });
    } catch (error) {
      logger.warn(
        { err: error, recipient, role },
        'Failed to deliver invitation email; account provisioning completed',
      );
    }
  }

  async sendAccountActivated({
    recipient,
    firstName,
    activatedAt = new Date(),
  }: {
    recipient: string;
    firstName?: string;
    activatedAt?: Date;
  }): Promise<void> {
    if (!this.transporter || recipient.endsWith('@staff.auticare.invalid')) return;

    const greeting = (firstName ?? '').trim() || 'there';
    const dateFormatted =
      activatedAt.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }) + ' UTC';

    const text = [
      `Hello ${greeting},`,
      '',
      `Your AutiCare account was activated on ${dateFormatted}. If this wasn't you, contact support immediately.`,
      '',
      'AutiCare Team',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Account Activated</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f6fa; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(29, 91, 121, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1d5b79 0%, #2e86ab 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">AutiCare</h1>
              <p style="margin: 6px 0 0 0; color: #dbeafe; font-size: 13px;">Security Notice</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Hello, ${escapeHtml(greeting)}!</h2>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Your AutiCare account was activated on <strong>${escapeHtml(dateFormatted)}</strong>.
              </p>
              <div style="background-color: #f8fafc; border-left: 4px solid #2e86ab; padding: 14px 16px; border-radius: 6px; margin: 0 0 24px 0;">
                <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                  If this wasn't you, please contact support immediately to secure your account.
                </p>
              </div>
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
        subject: 'AutiCare: Your account has been activated',
        text,
        html,
      });
    } catch (error) {
      logger.warn({ err: error, recipient }, 'Failed to deliver account activation notice');
    }
  }

  async sendSchoolRegistrationReceived({
    recipient,
    firstName,
    schoolName,
  }: {
    recipient: string;
    firstName: string;
    schoolName: string;
  }): Promise<void> {
    if (!this.transporter) return;

    const greeting = firstName.trim() || 'there';
    const text = [
      `Hello ${greeting},`,
      '',
      `Thank you for your interest in AutiCare. We have received the registration request for ${schoolName}.`,
      'Our team is reviewing your request and will reach out with next steps soon.',
      '',
      'AutiCare Team',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>School Registration Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f6fa; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(29, 91, 121, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1d5b79 0%, #2e86ab 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">AutiCare</h1>
              <p style="margin: 6px 0 0 0; color: #dbeafe; font-size: 13px;">School Registration Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Hello, ${escapeHtml(greeting)}!</h2>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for submitting a registration request for <strong>${escapeHtml(schoolName)}</strong>.
              </p>
              <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Our administrative team will review your application and send an invitation link to set up your school account once approved.
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
        subject: `AutiCare: Registration request received for ${schoolName}`,
        text,
        html,
      });
    } catch (error) {
      logger.warn({ err: error, recipient }, 'Failed to deliver registration received email');
    }
  }

  async sendSchoolRegistrationRejected({
    recipient,
    firstName,
    schoolName,
    reason,
  }: {
    recipient: string;
    firstName: string;
    schoolName: string;
    reason: string;
  }): Promise<void> {
    if (!this.transporter) return;

    const greeting = firstName.trim() || 'there';
    const text = [
      `Hello ${greeting},`,
      '',
      `Thank you for your interest in AutiCare. Regarding the registration request for ${schoolName}:`,
      '',
      `Reason: ${reason}`,
      '',
      'If you have questions or believe this was an error, please contact our support team.',
      '',
      'AutiCare Team',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>School Registration Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f6fa; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(29, 91, 121, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1d5b79 0%, #2e86ab 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">AutiCare</h1>
              <p style="margin: 6px 0 0 0; color: #dbeafe; font-size: 13px;">School Registration Update</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Hello, ${escapeHtml(greeting)}!</h2>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for your interest in AutiCare. We are unable to approve the registration request for <strong>${escapeHtml(schoolName)}</strong> at this time.
              </p>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 6px; margin: 0 0 24px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                  <strong>Reason:</strong> ${escapeHtml(reason)}
                </p>
              </div>
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you have questions or would like to provide additional information, please contact our support team.
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
        subject: `AutiCare: Registration request update for ${schoolName}`,
        text,
        html,
      });
    } catch (error) {
      logger.warn({ err: error, recipient }, 'Failed to deliver registration rejection email');
    }
  }

  async sendHospitalRegistrationReceived({
    recipient,
    firstName,
    hospitalName,
  }: {
    recipient: string;
    firstName: string;
    hospitalName: string;
  }): Promise<void> {
    if (!this.transporter) return;

    const greeting = firstName.trim() || 'there';
    const text = [
      `Hello ${greeting},`,
      '',
      `Thank you for your interest in AutiCare. We have received the registration request for ${hospitalName}.`,
      'Our team is reviewing your request and will reach out with next steps soon.',
      '',
      'AutiCare Team',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hospital Registration Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f6fa; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(29, 91, 121, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1d5b79 0%, #2e86ab 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">AutiCare</h1>
              <p style="margin: 6px 0 0 0; color: #dbeafe; font-size: 13px;">Hospital Registration Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Hello, ${escapeHtml(greeting)}!</h2>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for submitting a registration request for <strong>${escapeHtml(hospitalName)}</strong>.
              </p>
              <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Our administrative team will review your application and send an invitation link to set up your hospital account once approved.
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
        subject: `AutiCare: Registration request received for ${hospitalName}`,
        text,
        html,
      });
    } catch (error) {
      logger.warn({ err: error, recipient }, 'Failed to deliver registration received email');
    }
  }

  async sendHospitalRegistrationRejected({
    recipient,
    firstName,
    hospitalName,
    reason,
  }: {
    recipient: string;
    firstName: string;
    hospitalName: string;
    reason: string;
  }): Promise<void> {
    if (!this.transporter) return;

    const greeting = firstName.trim() || 'there';
    const text = [
      `Hello ${greeting},`,
      '',
      `Thank you for your interest in AutiCare. Regarding the registration request for ${hospitalName}:`,
      '',
      `Reason: ${reason}`,
      '',
      'If you have questions or believe this was an error, please contact our support team.',
      '',
      'AutiCare Team',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hospital Registration Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f6fa; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(29, 91, 121, 0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1d5b79 0%, #2e86ab 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">AutiCare</h1>
              <p style="margin: 6px 0 0 0; color: #dbeafe; font-size: 13px;">Hospital Registration Update</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">Hello, ${escapeHtml(greeting)}!</h2>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for your interest in AutiCare. We are unable to approve the registration request for <strong>${escapeHtml(hospitalName)}</strong> at this time.
              </p>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 6px; margin: 0 0 24px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                  <strong>Reason:</strong> ${escapeHtml(reason)}
                </p>
              </div>
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you have questions or would like to provide additional information, please contact our support team.
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
        subject: `AutiCare: Registration request update for ${hospitalName}`,
        text,
        html,
      });
    } catch (error) {
      logger.warn({ err: error, recipient }, 'Failed to deliver registration rejection email');
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
