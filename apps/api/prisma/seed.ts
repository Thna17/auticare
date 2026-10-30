import { PrismaClient } from '@prisma/client';
import { screeningDisclaimer } from '@auticare/contracts';
import { PasswordService } from '../src/modules/auth/password.service.js';
import {
  directoryActivities,
  directoryHospitals,
  directorySchools,
  directoryUpdatesForExistingRows,
} from './directory.seed-data.js';

const prisma = new PrismaClient();
const passwordService = new PasswordService();

async function main() {
  // The first administrator comes from the environment, so no shared
  // password is ever committed. Every other account is created through the app:
  // schools apply and are approved, teachers get a setup code, parents register.
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await prisma.parent.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Admin',
        lastName: process.env.SEED_ADMIN_LAST_NAME?.trim() || 'User',
        role: 'ADMIN',
        passwordHash: await passwordService.hash(adminPassword),
        preference: { create: { preferredLanguage: 'en' } },
      },
    });
  } else {
    console.warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: no administrator created.');
  }

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
  // The official 20 questions of the Modified Checklist for Autism in Toddlers,
  // Revised with Follow-Up (M-CHAT-R/F) — used for the first-run assessment when
  // a new parent registers, as well as parent dashboard developmental screening.
  const mchatQuestions = [
    {
      questionText:
        'If you point at something across the room, does your child look at it? (FOR EXAMPLE, if you point at a toy or an animal, does your child look at the toy or animal?)',
      category: 'Nonverbal Communication',
      polarity: 'REVERSE' as const,
      displayOrder: 1,
    },
    {
      questionText: 'Have you ever wondered if your child might be deaf?',
      category: 'Sensory Response',
      polarity: 'DIRECT' as const,
      displayOrder: 2,
    },
    {
      questionText:
        'Does your child play pretend or make-believe? (FOR EXAMPLE, pretend to drink from an empty cup, pretend to talk on a phone, or pretend to feed a doll or stuffed animal?)',
      category: 'Play & Imagination',
      polarity: 'REVERSE' as const,
      displayOrder: 3,
    },
    {
      questionText:
        'Does your child like climbing on things? (FOR EXAMPLE, furniture, playground equipment, or stairs)',
      category: 'Motor & Exploration',
      polarity: 'REVERSE' as const,
      displayOrder: 4,
    },
    {
      questionText:
        'Does your child make unusual finger movements near his or her eyes? (FOR EXAMPLE, does your child wiggle his or her fingers close to his or her eyes?)',
      category: 'Repetitive Behaviors',
      polarity: 'DIRECT' as const,
      displayOrder: 5,
    },
    {
      questionText:
        'Does your child point with one finger to ask for something or to get help? (FOR EXAMPLE, pointing to a snack or toy that is out of reach)',
      category: 'Communication',
      polarity: 'REVERSE' as const,
      displayOrder: 6,
    },
    {
      questionText:
        'Does your child point with one finger to show you something interesting? (FOR EXAMPLE, pointing to an airplane in the sky or a big truck in the road)',
      category: 'Social Interaction',
      polarity: 'REVERSE' as const,
      displayOrder: 7,
    },
    {
      questionText:
        'Is your child interested in other children? (FOR EXAMPLE, does your child watch other children, smile at them, or go to them?)',
      category: 'Social Interaction',
      polarity: 'REVERSE' as const,
      displayOrder: 8,
    },
    {
      questionText:
        'Does your child show you things by bringing them to you or holding them up for you to see – not to get help, but just to share? (FOR EXAMPLE, showing you a flower, a stuffed animal, or a toy truck)',
      category: 'Social Interaction',
      polarity: 'REVERSE' as const,
      displayOrder: 9,
    },
    {
      questionText:
        'Does your child respond when you call his or her name? (FOR EXAMPLE, does he or she look up, talk or babble, or stop what he or she is doing when you call his or her name?)',
      category: 'Social Interaction',
      polarity: 'REVERSE' as const,
      displayOrder: 10,
    },
    {
      questionText: 'When you smile at your child, does he or she smile back at you?',
      category: 'Social Interaction',
      polarity: 'REVERSE' as const,
      displayOrder: 11,
    },
    {
      questionText:
        'Does your child get upset by everyday noises? (FOR EXAMPLE, does your child scream or cry to noise such as a vacuum cleaner or loud music?)',
      category: 'Sensory Response',
      polarity: 'DIRECT' as const,
      displayOrder: 12,
    },
    {
      questionText: 'Does your child walk?',
      category: 'Motor & Exploration',
      polarity: 'REVERSE' as const,
      displayOrder: 13,
    },
    {
      questionText:
        'Does your child look you in the eye when you are talking to him or her, playing with him or her, or dressing him or her?',
      category: 'Nonverbal Communication',
      polarity: 'REVERSE' as const,
      displayOrder: 14,
    },
    {
      questionText:
        'Does your child try to copy what you do? (FOR EXAMPLE, wave bye-bye, clap, make a funny noise when you do)',
      category: 'Communication',
      polarity: 'REVERSE' as const,
      displayOrder: 15,
    },
    {
      questionText:
        'If you turn your head to look at something, does your child look around to see what you are looking at?',
      category: 'Nonverbal Communication',
      polarity: 'REVERSE' as const,
      displayOrder: 16,
    },
    {
      questionText:
        'Does your child try to get you to watch him or her? (FOR EXAMPLE, does your child look at you for praise, or say “look” or “watch me”?)',
      category: 'Social Interaction',
      polarity: 'REVERSE' as const,
      displayOrder: 17,
    },
    {
      questionText:
        'Does your child understand when you tell him or her to do something? (FOR EXAMPLE, if you don’t point, can your child understand “put the book on the chair” or “bring me the blanket”?)',
      category: 'Communication',
      polarity: 'REVERSE' as const,
      displayOrder: 18,
    },
    {
      questionText:
        'If something new happens, does your child look at your face to see how you feel about it? (FOR EXAMPLE, if he or she hears a strange or funny noise, or sees a new toy, will he or she look at your face?)',
      category: 'Nonverbal Communication',
      polarity: 'REVERSE' as const,
      displayOrder: 19,
    },
    {
      questionText:
        'Does your child like movement activities? (FOR EXAMPLE, being swung or bounced on your knee).',
      category: 'Motor & Exploration',
      polarity: 'REVERSE' as const,
      displayOrder: 20,
    },
  ];

  const shortAssessmentQuestions: {
    questionText: string;
    category: string;
    ageBand: 'TODDLER' | 'PRESCHOOL';
    polarity: 'DIRECT' | 'REVERSE';
    displayOrder: number;
    formKind: 'SHORT';
  }[] = [
    ...mchatQuestions.map((q) => ({
      ...q,
      ageBand: 'TODDLER' as const,
      formKind: 'SHORT' as const,
    })),
    ...mchatQuestions.map((q) => ({
      ...q,
      ageBand: 'PRESCHOOL' as const,
      formKind: 'SHORT' as const,
    })),
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

  // The Cambodian support directory (see directory.seed-data.ts). Upserted on
  // stable ids, like the rows above, so re-seeding never duplicates them.
  for (const s of directorySchools) {
    const { id, ...fields } = s;
    await prisma.school.upsert({ where: { id }, update: fields, create: { id, ...fields } });
  }
  for (const h of directoryHospitals) {
    const { id, ...fields } = h;
    await prisma.hospital.upsert({ where: { id }, update: fields, create: { id, ...fields } });
  }
  for (const [id, fields] of Object.entries(directoryUpdatesForExistingRows.school)) {
    await prisma.school.update({ where: { id }, data: fields });
  }
  for (const [id, fields] of Object.entries(directoryUpdatesForExistingRows.hospital)) {
    await prisma.hospital.update({ where: { id }, data: fields });
  }
  for (const activity of directoryActivities) {
    const { id, ...fields } = activity;
    await prisma.activity.upsert({ where: { id }, update: fields, create: { id, ...fields } });
  }

  console.log(screeningDisclaimer);
}

main().finally(async () => prisma.$disconnect());
