import type { Child } from '@prisma/client';
import type { ChildResponse, QuestionnaireStatus } from '@auticare/contracts';

export const toChildResponse = (
  child: Child,
  questionnaireStatus?: QuestionnaireStatus,
): ChildResponse => ({
  id: child.id,
  firstName: child.firstName,
  lastName: child.lastName ?? null,
  dateOfBirth: child.dateOfBirth.toISOString().slice(0, 10),
  address: child.address ?? null,
  notes: child.notes,
  archivedAt: child.archivedAt?.toISOString() ?? null,
  ...(questionnaireStatus !== undefined ? { questionnaireStatus } : {}),
});
