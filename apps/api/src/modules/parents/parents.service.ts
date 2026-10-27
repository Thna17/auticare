import type {
  AdmissionRequestResponse,
  ListParentNotificationsQuery,
  NotificationResponse,
  PaginationQuery,
  ParentActivityReportListResponse,
  ParentNotificationListResponse,
  ParentPreferencesResponse,
  UpdateParentPreferencesRequest,
} from '@auticare/contracts';
import { toPaginationMeta, toSkipTake } from '../../common/http/pagination.js';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { ParentsRepository } from './parents.repository.js';

type Actor = { parentId: string; role: string };

export class ParentsService {
  constructor(private readonly repository = new ParentsRepository()) {}

  /**
   * GET /parents/activity-reports/:childId — all SUBMITTED reports for one of
   * the authenticated parent's own children, with school and reporter names.
   */
  async listActivityReports(
    actor: Actor,
    childId: string,
    query: PaginationQuery,
  ): Promise<ParentActivityReportListResponse> {
    if (actor.role !== 'PARENT') throw forbidden();

    const child = await this.repository.findOwnedChild(childId, actor.parentId);
    if (!child) throw notFound('Child profile was not found.');

    const { items, total } = await this.repository.listSubmittedReportsForChild(
      childId,
      toSkipTake(query),
    );

    const reports = items.map((report) => ({
      id: report.id,
      childId: report.childId,
      activityCategory: report.activityCategory,
      title: report.title,
      summary: report.summary,
      activityDate: report.activityDate.toISOString().slice(0, 10),
      status: report.status,
      duration: report.duration,
      performanceMetrics: (report.performanceMetrics ?? null) as unknown,
      teacherObservation: report.teacherObservation,
      recommendations: report.recommendations,
      photoUrls: (report.photoUrls ?? null) as string[] | null,
      createdAt: report.createdAt.toISOString(),
      schoolName: report.school.name,
      reporter: {
        firstName: report.reporter.firstName,
        lastName: report.reporter.lastName,
      },
    }));

    return { reports, pagination: toPaginationMeta(query, total) };
  }

  /**
   * POST /parents/enrollment-requests — a parent requests enrollment of one of
   * their children at a school. Creates an AdmissionRequest (REQUESTED) plus an
   * UNREAD ENROLLMENT_REQUEST notification for the school.
   */
  async createEnrollmentRequest(
    actor: Actor,
    input: { schoolId: string; childId: string; message?: string },
  ): Promise<AdmissionRequestResponse> {
    if (actor.role !== 'PARENT') throw forbidden();

    const child = await this.repository.findOwnedChild(input.childId, actor.parentId);
    if (!child) throw notFound('Child profile was not found.');

    const school = await this.repository.findSchoolName(input.schoolId);
    if (!school) throw notFound('School was not found.');

    const existingEnrollment = await this.repository.findEnrollment(input.schoolId, input.childId);
    if (existingEnrollment) {
      throw new AppError(
        'VALIDATION_ERROR',
        existingEnrollment.status === 'REJECTED'
          ? 'This school has declined a previous request for this child.'
          : 'This child already has an enrollment at this school.',
        409,
      );
    }

    const openRequest = await this.repository.findOpenAdmissionRequest(
      input.schoolId,
      input.childId,
      actor.parentId,
    );
    if (openRequest) {
      throw new AppError(
        'VALIDATION_ERROR',
        'A request for this child at this school is already awaiting a decision.',
        409,
      );
    }

    const childName = child.firstName;
    let request;
    try {
      request = await this.repository.createAdmissionRequestWithNotification({
        parentId: actor.parentId,
        schoolId: input.schoolId,
        childId: input.childId,
        childName,
        schoolName: school.name,
        ...(input.message !== undefined && { message: input.message }),
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err.code === 'P2034' || err.code === 'P2002')
      ) {
        throw new AppError(
          'VALIDATION_ERROR',
          'A request for this child at this school is already awaiting a decision.',
          409,
        );
      }
      throw err;
    }

    return {
      id: request.id,
      schoolId: request.schoolId,
      schoolName: school.name,
      schoolCity: school.city ?? null,
      schoolAddress: school.address ?? null,
      childId: request.childId,
      childName,
      status: request.status,
      message: request.message,
      createdAt: request.createdAt.toISOString(),
    };
  }

  /** GET /parents/enrollment-requests — this parent's requests, newest first. */
  async listEnrollmentRequests(actor: Actor): Promise<AdmissionRequestResponse[]> {
    if (actor.role !== 'PARENT') throw forbidden();

    const requests = await this.repository.listAdmissionRequestsForParent(actor.parentId);

    return requests.map((request) => {
      const child = request.child;
      return {
        id: request.id,
        schoolId: request.schoolId,
        schoolName: request.school.name,
        schoolCity: request.school.city ?? null,
        schoolAddress: request.school.address ?? null,
        childId: request.childId,
        childName: child
          ? [child.firstName, child.lastName].filter(Boolean).join(' ')
          : 'Removed child',
        status: request.status,
        message: request.message,
        createdAt: request.createdAt.toISOString(),
      };
    });
  }

  /** GET /parents/notifications — the parent's own notifications, newest first. */
  async listNotifications(
    actor: Actor,
    query: ListParentNotificationsQuery,
  ): Promise<ParentNotificationListResponse> {
    if (actor.role !== 'PARENT') throw forbidden();
    const { items, total } = await this.repository.listNotificationsForParent(
      actor.parentId,
      { isRead: query.isRead, status: query.status },
      toSkipTake(query),
    );
    // Shaped as NotificationResponse so the web side can reuse the existing
    // contract instead of a parent-only variant.
    const notifications = items.map((notification) => ({
      id: notification.id,
      type: notification.type,
      status: notification.status,
      title: notification.title,
      body: notification.body,
      enrollmentId: notification.enrollmentId,
      reportId: notification.reportId,
      appointmentId: notification.appointmentId,
      createdAt: notification.createdAt.toISOString(),
    }));

    return { notifications, pagination: toPaginationMeta(query, total) };
  }

  /**
   * PATCH /parents/notifications/:id/read — mark a single notification read.
   * Scoped strictly to the authenticated parent.
   */
  async archiveNotification(actor: Actor, notificationId: string): Promise<NotificationResponse> {
    const notification = await this.repository.findNotificationById(notificationId);
    if (!notification) throw notFound('Notification was not found.');
    if (notification.parentId !== actor.parentId) {
      throw forbidden('You do not have permission to archive this notification.');
    }
    const updated = await this.repository.archiveNotification(notificationId);
    return {
      id: updated.id,
      type: updated.type,
      status: updated.status,
      title: updated.title,
      body: updated.body,
      enrollmentId: updated.enrollmentId,
      reportId: updated.reportId,
      appointmentId: updated.appointmentId,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async markNotificationRead(actor: Actor, notificationId: string): Promise<NotificationResponse> {
    if (actor.role !== 'PARENT') throw forbidden();
    const notification = await this.repository.findNotificationById(notificationId);
    if (!notification) throw notFound('Notification was not found.');
    if (notification.parentId !== actor.parentId) throw forbidden();

    const updated = await this.repository.markNotificationRead(notificationId);
    return {
      id: updated.id,
      type: updated.type,
      status: updated.status,
      title: updated.title,
      body: updated.body,
      enrollmentId: updated.enrollmentId,
      reportId: updated.reportId,
      appointmentId: updated.appointmentId,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * PATCH /parents/notifications/read-all — mark all unread notifications read.
   * Scoped strictly to the authenticated parent.
   */
  async markAllNotificationsRead(actor: Actor): Promise<{ updatedCount: number }> {
    if (actor.role !== 'PARENT') throw forbidden();
    const result = await this.repository.markAllNotificationsRead(actor.parentId);
    return { updatedCount: result.count };
  }

  /**
   * GET /parents/preferences — load accessibility and localization preferences.
   */
  async getPreferences(actor: { parentId: string }): Promise<ParentPreferencesResponse> {
    const pref = await this.repository.findPreferences(actor.parentId);
    if (!pref) {
      return {
        preference: {
          preferredLanguage: 'en',
          reducedMotion: false,
          highContrast: false,
          notifyQuestionnaire: true,
          notifyActivities: true,
          notifyReports: true,
          notifySchool: true,
          notifyAnnouncements: true,
        },
      };
    }
    return {
      preference: {
        preferredLanguage: pref.preferredLanguage,
        reducedMotion: pref.reducedMotion,
        highContrast: pref.highContrast,
        notifyQuestionnaire: pref.notifyQuestionnaire,
        notifyActivities: pref.notifyActivities,
        notifyReports: pref.notifyReports,
        notifySchool: pref.notifySchool,
        notifyAnnouncements: pref.notifyAnnouncements,
        updatedAt: pref.updatedAt.toISOString(),
      },
    };
  }

  /**
   * PATCH /parents/preferences — update accessibility and localization preferences.
   */
  async updatePreferences(
    actor: { parentId: string },
    input: UpdateParentPreferencesRequest,
  ): Promise<ParentPreferencesResponse> {
    if (
      input.preferredLanguage === undefined &&
      input.reducedMotion === undefined &&
      input.highContrast === undefined &&
      input.notifyQuestionnaire === undefined &&
      input.notifyActivities === undefined &&
      input.notifyReports === undefined &&
      input.notifySchool === undefined &&
      input.notifyAnnouncements === undefined
    ) {
      throw new AppError('VALIDATION_ERROR', 'Provide at least one preference to update.', 400);
    }

    const pref = await this.repository.upsertPreferences(actor.parentId, input);
    return {
      preference: {
        preferredLanguage: pref.preferredLanguage,
        reducedMotion: pref.reducedMotion,
        highContrast: pref.highContrast,
        notifyQuestionnaire: pref.notifyQuestionnaire,
        notifyActivities: pref.notifyActivities,
        notifyReports: pref.notifyReports,
        notifySchool: pref.notifySchool,
        notifyAnnouncements: pref.notifyAnnouncements,
        updatedAt: pref.updatedAt.toISOString(),
      },
    };
  }
}
