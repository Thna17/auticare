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
  // Questions are split into two age bands; a session serves only its band's set.
  const screeningQuestions: {
    questionText: string;
    category: string;
    ageBand: 'TODDLER' | 'PRESCHOOL';
    polarity: 'DIRECT' | 'REVERSE';
    displayOrder: number;
  }[] = [
    // ===== TODDLER BAND (21) =====
    // Social Interaction (reverse)
    {
      questionText: 'Does your child make eye contact when you speak to them?',
      category: 'Social Interaction',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 1,
    },
    {
      questionText: 'Does your child smile back when you smile at them?',
      category: 'Social Interaction',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 2,
    },
    {
      questionText: 'Does your child show interest in playing with other children?',
      category: 'Social Interaction',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 3,
    },
    {
      questionText: 'Does your child seem to enjoy being held or cuddled?',
      category: 'Social Interaction',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 4,
    },
    // Communication (reverse)
    {
      questionText: 'Does your child respond when you call their name?',
      category: 'Communication',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 5,
    },
    {
      questionText: 'Does your child use gestures (like pointing or waving) to communicate?',
      category: 'Communication',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 6,
    },
    {
      questionText: "Does your child try to show you an object they're interested in?",
      category: 'Communication',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 7,
    },
    {
      questionText: 'Does your child use words or phrases to ask for things they want?',
      category: 'Communication',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 8,
    },
    {
      questionText: 'Does your child imitate sounds, words, or actions that you make?',
      category: 'Communication',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 9,
    },
    // Play & Imagination (reverse)
    {
      questionText:
        'Does your child engage in pretend play (e.g. feeding a doll, talking on a toy phone)?',
      category: 'Play & Imagination',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 10,
    },
    {
      questionText:
        "Does your child play with toys in the way they're meant to be used, rather than lining them up or spinning them?",
      category: 'Play & Imagination',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 11,
    },
    {
      questionText: 'Does your child show curiosity about new toys or objects?',
      category: 'Play & Imagination',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 12,
    },
    {
      questionText:
        'Does your child copy activities they see you doing (like sweeping or stirring)?',
      category: 'Play & Imagination',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 13,
    },
    // Sensory Response (direct)
    {
      questionText:
        'Does your child react strongly (covering ears, crying) to loud or unexpected sounds?',
      category: 'Sensory Response',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 14,
    },
    {
      questionText:
        'Does your child seem unusually sensitive to certain textures, tastes, or smells?',
      category: 'Sensory Response',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 15,
    },
    {
      questionText: 'Does your child seek out spinning, rocking, or other repetitive movement?',
      category: 'Sensory Response',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 16,
    },
    {
      questionText: 'Does your child get unusually upset by small changes in routine?',
      category: 'Sensory Response',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 17,
    },
    // Motor & Repetitive Behaviors (direct)
    {
      questionText:
        'Does your child make repetitive hand or finger movements (flapping, wiggling near the eyes)?',
      category: 'Motor & Repetitive Behaviors',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 18,
    },
    {
      questionText: 'Does your child walk on their toes frequently?',
      category: 'Motor & Repetitive Behaviors',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 19,
    },
    {
      questionText:
        'Does your child repeat words or phrases without an apparent communicative purpose (echoing)?',
      category: 'Motor & Repetitive Behaviors',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 20,
    },
    {
      questionText:
        'Does your child insist on things being done in exactly the same way each time?',
      category: 'Motor & Repetitive Behaviors',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 21,
    },

    // ===== PRESCHOOL BAND (24) =====
    // Social Interaction (reverse)
    {
      questionText: 'Does your child seek out other children to play with?',
      category: 'Social Interaction',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 22,
    },
    {
      questionText: 'Does your child join in group games or activities with peers?',
      category: 'Social Interaction',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 23,
    },
    {
      questionText: 'Does your child notice when someone else is upset or hurt?',
      category: 'Social Interaction',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 24,
    },
    {
      questionText: 'Does your child make friends easily at school or in group settings?',
      category: 'Social Interaction',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 25,
    },
    {
      questionText:
        'Does your child enjoy sharing something exciting with you (a drawing, a toy, a discovery)?',
      category: 'Social Interaction',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 26,
    },
    // Communication (reverse, except #31 direct)
    {
      questionText: 'Does your child hold a back-and-forth conversation about a topic?',
      category: 'Communication',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 27,
    },
    {
      questionText:
        "Does your child ask questions to learn more about something they're curious about?",
      category: 'Communication',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 28,
    },
    {
      questionText: "Does your child understand jokes or teasing in the way they're intended?",
      category: 'Communication',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 29,
    },
    {
      questionText:
        "Does your child use facial expressions that match what they're saying or feeling?",
      category: 'Communication',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 30,
    },
    {
      questionText: 'Does your child struggle to explain their own feelings in words?',
      category: 'Communication',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 31,
    },
    // Play & Imagination (reverse, except #34/#35 direct)
    {
      questionText:
        'Does your child engage in imaginative or make-believe play with other children?',
      category: 'Play & Imagination',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 32,
    },
    {
      questionText: 'Does your child act out different characters or roles during play?',
      category: 'Play & Imagination',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 33,
    },
    {
      questionText:
        'Does your child prefer playing the same game or activity in exactly the same way each time?',
      category: 'Play & Imagination',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 34,
    },
    {
      questionText:
        'Does your child show interest in a very narrow topic to the exclusion of most others?',
      category: 'Play & Imagination',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 35,
    },
    {
      questionText:
        'Does your child build or create things in a flexible, varied way, or does it stay very repetitive?',
      category: 'Play & Imagination',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 36,
    },
    // Sensory Response (direct)
    {
      questionText:
        'Does your child cover their ears or become distressed around loud environments (parties, assemblies)?',
      category: 'Sensory Response',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 37,
    },
    {
      questionText:
        "Does your child avoid certain clothing, food textures, or physical sensations that don't bother other children their age?",
      category: 'Sensory Response',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 38,
    },
    {
      questionText:
        'Does your child seek out intense sensory input (spinning, crashing into things, seeking pressure)?',
      category: 'Sensory Response',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 39,
    },
    {
      questionText: 'Does your child get overwhelmed in busy or crowded places?',
      category: 'Sensory Response',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 40,
    },
    // Flexibility & Routine (direct, except #45 reverse)
    {
      questionText: 'Does your child become very upset by minor changes to a plan or routine?',
      category: 'Flexibility & Routine',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 41,
    },
    {
      questionText: 'Does your child insist on doing things in a particular order or sequence?',
      category: 'Flexibility & Routine',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 42,
    },
    {
      questionText:
        'Does your child have difficulty moving from one activity to the next without distress?',
      category: 'Flexibility & Routine',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 43,
    },
    {
      questionText:
        'Does your child show unusual or repetitive body movements (hand-flapping, rocking, spinning)?',
      category: 'Flexibility & Routine',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 44,
    },
    {
      questionText: 'Does your child adapt reasonably well when plans change unexpectedly?',
      category: 'Flexibility & Routine',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 45,
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
