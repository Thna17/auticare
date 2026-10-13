import type { Prisma, AppointmentStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
/**
 * Relations included in hospital appointment queries:
 * - child: includes dateOfBirth, notes, and identification
 * - parent: includes email, phoneNumber, and guardian names
 * - doctor: includes specialist profile and availability
 * - hospital: includes facility metadata
 */
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
    return prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: { status, ...(rejectionReason !== undefined ? { rejectionReason } : {}) },
        include,
      });

      const title =
        status === 'CONFIRMED'
          ? 'Appointment Confirmed'
          : status === 'CANCELLED'
            ? 'Appointment Cancelled'
            : status === 'COMPLETED'
              ? 'Appointment Completed'
              : 'Appointment Updated';

      let body = `Your appointment status is now ${status.toLowerCase()}.`;

      if (status === 'CONFIRMED') {
        body = `Your appointment at ${updated.hospital.name} with ${updated.doctor?.fullName ?? 'specialist'} on ${updated.scheduledAt.toLocaleDateString()} has been confirmed.`;
      } else if (status === 'CANCELLED') {
        body = rejectionReason
          ? `Your appointment request at ${updated.hospital.name} was cancelled: ${rejectionReason}`
          : `Your appointment request at ${updated.hospital.name} was cancelled by the hospital.`;
      } else if (status === 'COMPLETED') {
        body = `Your appointment at ${updated.hospital.name} with ${updated.doctor?.fullName ?? 'specialist'} has been marked as completed.`;
      }

      await tx.notification.create({
        data: {
          parentId: updated.parentId,
          type: 'APPOINTMENT',
          status: 'UNREAD',
          title,
          body,
          appointmentId: updated.id,
        },
      });

      return updated;
    });
  }
  doctors(hospitalId: string) {
    return prisma.doctor.findMany({ where: { hospitalId }, orderBy: { fullName: 'asc' } });
  }
  createDoctor(
    hospitalId: string,
    data: {
      fullName: string;
      specialty: string;
      bio: string | null;
      availableDays?: string;
      startHour?: number;
      endHour?: number;
      slotDurationMinutes?: number;
      timezone?: string;
    },
  ) {
    return prisma.doctor.create({ data: { hospitalId, ...data } });
  }
  doctor(id: string, hospitalId: string) {
    return prisma.doctor.findFirst({ where: { id, hospitalId } });
  }
  updateDoctor(
    id: string,
    data: {
      fullName?: string;
      specialty?: string;
      bio?: string | null;
      availableDays?: string;
      startHour?: number;
      endHour?: number;
      slotDurationMinutes?: number;
      timezone?: string;
    },
  ) {
    return prisma.doctor.update({ where: { id }, data });
  }
  async deleteDoctor(id: string) {
    const count = await prisma.appointment.count({ where: { doctorId: id } });
    if (count) return false;
    await prisma.doctor.delete({ where: { id } });
    return true;
  }
  updateHospital(
    id: string,
    data: {
      name?: string;
      city?: string;
      address?: string;
      services?: string;
    },
  ) {
    return prisma.hospital.update({
      where: { id },
      data,
    });
  }
  updateStaffPhone(parentId: string, phoneNumber: string | null) {
    return prisma.parent.update({
      where: { id: parentId },
      data: { phoneNumber },
    });
  }
}
