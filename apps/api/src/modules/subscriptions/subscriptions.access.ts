import type { Subscription as SubscriptionDto } from '@auticare/contracts';
import type { Subscription } from '@prisma/client';

type AccessFields = Pick<Subscription, 'status' | 'currentPeriodEnd'>;

/**
 * Whether a subscription gives access at `now`.
 *
 * - ACTIVE gives access until its paid-through date (none set: open-ended).
 * - CANCELED keeps access until the paid-through date, then stops.
 * - PAST_DUE gives no access. A grace period is an open product decision, so
 *   none is assumed.
 * - EXPIRED never gives access.
 */
export const grantsAccess = (subscription: AccessFields, now = new Date()): boolean => {
  const end = subscription.currentPeriodEnd;
  if (subscription.status === 'ACTIVE') return !end || end > now;
  if (subscription.status === 'CANCELED') return !!end && end > now;
  return false;
};

/** ACTIVE and PAST_DUE are still running; a new plan must not be stacked on them. */
export const isOngoing = (subscription: AccessFields, now = new Date()): boolean =>
  subscription.status === 'ACTIVE' ||
  subscription.status === 'PAST_DUE' ||
  grantsAccess(subscription, now);

export const toSubscriptionDto = (row: Subscription, now = new Date()): SubscriptionDto => ({
  id: row.id,
  plan: row.plan,
  interval: row.interval,
  status: row.status,
  priceCents: row.priceCents,
  currency: row.currency,
  startedAt: row.startedAt.toISOString(),
  currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
  canceledAt: row.canceledAt ? row.canceledAt.toISOString() : null,
  provider: row.provider,
  grantsAccess: grantsAccess(row, now),
});

/** The subscription to show: the one granting access, else the most recent. */
export const pickCurrent = <T extends AccessFields>(rows: readonly T[], now = new Date()) =>
  rows.find((row) => grantsAccess(row, now)) ?? rows[0] ?? null;
