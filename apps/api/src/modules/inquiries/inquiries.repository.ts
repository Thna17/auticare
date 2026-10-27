import type { InquiryStatus, OrganizationInquiry } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import type { InquiryWithRelations } from './inquiries.mapper.js';

export class InquiriesRepository {
  findSchool(id: string) {
    return prisma.school.findUnique({ where: { id } });
  }

  findHospital(id: string) {
    return prisma.hospital.findUnique({ where: { id } });
  }

  create(input: {
    parentId: string;
    schoolId?: string | null | undefined;
    hospitalId?: string | null | undefined;
    childFirstName?: string | null | undefined;
    subject: string;
    message: string;
  }): Promise<InquiryWithRelations> {
    return prisma.organizationInquiry.create({
      data: {
        parentId: input.parentId,
        schoolId: input.schoolId ?? null,
        hospitalId: input.hospitalId ?? null,
        childFirstName: input.childFirstName ?? null,
        subject: input.subject,
        message: input.message,
      },
      include: {
        school: { select: { name: true } },
        hospital: { select: { name: true } },
      },
    });
  }

  listForParent(parentId: string): Promise<InquiryWithRelations[]> {
    return prisma.organizationInquiry.findMany({
      where: { parentId },
      include: {
        school: { select: { name: true } },
        hospital: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listForSchool(schoolId: string): Promise<InquiryWithRelations[]> {
    return prisma.organizationInquiry.findMany({
      where: { schoolId },
      include: {
        school: { select: { name: true } },
        parent: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<OrganizationInquiry | null> {
    return prisma.organizationInquiry.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: InquiryStatus): Promise<InquiryWithRelations> {
    return prisma.organizationInquiry.update({
      where: { id },
      data: { status },
      include: {
        school: { select: { name: true } },
        hospital: { select: { name: true } },
      },
    });
  }

  findActiveSchoolStaff(parentId: string) {
    return prisma.schoolStaff.findFirst({
      where: { parentId, deactivatedAt: null },
      include: { school: true },
    });
  }

  /** An active admin of the school, to receive the inquiry notification. */
  findSchoolAdminAccount(schoolId: string) {
    return prisma.schoolStaff.findFirst({
      where: { schoolId, role: 'ADMIN', deactivatedAt: null },
      select: { parentId: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  createNotification(data: {
    schoolId?: string | null;
    parentId: string;
    type: 'SYSTEM';
    title: string;
    body: string;
  }) {
    return prisma.notification.create({
      data: {
        schoolId: data.schoolId ?? null,
        parentId: data.parentId,
        type: data.type,
        title: data.title,
        body: data.body,
      },
    });
  }
}
