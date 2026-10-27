import type {
  RejectSchoolRegistrationRequest,
  SchoolRegistration,
  SchoolRegistrationRequest,
  SchoolRegistrationStatus,
  UserRole,
} from '@auticare/contracts';
import type { SchoolRegistrationRequest as SchoolRegistrationRequestModel } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { logger } from '../../config/logger.js';
import { auditService } from '../audit/audit.service.js';
import { InvitationMailer } from '../auth/invitation-mailer.js';
import { SchoolsService } from '../schools/schools.service.js';
import { RegistrationsRepository } from './registrations.repository.js';

type Actor = { parentId: string; role: UserRole };

const toSchoolRegistration = (row: SchoolRegistrationRequestModel): SchoolRegistration => ({
  id: row.id,
  schoolName: row.schoolName,
  city: row.city,
  address: row.address,
  contactFirstName: row.contactFirstName,
  contactLastName: row.contactLastName,
  contactTitle: row.contactTitle,
  email: row.email,
  phone: row.phone,
  studentCount: row.studentCount,
  message: row.message,
  status: row.status,
  rejectionReason: row.rejectionReason,
  reviewedById: row.reviewedById,
  reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
  schoolId: row.schoolId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export class RegistrationsService {
  constructor(
    private readonly repository = new RegistrationsRepository(),
    private readonly schoolsService = new SchoolsService(),
    private readonly mailer = new InvitationMailer(),
  ) {}

  /**
   * Public submission of a school registration request.
   * Responds with { received: true } even when not created to avoid email enumeration.
   */
  async submit(input: SchoolRegistrationRequest): Promise<{ received: boolean }> {
    const email = input.email.toLowerCase().trim();

    // Check if account already exists or has a pending request
    const [existingAccount, existingPending] = await Promise.all([
      this.repository.findParentByEmail(email),
      this.repository.findPendingRequestByEmail(email),
    ]);

    if (existingAccount || existingPending) {
      return { received: true };
    }

    const request = await this.repository.createRequest({
      schoolName: input.schoolName.trim(),
      city: input.city.trim(),
      address: input.address?.trim() || null,
      contactFirstName: input.contactFirstName.trim(),
      contactLastName: input.contactLastName.trim(),
      contactTitle: input.contactTitle?.trim() || null,
      email,
      phone: input.phone.trim(),
      studentCount: input.studentCount ?? null,
      message: input.message?.trim() || null,
    });

    const admins = await this.repository.findAdminUsers();
    await this.repository.createAdminNotifications(
      admins.map((a) => a.id),
      input.schoolName.trim(),
    );

    await auditService.record({
      action: 'SCHOOL_REGISTRATION_SUBMITTED',
      targetEmail: email,
      metadata: {
        requestId: request.id,
        schoolName: input.schoolName.trim(),
        city: input.city.trim(),
      },
    });

    if (this.mailer.isConfigured()) {
      void this.mailer
        .sendSchoolRegistrationReceived({
          recipient: email,
          firstName: input.contactFirstName.trim(),
          schoolName: input.schoolName.trim(),
        })
        .catch((err: unknown) => {
          logger.warn({ err, email }, 'Failed to send school registration received email');
        });
    }

    return { received: true };
  }

  /**
   * List school registration requests, newest first.
   */
  async list(actor: Actor, status?: SchoolRegistrationStatus): Promise<SchoolRegistration[]> {
    if (actor.role !== 'ADMIN') throw forbidden();
    const rows = await this.repository.listRequests(status);
    return rows.map(toSchoolRegistration);
  }

  /**
   * Count pending registration requests for admin navigation badges.
   */
  async pendingCount(actor: Actor): Promise<{ count: number }> {
    if (actor.role !== 'ADMIN') throw forbidden();
    const count = await this.repository.countPending();
    return { count };
  }

  /**
   * Atomically approve a registration request, create the school account, and send invitation.
   */
  async approve(actor: Actor, id: string): Promise<{ approved: boolean; schoolId: string }> {
    if (actor.role !== 'ADMIN') throw forbidden();

    const claimed = await this.repository.claimPendingForApproval(id, actor.parentId);
    if (claimed.count === 0) {
      throw new AppError(
        'CONFLICT',
        'Registration request has already been reviewed or does not exist.',
        409,
      );
    }

    const request = await this.repository.findById(id);
    if (!request) {
      throw notFound('Registration request was not found.');
    }

    // Only a failed account creation returns the request to PENDING. Once the
    // account exists, re-approving would fail on the duplicate email.
    let createdAccount: Awaited<ReturnType<SchoolsService['createSchoolAccount']>>;
    try {
      createdAccount = await this.schoolsService.createSchoolAccount(actor, {
        school: {
          name: request.schoolName,
          city: request.city,
          address: request.address?.trim() || request.city,
          description: request.message?.trim() || undefined,
        },
        account: {
          email: request.email,
          firstName: request.contactFirstName,
          lastName: request.contactLastName,
          title: request.contactTitle?.trim() || undefined,
        },
      });
    } catch (error) {
      await this.repository.revertToPending(id);
      throw error;
    }

    await this.repository.updateApprovedSchoolId(id, createdAccount.school.id);

    await auditService.record({
      action: 'SCHOOL_REGISTRATION_APPROVED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: id,
      targetEmail: request.email,
      metadata: {
        schoolId: createdAccount.school.id,
        schoolName: request.schoolName,
      },
    });

    return { approved: true, schoolId: createdAccount.school.id };
  }

  /**
   * Atomically reject a registration request, recording reason and emailing if configured.
   */
  async reject(
    actor: Actor,
    id: string,
    input: RejectSchoolRegistrationRequest,
  ): Promise<{ rejected: boolean }> {
    if (actor.role !== 'ADMIN') throw forbidden();

    const reason = input.reason.trim();
    const claimed = await this.repository.claimPendingForRejection(id, actor.parentId, reason);
    if (claimed.count === 0) {
      throw new AppError(
        'CONFLICT',
        'Registration request has already been reviewed or does not exist.',
        409,
      );
    }

    const request = await this.repository.findById(id);
    if (request) {
      if (this.mailer.isConfigured()) {
        void this.mailer
          .sendSchoolRegistrationRejected({
            recipient: request.email,
            firstName: request.contactFirstName,
            schoolName: request.schoolName,
            reason,
          })
          .catch((err: unknown) => {
            logger.warn({ err, email: request.email }, 'Failed to send rejection email');
          });
      }

      await auditService.record({
        action: 'SCHOOL_REGISTRATION_REJECTED',
        actorId: actor.parentId,
        actorRole: actor.role,
        targetId: id,
        targetEmail: request.email,
        metadata: {
          schoolName: request.schoolName,
          reason,
        },
      });
    }

    return { rejected: true };
  }
}
