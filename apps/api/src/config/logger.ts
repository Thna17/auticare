import pino from 'pino';
export const REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'req.body.password',
  'password',
  '*.password',
  'passwordHash',
  '*.passwordHash',
  'tokenHash',
  '*.tokenHash',
  'resetToken',
  '*.resetToken',
  'invitationToken',
  '*.invitationToken',
  'token',
  '*.token',
  'notes',
  '*.notes',
  'smtpUser',
  '*.smtpUser',
  'smtpPass',
  '*.smtpPass',
  'auth.user',
  '*.auth.user',
  'auth.pass',
  '*.auth.pass',
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: REDACT_PATHS,
    censor: '[Redacted]',
  },
});
