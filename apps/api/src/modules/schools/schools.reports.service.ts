import type { Prisma } from '@prisma/client';
import type {
  CreateActivityReportRequest,
  ListActivityReportsQuery,
  UpdateActivityReportRequest,
} from '@auticare/contracts';
import type { ActivityReport } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { SchoolsRepository } from './schools.repository.js';
import { toActivityReportResponse } from './schools.mapper.js';

type Actor = { parentId: string; role: string };

const parseActivityDate = (activityDate: string): Date => {
  const parsed = new Date(`${activityDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'The activity date is invalid.', 400);
  }
  return parsed;
};

export class SchoolsReportsService {
  constructor(private readonly repository = new SchoolsRepository()) {}

  /**
   * Create a new activity report. The schoolId and reporterId are derived from
   * the authenticated staff member's session — they are never accepted from the
   * request body.
   */
  async createReport(actor: Actor, input: CreateActivityReportRequest) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.requireSchoolStaff(actor);

    // Verify the child is actively enrolled in this school.
    const enrollment = await this.repository.findReportableEnrollment({
      schoolId: staff.schoolId,
      childId: input.childId,
    });
    if (!enrollment) {
      throw forbidden();
    }

    // activityName is the canonical field; title/summary/activityDate are
    // optional aliases/derivations so the frontend payload stays lean.
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
      ...(input.recommendations !== undefined && {
        recommendations: input.recommendations,
      }),
      ...(input.photoUrls !== undefined && { photoUrls: input.photoUrls }),
      status: input.status ?? 'DRAFT',
    });

    return toActivityReportResponse(report);
  }

  /**
   * List all activity reports for the authenticated staff member's school.
   * Optionally filter by childId and/or status.
   * Strictly scoped to the staff member's school — no schoolId parameter accepted.
   */
  async listReports(actor: Actor, query: ListActivityReportsQuery) {
    if (actor.role !== 'SCHOOL' && actor.role !== 'PARENT' && actor.role !== 'ADMIN') {
      throw forbidden();
    }

    if (actor.role === 'PARENT') {
      const reports = await this.repository.listReportsForParent(actor.parentId);
      const filtered = this.applyQueryFilters(reports, query);
      return filtered.map(toActivityReportResponse);
    }

    if (actor.role === 'ADMIN') {
      const reports = await this.repository.listAllReports();
      const filtered = this.applyQueryFilters(reports, query);
      return filtered.map(toActivityReportResponse);
    }

    // SCHOOL role — scoped to the staff member's school, with child/reporter info.
    const staff = await this.requireSchoolStaff(actor);
    const filters: { childId?: string; status?: string } = {};
    if (query.childId !== undefined) filters.childId = query.childId;
    if (query.status !== undefined) filters.status = query.status;
    const reports = await this.repository.listReportsForSchoolWithRelations(
      staff.schoolId,
      filters,
    );
    return reports.map((r) => ({
      ...toActivityReportResponse(r),
      childFirstName: r.child.firstName,
      childLastName: r.child.lastName,
      childPhotoUrl: r.child.photoUrl,
      reporterFirstName: r.reporter.firstName,
      reporterLastName: r.reporter.lastName,
    }));
  }

  /**
   * Get a single activity report by ID with child and reporter info.
   */
  async getReportById(actor: Actor, reportId: string) {
    if (actor.role !== 'SCHOOL' && actor.role !== 'PARENT' && actor.role !== 'ADMIN') {
      throw forbidden();
    }

    const report = await this.repository.findActivityReportByIdWithRelations(reportId);
    if (!report) throw notFound('Activity report was not found.');

    // Scope check for SCHOOL role
    if (actor.role === 'SCHOOL') {
      const staff = await this.requireSchoolStaff(actor);
      if (staff.schoolId !== report.schoolId) throw forbidden();
    }

    return report;
  }

  /**
   * Update an existing activity report. Only the original author or a school
   * staff member at the same school may update the report.
   */
  async updateReport(actor: Actor, reportId: string, input: UpdateActivityReportRequest) {
    if (actor.role !== 'SCHOOL' && actor.role !== 'ADMIN') throw forbidden();

    const report = await this.repository.findActivityReportById(reportId);
    if (!report) throw notFound('Activity report was not found.');

    // Authorization: author OR school admin.
    const isAuthor = report.reporterId === actor.parentId;
    if (!isAuthor) {
      if (actor.role !== 'SCHOOL') throw forbidden();
      const staff = await this.requireSchoolStaff(actor);
      if (staff.schoolId !== report.schoolId || staff.role !== 'ADMIN') throw forbidden();
    }

    const update: {
      activityCategory?: string;
      title?: string;
      summary?: string;
      activityDate?: Date;
      status?: string;
      duration?: number | null;
      performanceMetrics?: Prisma.InputJsonValue | null;
      teacherObservation?: string | null;
      recommendations?: string | null;
      photoUrls?: string[] | null;
    } = {};

    if (input.activityCategory !== undefined) update.activityCategory = input.activityCategory;
    if (input.title !== undefined) update.title = input.title;
    if (input.summary !== undefined) update.summary = input.summary;
    if (input.activityDate !== undefined)
      update.activityDate = parseActivityDate(input.activityDate);
    if (input.status !== undefined) update.status = input.status;
    if (input.duration !== undefined) update.duration = input.duration;
    if (input.performanceMetrics !== undefined) {
      update.performanceMetrics = input.performanceMetrics as Prisma.InputJsonValue;
    }
    if (input.teacherObservation !== undefined)
      update.teacherObservation = input.teacherObservation;
    if (input.recommendations !== undefined) update.recommendations = input.recommendations;
    if (input.photoUrls !== undefined) update.photoUrls = input.photoUrls;

    const updated = await this.repository.updateActivityReport(reportId, update);
    return toActivityReportResponse(updated);
  }

  /** Client-side filter for PARENT / ADMIN list queries (DB-side filter used for SCHOOL). */
  private applyQueryFilters(reports: ActivityReport[], query: ListActivityReportsQuery) {
    let filtered = reports;
    if (query.childId !== undefined) filtered = filtered.filter((r) => r.childId === query.childId);
    if (query.status !== undefined) filtered = filtered.filter((r) => r.status === query.status);
    return filtered;
  }

  private async requireSchoolStaff(actor: Actor) {
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }
}
