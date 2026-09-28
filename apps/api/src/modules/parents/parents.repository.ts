import { prisma } from '../../database/prisma.js';

/**
 * Data access for parent-facing activity reports. Every query is scoped by
 * `child.parentId` in the database itself, so cross-family data leakage is
 * impossible even if the service layer were bypassed.
 */
export class ParentsRepository {
  /** Confirms the child belongs to the given parent. */
  findOwnedChild(childId: string, parentId: string) {
    return prisma.child.findFirst({
      where: { id: childId, parentId },
      select: { id: true, firstName: true, parentId: true },
    });
  }

  /** All SUBMITTED reports for one owned child, newest first. */
  listSubmittedReportsForChild(childId: string) {
    return prisma.activityReport.findMany({
      where: { childId, status: 'SUBMITTED' },
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
    });
  }

  /** School display name for the enrollment-request confirmation. */
  findSchoolName(schoolId: string) {
    return prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } });
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
   * transaction. The notification is linked to the request via
   * `enrollmentId` (the only per-request pointer on the Notification model).
   */
  createAdmissionRequestWithNotification(input: {
    parentId: string;
    schoolId: string;
    childId: string;
    childName: string;
    schoolName: string;
    message?: string;
  }) {
    return prisma.$transaction(async (tx) => {
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
    });
  }

  /** This parent's requests, newest first, with school names. The child
   * names are resolved separately — AdmissionRequest has no Child relation. */
  listAdmissionRequestsForParent(parentId: string) {
    return prisma.admissionRequest.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { name: true } },
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

  /** The parent's own notifications, newest first. */
  listNotificationsForParent(parentId: string) {
    return prisma.notification.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
