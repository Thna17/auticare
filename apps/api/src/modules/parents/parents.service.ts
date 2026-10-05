import type { AdmissionRequestResponse, ParentActivityReportResponse } from '@auticare/contracts';
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
  ): Promise<ParentActivityReportResponse[]> {
    if (actor.role !== 'PARENT') throw forbidden();

    const child = await this.repository.findOwnedChild(childId, actor.parentId);
    if (!child) throw notFound('Child profile was not found.');

    const reports = await this.repository.listSubmittedReportsForChild(childId);

    return reports.map((report) => ({
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
    const request = await this.repository.createAdmissionRequestWithNotification({
      parentId: actor.parentId,
      schoolId: input.schoolId,
      childId: input.childId,
      childName,
      schoolName: school.name,
      ...(input.message !== undefined && { message: input.message }),
    });

    return {
      id: request.id,
      schoolId: request.schoolId,
      schoolName: school.name,
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
    const childNames = await this.repository.findChildNamesByIds(
      requests.map((r) => r.childId).filter((id): id is string => id !== null),
    );
    const namesById = new Map(childNames.map((c) => [c.id, c]));

    return requests.map((request) => {
      const child = request.childId ? namesById.get(request.childId) : undefined;
      return {
        id: request.id,
        schoolId: request.schoolId,
        schoolName: request.school.name,
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
  async listNotifications(actor: Actor) {
    if (actor.role !== 'PARENT') throw forbidden();
    const notifications = await this.repository.listNotificationsForParent(actor.parentId);
    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      status: notification.status,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt.toISOString(),
    }));
  }
}
