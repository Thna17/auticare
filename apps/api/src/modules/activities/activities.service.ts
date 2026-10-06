import type {
  ActivityProgressResponse,
  ActivityResponse,
  ListActivitiesQuery,
  UpdateActivityProgressRequest,
} from '@auticare/contracts';
import { forbidden, notFound } from '../../common/errors/app-error.js';
import { ActivitiesRepository } from './activities.repository.js';
import type { ActivityProgressWithActivity } from './activities.repository.js';
import { toActivityProgressResponse, toActivityResponse } from './activities.mapper.js';

type Actor = { parentId: string; role: string };

/**
 * Whole months lived, which is what Activity.minAgeMonths/maxAgeMonths measure.
 * Counts month boundaries rather than dividing days, so a child one day short of
 * their birthday is not rounded up into the next band.
 */
export const ageInMonths = (dateOfBirth: Date, at: Date = new Date()): number => {
  let months =
    (at.getUTCFullYear() - dateOfBirth.getUTCFullYear()) * 12 +
    (at.getUTCMonth() - dateOfBirth.getUTCMonth());
  if (at.getUTCDate() < dateOfBirth.getUTCDate()) months -= 1;
  return Math.max(months, 0);
};

export class ActivitiesService {
  constructor(private readonly repository = new ActivitiesRepository()) {}

  /**
   * Resolve a child the caller is allowed to act for. Every activity operation
   * goes through here, so ownership is checked in exactly one place.
   */
  private async requireOwnedChild(actor: Actor, childId: string) {
    if (actor.role !== 'PARENT') throw forbidden();
    const child = await this.repository.findOwnedChild(childId, actor.parentId);
    // notFound rather than forbidden: a 403 would confirm the child exists.
    if (!child) throw notFound('Child profile was not found.');
    return child;
  }

  /**
   * The catalogue. With a childId it is narrowed to that child's age in months,
   * which is the point of the feature — a parent should not have to work out
   * which entries suit their child.
   */
  async listActivities(actor: Actor, query: ListActivitiesQuery): Promise<ActivityResponse[]> {
    if (actor.role !== 'PARENT') throw forbidden();

    const filters: { category?: string; ageMonths?: number } = {};
    if (query.category !== undefined) filters.category = query.category;
    if (query.childId !== undefined) {
      const child = await this.requireOwnedChild(actor, query.childId);
      filters.ageMonths = ageInMonths(child.dateOfBirth);
    }

    const activities = await this.repository.listActivities(filters);
    return activities.map(toActivityResponse);
  }

  async listProgress(actor: Actor, childId: string): Promise<ActivityProgressResponse[]> {
    await this.requireOwnedChild(actor, childId);
    const rows = await this.repository.listProgressForChild(childId);
    return rows.map(toActivityProgressResponse);
  }

  /**
   * Begin an activity for a child. Idempotent: starting one that is already
   * started returns the existing row instead of creating a duplicate, so a
   * double tap does not fragment the child's history.
   */
  async startActivity(
    actor: Actor,
    activityId: string,
    childId: string,
  ): Promise<ActivityProgressResponse> {
    await this.requireOwnedChild(actor, childId);

    const activity = await this.repository.findActivityById(activityId);
    if (!activity) throw notFound('Activity was not found.');

    const existing = await this.repository.findProgressForChildAndActivity(childId, activityId);
    if (existing) {
      const withActivity = await this.repository.findProgressById(existing.id);
      return toActivityProgressResponse(withActivity as ActivityProgressWithActivity);
    }

    const created = await this.repository.createProgress({ childId, activityId });
    return toActivityProgressResponse(created);
  }

  /**
   * Mark progress complete or not, and/or record the parent's own note.
   *
   * `completed: false` clears completedAt so a mistaken tap can be undone.
   * Ownership is re-checked through the progress row's child, so a progress id
   * belonging to another family cannot be updated by guessing it.
   */
  async updateProgress(
    actor: Actor,
    progressId: string,
    input: UpdateActivityProgressRequest,
  ): Promise<ActivityProgressResponse> {
    if (actor.role !== 'PARENT') throw forbidden();

    const existing = await this.repository.findProgressById(progressId);
    if (!existing) throw notFound('Activity progress was not found.');
    await this.requireOwnedChild(actor, existing.childId);

    const data: { completedAt?: Date | null; parentObservation?: string | null } = {};
    if (input.completed !== undefined) data.completedAt = input.completed ? new Date() : null;
    if (input.parentObservation !== undefined) data.parentObservation = input.parentObservation;

    const updated = await this.repository.updateProgress(progressId, data);
    return toActivityProgressResponse(updated);
  }
}
