import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

const appointmentInclude = { child: true, hospital: true, doctor: true, parent: true } as const;

/** Appointment row as this repository returns it — with its relations loaded. */
export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;
export class AppointmentsRepository {
  findChild(id: string) {
    return prisma.child.findUnique({ where: { id } });
  }
  findDoctor(id: string) {
    return prisma.doctor.findUnique({ where: { id } });
  }
  listDoctors(hospitalId: string) {
    return prisma.doctor.findMany({ where: { hospitalId }, orderBy: { fullName: 'asc' } });
  }
  findAppointmentsForDoctorBetween(doctorId: string, from: Date, to: Date) {
    return prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: from, lte: to },
        status: { in: ['REQUESTED', 'CONFIRMED'] },
      },
      select: { scheduledAt: true },
    });
  }

  createWithCollisionCheck(input: {
    parentId: string;
    childId: string;
    hospitalId: string;
    doctorId: string;
    scheduledAt: Date;
    reason: string | null;
  }) {
    return prisma.$transaction(
      async (tx) => {
        // In MySQL InnoDB, lock matching existing appointments or check collision
        const collision = await tx.appointment.findFirst({
          where: {
            doctorId: input.doctorId,
            scheduledAt: input.scheduledAt,
            status: { in: ['REQUESTED', 'CONFIRMED'] },
          },
        });
        if (collision) {
          return null;
        }

        const created = await tx.appointment.create({
          data: input,
          include: appointmentInclude,
        });

        // Create notification for parent
        await tx.notification.create({
          data: {
            parentId: input.parentId,
            type: 'APPOINTMENT',
            status: 'UNREAD',
            title: 'Appointment Requested',
            body: `Your appointment request with ${created.doctor?.fullName ?? 'specialist'} at ${created.hospital.name} on ${created.scheduledAt.toLocaleDateString()} has been submitted.`,
            appointmentId: created.id,
          },
        });

        return created;
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  rescheduleWithCollisionCheck(
    appointmentId: string,
    newScheduledAt: Date,
    reason?: string | null,
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: appointmentInclude,
      });
      if (!current) return { notFound: true as const };

      if (!['REQUESTED', 'CONFIRMED'].includes(current.status)) {
        return { invalidStatus: true as const };
      }

      const collision = await tx.appointment.findFirst({
        where: {
          doctorId: current.doctorId,
          scheduledAt: newScheduledAt,
          id: { not: current.id },
          status: { in: ['REQUESTED', 'CONFIRMED'] },
        },
      });
      if (collision) {
        return { collision: true as const };
      }

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduledAt: newScheduledAt,
          status: 'REQUESTED', // Reset to REQUESTED for hospital to re-confirm
          ...(reason !== undefined ? { reason } : {}),
        },
        include: appointmentInclude,
      });

      // Create notification for parent
      await tx.notification.create({
        data: {
          parentId: current.parentId,
          type: 'APPOINTMENT',
          status: 'UNREAD',
          title: 'Appointment Rescheduled',
          body: `Your appointment with ${updated.doctor?.fullName ?? 'specialist'} at ${updated.hospital.name} has been rescheduled to ${newScheduledAt.toLocaleDateString()}.`,
          appointmentId: updated.id,
        },
      });

      return { appointment: updated };
    });
  }

  create(input: {
    parentId: string;
    childId: string;
    hospitalId: string;
    doctorId: string;
    scheduledAt: Date;
    reason: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({ data: input, include: appointmentInclude });
      await tx.notification.create({
        data: {
          parentId: input.parentId,
          type: 'APPOINTMENT',
          status: 'UNREAD',
          title: 'Appointment Requested',
          body: `Your appointment request with ${created.doctor?.fullName ?? 'specialist'} at ${created.hospital.name} on ${created.scheduledAt.toLocaleDateString()} has been submitted.`,
          appointmentId: created.id,
        },
      });
      return created;
    });
  }
  /** One page of a parent's appointments, counted in the same transaction. */
  async listForParent(
    parentId: string,
    pagination: { skip: number; take: number },
    filters?: {
      childId?: string | undefined;
      status?: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | undefined;
    },
  ) {
    const where: Prisma.AppointmentWhereInput = {
      parentId,
      ...(filters?.childId ? { childId: filters.childId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        include: appointmentInclude,
        orderBy: { scheduledAt: 'desc' },
        ...pagination,
      }),
      prisma.appointment.count({ where }),
    ]);
    return { items, total };
  }

  /** One page of all appointments system-wide for administrators. */
  async listAll(
    pagination: { skip: number; take: number },
    filters?: {
      childId?: string | undefined;
      status?: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | undefined;
    },
  ) {
    const where: Prisma.AppointmentWhereInput = {
      ...(filters?.childId ? { childId: filters.childId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        include: appointmentInclude,
        orderBy: { scheduledAt: 'desc' },
        ...pagination,
      }),
      prisma.appointment.count({ where }),
    ]);
    return { items, total };
  }
  findForParent(id: string, parentId: string) {
    return prisma.appointment.findFirst({ where: { id, parentId }, include: appointmentInclude });
  }
  updateStatus(id: string, status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: { status },
        include: appointmentInclude,
      });
      if (status === 'CANCELLED') {
        await tx.notification.create({
          data: {
            parentId: updated.parentId,
            type: 'APPOINTMENT',
            title: 'Appointment cancelled',
            body: `Your appointment with ${updated.doctor?.fullName ?? 'specialist'} on ${updated.scheduledAt.toLocaleDateString()} was cancelled.`,
            appointmentId: updated.id,
          },
        });
      }
      return updated;
    });
  }
}
