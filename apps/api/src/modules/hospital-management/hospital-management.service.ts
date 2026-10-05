import { appointmentStatuses } from '@auticare/contracts';
import type {
  AppointmentStatus,
  DoctorRequest,
  UpdateAppointmentStatusRequest,
  UserRole,
} from '@auticare/contracts';
import type { Doctor } from '@prisma/client';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { HospitalManagementRepository } from './hospital-management.repository.js';
import type { AppointmentWithRelations } from './hospital-management.repository.js';
type Actor = { parentId: string; role: UserRole };

const isAppointmentStatus = (value: string): value is AppointmentStatus =>
  (appointmentStatuses as readonly string[]).includes(value);

const mapDoctor = (d: Doctor) => ({
  id: d.id,
  hospitalId: d.hospitalId,
  fullName: d.fullName,
  specialty: d.specialty,
  bio: d.bio,
});
const mapAppointment = (a: AppointmentWithRelations) => ({
  id: a.id,
  parentId: a.parentId,
  childId: a.childId,
  childName: a.child?.firstName ?? null,
  hospitalId: a.hospitalId,
  hospitalName: a.hospital.name,
  doctorId: a.doctorId,
  doctorName: a.doctor?.fullName ?? null,
  scheduledAt: a.scheduledAt.toISOString(),
  status: a.status,
  reason: a.reason,
  rejectionReason: a.rejectionReason,
  parentName: `${a.parent.firstName} ${a.parent.lastName}`.trim(),
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
    return {
      staff: {
        id: staff.id,
        parentId: staff.parentId,
        hospitalId: staff.hospitalId,
        title: staff.title,
      },
      hospital: {
        id: staff.hospital.id,
        name: staff.hospital.name,
        city: staff.hospital.city,
        address: staff.hospital.address,
        services: staff.hospital.services,
        createdAt: staff.hospital.createdAt.toISOString(),
        updatedAt: staff.hospital.updatedAt.toISOString(),
      },
    };
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
    const filter = {
      ...(status ? { status } : {}),
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    };
    return (await this.repository.appointments(staff.hospitalId, filter)).map(mapAppointment);
  }
  async changeStatus(actor: Actor, id: string, input: UpdateAppointmentStatusRequest) {
    const staff = await this.staff(actor);
    const appointment = await this.repository.appointment(id, staff.hospitalId);
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
    return mapDoctor(
      await this.repository.createDoctor(staff.hospitalId, {
        fullName: input.fullName.trim(),
        specialty: input.specialty.trim(),
        bio: input.bio?.trim() || null,
      }),
    );
  }
  async updateDoctor(actor: Actor, id: string, input: Partial<DoctorRequest>) {
    const staff = await this.staff(actor);
    if (!(await this.repository.doctor(id, staff.hospitalId)))
      throw notFound('Doctor was not found.');
    return mapDoctor(
      await this.repository.updateDoctor(id, {
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
        ...(input.specialty !== undefined ? { specialty: input.specialty.trim() } : {}),
        ...(input.bio !== undefined ? { bio: input.bio?.trim() || null } : {}),
      }),
    );
  }
  async deleteDoctor(actor: Actor, id: string) {
    const staff = await this.staff(actor);
    if (!(await this.repository.doctor(id, staff.hospitalId)))
      throw notFound('Doctor was not found.');
    if (!(await this.repository.deleteDoctor(id)))
      throw new AppError('CONFLICT', 'Doctors with appointment history cannot be deleted.', 409);
  }
}
