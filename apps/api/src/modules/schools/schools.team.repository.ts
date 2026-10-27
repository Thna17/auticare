import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { CHILD_NOT_ARCHIVED } from '../../database/active-child.js';

/**
 * Data access for a school's team (teacher accounts and their assignments) and
 * for the connection codes families use to join a school.
 */
export class SchoolTeamRepository {
  // ── Scope ──────────────────────────────────────────────────────────────

  /** Children a teacher may see: lead specialist on, or assigned to. */
  async assignedChildIds(staffId: string, schoolId: string): Promise<string[]> {
    const enrollments = await prisma.schoolChildEnrollment.findMany({
      where: {
        schoolId,
        // Only live enrollments: when a child leaves, the teacher loses access.
        status: { in: ['ACTIVE', 'PENDING'] },
        OR: [{ leadSpecialistId: staffId }, { teachers: { some: { staffId } } }],
      },
      select: { childId: true },
    });
    return enrollments.map((enrollment) => enrollment.childId);
  }

  // ── Staff ──────────────────────────────────────────────────────────────

  listStaff(schoolId: string) {
    return prisma.schoolStaff.findMany({
      where: { schoolId },
      include: {
        parent: {
          select: { firstName: true, lastName: true, username: true, mustResetPassword: true },
        },
        _count: { select: { teaching: true } },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findStaffWithAccount(staffId: string, schoolId: string) {
    return prisma.schoolStaff.findFirst({
      where: { id: staffId, schoolId },
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
        _count: { select: { teaching: true } },
      },
    });
  }

  /** Every username of the form `<person>…<handle>`, for picking a free one. */
  async usernamesLike(person: string, handle: string): Promise<Set<string>> {
    const rows = await prisma.parent.findMany({
      where: { username: { startsWith: person, endsWith: `.${handle}` } },
      select: { username: true },
    });
    return new Set(rows.map((row) => row.username).filter((name): name is string => !!name));
  }

  /** The account, its staff row and its first setup code, all or nothing. */
  createTeacher(input: {
    schoolId: string;
    createdById: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    title: string | null;
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
          role: 'SCHOOL',
          mustResetPassword: true,
          preference: { create: {} },
        },
      });
      const staff = await tx.schoolStaff.create({
        data: {
          parentId: account.id,
          schoolId: input.schoolId,
          role: 'TEACHER',
          title: input.title,
        },
      });
      await tx.accountInvitation.create({
        data: {
          email: input.email,
          tokenHash: input.setupCodeHash,
          role: 'SCHOOL',
          parentId: account.id,
          schoolId: input.schoolId,
          title: input.title,
          expiresAt: input.setupCodeExpiresAt,
          createdById: input.createdById,
        },
      });
      return { account, staff };
    });
  }

  /** Close any open setup code and issue a new one. */
  replaceSetupCode(input: {
    parentId: string;
    email: string;
    schoolId: string;
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
          role: 'SCHOOL',
          parentId: input.parentId,
          schoolId: input.schoolId,
          expiresAt: input.setupCodeExpiresAt,
          createdById: input.createdById,
        },
      }),
    ]);
  }

  /** Deactivate: the account loses access now, including open sessions. */
  deactivateStaff(staffId: string, parentId: string) {
    return prisma.$transaction([
      prisma.schoolStaff.update({ where: { id: staffId }, data: { deactivatedAt: new Date() } }),
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
    return prisma.schoolStaff.update({ where: { id: staffId }, data: { deactivatedAt: null } });
  }

  /** Active staff of this school among the given ids. */
  findActiveStaffIn(schoolId: string, staffIds: readonly string[]) {
    return prisma.schoolStaff.findMany({
      where: { schoolId, id: { in: [...staffIds] }, deactivatedAt: null },
      include: { parent: { select: { firstName: true, lastName: true } } },
    });
  }

  // ── Assignment ─────────────────────────────────────────────────────────

  replaceTeachers(enrollmentId: string, staffIds: readonly string[]) {
    return prisma.$transaction([
      prisma.enrollmentTeacher.deleteMany({ where: { enrollmentId } }),
      prisma.enrollmentTeacher.createMany({
        data: staffIds.map((staffId) => ({ enrollmentId, staffId })),
      }),
    ]);
  }

  teachersForEnrollments(enrollmentIds: readonly string[]) {
    return prisma.enrollmentTeacher.findMany({
      where: { enrollmentId: { in: [...enrollmentIds] } },
      include: {
        staff: { include: { parent: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Connection codes (school side) ─────────────────────────────────────

  createConnectionCode(data: {
    schoolId: string;
    codeHash: string;
    label: string | null;
    teacherStaffIds: string[];
    createdByStaffId: string;
    expiresAt: Date;
  }) {
    return prisma.schoolConnectionCode.create({ data });
  }

  /** Open codes plus anything used, revoked or expired in the last 30 days. */
  listConnectionCodes(schoolId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return prisma.schoolConnectionCode.findMany({
      where: {
        schoolId,
        OR: [
          { usedAt: null, revokedAt: null, expiresAt: { gt: since } },
          { usedAt: { gt: since } },
          { revokedAt: { gt: since } },
        ],
      },
      include: { enrollment: { select: { child: { select: { firstName: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  revokeConnectionCode(id: string, schoolId: string) {
    return prisma.schoolConnectionCode.updateMany({
      where: { id, schoolId, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  staffNames(staffIds: readonly string[]) {
    return prisma.schoolStaff.findMany({
      where: { id: { in: [...staffIds] } },
      select: { id: true, title: true, parent: { select: { firstName: true, lastName: true } } },
    });
  }

  // ── Connection codes (parent side) ─────────────────────────────────────

  findConnectionCodeByHash(codeHash: string) {
    return prisma.schoolConnectionCode.findUnique({
      where: { codeHash },
      include: { school: { select: { id: true, name: true, city: true, logoUrl: true } } },
    });
  }

  findOwnedActiveChild(childId: string, parentId: string) {
    return prisma.child.findFirst({ where: { id: childId, parentId, ...CHILD_NOT_ARCHIVED } });
  }

  /**
   * Redeem a code. The code is claimed with a conditional update first, so two
   * people racing with the same code cannot both succeed.
   */
  redeemConnectionCode(input: {
    codeId: string;
    schoolId: string;
    childId: string;
    parentId: string;
    teacherStaffIds: readonly string[];
    notifyParentId: string | null;
    childFirstName: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.schoolConnectionCode.updateMany({
        where: { id: input.codeId, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date(), usedByParentId: input.parentId },
      });
      if (claimed.count !== 1) return null;

      const enrollment = await tx.schoolChildEnrollment.upsert({
        where: { schoolId_childId: { schoolId: input.schoolId, childId: input.childId } },
        create: { schoolId: input.schoolId, childId: input.childId, status: 'ACTIVE' },
        update: { status: 'ACTIVE', endDate: null, startDate: new Date() },
      });

      if (input.teacherStaffIds.length > 0) {
        await tx.enrollmentTeacher.createMany({
          data: input.teacherStaffIds.map((staffId) => ({ enrollmentId: enrollment.id, staffId })),
          skipDuplicates: true,
        });
      }

      await tx.schoolConnectionCode.update({
        where: { id: input.codeId },
        data: { enrollmentId: enrollment.id },
      });

      if (input.notifyParentId) {
        await tx.notification.create({
          data: {
            parentId: input.notifyParentId,
            schoolId: input.schoolId,
            type: 'SYSTEM',
            title: 'A family connected',
            body: `${input.childFirstName} is now connected to your school.`,
            enrollmentId: enrollment.id,
          },
        });
      }

      return enrollment;
    });
  }

  findEnrollment(schoolId: string, childId: string) {
    return prisma.schoolChildEnrollment.findUnique({
      where: { schoolId_childId: { schoolId, childId } },
    });
  }

  findStaffParentId(staffId: string) {
    return prisma.schoolStaff.findUnique({ where: { id: staffId }, select: { parentId: true } });
  }

  /** Every live school connection for this parent's children. */
  listConnectionsForParent(parentId: string) {
    return prisma.schoolChildEnrollment.findMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING'] },
        child: { parentId, ...CHILD_NOT_ARCHIVED },
      },
      include: {
        school: { select: { id: true, name: true, city: true, logoUrl: true } },
        child: { select: { id: true, firstName: true } },
        leadSpecialist: {
          select: { title: true, parent: { select: { firstName: true, lastName: true } } },
        },
        teachers: {
          include: {
            staff: {
              select: {
                id: true,
                title: true,
                deactivatedAt: true,
                parent: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Submitted reports per (school, child); drafts are never counted. */
  async submittedReportCounts(pairs: readonly { schoolId: string; childId: string }[]) {
    if (pairs.length === 0) return new Map<string, number>();
    const rows = await prisma.activityReport.groupBy({
      by: ['schoolId', 'childId'],
      where: {
        status: 'SUBMITTED',
        OR: pairs.map((pair) => ({ schoolId: pair.schoolId, childId: pair.childId })),
      },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [`${row.schoolId}:${row.childId}`, row._count._all]));
  }

  findParentEnrollment(enrollmentId: string, parentId: string) {
    return prisma.schoolChildEnrollment.findFirst({
      where: { id: enrollmentId, child: { parentId } },
    });
  }

  /** The parent ends the connection; reports already written stay with them. */
  endEnrollment(enrollmentId: string) {
    return prisma.$transaction([
      prisma.schoolChildEnrollment.update({
        where: { id: enrollmentId },
        data: { status: 'REJECTED', endDate: new Date() },
      }),
      prisma.enrollmentTeacher.deleteMany({ where: { enrollmentId } }),
    ]);
  }
}

export type TeacherAssignmentRow = Prisma.EnrollmentTeacherGetPayload<{
  include: { staff: { include: { parent: { select: { firstName: true; lastName: true } } } } };
}>;
