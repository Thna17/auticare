import { PrismaClient } from '@prisma/client';
import { screeningDisclaimer } from '@auticare/contracts';
import { PasswordService } from '../src/modules/auth/password.service.js';
const prisma = new PrismaClient();
const passwordService = new PasswordService();
async function main() {
  const passwordHash = await passwordService.hash('AutiCareDemoPassword123');
  const adminPasswordHash = await passwordService.hash('AutiCareAdminPassword123');
  await prisma.parent.upsert({
    where: { email: 'admin@auticare.local' },
    update: {},
    create: {
      email: 'admin@auticare.local',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      preference: { create: { preferredLanguage: 'en' } },
    },
  });
  const schoolPasswordHash = await passwordService.hash('AutiCareSchoolPassword123');
  const schoolUser = await prisma.parent.upsert({
    where: { email: 'school@auticare.local' },
    update: {},
    create: {
      email: 'school@auticare.local',
      firstName: 'School',
      lastName: 'Staff',
      role: 'SCHOOL',
      passwordHash: schoolPasswordHash,
      preference: { create: { preferredLanguage: 'en' } },
    },
  });
  const parent = await prisma.parent.upsert({
    where: { email: 'demo.parent@auticare.local' },
    update: {},
    create: {
      email: 'demo.parent@auticare.local',
      firstName: 'Demo',
      lastName: 'Parent',
      passwordHash,
      preference: { create: { preferredLanguage: 'en' } },
    },
  });
  await prisma.child.upsert({
    where: { id: 'demo-child-1' },
    update: {},
    create: {
      id: 'demo-child-1',
      parentId: parent.id,
      firstName: 'Sam',
      dateOfBirth: new Date('2020-05-01'),
    },
  });
  await prisma.screeningQuestion.createMany({
    data: [
      {
        questionText: 'Does your child respond when their name is called?',
        category: 'social',
        displayOrder: 1,
      },
      {
        questionText: 'Does your child use gestures to communicate needs?',
        category: 'communication',
        displayOrder: 2,
      },
      {
        questionText: 'Does your child enjoy shared play routines?',
        category: 'play',
        displayOrder: 3,
      },
    ],
    skipDuplicates: true,
  });
  const school = await prisma.school.upsert({
    where: { id: 'demo-school-1' },
    update: {},
    create: {
      id: 'demo-school-1',
      name: 'Calm Path Learning Center',
      city: 'Phnom Penh',
      address: 'Development Road 12',
      description: 'Inclusive learning support.',
    },
  });
  await prisma.schoolStaff.upsert({
    where: { parentId_schoolId: { parentId: schoolUser.id, schoolId: school.id } },
    update: {},
    create: { parentId: schoolUser.id, schoolId: school.id, title: 'Activity Reporter' },
  });
  await prisma.schoolChildEnrollment.upsert({
    where: { schoolId_childId: { schoolId: school.id, childId: 'demo-child-1' } },
    update: { status: 'ACTIVE', endedAt: null },
    create: { schoolId: school.id, childId: 'demo-child-1' },
  });
  const hospital = await prisma.hospital.upsert({
    where: { id: 'demo-hospital-1' },
    update: {},
    create: {
      id: 'demo-hospital-1',
      name: 'Family Development Clinic',
      city: 'Phnom Penh',
      address: 'Care Street 4',
      services: 'Developmental pediatrics, occupational therapy',
    },
  });
  await prisma.doctor.upsert({
    where: { id: 'demo-doctor-1' },
    update: {},
    create: {
      id: 'demo-doctor-1',
      hospitalId: hospital.id,
      fullName: 'Dr. Lina Sok',
      specialty: 'Developmental Pediatrics',
    },
  });
  await prisma.activity.createMany({
    data: [
      {
        title: 'Calm Sorting Game',
        category: 'fine-motor',
        minAgeMonths: 36,
        maxAgeMonths: 84,
        summary: 'A low-pressure sorting activity using familiar household objects.',
      },
    ],
    skipDuplicates: true,
  });
  console.log(screeningDisclaimer);
}
main().finally(async () => prisma.$disconnect());
