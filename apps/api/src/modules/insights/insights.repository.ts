import type { AiInsight, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import type { ObservationRow } from './insights.patterns.js';

export class InsightsRepository {
  findChild(childId: string): Promise<{ id: string; parentId: string } | null> {
    return prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, parentId: true },
    });
  }

  listObservations(childId: string, from: Date, to: Date): Promise<ObservationRow[]> {
    return prisma.behaviorObservation.findMany({
      where: { childId, occurredAt: { gte: from, lt: to } },
      select: { category: true, intensity: true, occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    });
  }

  /**
   * Persist the analysis for its window.
   *
   * The row is a snapshot for audit and for anyone looking at the database, not a
   * cache the API trusts: it is recomputed on every request so a parent who
   * records something new sees it immediately rather than tomorrow.
   */
  saveInsight(input: {
    childId: string;
    windowStart: Date;
    windowEnd: Date;
    summary: string;
    patterns: Prisma.InputJsonValue;
    analysisVersion: string;
  }): Promise<AiInsight> {
    return prisma.aiInsight.upsert({
      where: {
        childId_windowStart_windowEnd: {
          childId: input.childId,
          windowStart: input.windowStart,
          windowEnd: input.windowEnd,
        },
      },
      create: input,
      update: {
        summary: input.summary,
        patterns: input.patterns,
        analysisVersion: input.analysisVersion,
      },
    });
  }
}
