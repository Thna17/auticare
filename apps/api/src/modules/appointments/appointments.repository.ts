import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

const appointmentInclude = { child: true, hospital: true, doctor: true } as const;

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
  create(input: {
    parentId: string;
    childId: string;
    hospitalId: string;
    doctorId: string;
    scheduledAt: Date;
    reason: string | null;
  }) {
    return prisma.appointment.create({ data: input, include: appointmentInclude });
  }
  /** One page of a parent's appointments, counted in the same transaction. */
  async listForParent(parentId: string, pagination: { skip: number; take: number }) {
    const where = { parentId };
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
    return prisma.appointment.update({
      where: { id },
      data: { status },
      include: appointmentInclude,
    });
  }
}
