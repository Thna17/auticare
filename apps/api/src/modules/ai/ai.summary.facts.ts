import type { ChildInsightResponse, ObservationPattern } from '@auticare/contracts';
import { createHash } from 'node:crypto';

/**
 * The facts a summary is allowed to describe.
 *
 * Built in TypeScript from the deterministic insights engine, then handed to the
 * model as the *only* material it may write about. Nothing here comes from a
 * parent's free-text note, so a name, a school or a detail they typed once cannot
 * reach the provider by accident — and the model has no room to invent a pattern
 * that the numbers do not show.
 */
export type SummaryFacts = {
  ageMonths: number;
  windowDays: number;
  observationCount: number;
  distinctDays: number;
  patterns: {
    area: string;
    records: number;
    sharePercent: number;
    trend: ObservationPattern['trend'];
    timeOfDay: ObservationPattern['timeOfDay'];
  }[];
};

/** Plain wording for each recorded category; the enum names are not parent-facing. */
const AREA_LABELS: Readonly<Record<string, string>> = {
  CRYING: 'crying and distress',
  EMOTIONAL: 'big feelings and meltdowns',
  SLEEP: 'sleep',
  EATING: 'eating',
  SENSORY: 'sensory reactions',
  SOCIAL: 'social interaction',
  ROUTINE: 'routine and changes',
  COMMUNICATION: 'communication',
  OTHER: 'other observations',
};

const areaLabel = (category: string): string => AREA_LABELS[category] ?? category.toLowerCase();

export const buildSummaryFacts = (input: {
  ageMonths: number;
  windowDays: number;
  insight: ChildInsightResponse;
}): SummaryFacts => ({
  ageMonths: input.ageMonths,
  windowDays: input.windowDays,
  observationCount: input.insight.observationCount,
  distinctDays: input.insight.distinctDays,
  patterns: input.insight.patterns.map((pattern) => ({
    area: areaLabel(pattern.category),
    records: pattern.count,
    sharePercent: Math.round(pattern.share * 100),
    trend: pattern.trend,
    timeOfDay: pattern.timeOfDay,
  })),
});

/**
 * Fingerprint of the facts. Identical hash plus identical language means the
 * stored text still describes the current records, so it is served again instead
 * of paying the provider to paraphrase the same numbers.
 */
export const factsHash = (facts: SummaryFacts): string =>
  createHash('sha256').update(JSON.stringify(facts)).digest('hex');

/** Whole months lived, so the model is told an age rather than a birth date. */
export const ageInMonths = (dateOfBirth: Date, at: Date = new Date()): number => {
  let months =
    (at.getUTCFullYear() - dateOfBirth.getUTCFullYear()) * 12 +
    (at.getUTCMonth() - dateOfBirth.getUTCMonth());
  if (at.getUTCDate() < dateOfBirth.getUTCDate()) months -= 1;
  return Math.max(months, 0);
};
