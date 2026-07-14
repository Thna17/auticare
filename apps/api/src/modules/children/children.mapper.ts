import type { Child } from '@prisma/client';
import type { ChildResponse } from '@auticare/contracts';
export const toChildResponse = (child: Child): ChildResponse => ({
  id: child.id,
  firstName: child.firstName,
  dateOfBirth: child.dateOfBirth.toISOString().slice(0, 10),
  notes: child.notes,
  archivedAt: child.archivedAt?.toISOString() ?? null,
});
