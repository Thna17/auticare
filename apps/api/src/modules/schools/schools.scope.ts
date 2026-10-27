import type { SchoolStaff } from '@prisma/client';
import { forbidden } from '../../common/errors/app-error.js';
import { SchoolTeamRepository } from './schools.team.repository.js';

/**
 * What a school staff member may see.
 *
 * The school's ADMIN sees every child at the school (`childIds` is null). A
 * TEACHER sees only the children they are assigned to, as lead specialist or
 * as one of the child's teachers.
 */
export type StaffScope = {
  staffId: string;
  schoolId: string;
  isAdmin: boolean;
  childIds: string[] | null;
};

export const resolveStaffScope = async (
  staff: SchoolStaff,
  repository = new SchoolTeamRepository(),
): Promise<StaffScope> => {
  const isAdmin = staff.role === 'ADMIN';
  return {
    staffId: staff.id,
    schoolId: staff.schoolId,
    isAdmin,
    childIds: isAdmin ? null : await repository.assignedChildIds(staff.id, staff.schoolId),
  };
};

export const canSeeChild = (scope: StaffScope, childId: string): boolean =>
  scope.childIds === null || scope.childIds.includes(childId);

/** For actions that change who is at the school: staff, codes, enrollments. */
export const requireSchoolAdmin = (staff: SchoolStaff): void => {
  if (staff.role !== 'ADMIN') throw forbidden('Only your school admin can do this.');
};
