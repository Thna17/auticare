import type { Child, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export class ChildrenRepository {
  listByParent(parentId: string, includeArchived = false): Promise<Child[]> {
    return prisma.child.findMany({
      where: {
        parentId,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAllActive(pagination?: { page: number; limit: number }): Promise<Child[]> {
    return prisma.child.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: 'desc' },
      ...(pagination
        ? {
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
          }
        : {}),
    });
  }

  findById(childId: string): Promise<Child | null> {
    return prisma.child.findUnique({ where: { id: childId } });
  }

  /** `db` is a transaction client when the caller has locked the parent for a plan check. */
  create(
    input: {
      parentId: string;
      firstName: string;
      lastName?: string;
      dateOfBirth: Date;
      address?: string;
      notes?: string;
    },
    db: Prisma.TransactionClient = prisma,
  ): Promise<Child> {
    return db.child.create({
      data: {
        parentId: input.parentId,
        firstName: input.firstName,
        dateOfBirth: input.dateOfBirth,
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
  }

  update(
    childId: string,
    input: {
      firstName?: string;
      lastName?: string | null;
      dateOfBirth?: Date;
      address?: string | null;
      notes?: string | null;
    },
  ): Promise<Child> {
    return prisma.child.update({ where: { id: childId }, data: input });
  }

  archive(childId: string): Promise<Child> {
    return prisma.child.update({ where: { id: childId }, data: { archivedAt: new Date() } });
  }

  restore(childId: string, db: Prisma.TransactionClient = prisma): Promise<Child> {
    return db.child.update({ where: { id: childId }, data: { archivedAt: null } });
  }
}
