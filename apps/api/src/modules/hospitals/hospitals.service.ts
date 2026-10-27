import crypto from 'node:crypto';
import type {
  AdminHospitalAccountResponse,
  CreateHospitalAccountRequest,
  CreateHospitalRequest,
  ToggleFavoriteHospitalResponse,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { env, isProduction } from '../../config/env.js';
import { auditService } from '../audit/audit.service.js';
import { invitationService } from '../auth/invitation.service.js';
import { PasswordService } from '../auth/password.service.js';
import { toHospitalResponse } from './hospitals.mapper.js';
import { HospitalsRepository } from './hospitals.repository.js';

type Actor = { parentId?: string; role: UserRole };

export class HospitalsService {
  constructor(
    private readonly repository = new HospitalsRepository(),
    private readonly passwords = new PasswordService(),
  ) {}

  async list(actor?: Actor) {
    const hospitals = await this.repository.list();
    if (actor?.role === 'PARENT' && actor.parentId) {
      const favorites = await this.repository.listFavoriteHospitalIds(actor.parentId);
      const favSet = new Set(favorites.map((f) => f.hospitalId));
      return hospitals.map((h) => toHospitalResponse(h, favSet.has(h.id)));
    }
    return hospitals.map((h) => toHospitalResponse(h, false));
  }

  async toggleFavorite(actor: Actor, hospitalId: string): Promise<ToggleFavoriteHospitalResponse> {
    if (actor.role !== 'PARENT' || !actor.parentId) throw forbidden();
    const hospital = await this.repository.findHospitalById(hospitalId);
    if (!hospital) throw notFound('Hospital was not found.');

    const existing = await this.repository.findFavorite(actor.parentId, hospitalId);
    if (existing) {
      await this.repository.removeFavorite(actor.parentId, hospitalId);
      return { hospitalId, isFavorite: false };
    }
    await this.repository.addFavorite(actor.parentId, hospitalId);
    return { hospitalId, isFavorite: true };
  }

  async create(actor: Actor, input: CreateHospitalRequest) {
    if (actor.role !== 'ADMIN') throw forbidden();
    return toHospitalResponse(await this.repository.create(input), false);
  }

  async createAccount(
    actor: Actor,
    input: CreateHospitalAccountRequest,
  ): Promise<AdminHospitalAccountResponse> {
    if (actor.role !== 'ADMIN') throw forbidden();
    const email = input.account.email.toLowerCase();
    if (await this.repository.findParentByEmail(email))
      throw new AppError('CONFLICT', 'An account with this email already exists.', 409);

    const hasPassword = Boolean(input.account.password);
    const passwordHash = hasPassword
      ? await this.passwords.hash(input.account.password!)
      : await this.passwords.hash(crypto.randomUUID());

    const record = await this.repository.createHospitalAccount({
      hospital: {
        name: input.hospital.name.trim(),
        city: input.hospital.city.trim(),
        address: input.hospital.address.trim(),
        services: input.hospital.services.trim(),
      },
      account: {
        email,
        passwordHash,
        firstName: input.account.firstName.trim(),
        lastName: input.account.lastName.trim(),
        title: input.account.title?.trim() || null,
        mustResetPassword: !hasPassword,
      },
    });

    const invitation = await invitationService.createInvitation({
      email,
      role: 'HOSPITAL',
      firstName: input.account.firstName.trim(),
      parentId: record.account.id,
      hospitalId: record.hospital.id,
      title: input.account.title?.trim() || null,
      createdById: actor.parentId,
      actorRole: actor.role,
    });

    await auditService.record({
      action: 'HOSPITAL_ACCOUNT_PROVISIONED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: record.account.id,
      targetEmail: email,
      metadata: { hospitalId: record.hospital.id },
    });

    const isTestRun = env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    return {
      hospital: toHospitalResponse(record.hospital, false),
      staff: record.staff,
      account: {
        id: record.account.id,
        email: record.account.email,
        firstName: record.account.firstName,
        lastName: record.account.lastName,
        role: record.account.role,
        mustResetPassword: record.account.mustResetPassword,
        phoneNumber: record.account.phoneNumber,
        socialMediaAccount: record.account.socialMediaAccount,
      },
      invitationSent: true,
      invitationUrl: !isProduction || isTestRun ? invitation.invitationUrl : undefined,
    };
  }

  async listAccounts(actor: Actor) {
    if (actor.role !== 'ADMIN') throw forbidden();
    return (await this.repository.listHospitalAccounts()).map((record) => ({
      hospital: toHospitalResponse(record.hospital, false),
      staff: record.staff,
      account: {
        id: record.account.id,
        email: record.account.email,
        firstName: record.account.firstName,
        lastName: record.account.lastName,
        role: record.account.role,
      },
    }));
  }
}
