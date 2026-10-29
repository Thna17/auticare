import { logger } from '../../config/logger.js';

/**
 * What a model call costs, so the installation can see and cap its own spend.
 *
 * Prices are per 1,000,000 tokens, in USD, from the vendor's published table
 * (checked 28 October 2026). Two deliberate choices:
 *
 * - PEAK rates are used for every estimate. Off-peak is half, so an estimate is
 *   an upper bound: a budget stop built on it can undershoot usage but can never
 *   let the installation quietly overspend.
 * - An unknown model costs `null`, not a guess. A made-up number on the admin
 *   dashboard is worse than a dash.
 *
 * The key is the model name the provider reports, which is what the adapter
 * stores on each answer.
 */
type PriceCard = {
  /** Input tokens that were not served from the provider's prompt cache. */
  inputPerMTok: number;
  /** Input tokens that hit the provider's prompt cache. */
  cachedInputPerMTok: number;
  outputPerMTok: number;
};

const PEAK_PRICING: Readonly<Record<string, PriceCard>> = {
  'deepseek-flash': { inputPerMTok: 0.3, cachedInputPerMTok: 0.006, outputPerMTok: 1.2 },
  'deepseek-v4-pro': { inputPerMTok: 1.32, cachedInputPerMTok: 0.044, outputPerMTok: 3.96 },
};

export type UsageRow = {
  model: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
};

const isKnownModel = (model: string): boolean => Object.hasOwn(PEAK_PRICING, model);

/**
 * Estimated cost of one or more calls, or null when any of them used a model
 * whose price is unknown (so the total cannot be stated honestly).
 *
 * Rows without usage numbers are skipped rather than counted as free: safety
 * replies and failures never reach a provider, so they genuinely cost nothing.
 */
export const estimateSpendUsd = (rows: readonly UsageRow[]): number | null => {
  let total = 0;
  let priced = false;

  for (const row of rows) {
    if (row.tokensIn === null && row.tokensOut === null) continue;
    if (!row.model) continue;
    const card = PEAK_PRICING[row.model];
    if (!card) return null;

    total +=
      ((row.tokensIn ?? 0) * card.inputPerMTok + (row.tokensOut ?? 0) * card.outputPerMTok) /
      1_000_000;
    priced = true;
  }

  return priced ? Number(total.toFixed(6)) : 0;
};

/**
 * Warns once per model per process when a model with no price card is used, so a
 * provider or model change cannot leave the budget unmonitored without anyone
 * noticing. Repeating it on every call would bury the message in the log.
 */
const warnedModels = new Set<string>();

export const warnOnceForUnpricedModel = (model: string | null): void => {
  if (!model || isKnownModel(model) || warnedModels.has(model)) return;
  warnedModels.add(model);
  logger.warn(
    { model },
    'AI model has no price card; cost estimates and the daily budget stop are disabled for it. Add it to ai.pricing.ts.',
  );
};
