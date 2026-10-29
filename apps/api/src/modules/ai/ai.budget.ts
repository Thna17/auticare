import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { estimateSpendUsd, warnOnceForUnpricedModel } from './ai.pricing.js';
import type { UsageRow } from './ai.pricing.js';

/** Anything that can report the day's provider usage — the AI repository, in practice. */
export type UsageSource = {
  providerUsageSince(since: Date): Promise<UsageRow[]>;
};

/**
 * One usage source made of several, so a feature that bills separately (the
 * summary writer keeps its own table) still counts against the same ceiling.
 */
export const combineUsage = (...sources: UsageSource[]): UsageSource => ({
  providerUsageSince: async (since) =>
    (await Promise.all(sources.map((source) => source.providerUsageSince(since)))).flat(),
});

/** Midnight UTC: the day boundary the budget resets on. */
export const startOfUtcDay = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Stops a new model call once the installation has spent its daily ceiling.
 *
 * Shared by the chat assistant and the summary writer so there is one spending
 * rule, not two that drift apart. Callers run this *after* anything the safety
 * layer can answer without a provider, because those calls cost nothing and a
 * parent in distress must never be told the assistant is out of budget.
 *
 * The estimate uses peak prices, so it errs high. A model with no price card
 * cannot be estimated at all: the guard steps aside and warns rather than
 * blocking every answer on a number it cannot compute.
 */
export const assertWithinDailyBudget = async (
  source: UsageSource,
  model: string | null,
): Promise<void> => {
  const budget = env.AI_DAILY_BUDGET_USD;
  if (budget <= 0) return;

  const spend = estimateSpendUsd(await source.providerUsageSince(startOfUtcDay()));
  if (spend === null) {
    warnOnceForUnpricedModel(model);
    return;
  }
  if (spend < budget) return;

  logger.warn({ spend, budget }, 'AI daily budget reached; refusing new model calls');
  throw new AppError(
    'RATE_LIMITED',
    'The assistant has answered as much as it can today. It starts again tomorrow, and everything else in AutiCare keeps working.',
    429,
  );
};
