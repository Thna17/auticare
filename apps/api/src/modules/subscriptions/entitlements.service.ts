import { PRO_MAX_CHILDREN } from '@auticare/contracts';
import type { Prisma, School, Sponsorship, Subscription } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { prisma } from '../../database/prisma.js';
import { grantsAccess } from './subscriptions.access.js';

type Db = Prisma.TransactionClient | typeof prisma;

export type ParentEntitlements = {
  isPro: boolean;
  source: 'PERSONAL' | 'SPONSORED' | null;
  personal: Subscription[];
  sponsorship: (Sponsorship & { school: School }) | null;
  sponsorshipGrants: boolean;
  /** Null when no limit applies. */
  maxChildren: number | null;
};

/**
 * The one place the server decides what a plan allows. Every protected action
 * asks here instead of trusting what the browser shows or hides.
 */
export class EntitlementsService {
  async businessSubscriptions(schoolId: string, db: Db = prisma) {
    return db.subscription.findMany({
      where: { schoolId, plan: 'BUSINESS' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isBusinessActive(schoolId: string, db: Db = prisma, now = new Date()) {
    const rows = await this.businessSubscriptions(schoolId, db);
    return rows.some((row) => grantsAccess(row, now));
  }

  async forParent(
    parentId: string,
    db: Db = prisma,
    now = new Date(),
  ): Promise<ParentEntitlements> {
    const [personal, sponsorship] = await Promise.all([
      db.subscription.findMany({
        where: { parentId, plan: 'PRO' },
        orderBy: { createdAt: 'desc' },
      }),
      db.sponsorship.findUnique({ where: { activeParentId: parentId }, include: { school: true } }),
    ]);
    const personalGrants = personal.some((row) => grantsAccess(row, now));
    // A sponsorship only counts while the sponsoring school's Business plan does.
    const sponsorshipGrants = sponsorship
      ? await this.isBusinessActive(sponsorship.schoolId, db, now)
      : false;
    const isPro = personalGrants || sponsorshipGrants;
    return {
      isPro,
      source: personalGrants ? 'PERSONAL' : sponsorshipGrants ? 'SPONSORED' : null,
      personal,
      sponsorship,
      sponsorshipGrants,
      maxChildren: isPro ? PRO_MAX_CHILDREN : (env.FREE_PLAN_CHILD_LIMIT ?? null),
    };
  }

  /**
   * Throws when one more active child profile would go over the plan's limit.
   * Callers run it inside a transaction that has locked the parent row, so two
   * requests at once cannot both slip under the limit.
   */
  async assertCanAddChild(parentId: string, db: Db): Promise<void> {
    const { isPro, maxChildren } = await this.forParent(parentId, db);
    if (maxChildren === null) return;
    const active = await db.child.count({ where: { parentId, archivedAt: null } });
    if (active < maxChildren) return;
    throw new AppError(
      'PLAN_LIMIT_REACHED',
      isPro
        ? `Pro includes up to ${maxChildren} child profiles. Archive one to add another.`
        : `The Free plan includes up to ${maxChildren} child profiles. Upgrade to Pro to add more.`,
      403,
    );
  }
}

/** Locks the parent row for the rest of the transaction (MySQL `FOR UPDATE`). */
export const lockParent = (db: Prisma.TransactionClient, parentId: string) =>
  db.$queryRaw`SELECT id FROM Parent WHERE id = ${parentId} FOR UPDATE`;

/** Locks the school row for the rest of the transaction (MySQL `FOR UPDATE`). */
export const lockSchool = (db: Prisma.TransactionClient, schoolId: string) =>
  db.$queryRaw`SELECT id FROM School WHERE id = ${schoolId} FOR UPDATE`;
