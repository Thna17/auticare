import type { BillingInterval, Subscription, SubscriptionStatus } from '@auticare/contracts';

export const errorMessage = (err: unknown, fallback: string): string =>
  (err as { error?: { error?: { message?: string } } })?.error?.error?.message ?? fallback;

/** "$20 / month", "$200 / year". */
export const formatPrice = (cents: number, interval: BillingInterval): string =>
  `$${(cents / 100).toLocaleString('en-US')} / ${interval === 'MONTHLY' ? 'month' : 'year'}`;

export const formatDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '—';

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  PAST_DUE: 'Payment overdue',
  CANCELED: 'Canceled',
  EXPIRED: 'Expired',
};

/** One line describing when access ends, if it does. */
export const accessLine = (subscription: Subscription): string => {
  const end = subscription.currentPeriodEnd;
  if (subscription.status === 'CANCELED') {
    return subscription.grantsAccess
      ? `Canceled — access continues until ${formatDate(end)}.`
      : `Canceled — access ended ${formatDate(end)}.`;
  }
  if (subscription.status === 'ACTIVE') {
    if (!end) return 'Active, with no end date set.';
    return subscription.grantsAccess
      ? `Paid through ${formatDate(end)}.`
      : `The paid-through date (${formatDate(end)}) has passed.`;
  }
  if (subscription.status === 'PAST_DUE') return 'Payment is overdue, so the plan is paused.';
  return 'This plan has ended. Nothing was deleted.';
};
