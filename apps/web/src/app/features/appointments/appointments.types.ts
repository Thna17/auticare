import type {
  AppointmentResponse,
  AppointmentStatus,
  DoctorResponse,
  HospitalResponse,
} from '@auticare/contracts';

/**
 * NOTE: `Doctor` and `Appointment` exist as Prisma models (see
 * apps/api/prisma/schema.prisma) but are not yet exposed through
 * @auticare/contracts or an API module the way Hospital/Child are.
 * These types mirror the Prisma field names 1:1 so the eventual
 * backend module + zod contract can be dropped in without any
 * frontend changes. See AppointmentsApi for the REST shape this
 * feature expects.
 */

export type { AppointmentResponse, AppointmentStatus, DoctorResponse };

export type { CreateAppointmentRequest } from '@auticare/contracts';

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

/**
 * Maps appointment status to the shared `ac-ui-badge` tone (see
 * design-system/components/ui-badge.component.ts). This is the tone
 * source of truth going forward — `statusPresentation` above stays
 * only for the label text until every call site has migrated off its
 * hardcoded hex colors.
 */
export const statusTone: Record<AppointmentStatus, 'positive' | 'caution' | 'alert' | 'neutral'> = {
  REQUESTED: 'caution',
  CONFIRMED: 'positive',
  COMPLETED: 'neutral',
  CANCELLED: 'alert',
};

export const specialtyCategories = [
  'All',
  'Speech Therapy',
  'Occupational Therapy',
  'Pediatrician',
] as const;
export type SpecialtyCategory = (typeof specialtyCategories)[number];

export type HospitalContext = Pick<HospitalResponse, 'id' | 'name' | 'city'>;
