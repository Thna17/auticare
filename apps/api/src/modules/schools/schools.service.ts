import type {
  CreateSchoolAccountRequest,
  CreateSchoolActivityReportRequest,
  CreateSchoolChildEnrollmentRequest,
  UpdateSchoolRequest,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { PasswordService } from '../auth/password.service.js';
import { SchoolsRepository } from './schools.repository.js';
import {
  toSchoolAccountResponse,
  toSchoolActivityReportResponse,
  toSchoolChildEnrollmentResponse,
  toSchoolResponse,
  toSchoolStaffResponse,
} from './schools.mapper.js';

type Actor = { parentId: string; role: UserRole };

const parseActivityDate = (activityDate: string): Date => {
  const parsed = new Date(`${activityDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'The activity date is invalid.', 400);
  }
  return parsed;
};

export class SchoolsService {
  constructor(
    private readonly repository = new SchoolsRepository(),
    private readonly passwordService = new PasswordService(),
  ) {}

  async listSchools(actor: Actor) {
    if (actor.role === 'SCHOOL') throw forbidden();
    const schools = await this.repository.listSchools();
    return schools.map(toSchoolResponse);
  }

  async createSchoolAccount(actor: Actor, input: CreateSchoolAccountRequest) {
    if (actor.role !== 'ADMIN') throw forbidden();
    const email = input.account.email.toLowerCase();
    const existing = await this.repository.findParentByEmail(email);
    if (existing) throw new AppError('CONFLICT', 'An account with this email already exists.', 409);
    const passwordHash = await this.passwordService.hash(input.account.password);
    const record = await this.repository.createSchoolAccount({
      school: {
        name: input.school.name.trim(),
        city: input.school.city.trim(),
        address: input.school.address.trim(),
        description: input.school.description?.trim() || null,
      },
      account: {
        email,
        passwordHash,
        firstName: input.account.firstName.trim(),
        lastName: input.account.lastName.trim(),
        title: input.account.title?.trim() || null,
      },
    });
    return toSchoolAccountResponse(record);
  }

  async listSchoolAccounts(actor: Actor) {
    if (actor.role !== 'ADMIN') throw forbidden();
    const accounts = await this.repository.listSchoolAccounts();
    return accounts.map(toSchoolAccountResponse);
  }

  async updateSchool(actor: Actor, schoolId: string, input: UpdateSchoolRequest) {
    if (actor.role !== 'ADMIN') throw forbidden();
    const update: {
      name?: string;
      city?: string;
      address?: string;
      description?: string | null;
    } = {};
    if (input.name !== undefined) update.name = input.name.trim();
    if (input.city !== undefined) update.city = input.city.trim();
    if (input.address !== undefined) update.address = input.address.trim();
    if (input.description !== undefined) update.description = input.description?.trim() || null;
    const school = await this.repository.updateSchool(schoolId, update);
    return toSchoolResponse(school);
  }

  async me(actor: Actor) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return toSchoolStaffResponse(staff);
  }

  async createEnrollment(
    actor: Actor,
    schoolId: string,
    input: CreateSchoolChildEnrollmentRequest,
  ) {
    const child = await this.repository.findChild(input.childId);
    if (!child) throw notFound('Child profile was not found.');

    if (actor.role === 'PARENT' && child.parentId !== actor.parentId) throw forbidden();
    if (actor.role === 'SCHOOL') throw forbidden();
    if (actor.role !== 'PARENT' && actor.role !== 'ADMIN') throw forbidden();

    const enrollment = await this.repository.upsertEnrollment({ schoolId, childId: input.childId });
    return toSchoolChildEnrollmentResponse(enrollment);
  }

  async endEnrollment(actor: Actor, schoolId: string, childId: string) {
    const child = await this.repository.findChild(childId);
    if (!child) throw notFound('Child profile was not found.');
    if (actor.role === 'PARENT' && child.parentId !== actor.parentId) throw forbidden();
    if (actor.role !== 'PARENT' && actor.role !== 'ADMIN') throw forbidden();
    const enrollment = await this.repository.endEnrollment({ schoolId, childId });
    return toSchoolChildEnrollmentResponse(enrollment);
  }

  async listEnrollments(actor: Actor) {
    if (actor.role === 'PARENT') {
      const enrollments = await this.repository.listEnrollmentsForParent(actor.parentId);
      return enrollments.map(toSchoolChildEnrollmentResponse);
    }
    if (actor.role === 'SCHOOL') {
      const staff = await this.repository.findStaffForParent(actor.parentId);
      if (!staff) throw forbidden();
      const enrollments = await this.repository.listEnrollmentsForSchool(staff.schoolId);
      return enrollments.map(toSchoolChildEnrollmentResponse);
    }
    throw forbidden();
  }

  async createActivityReport(actor: Actor, input: CreateSchoolActivityReportRequest) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    const enrollment = await this.repository.findActiveEnrollment({
      schoolId: staff.schoolId,
      childId: input.childId,
    });
    if (!enrollment) throw forbidden();
    const report = await this.repository.createActivityReport({
      schoolId: staff.schoolId,
      childId: input.childId,
      reporterId: actor.parentId,
      title: input.title,
      summary: input.summary,
      activityDate: parseActivityDate(input.activityDate),
    });
    return toSchoolActivityReportResponse(report);
  }

  async listActivityReports(actor: Actor) {
    if (actor.role === 'PARENT') {
      const reports = await this.repository.listReportsForParent(actor.parentId);
      return reports.map(toSchoolActivityReportResponse);
    }
    if (actor.role === 'SCHOOL') {
      const staff = await this.repository.findStaffForParent(actor.parentId);
      if (!staff) throw forbidden();
      const reports = await this.repository.listReportsForSchool(staff.schoolId);
      return reports.map(toSchoolActivityReportResponse);
    }
    if (actor.role === 'ADMIN') {
      const reports = await this.repository.listAllReports();
      return reports.map(toSchoolActivityReportResponse);
    }
    throw forbidden();
  }
}
