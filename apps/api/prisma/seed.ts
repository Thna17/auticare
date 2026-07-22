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
  // ORIGINAL, HEURISTIC screening items (not copied from any copyrighted
  // instrument, and not a clinically validated screening tool). Each item carries
  // a polarity so the scoring engine can correct for opposite concern-directions:
  //   REVERSE = doing the healthy behaviour more often is a GOOD sign.
  //   DIRECT  = doing the behaviour more often indicates MORE concern.
  const screeningQuestions: {
    questionText: string;
    category: string;
    polarity: 'DIRECT' | 'REVERSE';
    displayOrder: number;
  }[] = [
    // SOCIAL INTERACTION (reverse)
    {
      questionText: 'Does your child make eye contact when you speak to them?',
      category: 'social',
      polarity: 'REVERSE',
      displayOrder: 1,
    },
    {
      questionText: 'Does your child smile back when you smile at them?',
      category: 'social',
      polarity: 'REVERSE',
      displayOrder: 2,
    },
    {
      questionText: 'Does your child show interest in playing with other children?',
      category: 'social',
      polarity: 'REVERSE',
      displayOrder: 3,
    },
    {
      questionText: 'Does your child seem to enjoy being held or cuddled?',
      category: 'social',
      polarity: 'REVERSE',
      displayOrder: 4,
    },
    // COMMUNICATION (reverse)
    {
      questionText: 'Does your child respond when you call their name?',
      category: 'communication',
      polarity: 'REVERSE',
      displayOrder: 5,
    },
    {
      questionText: 'Does your child use gestures (like pointing or waving) to communicate?',
      category: 'communication',
      polarity: 'REVERSE',
      displayOrder: 6,
    },
    {
      questionText: "Does your child try to show you an object they're interested in?",
      category: 'communication',
      polarity: 'REVERSE',
      displayOrder: 7,
    },
    {
      questionText: 'Does your child use words or phrases to ask for things they want?',
      category: 'communication',
      polarity: 'REVERSE',
      displayOrder: 8,
    },
    {
      questionText: 'Does your child imitate sounds, words, or actions that you make?',
      category: 'communication',
      polarity: 'REVERSE',
      displayOrder: 9,
    },
    // PLAY & IMAGINATION (reverse)
    {
      questionText:
        'Does your child engage in pretend play (e.g. feeding a doll, talking on a toy phone)?',
      category: 'play',
      polarity: 'REVERSE',
      displayOrder: 10,
    },
    {
      questionText:
        "Does your child play with toys in the way they're meant to be used, rather than lining them up or spinning them?",
      category: 'play',
      polarity: 'REVERSE',
      displayOrder: 11,
    },
    {
      questionText: 'Does your child show curiosity about new toys or objects?',
      category: 'play',
      polarity: 'REVERSE',
      displayOrder: 12,
    },
    {
      questionText:
        'Does your child copy activities they see you doing (like sweeping or stirring)?',
      category: 'play',
      polarity: 'REVERSE',
      displayOrder: 13,
    },
    // SENSORY RESPONSE (direct)
    {
      questionText:
        'Does your child react strongly (covering ears, crying) to loud or unexpected sounds?',
      category: 'sensory',
      polarity: 'DIRECT',
      displayOrder: 14,
    },
    {
      questionText:
        'Does your child seem unusually sensitive to certain textures, tastes, or smells?',
      category: 'sensory',
      polarity: 'DIRECT',
      displayOrder: 15,
    },
    {
      questionText: 'Does your child seek out spinning, rocking, or other repetitive movement?',
      category: 'sensory',
      polarity: 'DIRECT',
      displayOrder: 16,
    },
    {
      questionText: 'Does your child get unusually upset by small changes in routine?',
      category: 'sensory',
      polarity: 'DIRECT',
      displayOrder: 17,
    },
    // MOTOR & REPETITIVE BEHAVIORS (direct)
    {
      questionText:
        'Does your child make repetitive hand or finger movements (flapping, wiggling near the eyes)?',
      category: 'motor',
      polarity: 'DIRECT',
      displayOrder: 18,
    },
    {
      questionText: 'Does your child walk on their toes frequently?',
      category: 'motor',
      polarity: 'DIRECT',
      displayOrder: 19,
    },
    {
      questionText:
        'Does your child repeat words or phrases without an apparent communicative purpose (echoing)?',
      category: 'motor',
      polarity: 'DIRECT',
      displayOrder: 20,
    },
    {
      questionText:
        'Does your child insist on things being done in exactly the same way each time?',
      category: 'motor',
      polarity: 'DIRECT',
      displayOrder: 21,
    },
  ];

  // Idempotent "replace": retire any previously seeded questions, delete the ones
  // that are safe to remove (no answers reference them — avoids the RESTRICT FK),
  // then insert the current active set. Answered legacy questions are kept but
  // deactivated so historical sessions remain auditable.
  await prisma.screeningQuestion.updateMany({ data: { isActive: false } });
  await prisma.screeningQuestion.deleteMany({ where: { answers: { none: {} } } });
  await prisma.screeningQuestion.createMany({ data: screeningQuestions });
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
