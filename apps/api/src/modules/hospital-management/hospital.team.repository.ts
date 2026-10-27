import { prisma } from '../../database/prisma.js';

export class HospitalTeamRepository {
  findHospitalById(hospitalId: string) {
    return prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
  }

  listStaff(hospitalId: string) {
    return prisma.hospitalStaff.findMany({
      where: { hospitalId },
      include: {
        parent: {
          select: { firstName: true, lastName: true, username: true, mustResetPassword: true },
        },
        doctor: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findStaffWithAccount(staffId: string, hospitalId: string) {
    return prisma.hospitalStaff.findFirst({
      where: { id: staffId, hospitalId },
      include: {
        parent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            username: true,
            mustResetPassword: true,
          },
        },
        doctor: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  findStaffByDoctorId(doctorId: string) {
    return prisma.hospitalStaff.findUnique({
      where: { doctorId },
    });
  }

  findDoctor(doctorId: string, hospitalId: string) {
    return prisma.doctor.findFirst({
      where: { id: doctorId, hospitalId },
    });
  }

  async usernamesLike(person: string, handle: string): Promise<Set<string>> {
    const rows = await prisma.parent.findMany({
      where: { username: { startsWith: person, endsWith: `.${handle}` } },
      select: { username: true },
    });
    return new Set(rows.map((row) => row.username).filter((name): name is string => !!name));
  }

  createStaff(input: {
    hospitalId: string;
    createdById: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    title: string | null;
    role: 'COORDINATOR' | 'DOCTOR';
    doctorId: string | null;
    unusablePasswordHash: string;
    setupCodeHash: string;
    setupCodeExpiresAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.parent.create({
        data: {
          email: input.email,
          username: input.username,
          passwordHash: input.unusablePasswordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'HOSPITAL',
          mustResetPassword: true,
          preference: { create: {} },
        },
      });
      const staff = await tx.hospitalStaff.create({
        data: {
          parentId: account.id,
          hospitalId: input.hospitalId,
          role: input.role,
          title: input.title,
          doctorId: input.doctorId,
        },
      });
      await tx.accountInvitation.create({
        data: {
          email: input.email,
          tokenHash: input.setupCodeHash,
          role: 'HOSPITAL',
          parentId: account.id,
          hospitalId: input.hospitalId,
          title: input.title,
          expiresAt: input.setupCodeExpiresAt,
          createdById: input.createdById,
        },
      });
      return { account, staff };
    });
  }

  replaceSetupCode(input: {
    parentId: string;
    email: string;
    hospitalId: string;
    createdById: string;
    setupCodeHash: string;
    setupCodeExpiresAt: Date;
  }) {
    return prisma.$transaction([
      prisma.accountInvitation.updateMany({
        where: { parentId: input.parentId, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.accountInvitation.create({
        data: {
          email: input.email,
          tokenHash: input.setupCodeHash,
          role: 'HOSPITAL',
          parentId: input.parentId,
          hospitalId: input.hospitalId,
          expiresAt: input.setupCodeExpiresAt,
          createdById: input.createdById,
        },
      }),
    ]);
  }

  deactivateStaff(staffId: string, parentId: string) {
    return prisma.$transaction([
      prisma.hospitalStaff.update({
        where: { id: staffId },
        data: { deactivatedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { parentId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.accountInvitation.updateMany({
        where: { parentId, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  reactivateStaff(staffId: string) {
    return prisma.hospitalStaff.update({
      where: { id: staffId },
      data: { deactivatedAt: null },
    });
  }
}
