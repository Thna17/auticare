import type { Activity, ActivityFavorite, ActivityProgress, Child } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { CHILD_NOT_ARCHIVED } from '../../database/active-child.js';

export type ActivityProgressWithActivity = ActivityProgress & { activity: Activity };

export class ActivitiesRepository {
  /**
   * The child, only if the parent owns it and has not archived it. Returning null
   * for an archived child keeps activities consistent with the rest of the app,
   * where an archived child has left the active roster.
   */
  findOwnedChild(childId: string, parentId: string): Promise<Child | null> {
    return prisma.child.findFirst({ where: { id: childId, parentId, ...CHILD_NOT_ARCHIVED } });
  }

  /**
   * Catalogue entries, optionally narrowed to a category and to those whose age
   * range covers `ageMonths`. The composite index on
   * (category, minAgeMonths, maxAgeMonths) covers this.
   */
  listActivities(filters: {
    category?: string | undefined;
    learningGoal?: string | undefined;
    ageMonths?: number | undefined;
    minAgeMonths?: number | undefined;
    maxAgeMonths?: number | undefined;
    activityIds?: string[] | undefined;
  }): Promise<Activity[]> {
    const cat = filters.category ?? filters.learningGoal;
    return prisma.activity.findMany({
      where: {
        // Drafts and archived activities are the admin's, never shown to families.
        status: 'PUBLISHED',
        ...(cat !== undefined ? { category: cat } : {}),
        ...(filters.activityIds ? { id: { in: filters.activityIds } } : {}),
        ...(filters.ageMonths !== undefined
          ? {
              minAgeMonths: { lte: filters.ageMonths },
              maxAgeMonths: { gte: filters.ageMonths },
            }
          : {}),
        ...(filters.minAgeMonths !== undefined
          ? { maxAgeMonths: { gte: filters.minAgeMonths } }
          : {}),
        ...(filters.maxAgeMonths !== undefined
          ? { minAgeMonths: { lte: filters.maxAgeMonths } }
          : {}),
      },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  }

  findActivityById(activityId: string): Promise<Activity | null> {
    return prisma.activity.findFirst({ where: { id: activityId, status: 'PUBLISHED' } });
  }

  findFavorite(parentId: string, activityId: string): Promise<ActivityFavorite | null> {
    return prisma.activityFavorite.findUnique({
      where: { parentId_activityId: { parentId, activityId } },
    });
  }

  addFavorite(parentId: string, activityId: string): Promise<ActivityFavorite> {
    return prisma.activityFavorite.create({
      data: { parentId, activityId },
    });
  }

  removeFavorite(parentId: string, activityId: string): Promise<ActivityFavorite> {
    return prisma.activityFavorite.delete({
      where: { parentId_activityId: { parentId, activityId } },
    });
  }

  listFavoriteActivityIds(parentId: string): Promise<{ activityId: string }[]> {
    return prisma.activityFavorite.findMany({
      where: { parentId },
      select: { activityId: true },
    });
  }

  listProgressForChild(childId: string): Promise<ActivityProgressWithActivity[]> {
    return prisma.activityProgress.findMany({
      where: { childId },
      include: { activity: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  findProgressForChildAndActivity(
    childId: string,
    activityId: string,
  ): Promise<ActivityProgress | null> {
    return prisma.activityProgress.findFirst({ where: { childId, activityId } });
  }

  findProgressById(progressId: string): Promise<ActivityProgressWithActivity | null> {
    return prisma.activityProgress.findUnique({
      where: { id: progressId },
      include: { activity: true },
    });
  }

  createProgress(input: {
    childId: string;
    activityId: string;
  }): Promise<ActivityProgressWithActivity> {
    return prisma.activityProgress.create({ data: input, include: { activity: true } });
  }

  async upsertProgress(input: {
    childId: string;
    activityId: string;
  }): Promise<ActivityProgressWithActivity> {
    try {
      return await prisma.activityProgress.upsert({
        where: {
          childId_activityId: {
            childId: input.childId,
            activityId: input.activityId,
          },
        },
        create: input,
        update: {},
        include: { activity: true },
      });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
        const existing = await prisma.activityProgress.findUnique({
          where: {
            childId_activityId: {
              childId: input.childId,
              activityId: input.activityId,
            },
          },
          include: { activity: true },
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  updateProgress(
    progressId: string,
    data: { completedAt?: Date | null; parentObservation?: string | null },
  ): Promise<ActivityProgressWithActivity> {
    return prisma.activityProgress.update({
      where: { id: progressId },
      data,
      include: { activity: true },
    });
  }
}
