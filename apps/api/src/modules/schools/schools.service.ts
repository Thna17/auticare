import type {
  CreateSchoolAccountRequest,
  CreateActivityReportRequest,
  CreateSchoolChildEnrollmentRequest,
  SchoolAvailabilityStatus,
  UpdateSchoolProfileRequest,
  UpdateSchoolRequest,
  UserRole,
} from '@auticare/contracts';
import type { Prisma } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { PasswordService } from '../auth/password.service.js';
import { SchoolsRepository } from './schools.repository.js';
import {
  toSchoolAccountResponse,
  toActivityReportResponse,
  toSchoolChildEnrollmentResponse,
  toSchoolDetailResponse,
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

  async listSchools(actor: Actor, filters: ParentSchoolSearchQuery = {}) {
    if (actor.role === 'SCHOOL') throw forbidden();
    const specializations = (filters.specializations ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');
    const schools = await this.repository.listSchools({
      search: filters.search,
      province: filters.province,
      availability: filters.availability,
      specializations: specializations.length > 0 ? specializations : undefined,
    });
    const ratings = await this.repository.getRatingsForSchools(schools.map((school) => school.id));
    return schools.map((school) =>
      toSchoolResponse(school, ratings.get(school.id) ?? { average: null, count: 0 }),
    );
  }

  /** Distinct provinces of active schools, for the search filter dropdown. */
  async listSchoolCities(actor: Actor) {
    if (actor.role === 'SCHOOL') throw forbidden();
    return this.repository.listSchoolCities();
  }

  /** Public read-only detail available to any authenticated account (read-only). */
  async getSchoolById(actor: Actor, schoolId: string) {
    if (actor.role !== 'PARENT' && actor.role !== 'ADMIN' && actor.role !== 'SCHOOL') {
      throw forbidden();
    }
    const school = await this.repository.findSchoolById(schoolId);
    if (!school) throw notFound('School was not found.');
    const rating = await this.repository.getSchoolRating(schoolId);
    return toSchoolDetailResponse(school, rating);
  }

  /** The authenticated SCHOOL account's own school (scoped via SchoolStaff, never by id). */
  async getMySchool(actor: Actor) {
    const staff = await this.requireSchoolStaff(actor);
    const school = await this.repository.findSchoolById(staff.schoolId);
    if (!school) throw notFound('School was not found.');
    const rating = await this.repository.getSchoolRating(staff.schoolId);
    return toSchoolDetailResponse(school, rating);
  }

  /** School-owned self-update. isVerified and rating are not accepted by the schema. */
  async updateMySchool(actor: Actor, input: UpdateSchoolProfileRequest) {
    const staff = await this.requireSchoolStaff(actor);
    const update: {
      name?: string;
      city?: string;
      address?: string;
      description?: string | null;
      email?: string | null;
      website?: string | null;
      logoUrl?: string | null;
      coverImageUrl?: string | null;
      studentTeacherRatio?: string | null;
      availabilityStatus?: SchoolAvailabilityStatus;
      waitlistEstimate?: string | null;
      admissionRequirements?: string | null;
      operatingHours?: string | null;
      facilities?: string[];
      specializations?: string[];
    } = {};
    if (input.name !== undefined) update.name = input.name.trim();
    if (input.city !== undefined) update.city = input.city.trim();
    if (input.address !== undefined) update.address = input.address.trim();
    if (input.description !== undefined) update.description = input.description?.trim() || null;
    if (input.email !== undefined) update.email = input.email?.trim().toLowerCase() || null;
    if (input.website !== undefined) update.website = input.website?.trim() || null;
    if (input.logoUrl !== undefined) update.logoUrl = input.logoUrl?.trim() || null;
    if (input.coverImageUrl !== undefined)
      update.coverImageUrl = input.coverImageUrl?.trim() || null;
    if (input.studentTeacherRatio !== undefined)
      update.studentTeacherRatio = input.studentTeacherRatio?.trim() || null;
    if (input.availabilityStatus !== undefined)
      update.availabilityStatus = input.availabilityStatus;
    if (input.waitlistEstimate !== undefined)
      update.waitlistEstimate = input.waitlistEstimate?.trim() || null;
    if (input.admissionRequirements !== undefined)
      update.admissionRequirements = input.admissionRequirements?.trim() || null;
    if (input.operatingHours !== undefined)
      update.operatingHours = input.operatingHours?.trim() || null;
    if (input.facilities !== undefined)
      update.facilities = input.facilities.map((item) => item.trim()).filter(Boolean);
    if (input.specializations !== undefined)
      update.specializations = input.specializations.map((item) => item.trim()).filter(Boolean);

    const school = await this.repository.updateSchoolProfile(staff.schoolId, update);
    const rating = await this.repository.getSchoolRating(staff.schoolId);
    return toSchoolDetailResponse(school, rating);
  }

  private async requireSchoolStaff(actor: Actor) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
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

  async createActivityReport(actor: Actor, input: CreateActivityReportRequest) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    const enrollment = await this.repository.findReportableEnrollment({
      schoolId: staff.schoolId,
      childId: input.childId,
    });
    if (!enrollment) throw forbidden();
    // activityName is canonical; title/summary/activityDate are derived when
    // omitted so the frontend payload can stay lean.
    const title = input.activityName ?? input.title ?? input.activityCategory;
    const summary =
      input.summary ??
      [input.activityName ?? input.title ?? input.activityCategory, input.activityCategory]
        .filter(Boolean)
        .join(' — ');
    const activityDate = input.activityDate ?? new Date().toISOString().slice(0, 10);

    const report = await this.repository.createActivityReport({
      schoolId: staff.schoolId,
      childId: input.childId,
      reporterId: actor.parentId,
      activityCategory: input.activityCategory,
      title,
      summary,
      activityDate: parseActivityDate(activityDate),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.performanceMetrics !== undefined && {
        performanceMetrics: input.performanceMetrics as Prisma.InputJsonValue,
      }),
      ...(input.teacherObservation !== undefined && {
        teacherObservation: input.teacherObservation,
      }),
      ...(input.recommendations !== undefined && { recommendations: input.recommendations }),
      ...(input.photoUrls !== undefined && { photoUrls: input.photoUrls }),
    });
    return toActivityReportResponse(report);
  }

  async listActivityReports(actor: Actor) {
    if (actor.role === 'PARENT') {
      const reports = await this.repository.listReportsForParent(actor.parentId);
      return reports.map(toActivityReportResponse);
    }
    if (actor.role === 'SCHOOL') {
      const staff = await this.repository.findStaffForParent(actor.parentId);
      if (!staff) throw forbidden();
      const reports = await this.repository.listReportsForSchool(staff.schoolId);
      return reports.map(toActivityReportResponse);
    }
    if (actor.role === 'ADMIN') {
      const reports = await this.repository.listAllReports();
      return reports.map(toActivityReportResponse);
    }
    throw forbidden();
  }
}
