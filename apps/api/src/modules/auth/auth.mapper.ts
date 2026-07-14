import type { Parent } from '@prisma/client';
import type { ParentResponse } from '@auticare/contracts';
export const toParentResponse = (parent: Parent): ParentResponse => ({
  id: parent.id,
  email: parent.email,
  firstName: parent.firstName,
  lastName: parent.lastName,
  role: parent.role,
});
