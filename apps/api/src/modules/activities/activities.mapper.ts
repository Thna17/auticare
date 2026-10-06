import type { Activity } from '@prisma/client';
import type { ActivityProgressResponse, ActivityResponse } from '@auticare/contracts';
import type { ActivityProgressWithActivity } from './activities.repository.js';

export const toActivityResponse = (activity: Activity): ActivityResponse => ({
  id: activity.id,
  title: activity.title,
  category: activity.category,
  minAgeMonths: activity.minAgeMonths,
  maxAgeMonths: activity.maxAgeMonths,
  summary: activity.summary,
});

export const toActivityProgressResponse = (
  progress: ActivityProgressWithActivity,
): ActivityProgressResponse => ({
  id: progress.id,
  childId: progress.childId,
  activityId: progress.activityId,
  // Denormalised so a progress list can render without a second catalogue fetch.
  activityTitle: progress.activity.title,
  startedAt: progress.startedAt.toISOString(),
  completedAt: progress.completedAt?.toISOString() ?? null,
  parentObservation: progress.parentObservation,
});
