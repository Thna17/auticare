import { forbidden } from '../../common/errors/app-error.js';
import { SchoolsRepository } from './schools.repository.js';

type Actor = { parentId: string; role: string };

export type SchoolStudent = {
  childId: string;
  firstName: string;
  dateOfBirth: string;
  enrollmentStatus: string;
  startDate: string;
};

/** Student-picker entry for the activity report form (and similar UIs). */
export type EnrolledStudentOption = {
  id: string;
  childId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  photoUrl: string | null;
  enrollmentStatus: 'ACTIVE';
  startDate: string;
};

export class SchoolStudentsService {
  constructor(private readonly repository = new SchoolsRepository()) {}

  /**
   * List children currently enrolled (ACTIVE or PENDING) in the authenticated
   * staff member's school. The schoolId is derived from the SchoolStaff record
   * linked to the user's session — it is never accepted from the request body.
   */
  async listMyStudents(actor: Actor): Promise<SchoolStudent[]> {
    const staff = await this.requireSchoolStaff(actor);

    const enrollments = await this.repository.listEnrollmentsWithChildForSchool(staff.schoolId);

    return enrollments.map((enrollment) => ({
      childId: enrollment.childId,
      firstName: enrollment.child.firstName,
      dateOfBirth: enrollment.child.dateOfBirth.toISOString().slice(0, 10),
      enrollmentStatus: enrollment.status,
      startDate: enrollment.startDate.toISOString().slice(0, 10),
    }));
  }

  /**
   * List enrollable students for student pickers (e.g. the activity report
   * form). Includes PENDING enrollments so reports can be written for newly
   * added children before activation. Includes dateOfBirth and a
   * server-computed age in years. The schoolId is derived from the caller's
   * SchoolStaff record.
   */
  async listEnrolledStudents(actor: Actor): Promise<EnrolledStudentOption[]> {
    const staff = await this.requireSchoolStaff(actor);

    const enrollments = await this.repository.listPickerEnrolledStudentsForSchool(staff.schoolId);

    return enrollments.map((enrollment) => ({
      id: enrollment.child.id,
      childId: enrollment.child.id,
      firstName: enrollment.child.firstName,
      lastName: enrollment.child.lastName ?? '',
      dateOfBirth: enrollment.child.dateOfBirth.toISOString().slice(0, 10),
      age: calculateAge(enrollment.child.dateOfBirth),
      photoUrl: enrollment.child.photoUrl ?? null,
      enrollmentStatus: enrollment.status as 'ACTIVE' | 'PENDING',
      startDate: enrollment.startDate.toISOString().slice(0, 10),
    }));
  }

  /**
   * Ensures the caller is a school staff member. Returns the staff record
   * whose `schoolId` scopes all subsequent queries to the correct school.
   */
  private async requireSchoolStaff(actor: Actor) {
    const staff = await this.repository.findStaffForParent(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }
}

/** Age in whole years, computed against today's date. */
const calculateAge = (dateOfBirth: Date): number => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
