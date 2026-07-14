import type { SchoolActivityReport, SchoolChildEnrollment, SchoolStaff } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export class SchoolsRepository {
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
}
