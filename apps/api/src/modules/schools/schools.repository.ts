import type {
  Parent,
  Prisma,
  School,
  SchoolActivityReport,
  SchoolChildEnrollment,
  SchoolStaff,
} from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import type { SchoolAccountRecord } from './schools.mapper.js';

export class SchoolsRepository {
  listSchools(): Promise<School[]> {
    return prisma.school.findMany({ orderBy: [{ city: 'asc' }, { name: 'asc' }] });
  }

  updateSchool(
    schoolId: string,
    input: { name?: string; city?: string; address?: string; description?: string | null },
  ): Promise<School> {
    return prisma.school.update({ where: { id: schoolId }, data: input });
  }

  findParentByEmail(email: string): Promise<Parent | null> {
    return prisma.parent.findUnique({ where: { email } });
  }

  async createSchoolAccount(input: {
    school: { name: string; city: string; address: string; description: string | null };
    account: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      title: string | null;
    };
  }): Promise<SchoolAccountRecord> {
    return prisma.$transaction(
      async (tx) => {
        const school = await tx.school.create({
          data: {
            name: input.school.name,
            city: input.school.city,
            address: input.school.address,
            description: input.school.description,
          },
        });
        const account = await tx.parent.create({
          data: {
            email: input.account.email,
            passwordHash: input.account.passwordHash,
            firstName: input.account.firstName,
            lastName: input.account.lastName,
            role: 'SCHOOL',
            preference: { create: {} },
          },
        });
        const staff = await tx.schoolStaff.create({
          data: { parentId: account.id, schoolId: school.id, title: input.account.title },
        });
        return { school, account, staff };
      },
      { isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel },
    );
  }

  async listSchoolAccounts(): Promise<SchoolAccountRecord[]> {
    const staff = await prisma.schoolStaff.findMany({
      include: { school: true, parent: true },
      orderBy: [{ school: { city: 'asc' } }, { school: { name: 'asc' } }],
    });
    return staff.map((item) => ({ school: item.school, staff: item, account: item.parent }));
  }

  findStaffForParent(parentId: string): Promise<SchoolStaff | null> {
    return prisma.schoolStaff.findFirst({ where: { parentId } });
  }

  findStaffForParentAndSchool(parentId: string, schoolId: string): Promise<SchoolStaff | null> {
    return prisma.schoolStaff.findUnique({ where: { parentId_schoolId: { parentId, schoolId } } });
  }

  findChild(childId: string) {
    return prisma.child.findUnique({ where: { id: childId } });
  }

  upsertEnrollment(input: { schoolId: string; childId: string }): Promise<SchoolChildEnrollment> {
    return prisma.schoolChildEnrollment.upsert({
      where: { schoolId_childId: { schoolId: input.schoolId, childId: input.childId } },
      update: { status: 'ACTIVE', endedAt: null },
      create: { schoolId: input.schoolId, childId: input.childId },
    });
  }

  endEnrollment(input: { schoolId: string; childId: string }): Promise<SchoolChildEnrollment> {
    return prisma.schoolChildEnrollment.update({
      where: { schoolId_childId: { schoolId: input.schoolId, childId: input.childId } },
      data: { status: 'ENDED', endedAt: new Date() },
    });
  }

  findActiveEnrollment(input: {
    schoolId: string;
    childId: string;
  }): Promise<SchoolChildEnrollment | null> {
    return prisma.schoolChildEnrollment.findFirst({
      where: { schoolId: input.schoolId, childId: input.childId, status: 'ACTIVE' },
    });
  }

  listEnrollmentsForParent(parentId: string): Promise<SchoolChildEnrollment[]> {
    return prisma.schoolChildEnrollment.findMany({
      where: { child: { parentId }, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  listEnrollmentsForSchool(schoolId: string): Promise<SchoolChildEnrollment[]> {
    return prisma.schoolChildEnrollment.findMany({
      where: { schoolId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  createActivityReport(input: {
    schoolId: string;
    childId: string;
    reporterId: string;
    title: string;
    summary: string;
    activityDate: Date;
  }): Promise<SchoolActivityReport> {
    return prisma.$transaction(async (tx) => {
      const report = await tx.schoolActivityReport.create({ data: input });
      const child = await tx.child.findUniqueOrThrow({ where: { id: input.childId } });
      await tx.notification.create({
        data: {
          parentId: child.parentId,
          type: 'SCHOOL_REPORT',
          title: 'New school activity report',
          body: input.title,
        },
      });
      return report;
    });
  }

  listReportsForParent(parentId: string): Promise<SchoolActivityReport[]> {
    return prisma.schoolActivityReport.findMany({
      where: { child: { parentId } },
      orderBy: { activityDate: 'desc' },
    });
  }

  listReportsForSchool(schoolId: string): Promise<SchoolActivityReport[]> {
    return prisma.schoolActivityReport.findMany({
      where: { schoolId },
      orderBy: { activityDate: 'desc' },
    });
  }

  listAllReports(): Promise<SchoolActivityReport[]> {
    return prisma.schoolActivityReport.findMany({ orderBy: { activityDate: 'desc' } });
  }
}
