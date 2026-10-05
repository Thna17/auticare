import { prisma } from '../../database/prisma.js';

const appointmentInclude = { child: true, hospital: true, doctor: true } as const;
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
  listForParent(parentId: string) {
    return prisma.appointment.findMany({
      where: { parentId },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'desc' },
    });
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
