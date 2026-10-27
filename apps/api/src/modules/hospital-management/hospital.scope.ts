import type { HospitalStaff } from '@prisma/client';
import type { HospitalStaffRole } from '@auticare/contracts';
import { forbidden } from '../../common/errors/app-error.js';

/**
 * What a hospital staff member may see and do.
 *
 * - ADMIN: manages the hospital profile, doctors, and team accounts; sees all appointments.
 * - COORDINATOR: manages appointments (confirm, reject, reschedule) across all doctors; views doctors.
 * - DOCTOR: linked to one doctor record; sees only their own appointments and may change their status.
 */
export type HospitalScope = {
  staffId: string;
  hospitalId: string;
  role: HospitalStaffRole;
  doctorId: string | null;
};

export const resolveHospitalScope = (staff: HospitalStaff): HospitalScope => ({
  staffId: staff.id,
  hospitalId: staff.hospitalId,
  role: (staff.role as HospitalStaffRole) || 'COORDINATOR',
  doctorId: staff.doctorId ?? null,
});

/** For actions that modify the hospital profile, doctors, or team. */
export const requireHospitalAdmin = (staff: { role: string }): void => {
  if (staff.role !== 'ADMIN') throw forbidden('Only your hospital admin can do this.');
};

/** ADMIN and COORDINATOR can manage all appointments across the hospital. */
export const canManageAppointments = (scope: HospitalScope): boolean =>
  scope.role === 'ADMIN' || scope.role === 'COORDINATOR';
