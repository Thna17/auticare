import type { AiSummary } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import type { UsageRow } from './ai.pricing.js';

export class AiSummaryRepository {
  /** Ownership data only; the caller decides, and a miss must look like a 404. */
  findChild(childId: string): Promise<{ id: string; parentId: string; dateOfBirth: Date } | null> {
    return prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, parentId: true, dateOfBirth: true },
    });
  }

  /** The newest summary in a language, whatever data it was written from. */
  findLatest(childId: string, language: string): Promise<AiSummary | null> {
    return prisma.aiSummary.findFirst({
      where: { childId, language },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * A stored summary written from exactly these facts, if there is one.
   *
   * Matched on the fact fingerprint rather than on the calendar window: a window
   * that rolls forward every night would otherwise force a new generation each
   * morning even when the parent has recorded nothing new.
   */
  findMatching(childId: string, language: string, factsHash: string): Promise<AiSummary | null> {
    return prisma.aiSummary.findFirst({
      where: { childId, language, factsHash },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: {
    childId: string;
    language: string;
    windowDays: number;
    windowStart: Date;
    windowEnd: Date;
    factsHash: string;
    content: string;
    model: string;
    promptVersion: string;
    tokensIn?: number | null;
    tokensOut?: number | null;
  }): Promise<AiSummary> {
    return prisma.aiSummary.create({ data: input });
  }

  /** Generated summaries that reached a provider, for the daily budget. */
  providerUsageSince(since: Date): Promise<UsageRow[]> {
    return prisma.aiSummary.findMany({
      where: { createdAt: { gte: since }, tokensIn: { not: null } },
      select: { model: true, tokensIn: true, tokensOut: true },
    });
  }
}
