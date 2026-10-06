import type { Prisma } from '@prisma/client';
import type {
  CreateActivityReportRequest,
  ListActivityReportsQuery,
  UpdateActivityReportRequest,
} from '@auticare/contracts';
import fs from 'fs';
import path from 'path';
import { toPaginationMeta, toSkipTake } from '../../common/http/pagination.js';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import {
  MIME_BY_EXTENSION,
  STORED_FILENAME_PATTERN,
  uploadDir,
} from '../uploads/uploads.controller.js';
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

    // childId/status are now part of the database query for every role. The
    // PARENT and ADMIN branches used to fetch every report and filter the array
    // afterwards, which cannot be paginated: skip/take would be applied before
    // the filter, so a page would be cut from the unfiltered set and then
    // thinned — page 1 of a status filter could come back empty while later
    // pages had rows.
    const filters: { childId?: string | undefined; status?: string | undefined } = {
      childId: query.childId,
      status: query.status,
    };
    const page = toSkipTake(query);

    if (actor.role === 'PARENT') {
      const { items, total } = await this.repository.listReportsForParent(
        actor.parentId,
        filters,
        page,
      );
      return {
        reports: items.map(toActivityReportResponse),
        pagination: toPaginationMeta(query, total),
      };
    }

    if (actor.role === 'ADMIN') {
      const { items, total } = await this.repository.listAllReports(filters, page);
      return {
        reports: items.map(toActivityReportResponse),
        pagination: toPaginationMeta(query, total),
      };
    }

    // SCHOOL role — scoped to the staff member's school, with child/reporter info.
    const staff = await this.requireSchoolStaff(actor);
    const { items, total } = await this.repository.listReportsForSchoolWithRelations(
      staff.schoolId,
      filters,
      page,
    );
    return {
      reports: items.map((r) => ({
        ...toActivityReportResponse(r),
        childFirstName: r.child.firstName,
        childLastName: r.child.lastName,
        childPhotoUrl: r.child.photoUrl,
        reporterFirstName: r.reporter.firstName,
        reporterLastName: r.reporter.lastName,
      })),
      pagination: toPaginationMeta(query, total),
    };
  }

  /**
   * Delete a report owned by the caller's school.
   *
   * Moved here from SchoolsService, which was the only thing DELETE
   * /schools/activity-reports/:id still provided that this module did not.
   */
  async deleteReport(actor: Actor, reportId: string) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.requireSchoolStaff(actor);
    const report = await this.repository.findActivityReportById(reportId);
    // notFound rather than forbidden for the cross-school case, matching
    // getReportById: a 403 would confirm the id exists to a caller probing it.
    if (!report || report.schoolId !== staff.schoolId) {
      throw notFound('Activity report was not found.');
    }
    await this.repository.deleteActivityReport(reportId);
    return { success: true };
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

    // Both scope checks raise notFound rather than forbidden: a 403 would confirm
    // that a report with this id exists, letting a caller enumerate other
    // families' and schools' reports by id.
    if (actor.role === 'SCHOOL') {
      const staff = await this.requireSchoolStaff(actor);
      if (staff.schoolId !== report.schoolId) throw notFound('Activity report was not found.');
    }

    // A PARENT may only read reports about their own child. This check was
    // missing, so any authenticated parent could read any report by id.
    if (actor.role === 'PARENT' && report.child.parentId !== actor.parentId) {
      throw notFound('Activity report was not found.');
    }

    return report;
  }

  /**
   * Resolve one of a report's attachments to an absolute path on disk, for the
   * authorised download route.
   *
   * Authorisation is deliberately delegated to getReportById, so an attachment
   * is readable exactly when its report is: the owning school, the parent of the
   * child it is about, or an ADMIN. Everything else raises notFound, so a caller
   * cannot probe for files or report ids.
   *
   * A file is only served if the report actually references it. Orphaned uploads
   * — accepted but never attached to a saved report — are therefore unreachable,
   * which is the safe default.
   */
  async getReportAttachment(
    actor: Actor,
    reportId: string,
    filename: string,
  ): Promise<{ absolutePath: string; contentType: string; filename: string }> {
    if (!STORED_FILENAME_PATTERN.test(filename)) {
      // Not a name we could have written, so not a name we will look up on disk.
      throw notFound('Attachment was not found.');
    }

    const report = await this.getReportById(actor, reportId);

    const urls = Array.isArray(report.photoUrls) ? (report.photoUrls as unknown[]) : [];
    const referenced = urls.some(
      (url) => typeof url === 'string' && path.posix.basename(url) === filename,
    );
    if (!referenced) throw notFound('Attachment was not found.');

    const extension = path.extname(filename);
    const contentType = MIME_BY_EXTENSION[extension];
    if (contentType === undefined) throw notFound('Attachment was not found.');

    const absolutePath = path.join(uploadDir, filename);
    // uploadDir is fixed and filename is pattern-checked above, so this cannot
    // escape the directory; assert it anyway in case the pattern ever loosens.
    if (!absolutePath.startsWith(uploadDir + path.sep)) {
      throw notFound('Attachment was not found.');
    }
    if (!fs.existsSync(absolutePath)) throw notFound('Attachment was not found.');

    return { absolutePath, contentType, filename };
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

  private async requireSchoolStaff(actor: Actor) {
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }
}
