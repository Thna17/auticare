import type {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  ResendInvitationRequest,
  ResendInvitationResponse,
  VerifyInvitationResponse,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { env, isProduction } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { prisma } from '../../database/prisma.js';
import { auditService } from '../audit/audit.service.js';
import { toParentResponse } from './auth.mapper.js';
import { InvitationMailer } from './invitation-mailer.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';

export class InvitationService {
  constructor(
    private readonly tokenService = new TokenService(),
    private readonly passwordService = new PasswordService(),
    private readonly mailer = new InvitationMailer(),
  ) {}

  /**
   * Create an invitation token, save the hash in database, send invitation email,
   * and record an audit event.
   */
  async createInvitation(params: {
    email: string;
    role: UserRole;
    firstName: string;
    parentId?: string | null | undefined;
    schoolId?: string | null | undefined;
    hospitalId?: string | null | undefined;
    title?: string | null | undefined;
    createdById?: string | null | undefined;
    actorRole?: string | null | undefined;
  }): Promise<{ token: string; invitationUrl: string }> {
    const email = params.email.toLowerCase().trim();
    const token = this.tokenService.createInvitationToken();
    const tokenHash = this.tokenService.hashInvitationToken(token);
    const expiresAt = this.tokenService.invitationTokenExpiresAt();

    // Revoke any previous active invitations for this email
    await prisma.accountInvitation.updateMany({
      where: {
        email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await prisma.accountInvitation.create({
      data: {
        email,
        tokenHash,
        role: params.role,
        parentId: params.parentId ?? null,
        schoolId: params.schoolId ?? null,
        hospitalId: params.hospitalId ?? null,
        title: params.title ?? null,
        expiresAt,
        createdById: params.createdById ?? null,
      },
    });

    const invitationUrl = new URL('/accept-invitation', env.APP_ORIGIN);
    invitationUrl.searchParams.set('token', token);

    const isTestRun = env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    if (!isTestRun && this.mailer.isConfigured()) {
      void this.mailer
        .sendInvitation({
          recipient: email,
          firstName: params.firstName,
          role: params.role,
          invitationUrl: invitationUrl.toString(),
        })
        .catch((err: unknown) => {
          logger.warn({ err, email }, 'Failed to deliver invitation email in background');
        });
    }

    await auditService.record({
      action: 'INVITATION_CREATED',
      actorId: params.createdById,
      actorRole: params.actorRole,
      targetId: params.parentId,
      targetEmail: email,
      metadata: {
        role: params.role,
        schoolId: params.schoolId,
        hospitalId: params.hospitalId,
      },
    });

    return { token, invitationUrl: invitationUrl.toString() };
  }

  /**
   * Verify an invitation token for presentation in the UI.
   */
  async verifyInvitation(token: string): Promise<VerifyInvitationResponse> {
    const tokenHash = this.tokenService.hashInvitationToken(token);
    const invitation = await prisma.accountInvitation.findUnique({
      where: { tokenHash },
      include: { parent: true },
    });

    if (!invitation) {
      throw notFound('This invitation link is invalid.');
    }
    if (invitation.revokedAt) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This invitation has been revoked. Please request a new one.',
        400,
      );
    }
    if (invitation.acceptedAt) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This invitation has already been accepted. Please log in.',
        400,
      );
    }
    if (invitation.expiresAt <= new Date()) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This invitation has expired. Please request a new one.',
        400,
      );
    }

    let organizationName: string | null = null;
    if (invitation.schoolId) {
      const school = await prisma.school.findUnique({ where: { id: invitation.schoolId } });
      organizationName = school?.name ?? null;
    } else if (invitation.hospitalId) {
      const hospital = await prisma.hospital.findUnique({ where: { id: invitation.hospitalId } });
      organizationName = hospital?.name ?? null;
    }

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
      firstName: invitation.parent?.firstName ?? '',
      lastName: invitation.parent?.lastName ?? '',
      organizationName,
    };
  }

  /**
   * Accept an invitation: set the initial password, clear mustResetPassword,
   * mark invitation accepted, revoke active sessions, and record audit event.
   */
  async acceptInvitation(input: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
    const tokenHash = this.tokenService.hashInvitationToken(input.token);
    const invitation = await prisma.accountInvitation.findUnique({
      where: { tokenHash },
      include: { parent: true },
    });

    if (!invitation) {
      throw notFound('This invitation link is invalid.');
    }
    if (invitation.revokedAt) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This invitation has been revoked. Please request a new one.',
        400,
      );
    }
    if (invitation.acceptedAt) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This invitation has already been accepted. Please log in.',
        400,
      );
    }
    if (invitation.expiresAt <= new Date()) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This invitation has expired. Please request a new one.',
        400,
      );
    }

    const parent =
      invitation.parent ?? (await prisma.parent.findUnique({ where: { email: invitation.email } }));
    if (!parent) {
      throw notFound('Account linked to this invitation was not found.');
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const updatedParent = await prisma.$transaction(async (tx) => {
      const updated = await tx.parent.update({
        where: { id: parent.id },
        data: {
          passwordHash,
          mustResetPassword: false,
        },
      });

      await tx.accountInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // Revoke any other pending invitations for this email
      await tx.accountInvitation.updateMany({
        where: {
          email: invitation.email,
          id: { not: invitation.id },
          acceptedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      // Revoke existing refresh tokens if any exist
      await tx.refreshToken.updateMany({
        where: { parentId: parent.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return updated;
    });

    await auditService.record({
      action: 'INVITATION_ACCEPTED',
      actorId: updatedParent.id,
      actorRole: updatedParent.role,
      targetId: updatedParent.id,
      targetEmail: updatedParent.email,
      metadata: {
        invitationId: invitation.id,
      },
    });

    return {
      message: 'Account password configured successfully. You may now sign in.',
      parent: toParentResponse(updatedParent),
    };
  }

  /**
   * Resend an invitation for an unaccepted account.
   */
  async resendInvitation(
    input: ResendInvitationRequest,
    actor?: { parentId: string; role: UserRole },
  ): Promise<ResendInvitationResponse> {
    const email = input.email.toLowerCase().trim();
    const parent = await prisma.parent.findUnique({ where: { email } });
    if (!parent) {
      throw notFound('Account not found with this email.');
    }

    // Must be either an admin or a school staff member resending for their own guardian
    if (actor && actor.role !== 'ADMIN') {
      if (actor.role === 'SCHOOL') {
        const staff = await prisma.schoolStaff.findFirst({ where: { parentId: actor.parentId } });
        if (!staff) throw forbidden();
        const enrolled = await prisma.schoolChildEnrollment.findFirst({
          where: {
            schoolId: staff.schoolId,
            child: { parentId: parent.id },
          },
        });
        if (!enrolled) throw forbidden();
      } else {
        throw forbidden();
      }
    }

    const { invitationUrl } = await this.createInvitation({
      email,
      role: parent.role,
      firstName: parent.firstName,
      parentId: parent.id,
      createdById: actor?.parentId,
      actorRole: actor?.role,
    });

    await auditService.record({
      action: 'INVITATION_RESENT',
      actorId: actor?.parentId,
      actorRole: actor?.role,
      targetId: parent.id,
      targetEmail: email,
    });

    const isTestRun = env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    return {
      message: 'Invitation resent successfully.',
      invitationUrl: !isProduction || isTestRun ? invitationUrl : undefined,
    };
  }
}

export const invitationService = new InvitationService();
