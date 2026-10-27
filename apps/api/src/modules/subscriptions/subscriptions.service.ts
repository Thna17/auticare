import {
  BUSINESS_SPONSORED_SLOTS,
  PLAN_PRICES_CENTS,
  type AdminSubscription,
  type CreateAdminSubscriptionRequest,
  type ParentPlanResponse,
  type SchoolSponsorship,
  type SchoolSubscriptionResponse,
  type SubscriptionPlan,
  type SubscriptionStatus,
  type UpdateAdminSubscriptionRequest,
  type UserRole,
} from '@auticare/contracts';
import type { Prisma, Sponsorship } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { prisma } from '../../database/prisma.js';
import { auditService } from '../audit/audit.service.js';
import { EntitlementsService, lockSchool } from './entitlements.service.js';
import { isOngoing, pickCurrent, toSubscriptionDto } from './subscriptions.access.js';

type Actor = { parentId: string; role: UserRole };

const isUniqueViolation = (err: unknown) =>
  typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';

const conflict = (message: string) => new AppError('CONFLICT', message, 409);

const openKey = (schoolId: string, email: string) => `${schoolId}:${email}`;

/** A paid-through date is the end of the chosen day, in UTC. */
const endOfDay = (date: string): Date => new Date(`${date}T23:59:59.999Z`);

const toSchoolSponsorship = (row: Sponsorship): SchoolSponsorship => ({
  id: row.id,
  email: row.email,
  status: row.status,
  invitedAt: row.invitedAt.toISOString(),
  acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
  endedAt: row.endedAt ? row.endedAt.toISOString() : null,
  endedReason: row.endedReason,
});

/** The open-slot markers are cleared when a sponsorship ends. */
const endedData = (reason: string) => ({
  status: 'ENDED' as const,
  endedAt: new Date(),
  endedReason: reason,
  openKey: null,
  activeParentId: null,
});

/** Admin status changes that make sense; EXPIRED is final (record a new plan instead). */
const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  ACTIVE: ['PAST_DUE', 'CANCELED', 'EXPIRED'],
  PAST_DUE: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  CANCELED: ['ACTIVE', 'EXPIRED'],
  EXPIRED: [],
};

export class SubscriptionsService {
  constructor(private readonly entitlements = new EntitlementsService()) {}

  // --- Parent -------------------------------------------------------------

  private requireParent(actor: Actor) {
    if (actor.role !== 'PARENT') throw forbidden();
  }

  private async parentEmail(parentId: string) {
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      select: { email: true },
    });
    if (!parent) throw forbidden();
    return parent.email.toLowerCase();
  }

  async parentPlan(actor: Actor): Promise<ParentPlanResponse> {
    this.requireParent(actor);
    const now = new Date();
    const [ent, email, activeChildren] = await Promise.all([
      this.entitlements.forParent(actor.parentId, prisma, now),
      this.parentEmail(actor.parentId),
      prisma.child.count({ where: { parentId: actor.parentId, archivedAt: null } }),
    ]);
    const offers = await prisma.sponsorship.findMany({
      where: { email, status: 'INVITED' },
      include: { school: { select: { name: true } } },
      orderBy: { invitedAt: 'desc' },
    });
    const current = pickCurrent(ent.personal, now);
    return {
      plan: ent.isPro ? 'PRO' : 'FREE',
      source: ent.source,
      subscription: current ? toSubscriptionDto(current, now) : null,
      sponsorship: ent.sponsorship
        ? {
            id: ent.sponsorship.id,
            schoolName: ent.sponsorship.school.name,
            acceptedAt: ent.sponsorship.acceptedAt?.toISOString() ?? null,
            grantsAccess: ent.sponsorshipGrants,
          }
        : null,
      maxChildren: ent.maxChildren,
      activeChildren,
      offers: offers.map((offer) => ({
        id: offer.id,
        schoolName: offer.school.name,
        invitedAt: offer.invitedAt.toISOString(),
      })),
    };
  }

  /** The parent accepts a school's offer with their own account. */
  async acceptOffer(actor: Actor, sponsorshipId: string): Promise<ParentPlanResponse> {
    this.requireParent(actor);
    const email = await this.parentEmail(actor.parentId);
    const offer = await prisma.sponsorship.findFirst({
      where: { id: sponsorshipId, email, status: 'INVITED' },
    });
    if (!offer) throw notFound('This offer was not found or is no longer open.');
    if (!(await this.entitlements.isBusinessActive(offer.schoolId))) {
      throw conflict("This school's plan is not active right now, so the offer can't be used.");
    }
    try {
      const claimed = await prisma.sponsorship.updateMany({
        where: { id: offer.id, status: 'INVITED' },
        data: {
          status: 'ACTIVE',
          parentId: actor.parentId,
          activeParentId: actor.parentId,
          acceptedAt: new Date(),
        },
      });
      if (claimed.count === 0) throw notFound('This offer was not found or is no longer open.');
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          'You already have a sponsored Pro account. Leave it first to accept this one.',
        );
      }
      throw err;
    }
    await auditService.record({
      action: 'SPONSORSHIP_ACCEPTED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: offer.id,
      metadata: { schoolId: offer.schoolId },
    });
    return this.parentPlan(actor);
  }

  async declineOffer(actor: Actor, sponsorshipId: string): Promise<ParentPlanResponse> {
    this.requireParent(actor);
    const email = await this.parentEmail(actor.parentId);
    const ended = await prisma.sponsorship.updateMany({
      where: { id: sponsorshipId, email, status: 'INVITED' },
      data: endedData('DECLINED'),
    });
    if (ended.count === 0) throw notFound('This offer was not found or is no longer open.');
    await auditService.record({
      action: 'SPONSORSHIP_DECLINED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: sponsorshipId,
    });
    return this.parentPlan(actor);
  }

  /** The parent gives up their sponsored Pro account. Their data is untouched. */
  async leaveSponsorship(actor: Actor): Promise<ParentPlanResponse> {
    this.requireParent(actor);
    const current = await prisma.sponsorship.findUnique({
      where: { activeParentId: actor.parentId },
    });
    if (!current) throw notFound('You do not have a sponsored Pro account.');
    await prisma.sponsorship.update({ where: { id: current.id }, data: endedData('LEFT') });
    await auditService.record({
      action: 'SPONSORSHIP_LEFT',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: current.id,
      metadata: { schoolId: current.schoolId },
    });
    return this.parentPlan(actor);
  }

  // --- School admin -------------------------------------------------------

  /** Business and its sponsorships are managed by the school admin only. */
  private async requireSchoolAdmin(actor: Actor) {
    if (actor.role !== 'SCHOOL') throw forbidden();
    const staff = await prisma.schoolStaff.findFirst({
      where: { parentId: actor.parentId, deactivatedAt: null },
    });
    if (!staff) throw forbidden();
    if (staff.role !== 'ADMIN') throw forbidden('Only your school admin can do this.');
    return staff;
  }

  async schoolSubscription(actor: Actor): Promise<SchoolSubscriptionResponse> {
    const staff = await this.requireSchoolAdmin(actor);
    const now = new Date();
    const [subscriptions, sponsorships] = await Promise.all([
      this.entitlements.businessSubscriptions(staff.schoolId),
      prisma.sponsorship.findMany({
        where: { schoolId: staff.schoolId },
        orderBy: [{ status: 'asc' }, { invitedAt: 'desc' }],
      }),
    ]);
    const current = pickCurrent(subscriptions, now);
    const dto = current ? toSubscriptionDto(current, now) : null;
    return {
      subscription: dto,
      businessActive: dto?.grantsAccess ?? false,
      slotsTotal: BUSINESS_SPONSORED_SLOTS,
      slotsUsed: sponsorships.filter((row) => row.status !== 'ENDED').length,
      sponsorships: sponsorships.map(toSchoolSponsorship),
    };
  }

  /**
   * Offers one sponsored Pro account to a parent's email. The response is the
   * same whether or not an AutiCare account exists for that email, so the school
   * learns nothing about who is registered.
   */
  async inviteSponsorship(actor: Actor, email: string): Promise<SchoolSubscriptionResponse> {
    const staff = await this.requireSchoolAdmin(actor);
    const normalized = email.trim().toLowerCase();
    try {
      await prisma.$transaction(async (tx) => {
        await lockSchool(tx, staff.schoolId);
        const subscriptions = await this.entitlements.businessSubscriptions(staff.schoolId, tx);
        const current = pickCurrent(subscriptions);
        if (!current || !toSubscriptionDto(current).grantsAccess) {
          throw new AppError(
            'PLAN_LIMIT_REACHED',
            'Sponsored Pro accounts need an active Business plan.',
            403,
          );
        }
        const open = await tx.sponsorship.count({
          where: { schoolId: staff.schoolId, status: { in: ['INVITED', 'ACTIVE'] } },
        });
        if (open >= BUSINESS_SPONSORED_SLOTS) {
          throw new AppError(
            'PLAN_LIMIT_REACHED',
            `All ${BUSINESS_SPONSORED_SLOTS} sponsored Pro accounts are in use. Withdraw one first.`,
            403,
          );
        }
        await tx.sponsorship.create({
          data: {
            schoolId: staff.schoolId,
            subscriptionId: current.id,
            email: normalized,
            openKey: openKey(staff.schoolId, normalized),
            invitedById: actor.parentId,
          },
        });
      });
    } catch (err) {
      if (isUniqueViolation(err))
        throw conflict('This email already has an open offer from your school.');
      throw err;
    }

    // Tell the parent in the app if they already have an account. Nothing about
    // this reaches the school.
    const parent = await prisma.parent.findUnique({
      where: { email: normalized },
      select: { id: true, role: true },
    });
    if (parent?.role === 'PARENT') {
      const school = await prisma.school.findUnique({
        where: { id: staff.schoolId },
        select: { name: true },
      });
      await prisma.notification.create({
        data: {
          parentId: parent.id,
          type: 'SYSTEM',
          title: 'A school is offering you AutiCare Pro',
          body: `${school?.name ?? 'A school'} offered to sponsor a Pro account for you. Open Subscription to accept or decline. Accepting does not share your children's information with the school.`,
        },
      });
    }

    await auditService.record({
      action: 'SPONSORSHIP_INVITED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetEmail: normalized,
      metadata: { schoolId: staff.schoolId },
    });
    return this.schoolSubscription(actor);
  }

  /** The school withdraws an offer or ends a sponsorship. The parent keeps their data. */
  async withdrawSponsorship(
    actor: Actor,
    sponsorshipId: string,
  ): Promise<SchoolSubscriptionResponse> {
    const staff = await this.requireSchoolAdmin(actor);
    const ended = await prisma.sponsorship.updateMany({
      where: { id: sponsorshipId, schoolId: staff.schoolId, status: { in: ['INVITED', 'ACTIVE'] } },
      data: endedData('WITHDRAWN'),
    });
    if (ended.count === 0)
      throw notFound('This sponsored account was not found or has already ended.');
    await auditService.record({
      action: 'SPONSORSHIP_WITHDRAWN',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: sponsorshipId,
      metadata: { schoolId: staff.schoolId },
    });
    return this.schoolSubscription(actor);
  }

  // --- Platform admin -----------------------------------------------------

  private requireAdmin(actor: Actor) {
    if (actor.role !== 'ADMIN') throw forbidden();
  }

  private async toAdminSubscription(id: string): Promise<AdminSubscription> {
    const row = await prisma.subscription.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, firstName: true, lastName: true, email: true } },
        school: { select: { id: true, name: true, email: true } },
      },
    });
    if (!row) throw notFound('Subscription was not found.');
    return this.mapAdmin(row);
  }

  private mapAdmin(
    row: Prisma.SubscriptionGetPayload<{
      include: {
        parent: { select: { id: true; firstName: true; lastName: true; email: true } };
        school: { select: { id: true; name: true; email: true } };
      };
    }>,
  ): AdminSubscription {
    const owner = row.parent
      ? {
          type: 'PARENT' as const,
          id: row.parent.id,
          name: `${row.parent.firstName} ${row.parent.lastName}`.trim(),
          email: row.parent.email,
        }
      : {
          type: 'SCHOOL' as const,
          id: row.school?.id ?? '',
          name: row.school?.name ?? 'Unknown school',
          email: row.school?.email ?? null,
        };
    return { ...toSubscriptionDto(row), owner, note: row.note };
  }

  async adminList(
    actor: Actor,
    filters: { plan?: SubscriptionPlan | undefined },
  ): Promise<AdminSubscription[]> {
    this.requireAdmin(actor);
    const rows = await prisma.subscription.findMany({
      ...(filters.plan ? { where: { plan: filters.plan } } : {}),
      include: {
        parent: { select: { id: true, firstName: true, lastName: true, email: true } },
        school: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((row) => this.mapAdmin(row));
  }

  /**
   * Records a plan by hand. This stands in for a payment provider until one is
   * chosen; the price stored is the confirmed list price for the plan.
   */
  async adminCreate(
    actor: Actor,
    input: CreateAdminSubscriptionRequest,
  ): Promise<AdminSubscription> {
    this.requireAdmin(actor);
    const periodEnd = input.currentPeriodEnd ? endOfDay(input.currentPeriodEnd) : null;
    if (periodEnd && periodEnd <= new Date()) {
      throw new AppError('VALIDATION_ERROR', 'The paid-through date must be in the future.', 400);
    }

    let owner: { parentId: string } | { schoolId: string };
    if (input.plan === 'PRO') {
      const parent = await prisma.parent.findUnique({
        where: { email: input.parentEmail ?? '' },
        select: { id: true, role: true },
      });
      if (!parent || parent.role !== 'PARENT') {
        throw notFound('No parent account uses this email.');
      }
      owner = { parentId: parent.id };
    } else {
      const school = await prisma.school.findUnique({
        where: { id: input.schoolId ?? '' },
        select: { id: true },
      });
      if (!school) throw notFound('School was not found.');
      owner = { schoolId: school.id };
    }

    const existing = await prisma.subscription.findMany({ where: { ...owner, plan: input.plan } });
    if (existing.some((row) => isOngoing(row))) {
      throw conflict('This account already has a running plan. Change its status first.');
    }

    const created = await prisma.subscription.create({
      data: {
        ...owner,
        plan: input.plan,
        interval: input.interval,
        priceCents: PLAN_PRICES_CENTS[input.plan][input.interval],
        currentPeriodEnd: periodEnd,
        note: input.note?.trim() || null,
        createdById: actor.parentId,
      },
    });
    await auditService.record({
      action: 'SUBSCRIPTION_CREATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: created.id,
      metadata: { plan: input.plan, interval: input.interval, ...owner },
    });
    return this.toAdminSubscription(created.id);
  }

  /** Changes status. Ending a plan never deletes records; it only stops access. */
  async adminUpdate(
    actor: Actor,
    id: string,
    input: UpdateAdminSubscriptionRequest,
  ): Promise<AdminSubscription> {
    this.requireAdmin(actor);
    const row = await prisma.subscription.findUnique({ where: { id } });
    if (!row) throw notFound('Subscription was not found.');
    if (input.status !== row.status && !ALLOWED_TRANSITIONS[row.status].includes(input.status)) {
      throw new AppError(
        'VALIDATION_ERROR',
        `A ${row.status} plan cannot be changed to ${input.status}.`,
        400,
      );
    }
    if (row.status === 'CANCELED' && input.status === 'ACTIVE') {
      const others = await prisma.subscription.findMany({
        where: {
          id: { not: row.id },
          plan: row.plan,
          ...(row.parentId ? { parentId: row.parentId } : { schoolId: row.schoolId }),
        },
      });
      if (others.some((other) => isOngoing(other))) {
        throw conflict('This account already has another running plan.');
      }
    }
    const periodEnd =
      input.currentPeriodEnd === undefined
        ? undefined
        : input.currentPeriodEnd === null
          ? null
          : endOfDay(input.currentPeriodEnd);
    if (input.status === 'CANCELED' && !(periodEnd ?? row.currentPeriodEnd)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'A canceled plan needs a paid-through date. Set one, or mark it expired.',
        400,
      );
    }
    await prisma.subscription.update({
      where: { id },
      data: {
        status: input.status,
        ...(periodEnd !== undefined ? { currentPeriodEnd: periodEnd } : {}),
        ...(input.status === 'CANCELED' && row.status !== 'CANCELED'
          ? { canceledAt: new Date() }
          : {}),
        ...(input.status === 'ACTIVE' ? { canceledAt: null } : {}),
      },
    });
    await auditService.record({
      action: 'SUBSCRIPTION_UPDATED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: id,
      metadata: { from: row.status, to: input.status },
    });
    return this.toAdminSubscription(id);
  }
}
