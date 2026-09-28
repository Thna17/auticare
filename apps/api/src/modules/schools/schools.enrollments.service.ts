import type {
  CreateSchoolStudentRequest,
  CreateSchoolStudentResponse,
  EnrollmentStatsResponse,
  EnrolledStudentsListResponse,
  EnrolledStudent,
  LeadSpecialistResponse,
  SchoolChildEnrollmentStatus,
} from '@auticare/contracts';
import { AppError, forbidden } from '../../common/errors/app-error.js';
import { PasswordService } from '../auth/password.service.js';
import { SchoolsRepository } from './schools.repository.js';

type Actor = { parentId: string; role: string };

/** Shape of a staff row returned by getLeadSpecialists (repo). */
interface StaffRow {
  parentId: string;
  title: string | null;
  parent: { firstName: string; lastName: string };
}

export class SchoolEnrollmentsService {
  constructor(
    private readonly repository = new SchoolsRepository(),
    private readonly passwordService = new PasswordService(),
  ) {}

  /** Dashboard statistics for the enrollment page. */
  async getEnrollmentStats(actor: Actor): Promise<EnrollmentStatsResponse> {
    const staff = await this.requireSchoolStaff(actor);
    const schoolId = staff.schoolId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalStudents, activePrograms, newStudentsThisMonth] = await Promise.all([
      this.repository.countAllEnrollments(schoolId),
      this.repository.countEnrollmentsByStatus(schoolId, 'ACTIVE'),
      this.repository.countEnrollmentsSince(schoolId, startOfMonth),
    ]);

    // Calculate average progress from latest performance metrics
    const enrollments = await this.repository.listEnrollmentsWithChildForSchool(schoolId);
    const childIds = enrollments.map((e) => e.childId);
    const metrics = await this.repository.getLatestPerformanceMetrics(schoolId, childIds);

    let averageProgress = 0;
    let needsAttention = 0;

    if (enrollments.length > 0) {
      let totalProgress = 0;
      let metricCount = 0;

      for (const enrollment of enrollments) {
        const progress = metrics.get(enrollment.childId) ?? 0;
        totalProgress += progress;
        if (progress > 0) metricCount++;

        // "Needs Attention": progress < 30% OR status = PENDING
        if (progress < 30 || enrollment.status === 'PENDING') {
          needsAttention++;
        }
      }

      averageProgress = metricCount > 0 ? Math.round(totalProgress / metricCount) : 0;
    }

    // Participation rate = active programs / total * 100
    const participationRate =
      totalStudents > 0 ? Math.round((activePrograms / totalStudents) * 100) : 0;

    return {
      totalStudents,
      newStudentsThisMonth,
      activePrograms,
      participationRate,
      averageProgress,
      needsAttention,
    };
  }

  /** Paginated list of enrolled students with enriched data. */
  async getEnrolledStudents(
    actor: Actor,
    filters: {
      status?: string;
      specialistId?: string;
      search?: string;
    },
    pagination: { page: number; limit: number },
  ): Promise<EnrolledStudentsListResponse> {
    const staff = await this.requireSchoolStaff(actor);
    const schoolId = staff.schoolId;

    const skip = (pagination.page - 1) * pagination.limit;
    const { items, total } = await this.repository.getEnrolledStudents(
      schoolId,
      {
        status: filters.status,
        specialistId: filters.specialistId,
        search: filters.search,
      },
      { skip, take: pagination.limit },
    );

    // Get performance metrics for the current page of students
    const childIds = items.map((item) => item.childId);
    const metrics = await this.repository.getLatestPerformanceMetrics(schoolId, childIds);

    // Get staff info for lead specialist assignment
    const staffMembers = await this.repository.getLeadSpecialists(schoolId);
    const staffByParentId = new Map(
      staffMembers.map((s) => [
        s.parentId,
        {
          id: s.parentId,
          firstName: s.parent.firstName,
          lastName: s.parent.lastName,
          title: s.title,
        },
      ]),
    );

    // Build a map of childId -> lead specialist from the latest activity reports.
    // This resolves the "Lead Specialist" column without requiring a schema-level
    // leadSpecialistId by looking at who actually reported for the child most recently.
    const reporterMap = await this.repository.getLatestReportersForChildren(schoolId, childIds);

    const students: EnrolledStudent[] = items.map((item) => {
      // Resolve lead specialist in priority order:
      // 1. Explicitly assigned leadSpecialistId on the enrollment
      // 2. The reporter of the child's most recent activity report
      // 3. Fallback to the first staff member for the school
      const leadSpecialist = this.resolveLeadSpecialist(
        item.childId,
        item as { leadSpecialistId?: string | null },
        reporterMap,
        staffByParentId,
        staffMembers,
      );

      return {
        id: item.child.id,
        firstName: item.child.firstName,
        lastName: item.child.parent?.lastName ?? '',
        enrollmentStatus: item.status as SchoolChildEnrollmentStatus,
        startDate: item.startDate.toISOString().slice(0, 10),
        leadSpecialist,
        communicationProgress: metrics.get(item.childId) ?? 0,
        dateOfBirth: item.child.dateOfBirth
          ? item.child.dateOfBirth.toISOString().slice(0, 10)
          : undefined,
      };
    });

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      students,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
      },
    };
  }

  /** List of staff members (lead specialists) for the filter dropdown. */
  async getLeadSpecialists(actor: Actor): Promise<LeadSpecialistResponse[]> {
    const staff = await this.requireSchoolStaff(actor);
    const staffMembers = await this.repository.getLeadSpecialists(staff.schoolId);
    return staffMembers.map((s) => ({
      id: s.parentId,
      firstName: s.parent.firstName,
      lastName: s.parent.lastName,
      title: s.title,
    }));
  }

  /**
   * Create a new student: creates a guardian (Parent) account, a Child profile,
   * and a PENDING enrollment linking the child to the authenticated school.
   */
  async createStudent(
    actor: Actor,
    input: CreateSchoolStudentRequest,
  ): Promise<CreateSchoolStudentResponse> {
    const staff = await this.requireSchoolStaff(actor);
    const schoolId = staff.schoolId;

    // Check for duplicate guardian email
    const email = input.guardianEmail.toLowerCase().trim();
    const existing = await this.repository.findParentByEmail(email);
    if (existing) {
      throw new AppError('CONFLICT', 'An account with this guardian email already exists.', 409);
    }

    // Generate a random temporary password (guardian will need to reset it)
    const tempPassword = this.generateTempPassword();
    const passwordHash = await this.passwordService.hash(tempPassword);

    const result = await this.repository.createStudent({
      guardian: {
        email,
        passwordHash,
        firstName: input.guardianFirstName.trim(),
        lastName: input.guardianLastName.trim(),
        phoneNumber: input.guardianPhone?.trim() ?? undefined,
        socialMediaAccount: input.guardianSocialMedia?.trim() ?? undefined,
      },
      child: {
        firstName: input.firstName.trim(),
        dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00.000Z`),
        photoUrl: input.photoUrl ?? undefined,
        address: input.address?.trim() ?? undefined,
      },
      schoolId,
    });

    return {
      student: {
        id: result.child.id,
        firstName: result.child.firstName,
        dateOfBirth: result.child.dateOfBirth.toISOString().slice(0, 10),
        photoUrl: result.child.photoUrl ?? null,
        address: result.child.address ?? null,
      },
      guardian: {
        id: result.parent.id,
        firstName: result.parent.firstName,
        lastName: result.parent.lastName,
        email: result.parent.email,
        phoneNumber: result.parent.phoneNumber ?? null,
        socialMediaAccount: result.parent.socialMediaAccount ?? null,
      },
      enrollment: {
        id: result.enrollment.id,
        schoolId: result.enrollment.schoolId,
        childId: result.enrollment.childId,
        status: result.enrollment.status,
        startDate: result.enrollment.startDate.toISOString(),
        endDate: result.enrollment.endDate?.toISOString() ?? null,
      },
    };
  }

  /** Generate a random temporary password for the guardian account. */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Resolve the lead specialist for a child using priority order:
   * 1. Explicitly assigned leadSpecialistId on the enrollment
   * 2. The reporter of the child's most recent activity report
   * 3. Fallback to the first staff member for the school
   */
  private resolveLeadSpecialist(
    childId: string,
    enrollment: { leadSpecialistId?: string | null },
    reporterMap: Map<string, string>, // childId -> reporterId
    staffByParentId: Map<string, LeadSpecialistResponse>,
    staffMembers: StaffRow[],
  ): LeadSpecialistResponse | null {
    // Priority 1: Explicit leadSpecialistId on enrollment
    if (enrollment.leadSpecialistId) {
      const byId = staffByParentId.get(enrollment.leadSpecialistId);
      if (byId) return byId;
    }

    // Priority 2: Reporter from the most recent activity report
    const reporterId = reporterMap.get(childId);
    if (reporterId) {
      const byReporter = staffByParentId.get(reporterId);
      if (byReporter) return byReporter;
    }

    // Priority 3: First staff member for the school
    const first = staffMembers[0];
    if (first) {
      return {
        id: first.parentId,
        firstName: first.parent.firstName,
        lastName: first.parent.lastName,
        title: first.title,
      };
    }

    return null;
  }

  /** Ensures the caller is a school staff member. */
  private async requireSchoolStaff(actor: Actor) {
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }
}
