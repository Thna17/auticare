import type { HospitalResponse } from '@auticare/contracts';

/**
 * NOTE: `Doctor` and `Appointment` exist as Prisma models (see
 * apps/api/prisma/schema.prisma) but are not yet exposed through
 * @auticare/contracts or an API module the way Hospital/Child are.
 * These types mirror the Prisma field names 1:1 so the eventual
 * backend module + zod contract can be dropped in without any
 * frontend changes. See AppointmentsApi for the REST shape this
 * feature expects.
 */

export const appointmentStatuses = ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export type DoctorResponse = {
  readonly id: string;
  readonly hospitalId: string;
  readonly fullName: string;
  readonly specialty: string;
  readonly bio: string | null;
};

export type AppointmentResponse = {
  readonly id: string;
  readonly parentId: string;
  readonly childId: string | null;
  readonly childName: string | null;
  readonly hospitalId: string;
  readonly hospitalName: string;
  readonly doctorId: string | null;
  readonly doctorName: string | null;
  readonly scheduledAt: string;
  readonly status: AppointmentStatus;
  readonly reason: string | null;
};

export type CreateAppointmentRequest = {
  readonly childId: string;
  readonly hospitalId: string;
  readonly doctorId: string;
  readonly scheduledAt: string;
  readonly reason?: string;
};

export type StatusPresentation = {
  readonly label: string;
  readonly foreground: string;
  readonly background: string;
};

export const statusPresentation: Record<AppointmentStatus, StatusPresentation> = {
  REQUESTED: { label: 'Pending', foreground: '#9a6a00', background: '#fef3c7' },
  CONFIRMED: { label: 'Confirmed', foreground: '#15803d', background: '#dcfce7' },
  COMPLETED: { label: 'Completed', foreground: '#1d4ed8', background: '#dbeafe' },
  CANCELLED: { label: 'Cancelled', foreground: '#b91c1c', background: '#fee2e2' },
};

export const specialtyCategories = [
  'All',
  'Speech Therapy',
  'Occupational Therapy',
  'Pediatrician',
] as const;
export type SpecialtyCategory = (typeof specialtyCategories)[number];

export type HospitalContext = Pick<HospitalResponse, 'id' | 'name' | 'city'>;
