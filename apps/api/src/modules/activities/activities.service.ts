import type {
  ActivityProgressResponse,
  ActivityResponse,
  ListActivitiesQuery,
  StartActivityRequest,
  ToggleActivityFavoriteResponse,
  UpdateActivityProgressRequest,
  UserRole,
} from '@auticare/contracts';
import { forbidden, notFound } from '../../common/errors/app-error.js';
import { toActivityProgressResponse, toActivityResponse } from './activities.mapper.js';
import { ActivitiesRepository } from './activities.repository.js';

type Actor = { parentId: string; role: UserRole };

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
  async list(actor: Actor, query: ListActivitiesQuery): Promise<ActivityResponse[]> {
    if (actor.role !== 'PARENT') throw forbidden();
    let ageMonths: number | undefined;
    if (query.childId) {
      const child = await this.requireOwnedChild(actor, query.childId);
      ageMonths = ageInMonths(child.dateOfBirth);
    }

    const favRows = await this.repository.listFavoriteActivityIds(actor.parentId);
    const favSet = new Set(favRows.map((f) => f.activityId));

    if (query.favoriteOnly && favRows.length === 0) {
      return [];
    }

    const rows = await this.repository.listActivities({
      category: query.category,
      learningGoal: query.learningGoal,
      ageMonths,
      minAgeMonths: query.minAgeMonths,
      maxAgeMonths: query.maxAgeMonths,
      activityIds: query.favoriteOnly ? [...favSet] : undefined,
    });

    return rows.map((row) => toActivityResponse(row, favSet.has(row.id)));
  }

  async toggleFavorite(actor: Actor, activityId: string): Promise<ToggleActivityFavoriteResponse> {
    if (actor.role !== 'PARENT') throw forbidden();
    const activity = await this.repository.findActivityById(activityId);
    if (!activity) throw notFound('Activity was not found.');

    const existing = await this.repository.findFavorite(actor.parentId, activityId);
    if (existing) {
      await this.repository.removeFavorite(actor.parentId, activityId);
      return { activityId, isFavorite: false };
    } else {
      await this.repository.addFavorite(actor.parentId, activityId);
      return { activityId, isFavorite: true };
    }
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
  async start(
    actor: Actor,
    activityId: string,
    input: StartActivityRequest,
  ): Promise<ActivityProgressResponse> {
    await this.requireOwnedChild(actor, input.childId);

    const activity = await this.repository.findActivityById(activityId);
    if (!activity) throw notFound('Activity was not found.');

    const progress = await this.repository.upsertProgress({
      childId: input.childId,
      activityId,
    });

    return toActivityProgressResponse(progress);
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

    const data: Parameters<ActivitiesRepository['updateProgress']>[1] = {};
    if (input.completed !== undefined) {
      data.completedAt = input.completed ? new Date() : null;
    }
    if (input.parentObservation !== undefined) {
      data.parentObservation = input.parentObservation?.trim()
        ? input.parentObservation.trim()
        : null;
    }

    const updated = await this.repository.updateProgress(progressId, data);
    return toActivityProgressResponse(updated);
  }
}
