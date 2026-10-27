import crypto from 'node:crypto';
import type {
  CreateHospitalStaffRequest,
  HospitalStaffCredentialsResponse,
  HospitalStaffMember,
  HospitalStaffRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { auditService } from '../audit/audit.service.js';
import { createShortCode, hashShortCode } from '../auth/short-code.js';
import { PasswordService } from '../auth/password.service.js';
import {
  baseStaffUsername,
  nextFreeUsername,
  staffPlaceholderEmail,
} from '../auth/staff-usernames.js';
import { requireHospitalAdmin } from './hospital.scope.js';
import { HospitalTeamRepository } from './hospital.team.repository.js';
import { HospitalManagementRepository } from './hospital-management.repository.js';

type Actor = { parentId: string; role: string };

const SETUP_CODE_TTL_MS = 72 * 60 * 60 * 1000;

type StaffRow = Awaited<ReturnType<HospitalTeamRepository['listStaff']>>[number];

const toStaffMember = (row: StaffRow): HospitalStaffMember => ({
  id: row.id,
  firstName: row.parent.firstName,
  lastName: row.parent.lastName,
  title: row.title,
  role: (row.role as HospitalStaffRole) || 'COORDINATOR',
  username: row.parent.username,
  status: row.deactivatedAt
    ? 'DEACTIVATED'
    : row.parent.mustResetPassword
      ? 'SETUP_PENDING'
      : 'ACTIVE',
  doctorId: row.doctorId ?? null,
  doctorName: row.doctor?.fullName ?? null,
});

export class HospitalTeamService {
  constructor(
    private readonly team = new HospitalTeamRepository(),
    private readonly hospitalManagement = new HospitalManagementRepository(),
    private readonly passwords = new PasswordService(),
  ) {}

  private async requireStaff(actor: Actor) {
    if (actor.role !== 'HOSPITAL') throw forbidden();
    const staff = await this.hospitalManagement.staff(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }

  private async requireAdmin(actor: Actor) {
    const staff = await this.requireStaff(actor);
    requireHospitalAdmin(staff);
    return staff;
  }

  private async reloadMember(staffId: string, hospitalId: string): Promise<HospitalStaffMember> {
    const row = await this.team.findStaffWithAccount(staffId, hospitalId);
    if (!row) throw notFound('Staff member was not found.');
    return toStaffMember(row);
  }

  async listStaff(actor: Actor): Promise<HospitalStaffMember[]> {
    const admin = await this.requireAdmin(actor);
    const rows = await this.team.listStaff(admin.hospitalId);
    return rows.map(toStaffMember);
  }

  async createStaff(
    actor: Actor,
    input: CreateHospitalStaffRequest,
  ): Promise<HospitalStaffCredentialsResponse> {
    const admin = await this.requireAdmin(actor);
    const hospital = await this.team.findHospitalById(admin.hospitalId);
    if (!hospital) throw notFound('Hospital was not found.');

    let doctorId: string | null = null;
    if (input.role === 'DOCTOR') {
      if (!input.doctorId) {
        throw new AppError(
          'VALIDATION_ERROR',
          'A doctor must be selected for the DOCTOR role.',
          400,
        );
      }
      const doctor = await this.team.findDoctor(input.doctorId, admin.hospitalId);
      if (!doctor) {
        throw notFound('Doctor was not found at this hospital.');
      }
      const existing = await this.team.findStaffByDoctorId(input.doctorId);
      if (existing) {
        throw new AppError('CONFLICT', 'This doctor already has a staff account.', 409);
      }
      doctorId = input.doctorId;
    }

    const base = baseStaffUsername(
      input.firstName,
      input.lastName,
      hospital.name,
      'staff',
      'hospital',
    );
    const [person, handle] = base.split('.') as [string, string];
    const username = nextFreeUsername(base, await this.team.usernamesLike(person, handle));

    const setupCode = createShortCode();
    const setupCodeExpiresAt = new Date(Date.now() + SETUP_CODE_TTL_MS);
    const unusablePasswordHash = await this.passwords.hash(
      crypto.randomBytes(32).toString('base64url'),
    );

    const { account, staff } = await this.team.createStaff({
      hospitalId: admin.hospitalId,
      createdById: actor.parentId,
      username,
      email: staffPlaceholderEmail(username),
      firstName: input.firstName,
      lastName: input.lastName,
      title: input.title?.trim() || null,
      role: input.role,
      doctorId,
      unusablePasswordHash,
      setupCodeHash: hashShortCode(setupCode, env.JWT_ACCESS_SECRET, 'staff-setup'),
      setupCodeExpiresAt,
    });

    await auditService.record({
      action: 'HOSPITAL_STAFF_CREATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: account.id,
      metadata: { hospitalId: admin.hospitalId, staffId: staff.id, username, role: input.role },
    });

    const created = await this.team.findStaffWithAccount(staff.id, admin.hospitalId);
    if (!created) throw notFound('Staff member was not found.');
    return {
      staff: toStaffMember(created),
      username,
      setupCode,
      setupCodeExpiresAt: setupCodeExpiresAt.toISOString(),
    };
  }

  async issueSetupCode(actor: Actor, staffId: string): Promise<HospitalStaffCredentialsResponse> {
    const admin = await this.requireAdmin(actor);
    const target = await this.team.findStaffWithAccount(staffId, admin.hospitalId);
    if (!target) throw notFound('Staff member was not found.');
    if (!target.parent.username) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This account signs in with email; it does not use setup codes.',
        400,
      );
    }
    if (target.deactivatedAt) {
      throw new AppError('VALIDATION_ERROR', 'Reactivate this staff member first.', 400);
    }

    const setupCode = createShortCode();
    const setupCodeExpiresAt = new Date(Date.now() + SETUP_CODE_TTL_MS);
    await this.team.replaceSetupCode({
      parentId: target.parent.id,
      email: target.parent.email,
      hospitalId: admin.hospitalId,
      createdById: actor.parentId,
      setupCodeHash: hashShortCode(setupCode, env.JWT_ACCESS_SECRET, 'staff-setup'),
      setupCodeExpiresAt,
    });

    await auditService.record({
      action: 'HOSPITAL_STAFF_SETUP_CODE_ISSUED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: target.parent.id,
      metadata: { hospitalId: admin.hospitalId, staffId },
    });

    return {
      staff: toStaffMember(target),
      username: target.parent.username,
      setupCode,
      setupCodeExpiresAt: setupCodeExpiresAt.toISOString(),
    };
  }

  async deactivateStaff(actor: Actor, staffId: string): Promise<HospitalStaffMember> {
    const admin = await this.requireAdmin(actor);
    if (staffId === admin.id) {
      throw new AppError('VALIDATION_ERROR', 'You cannot deactivate your own account.', 400);
    }
    const target = await this.team.findStaffWithAccount(staffId, admin.hospitalId);
    if (!target) throw notFound('Staff member was not found.');
    if (target.role === 'ADMIN') {
      throw new AppError('VALIDATION_ERROR', 'The hospital admin account cannot be removed.', 400);
    }

    await this.team.deactivateStaff(target.id, target.parent.id);
    await auditService.record({
      action: 'HOSPITAL_STAFF_DEACTIVATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: target.parent.id,
      metadata: { hospitalId: admin.hospitalId, staffId },
    });
    return this.reloadMember(target.id, admin.hospitalId);
  }

  async reactivateStaff(actor: Actor, staffId: string): Promise<HospitalStaffMember> {
    const admin = await this.requireAdmin(actor);
    const target = await this.team.findStaffWithAccount(staffId, admin.hospitalId);
    if (!target) throw notFound('Staff member was not found.');

    await this.team.reactivateStaff(target.id);
    await auditService.record({
      action: 'HOSPITAL_STAFF_REACTIVATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: target.parent.id,
      metadata: { hospitalId: admin.hospitalId, staffId },
    });
    return this.reloadMember(target.id, admin.hospitalId);
  }
}
