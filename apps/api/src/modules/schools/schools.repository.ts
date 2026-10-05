import { Prisma } from '@prisma/client';
import type {
  Parent,
  School,
  Child,
  ActivityReport,
  Notification,
  SchoolAvailabilityStatus,
  SchoolChildEnrollment,
  SchoolStaff,
} from '@prisma/client';
import type { SchoolChildEnrollmentStatus } from '@auticare/contracts';
import { prisma } from '../../database/prisma.js';
import type { SchoolAccountRecord, SchoolRating } from './schools.mapper.js';

export class SchoolsRepository {
  listSchools(
    // `| undefined` is explicit because exactOptionalPropertyTypes is on and
    // the caller always passes all four keys, some of them undefined.
    filters: {
      search?: string | undefined;
      province?: string | undefined;
      availability?: SchoolAvailabilityStatus | undefined;
      specializations?: string[] | undefined;
    } = {},
  ): Promise<School[]> {
    const where: Prisma.SchoolWhereInput = { status: 'ACTIVE' };

    if (filters.province !== undefined && filters.province !== '') {
      // NOTE: `mode: 'insensitive'` is PostgreSQL-only — MySQL is already
      // case-insensitive for contains() with its default collation.
      where.city = { equals: filters.province };
    }
    if (filters.availability !== undefined) {
      where.availabilityStatus = filters.availability;
    }
    if (filters.search !== undefined && filters.search !== '') {
      where.OR = [
        { name: { contains: filters.search } },
        { city: { contains: filters.search } },
        { address: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }
    if (filters.specializations !== undefined && filters.specializations.length > 0) {
      // specializations is a Json string[] column — match schools carrying ANY
      // of the requested tags (array_contains on a Json array).
      where.specializations = { array_contains: filters.specializations };
    }

    return prisma.school.findMany({
      where,
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });
  }

  /** Distinct provinces (stored in `city`) of active schools, for the filter dropdown. */
  listSchoolCities(): Promise<string[]> {
    return prisma.school
      .findMany({
        where: { status: 'ACTIVE' },
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      })
      .then((rows) => rows.map((row) => row.city));
  }

  findSchoolById(schoolId: string): Promise<School | null> {
    return prisma.school.findUnique({ where: { id: schoolId } });
  }

  /** Average review rating + count for a single school (computed, read-only). */
  async getSchoolRating(schoolId: string): Promise<SchoolRating> {
    const aggregate = await prisma.review.aggregate({
      where: { schoolId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return { average: aggregate._avg.rating, count: aggregate._count._all };
  }

  /** Ratings for many schools in one query (avoids N+1 on the list endpoint). */
  async getRatingsForSchools(schoolIds: readonly string[]): Promise<Map<string, SchoolRating>> {
    if (schoolIds.length === 0) return new Map();
    const grouped = await prisma.review.groupBy({
      by: ['schoolId'],
      where: { schoolId: { in: [...schoolIds] } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return new Map(
      grouped.map((row) => [row.schoolId, { average: row._avg.rating, count: row._count._all }]),
    );
  }

  updateSchool(
    schoolId: string,
    input: { name?: string; city?: string; address?: string; description?: string | null },
  ): Promise<School> {
    return prisma.school.update({ where: { id: schoolId }, data: input });
  }

  /**
   * School-owned profile update. Note: isVerified and rating are intentionally
   * absent from this input type, so they can never be written through this path.
   */
  updateSchoolProfile(
    schoolId: string,
    input: {
      name?: string;
      city?: string;
      address?: string;
      description?: string | null;
      email?: string | null;
      website?: string | null;
      logoUrl?: string | null;
      coverImageUrl?: string | null;
      studentTeacherRatio?: string | null;
      availabilityStatus?: SchoolAvailabilityStatus;
      waitlistEstimate?: string | null;
      admissionRequirements?: string | null;
      operatingHours?: string | null;
      facilities?: string[];
      specializations?: string[];
    },
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
      update: { status: 'ACTIVE', endDate: null },
      create: { schoolId: input.schoolId, childId: input.childId, status: 'ACTIVE' },
    });
  }

  /**
   * Marks a school+child enrollment GRADUATED. Distinct from endEnrollment
   * below, which REJECTS by enrollment id — both were previously named
   * endEnrollment, so this one was shadowed and unreachable at runtime.
   */
  graduateEnrollment(input: { schoolId: string; childId: string }): Promise<SchoolChildEnrollment> {
    return prisma.schoolChildEnrollment.update({
      where: { schoolId_childId: { schoolId: input.schoolId, childId: input.childId } },
      data: { status: 'GRADUATED', endDate: new Date() },
    });
  }

  /**
   * Enrollment that permits report creation. ACTIVE and PENDING both qualify —
   * matching the student picker — so schools can report on students awaiting
   * activation. Strictly scoped to one school + child pair.
   */
  findReportableEnrollment(input: {
    schoolId: string;
    childId: string;
  }): Promise<SchoolChildEnrollment | null> {
    return prisma.schoolChildEnrollment.findFirst({
      where: {
        schoolId: input.schoolId,
        childId: input.childId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
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

  /**
   * Returns enrollments with the child relation included, scoped to a single
   * school and filtered to ACTIVE / PENDING statuses only. Used by the
   * school-student-list endpoint to enforce strict data isolation.
   */
  listEnrollmentsWithChildForSchool(schoolId: string) {
    return prisma.schoolChildEnrollment.findMany({
      where: {
        schoolId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      include: { child: true },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Enrollments for student pickers (e.g. the activity report form).
   * Includes PENDING students so reports can be written for newly added
   * children before a staff member activates them. Includes the full child
   * record (firstName, lastName, dateOfBirth, photoUrl, address, notes...)
   * plus the enrollment start date.
   */
  listPickerEnrolledStudentsForSchool(schoolId: string) {
    return prisma.schoolChildEnrollment.findMany({
      where: {
        schoolId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      include: { child: true },
      orderBy: { startDate: 'desc' },
    });
  }

  createActivityReport(input: {
    schoolId: string;
    childId: string;
    reporterId: string;
    activityCategory: string;
    title: string;
    summary: string;
    activityDate: Date;
    status?: string;
    duration?: number;
    performanceMetrics?: Prisma.InputJsonValue;
    teacherObservation?: string;
    recommendations?: string;
    photoUrls?: string[];
  }): Promise<ActivityReport> {
    return prisma.$transaction(async (tx) => {
      const report = await tx.activityReport.create({ data: input });
      const child = await tx.child.findUniqueOrThrow({ where: { id: input.childId } });
      await tx.notification.create({
        data: {
          parentId: child.parentId,
          type: 'REPORT_REQUEST',
          title: 'New school activity report',
          body: input.title,
        },
      });
      return report;
    });
  }

  listReportsForParent(parentId: string): Promise<ActivityReport[]> {
    return prisma.activityReport.findMany({
      where: { child: { parentId } },
      orderBy: { activityDate: 'desc' },
    });
  }

  findActivityReportById(id: string): Promise<ActivityReport | null> {
    return prisma.activityReport.findUnique({ where: { id } });
  }

  deleteActivityReport(id: string): Promise<ActivityReport> {
    return prisma.activityReport.delete({ where: { id } });
  }

  findActivityReportByIdWithRelations(id: string) {
    return prisma.activityReport.findUnique({
      where: { id },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            dateOfBirth: true,
            photoUrl: true,
            parent: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        reporter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  listReportsForSchoolWithRelations(
    schoolId: string,
    filters?: { childId?: string; status?: string },
  ) {
    return prisma.activityReport.findMany({
      where: {
        schoolId,
        ...(filters?.childId !== undefined && { childId: filters.childId }),
        ...(filters?.status !== undefined && { status: filters.status }),
      },
      include: {
        child: { select: { firstName: true, lastName: true, photoUrl: true } },
        reporter: { select: { firstName: true, lastName: true } },
      },
      orderBy: { activityDate: 'desc' },
    });
  }

  listReportsForSchool(
    schoolId: string,
    filters?: { childId?: string; status?: string },
  ): Promise<ActivityReport[]> {
    return prisma.activityReport.findMany({
      where: {
        schoolId,
        ...(filters?.childId !== undefined && { childId: filters.childId }),
        ...(filters?.status !== undefined && { status: filters.status }),
      },
      orderBy: { activityDate: 'desc' },
    });
  }

  listAllReports(): Promise<ActivityReport[]> {
    return prisma.activityReport.findMany({ orderBy: { activityDate: 'desc' } });
  }

  updateActivityReport(
    id: string,
    input: {
      activityCategory?: string;
      title?: string;
      summary?: string;
      activityDate?: Date;
      status?: string;
      duration?: number | null;
      performanceMetrics?: Prisma.InputJsonValue | null;
      teacherObservation?: string | null;
      recommendations?: string | null;
      photoUrls?: string[] | null;
    },
  ): Promise<ActivityReport> {
    const data: Record<string, unknown> = {};
    if (input.activityCategory !== undefined) data.activityCategory = input.activityCategory;
    if (input.title !== undefined) data.title = input.title;
    if (input.summary !== undefined) data.summary = input.summary;
    if (input.activityDate !== undefined) data.activityDate = input.activityDate;
    if (input.status !== undefined) data.status = input.status;
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.performanceMetrics !== undefined) data.performanceMetrics = input.performanceMetrics;
    if (input.teacherObservation !== undefined) data.teacherObservation = input.teacherObservation;
    if (input.recommendations !== undefined) data.recommendations = input.recommendations;
    if (input.photoUrls !== undefined) data.photoUrls = input.photoUrls;
    return prisma.activityReport.update({ where: { id }, data });
  }

  // ── Notifications ──────────────────────────────────────────────────────

  listNotificationsForSchool(
    schoolId: string,
    filters?: { isRead?: boolean },
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        schoolId,
        ...(filters?.isRead !== undefined && {
          status: filters.isRead ? 'READ' : 'UNREAD',
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Notification rows joined with the sender's (parent's) name. */
  listNotificationsWithSender(schoolId: string, filters?: { isRead?: boolean }) {
    return prisma.notification.findMany({
      where: {
        schoolId,
        ...(filters?.isRead !== undefined && {
          status: filters.isRead ? 'READ' : 'UNREAD',
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        parent: { select: { firstName: true, lastName: true } },
      },
    });
  }

  /** Admission request linked to a notification (via enrollmentId pointer).
   * Note: AdmissionRequest has no Child relation — the child name is resolved
   * separately via findChildNameById. */
  findAdmissionRequestById(id: string) {
    return prisma.admissionRequest.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /** Child display info for an admission request's plain childId column. */
  findChildNameById(childId: string) {
    return prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, firstName: true, lastName: true },
    });
  }

  /**
   * Applies the school's decision atomically: admission status, notification
   * read-flag, enrollment upsert (so approved/declined students materialize in
   * the Student Enrollment page immediately), and the parent-facing outcome
   * notification.
   */
  decideEnrollmentRequest(input: {
    requestId: string;
    notificationId: string;
    parentId: string;
    schoolId: string;
    childId: string;
    childFirstName: string;
    schoolName: string;
    admissionStatus: 'REQUESTED' | 'APPROVED' | 'REJECTED';
    enrollmentStatus: 'ACTIVE' | 'REJECTED' | null;
  }): Promise<string | null> {
    return prisma.$transaction(async (tx) => {
      await tx.admissionRequest.update({
        where: { id: input.requestId },
        data: { status: input.admissionStatus },
      });
      await tx.notification.update({
        where: { id: input.notificationId },
        data: { status: 'READ' },
      });

      let enrollmentId: string | null = null;
      if (input.enrollmentStatus !== null) {
        const enrollment = await tx.schoolChildEnrollment.upsert({
          where: {
            schoolId_childId: { schoolId: input.schoolId, childId: input.childId },
          },
          create: {
            schoolId: input.schoolId,
            childId: input.childId,
            status: input.enrollmentStatus,
          },
          update: { status: input.enrollmentStatus, endDate: null },
        });
        enrollmentId = enrollment.id;
      }

      await tx.notification.create({
        data: {
          parentId: input.parentId,
          schoolId: input.schoolId,
          type: 'ADMISSION',
          status: 'UNREAD',
          title:
            input.admissionStatus === 'APPROVED'
              ? `Enrollment approved for ${input.childFirstName}`
              : input.admissionStatus === 'REJECTED'
                ? `Enrollment declined for ${input.childFirstName}`
                : `Enrollment request pending for ${input.childFirstName}`,
          body:
            input.admissionStatus === 'APPROVED'
              ? `${input.schoolName} approved the enrollment request. ${input.childFirstName} is now enrolled.`
              : input.admissionStatus === 'REJECTED'
                ? `${input.schoolName} declined the enrollment request for ${input.childFirstName}.`
                : `${input.schoolName} is still reviewing the enrollment request for ${input.childFirstName}.`,
        },
      });

      return enrollmentId;
    });
  }

  findNotificationById(id: string) {
    // Include the school name — the base model type declares the relation but
    // it is undefined at runtime unless explicitly included.
    return prisma.notification.findUnique({
      where: { id },
      include: { school: { select: { name: true } } },
    });
  }

  markNotificationRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { status: 'READ' },
    });
  }

  markAllNotificationsRead(schoolId: string): Promise<Prisma.BatchPayload> {
    return prisma.notification.updateMany({
      where: { schoolId, status: 'UNREAD' },
      data: { status: 'READ' },
    });
  }

  // ── Dashboard Stats ───────────────────────────────────────────────────

  /** Count of reports with status 'SUBMITTED' created this month. */
  countSubmittedReportsThisMonth(schoolId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return prisma.activityReport.count({
      where: {
        schoolId,
        status: 'SUBMITTED',
        createdAt: { gte: startOfMonth },
      },
    });
  }

  /** Count of reports with status 'DRAFT' or 'PENDING_REVIEW'. */
  countPendingReports(schoolId: string): Promise<number> {
    return prisma.activityReport.count({
      where: {
        schoolId,
        status: { in: ['DRAFT', 'PENDING_REVIEW'] },
      },
    });
  }

  /** Count of enrollment requests with status 'PENDING'. */
  countPendingEnrollments(schoolId: string): Promise<number> {
    return prisma.schoolChildEnrollment.count({
      where: { schoolId, status: 'PENDING' },
    });
  }

  /** Count of enrollments created since a given date. */
  countEnrollmentsSince(schoolId: string, since: Date): Promise<number> {
    return prisma.schoolChildEnrollment.count({
      where: { schoolId, createdAt: { gte: since } },
    });
  }

  /** Count of reports with a specific status, optionally since a given date. */
  countReportsWithStatus(schoolId: string, status: string, since?: Date): Promise<number> {
    return prisma.activityReport.count({
      where: {
        schoolId,
        status,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    });
  }

  /** Count of reports with activityDate before a given date. */
  countReportsBefore(schoolId: string, before: Date): Promise<number> {
    return prisma.activityReport.count({
      where: {
        schoolId,
        activityDate: { lt: before },
      },
    });
  }

  /** Count of reports with activityDate between two dates. */
  countReportsBetween(schoolId: string, from: Date, to: Date): Promise<number> {
    return prisma.activityReport.count({
      where: {
        schoolId,
        activityDate: { gte: from, lt: to },
      },
    });
  }

  /** Latest N reports with child relation included. */
  listRecentReports(schoolId: string, limit: number) {
    return prisma.activityReport.findMany({
      where: { schoolId },
      include: { child: { select: { firstName: true } } },
      orderBy: { activityDate: 'desc' },
      take: limit,
    });
  }

  /** DRAFT reports for the school. */
  listDraftReports(schoolId: string): Promise<ActivityReport[]> {
    return prisma.activityReport.findMany({
      where: { schoolId, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Pending notifications for the school. */
  listPendingNotifications(schoolId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { schoolId, status: 'UNREAD' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Find a parent by id. */
  findParentById(parentId: string): Promise<Parent | null> {
    return prisma.parent.findUnique({ where: { id: parentId } });
  }

  /**
   * Create a new student: parent (guardian) + child + enrollment in a single transaction.
   * Returns all three records.
   */
  async createStudent(input: {
    guardian: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      phoneNumber: string | undefined;
      socialMediaAccount: string | undefined;
    };
    child: {
      firstName: string;
      dateOfBirth: Date;
      photoUrl: string | undefined;
      address: string | undefined;
    };
    schoolId: string;
  }): Promise<{ parent: Parent; child: Child; enrollment: SchoolChildEnrollment }> {
    return prisma.$transaction(
      async (tx) => {
        const parent = await tx.parent.create({
          data: {
            email: input.guardian.email,
            passwordHash: input.guardian.passwordHash,
            firstName: input.guardian.firstName,
            lastName: input.guardian.lastName,
            role: 'PARENT',
            phoneNumber: input.guardian.phoneNumber ?? null,
            socialMediaAccount: input.guardian.socialMediaAccount ?? null,
            preference: { create: {} },
          },
        });

        const child = await tx.child.create({
          data: {
            parentId: parent.id,
            firstName: input.child.firstName,
            dateOfBirth: input.child.dateOfBirth,
            photoUrl: input.child.photoUrl ?? null,
            address: input.child.address ?? null,
          },
        });

        const enrollment = await tx.schoolChildEnrollment.create({
          data: {
            schoolId: input.schoolId,
            childId: child.id,
            status: 'PENDING',
          },
        });

        return { parent, child, enrollment };
      },
      { isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel },
    );
  }

  /**
   * The one enrollment row for (schoolId, childId) — null when the child is
   * not enrolled at this school. Every edit/remove path must go through this
   * so a school can never touch another school's enrollment.
   */
  findEnrollmentForSchool(
    schoolId: string,
    childId: string,
  ): Promise<SchoolChildEnrollment | null> {
    return prisma.schoolChildEnrollment.findUnique({
      where: { schoolId_childId: { schoolId, childId } },
    });
  }

  /** Update child profile fields (school granted access via the enrollment). */
  updateChildFields(
    childId: string,
    data: {
      firstName?: string;
      lastName?: string | null;
      dateOfBirth?: Date;
      notes?: string | null;
      photoUrl?: string | null;
      address?: string | null;
    },
  ): Promise<Child> {
    return prisma.child.update({ where: { id: childId }, data });
  }

  /** Update an enrollment row (status / leadSpecialistId), school-scoped by caller. */
  updateEnrollment(
    enrollmentId: string,
    data: { status?: SchoolChildEnrollmentStatus; leadSpecialistId?: string | null },
  ): Promise<SchoolChildEnrollment> {
    return prisma.schoolChildEnrollment.update({ where: { id: enrollmentId }, data });
  }

  /**
   * DATA INTEGRITY: removes the student FROM THE SCHOOL by ending the
   * SchoolChildEnrollment — never deletes the parent-owned Child record.
   * Idempotent: ending an already-ended enrollment is a no-op write.
   */
  endEnrollment(enrollmentId: string): Promise<SchoolChildEnrollment> {
    return prisma.schoolChildEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'REJECTED', endDate: new Date() },
    });
  }

  /** School-scoped staff existence check for lead-specialist assignment. */
  findStaffByIdForSchool(staffId: string, schoolId: string): Promise<SchoolStaff | null> {
    return prisma.schoolStaff.findFirst({ where: { id: staffId, schoolId } });
  }

  // ── Enrollment Stats & Student List ────────────────────────────────

  /** Total enrollments for the school (all statuses). */
  countAllEnrollments(schoolId: string): Promise<number> {
    return prisma.schoolChildEnrollment.count({ where: { schoolId } });
  }

  /** Count of enrollments for a given status. */
  countEnrollmentsByStatus(schoolId: string, status: SchoolChildEnrollmentStatus): Promise<number> {
    return prisma.schoolChildEnrollment.count({
      where: { schoolId, status },
    });
  }

  /** Paginated enrolled students with child, enrollment, and staff info. */
  async getEnrolledStudents(
    schoolId: string,
    filters: {
      status?: SchoolChildEnrollmentStatus | undefined;
      specialistId?: string | undefined;
      search?: string | undefined;
    },
    pagination: { skip: number; take: number },
  ) {
    const where: Prisma.SchoolChildEnrollmentWhereInput = {
      schoolId,
      ...(filters.status !== undefined && {
        status: filters.status,
      }),
      ...(filters.specialistId !== undefined && {
        // Filter by staff: need to check staff's parent owns reports for children in enrollment
        child: {
          activityReports: {
            some: { reporterId: filters.specialistId },
          },
        },
      }),
      ...(filters.search && {
        OR: [
          { child: { firstName: { contains: filters.search } } },
          { childId: { contains: filters.search } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.schoolChildEnrollment.findMany({
        where,
        select: {
          id: true,
          childId: true,
          status: true,
          startDate: true,
          child: {
            select: {
              id: true,
              firstName: true,
              dateOfBirth: true,
              parent: {
                select: { lastName: true },
              },
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.schoolChildEnrollment.count({ where }),
    ]);

    return { items, total };
  }

  /** Get lead specialists (staff members) for a school for the filter dropdown. */
  async getLeadSpecialists(schoolId: string) {
    return prisma.schoolStaff.findMany({
      where: { schoolId },
      include: {
        parent: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Get latest activity report performance metrics for a set of child IDs. */
  async getLatestPerformanceMetrics(
    schoolId: string,
    childIds: string[],
  ): Promise<Map<string, number>> {
    if (childIds.length === 0) return new Map();
    const reports = await prisma.activityReport.findMany({
      where: {
        schoolId,
        childId: { in: childIds },
        status: 'SUBMITTED',
        performanceMetrics: { not: Prisma.JsonNull },
      },
      orderBy: { activityDate: 'desc' },
      select: { childId: true, performanceMetrics: true },
    });
    const seen = new Set<string>();
    const map = new Map<string, number>();
    for (const report of reports) {
      if (seen.has(report.childId)) continue;
      seen.add(report.childId);
      const metrics = report.performanceMetrics as Record<string, unknown> | null;
      if (metrics && typeof metrics === 'object') {
        // Look for the 'communication' key as specified in the requirements.
        // Fall back to legacy keys for backward compatibility.
        const progress =
          metrics['communication'] ?? metrics['communicationScore'] ?? metrics['progress'];
        if (typeof progress === 'number') {
          map.set(report.childId, progress);
        }
      }
    }
    return map;
  }

  /**
   * Get the reporterId from the most recent SUBMITTED activity report for each child.
   * Used to infer the "Lead Specialist" when no explicit assignment exists.
   * Returns a map of childId -> reporterId.
   */
  async getLatestReportersForChildren(
    schoolId: string,
    childIds: string[],
  ): Promise<Map<string, string>> {
    if (childIds.length === 0) return new Map();
    const reports = await prisma.activityReport.findMany({
      where: {
        schoolId,
        childId: { in: childIds },
        status: 'SUBMITTED',
      },
      orderBy: { activityDate: 'desc' },
      select: { childId: true, reporterId: true },
    });
    const seen = new Set<string>();
    const map = new Map<string, string>();
    for (const report of reports) {
      if (seen.has(report.childId)) continue;
      seen.add(report.childId);
      map.set(report.childId, report.reporterId);
    }
    return map;
  }
}
