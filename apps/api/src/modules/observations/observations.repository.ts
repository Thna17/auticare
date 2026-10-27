import type { BehaviorObservation, Child, ObservationCategory } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { CHILD_NOT_ARCHIVED } from '../../database/active-child.js';

export type ObservationFilters = {
  category?: ObservationCategory;
  from?: Date;
  to?: Date;
  limit: number;
};

export class ObservationsRepository {
  /**
   * The child, only if the caller owns it and it has not been archived. Archived
   * children leave the active roster, so new observations against them would
   * attach to a profile the parent can no longer see.
   */
  findOwnedChild(childId: string, parentId: string): Promise<Child | null> {
    return prisma.child.findFirst({ where: { id: childId, parentId, ...CHILD_NOT_ARCHIVED } });
  }

  listForChild(childId: string, filters: ObservationFilters): Promise<BehaviorObservation[]> {
    return prisma.behaviorObservation.findMany({
      where: {
        childId,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.from || filters.to
          ? {
              occurredAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      // Occurrence order, not insertion order: a parent who fills in last night's
      // entry this morning should still see the night in its right place.
      orderBy: { occurredAt: 'desc' },
      take: filters.limit,
    });
  }

  findById(id: string): Promise<BehaviorObservation | null> {
    return prisma.behaviorObservation.findUnique({ where: { id } });
  }

  create(input: {
    childId: string;
    parentId: string;
    category: ObservationCategory;
    intensity: number;
    occurredAt: Date;
    note: string | null;
    trigger?: string | null;
    durationMinutes?: number | null;
    parentResponse?: string | null;
    outcome?: string | null;
  }): Promise<BehaviorObservation> {
    return prisma.behaviorObservation.create({ data: input });
  }

  update(
    id: string,
    data: {
      category?: ObservationCategory;
      intensity?: number;
      occurredAt?: Date;
      note?: string | null;
      trigger?: string | null;
      durationMinutes?: number | null;
      parentResponse?: string | null;
      outcome?: string | null;
    },
  ): Promise<BehaviorObservation> {
    return prisma.behaviorObservation.update({ where: { id }, data });
  }

  delete(id: string): Promise<BehaviorObservation> {
    return prisma.behaviorObservation.delete({ where: { id } });
  }
}
