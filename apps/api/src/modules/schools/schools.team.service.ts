import crypto from 'node:crypto';
import type {
  AssignTeachersRequest,
  ConnectionCode,
  CreateConnectionCodeRequest,
  CreatedConnectionCodeResponse,
  CreateTeacherRequest,
  SchoolStaffMember,
  TeacherCredentialsResponse,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { auditService } from '../audit/audit.service.js';
import { createShortCode, hashShortCode } from '../auth/short-code.js';
import { PasswordService } from '../auth/password.service.js';
import { SchoolsRepository } from './schools.repository.js';
import { requireSchoolAdmin } from './schools.scope.js';
import { SchoolTeamRepository } from './schools.team.repository.js';
import { baseStaffUsername, nextFreeUsername, staffPlaceholderEmail } from './staff-usernames.js';

type Actor = { parentId: string; role: string };

const SETUP_CODE_TTL_MS = 72 * 60 * 60 * 1000;
const CONNECTION_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StaffRow = Awaited<ReturnType<SchoolTeamRepository['listStaff']>>[number];

const toStaffMember = (row: StaffRow): SchoolStaffMember => ({
  id: row.id,
  firstName: row.parent.firstName,
  lastName: row.parent.lastName,
  title: row.title,
  role: row.role === 'ADMIN' ? 'ADMIN' : 'TEACHER',
  username: row.parent.username,
  status: row.deactivatedAt
    ? 'DEACTIVATED'
    : row.parent.mustResetPassword
      ? 'SETUP_PENDING'
      : 'ACTIVE',
  assignedStudents: row._count.teaching,
});

/**
 * The school admin's tools for running the school's team on AutiCare:
 * teacher accounts, which teachers work with which child, and the connection
 * codes families use to join.
 */
export class SchoolTeamService {
  constructor(
    private readonly team = new SchoolTeamRepository(),
    private readonly schools = new SchoolsRepository(),
    private readonly passwords = new PasswordService(),
  ) {}

  // ── Staff ──────────────────────────────────────────────────────────────

  async listStaff(actor: Actor): Promise<SchoolStaffMember[]> {
    const staff = await this.requireStaff(actor);
    const rows = await this.team.listStaff(staff.schoolId);
    return rows.map(toStaffMember);
  }

  /**
   * Create a teacher account with no email. The school receives the username
   * and a one-time setup code to hand over in person; the teacher chooses a
   * password at first sign-in.
   */
  async createTeacher(
    actor: Actor,
    input: CreateTeacherRequest,
  ): Promise<TeacherCredentialsResponse> {
    const admin = await this.requireAdmin(actor);
    const school = await this.schools.findSchoolById(admin.schoolId);
    if (!school) throw notFound('School was not found.');

    const base = baseStaffUsername(input.firstName, input.lastName, school.name);
    const [person, handle] = base.split('.') as [string, string];
    const username = nextFreeUsername(base, await this.team.usernamesLike(person, handle));

    const setupCode = createShortCode();
    const setupCodeExpiresAt = new Date(Date.now() + SETUP_CODE_TTL_MS);
    // Nobody knows this password; the account is usable only after setup.
    const unusablePasswordHash = await this.passwords.hash(
      crypto.randomBytes(32).toString('base64url'),
    );

    const { account, staff } = await this.team.createTeacher({
      schoolId: admin.schoolId,
      createdById: actor.parentId,
      username,
      email: staffPlaceholderEmail(username),
      firstName: input.firstName,
      lastName: input.lastName,
      title: input.title?.trim() || null,
      unusablePasswordHash,
      setupCodeHash: hashShortCode(setupCode, env.JWT_ACCESS_SECRET, 'staff-setup'),
      setupCodeExpiresAt,
    });

    await auditService.record({
      action: 'SCHOOL_TEACHER_CREATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: account.id,
      metadata: { schoolId: admin.schoolId, staffId: staff.id, username },
    });

    const created = await this.team.findStaffWithAccount(staff.id, admin.schoolId);
    if (!created) throw notFound('Staff member was not found.');
    return {
      staff: toStaffMember(created),
      username,
      setupCode,
      setupCodeExpiresAt: setupCodeExpiresAt.toISOString(),
    };
  }

  /** A new setup code, e.g. when a teacher forgot their password. */
  async issueSetupCode(actor: Actor, staffId: string): Promise<TeacherCredentialsResponse> {
    const admin = await this.requireAdmin(actor);
    const target = await this.team.findStaffWithAccount(staffId, admin.schoolId);
    if (!target) throw notFound('Staff member was not found.');
    if (!target.parent.username) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This account signs in with email; it does not use setup codes.',
        400,
      );
    }
    if (target.deactivatedAt) {
      throw new AppError('VALIDATION_ERROR', 'Reactivate this teacher first.', 400);
    }

    const setupCode = createShortCode();
    const setupCodeExpiresAt = new Date(Date.now() + SETUP_CODE_TTL_MS);
    await this.team.replaceSetupCode({
      parentId: target.parent.id,
      email: target.parent.email,
      schoolId: admin.schoolId,
      createdById: actor.parentId,
      setupCodeHash: hashShortCode(setupCode, env.JWT_ACCESS_SECRET, 'staff-setup'),
      setupCodeExpiresAt,
    });

    await auditService.record({
      action: 'SCHOOL_TEACHER_SETUP_CODE_ISSUED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: target.parent.id,
      metadata: { schoolId: admin.schoolId, staffId },
    });

    return {
      staff: toStaffMember(target),
      username: target.parent.username,
      setupCode,
      setupCodeExpiresAt: setupCodeExpiresAt.toISOString(),
    };
  }

  async deactivateStaff(actor: Actor, staffId: string): Promise<SchoolStaffMember> {
    const admin = await this.requireAdmin(actor);
    if (staffId === admin.id) {
      throw new AppError('VALIDATION_ERROR', 'You cannot deactivate your own account.', 400);
    }
    const target = await this.team.findStaffWithAccount(staffId, admin.schoolId);
    if (!target) throw notFound('Staff member was not found.');
    if (target.role === 'ADMIN') {
      throw new AppError('VALIDATION_ERROR', 'The school admin account cannot be removed.', 400);
    }

    await this.team.deactivateStaff(target.id, target.parent.id);
    await auditService.record({
      action: 'SCHOOL_STAFF_DEACTIVATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: target.parent.id,
      metadata: { schoolId: admin.schoolId, staffId },
    });
    return this.reloadMember(target.id, admin.schoolId);
  }

  async reactivateStaff(actor: Actor, staffId: string): Promise<SchoolStaffMember> {
    const admin = await this.requireAdmin(actor);
    const target = await this.team.findStaffWithAccount(staffId, admin.schoolId);
    if (!target) throw notFound('Staff member was not found.');

    await this.team.reactivateStaff(target.id);
    await auditService.record({
      action: 'SCHOOL_STAFF_REACTIVATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: target.parent.id,
      metadata: { schoolId: admin.schoolId, staffId },
    });
    return this.reloadMember(target.id, admin.schoolId);
  }

  // ── Assignment ─────────────────────────────────────────────────────────

  /** Replace the set of teachers who work with this child. */
  async assignTeachers(actor: Actor, childId: string, input: AssignTeachersRequest) {
    const admin = await this.requireAdmin(actor);
    const enrollment = await this.team.findEnrollment(admin.schoolId, childId);
    if (!enrollment || !['ACTIVE', 'PENDING'].includes(enrollment.status)) {
      throw notFound('This student is not enrolled at your school.');
    }

    const staffIds = [...new Set(input.staffIds)];
    const staff = await this.team.findActiveStaffIn(admin.schoolId, staffIds);
    if (staff.length !== staffIds.length) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Every teacher must be an active member of your school.',
        400,
      );
    }

    await this.team.replaceTeachers(enrollment.id, staffIds);
    await auditService.record({
      action: 'SCHOOL_TEACHERS_ASSIGNED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: childId,
      metadata: { schoolId: admin.schoolId, enrollmentId: enrollment.id, staffIds },
    });

    return {
      childId,
      teachers: staff.map((member) => ({
        id: member.id,
        firstName: member.parent.firstName,
        lastName: member.parent.lastName,
        title: member.title,
      })),
    };
  }

  // ── Connection codes ───────────────────────────────────────────────────

  async createConnectionCode(
    actor: Actor,
    input: CreateConnectionCodeRequest,
  ): Promise<CreatedConnectionCodeResponse> {
    const admin = await this.requireAdmin(actor);

    const teacherStaffIds = [...new Set(input.teacherStaffIds ?? [])];
    const teachers = await this.team.findActiveStaffIn(admin.schoolId, teacherStaffIds);
    if (teachers.length !== teacherStaffIds.length) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Every teacher must be an active member of your school.',
        400,
      );
    }

    const code = createShortCode();
    const record = await this.team.createConnectionCode({
      schoolId: admin.schoolId,
      codeHash: hashShortCode(code, env.JWT_ACCESS_SECRET, 'school-connection'),
      label: input.label?.trim() || null,
      teacherStaffIds,
      createdByStaffId: admin.id,
      expiresAt: new Date(Date.now() + CONNECTION_CODE_TTL_MS),
    });

    await auditService.record({
      action: 'SCHOOL_CONNECTION_CODE_CREATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: record.id,
      metadata: { schoolId: admin.schoolId },
    });

    return {
      id: record.id,
      code,
      label: record.label,
      status: 'ACTIVE',
      expiresAt: record.expiresAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
      usedAt: null,
      childFirstName: null,
      teachers: teachers.map((teacher) => ({
        id: teacher.id,
        firstName: teacher.parent.firstName,
        lastName: teacher.parent.lastName,
      })),
    };
  }

  async listConnectionCodes(actor: Actor): Promise<ConnectionCode[]> {
    const admin = await this.requireAdmin(actor);
    const codes = await this.team.listConnectionCodes(admin.schoolId);

    const staffIds = [...new Set(codes.flatMap((code) => staffIdsOf(code.teacherStaffIds)))];
    const names = new Map(
      (await this.team.staffNames(staffIds)).map((row) => [row.id, row.parent]),
    );
    const now = new Date();

    return codes.map((code) => ({
      id: code.id,
      label: code.label,
      status: code.usedAt
        ? 'USED'
        : code.revokedAt
          ? 'REVOKED'
          : code.expiresAt <= now
            ? 'EXPIRED'
            : 'ACTIVE',
      expiresAt: code.expiresAt.toISOString(),
      createdAt: code.createdAt.toISOString(),
      usedAt: code.usedAt?.toISOString() ?? null,
      childFirstName: code.enrollment?.child.firstName ?? null,
      teachers: staffIdsOf(code.teacherStaffIds).flatMap((id) => {
        const name = names.get(id);
        return name ? [{ id, firstName: name.firstName, lastName: name.lastName }] : [];
      }),
    }));
  }

  async revokeConnectionCode(actor: Actor, codeId: string): Promise<{ revoked: true }> {
    const admin = await this.requireAdmin(actor);
    const result = await this.team.revokeConnectionCode(codeId, admin.schoolId);
    if (result.count !== 1) throw notFound('This code is not open, or does not belong to you.');
    await auditService.record({
      action: 'SCHOOL_CONNECTION_CODE_REVOKED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: codeId,
      metadata: { schoolId: admin.schoolId },
    });
    return { revoked: true };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private async reloadMember(staffId: string, schoolId: string): Promise<SchoolStaffMember> {
    const row = await this.team.findStaffWithAccount(staffId, schoolId);
    if (!row) throw notFound('Staff member was not found.');
    return toStaffMember(row);
  }

  private async requireStaff(actor: Actor) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.schools.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }

  private async requireAdmin(actor: Actor) {
    const staff = await this.requireStaff(actor);
    requireSchoolAdmin(staff);
    return staff;
  }
}

/** `teacherStaffIds` is stored as JSON; read it defensively. */
export const staffIdsOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
