import type {
  AuthResponse,
  LoginRequest,
  PasswordResetRequest,
  PasswordResetResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UserRole,
} from '@auticare/contracts';
import { AppError, unauthorized } from '../../common/errors/app-error.js';
import { env, isProduction } from '../../config/env.js';
import { AuthRepository } from './auth.repository.js';
import { toParentResponse } from './auth.mapper.js';
import { PasswordService } from './password.service.js';
import { PasswordResetMailer } from './password-reset-mailer.js';
import { TokenService } from './token.service.js';

export type AuthSession = AuthResponse & { accessToken: string; refreshToken: string };

export class AuthService {
  constructor(
    private readonly repository = new AuthRepository(),
    private readonly passwordService = new PasswordService(),
    private readonly tokenService = new TokenService(),
    private readonly passwordResetMailer = new PasswordResetMailer(),
  ) {}

  async register(input: RegisterRequest): Promise<AuthSession> {
    const existing = await this.repository.findParentByEmail(input.email.toLowerCase());
    if (existing) throw new AppError('CONFLICT', 'An account with this email already exists.', 409);
    const passwordHash = await this.passwordService.hash(input.password);
    const parent = await this.repository.createParent({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });
    return this.issueSession(parent.id, parent.role, { parent: toParentResponse(parent) });
  }

  async login(input: LoginRequest): Promise<AuthSession> {
    const parent = await this.repository.findParentByEmail(input.email.toLowerCase());
    if (!parent) throw unauthorized();
    const valid = await this.passwordService.verify(parent.passwordHash, input.password);
    if (!valid) throw unauthorized();
    return this.issueSession(parent.id, parent.role, { parent: toParentResponse(parent) });
  }

  async refresh(refreshToken?: string): Promise<AuthSession> {
    if (!refreshToken) throw unauthorized();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const storedToken = await this.repository.findRefreshTokenWithParent(tokenHash);
    if (!storedToken) throw unauthorized();

    if (storedToken.revokedAt) {
      await this.repository.revokeAllParentRefreshTokens(storedToken.parentId);
      throw unauthorized();
    }

    if (storedToken.expiresAt <= new Date()) {
      await this.repository.revokeRefreshToken(tokenHash);
      throw unauthorized();
    }

    const nextRefreshToken = this.tokenService.createRefreshToken();
    await this.repository.rotateRefreshToken({
      currentTokenId: storedToken.id,
      parentId: storedToken.parentId,
      nextTokenHash: this.tokenService.hashRefreshToken(nextRefreshToken),
      nextExpiresAt: this.tokenService.refreshTokenExpiresAt(),
    });

    return {
      parent: toParentResponse(storedToken.parent),
      accessToken: this.tokenService.createAccessToken({
        sub: storedToken.parentId,
        role: storedToken.parent.role,
      }),
      refreshToken: nextRefreshToken,
    };
  }

  async me(parentId: string) {
    const parent = await this.repository.findParentById(parentId);
    if (!parent) throw unauthorized();
    return { parent: toParentResponse(parent) };
  }

  async requestPasswordReset(input: PasswordResetRequest): Promise<PasswordResetResponse> {
    const message = 'If an account exists for that email, a password reset link has been prepared.';
    const parent = await this.repository.findParentByEmail(input.email.toLowerCase());
    if (!parent) return { message };

    const resetToken = this.tokenService.createPasswordResetToken();
    await this.repository.createPasswordResetToken({
      parentId: parent.id,
      tokenHash: this.tokenService.hashPasswordResetToken(resetToken),
      expiresAt: this.tokenService.passwordResetTokenExpiresAt(),
    });

    const resetUrl = new URL('/reset-password', env.APP_ORIGIN);
    resetUrl.searchParams.set('token', resetToken);

    const isTestRun = env.NODE_ENV === 'test' || process.env.VITEST === 'true';

    if (!isTestRun && this.passwordResetMailer.isConfigured()) {
      await this.passwordResetMailer.sendPasswordReset({
        recipient: parent.email,
        firstName: parent.firstName,
        resetUrl: resetUrl.toString(),
      });
    }

    if (isProduction || (!isTestRun && this.passwordResetMailer.isConfigured())) return { message };

    return { message, resetToken, resetUrl: resetUrl.toString() };
  }

  async resetPassword(input: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const tokenHash = this.tokenService.hashPasswordResetToken(input.token);
    const storedToken = await this.repository.findPasswordResetTokenWithParent(tokenHash);

    if (!storedToken || storedToken.usedAt || storedToken.expiresAt <= new Date()) {
      throw new AppError('VALIDATION_ERROR', 'This reset link is invalid or expired.', 400);
    }

    const passwordHash = await this.passwordService.hash(input.password);
    await this.repository.completePasswordReset({
      tokenId: storedToken.id,
      parentId: storedToken.parentId,
      passwordHash,
    });

    return { message: 'Your password has been reset. You can now log in.' };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.repository.revokeRefreshToken(this.tokenService.hashRefreshToken(refreshToken));
    }
  }

  private async issueSession(
    parentId: string,
    role: UserRole,
    response: AuthResponse,
  ): Promise<AuthSession> {
    const accessToken = this.tokenService.createAccessToken({ sub: parentId, role });
    const refreshToken = this.tokenService.createRefreshToken();
    await this.repository.createRefreshToken({
      parentId,
      tokenHash: this.tokenService.hashRefreshToken(refreshToken),
      expiresAt: this.tokenService.refreshTokenExpiresAt(),
    });
    return { ...response, accessToken, refreshToken };
  }
}
