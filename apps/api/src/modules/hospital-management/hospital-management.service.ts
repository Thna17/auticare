import type { DoctorRequest, UpdateAppointmentStatusRequest, UserRole } from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { HospitalManagementRepository } from './hospital-management.repository.js';
type Actor = { parentId: string; role: UserRole };
const mapDoctor = (d: any) => ({
  id: d.id,
  hospitalId: d.hospitalId,
  fullName: d.fullName,
  specialty: d.specialty,
  bio: d.bio,
});
const mapAppointment = (a: any) => ({
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
    filters: { status?: any; doctorId?: string; from?: string; to?: string },
  ) {
    const staff = await this.staff(actor);
    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())))
      throw new AppError('VALIDATION_ERROR', 'Invalid date filter.', 400);
    const filter = {
      ...(filters.status ? { status: filters.status } : {}),
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
    return mapAppointment(await this.repository.updateStatus(id, input.status));
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
