import type { CreateAppointmentRequest, UserRole } from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { AppointmentsRepository } from './appointments.repository.js';
type Actor = { parentId: string; role: UserRole };
const map = (item: any) => ({
  id: item.id,
  parentId: item.parentId,
  childId: item.childId,
  childName: item.child?.firstName ?? null,
  hospitalId: item.hospitalId,
  hospitalName: item.hospital.name,
  doctorId: item.doctorId,
  doctorName: item.doctor?.fullName ?? null,
  scheduledAt: item.scheduledAt.toISOString(),
  status: item.status,
  reason: item.reason,
});
export class AppointmentsService {
  constructor(private readonly repository = new AppointmentsRepository()) {}
  async listDoctors(actor: Actor, hospitalId: string) {
    if (actor.role !== 'PARENT') throw forbidden();
    return (await this.repository.listDoctors(hospitalId)).map((d) => ({
      id: d.id,
      hospitalId: d.hospitalId,
      fullName: d.fullName,
      specialty: d.specialty,
      bio: d.bio,
    }));
  }
  async create(actor: Actor, input: CreateAppointmentRequest) {
    if (actor.role !== 'PARENT') throw forbidden();
    const child = await this.repository.findChild(input.childId);
    if (!child || child.parentId !== actor.parentId || child.archivedAt) throw forbidden();
    const doctor = await this.repository.findDoctor(input.doctorId);
    if (!doctor || doctor.hospitalId !== input.hospitalId)
      throw new AppError(
        'VALIDATION_ERROR',
        'The selected doctor does not belong to this hospital.',
        400,
      );
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date())
      throw new AppError('VALIDATION_ERROR', 'Appointments must be scheduled in the future.', 400);
    return map(
      await this.repository.create({
        parentId: actor.parentId,
        childId: child.id,
        hospitalId: input.hospitalId,
        doctorId: doctor.id,
        scheduledAt,
        reason: input.reason?.trim() || null,
      }),
    );
  }
  async list(actor: Actor) {
    if (actor.role !== 'PARENT') throw forbidden();
    return (await this.repository.listForParent(actor.parentId)).map(map);
  }
  async cancel(actor: Actor, id: string) {
    if (actor.role !== 'PARENT') throw forbidden();
    const appointment = await this.repository.findForParent(id, actor.parentId);
    if (!appointment) throw notFound('Appointment was not found.');
    if (!['REQUESTED', 'CONFIRMED'].includes(appointment.status))
      throw new AppError('VALIDATION_ERROR', 'This appointment can no longer be cancelled.', 400);
    return map(await this.repository.updateStatus(id, 'CANCELLED'));
  }
}
