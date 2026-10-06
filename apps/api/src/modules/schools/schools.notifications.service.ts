import type {
  ListNotificationsQuery,
  NotificationDecisionResponse,
  SchoolNotificationItem,
} from '@auticare/contracts';
import { toPaginationMeta, toSkipTake } from '../../common/http/pagination.js';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { SchoolsRepository } from './schools.repository.js';
import { toNotificationResponse } from './schools.mapper.js';

type Actor = { parentId: string; role: string };

export class SchoolNotificationsService {
  constructor(private readonly repository = new SchoolsRepository()) {}

  /**
   * Fetch one page of notifications for the authenticated school, newest first,
   * enriched with the sender's name and — for enrollment requests — the linked
   * admission request details. Optionally filter by isRead.
   * Strictly scoped to the staff member's school — no schoolId accepted.
   */
  async listNotificationItems(actor: Actor, query: ListNotificationsQuery) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.requireSchoolStaff(actor);

    const filters: { isRead?: boolean; view?: 'PENDING' | 'DECIDED' } = {};
    if (query.isRead !== undefined) filters.isRead = query.isRead;
    if (query.view !== undefined) filters.view = query.view;
    const { items: notifications, total } = await this.repository.listNotificationsWithSender(
      staff.schoolId,
      filters,
      toSkipTake(query),
    );

    const items: SchoolNotificationItem[] = [];
    for (const notification of notifications) {
      let admissionStatus: string | null = null;
      let studentName: string | null = null;
      let requestMessage: string | null = null;

      // ENROLLMENT_REQUEST notifications carry their admission request id in
      // the enrollmentId pointer. AdmissionRequest has no Child relation, so
      // the student name is resolved via the plain childId column.
      if (notification.type === 'ENROLLMENT_REQUEST' && notification.enrollmentId) {
        const request = await this.repository.findAdmissionRequestById(notification.enrollmentId);
        if (request) {
          admissionStatus = request.status;
          requestMessage = request.message;
          if (request.childId) {
            const child = await this.repository.findChildNameById(request.childId);
            studentName = child
              ? [child.firstName, child.lastName].filter(Boolean).join(' ')
              : null;
          }
        }
      }

      items.push({
        id: notification.id,
        type: notification.type,
        status: notification.status,
        title: notification.title,
        body: notification.body,
        createdAt: notification.createdAt.toISOString(),
        senderName: [notification.parent.firstName, notification.parent.lastName]
          .filter(Boolean)
          .join(' '),
        admissionRequestId:
          notification.type === 'ENROLLMENT_REQUEST' ? notification.enrollmentId : null,
        admissionStatus,
        studentName,
        requestMessage,
      });
    }

    return { notifications: items, pagination: toPaginationMeta(query, total) };
  }

  /**
   * Mark a specific notification as read. The notification must belong to the
   * authenticated staff member's school.
   */
  async markAsRead(actor: Actor, notificationId: string) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.requireSchoolStaff(actor);

    const notification = await this.repository.findNotificationById(notificationId);
    if (!notification) throw notFound('Notification was not found.');
    if (notification.schoolId !== staff.schoolId) throw forbidden();

    const updated = await this.repository.markNotificationRead(notificationId);
    return toNotificationResponse(updated);
  }

  /**
   * Mark all notifications for the authenticated school as read.
   * Returns the count of notifications that were updated.
   */
  async markAllAsRead(actor: Actor) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.requireSchoolStaff(actor);

    const result = await this.repository.markAllNotificationsRead(staff.schoolId);
    return { updatedCount: result.count };
  }

  /**
   * School's decision on an enrollment-request notification.
   * APPROVED → AdmissionRequest APPROVED + enrollment ACTIVE
   * REJECTED → AdmissionRequest REJECTED + enrollment REJECTED
   * PENDING  → AdmissionRequest back to REQUESTED (kept in review)
   * In every case the notification is marked READ and the parent receives an
   * ADMISSION notification with the outcome.
   */
  async decideEnrollmentRequest(
    actor: Actor,
    notificationId: string,
    decision: 'APPROVED' | 'REJECTED' | 'PENDING',
  ): Promise<NotificationDecisionResponse> {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.requireSchoolStaff(actor);

    const notification = await this.repository.findNotificationById(notificationId);
    if (!notification) throw notFound('Notification was not found.');
    if (notification.schoolId !== staff.schoolId) throw forbidden();
    if (notification.type !== 'ENROLLMENT_REQUEST' || !notification.enrollmentId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'This notification is not linked to an enrollment request.',
        400,
      );
    }

    const request = await this.repository.findAdmissionRequestById(notification.enrollmentId);
    if (!request) throw notFound('The linked enrollment request no longer exists.');
    if (request.schoolId !== staff.schoolId) throw forbidden();
    if (!request.childId) {
      throw new AppError('VALIDATION_ERROR', 'The request has no linked child.', 400);
    }

    const admissionStatus = decision === 'PENDING' ? 'REQUESTED' : decision;
    const enrollmentStatus =
      decision === 'APPROVED' ? 'ACTIVE' : decision === 'REJECTED' ? 'REJECTED' : null;

    const child = request.childId ? await this.repository.findChildNameById(request.childId) : null;

    const enrollmentId = await this.repository.decideEnrollmentRequest({
      requestId: request.id,
      notificationId: notification.id,
      parentId: request.parentId,
      schoolId: staff.schoolId,
      childId: request.childId,
      childFirstName: child?.firstName ?? 'your child',
      schoolName: notification.school?.name ?? 'The school',
      admissionStatus,
      enrollmentStatus,
    });

    const updated = await this.repository.findNotificationById(notification.id);
    if (!updated) throw notFound('Notification was not found.');

    return {
      notification: toNotificationResponse(updated),
      admissionStatus,
      enrollmentId,
    };
  }

  private async requireSchoolStaff(actor: Actor) {
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }
}
