import type { CreateChildRequest, UpdateChildRequest, UserRole } from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
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
  constructor(private readonly repository = new ChildrenRepository()) {}

  async list(actor: Actor) {
    if (actor.role === 'ADMIN') {
      const children = await this.repository.listAllActive();
      return children.map(toChildResponse);
    }
    if (actor.role !== 'PARENT') throw forbidden();
    const children = await this.repository.listByParent(actor.parentId);
    return children.map(toChildResponse);
  }

  async get(actor: Actor, childId: string) {
    const child = await this.getAuthorizedChild(actor, childId);
    return toChildResponse(child);
  }

  async create(actor: Actor, input: CreateChildRequest) {
    if (actor.role !== 'PARENT') throw forbidden();
    const child = await this.repository.create({
      parentId: actor.parentId,
      firstName: input.firstName,
      dateOfBirth: parseDateOfBirth(input.dateOfBirth),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
    return toChildResponse(child);
  }

  async update(actor: Actor, childId: string, input: UpdateChildRequest) {
    await this.getAuthorizedChild(actor, childId);
    const child = await this.repository.update(childId, {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.dateOfBirth !== undefined
        ? { dateOfBirth: parseDateOfBirth(input.dateOfBirth) }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
    return toChildResponse(child);
  }

  async archive(actor: Actor, childId: string) {
    await this.getAuthorizedChild(actor, childId);
    const child = await this.repository.archive(childId);
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
