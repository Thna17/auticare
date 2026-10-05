import { prisma } from '../../database/prisma.js';
const include = { child: true, doctor: true, hospital: true, parent: true } as const;
export class HospitalManagementRepository {
  staff(parentId: string) {
    return prisma.hospitalStaff.findFirst({
      where: { parentId },
      include: { hospital: true, parent: true },
    });
  }
  appointments(
    hospitalId: string,
    where: { status?: any; doctorId?: string; from?: Date; to?: Date },
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
  updateStatus(id: string, status: any) {
    return prisma.appointment.update({ where: { id }, data: { status }, include });
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
