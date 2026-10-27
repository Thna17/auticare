import type {
  AuthResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  PasswordResetRequest,
  PasswordResetResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  StaffSetupRequest,
  UserRole,
  UpdateMyProfileRequest,
} from '@auticare/contracts';
import { AppError, forbidden, unauthorized } from '../../common/errors/app-error.js';
import { env, isProduction } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AuthRepository } from './auth.repository.js';
import { toParentResponse } from './auth.mapper.js';
import { PasswordService } from './password.service.js';
import { PasswordResetMailer } from './password-reset-mailer.js';
import { TokenService } from './token.service.js';
import { hashShortCode } from './short-code.js';
import { isStaffPlaceholderEmail } from '../schools/staff-usernames.js';
import { auditService } from '../audit/audit.service.js';

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

  /**
   * `input.email` is the login identifier: an email address, or the username
   * of a school-managed teacher account. Usernames never contain "@".
   */
  async login(input: LoginRequest): Promise<AuthSession> {
    const identifier = input.email.trim().toLowerCase();
    const parent = identifier.includes('@')
      ? await this.repository.findParentByEmail(identifier)
      : await this.repository.findParentByUsername(identifier);
    if (!parent) throw unauthorized();
    const valid = await this.passwordService.verify(parent.passwordHash, input.password);
    if (!valid) throw unauthorized();
    await this.assertNotDeactivated(parent.id, parent.role);
    return this.issueSession(parent.id, parent.role, { parent: toParentResponse(parent) });
  }

  /**
   * A teacher's first sign-in with the username and setup code their school
   * gave them. The code only works together with that username, once, before
   * it expires. Every failure gives the same answer so neither part can be
   * probed on its own.
   */
  async staffSetup(input: StaffSetupRequest): Promise<AuthSession> {
    const rejected = () =>
      new AppError('VALIDATION_ERROR', 'That username and setup code do not match.', 400);

    const parent = await this.repository.findParentByUsername(input.username.trim().toLowerCase());
    if (!parent) throw rejected();

    const tokenHash = hashShortCode(input.setupCode, env.JWT_ACCESS_SECRET, 'staff-setup');
    const invitation = await this.repository.findOpenStaffSetup(parent.id, tokenHash);
    if (!invitation || invitation.expiresAt <= new Date()) throw rejected();

    await this.assertNotDeactivated(parent.id, parent.role);

    const passwordHash = await this.passwordService.hash(input.password);
    const updated = await this.repository.completeStaffSetup({
      parentId: parent.id,
      invitationId: invitation.id,
      passwordHash,
    });

    await auditService.record({
      action: 'STAFF_SETUP_COMPLETED',
      actorId: updated.id,
      actorRole: updated.role,
      targetId: updated.id,
      metadata: { invitationId: invitation.id },
    });

    return this.issueSession(updated.id, updated.role, { parent: toParentResponse(updated) });
  }

  /**
   * The platform admin can suspend any account, and a school can deactivate a
   * teacher. If every school this account belongs to has deactivated it, or
   * every one of those schools is suspended, the account cannot sign in.
   * Accounts with no staff rows (or any active one) are unaffected.
   */
  private async assertNotDeactivated(parentId: string, role: UserRole): Promise<void> {
    if (await this.repository.findSuspension(parentId)) {
      throw forbidden('This account has been suspended. Contact AutiCare support.');
    }
    if (role === 'SCHOOL') {
      const states = await this.repository.listSchoolStaffStates(parentId);
      if (states.length > 0 && states.every((state) => state.deactivatedAt !== null)) {
        throw forbidden('This account has been deactivated by your school.');
      }
      if (states.length > 0 && states.every((state) => state.school.status !== 'ACTIVE')) {
        throw forbidden("Your school's AutiCare access is suspended. Contact AutiCare support.");
      }
    } else if (role === 'HOSPITAL') {
      const states = await this.repository.listHospitalStaffStates(parentId);
      if (states.length > 0 && states.every((state) => state.deactivatedAt !== null)) {
        throw forbidden('This account has been deactivated by your hospital.');
      }
    }
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

    await this.assertNotDeactivated(storedToken.parent.id, storedToken.parent.role);

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

  /**
   * Update the signed-in account holder's own profile.
   *
   * An empty body is rejected rather than performed as a no-op write, matching
   * how the enrollment update behaves. Only the four accepted fields can move;
   * email, role and passwordHash are not part of the request shape.
   */
  async updateMyProfile(parentId: string, input: UpdateMyProfileRequest) {
    const data: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string | null;
      socialMediaAccount?: string | null;
    } = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber;
    if (input.socialMediaAccount !== undefined) {
      data.socialMediaAccount = input.socialMediaAccount;
    }

    if (Object.keys(data).length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Provide at least one field to update.', 400);
    }

    const existing = await this.repository.findParentById(parentId);
    if (!existing) throw unauthorized();

    const parent = await this.repository.updateProfile(parentId, data);
    return { parent: toParentResponse(parent) };
  }

  async requestPasswordReset(input: PasswordResetRequest): Promise<PasswordResetResponse> {
    const message = 'If an account exists for that email, a password reset link has been prepared.';
    const parent = await this.repository.findParentByEmail(input.email.toLowerCase());
    // School-managed teacher accounts have no inbox; their school resets them.
    if (!parent || isStaffPlaceholderEmail(parent.email)) return { message };

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
      void this.passwordResetMailer
        .sendPasswordReset({
          recipient: parent.email,
          firstName: parent.firstName,
          resetUrl: resetUrl.toString(),
        })
        .catch((err: unknown) => {
          logger.warn(
            { err, email: parent.email },
            'Failed to deliver password reset email in background',
          );
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

  async changePassword(
    parentId: string,
    input: ChangePasswordRequest,
    currentRefreshToken?: string,
  ): Promise<ChangePasswordResponse> {
    const parent = await this.repository.findParentById(parentId);
    if (!parent) throw unauthorized();

    const valid = await this.passwordService.verify(parent.passwordHash, input.currentPassword);
    if (!valid) {
      throw new AppError('VALIDATION_ERROR', 'Current password does not match.', 400);
    }

    const passwordHash = await this.passwordService.hash(input.newPassword);
    const currentTokenHash = currentRefreshToken
      ? this.tokenService.hashRefreshToken(currentRefreshToken)
      : undefined;

    await this.repository.changePassword(parentId, passwordHash, currentTokenHash);

    return { message: 'Password changed successfully.' };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.repository.revokeRefreshToken(this.tokenService.hashRefreshToken(refreshToken));
    }
  }

  async issueSession(
    parentId: string,
    role: UserRole,
    response: AuthResponse,
  ): Promise<AuthSession> {
    // Every way in (login, setup code, invitation) ends here, so this one check
    // covers them all.
    await this.assertNotDeactivated(parentId, role);
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
