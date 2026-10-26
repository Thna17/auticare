import type { BehaviorObservation } from '@prisma/client';

export type ObservationResponse = {
  id: string;
  childId: string;
  category: BehaviorObservation['category'];
  intensity: number;
  occurredAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export const toObservationResponse = (row: BehaviorObservation): ObservationResponse => ({
  id: row.id,
  childId: row.childId,
  category: row.category,
  intensity: row.intensity,
  occurredAt: row.occurredAt.toISOString(),
  note: row.note,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
