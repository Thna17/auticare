import type { OrganizationInquiry, School, Hospital, Parent } from '@prisma/client';
import type { OrganizationInquiryResponse } from '@auticare/contracts';

export type InquiryWithRelations = OrganizationInquiry & {
  school?: Pick<School, 'name'> | null;
  hospital?: Pick<Hospital, 'name'> | null;
  parent?: Pick<Parent, 'firstName' | 'lastName' | 'email'> | null;
};

export const toInquiryResponse = (row: InquiryWithRelations): OrganizationInquiryResponse => ({
  id: row.id,
  parentId: row.parentId,
  parent: row.parent
    ? { firstName: row.parent.firstName, lastName: row.parent.lastName, email: row.parent.email }
    : null,
  parentName: row.parent ? `${row.parent.firstName} ${row.parent.lastName}` : null,
  schoolId: row.schoolId,
  hospitalId: row.hospitalId,
  schoolName: row.school?.name ?? null,
  hospitalName: row.hospital?.name ?? null,
  childFirstName: row.childFirstName,
  subject: row.subject,
  message: row.message,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
