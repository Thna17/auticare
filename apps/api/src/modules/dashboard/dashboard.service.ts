import type {
  AdminDashboardResponse,
  ParentDashboardResponse,
  ParentDashboardWeeklyProgress,
} from '@auticare/contracts';
import { forbidden } from '../../common/errors/app-error.js';
import { CHILD_NOT_ARCHIVED } from '../../database/active-child.js';
import { prisma } from '../../database/prisma.js';

type Actor = { parentId: string; role: string };

export class DashboardService {
  /**
   * Return real backend-derived dashboard metrics for a parent user.
   * Strictly uses actual database records: selected child, completed screening,
   * actual completed activity records in the current week, upcoming appointment,
   * and evidence-based recommendation derived exclusively from real stored screening results.
   */
  async getParentDashboard(actor: Actor, childId?: string): Promise<ParentDashboardResponse> {
    if (actor.role !== 'PARENT') {
      throw forbidden('Only parents can access the parent dashboard.');
    }

    const parentId = actor.parentId;

    // 1. Fetch parent's children (not archived)
    const children = await prisma.child.findMany({
      where: {
        parentId,
        ...CHILD_NOT_ARCHIVED,
      },
      orderBy: { createdAt: 'asc' },
    });

    const selectedChild =
      (childId ? children.find((c) => c.id === childId) : null) ?? children[0] ?? null;

    // 2. Screening summary for the selected child (if child exists)
    let screeningSummary: ParentDashboardResponse['screeningSummary'] = {
      hasScreening: false,
      sessionId: null,
      status: null,
      riskLevel: null,
      riskPercentage: null,
      score: null,
      completedDate: null,
      recommendation: null,
    };

    if (selectedChild) {
      const latestScreening = await prisma.screening.findFirst({
        where: {
          childId: selectedChild.id,
          status: { in: ['SUBMITTED', 'ANALYZED'] },
        },
        include: { result: true },
        orderBy: { submittedAt: 'desc' },
      });

      if (latestScreening) {
        screeningSummary = {
          hasScreening: true,
          sessionId: latestScreening.id,
          status: latestScreening.status as 'SUBMITTED' | 'ANALYZED',
          riskLevel: latestScreening.result?.riskLevel ?? null,
          riskPercentage: latestScreening.result?.riskPercentage ?? null,
          score: latestScreening.result?.score ?? null,
          completedDate: latestScreening.submittedAt
            ? latestScreening.submittedAt.toISOString().slice(0, 10)
            : null,
          recommendation: latestScreening.result?.recommendation ?? null,
        };
      }
    }

    // Each child must finish their own questionnaire (either form) before their
    // personalized dashboard opens. A saved draft means it is in progress.
    let questionnaireStatus: ParentDashboardResponse['questionnaireStatus'] = null;
    if (selectedChild) {
      if (screeningSummary.hasScreening) {
        questionnaireStatus = 'COMPLETED';
      } else {
        const draft = await prisma.screening.findFirst({
          where: { childId: selectedChild.id, status: 'DRAFT' },
          select: { id: true },
        });
        questionnaireStatus = draft ? 'IN_PROGRESS' : 'NOT_STARTED';
      }
    }

    // 3. Weekly activity progress for the selected child
    // Calculate start of current week (Monday)
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayCounts: [number, number, number, number, number, number, number] = [
      0, 0, 0, 0, 0, 0, 0,
    ];

    let totalCompletedThisWeek = 0;

    if (selectedChild) {
      const completedActivities = await prisma.activityProgress.findMany({
        where: {
          childId: selectedChild.id,
          completedAt: {
            gte: startOfWeek,
            lt: endOfWeek,
          },
        },
      });

      totalCompletedThisWeek = completedActivities.length;

      for (const act of completedActivities) {
        if (act.completedAt) {
          const actDay = (act.completedAt.getDay() + 6) % 7;
          const currentCount = dayCounts[actDay];
          if (typeof currentCount === 'number') {
            dayCounts[actDay] = currentCount + 1;
          }
        }
      }
    }

    const maxDayCount = Math.max(...dayCounts, 1);
    const weeklyProgress: ParentDashboardWeeklyProgress = {
      days: dayLabels.map((day, idx) => {
        const count = dayCounts[idx] ?? 0;
        return {
          day,
          count,
          percentage: Math.round((count / maxDayCount) * 100),
        };
      }),
      totalCompletedThisWeek,
    };

    // 4. Upcoming appointment for this parent / selected child
    const upcomingAppointmentRecord = await prisma.appointment.findFirst({
      where: {
        parentId,
        ...(selectedChild ? { childId: selectedChild.id } : {}),
        scheduledAt: { gte: now },
        status: { in: ['REQUESTED', 'CONFIRMED'] },
      },
      include: {
        hospital: true,
        doctor: true,
        child: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const upcomingAppointment = upcomingAppointmentRecord
      ? {
          id: upcomingAppointmentRecord.id,
          hospitalName: upcomingAppointmentRecord.hospital.name,
          doctorName: upcomingAppointmentRecord.doctor?.fullName ?? null,
          specialty: upcomingAppointmentRecord.doctor?.specialty ?? null,
          scheduledAt: upcomingAppointmentRecord.scheduledAt.toISOString(),
          status: upcomingAppointmentRecord.status,
          reason: upcomingAppointmentRecord.reason,
          childFirstName: upcomingAppointmentRecord.child?.firstName ?? null,
        }
      : null;

    // 5. Recommended action - derived truthfully without inventing clinical claims
    let recommendedAction;
    if (!selectedChild) {
      recommendedAction = {
        title: 'Add a child profile',
        description: 'Create a child profile to track personalized screenings and activities.',
        actionPath: '/children/new',
        actionLabel: 'Add Child Profile',
        source: 'NO_CHILD' as const,
      };
    } else if (!screeningSummary.hasScreening) {
      recommendedAction = {
        title: `Start screening for ${selectedChild.firstName}`,
        description:
          'Complete an initial developmental screening questionnaire to identify support areas.',
        actionPath: '/screening',
        actionLabel: 'Start Screening',
        source: 'NO_SCREENING' as const,
      };
    } else {
      // We have an actual screening result with stored recommendation
      recommendedAction = {
        title: 'Screening Recommendation',
        description:
          screeningSummary.recommendation ??
          `Review ${selectedChild.firstName}'s latest screening result to plan supportive activities.`,
        actionPath: screeningSummary.sessionId
          ? `/screening/result/${screeningSummary.sessionId}`
          : '/screening',
        actionLabel: 'View Screening Result',
        source: 'SCREENING_RESULT' as const,
      };
    }

    // 6. Recent behaviour records
    const recentObservationsRaw = selectedChild
      ? await prisma.behaviorObservation.findMany({
          where: { childId: selectedChild.id },
          take: 3,
          orderBy: { occurredAt: 'desc' },
          select: { id: true, category: true, occurredAt: true, note: true },
        })
      : [];
    const recentObservations = recentObservationsRaw.map((obs) => ({
      id: obs.id,
      category: obs.category,
      occurredAt: obs.occurredAt.toISOString(),
      note: obs.note,
    }));

    // 7. Recent notifications
    const recentNotificationsRaw = await prisma.notification.findMany({
      where: { parentId, status: { not: 'ARCHIVED' } },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, createdAt: true },
    });
    const recentNotifications = recentNotificationsRaw.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    }));

    // 8. Recommended activities
    let recommendedActivities: {
      id: string;
      title: string;
      category: string;
      minAgeMonths: number;
      maxAgeMonths: number;
      summary: string;
    }[] = [];
    if (selectedChild) {
      const birthDate = selectedChild.dateOfBirth;
      const ageMonths = Math.max(
        0,
        (now.getFullYear() - birthDate.getFullYear()) * 12 +
          (now.getMonth() - birthDate.getMonth()),
      );
      const acts = await prisma.activity.findMany({
        where: {
          minAgeMonths: { lte: ageMonths },
          maxAgeMonths: { gte: ageMonths },
        },
        take: 3,
        select: {
          id: true,
          title: true,
          category: true,
          minAgeMonths: true,
          maxAgeMonths: true,
          summary: true,
        },
      });
      if (acts.length === 0) {
        recommendedActivities = await prisma.activity.findMany({
          take: 3,
          select: {
            id: true,
            title: true,
            category: true,
            minAgeMonths: true,
            maxAgeMonths: true,
            summary: true,
          },
        });
      } else {
        recommendedActivities = acts;
      }
    }

    return {
      recentObservations,
      recentNotifications,
      recommendedActivities,
      selectedChild: selectedChild
        ? {
            id: selectedChild.id,
            firstName: selectedChild.firstName,
            lastName: selectedChild.lastName,
            dateOfBirth: selectedChild.dateOfBirth.toISOString().slice(0, 10),
            photoUrl: selectedChild.photoUrl,
          }
        : null,
      totalChildren: children.length,
      children: children.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        dateOfBirth: c.dateOfBirth.toISOString().slice(0, 10),
        photoUrl: c.photoUrl,
      })),
      questionnaireStatus,
      screeningSummary,
      weeklyProgress,
      upcomingAppointment,
      recommendedAction,
    };
  }

  /**
   * Return real backend-derived dashboard statistics and audit logs for an administrator.
   */
  async getAdminDashboard(actor: Actor): Promise<AdminDashboardResponse> {
    if (actor.role !== 'ADMIN') {
      throw forbidden('Only administrators can access the admin dashboard.');
    }

    const [
      totalFamilies,
      activeChildren,
      totalHospitals,
      totalSchools,
      totalAppointments,
      pendingAppointments,
      recentAppointments,
      recentAuditEvents,
    ] = await Promise.all([
      prisma.parent.count({ where: { role: 'PARENT' } }),
      prisma.child.count({ where: { ...CHILD_NOT_ARCHIVED } }),
      prisma.hospital.count(),
      prisma.school.count({ where: { status: 'ACTIVE' } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'REQUESTED' } }),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { scheduledAt: 'desc' },
        include: {
          parent: true,
          child: true,
          hospital: true,
        },
      }),
      prisma.auditEvent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const actorIds = recentAuditEvents
      .map((e) => e.actorId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const actors =
      actorIds.length > 0
        ? await prisma.parent.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, email: true },
          })
        : [];

    const actorEmailMap = new Map(actors.map((a) => [a.id, a.email]));

    return {
      stats: {
        totalFamilies,
        activeChildren,
        totalHospitals,
        totalSchools,
        totalAppointments,
        pendingAppointments,
      },
      recentAppointments: recentAppointments.map((appt) => ({
        id: appt.id,
        parentName: `${appt.parent.firstName} ${appt.parent.lastName}`.trim(),
        childName: appt.child?.firstName ?? null,
        hospitalName: appt.hospital.name,
        scheduledAt: appt.scheduledAt.toISOString(),
        status: appt.status,
      })),
      recentAuditEvents: recentAuditEvents.map((evt) => ({
        id: evt.id,
        action: evt.action,
        actorEmail: evt.actorId ? (actorEmailMap.get(evt.actorId) ?? null) : null,
        targetEmail: evt.targetEmail,
        createdAt: evt.createdAt.toISOString(),
      })),
    };
  }
}

export const dashboardService = new DashboardService();
