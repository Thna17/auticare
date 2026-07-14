import type {
  CreateSchoolActivityReportRequest,
  CreateSchoolChildEnrollmentRequest,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { SchoolsRepository } from './schools.repository.js';
import {
  toSchoolActivityReportResponse,
  toSchoolChildEnrollmentResponse,
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
  constructor(private readonly repository = new SchoolsRepository()) {}

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
    throw forbidden();
  }
}
