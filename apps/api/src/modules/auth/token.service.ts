import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@auticare/contracts';
import { env, isProduction } from '../../config/env.js';

export type AuthTokenPayload = { sub: string; role: UserRole };

const durationPattern = /^(?<value>\d+)(?<unit>s|m|h|d)$/;

export const durationToMilliseconds = (duration: string): number => {
  const match = durationPattern.exec(duration);
  if (!match?.groups) throw new Error(`Invalid duration: ${duration}`);
  const value = Number(match.groups.value);
  const unit = match.groups.unit;
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return value * multipliers[unit as keyof typeof multipliers];
};

export class TokenService {
  createAccessToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.ACCESS_TOKEN_TTL,
    } as SignOptions);
  }

  createRefreshToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  createPasswordResetToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  hashPasswordResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  refreshTokenExpiresAt(): Date {
    return new Date(Date.now() + durationToMilliseconds(env.REFRESH_TOKEN_TTL));
  }

  passwordResetTokenExpiresAt(): Date {
    return new Date(Date.now() + durationToMilliseconds('30m'));
  }

  accessCookieMaxAge(): number {
    return durationToMilliseconds(env.ACCESS_TOKEN_TTL);
  }

  refreshCookieMaxAge(): number {
    return durationToMilliseconds(env.REFRESH_TOKEN_TTL);
  }

  verifyAccessToken(token: string): AuthTokenPayload {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'string' ||
      !['PARENT', 'ADMIN', 'SCHOOL'].includes(String(decoded.role))
    ) {
      throw new Error('Invalid token');
    }
    return { sub: decoded.sub, role: decoded.role as UserRole };
  }

  cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: isProduction,
      domain: env.COOKIE_DOMAIN || undefined,
      path: '/',
    };
  }
}
