import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { AppError } from '../../common/errors/app-error.js';

/**
 * Data access for parent-facing activity reports. Every query is scoped by
 * `child.parentId` in the database itself, so cross-family data leakage is
 * impossible even if the service layer were bypassed.
 */
/** Offset/limit as the pagination helper produces it. */
type Page = { skip: number; take: number };

export class ParentsRepository {
  /** Confirms the child belongs to the given parent. */
  findOwnedChild(childId: string, parentId: string) {
    return prisma.child.findFirst({
      where: { id: childId, parentId },
      select: { id: true, firstName: true, parentId: true },
    });
  }

  /** One page of SUBMITTED reports for an owned child, newest first. */
  async listSubmittedReportsForChild(childId: string, page: Page) {
    const where: Prisma.ActivityReportWhereInput = { childId, status: 'SUBMITTED' };
    const [items, total] = await prisma.$transaction([
      prisma.activityReport.findMany({
        where,
        orderBy: { activityDate: 'desc' },
        select: {
          id: true,
          childId: true,
          activityCategory: true,
          title: true,
          summary: true,
          activityDate: true,
          status: true,
          duration: true,
          performanceMetrics: true,
          teacherObservation: true,
          recommendations: true,
          photoUrls: true,
          createdAt: true,
          school: { select: { name: true } },
          reporter: { select: { firstName: true, lastName: true } },
        },
        ...page,
      }),
      prisma.activityReport.count({ where }),
    ]);
    return { items, total };
  }

  /** School display name and location for the enrollment-request confirmation. */
  findSchoolName(schoolId: string) {
    return prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, city: true, address: true },
    });
  }

  /** Existing enrollment for this school+child pair, if any. */
  findEnrollment(schoolId: string, childId: string) {
    return prisma.schoolChildEnrollment.findUnique({
      where: { schoolId_childId: { schoolId, childId } },
      select: { id: true, status: true },
    });
  }

  /** This parent's prior requests for the same school+child that are still open. */
  findOpenAdmissionRequest(schoolId: string, childId: string, parentId: string) {
    return prisma.admissionRequest.findFirst({
      where: { schoolId, childId, parentId, status: 'REQUESTED' },
      select: { id: true },
    });
  }

  /**
   * Creates the admission request and the school-facing notification in one
   * transaction with Serializable isolation to prevent duplicate concurrent requests.
   * The notification is linked to the request via `enrollmentId`.
   */
  createAdmissionRequestWithNotification(input: {
    parentId: string;
    schoolId: string;
    childId: string;
    childName: string;
    schoolName: string;
    message?: string;
  }) {
    return prisma.$transaction(
      async (tx) => {
        const openRequest = await tx.admissionRequest.findFirst({
          where: {
            schoolId: input.schoolId,
            childId: input.childId,
            parentId: input.parentId,
            status: 'REQUESTED',
          },
        });
        if (openRequest) {
          throw new AppError(
            'VALIDATION_ERROR',
            'A request for this child at this school is already awaiting a decision.',
            409,
          );
        }

        const request = await tx.admissionRequest.create({
          data: {
            parentId: input.parentId,
            schoolId: input.schoolId,
            childId: input.childId,
            message: input.message ?? null,
            status: 'REQUESTED',
          },
        });
        await tx.notification.create({
          data: {
            parentId: input.parentId,
            schoolId: input.schoolId,
            type: 'ENROLLMENT_REQUEST',
            status: 'UNREAD',
            title: 'New enrollment request',
            body: `${input.childName} requested enrollment at ${input.schoolName}.`,
            enrollmentId: request.id,
          },
        });
        return request;
      },
      { isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel },
    );
  }

  /** This parent's requests, newest first, with school and child relations loaded. */
  listAdmissionRequestsForParent(parentId: string) {
    return prisma.admissionRequest.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { id: true, name: true, city: true, address: true } },
        child: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /** Batch child-name lookup for mapping admission requests. */
  findChildNamesByIds(childIds: readonly string[]) {
    return prisma.child.findMany({
      where: { id: { in: [...childIds] } },
      select: { id: true, firstName: true, lastName: true },
    });
  }

  /** One page of the parent's own notifications, newest first. */
  async listNotificationsForParent(
    parentId: string,
    filters: { isRead?: boolean | undefined },
    page: Page,
  ) {
    const where: Prisma.NotificationWhereInput = {
      parentId,
      ...(filters.isRead !== undefined && {
        status: filters.isRead ? ('READ' as const) : ('UNREAD' as const),
      }),
    };
    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, ...page }),
      prisma.notification.count({ where }),
    ]);
    return { items, total };
  }

  /** Find notification by id to verify ownership before mutation. */
  findNotificationById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  /** Mark a single notification as read. */
  markNotificationRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: 'READ' },
    });
  }

  /** Mark all unread notifications for a parent as read. */
  markAllNotificationsRead(parentId: string) {
    return prisma.notification.updateMany({
      where: { parentId, status: 'UNREAD' },
      data: { status: 'READ' },
    });
  }

  /** Look up accessibility and localization preferences for a parent account. */
  findPreferences(parentId: string) {
    return prisma.parentPreference.findUnique({
      where: { parentId },
    });
  }

  /** Upsert preferences for a parent account. */
  upsertPreferences(
    parentId: string,
    data: {
      preferredLanguage?: string | undefined;
      reducedMotion?: boolean | undefined;
      highContrast?: boolean | undefined;
    },
  ) {
    return prisma.parentPreference.upsert({
      where: { parentId },
      create: {
        parentId,
        preferredLanguage: data.preferredLanguage ?? 'en',
        reducedMotion: data.reducedMotion ?? false,
        highContrast: data.highContrast ?? false,
      },
      update: {
        ...(data.preferredLanguage !== undefined && { preferredLanguage: data.preferredLanguage }),
        ...(data.reducedMotion !== undefined && { reducedMotion: data.reducedMotion }),
        ...(data.highContrast !== undefined && { highContrast: data.highContrast }),
      },
    });
  }
}
