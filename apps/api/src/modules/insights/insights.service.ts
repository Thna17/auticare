import type { ChildInsightResponse, UserRole } from '@auticare/contracts';
import { forbidden, notFound } from '../../common/errors/app-error.js';
import { logger } from '../../config/logger.js';
import { ANALYSIS_VERSION, analyzeObservations } from './insights.patterns.js';
import { InsightsRepository } from './insights.repository.js';

type Actor = { parentId: string; role: UserRole };

const DAY_MS = 86_400_000;
const DEFAULT_DAYS = 28;
const MIN_DAYS = 7;
const MAX_DAYS = 120;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** End of today in UTC — the cache key must not change every second. */
const windowEndFor = (now: Date): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY_MS);

export class InsightsService {
  constructor(private readonly repository = new InsightsRepository()) {}

  /**
   * Patterns for one child over a window.
   *
   * The same window is analysed against the preceding window, so "has this
   * reduced?" is answered by data rather than by the parent's memory. The result
   * is snapshotted for audit; the snapshot is never used to answer a later
   * request, because a cache that outlives a new observation would show a parent
   * a pattern they have already disproved.
   */
  async forChild(
    actor: Actor,
    childId: string,
    query: { days?: number; tzOffset?: number },
  ): Promise<ChildInsightResponse> {
    if (actor.role !== 'PARENT') throw forbidden();

    const child = await this.repository.findChild(childId);
    if (!child || child.parentId !== actor.parentId) {
      throw notFound('Child profile was not found.');
    }

    const days = clamp(query.days ?? DEFAULT_DAYS, MIN_DAYS, MAX_DAYS);
    // Minutes east of UTC, as sent by the browser. Bounded so a bad client cannot
    // shift a child's records into an arbitrary day.
    const tzOffsetMinutes = clamp(query.tzOffset ?? 0, -720, 840);

    const windowEnd = windowEndFor(new Date());
    const windowStart = new Date(windowEnd.getTime() - days * DAY_MS);
    const previousStart = new Date(windowStart.getTime() - days * DAY_MS);

    const [rows, previousRows] = await Promise.all([
      this.repository.listObservations(childId, windowStart, windowEnd),
      this.repository.listObservations(childId, previousStart, windowStart),
    ]);

    const analysis = analyzeObservations({ rows, previousRows, tzOffsetMinutes });

    try {
      await this.repository.saveInsight({
        childId,
        windowStart,
        windowEnd,
        summary: analysis.summary,
        patterns: analysis.patterns,
        analysisVersion: ANALYSIS_VERSION,
      });
    } catch (error) {
      // A bookkeeping failure must not cost the parent their analysis.
      logger.warn({ err: error }, 'Could not persist the insight snapshot');
    }

    return {
      childId,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      observationCount: analysis.observationCount,
      distinctDays: analysis.distinctDays,
      patterns: analysis.patterns,
      summary: analysis.summary,
      analysisVersion: ANALYSIS_VERSION,
      generatedAt: new Date().toISOString(),
    };
  }
}
