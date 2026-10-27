import { appointmentStatuses } from '@auticare/contracts';
import type {
  AppointmentStatus,
  DoctorRequest,
  UpdateAppointmentStatusRequest,
  UpdateHospitalProfileRequest,
  UserRole,
} from '@auticare/contracts';
import type { Doctor } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { HospitalManagementRepository } from './hospital-management.repository.js';
import type { AppointmentWithRelations } from './hospital-management.repository.js';
import { requireHospitalAdmin, resolveHospitalScope } from './hospital.scope.js';

type Actor = { parentId: string; role: UserRole };

const isAppointmentStatus = (value: string): value is AppointmentStatus =>
  (appointmentStatuses as readonly string[]).includes(value);

const mapDoctor = (d: Doctor) => ({
  id: d.id,
  hospitalId: d.hospitalId,
  fullName: d.fullName,
  specialty: d.specialty,
  bio: d.bio,
  availableDays: d.availableDays,
  startHour: d.startHour,
  endHour: d.endHour,
  slotDurationMinutes: d.slotDurationMinutes,
  timezone: d.timezone,
});

const normalizeDays = (days?: string | readonly string[]): string | undefined => {
  if (!days) return undefined;
  const list: readonly string[] = typeof days === 'string' ? days.split(',') : days;
  const dayMap: Record<string, number> = {
    sun: 0,
    sunday: 0,
    '0': 0,
    mon: 1,
    monday: 1,
    '1': 1,
    tue: 2,
    tuesday: 2,
    '2': 2,
    wed: 3,
    wednesday: 3,
    '3': 3,
    thu: 4,
    thursday: 4,
    '4': 4,
    fri: 5,
    friday: 5,
    '5': 5,
    sat: 6,
    saturday: 6,
    '6': 6,
  };
  const mapped = list
    .map((d: string) => dayMap[d.trim().toLowerCase()])
    .filter((n: number | undefined): n is number => n !== undefined);
  if (mapped.length > 0) {
    return Array.from(new Set(mapped)).sort().join(',');
  }
  return typeof days === 'string' ? days : days.join(',');
};

const mapAppointment = (a: AppointmentWithRelations) => ({
  id: a.id,
  parentId: a.parentId,
  childId: a.childId,
  childName: a.child ? `${a.child.firstName} ${a.child.lastName ?? ''}`.trim() : null,
  hospitalId: a.hospitalId,
  hospitalName: a.hospital.name,
  doctorId: a.doctorId,
  doctorName: a.doctor?.fullName ?? null,
  scheduledAt: a.scheduledAt.toISOString(),
  status: a.status,
  reason: a.reason,
  rejectionReason: a.rejectionReason,
  parentName: `${a.parent.firstName} ${a.parent.lastName}`.trim(),
  parentEmail: a.parent.email,
  parentPhoneNumber: a.parent.phoneNumber ?? null,
  childDateOfBirth: a.child?.dateOfBirth ? a.child.dateOfBirth.toISOString().slice(0, 10) : null,
  childNotes: a.child?.notes ?? null,
});

export class HospitalManagementService {
  constructor(private readonly repository = new HospitalManagementRepository()) {}

  private async staff(actor: Actor) {
    if (actor.role !== 'HOSPITAL') throw forbidden();
    const staff = await this.repository.staff(actor.parentId);
    if (!staff) throw forbidden();
    return staff;
  }

  async me(actor: Actor) {
    const staff = await this.staff(actor);
    const scope = resolveHospitalScope(staff);
    const phone = staff.parent.phoneNumber ?? null;
    return {
      staff: {
        id: staff.id,
        parentId: staff.parentId,
        hospitalId: staff.hospitalId,
        title: staff.title,
        phone,
      },
      staffRole: scope.role,
      hospital: {
        id: staff.hospital.id,
        name: staff.hospital.name,
        city: staff.hospital.city,
        address: staff.hospital.address,
        services: staff.hospital.services,
        phone,
        createdAt: staff.hospital.createdAt.toISOString(),
        updatedAt: staff.hospital.updatedAt.toISOString(),
      },
    };
  }

  async updateProfile(actor: Actor, input: UpdateHospitalProfileRequest) {
    const staff = await this.staff(actor);
    requireHospitalAdmin(staff);

    const update: {
      name?: string;
      city?: string;
      address?: string;
      services?: string;
    } = {};

    if (input.name !== undefined) update.name = input.name.trim();
    if (input.city !== undefined) update.city = input.city.trim();
    if (input.address !== undefined) update.address = input.address.trim();
    if (input.services !== undefined) {
      update.services = input.services.trim();
    } else if (input.description !== undefined && input.description !== null) {
      const desc = input.description.trim();
      if (desc) update.services = desc;
    }

    if (Object.keys(update).length > 0) {
      await this.repository.updateHospital(staff.hospitalId, update);
    }

    if (input.phone !== undefined) {
      await this.repository.updateStaffPhone(staff.parentId, input.phone?.trim() || null);
    }

    return this.me(actor);
  }

  async appointments(
    actor: Actor,
    // `| undefined` is explicit because exactOptionalPropertyTypes is on and the
    // controller always passes all four keys, some of them undefined.
    filters: {
      status?: string | undefined;
      doctorId?: string | undefined;
      from?: string | undefined;
      to?: string | undefined;
    },
  ) {
    const staff = await this.staff(actor);
    const scope = resolveHospitalScope(staff);

    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())))
      throw new AppError('VALIDATION_ERROR', 'Invalid date filter.', 400);

    // `status` comes from the query string; narrow it before it reaches Prisma.
    // It was previously `any`, so an unrecognised value reached the query and
    // surfaced as a 500 rather than a 400.
    let status: AppointmentStatus | undefined;
    if (filters.status !== undefined) {
      if (!isAppointmentStatus(filters.status))
        throw new AppError(
          'VALIDATION_ERROR',
          `status must be one of: ${appointmentStatuses.join(', ')}.`,
          400,
        );
      status = filters.status;
    }

    // A DOCTOR only ever sees their own appointments; any doctorId they send is ignored.
    // One whose doctor record was deleted (doctorId set to null) sees nothing, never
    // the whole hospital.
    let effectiveDoctorId = filters.doctorId;
    if (scope.role === 'DOCTOR') {
      if (!scope.doctorId) return [];
      effectiveDoctorId = scope.doctorId;
    }

    const filter = {
      ...(status ? { status } : {}),
      ...(effectiveDoctorId ? { doctorId: effectiveDoctorId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    };
    return (await this.repository.appointments(staff.hospitalId, filter)).map(mapAppointment);
  }

  async changeStatus(actor: Actor, id: string, input: UpdateAppointmentStatusRequest) {
    const staff = await this.staff(actor);
    const scope = resolveHospitalScope(staff);

    // Same rule as the list: a DOCTOR may only touch their own appointments.
    let doctorScopeId: string | undefined;
    if (scope.role === 'DOCTOR') {
      if (!scope.doctorId) throw notFound('Appointment was not found.');
      doctorScopeId = scope.doctorId;
    }
    const appointment = await this.repository.appointment(id, staff.hospitalId, doctorScopeId);
    if (!appointment) throw notFound('Appointment was not found.');

    const valid: Record<string, string[]> = {
      REQUESTED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      CANCELLED: [],
      COMPLETED: [],
    };
    if (!(valid[appointment.status] ?? []).includes(input.status))
      throw new AppError(
        'VALIDATION_ERROR',
        'This appointment status transition is not allowed.',
        400,
      );

    // The explanation is a *rejection* reason, so it is only stored when the
    // request is actually being rejected. A reason sent with any other status is
    // ignored rather than recorded against, say, a confirmation.
    const rejectionReason =
      input.status === 'CANCELLED' && input.reason !== undefined && input.reason !== ''
        ? input.reason
        : undefined;
    return mapAppointment(await this.repository.updateStatus(id, input.status, rejectionReason));
  }

  async doctors(actor: Actor) {
    const staff = await this.staff(actor);
    return (await this.repository.doctors(staff.hospitalId)).map(mapDoctor);
  }

  async createDoctor(actor: Actor, input: DoctorRequest) {
    const staff = await this.staff(actor);
    requireHospitalAdmin(staff);

    const availableDays =
      input.availableDays !== undefined ? normalizeDays(input.availableDays) : undefined;
    return mapDoctor(
      await this.repository.createDoctor(staff.hospitalId, {
        fullName: input.fullName.trim(),
        specialty: input.specialty.trim(),
        bio: input.bio?.trim() || null,
        ...(availableDays !== undefined ? { availableDays } : {}),
        ...(input.startHour !== undefined ? { startHour: input.startHour } : {}),
        ...(input.endHour !== undefined ? { endHour: input.endHour } : {}),
        ...(input.slotDurationMinutes !== undefined
          ? { slotDurationMinutes: input.slotDurationMinutes }
          : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      }),
    );
  }

  async updateDoctor(actor: Actor, id: string, input: Partial<DoctorRequest>) {
    const staff = await this.staff(actor);
    requireHospitalAdmin(staff);

    if (!(await this.repository.doctor(id, staff.hospitalId)))
      throw notFound('Doctor was not found.');
    const availableDays =
      input.availableDays !== undefined ? normalizeDays(input.availableDays) : undefined;
    return mapDoctor(
      await this.repository.updateDoctor(id, {
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
        ...(input.specialty !== undefined ? { specialty: input.specialty.trim() } : {}),
        ...(input.bio !== undefined ? { bio: input.bio?.trim() || null } : {}),
        ...(availableDays !== undefined ? { availableDays } : {}),
        ...(input.startHour !== undefined ? { startHour: input.startHour } : {}),
        ...(input.endHour !== undefined ? { endHour: input.endHour } : {}),
        ...(input.slotDurationMinutes !== undefined
          ? { slotDurationMinutes: input.slotDurationMinutes }
          : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      }),
    );
  }

  async deleteDoctor(actor: Actor, id: string) {
    const staff = await this.staff(actor);
    requireHospitalAdmin(staff);

    if (!(await this.repository.doctor(id, staff.hospitalId)))
      throw notFound('Doctor was not found.');
    if (!(await this.repository.deleteDoctor(id)))
      throw new AppError('CONFLICT', 'Doctors with appointment history cannot be deleted.', 409);
  }
}
