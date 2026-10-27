import type { Hospital, Parent, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export type HospitalAccountRecord = {
  hospital: Hospital;
  account: Parent;
  staff: { id: string; parentId: string; hospitalId: string; title: string | null };
};

export class HospitalsRepository {
  findHospitalById(id: string): Promise<Hospital | null> {
    return prisma.hospital.findUnique({ where: { id } });
  }

  findFavorite(parentId: string, hospitalId: string) {
    return prisma.favoriteHospital.findUnique({
      where: { parentId_hospitalId: { parentId, hospitalId } },
    });
  }

  addFavorite(parentId: string, hospitalId: string) {
    return prisma.favoriteHospital.create({
      data: { parentId, hospitalId },
    });
  }

  removeFavorite(parentId: string, hospitalId: string) {
    return prisma.favoriteHospital.delete({
      where: { parentId_hospitalId: { parentId, hospitalId } },
    });
  }

  listFavoriteHospitalIds(parentId: string) {
    return prisma.favoriteHospital.findMany({
      where: { parentId },
      select: { hospitalId: true },
    });
  }

  list(): Promise<Hospital[]> {
    return prisma.hospital.findMany({ orderBy: [{ city: 'asc' }, { name: 'asc' }] });
  }

  create(input: {
    name: string;
    city: string;
    address: string;
    services: string;
  }): Promise<Hospital> {
    return prisma.hospital.create({ data: input });
  }

  findParentByEmail(email: string) {
    return prisma.parent.findUnique({ where: { email } });
  }

  async createHospitalAccount(input: {
    hospital: { name: string; city: string; address: string; services: string };
    account: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      title: string | null;
      mustResetPassword?: boolean;
    };
  }): Promise<HospitalAccountRecord> {
    return prisma.$transaction(
      async (tx) => {
        const hospital = await tx.hospital.create({ data: input.hospital });
        const account = await tx.parent.create({
          data: {
            email: input.account.email,
            passwordHash: input.account.passwordHash,
            firstName: input.account.firstName,
            lastName: input.account.lastName,
            role: 'HOSPITAL',
            mustResetPassword: input.account.mustResetPassword ?? false,
            preference: { create: {} },
          },
        });
        const staff = await tx.hospitalStaff.create({
          data: {
            parentId: account.id,
            hospitalId: hospital.id,
            title: input.account.title,
            role: 'ADMIN',
          },
        });
        return { hospital, account, staff };
      },
      { isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel },
    );
  }

  async listHospitalAccounts(): Promise<HospitalAccountRecord[]> {
    const staff = await prisma.hospitalStaff.findMany({
      include: { hospital: true, parent: true },
      orderBy: [{ hospital: { city: 'asc' } }, { hospital: { name: 'asc' } }],
    });
    return staff.map((item) => ({ hospital: item.hospital, account: item.parent, staff: item }));
  }
}
