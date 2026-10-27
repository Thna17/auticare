import type {
  HospitalRegistration,
  HospitalRegistrationRequest,
  HospitalRegistrationStatus,
  RejectHospitalRegistrationRequest,
  UserRole,
} from '@auticare/contracts';
import type { HospitalRegistrationRequest as HospitalRegistrationRequestModel } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { logger } from '../../config/logger.js';
import { auditService } from '../audit/audit.service.js';
import { InvitationMailer } from '../auth/invitation-mailer.js';
import { HospitalsService } from '../hospitals/hospitals.service.js';
import { RegistrationsHospitalRepository } from './registrations.hospital.repository.js';

type Actor = { parentId: string; role: UserRole };

const toHospitalRegistration = (row: HospitalRegistrationRequestModel): HospitalRegistration => ({
  id: row.id,
  hospitalName: row.hospitalName,
  city: row.city,
  address: row.address,
  contactFirstName: row.contactFirstName,
  contactLastName: row.contactLastName,
  contactTitle: row.contactTitle,
  email: row.email,
  phone: row.phone,
  services: row.services,
  message: row.message,
  status: row.status,
  rejectionReason: row.rejectionReason,
  reviewedById: row.reviewedById,
  reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
  hospitalId: row.hospitalId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export class RegistrationsHospitalService {
  constructor(
    private readonly repository = new RegistrationsHospitalRepository(),
    private readonly hospitalsService = new HospitalsService(),
    private readonly mailer = new InvitationMailer(),
  ) {}

  /**
   * Public submission of a hospital registration request.
   * Responds with { received: true } even when not created to avoid email enumeration.
   */
  async submit(input: HospitalRegistrationRequest): Promise<{ received: boolean }> {
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
      hospitalName: input.hospitalName.trim(),
      city: input.city.trim(),
      address: input.address?.trim() || null,
      contactFirstName: input.contactFirstName.trim(),
      contactLastName: input.contactLastName.trim(),
      contactTitle: input.contactTitle?.trim() || null,
      email,
      phone: input.phone.trim(),
      services: input.services?.trim() || null,
      message: input.message?.trim() || null,
    });

    const admins = await this.repository.findAdminUsers();
    await this.repository.createAdminNotifications(
      admins.map((a) => a.id),
      input.hospitalName.trim(),
    );

    await auditService.record({
      action: 'HOSPITAL_REGISTRATION_SUBMITTED',
      targetEmail: email,
      metadata: {
        requestId: request.id,
        hospitalName: input.hospitalName.trim(),
        city: input.city.trim(),
      },
    });

    if (this.mailer.isConfigured()) {
      void this.mailer
        .sendHospitalRegistrationReceived({
          recipient: email,
          firstName: input.contactFirstName.trim(),
          hospitalName: input.hospitalName.trim(),
        })
        .catch((err: unknown) => {
          logger.warn({ err, email }, 'Failed to send hospital registration received email');
        });
    }

    return { received: true };
  }

  /**
   * List hospital registration requests, newest first.
   */
  async list(actor: Actor, status?: HospitalRegistrationStatus): Promise<HospitalRegistration[]> {
    if (actor.role !== 'ADMIN') throw forbidden();
    const rows = await this.repository.listRequests(status);
    return rows.map(toHospitalRegistration);
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
   * Atomically approve a registration request, create the hospital account, and send invitation.
   */
  async approve(actor: Actor, id: string): Promise<{ approved: boolean; hospitalId: string }> {
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

    let createdAccount: Awaited<ReturnType<HospitalsService['createAccount']>>;
    try {
      createdAccount = await this.hospitalsService.createAccount(actor, {
        hospital: {
          name: request.hospitalName,
          city: request.city,
          address: request.address?.trim() || request.city,
          services: request.services?.trim() || 'To be confirmed',
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

    await this.repository.updateApprovedHospitalId(id, createdAccount.hospital.id);

    await auditService.record({
      action: 'HOSPITAL_REGISTRATION_APPROVED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: id,
      targetEmail: request.email,
      metadata: {
        hospitalId: createdAccount.hospital.id,
        hospitalName: request.hospitalName,
      },
    });

    return { approved: true, hospitalId: createdAccount.hospital.id };
  }

  /**
   * Atomically reject a registration request, recording reason and emailing if configured.
   */
  async reject(
    actor: Actor,
    id: string,
    input: RejectHospitalRegistrationRequest,
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
          .sendHospitalRegistrationRejected({
            recipient: request.email,
            firstName: request.contactFirstName,
            hospitalName: request.hospitalName,
            reason,
          })
          .catch((err: unknown) => {
            logger.warn({ err, email: request.email }, 'Failed to send rejection email');
          });
      }

      await auditService.record({
        action: 'HOSPITAL_REGISTRATION_REJECTED',
        actorId: actor.parentId,
        actorRole: actor.role,
        targetId: id,
        targetEmail: request.email,
        metadata: {
          hospitalName: request.hospitalName,
          reason,
        },
      });
    }

    return { rejected: true };
  }
}
