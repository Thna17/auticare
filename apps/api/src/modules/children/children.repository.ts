import type { Child } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export class ChildrenRepository {
  listByParent(parentId: string): Promise<Child[]> {
    return prisma.child.findMany({
      where: { parentId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAllActive(): Promise<Child[]> {
    return prisma.child.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(childId: string): Promise<Child | null> {
    return prisma.child.findUnique({ where: { id: childId } });
  }

  create(input: {
    parentId: string;
    firstName: string;
    dateOfBirth: Date;
    notes?: string;
  }): Promise<Child> {
    return prisma.child.create({
      data: {
        parentId: input.parentId,
        firstName: input.firstName,
        dateOfBirth: input.dateOfBirth,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
  }

  update(
    childId: string,
    input: { firstName?: string; dateOfBirth?: Date; notes?: string | null },
  ): Promise<Child> {
    return prisma.child.update({ where: { id: childId }, data: input });
  }

  archive(childId: string): Promise<Child> {
    return prisma.child.update({ where: { id: childId }, data: { archivedAt: new Date() } });
  }
}
