import type {
  InsightTimeBucket,
  InsightTrend,
  ObservationCategory,
  ObservationPattern,
} from '@auticare/contracts';

export type ObservationRow = {
  category: ObservationCategory;
  intensity: number;
  occurredAt: Date;
};

export type PatternAnalysis = {
  observationCount: number;
  distinctDays: number;
  patterns: ObservationPattern[];
  summary: string;
};

export const ANALYSIS_VERSION = 'patterns-v1';

const MIN_PATTERN_COUNT = 2;
const DOMINANT_SHARE = 0.35;
const CLUSTER_SHARE = 0.6;

/**
 * Shift a UTC instant into the parent's local wall-clock frame.
 *
 * Weekday and time-of-day clustering is only meaningful in the timezone the
 * family actually lives in — 2am in Phnom Penh is 7pm the previous evening in
 * UTC, which would put every night waking on the wrong day. The offset comes from
 * the caller rather than being assumed from the server's clock.
 */
const toLocal = (instant: Date, tzOffsetMinutes: number): Date =>
  new Date(instant.getTime() + tzOffsetMinutes * 60_000);

const localDayKey = (instant: Date, tzOffsetMinutes: number): string => {
  const local = toLocal(instant, tzOffsetMinutes);
  return `${local.getUTCFullYear()}-${local.getUTCMonth()}-${local.getUTCDate()}`;
};

const bucketForHour = (hour: number): InsightTimeBucket => {
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 22) return 'EVENING';
  return 'NIGHT';
};

const trendFor = (current: number, previous: number): InsightTrend => {
  if (previous === 0) return current >= MIN_PATTERN_COUNT ? 'NEW' : 'NONE';
  if (current >= previous + 2 && current > previous * 1.3) return 'INCREASED';
  if (previous >= current + 2 && current < previous * 0.7) return 'DECREASED';
  return 'STABLE';
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Counts and clusters, and nothing else.
 *
 * Deliberately no "because", no ranking of severity across categories, and no
 * comparison to other children: the output says what was recorded and when. That
 * is the difference between evidence a clinician can use and a verdict the app
 * has no standing to give.
 */
export const analyzeObservations = (input: {
  rows: readonly ObservationRow[];
  previousRows: readonly ObservationRow[];
  tzOffsetMinutes: number;
}): PatternAnalysis => {
  const { rows, previousRows, tzOffsetMinutes } = input;

  if (rows.length === 0) {
    return {
      observationCount: 0,
      distinctDays: 0,
      patterns: [],
      summary: 'No observations were recorded in this period.',
    };
  }

  const previousByCategory = new Map<ObservationCategory, number>();
  for (const row of previousRows) {
    previousByCategory.set(row.category, (previousByCategory.get(row.category) ?? 0) + 1);
  }

  const byCategory = new Map<
    ObservationCategory,
    { intensityTotal: number; rows: ObservationRow[] }
  >();
  for (const row of rows) {
    const bucket = byCategory.get(row.category);
    if (bucket) {
      bucket.intensityTotal += row.intensity;
      bucket.rows.push(row);
    } else {
      byCategory.set(row.category, { intensityTotal: row.intensity, rows: [row] });
    }
  }

  const patterns: ObservationPattern[] = [...byCategory.entries()]
    .map(([category, bucket]) => {
      const count = bucket.rows.length;
      let weekdayCount = 0;
      let weekendCount = 0;
      const timeCounts = new Map<InsightTimeBucket, number>();

      for (const row of bucket.rows) {
        const local = toLocal(row.occurredAt, tzOffsetMinutes);
        const day = local.getUTCDay();
        if (day === 0 || day === 6) weekendCount += 1;
        else weekdayCount += 1;

        const timeBucket = bucketForHour(local.getUTCHours());
        timeCounts.set(timeBucket, (timeCounts.get(timeBucket) ?? 0) + 1);
      }

      const [topTime] = [...timeCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
      const timeOfDay =
        topTime !== null && (timeCounts.get(topTime) ?? 0) / count >= CLUSTER_SHARE
          ? topTime
          : null;

      return {
        category,
        count,
        share: Math.round((count / rows.length) * 100) / 100,
        averageIntensity: round1(bucket.intensityTotal / count),
        trend: trendFor(count, previousByCategory.get(category) ?? 0),
        weekdayCount,
        weekendCount,
        timeOfDay,
      };
    })
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  const distinctDays = new Set(rows.map((row) => localDayKey(row.occurredAt, tzOffsetMinutes)))
    .size;

  return {
    observationCount: rows.length,
    distinctDays,
    patterns,
    summary: buildSummary(patterns, rows.length, distinctDays),
  };
};

/** Plain English, for audit and for anyone reading the stored row directly. */
const buildSummary = (
  patterns: readonly ObservationPattern[],
  observationCount: number,
  distinctDays: number,
): string => {
  const parts: string[] = [
    `${observationCount} observation(s) on ${distinctDays} day(s) in this period.`,
  ];

  const dominant = patterns[0];
  if (dominant && dominant.count >= MIN_PATTERN_COUNT && dominant.share >= DOMINANT_SHARE) {
    parts.push(
      `${dominant.category} is the most recorded (${dominant.count}, ${Math.round(dominant.share * 100)}% of all entries).`,
    );
  }

  for (const pattern of patterns) {
    if (pattern.count < MIN_PATTERN_COUNT) continue;
    if (pattern.weekdayCount / pattern.count >= CLUSTER_SHARE) {
      parts.push(
        `${pattern.category} clusters on weekdays (${pattern.weekdayCount} of ${pattern.count}).`,
      );
    } else if (pattern.weekendCount / pattern.count >= CLUSTER_SHARE) {
      parts.push(
        `${pattern.category} clusters on weekends (${pattern.weekendCount} of ${pattern.count}).`,
      );
    }
    if (pattern.timeOfDay) {
      parts.push(
        `${pattern.category} is most often recorded in the ${pattern.timeOfDay.toLowerCase()}.`,
      );
    }
    if (pattern.trend === 'DECREASED') parts.push(`${pattern.category} has reduced.`);
    if (pattern.trend === 'INCREASED') parts.push(`${pattern.category} has increased.`);
  }

  return parts.join(' ');
};
