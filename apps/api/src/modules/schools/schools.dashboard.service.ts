import type { SchoolDashboardResponse } from '@auticare/contracts';
import { forbidden, notFound } from '../../common/errors/app-error.js';
import { SchoolsRepository } from './schools.repository.js';

type Actor = { parentId: string; role: string };

export class SchoolDashboardService {
  constructor(private readonly repository = new SchoolsRepository()) {}

  /**
   * Full dashboard response for the authenticated school account.
   * All data is strictly scoped to the staff member's schoolId.
   */
  async getDashboard(actor: Actor): Promise<SchoolDashboardResponse> {
    const staff = await this.requireSchoolStaff(actor);
    const schoolId = staff.schoolId;

    const school = await this.repository.findSchoolById(schoolId);
    if (!school) throw notFound('School was not found.');

    const account = await this.repository.findParentById(staff.parentId);

    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Previous-month boundaries for weekDelta
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      totalStudents,
      studentsInTerm,
      reportsSubmitted,
      pendingReports,
      activitiesCompleted,
      activitiesLastWeek,
      activitiesPrevWeek,
      recentReports,
      draftReports,
      pendingEnrollments,
      pendingNotifications,
    ] = await Promise.all([
      this.repository.countAllEnrollments(schoolId),
      this.repository.countEnrollmentsSince(schoolId, ninetyDaysAgo),
      this.repository.countReportsWithStatus(schoolId, 'SUBMITTED', startOfCurrentMonth),
      this.repository.countReportsWithStatus(schoolId, 'DRAFT'),
      this.repository.countReportsBefore(schoolId, now),
      this.repository.countReportsBetween(schoolId, sevenDaysAgo, now),
      this.repository.countReportsBetween(schoolId, fourteenDaysAgo, sevenDaysAgo),
      this.repository.listRecentReports(schoolId, 5),
      this.repository.listDraftReports(schoolId),
      this.repository.countPendingEnrollments(schoolId),
      this.repository.listPendingNotifications(schoolId),
    ]);

    // Build reminders from real data
    const reminders: SchoolDashboardResponse['reminders'] = [];

    // DRAFT reports as reminders
    for (const draft of draftReports) {
      const createdDate = new Date(draft.createdAt);
      const diffMs = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const urgency =
        diffDays === 0
          ? ('today' as const)
          : diffDays <= 1
            ? ('tomorrow' as const)
            : ('upcoming' as const);
      reminders.push({
        id: draft.id,
        title: `Draft report: ${draft.title}`,
        urgency,
        dueTime: urgency === 'today' ? 'Complete today' : null,
      });
    }

    // Pending enrollment reminders
    if (pendingEnrollments > 0) {
      reminders.push({
        id: 'pending-enrollments',
        title: `${pendingEnrollments} enrollment request${pendingEnrollments > 1 ? 's' : ''} pending`,
        urgency: 'today',
        dueTime: 'Review requested',
      });
    }

    // Notification reminders
    for (const notif of pendingNotifications.slice(0, 3)) {
      const urgency =
        notif.type === 'ENROLLMENT_REQUEST' ? ('tomorrow' as const) : ('upcoming' as const);
      reminders.push({
        id: notif.id,
        title: notif.title,
        urgency,
        dueTime: notif.body || null,
      });
    }

    // Cap reminders at 5
    const cappedReminders = reminders.slice(0, 5);

    const weekDelta =
      activitiesPrevWeek > 0
        ? Math.round(((activitiesLastWeek - activitiesPrevWeek) / activitiesPrevWeek) * 100 * 10) /
          10
        : activitiesLastWeek > 0
          ? null // No previous data to compare, don't show a delta
          : null;

    return {
      schoolName: school.name,
      staffFirstName: account?.firstName ?? 'School',
      staffLastName: account?.lastName ?? '',
      staffTitle: staff.title,
      stats: {
        totalStudents,
        studentsDelta: studentsInTerm > 0 ? studentsInTerm : null,
        reportsSubmitted,
        pendingReports,
        activitiesCompleted,
        weekDelta,
      },
      recentReports: recentReports.map((r) => ({
        id: r.id,
        childFirstName: r.child?.firstName ?? 'Unknown',
        activityCategory: r.activityCategory,
        title: r.title,
        activityDate: r.activityDate.toISOString().slice(0, 10),
        status: r.status,
      })),
      reminders: cappedReminders,
    };
  }

  private async requireSchoolStaff(actor: Actor) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }
}
