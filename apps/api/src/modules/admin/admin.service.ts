import {
  BUSINESS_SPONSORED_SLOTS,
  type AdminAuditEvent,
  type AdminAuditList,
  type AdminAuditQuery,
  type AdminListQuery,
  type AdminOverview,
  type AdminParent,
  type AdminParentList,
  type AdminSchool,
  type AdminSchoolList,
  type AdminSponsorshipSchool,
  type AdminStaff,
  type AdminStaffList,
  type UpdateAdminSchoolRequest,
  type UserRole,
} from '@auticare/contracts';
import type { AuditEvent, Prisma } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { aiClient } from '../ai/ai.client.js';
import { prisma } from '../../database/prisma.js';
import { auditService } from '../audit/audit.service.js';
import { isStaffPlaceholderEmail } from '../auth/staff-usernames.js';
import { grantsAccess } from '../subscriptions/subscriptions.access.js';

type Actor = { parentId: string; role: UserRole };

const DAY_MS = 24 * 60 * 60 * 1000;

const page = (query: AdminListQuery) => ({
  skip: (query.page - 1) * query.pageSize,
  take: query.pageSize,
});

/** Which of these schools have a Business plan that grants access right now. */
const activeBusinessSchools = async (schoolIds: readonly string[], now = new Date()) => {
  if (schoolIds.length === 0) return new Set<string>();
  const rows = await prisma.subscription.findMany({
    where: { plan: 'BUSINESS', schoolId: { in: [...schoolIds] } },
    select: { schoolId: true, status: true, currentPeriodEnd: true },
  });
  return new Set(rows.filter((row) => grantsAccess(row, now)).map((row) => row.schoolId as string));
};

/**
 * The platform admin's management views. Every method checks the role itself,
 * so the routes' `requireRole('ADMIN')` is a second line, not the only one.
 * Nothing here returns a child's details; parents show a child count only.
 */
export class AdminService {
  private requireAdmin(actor: Actor) {
    if (actor.role !== 'ADMIN') throw forbidden();
  }

  // --- Overview -----------------------------------------------------------

  async overview(actor: Actor): Promise<AdminOverview> {
    this.requireAdmin(actor);
    const now = new Date();
    const [
      parentsTotal,
      new7d,
      new30d,
      schoolsActive,
      schoolsSuspended,
      schoolRequests,
      hospitalRequests,
      teacherSetups,
      subscriptions,
      sponsoredActive,
      suspendedAccounts,
      recent,
    ] = await Promise.all([
      prisma.parent.count({ where: { role: 'PARENT' } }),
      prisma.parent.count({
        where: { role: 'PARENT', createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } },
      }),
      prisma.parent.count({
        where: { role: 'PARENT', createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } },
      }),
      prisma.school.count({ where: { status: 'ACTIVE' } }),
      prisma.school.count({ where: { status: 'INACTIVE' } }),
      prisma.schoolRegistrationRequest.count({ where: { status: 'PENDING' } }),
      prisma.hospitalRegistrationRequest.count({ where: { status: 'PENDING' } }),
      prisma.schoolStaff.count({
        where: { deactivatedAt: null, parent: { mustResetPassword: true } },
      }),
      prisma.subscription.findMany({
        where: { status: { in: ['ACTIVE', 'CANCELED', 'PAST_DUE'] } },
        select: { plan: true, status: true, currentPeriodEnd: true },
      }),
      prisma.sponsorship.count({ where: { status: 'ACTIVE' } }),
      prisma.parent.count({ where: { suspendedAt: { not: null } } }),
      prisma.auditEvent.findMany({ take: 8, orderBy: { createdAt: 'desc' } }),
    ]);
    const live = subscriptions.filter((row) => grantsAccess(row, now));
    return {
      parents: { total: parentsTotal, new7d, new30d },
      schools: { active: schoolsActive, suspended: schoolsSuspended },
      pending: { schoolRequests, hospitalRequests, teacherSetups },
      subscriptions: {
        pro: live.filter((row) => row.plan === 'PRO').length,
        business: live.filter((row) => row.plan === 'BUSINESS').length,
        sponsoredActive,
        pastDue: subscriptions.filter((row) => row.status === 'PAST_DUE').length,
      },
      suspendedAccounts,
      aiConfigured: aiClient.configured,
      recentActivity: await this.withActorEmails(recent),
    };
  }

  // --- Parents & families -------------------------------------------------

  async listParents(
    actor: Actor,
    query: AdminListQuery & { status?: 'ACTIVE' | 'SUSPENDED' | undefined },
  ): Promise<AdminParentList> {
    this.requireAdmin(actor);
    const where: Prisma.ParentWhereInput = {
      role: 'PARENT',
      ...(query.status === 'SUSPENDED' ? { suspendedAt: { not: null } } : {}),
      ...(query.status === 'ACTIVE' ? { suspendedAt: null } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search } },
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.parent.count({ where }),
      prisma.parent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...page(query),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          suspendedAt: true,
          suspendedReason: true,
          _count: { select: { children: { where: { archivedAt: null } } } },
        },
      }),
    ]);

    // Plans in bulk: personal Pro, or an active sponsorship from a school whose
    // Business plan is live.
    const ids = rows.map((row) => row.id);
    const now = new Date();
    const [personal, sponsorships] = await Promise.all([
      prisma.subscription.findMany({
        where: { plan: 'PRO', parentId: { in: ids } },
        select: { parentId: true, status: true, currentPeriodEnd: true },
      }),
      prisma.sponsorship.findMany({
        where: { activeParentId: { in: ids } },
        select: { activeParentId: true, schoolId: true },
      }),
    ]);
    const liveSchools = await activeBusinessSchools(
      sponsorships.map((row) => row.schoolId),
      now,
    );
    const pro = new Set<string>([
      ...personal.filter((row) => grantsAccess(row, now)).map((row) => row.parentId as string),
      ...sponsorships
        .filter((row) => liveSchools.has(row.schoolId))
        .map((row) => row.activeParentId as string),
    ]);

    const items: AdminParent[] = rows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      createdAt: row.createdAt.toISOString(),
      status: row.suspendedAt ? 'SUSPENDED' : 'ACTIVE',
      suspendedReason: row.suspendedReason,
      plan: pro.has(row.id) ? 'PRO' : 'FREE',
      childCount: row._count.children,
    }));
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  // --- Suspension (any non-admin account) ---------------------------------

  /**
   * Suspends a parent, teacher, school or hospital account. The account keeps
   * all its data; it simply cannot sign in until reactivated. Admin accounts
   * are managed elsewhere and cannot be suspended here.
   */
  async suspendAccount(actor: Actor, accountId: string, reason: string) {
    this.requireAdmin(actor);
    const account = await prisma.parent.findUnique({
      where: { id: accountId },
      select: { id: true, role: true, email: true, suspendedAt: true },
    });
    if (!account) throw notFound('Account was not found.');
    if (account.role === 'ADMIN') {
      throw new AppError(
        'VALIDATION_ERROR',
        'Administrator accounts cannot be suspended here.',
        400,
      );
    }
    if (account.suspendedAt) return { suspended: true };
    const now = new Date();
    await prisma.$transaction([
      prisma.parent.update({
        where: { id: account.id },
        data: { suspendedAt: now, suspendedReason: reason.trim() },
      }),
      // Signs the account out everywhere; the short-lived access token runs out
      // on its own within minutes.
      prisma.refreshToken.updateMany({
        where: { parentId: account.id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    await auditService.record({
      action: 'ACCOUNT_SUSPENDED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: account.id,
      targetEmail: isStaffPlaceholderEmail(account.email) ? null : account.email,
      metadata: { role: account.role, reason: reason.trim() },
    });
    return { suspended: true };
  }

  async reactivateAccount(actor: Actor, accountId: string) {
    this.requireAdmin(actor);
    const account = await prisma.parent.findUnique({
      where: { id: accountId },
      select: { id: true, role: true, email: true },
    });
    if (!account) throw notFound('Account was not found.');
    await prisma.parent.update({
      where: { id: account.id },
      data: { suspendedAt: null, suspendedReason: null },
    });
    await auditService.record({
      action: 'ACCOUNT_REACTIVATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: account.id,
      targetEmail: isStaffPlaceholderEmail(account.email) ? null : account.email,
      metadata: { role: account.role },
    });
    return { suspended: false };
  }

  // --- Schools & organizations --------------------------------------------

  async listSchools(
    actor: Actor,
    query: AdminListQuery & { status?: 'ACTIVE' | 'INACTIVE' | undefined },
  ): Promise<AdminSchoolList> {
    this.requireAdmin(actor);
    const where: Prisma.SchoolWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { OR: [{ name: { contains: query.search } }, { city: { contains: query.search } }] }
        : {}),
    };
    const [total, items] = await Promise.all([
      prisma.school.count({ where }),
      this.loadSchools(where, page(query)),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  private async loadSchools(
    where: Prisma.SchoolWhereInput,
    window: { skip: number; take: number },
  ): Promise<AdminSchool[]> {
    const rows = await prisma.school.findMany({
      where,
      orderBy: { name: 'asc' },
      ...window,
      include: {
        staff: {
          select: {
            role: true,
            deactivatedAt: true,
            parent: { select: { email: true } },
          },
        },
        _count: { select: { sponsorships: { where: { status: { in: ['INVITED', 'ACTIVE'] } } } } },
      },
    });
    const live = await activeBusinessSchools(rows.map((row) => row.id));
    return rows.map((row) => {
      const admin = row.staff.find((s) => s.role === 'ADMIN' && !s.deactivatedAt);
      return {
        id: row.id,
        name: row.name,
        city: row.city,
        status: row.status,
        isVerified: row.isVerified,
        businessActive: live.has(row.id),
        teacherCount: row.staff.filter((s) => s.role === 'TEACHER' && !s.deactivatedAt).length,
        sponsoredUsed: row._count.sponsorships,
        adminEmail:
          admin && !isStaffPlaceholderEmail(admin.parent.email) ? admin.parent.email : null,
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  /**
   * Verifies a school's directory listing, or suspends and restores its access.
   * Suspending hides the school from the directory and signs its staff out;
   * they cannot sign in again until the school is reactivated.
   */
  async updateSchool(actor: Actor, schoolId: string, input: UpdateAdminSchoolRequest) {
    this.requireAdmin(actor);
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw notFound('School was not found.');
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.school.update({
        where: { id: schoolId },
        data: {
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.isVerified !== undefined ? { isVerified: input.isVerified } : {}),
        },
      });
      if (input.status === 'INACTIVE' && school.status !== 'INACTIVE') {
        const staff = await tx.schoolStaff.findMany({
          where: { schoolId },
          select: { parentId: true },
        });
        await tx.refreshToken.updateMany({
          where: { parentId: { in: staff.map((s) => s.parentId) }, revokedAt: null },
          data: { revokedAt: now },
        });
      }
    });
    if (input.status !== undefined && input.status !== school.status) {
      await auditService.record({
        action: input.status === 'INACTIVE' ? 'SCHOOL_SUSPENDED' : 'SCHOOL_REACTIVATED',
        actorId: actor.parentId,
        actorRole: actor.role,
        targetId: schoolId,
        metadata: { schoolName: school.name, reason: input.reason?.trim() || null },
      });
    }
    if (input.isVerified !== undefined && input.isVerified !== school.isVerified) {
      await auditService.record({
        action: input.isVerified ? 'SCHOOL_VERIFIED' : 'SCHOOL_UNVERIFIED',
        actorId: actor.parentId,
        actorRole: actor.role,
        targetId: schoolId,
        metadata: { schoolName: school.name },
      });
    }
    const [updated] = await this.loadSchools({ id: schoolId }, { skip: 0, take: 1 });
    if (!updated) throw notFound('School was not found.');
    return updated;
  }

  // --- Teachers & staff ---------------------------------------------------

  async listStaff(
    actor: Actor,
    query: AdminListQuery & { schoolId?: string | undefined },
  ): Promise<AdminStaffList> {
    this.requireAdmin(actor);
    const where: Prisma.SchoolStaffWhereInput = {
      ...(query.schoolId ? { schoolId: query.schoolId } : {}),
      ...(query.search
        ? {
            OR: [
              { parent: { firstName: { contains: query.search } } },
              { parent: { lastName: { contains: query.search } } },
              { parent: { username: { contains: query.search } } },
              { parent: { email: { contains: query.search } } },
              { school: { name: { contains: query.search } } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.schoolStaff.count({ where }),
      prisma.schoolStaff.findMany({
        where,
        orderBy: [{ school: { name: 'asc' } }, { role: 'asc' }, { createdAt: 'asc' }],
        ...page(query),
        include: {
          school: { select: { id: true, name: true } },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              mustResetPassword: true,
              suspendedAt: true,
            },
          },
        },
      }),
    ]);
    const items: AdminStaff[] = rows.map((row) => ({
      id: row.id,
      accountId: row.parent.id,
      firstName: row.parent.firstName,
      lastName: row.parent.lastName,
      username: row.parent.username,
      email: isStaffPlaceholderEmail(row.parent.email) ? null : row.parent.email,
      schoolId: row.school.id,
      schoolName: row.school.name,
      role: row.role === 'ADMIN' ? 'ADMIN' : 'TEACHER',
      title: row.title,
      status: row.parent.suspendedAt
        ? 'SUSPENDED'
        : row.deactivatedAt
          ? 'DEACTIVATED'
          : row.parent.mustResetPassword
            ? 'SETUP_PENDING'
            : 'ACTIVE',
    }));
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  // --- Sponsored Pro accounts across schools ------------------------------

  async sponsorshipOverview(actor: Actor): Promise<AdminSponsorshipSchool[]> {
    this.requireAdmin(actor);
    const groups = await prisma.sponsorship.groupBy({
      by: ['schoolId', 'status'],
      _count: { _all: true },
    });
    const businessSchools = await prisma.subscription.findMany({
      where: { plan: 'BUSINESS', schoolId: { not: null } },
      select: { schoolId: true },
      distinct: ['schoolId'],
    });
    const schoolIds = [
      ...new Set([
        ...groups.map((g) => g.schoolId),
        ...businessSchools.map((row) => row.schoolId as string),
      ]),
    ];
    const [schools, live] = await Promise.all([
      prisma.school.findMany({
        where: { id: { in: schoolIds } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      activeBusinessSchools(schoolIds),
    ]);
    const count = (schoolId: string, status: 'INVITED' | 'ACTIVE' | 'ENDED') =>
      groups.find((g) => g.schoolId === schoolId && g.status === status)?._count._all ?? 0;
    return schools.map((school) => ({
      schoolId: school.id,
      schoolName: school.name,
      businessActive: live.has(school.id),
      slotsUsed: count(school.id, 'INVITED') + count(school.id, 'ACTIVE'),
      slotsTotal: BUSINESS_SPONSORED_SLOTS,
      invited: count(school.id, 'INVITED'),
      active: count(school.id, 'ACTIVE'),
      ended: count(school.id, 'ENDED'),
    }));
  }

  // --- Audit logs ---------------------------------------------------------

  async listAudit(actor: Actor, query: AdminAuditQuery): Promise<AdminAuditList> {
    this.requireAdmin(actor);
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;
    const where: Prisma.AuditEventWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(from || to
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
      ...(query.search
        ? { OR: [{ targetEmail: { contains: query.search } }, { targetId: query.search }] }
        : {}),
    };
    const [total, rows, actions] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({ where, orderBy: { createdAt: 'desc' }, ...page(query) }),
      prisma.auditEvent.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
    ]);
    return {
      items: await this.withActorEmails(rows),
      total,
      page: query.page,
      pageSize: query.pageSize,
      actions: actions.map((row) => row.action),
    };
  }

  private async withActorEmails(rows: AuditEvent[]): Promise<AdminAuditEvent[]> {
    const actorIds = [
      ...new Set(rows.map((row) => row.actorId).filter((id): id is string => !!id)),
    ];
    const actors = actorIds.length
      ? await prisma.parent.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, email: true, username: true },
        })
      : [];
    const label = new Map(
      actors.map((a) => [a.id, isStaffPlaceholderEmail(a.email) ? (a.username ?? null) : a.email]),
    );
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      actorEmail: row.actorId ? (label.get(row.actorId) ?? null) : null,
      actorRole: row.actorRole,
      targetId: row.targetId,
      targetEmail: row.targetEmail,
      metadata:
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : null,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
