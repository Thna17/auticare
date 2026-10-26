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

  const hospitalPasswordHash = await passwordService.hash('AutiCareHospitalPassword123');
  const hospitalUser = await prisma.parent.upsert({
    where: { email: 'hospital@auticare.local' },
    update: {},
    create: {
      email: 'hospital@auticare.local',
      firstName: 'Hospital',
      lastName: 'Manager',
      role: 'HOSPITAL',
      passwordHash: hospitalPasswordHash,
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

  // The SHORT form a parent meets straight after login. Ten threshold questions
  // per band — the minimum needed to say something useful without asking an
  // anxious parent to commit to 46 items. Same categories, same polarity rules
  // and the same scoring engine as the long form, so the two stay comparable.
  const shortAssessmentQuestions: {
    questionText: string;
    category: string;
    ageBand: 'TODDLER' | 'PRESCHOOL';
    polarity: 'DIRECT' | 'REVERSE';
    displayOrder: number;
    formKind: 'SHORT';
  }[] = [
    // ===== TODDLER BAND (10) =====
    {
      questionText: 'When you say their name, does your child look at you?',
      category: 'Social Interaction',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 1,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child point at things they want you to look at?',
      category: 'Social Interaction',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 2,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child bring things to show you, like a toy or a picture?',
      category: 'Social Interaction',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 3,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child smile or show pleasure when you play together?',
      category: 'Social Interaction',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 4,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child use words, sounds or gestures to tell you what they want?',
      category: 'Communication',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 5,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child copy things you do, like waving or clapping?',
      category: 'Play & Imagination',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 6,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child play with toys in the way they are meant to be used?',
      category: 'Play & Imagination',
      ageBand: 'TODDLER',
      polarity: 'REVERSE',
      displayOrder: 7,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child get very upset when a familiar routine changes?',
      category: 'Flexibility & Routine',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 8,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child cover their ears, or react strongly to everyday sounds?',
      category: 'Sensory Processing',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 9,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child rock, spin or flap their hands over and over?',
      category: 'Behaviour Patterns',
      ageBand: 'TODDLER',
      polarity: 'DIRECT',
      displayOrder: 10,
      formKind: 'SHORT',
    },

    // ===== PRESCHOOL BAND (10) =====
    {
      questionText: 'Does your child hold a back-and-forth conversation with you?',
      category: 'Communication',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 1,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child understand simple instructions without being shown?',
      category: 'Communication',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 2,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child play pretend, for example pretending a box is a car?',
      category: 'Play & Imagination',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 3,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child join other children in play?',
      category: 'Social Interaction',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 4,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child share things they are excited about with you?',
      category: 'Social Interaction',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 5,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child look at you to check how you feel in a new situation?',
      category: 'Social Interaction',
      ageBand: 'PRESCHOOL',
      polarity: 'REVERSE',
      displayOrder: 6,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child become very distressed when plans change unexpectedly?',
      category: 'Flexibility & Routine',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 7,
      formKind: 'SHORT',
    },
    {
      questionText:
        'Does your child insist that things be done in exactly the same way every time?',
      category: 'Flexibility & Routine',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 8,
      formKind: 'SHORT',
    },
    {
      questionText:
        'Does your child react strongly to textures, lights or sounds that other people ignore?',
      category: 'Sensory Processing',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 9,
      formKind: 'SHORT',
    },
    {
      questionText: 'Does your child repeat the same phrase or action many times in a row?',
      category: 'Behaviour Patterns',
      ageBand: 'PRESCHOOL',
      polarity: 'DIRECT',
      displayOrder: 10,
      formKind: 'SHORT',
    },
  ];

  // Idempotent "replace": retire any previously seeded questions, delete the ones
  // that are safe to remove (no answers reference them — avoids the RESTRICT FK),
  // then insert the current active set. Answered legacy questions are kept but
  // deactivated so historical sessions remain auditable.
  await prisma.screeningQuestion.updateMany({ data: { isActive: false } });
  await prisma.screeningQuestion.deleteMany({ where: { answers: { none: {} } } });
  await prisma.screeningQuestion.createMany({
    data: [...screeningQuestions, ...shortAssessmentQuestions],
  });

  const cambodianSchools = [
    {
      id: 'demo-school-1',
      name: 'Rabbit School Organization (អង្គការសាលាទន្សាយ)',
      city: 'Phnom Penh',
      address: 'Toul Kork & Sen Sok, Phnom Penh',
      description:
        'Premier special education and vocational training center in Cambodia empowering children with autism and intellectual disabilities through inclusive classrooms and life-skills.',
      studentTeacherRatio: '3:1',
      availabilityStatus: 'IMMEDIATE' as const,
      isVerified: true,
      facilities: ['Sensory Room', 'Therapy Gym', 'Special Classrooms', 'Outdoor Play Area'],
      specializations: ['Sensory Integration', 'Speech Therapy', 'Life Skills', 'Social Skills'],
    },
    {
      id: 'demo-school-hands-of-hope',
      name: 'Hands of Hope Community (សហគមន៍ដៃនៃក្តីសង្ឃឹម)',
      city: 'Kandal',
      address: 'Takhmao, Kandal',
      description:
        'Compassionate community education and developmental therapy for children with autism and down syndrome, fostering family collaboration and individualized education plans (IEP).',
      studentTeacherRatio: '2:1',
      availabilityStatus: 'WAITLIST' as const,
      waitlistEstimate: '1–2 months',
      isVerified: true,
      facilities: ['Calming Room', 'Educational Garden', 'Speech Therapy Room', 'IEP Center'],
      specializations: ['ABA', 'Speech Therapy', 'Sensory Integration', 'Occupational Therapy'],
    },
    {
      id: 'demo-school-nise',
      name: 'National Institute of Special Education (វិទ្យាស្ថានជាតិអប់រំពិសេស - NISE)',
      city: 'Phnom Penh',
      address: 'Phnom Penh',
      description:
        'National government institute under MoEYS dedicated to special education teacher training, standardized inclusive curricula, and developmental progress assessment.',
      studentTeacherRatio: '4:1',
      availabilityStatus: 'IMMEDIATE' as const,
      isVerified: true,
      facilities: ['Assessment Suite', 'Special Classrooms', 'Sensory Room'],
      specializations: [
        'Special Education',
        'Curriculum Adaptation',
        'Sign Language',
        'Social Skills',
      ],
    },
    {
      id: 'demo-school-grace-house',
      name: 'Grace House Community Inclusive Classrooms',
      city: 'Siem Reap',
      address: 'Siem Reap',
      description:
        'Community-led inclusive education project in Siem Reap providing sensory accommodation, speech therapy access, and supportive learning environments for neurodivergent children.',
      studentTeacherRatio: '3:1',
      availabilityStatus: 'IMMEDIATE' as const,
      isVerified: true,
      facilities: ['Sensory Room', 'Outdoor Play Area', 'Special Classrooms'],
      specializations: ['Inclusive Education', 'Sensory Integration', 'Speech Therapy'],
    },
  ];

  for (const s of cambodianSchools) {
    await prisma.school.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        city: s.city,
        address: s.address,
        description: s.description,
        studentTeacherRatio: s.studentTeacherRatio,
        availabilityStatus: s.availabilityStatus,
        waitlistEstimate: s.waitlistEstimate ?? null,
        isVerified: s.isVerified,
        facilities: s.facilities,
        specializations: s.specializations,
      },
      create: s,
    });
  }

  const school = await prisma.school.findUniqueOrThrow({
    where: { id: 'demo-school-1' },
  });

  await prisma.schoolStaff.upsert({
    where: { parentId_schoolId: { parentId: schoolUser.id, schoolId: school.id } },
    update: {},
    create: { parentId: schoolUser.id, schoolId: school.id, title: 'Activity Reporter' },
  });

  await prisma.schoolChildEnrollment.upsert({
    where: { schoolId_childId: { schoolId: school.id, childId: 'demo-child-1' } },
    update: { status: 'ACTIVE', endDate: null },
    create: { schoolId: school.id, childId: 'demo-child-1' },
  });

  const cambodianHospitals = [
    {
      id: 'demo-hospital-1',
      name: 'National Pediatric Hospital (មន្ទីរពេទ្យកុមារជាតិ)',
      city: 'Phnom Penh',
      address: 'Russian Federation Blvd, Tuol Kork, Phnom Penh',
      services: 'Developmental pediatrics, speech therapy, child neurology, autism screening',
    },
    {
      id: 'demo-hospital-kantha-bopha',
      name: 'Kantha Bopha Children’s Hospital (មន្ទីរពេទ្យគន្ធបុប្ផា)',
      city: 'Phnom Penh',
      address: 'Wat Phnom, Daun Penh, Phnom Penh & Jayavarman VII, Siem Reap',
      services: 'Pediatric emergency care, child neurology, free pediatric inpatient',
    },
    {
      id: 'demo-hospital-sunrise',
      name: 'Sunrise Japan Hospital (មន្ទីរពេទ្យ សាន់រ៉ាយស៍ ជប៉ុន)',
      city: 'Phnom Penh',
      address: 'Kola Loum St, Chroy Changvar, Phnom Penh',
      services: 'Pediatrics, child neurology, occupational therapy, sensory integration',
    },
    {
      id: 'demo-hospital-calmette',
      name: 'Calmette Hospital (មន្ទីរពេទ្យកាល់ម៉ែត)',
      city: 'Phnom Penh',
      address: 'No 3 Monivong Blvd, Daun Penh, Phnom Penh',
      services: 'Pediatric consultation, neurodevelopmental diagnostics, child mental health',
    },
    {
      id: 'demo-hospital-khmer-soviet',
      name: 'Khmer-Soviet Friendship Hospital (មន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត)',
      city: 'Phnom Penh',
      address: 'Yothapol Khemarak Phoumin Blvd (271), Chamkar Mon, Phnom Penh',
      services: 'Pediatrics, physical therapy, speech therapy, occupational therapy',
    },
    {
      id: 'demo-hospital-ahc',
      name: 'Angkor Hospital for Children (មន្ទីរពេទ្យកុមារអង្គរ)',
      city: 'Siem Reap',
      address: 'Tep Vong St & Oum Chhay St, Svay Dangkum, Siem Reap',
      services: 'Pediatric intensive care, developmental pediatrics, speech support',
    },
  ];

  for (const h of cambodianHospitals) {
    await prisma.hospital.upsert({
      where: { id: h.id },
      update: { name: h.name, city: h.city, address: h.address, services: h.services },
      create: h,
    });
  }

  const hospital = await prisma.hospital.findUniqueOrThrow({
    where: { id: 'demo-hospital-1' },
  });

  const cambodianDoctors = [
    {
      id: 'demo-doctor-1',
      hospitalId: 'demo-hospital-1',
      fullName: 'Dr. Lina Sok',
      specialty: 'Developmental Pediatrician',
      bio: 'Leading pediatric developmental specialist at National Pediatric Hospital.',
    },
    {
      id: 'demo-doctor-2',
      hospitalId: 'demo-hospital-kantha-bopha',
      fullName: 'Dr. Chan Vicheth',
      specialty: 'Speech-Language Pathologist',
      bio: 'Specialist in early communication interventions and pediatric speech therapy.',
    },
    {
      id: 'demo-doctor-3',
      hospitalId: 'demo-hospital-sunrise',
      fullName: 'Dr. Sreymom Keo',
      specialty: 'Occupational Therapist',
      bio: 'Sensory integration and pediatric motor skills development expert.',
    },
    {
      id: 'demo-doctor-4',
      hospitalId: 'demo-hospital-calmette',
      fullName: 'Dr. Sophea Meng',
      specialty: 'Child Neurologist',
      bio: 'Pediatric neurologist specializing in neurodevelopmental assessments.',
    },
  ];

  for (const doc of cambodianDoctors) {
    await prisma.doctor.upsert({
      where: { id: doc.id },
      update: { fullName: doc.fullName, specialty: doc.specialty, bio: doc.bio },
      create: {
        id: doc.id,
        hospitalId: doc.hospitalId,
        fullName: doc.fullName,
        specialty: doc.specialty,
        bio: doc.bio,
      },
    });
  }

  await prisma.hospitalStaff.upsert({
    where: { parentId_hospitalId: { parentId: hospitalUser.id, hospitalId: hospital.id } },
    update: {},
    create: { parentId: hospitalUser.id, hospitalId: hospital.id, title: 'Hospital Manager' },
  });
  await prisma.appointment.upsert({
    where: { id: 'demo-appointment-requested' },
    update: {},
    create: {
      id: 'demo-appointment-requested',
      parentId: parent.id,
      childId: 'demo-child-1',
      hospitalId: hospital.id,
      doctorId: 'demo-doctor-1',
      scheduledAt: new Date('2027-01-15T09:00:00.000Z'),
      status: 'REQUESTED',
      reason: 'Development consultation',
    },
  });
  await prisma.appointment.upsert({
    where: { id: 'demo-appointment-confirmed' },
    update: {},
    create: {
      id: 'demo-appointment-confirmed',
      parentId: parent.id,
      childId: 'demo-child-1',
      hospitalId: hospital.id,
      doctorId: 'demo-doctor-1',
      scheduledAt: new Date('2027-02-15T10:00:00.000Z'),
      status: 'CONFIRMED',
      reason: 'Follow-up consultation',
    },
  });
  // Upsert on a stable id, not createMany+skipDuplicates. Activity has no unique
  // constraint beyond its id, so skipDuplicates had nothing to match on and every
  // seed run inserted another copy — a dev database that had been seeded ten times
  // showed the same activity ten times on the activities page.
  //
  // Deleting and re-inserting is not an option either: ActivityProgress cascades
  // from Activity, so that would erase families' tracked progress on every seed.
  const demoActivities = [
    {
      id: 'demo-activity-1',
      title: 'Sensory Rice & Grain Bin (ការលេងអង្ករ និងគ្រាប់ធញ្ញជាតិចម្រុះពណ៌)',
      category: 'Sensory',
      minAgeMonths: 18,
      maxAgeMonths: 72,
      summary:
        'Tactile exploration using jasmine rice and dry lentils to provide soothing tactile sensory input and promote calm focus.',
    },
    {
      id: 'demo-activity-2',
      title: 'Calming Coconut Water & Bubble Play (ល្បែងពពុះទឹក និងសំបកដូងបន្ធូរអារម្មណ៍)',
      category: 'Sensory',
      minAgeMonths: 24,
      maxAgeMonths: 60,
      summary:
        'Gentle bubble blowing with coconut shell bowls supporting oral-motor regulation, deep breathing, and visual tracking.',
    },
    {
      id: 'demo-activity-3',
      title: 'Banana Leaf & Paper Folding (ការបត់ស្លឹកចេក និងក្រដាស)',
      category: 'Fine Motor',
      minAgeMonths: 36,
      maxAgeMonths: 84,
      summary:
        'Traditional Cambodian banana leaf and paper folding exercises building fine motor precision, bilateral coordination, and finger strength.',
    },
    {
      id: 'demo-activity-4',
      title: 'Clay & Soft Dough Sculpting (ការឆ្លាក់ដីឥដ្ឋទន់ និងម្សៅពណ៌)',
      category: 'Sensory',
      minAgeMonths: 24,
      maxAgeMonths: 72,
      summary:
        'Deep proprioceptive pressure and creative modeling with soft homemade dough or local clay for emotional grounding and hand dexterity.',
    },
    {
      id: 'demo-activity-5',
      title: 'Rhythm & Clapping Games with Khmer Rhymes (ល្បែងទះដៃ និងចង្វាក់ភ្លេងខ្មែរ)',
      category: 'Social',
      minAgeMonths: 24,
      maxAgeMonths: 72,
      summary:
        'Predictable musical turn-taking and clapping routines using Khmer childhood rhymes to foster eye contact and social engagement.',
    },
  ];
  for (const activity of demoActivities) {
    const { id, ...fields } = activity;
    await prisma.activity.upsert({ where: { id }, update: fields, create: { id, ...fields } });
  }

  // ── Seed ActivityReports for the school dashboard ──────────────────────
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date;
  };

  const seedReports: {
    id: string;
    schoolId: string;
    childId: string;
    reporterId: string;
    activityCategory: string;
    title: string;
    summary: string;
    activityDate: Date;
    status: string;
    duration?: number;
  }[] = [
    {
      id: 'demo-report-1',
      schoolId: school.id,
      childId: 'demo-child-1',
      reporterId: schoolUser.id,
      activityCategory: 'Cognitive/Developmental',
      title: 'Color Sorting Activity',
      summary: 'Sam successfully sorted 8 colors into groups with 90% accuracy.',
      activityDate: daysAgo(1),
      status: 'SUBMITTED',
      duration: 30,
    },
    {
      id: 'demo-report-2',
      schoolId: school.id,
      childId: 'demo-child-1',
      reporterId: schoolUser.id,
      activityCategory: 'Social/Emotional',
      title: 'Group Play Session',
      summary: 'Sam initiated play with a peer and shared toys cooperatively.',
      activityDate: daysAgo(3),
      status: 'SUBMITTED',
      duration: 45,
    },
    {
      id: 'demo-report-3',
      schoolId: school.id,
      childId: 'demo-child-1',
      reporterId: schoolUser.id,
      activityCategory: 'Language/Communication',
      title: 'Vocabulary Building',
      summary: 'Sam learned 5 new words and used them in sentences.',
      activityDate: daysAgo(5),
      status: 'SUBMITTED',
      duration: 25,
    },
    {
      id: 'demo-report-4',
      schoolId: school.id,
      childId: 'demo-child-1',
      reporterId: schoolUser.id,
      activityCategory: 'Sensory/Motor',
      title: 'Fine Motor Practice',
      summary: 'Draft: Sam worked on pencil grip and tracing shapes.',
      activityDate: daysAgo(7),
      status: 'DRAFT',
      duration: 20,
    },
    {
      id: 'demo-report-5',
      schoolId: school.id,
      childId: 'demo-child-1',
      reporterId: schoolUser.id,
      activityCategory: 'Adaptive/Self-Care',
      title: 'Morning Routine Practice',
      summary: 'Draft: Sam practiced putting on shoes independently.',
      activityDate: daysAgo(10),
      status: 'DRAFT',
      duration: 15,
    },
  ];

  for (const report of seedReports) {
    await prisma.activityReport.upsert({
      where: { id: report.id },
      update: {},
      create: report,
    });
  }

  console.log(screeningDisclaimer);
}

main().finally(async () => prisma.$disconnect());
