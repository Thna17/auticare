import type {
  CreateChildRequest,
  ListChildrenQuery,
  UpdateChildRequest,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { prisma } from '../../database/prisma.js';
import { EntitlementsService, lockParent } from '../subscriptions/entitlements.service.js';
import { ChildrenRepository } from './children.repository.js';
import { toChildResponse } from './children.mapper.js';

type Actor = { parentId: string; role: UserRole };

const parseDateOfBirth = (dateOfBirth: string): Date => {
  const parsed = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'The child date of birth is invalid.', 400);
  }
  if (parsed > new Date()) {
    throw new AppError('VALIDATION_ERROR', 'The child date of birth cannot be in the future.', 400);
  }
  return parsed;
};

export class ChildrenService {
  constructor(
    private readonly repository = new ChildrenRepository(),
    private readonly entitlements = new EntitlementsService(),
  ) {}

  async list(actor: Actor, query?: ListChildrenQuery) {
    if (actor.role === 'ADMIN') {
      const pagination =
        query?.page && query?.limit ? { page: query.page, limit: query.limit } : undefined;
      const children = await this.repository.listAllActive(pagination);
      return children.map(toChildResponse);
    }
    if (actor.role !== 'PARENT') throw forbidden();
    const children = await this.repository.listByParent(
      actor.parentId,
      query?.includeArchived ?? false,
    );
    return children.map(toChildResponse);
  }

  async get(actor: Actor, childId: string) {
    const child = await this.getAuthorizedChild(actor, childId);
    return toChildResponse(child);
  }

  async create(actor: Actor, input: CreateChildRequest) {
    if (actor.role !== 'PARENT') throw forbidden();
    const dateOfBirth = parseDateOfBirth(input.dateOfBirth);
    // The plan limit is checked with the parent row locked, so two requests at
    // once cannot both slip under it.
    const child = await prisma.$transaction(async (tx) => {
      await lockParent(tx, actor.parentId);
      await this.entitlements.assertCanAddChild(actor.parentId, tx);
      return this.repository.create(
        {
          parentId: actor.parentId,
          firstName: input.firstName,
          ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
          dateOfBirth,
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
        tx,
      );
    });
    return toChildResponse(child);
  }

  async update(actor: Actor, childId: string, input: UpdateChildRequest) {
    await this.getAuthorizedChild(actor, childId);
    const child = await this.repository.update(childId, {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.dateOfBirth !== undefined
        ? { dateOfBirth: parseDateOfBirth(input.dateOfBirth) }
        : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
    return toChildResponse(child);
  }

  async archive(actor: Actor, childId: string) {
    await this.getAuthorizedChild(actor, childId);
    const child = await this.repository.archive(childId);
    return toChildResponse(child);
  }

  async restore(actor: Actor, childId: string) {
    const existing = await this.getAuthorizedChild(actor, childId);
    if (!existing.archivedAt) return toChildResponse(existing);
    // Restoring brings a profile back into the count, so it meets the same limit.
    const child = await prisma.$transaction(async (tx) => {
      await lockParent(tx, existing.parentId);
      await this.entitlements.assertCanAddChild(existing.parentId, tx);
      return this.repository.restore(childId, tx);
    });
    return toChildResponse(child);
  }

  private async getAuthorizedChild(actor: Actor, childId: string) {
    if (actor.role === 'SCHOOL') throw forbidden();
    const child = await this.repository.findById(childId);
    if (!child) throw notFound('Child profile was not found.');
    if (actor.role !== 'ADMIN' && child.parentId !== actor.parentId) throw forbidden();
    return child;
  }
}
