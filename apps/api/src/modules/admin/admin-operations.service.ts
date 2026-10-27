import type {
  AdminAnalytics,
  Announcement,
  AnnouncementAudience,
  AnalyticsMonth,
  Partnership,
  PartnershipStatus,
  SaveAnnouncementRequest,
  SavePartnershipRequest,
  UserRole,
  VisibleAnnouncement,
} from '@auticare/contracts';
import type {
  Announcement as AnnouncementRow,
  Partnership as PartnershipRow,
  Prisma,
} from '@prisma/client';
import { forbidden, notFound } from '../../common/errors/app-error.js';
import { prisma } from '../../database/prisma.js';
import { auditService } from '../audit/audit.service.js';
import { grantsAccess } from '../subscriptions/subscriptions.access.js';

type Actor = { parentId: string; role: UserRole };

const isLive = (row: Pick<AnnouncementRow, 'status' | 'publishAt' | 'expiresAt'>, now: Date) =>
  row.status === 'PUBLISHED' &&
  (!row.publishAt || row.publishAt <= now) &&
  (!row.expiresAt || row.expiresAt > now);

const toAnnouncement = (row: AnnouncementRow, now = new Date()): Announcement => ({
  id: row.id,
  title: row.title,
  body: row.body,
  audience: row.audience,
  status: row.status,
  publishAt: row.publishAt?.toISOString() ?? null,
  expiresAt: row.expiresAt?.toISOString() ?? null,
  publishedAt: row.publishedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  live: isLive(row, now),
});

const toPartnership = (row: PartnershipRow): Partnership => ({
  id: row.id,
  organizationName: row.organizationName,
  organizationType: row.organizationType as Partnership['organizationType'],
  contactName: row.contactName,
  contactEmail: row.contactEmail,
  contactPhone: row.contactPhone,
  status: row.status,
  nextFollowUpAt: row.nextFollowUpAt ? row.nextFollowUpAt.toISOString().slice(0, 10) : null,
  notes: row.notes,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const monthKey = (date: Date) => date.toISOString().slice(0, 7);

/** Announcements, partnerships and analytics for the platform admin. */
export class AdminOperationsService {
  private requireAdmin(actor: Actor) {
    if (actor.role !== 'ADMIN') throw forbidden();
  }

  // --- Announcements ------------------------------------------------------

  async listAnnouncements(actor: Actor): Promise<Announcement[]> {
    this.requireAdmin(actor);
    const rows = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    const now = new Date();
    return rows.map((row) => toAnnouncement(row, now));
  }

  async saveAnnouncement(
    actor: Actor,
    input: SaveAnnouncementRequest,
    id?: string,
  ): Promise<Announcement> {
    this.requireAdmin(actor);
    const existing = id ? await prisma.announcement.findUnique({ where: { id } }) : null;
    if (id && !existing) throw notFound('Announcement was not found.');
    const data = {
      title: input.title,
      body: input.body,
      audience: input.audience,
      status: input.status,
      publishAt: input.publishAt ? new Date(input.publishAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      // First time it is published; kept if it is later edited or archived.
      publishedAt: existing?.publishedAt ?? (input.status === 'PUBLISHED' ? new Date() : null),
    };
    const row = existing
      ? await prisma.announcement.update({ where: { id: existing.id }, data })
      : await prisma.announcement.create({ data: { ...data, createdById: actor.parentId } });
    await auditService.record({
      action: existing ? 'ANNOUNCEMENT_UPDATED' : 'ANNOUNCEMENT_CREATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: row.id,
      metadata: { title: row.title, audience: row.audience, status: row.status },
    });
    return toAnnouncement(row);
  }

  /**
   * The live announcements for whoever is asking. Teachers and school admins
   * are both SCHOOL accounts, so the staff role decides which audience applies.
   */
  async visibleAnnouncements(actor: Actor): Promise<VisibleAnnouncement[]> {
    const audiences: AnnouncementAudience[] = ['ALL'];
    if (actor.role === 'PARENT') audiences.push('PARENTS');
    if (actor.role === 'SCHOOL') {
      const staff = await prisma.schoolStaff.findMany({
        where: { parentId: actor.parentId, deactivatedAt: null },
        select: { role: true },
      });
      if (staff.some((s) => s.role === 'ADMIN')) audiences.push('SCHOOLS');
      if (staff.some((s) => s.role !== 'ADMIN')) audiences.push('TEACHERS');
    }
    const now = new Date();
    const rows = await prisma.announcement.findMany({
      where: {
        status: 'PUBLISHED',
        audience: { in: audiences },
        OR: [{ publishAt: null }, { publishAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    }));
  }

  // --- Partnerships -------------------------------------------------------

  async listPartnerships(
    actor: Actor,
    status?: PartnershipStatus | undefined,
  ): Promise<Partnership[]> {
    this.requireAdmin(actor);
    const rows = await prisma.partnership.findMany({
      ...(status ? { where: { status } } : {}),
      // Soonest follow-up first; ones without a date after, newest first.
      orderBy: [{ nextFollowUpAt: { sort: 'asc', nulls: 'last' } }, { updatedAt: 'desc' }],
      take: 500,
    });
    return rows.map(toPartnership);
  }

  async savePartnership(
    actor: Actor,
    input: SavePartnershipRequest,
    id?: string,
  ): Promise<Partnership> {
    this.requireAdmin(actor);
    if (id && !(await prisma.partnership.findUnique({ where: { id }, select: { id: true } }))) {
      throw notFound('Partnership was not found.');
    }
    const data = {
      organizationName: input.organizationName,
      organizationType: input.organizationType,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      status: input.status,
      nextFollowUpAt: input.nextFollowUpAt
        ? new Date(`${input.nextFollowUpAt}T00:00:00.000Z`)
        : null,
      notes: input.notes ?? null,
    };
    const row = id
      ? await prisma.partnership.update({ where: { id }, data })
      : await prisma.partnership.create({ data: { ...data, createdById: actor.parentId } });
    await auditService.record({
      action: id ? 'PARTNERSHIP_UPDATED' : 'PARTNERSHIP_CREATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: row.id,
      metadata: { organizationName: row.organizationName, status: row.status },
    });
    return toPartnership(row);
  }

  // --- Analytics ----------------------------------------------------------

  /**
   * Month-by-month growth for the last `months` months (including this one).
   * Counts only: no names, no child details. Plan value is the list price of
   * plans the admin recorded, since no payments are taken yet.
   */
  async analytics(actor: Actor, months: number): Promise<AdminAnalytics> {
    this.requireAdmin(actor);
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
    const since: Prisma.DateTimeFilter = { gte: start };

    const [parents, schools, subscriptions, ended, screenings, aiQuestions, activities] =
      await Promise.all([
        prisma.parent.findMany({
          where: { role: 'PARENT', createdAt: since },
          select: { createdAt: true },
        }),
        prisma.school.findMany({ where: { createdAt: since }, select: { createdAt: true } }),
        prisma.subscription.findMany({
          where: { startedAt: since },
          select: { startedAt: true, plan: true, priceCents: true },
        }),
        prisma.subscription.findMany({
          where: {
            OR: [{ canceledAt: since }, { status: 'EXPIRED', updatedAt: since }],
          },
          select: { canceledAt: true, updatedAt: true, status: true },
        }),
        prisma.screening.findMany({
          where: { status: { in: ['SUBMITTED', 'ANALYZED'] }, submittedAt: since },
          select: { submittedAt: true },
        }),
        prisma.aiMessage.findMany({
          where: { role: 'USER', createdAt: since },
          select: { createdAt: true },
        }),
        prisma.activityProgress.findMany({
          where: { completedAt: since },
          select: { completedAt: true },
        }),
      ]);

    const keys: string[] = [];
    for (let i = 0; i < months; i++) {
      keys.push(monthKey(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))));
    }
    const series = new Map<string, AnalyticsMonth>(
      keys.map((month) => [
        month,
        {
          month,
          parentRegistrations: 0,
          schoolsAdded: 0,
          proStarted: 0,
          businessStarted: 0,
          plansEnded: 0,
          recordedPlanValueCents: 0,
          questionnairesCompleted: 0,
          aiQuestions: 0,
          activitiesCompleted: 0,
        },
      ]),
    );
    const bump = (date: Date | null, field: keyof Omit<AnalyticsMonth, 'month'>, by = 1) => {
      const row = date ? series.get(monthKey(date)) : undefined;
      if (row) row[field] += by;
    };

    parents.forEach((row) => bump(row.createdAt, 'parentRegistrations'));
    schools.forEach((row) => bump(row.createdAt, 'schoolsAdded'));
    subscriptions.forEach((row) => {
      bump(row.startedAt, row.plan === 'PRO' ? 'proStarted' : 'businessStarted');
      bump(row.startedAt, 'recordedPlanValueCents', row.priceCents);
    });
    ended.forEach((row) => bump(row.canceledAt ?? row.updatedAt, 'plansEnded'));
    screenings.forEach((row) => bump(row.submittedAt, 'questionnairesCompleted'));
    aiQuestions.forEach((row) => bump(row.createdAt, 'aiQuestions'));
    activities.forEach((row) => bump(row.completedAt, 'activitiesCompleted'));

    const [parentsTotal, proRows, sponsored, activeChildren, completedChildren] = await Promise.all(
      [
        prisma.parent.count({ where: { role: 'PARENT' } }),
        prisma.subscription.findMany({
          where: { plan: 'PRO', parentId: { not: null } },
          select: { parentId: true, status: true, currentPeriodEnd: true },
        }),
        prisma.sponsorship.findMany({
          where: { status: 'ACTIVE' },
          select: { activeParentId: true, schoolId: true },
        }),
        prisma.child.count({ where: { archivedAt: null } }),
        prisma.child.count({
          where: {
            archivedAt: null,
            screenings: { some: { status: { in: ['SUBMITTED', 'ANALYZED'] } } },
          },
        }),
      ],
    );
    // A sponsored parent counts only while their school's Business plan is live.
    const business = await prisma.subscription.findMany({
      where: {
        plan: 'BUSINESS',
        schoolId: { in: [...new Set(sponsored.map((row) => row.schoolId))] },
      },
      select: { schoolId: true, status: true, currentPeriodEnd: true },
    });
    const liveSchools = new Set(
      business.filter((row) => grantsAccess(row, now)).map((row) => row.schoolId as string),
    );
    const onPro = new Set<string>([
      ...proRows.filter((row) => grantsAccess(row, now)).map((row) => row.parentId as string),
      ...sponsored
        .filter((row) => liveSchools.has(row.schoolId))
        .map((row) => row.activeParentId)
        .filter((id): id is string => !!id),
    ]);

    return {
      months: keys.map((key) => series.get(key) as AnalyticsMonth),
      totals: {
        parents: parentsTotal,
        parentsOnPro: onPro.size,
        activeChildren,
        childrenWithCompletedQuestionnaire: completedChildren,
      },
    };
  }
}
