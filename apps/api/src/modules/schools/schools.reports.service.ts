import { Prisma, type ActivityReportStatus } from '@prisma/client';
import type {
  CreateActivityReportRequest,
  ListActivityReportsQuery,
  UpdateActivityReportRequest,
} from '@auticare/contracts';
import path from 'path';
import { toPaginationMeta, toSkipTake } from '../../common/http/pagination.js';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { MIME_BY_EXTENSION, STORED_FILENAME_PATTERN } from '../uploads/uploads.controller.js';
import {
  defaultStorageDriver,
  type StorageDriver,
  type StorageReadResult,
} from '../storage/storage.driver.js';
import { SchoolsRepository } from './schools.repository.js';
import { toActivityReportResponse } from './schools.mapper.js';
import { prisma } from '../../database/prisma.js';

type Actor = { parentId: string; role: string };

const parseActivityDate = (activityDate: string): Date => {
  const parsed = new Date(`${activityDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'The activity date is invalid.', 400);
  }
  return parsed;
};

export class SchoolsReportsService {
  constructor(
    private readonly repository = new SchoolsRepository(),
    private readonly storage: StorageDriver = defaultStorageDriver,
    private readonly db = prisma,
  ) {}

  /**
   * Helper to validate that all filenames in photoUrls belong to the caller's school.
   * Prevents one school from attaching another school's uploaded attachments.
   */
  private async validateAndAssociateUploads(
    schoolId: string,
    photoUrls: string[] | undefined | null,
    reportId: string,
  ) {
    if (!photoUrls || photoUrls.length === 0) return;

    for (const url of photoUrls) {
      if (typeof url !== 'string') continue;
      const filename = path.posix.basename(url);
      if (!STORED_FILENAME_PATTERN.test(filename)) {
        throw new AppError('VALIDATION_ERROR', `Invalid attachment filename: ${filename}`, 400);
      }

      // Check tracking record
      const uploadRecord = await this.db.reportAttachmentUpload.findUnique({
        where: { filename },
      });

      if (uploadRecord) {
        if (uploadRecord.schoolId !== schoolId) {
          throw forbidden('Cannot attach an upload belonging to another school.');
        }
        // Associate with this report
        await this.db.reportAttachmentUpload.update({
          where: { id: uploadRecord.id },
          data: { reportId },
        });
      }
    }
  }

  /**
   * Helper to delete attachment files from storage driver and database tracking.
   */
  private async deleteAttachments(photoUrls: unknown[]) {
    if (!Array.isArray(photoUrls)) return;
    for (const url of photoUrls) {
      if (typeof url !== 'string') continue;
      const filename = path.posix.basename(url);
      if (!STORED_FILENAME_PATTERN.test(filename)) continue;

      try {
        await this.storage.delete(filename);
      } catch {
        // Continue cleaning up
      }

      await this.db.reportAttachmentUpload.deleteMany({
        where: { filename },
      });
    }
  }

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

    // Pre-validate that all photoUrls belong to staff.schoolId
    if (Array.isArray(input.photoUrls) && input.photoUrls.length > 0) {
      for (const url of input.photoUrls) {
        const filename = path.posix.basename(url);
        if (!STORED_FILENAME_PATTERN.test(filename)) {
          throw new AppError('VALIDATION_ERROR', `Invalid attachment filename: ${filename}`, 400);
        }
        const record = await this.db.reportAttachmentUpload.findUnique({
          where: { filename },
        });
        if (record && record.schoolId !== staff.schoolId) {
          throw forbidden('Cannot attach an upload belonging to another school.');
        }
      }
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
    const status = input.status ?? 'DRAFT';

    const report = await this.db.$transaction(async (tx) => {
      const created = await tx.activityReport.create({
        data: {
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
          status,
        },
      });

      if (status === 'SUBMITTED') {
        const child = await tx.child.findUnique({ where: { id: input.childId } });
        const school = await tx.school.findUnique({ where: { id: staff.schoolId } });
        if (child) {
          await tx.notification.create({
            data: {
              parentId: child.parentId,
              schoolId: staff.schoolId,
              type: 'SCHOOL_REPORT',
              status: 'UNREAD',
              reportId: created.id,
              title: `New School Report for ${child.firstName}`,
              body: `${school?.name ?? 'The school'} posted a developmental observation report: ${created.title}`,
            },
          });
        }
      }

      return created;
    });

    // Associate uploads with report
    if (input.photoUrls) {
      await this.validateAndAssociateUploads(staff.schoolId, input.photoUrls, report.id);
    }

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

    const filters: {
      childId?: string | undefined;
      status?: ActivityReportStatus | undefined;
      search?: string | undefined;
    } = {
      childId: query.childId,
      status: query.status as ActivityReportStatus | undefined,
      search: query.search?.trim() || undefined,
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
   * Delete a report owned by the caller's school and clean up all attachments.
   */
  async deleteReport(actor: Actor, reportId: string) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.requireSchoolStaff(actor);
    const report = await this.repository.findActivityReportById(reportId);
    if (!report || report.schoolId !== staff.schoolId) {
      throw notFound('Activity report was not found.');
    }

    // Delete stored files associated with this report
    const urls = Array.isArray(report.photoUrls) ? (report.photoUrls as unknown[]) : [];
    await this.deleteAttachments(urls);

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

    if (actor.role === 'SCHOOL') {
      const staff = await this.requireSchoolStaff(actor);
      if (staff.schoolId !== report.schoolId) throw notFound('Activity report was not found.');
    }

    if (actor.role === 'PARENT' && report.child.parentId !== actor.parentId) {
      throw notFound('Activity report was not found.');
    }

    return report;
  }

  /**
   * Resolve one of a report's attachments for the authorised download route.
   * Supports local files and streamable remote storage drivers.
   */
  async getReportAttachment(
    actor: Actor,
    reportId: string,
    filename: string,
  ): Promise<{
    absolutePath: string | null;
    streamResult: StorageReadResult;
    contentType: string;
    filename: string;
  }> {
    if (!STORED_FILENAME_PATTERN.test(filename)) {
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

    const localPath = this.storage.resolveLocalPath
      ? this.storage.resolveLocalPath(filename)
      : null;
    let streamResult: StorageReadResult;
    try {
      streamResult = await this.storage.read(filename);
    } catch {
      throw notFound('Attachment was not found.');
    }

    return {
      absolutePath: localPath,
      streamResult,
      contentType,
      filename,
    };
  }

  /**
   * Update an existing activity report. Only the original author or a school
   * staff member at the same school may update the report.
   * Handles deletion of removed attachments and association of new attachments.
   */
  async updateReport(actor: Actor, reportId: string, input: UpdateActivityReportRequest) {
    if (actor.role !== 'SCHOOL' && actor.role !== 'ADMIN') throw forbidden();

    const report = await this.repository.findActivityReportById(reportId);
    if (!report) throw notFound('Activity report was not found.');

    // Authorization: author OR school admin.
    const isAuthor = report.reporterId === actor.parentId;
    let schoolId = report.schoolId;
    if (!isAuthor) {
      if (actor.role !== 'SCHOOL') throw forbidden();
      const staff = await this.requireSchoolStaff(actor);
      if (staff.schoolId !== report.schoolId || staff.role !== 'ADMIN') throw forbidden();
      schoolId = staff.schoolId;
    }

    // Pre-validate new attachments if provided
    if (input.photoUrls !== undefined && Array.isArray(input.photoUrls)) {
      for (const url of input.photoUrls) {
        const filename = path.posix.basename(url);
        if (!STORED_FILENAME_PATTERN.test(filename)) {
          throw new AppError('VALIDATION_ERROR', `Invalid attachment filename: ${filename}`, 400);
        }
        const record = await this.db.reportAttachmentUpload.findUnique({
          where: { filename },
        });
        if (record && record.schoolId !== schoolId) {
          throw forbidden('Cannot attach an upload belonging to another school.');
        }
      }

      // Check which attachments were removed
      const oldUrls: string[] = Array.isArray(report.photoUrls)
        ? (report.photoUrls as string[])
        : [];
      const newUrls: string[] = input.photoUrls;
      const removedUrls = oldUrls.filter((old) => !newUrls.includes(old));

      if (removedUrls.length > 0) {
        await this.deleteAttachments(removedUrls);
      }

      // Associate newly added attachments
      await this.validateAndAssociateUploads(schoolId, newUrls, reportId);
    }

    const update: Prisma.ActivityReportUpdateInput = {};

    if (input.activityCategory !== undefined) update.activityCategory = input.activityCategory;
    if (input.title !== undefined) update.title = input.title;
    if (input.summary !== undefined) update.summary = input.summary;
    if (input.activityDate !== undefined)
      update.activityDate = parseActivityDate(input.activityDate);
    if (input.status !== undefined) update.status = input.status;
    if (input.duration !== undefined) update.duration = input.duration;
    if (input.performanceMetrics !== undefined) {
      update.performanceMetrics =
        input.performanceMetrics === null
          ? Prisma.JsonNull
          : (input.performanceMetrics as Prisma.InputJsonValue);
    }
    if (input.teacherObservation !== undefined)
      update.teacherObservation = input.teacherObservation;
    if (input.recommendations !== undefined) update.recommendations = input.recommendations;
    if (input.photoUrls !== undefined) {
      update.photoUrls = input.photoUrls === null ? Prisma.JsonNull : input.photoUrls;
    }

    const updated = await this.db.$transaction(async (tx) => {
      const res = await tx.activityReport.update({
        where: { id: reportId },
        data: update,
      });

      if (input.status === 'SUBMITTED') {
        const child = await tx.child.findUnique({ where: { id: report.childId } });
        const school = await tx.school.findUnique({ where: { id: schoolId } });
        if (child) {
          await tx.notification.create({
            data: {
              parentId: child.parentId,
              schoolId,
              type: 'SCHOOL_REPORT',
              status: 'UNREAD',
              reportId: res.id,
              title: `New School Report for ${child.firstName}`,
              body: `${school?.name ?? 'The school'} posted a developmental observation report: ${res.title}`,
            },
          });
        }
      }

      return res;
    });

    return toActivityReportResponse(updated);
  }

  private async requireSchoolStaff(actor: Actor) {
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }
}
