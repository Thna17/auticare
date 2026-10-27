import type {
  CreateObservationRequest,
  ListObservationsQuery,
  UpdateObservationRequest,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import type { ObservationResponse } from './observations.mapper.js';
import { toObservationResponse } from './observations.mapper.js';
import { ObservationsRepository } from './observations.repository.js';

type Actor = { parentId: string; role: UserRole };

/** Parse an ISO timestamp, rejecting anything the client made up. */
const parseTimestamp = (value: string, field: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('VALIDATION_ERROR', `The ${field} value is not a valid date.`, 400);
  }
  return parsed;
};

export class ObservationsService {
  constructor(private readonly repository = new ObservationsRepository()) {}

  private async requireOwnedChild(actor: Actor, childId: string) {
    if (actor.role !== 'PARENT') throw forbidden();
    const child = await this.repository.findOwnedChild(childId, actor.parentId);
    // notFound rather than forbidden: a 403 would confirm the child exists.
    if (!child) throw notFound('Child profile was not found.');
    return child;
  }

  async list(actor: Actor, query: ListObservationsQuery): Promise<ObservationResponse[]> {
    await this.requireOwnedChild(actor, query.childId);
    const rows = await this.repository.listForChild(query.childId, {
      limit: query.limit,
      ...(query.category ? { category: query.category } : {}),
      ...(query.from ? { from: parseTimestamp(query.from, 'from') } : {}),
      ...(query.to ? { to: parseTimestamp(query.to, 'to') } : {}),
    });
    return rows.map(toObservationResponse);
  }

  async create(actor: Actor, input: CreateObservationRequest): Promise<ObservationResponse> {
    await this.requireOwnedChild(actor, input.childId);
    const row = await this.repository.create({
      childId: input.childId,
      parentId: actor.parentId,
      category: input.category,
      intensity: input.intensity,
      occurredAt: parseTimestamp(input.occurredAt, 'occurredAt'),
      note: input.note?.trim() ? input.note.trim() : null,
      trigger: input.trigger?.trim() ? input.trigger.trim() : null,
      durationMinutes: input.durationMinutes ?? null,
      parentResponse: input.parentResponse?.trim() ? input.parentResponse.trim() : null,
      outcome: input.outcome?.trim() ? input.outcome.trim() : null,
    });
    return toObservationResponse(row);
  }

  async update(
    actor: Actor,
    observationId: string,
    input: UpdateObservationRequest,
  ): Promise<ObservationResponse> {
    if (actor.role !== 'PARENT') throw forbidden();
    const existing = await this.repository.findById(observationId);
    // Also covers the cross-account case: the row carries its owner, so a guessed
    // id belonging to another family is indistinguishable from a missing one.
    if (!existing || existing.parentId !== actor.parentId) {
      throw notFound('Observation was not found.');
    }

    const data: Parameters<ObservationsRepository['update']>[1] = {};
    if (input.category !== undefined) data.category = input.category;
    if (input.intensity !== undefined) data.intensity = input.intensity;
    if (input.occurredAt !== undefined) {
      data.occurredAt = parseTimestamp(input.occurredAt, 'occurredAt');
    }
    if (input.note !== undefined) data.note = input.note?.trim() ? input.note.trim() : null;
    if (input.trigger !== undefined)
      data.trigger = input.trigger?.trim() ? input.trigger.trim() : null;
    if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes;
    if (input.parentResponse !== undefined)
      data.parentResponse = input.parentResponse?.trim() ? input.parentResponse.trim() : null;
    if (input.outcome !== undefined)
      data.outcome = input.outcome?.trim() ? input.outcome.trim() : null;

    return toObservationResponse(await this.repository.update(observationId, data));
  }

  async remove(actor: Actor, observationId: string): Promise<{ id: string }> {
    if (actor.role !== 'PARENT') throw forbidden();
    const existing = await this.repository.findById(observationId);
    if (!existing || existing.parentId !== actor.parentId) {
      throw notFound('Observation was not found.');
    }
    await this.repository.delete(observationId);
    return { id: observationId };
  }
}
