/**
 * Subscription plans, prices and limits, with no runtime dependencies so the web
 * app can import them (`@auticare/contracts/plans`) without bundling zod.
 *
 * Free is the absence of a plan that grants access; Pro belongs to a parent and
 * Business to a school. Prices are confirmed. Everything the product spec marks
 * as an open decision (Free quotas, grace periods, refunds) is deliberately not
 * modelled here.
 */

export const subscriptionPlans = ['PRO', 'BUSINESS'] as const;
export type SubscriptionPlan = (typeof subscriptionPlans)[number];
export const billingIntervals = ['MONTHLY', 'YEARLY'] as const;
export type BillingInterval = (typeof billingIntervals)[number];
export const subscriptionStatuses = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];
export const sponsorshipStatuses = ['INVITED', 'ACTIVE', 'ENDED'] as const;
export type SponsorshipStatus = (typeof sponsorshipStatuses)[number];

/** Confirmed prices, in US cents. */
export const PLAN_PRICES_CENTS: Record<SubscriptionPlan, Record<BillingInterval, number>> = {
  PRO: { MONTHLY: 2000, YEARLY: 20000 },
  BUSINESS: { MONTHLY: 6000, YEARLY: 60000 },
};
/** Most child profiles a parent may keep while Pro is active. */
export const PRO_MAX_CHILDREN = 2;
/** Sponsored Pro family accounts a Business school includes. Not teacher seats. */
export const BUSINESS_SPONSORED_SLOTS = 5;
