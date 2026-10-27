import type {
  ConnectionPreviewResponse,
  ConnectSchoolRequest,
  ParentSchoolConnection,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import { auditService } from '../audit/audit.service.js';
import { hashShortCode } from '../auth/short-code.js';
import { SchoolTeamRepository } from '../schools/schools.team.repository.js';
import { staffIdsOf } from '../schools/schools.team.service.js';

type Actor = { parentId: string; role: string };

/** One message for every unusable code, so codes cannot be probed by state. */
const codeNotValid = () =>
  new AppError(
    'VALIDATION_ERROR',
    'This code is not valid. It may have expired or already been used — ask your school for a new one.',
    400,
  );

/**
 * The parent's side of a school connection.
 *
 * A school hands the family a single-use code in person. The parent previews
 * it, picks one of their children and consents; only then does the school get
 * access, and only to that child's enrollment and the reports its teachers
 * write. The parent's screenings, notes and assistant conversations are never
 * part of the connection.
 */
export class ConnectionsService {
  constructor(private readonly team = new SchoolTeamRepository()) {}

  async preview(actor: Actor, code: string): Promise<ConnectionPreviewResponse> {
    this.requireParent(actor);
    const record = await this.findOpenCode(code);
    const teachers = await this.team.staffNames(staffIdsOf(record.teacherStaffIds));
    return {
      school: record.school,
      label: record.label,
      expiresAt: record.expiresAt.toISOString(),
      teachers: teachers.map((teacher) => ({
        firstName: teacher.parent.firstName,
        lastName: teacher.parent.lastName,
        title: teacher.title,
      })),
    };
  }

  async connect(actor: Actor, input: ConnectSchoolRequest): Promise<ParentSchoolConnection> {
    this.requireParent(actor);
    const record = await this.findOpenCode(input.code);

    const child = await this.team.findOwnedActiveChild(input.childId, actor.parentId);
    if (!child) throw notFound('Child profile was not found.');

    const existing = await this.team.findEnrollment(record.schoolId, child.id);
    if (existing && (existing.status === 'ACTIVE' || existing.status === 'PENDING')) {
      throw new AppError(
        'CONFLICT',
        `${child.firstName} is already connected to ${record.school.name}.`,
        409,
      );
    }

    // Teachers named on the code are assigned only if still at the school.
    const teacherIds = staffIdsOf(record.teacherStaffIds);
    const activeTeachers = await this.team.findActiveStaffIn(record.schoolId, teacherIds);
    const creator = record.createdByStaffId
      ? await this.team.findStaffParentId(record.createdByStaffId)
      : null;

    const enrollment = await this.team.redeemConnectionCode({
      codeId: record.id,
      schoolId: record.schoolId,
      childId: child.id,
      parentId: actor.parentId,
      teacherStaffIds: activeTeachers.map((teacher) => teacher.id),
      notifyParentId: creator?.parentId ?? null,
      childFirstName: child.firstName,
    });
    // Lost a race with another redemption of the same code.
    if (!enrollment) throw codeNotValid();

    await auditService.record({
      action: 'SCHOOL_CONNECTION_REDEEMED',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: enrollment.id,
      metadata: { schoolId: record.schoolId, childId: child.id, codeId: record.id },
    });

    const connection = (await this.list(actor)).find((item) => item.enrollmentId === enrollment.id);
    if (!connection) throw notFound('Connection was not found.');
    return connection;
  }

  async list(actor: Actor): Promise<ParentSchoolConnection[]> {
    this.requireParent(actor);
    const enrollments = await this.team.listConnectionsForParent(actor.parentId);
    const counts = await this.team.submittedReportCounts(
      enrollments.map((enrollment) => ({
        schoolId: enrollment.schoolId,
        childId: enrollment.childId,
      })),
    );

    return enrollments.map((enrollment) => {
      // Lead specialist first, then every other active assigned teacher.
      const teachers = [
        ...(enrollment.leadSpecialist
          ? [
              {
                firstName: enrollment.leadSpecialist.parent.firstName,
                lastName: enrollment.leadSpecialist.parent.lastName,
                title: enrollment.leadSpecialist.title,
              },
            ]
          : []),
        ...enrollment.teachers
          .filter((row) => !row.staff.deactivatedAt && row.staff.id !== enrollment.leadSpecialistId)
          .map((row) => ({
            firstName: row.staff.parent.firstName,
            lastName: row.staff.parent.lastName,
            title: row.staff.title,
          })),
      ];

      return {
        enrollmentId: enrollment.id,
        status: enrollment.status,
        startDate: enrollment.startDate.toISOString().slice(0, 10),
        child: enrollment.child,
        school: enrollment.school,
        teachers,
        reportCount: counts.get(`${enrollment.schoolId}:${enrollment.childId}`) ?? 0,
      };
    });
  }

  /** The parent ends the connection. Reports already shared stay visible. */
  async disconnect(actor: Actor, enrollmentId: string): Promise<{ disconnected: true }> {
    this.requireParent(actor);
    const enrollment = await this.team.findParentEnrollment(enrollmentId, actor.parentId);
    if (!enrollment || !['ACTIVE', 'PENDING'].includes(enrollment.status)) {
      throw notFound('Connection was not found.');
    }
    await this.team.endEnrollment(enrollment.id);
    await auditService.record({
      action: 'SCHOOL_CONNECTION_ENDED_BY_PARENT',
      actorId: actor.parentId,
      actorRole: actor.role,
      targetId: enrollment.id,
      metadata: { schoolId: enrollment.schoolId, childId: enrollment.childId },
    });
    return { disconnected: true };
  }

  private async findOpenCode(code: string) {
    const record = await this.team.findConnectionCodeByHash(
      hashShortCode(code, env.JWT_ACCESS_SECRET, 'school-connection'),
    );
    if (!record || record.usedAt || record.revokedAt || record.expiresAt <= new Date()) {
      throw codeNotValid();
    }
    return record;
  }

  private requireParent(actor: Actor): void {
    if (actor.role !== 'PARENT') throw forbidden();
  }
}
