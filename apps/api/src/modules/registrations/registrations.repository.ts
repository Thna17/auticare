import type { SchoolRegistrationStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export class RegistrationsRepository {
  findParentByEmail(email: string) {
    return prisma.parent.findUnique({ where: { email } });
  }

  findPendingRequestByEmail(email: string) {
    return prisma.schoolRegistrationRequest.findFirst({
      where: { email, status: 'PENDING' },
    });
  }

  createRequest(data: {
    schoolName: string;
    city: string;
    address?: string | null | undefined;
    contactFirstName: string;
    contactLastName: string;
    contactTitle?: string | null | undefined;
    email: string;
    phone: string;
    studentCount?: number | null | undefined;
    message?: string | null | undefined;
  }) {
    return prisma.schoolRegistrationRequest.create({
      data: {
        schoolName: data.schoolName,
        city: data.city,
        address: data.address ?? null,
        contactFirstName: data.contactFirstName,
        contactLastName: data.contactLastName,
        contactTitle: data.contactTitle ?? null,
        email: data.email,
        phone: data.phone,
        studentCount: data.studentCount ?? null,
        message: data.message ?? null,
      },
    });
  }

  findAdminUsers() {
    return prisma.parent.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
  }

  createAdminNotifications(adminIds: readonly string[], schoolName: string) {
    if (adminIds.length === 0) return Promise.resolve({ count: 0 });
    return prisma.notification.createMany({
      data: adminIds.map((adminId) => ({
        parentId: adminId,
        type: 'SYSTEM',
        title: 'New school registration request',
        body: `${schoolName} has submitted a registration request.`,
      })),
    });
  }

  listRequests(status?: SchoolRegistrationStatus) {
    return prisma.schoolRegistrationRequest.findMany({
      ...(status ? { where: { status } } : {}),
      orderBy: { createdAt: 'desc' },
    });
  }

  countPending() {
    return prisma.schoolRegistrationRequest.count({
      where: { status: 'PENDING' },
    });
  }

  findById(id: string) {
    return prisma.schoolRegistrationRequest.findUnique({ where: { id } });
  }

  claimPendingForApproval(id: string, reviewedById: string) {
    return prisma.schoolRegistrationRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        reviewedById,
        reviewedAt: new Date(),
      },
    });
  }

  updateApprovedSchoolId(id: string, schoolId: string) {
    return prisma.schoolRegistrationRequest.update({
      where: { id },
      data: { schoolId },
    });
  }

  revertToPending(id: string) {
    return prisma.schoolRegistrationRequest.update({
      where: { id },
      data: {
        status: 'PENDING',
        reviewedById: null,
        reviewedAt: null,
        schoolId: null,
      },
    });
  }

  claimPendingForRejection(id: string, reviewedById: string, rejectionReason: string) {
    return prisma.schoolRegistrationRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedById,
        reviewedAt: new Date(),
      },
    });
  }
}
