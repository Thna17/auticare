import type { HospitalRegistrationStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export class RegistrationsHospitalRepository {
  findParentByEmail(email: string) {
    return prisma.parent.findUnique({ where: { email } });
  }

  findPendingRequestByEmail(email: string) {
    return prisma.hospitalRegistrationRequest.findFirst({
      where: { email, status: 'PENDING' },
    });
  }

  createRequest(data: {
    hospitalName: string;
    city: string;
    address?: string | null | undefined;
    contactFirstName: string;
    contactLastName: string;
    contactTitle?: string | null | undefined;
    email: string;
    phone: string;
    services?: string | null | undefined;
    message?: string | null | undefined;
  }) {
    return prisma.hospitalRegistrationRequest.create({
      data: {
        hospitalName: data.hospitalName,
        city: data.city,
        address: data.address ?? null,
        contactFirstName: data.contactFirstName,
        contactLastName: data.contactLastName,
        contactTitle: data.contactTitle ?? null,
        email: data.email,
        phone: data.phone,
        services: data.services ?? null,
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

  createAdminNotifications(adminIds: readonly string[], hospitalName: string) {
    if (adminIds.length === 0) return Promise.resolve({ count: 0 });
    return prisma.notification.createMany({
      data: adminIds.map((adminId) => ({
        parentId: adminId,
        type: 'SYSTEM',
        title: 'New hospital registration request',
        body: `${hospitalName} has submitted a registration request.`,
      })),
    });
  }

  listRequests(status?: HospitalRegistrationStatus) {
    return prisma.hospitalRegistrationRequest.findMany({
      ...(status ? { where: { status } } : {}),
      orderBy: { createdAt: 'desc' },
    });
  }

  countPending() {
    return prisma.hospitalRegistrationRequest.count({
      where: { status: 'PENDING' },
    });
  }

  findById(id: string) {
    return prisma.hospitalRegistrationRequest.findUnique({ where: { id } });
  }

  claimPendingForApproval(id: string, reviewedById: string) {
    return prisma.hospitalRegistrationRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        reviewedById,
        reviewedAt: new Date(),
      },
    });
  }

  updateApprovedHospitalId(id: string, hospitalId: string) {
    return prisma.hospitalRegistrationRequest.update({
      where: { id },
      data: { hospitalId },
    });
  }

  revertToPending(id: string) {
    return prisma.hospitalRegistrationRequest.update({
      where: { id },
      data: {
        status: 'PENDING',
        reviewedById: null,
        reviewedAt: null,
        hospitalId: null,
      },
    });
  }

  claimPendingForRejection(id: string, reviewedById: string, rejectionReason: string) {
    return prisma.hospitalRegistrationRequest.updateMany({
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
