import type { Activity, ActivityProgress, Child } from '@prisma/client';
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
  listActivities(filters: { category?: string; ageMonths?: number }): Promise<Activity[]> {
    return prisma.activity.findMany({
      where: {
        ...(filters.category !== undefined ? { category: filters.category } : {}),
        ...(filters.ageMonths !== undefined
          ? {
              minAgeMonths: { lte: filters.ageMonths },
              maxAgeMonths: { gte: filters.ageMonths },
            }
          : {}),
      },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  }

  findActivityById(activityId: string): Promise<Activity | null> {
    return prisma.activity.findUnique({ where: { id: activityId } });
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
