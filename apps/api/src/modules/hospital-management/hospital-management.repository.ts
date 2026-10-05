import type { Prisma, AppointmentStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
const include = { child: true, doctor: true, hospital: true, parent: true } as const;

/** Appointment row as this repository returns it — with all four relations loaded. */
export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof include;
}>;
export class HospitalManagementRepository {
  staff(parentId: string) {
    return prisma.hospitalStaff.findFirst({
      where: { parentId },
      include: { hospital: true, parent: true },
    });
  }
  appointments(
    hospitalId: string,
    where: { status?: AppointmentStatus; doctorId?: string; from?: Date; to?: Date },
  ) {
    return prisma.appointment.findMany({
      where: {
        hospitalId,
        ...(where.status ? { status: where.status } : {}),
        ...(where.doctorId ? { doctorId: where.doctorId } : {}),
        ...(where.from || where.to
          ? {
              scheduledAt: {
                ...(where.from ? { gte: where.from } : {}),
                ...(where.to ? { lte: where.to } : {}),
              },
            }
          : {}),
      },
      include,
      orderBy: { scheduledAt: 'asc' },
    });
  }
  appointment(id: string, hospitalId: string) {
    return prisma.appointment.findFirst({ where: { id, hospitalId }, include });
  }
  /**
   * `rejectionReason` is only passed when the hospital rejects a request; it is
   * left untouched otherwise, so an earlier explanation survives a later status
   * change rather than being blanked.
   */
  updateStatus(id: string, status: AppointmentStatus, rejectionReason?: string) {
    return prisma.appointment.update({
      where: { id },
      data: { status, ...(rejectionReason !== undefined ? { rejectionReason } : {}) },
      include,
    });
  }
  doctors(hospitalId: string) {
    return prisma.doctor.findMany({ where: { hospitalId }, orderBy: { fullName: 'asc' } });
  }
  createDoctor(
    hospitalId: string,
    data: { fullName: string; specialty: string; bio: string | null },
  ) {
    return prisma.doctor.create({ data: { hospitalId, ...data } });
  }
  doctor(id: string, hospitalId: string) {
    return prisma.doctor.findFirst({ where: { id, hospitalId } });
  }
  updateDoctor(id: string, data: { fullName?: string; specialty?: string; bio?: string | null }) {
    return prisma.doctor.update({ where: { id }, data });
  }
  async deleteDoctor(id: string) {
    const count = await prisma.appointment.count({ where: { doctorId: id } });
    if (count) return false;
    await prisma.doctor.delete({ where: { id } });
    return true;
  }
}
