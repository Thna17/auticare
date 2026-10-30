/**
 * Cambodian autism support directory: schools, centres, hospitals and home
 * activities shown on Find Support and Activities. Imported from the team's
 * directory spreadsheets (October 2026).
 *
 * These organisations do not have AutiCare accounts, so `isVerified` stays
 * false until the admin has confirmed the details with each one. Descriptions
 * say what an organisation offers; they never promise a diagnosis or outcome.
 *
 * Ids are stable so the seed can upsert without creating copies.
 */

export const directorySchools = [
  {
    id: 'dir-school-hope-kids',
    name: 'Hope Kids Special Education School',
    city: 'Phnom Penh',
    address: 'Phnom Penh, with branches in Ta Khmau, Battambang, Kampot and Ratanakiri',
    description:
      'Private special education network with early learning programmes, child counselling and therapy sessions. Branches in several provinces make it easier for families outside Phnom Penh to attend.',
    phone: '+855 96 288 8857',
    website: 'https://hopekids-edu.com/',
    specializations: ['Special Education', 'Early Intervention', 'Counselling'],
  },
  {
    id: 'dir-school-parrot',
    name: 'Parrot School',
    city: 'Phnom Penh',
    address: '#11, Street 1982, Phnom Penh',
    description:
      'Structured Applied Behaviour Analysis (ABA) programmes supervised by internationally certified BCBA and RBT practitioners.',
    phone: '+855 17 888 321',
    website: 'https://parrot-kindergarten.com/',
    specializations: ['ABA'],
  },
  {
    id: 'dir-school-skds',
    name: 'Special Kids Development School (SKDS)',
    city: 'Phnom Penh',
    address: 'House 237, Street Pasteur 51, BKK1, Phnom Penh',
    description:
      'Individual education plans (IEPs), speech and language therapy, occupational therapy and a school-readiness programme.',
    phone: '+855 12 945 667',
    website: 'https://www.skds.edu.kh/',
    specializations: ['IEP', 'Speech Therapy', 'Occupational Therapy', 'School Readiness'],
  },
  {
    id: 'dir-school-ascend',
    name: 'Ascend Special Education',
    city: 'Phnom Penh',
    address: '#168, Street 156, Toek Laak 2, Phnom Penh',
    description:
      'One-to-one learning support using approaches drawn from UK (EYFS), Californian and Singaporean special education frameworks.',
    phone: '+855 89 777 021',
    website: 'https://ascendspecialeducation.com/',
    specializations: ['1-on-1 Support', 'Special Education'],
  },
  {
    id: 'dir-school-asc',
    name: 'Autism Services Cambodia (ASC Center)',
    city: 'Phnom Penh',
    address: '#6, Street 546, Phnom Penh',
    description:
      'Behaviour support, early learning programmes and practical coaching for parents and caregivers.',
    phone: '+855 11 662 551',
    website: 'https://www.facebook.com/AutismServicesCambodia',
    specializations: ['Behaviour Support', 'Early Learning', 'Parent Coaching'],
  },
  {
    id: 'dir-school-orbrom',
    name: 'OrbRom Learning Support Centre',
    city: 'Phnom Penh',
    address: 'Olympia City (main campus) and Borey Peng Huoth, Phnom Penh',
    description:
      'Learning support, early intervention for autistic children, occupational therapy and school-readiness tracking. Contact is through Telegram.',
    phone: null,
    website: 'https://t.me/OrbRom',
    specializations: ['Early Intervention', 'Occupational Therapy', 'School Readiness'],
  },
  {
    id: 'dir-school-smilestones',
    name: 'Smilestones Cambodia',
    city: 'Phnom Penh',
    address: 'Rose Garden, Rose Condo, Tonle Bassac, Phnom Penh',
    description:
      'Play-based therapy, speech therapy and feeding support, with help for children moving into international schools.',
    phone: '+855 17 264 301',
    website: 'http://www.smilestoneskh.com/',
    specializations: ['Play-based Therapy', 'Speech Therapy', 'Feeding Support'],
  },
  {
    id: 'dir-school-lumina',
    name: 'Lumina Neuro-Growth Center',
    city: 'Phnom Penh',
    address: 'Borey One Park, Boeung Kak, Phnom Penh',
    description:
      'Development centre and school focused on sensory occupational therapy and individual behaviour support.',
    phone: '+855 61 615 932',
    website: 'https://www.facebook.com/WeDoBetterTogether/',
    specializations: ['Sensory Integration', 'Occupational Therapy', 'Behaviour Support'],
  },
  {
    id: 'dir-school-gses',
    name: 'Growing Special Education School (GSES)',
    city: 'Phnom Penh',
    address: 'Boeung Tumpun community, Phnom Penh',
    description:
      'Non-profit special needs school offering small, focused classes for autistic students.',
    phone: null,
    website: null,
    specializations: ['Special Education'],
  },
  {
    id: 'dir-school-takhmao',
    name: 'Takhmao Special Education High School',
    city: 'Kandal',
    address: 'Ta Khmau Town, Kandal',
    description:
      'Government special education school following the state curriculum from kindergarten to Grade 12. Contact goes through the Ministry of Education, Youth and Sport.',
    phone: null,
    website: null,
    specializations: ['Special Education', 'Government Curriculum'],
  },
];

export const directoryHospitals = [
  {
    id: 'dir-hospital-ccamh',
    name: 'Caritas-CCAMH (Center for Child and Adolescent Mental Health)',
    city: 'Kandal',
    address: 'Chey Chumneas Referral Hospital campus, Ta Khmau, Kandal',
    services:
      'Child development assessment, child psychiatry, speech assessment, training for professionals',
    description:
      'A leading national centre for child development and mental health. Programme director: Dr. J. Bhoomikumar, consultant child psychiatrist. Email: ccamh-comm@caritascambodia.org',
    phone: '+855 92 895 466',
    website: 'https://www.caritascambodia.org/',
  },
  {
    id: 'dir-hospital-maxicare',
    name: 'Maxicare Children Hospital',
    city: 'Phnom Penh',
    address: '#49, Street 368, Phnom Penh',
    services: 'Child development reviews, milestone tracking, specialist consultations',
    description:
      'Private children’s hospital. Dr. Van Sokchea specialises in child growth, development and psychomotor tracking.',
    phone: '+855 92 590 555',
    website: 'https://www.maxicarehospital.com.kh/',
  },
  {
    id: 'dir-hospital-intercare',
    name: 'Intercare Child Wellbeing Center (ICWC)',
    city: 'Phnom Penh',
    address: 'Olympia Medical Hub, Hub Building, Phnom Penh',
    services: 'Psychoeducational evaluations, multidisciplinary child team',
    description:
      'Multidisciplinary child wellbeing team offering psychoeducational evaluations. Contact: Kimm Renaud and the specialist child team.',
    phone: '+855 70 207 604',
    website: 'https://intercarehospital.com/',
  },
  {
    id: 'dir-hospital-mental-health-trust',
    name: 'Mental Health Trust Clinic',
    city: 'Phnom Penh',
    address: 'Chip Mong Parkland 598, Phnom Penh',
    services: 'Psychiatric assessment, child development consultations',
    description:
      'Private psychiatric clinic offering assessments and child development consultations. Prof. Heng Sovandara, psychiatry specialist.',
    phone: '+855 12 388 128',
    website: null,
  },
];

/**
 * Directory details for organisations the seed already creates under older
 * ids, merged into those rows instead of being added a second time.
 */
export const directoryUpdatesForExistingRows = {
  school: {
    'demo-school-1': {
      address: 'Toul Kork, Phnom Penh; Khnat School, Siem Reap; Kampong Speu',
      phone: '+855 12 721 346',
      website: 'https://rabbitschoolcambodia.net/',
    },
  },
  hospital: {
    'demo-hospital-1': {
      description:
        'Government children’s hospital with a speech and development unit, developmental clinics and milestone checks.',
      phone: '+855 23 884 137',
      website: null,
    },
  },
} as const;

/**
 * Home activities. The parent-facing Khmer and English text, materials and
 * steps live in the web app (cambodia-activities.data.ts) under the same ids;
 * these rows make them part of the catalogue so progress can be tracked.
 */
export const directoryActivities = [
  {
    id: 'dir-activity-water-play',
    title: 'Calming Water Play (ការលេងទឹកដើម្បីស្ងប់អារម្មណ៍)',
    category: 'Sensory',
    minAgeMonths: 24,
    maxAgeMonths: 96,
    summary:
      'Pouring and squeezing warm water gives gentle touch input that can help a child settle and explore.',
    steps:
      'Fill a shallow basin with warm water. Offer cups and a sponge for pouring and squeezing. Follow your child’s lead for 5–10 minutes.',
    videoUrl: 'https://www.youtube.com/watch?v=2wfaY95MdeE',
  },
  {
    id: 'dir-activity-say-and-drop',
    title: 'Say It and Drop It (និយាយ ហើយទម្លាក់)',
    category: 'Communication',
    minAgeMonths: 24,
    maxAgeMonths: 72,
    summary:
      'A simple box game that invites your child to look, point or make a sound to ask for an object.',
    steps:
      'Hold an item near your mouth and say its name three times. When your child looks or gestures, let them drop it into the box.',
    videoUrl: 'https://www.youtube.com/watch?v=IUhairheOII',
  },
  {
    id: 'dir-activity-cap-posting',
    title: 'Bottle Cap Posting (ការទម្លាក់គម្របដបចូលប្រអប់)',
    category: 'Fine Motor',
    minAgeMonths: 36,
    maxAgeMonths: 120,
    summary:
      'Picking up small objects with finger and thumb and posting them through a slot builds hand strength and coordination.',
    steps:
      'Cut a slot in a container lid. Show how to pick up a cap with thumb and finger, then let your child post them one at a time.',
    videoUrl: 'https://www.youtube.com/watch?v=VymP7-J4wMY',
  },
  {
    id: 'dir-activity-cushion-path',
    title: 'Cushion Path (ផ្លូវខ្នើយ)',
    category: 'Motor',
    minAgeMonths: 36,
    maxAgeMonths: 144,
    summary:
      'Stepping, crawling and jumping across cushions builds balance, core strength and body awareness.',
    steps:
      'Lay floor cushions in a path on a non-slip surface. Show how to step, crawl or jump across, then let your child try.',
    videoUrl: 'https://www.youtube.com/watch?v=12k0XUCKzbk',
  },
  {
    id: 'dir-activity-ball-roll',
    title: 'Turn-Taking Ball Roll (ការរមៀលបាល់ឆ្លាស់វេន)',
    category: 'Social',
    minAgeMonths: 48,
    maxAgeMonths: 120,
    summary:
      'Rolling a soft ball back and forth practises shared attention and taking turns with a parent.',
    steps:
      'Sit facing each other. Say “My turn” and roll the ball, then “Your turn!” and wait for your child to roll it back.',
    videoUrl: 'https://www.youtube.com/watch?v=izEIGyBDaUA',
  },
  {
    id: 'dir-activity-blanket-wrap',
    title: 'Blanket Hug Wrap (ការរុំភួយឱបថ្នមៗ)',
    category: 'Calming',
    minAgeMonths: 12,
    maxAgeMonths: 144,
    summary:
      'Being wrapped snugly in a soft blanket gives deep, even pressure that many children find calming.',
    steps:
      'Roll your child gently in a soft blanket, head always free. Press gently along arms and back, and stop when they want to.',
    videoUrl: 'https://www.youtube.com/watch?v=iZSDkcKMjSc',
  },
  {
    id: 'dir-activity-handwashing',
    title: 'Handwashing Step by Step (ការលាងដៃមួយជំហានម្តងៗ)',
    category: 'Daily Living',
    minAgeMonths: 36,
    maxAgeMonths: 144,
    summary:
      'Breaking handwashing into small steps, with picture cards if they help, builds independence in a daily routine.',
    steps: 'Turn on the water, add soap, rub hands, rinse, then dry.',
    videoUrl: 'https://www.youtube.com/playlist?list=PLNL4Ls5aZkt8jxvcJ7MmkoftCJWlzgUhB',
  },
  {
    id: 'dir-activity-ice-painting',
    title: 'Ice Cube Painting (ការគូរដោយដុំទឹកកកពណ៌)',
    category: 'Sensory',
    minAgeMonths: 24,
    maxAgeMonths: 96,
    summary:
      'Drawing with frozen coloured ice combines a cold, interesting texture with grip practice and naming colours.',
    steps:
      'Freeze water mixed with safe food colouring in an ice tray. Let your child hold a cube and draw on plain paper.',
    videoUrl: null,
  },
  {
    id: 'dir-activity-colour-sorting',
    title: 'Colour Sorting Bowls (ការតម្រៀបពណ៌ក្នុងចាន)',
    category: 'Fine Motor',
    minAgeMonths: 36,
    maxAgeMonths: 108,
    summary:
      'Sorting coloured items into matching bowls practises matching, grouping and staying with a task.',
    steps:
      'Line up three bowls of different colours. Guide your child to put each item in the bowl of the same colour.',
    videoUrl: 'https://www.youtube.com/watch?v=baWphKqkiAY',
  },
  {
    id: 'dir-activity-blanket-swing',
    title: 'Blanket Swing (ការយោលក្នុងភួយ)',
    category: 'Social',
    minAgeMonths: 24,
    maxAgeMonths: 84,
    summary:
      'Gentle rocking in a blanket held by two adults gives calming motion and a shared, joyful moment.',
    steps:
      'Lay a strong blanket on a soft carpet. With your child lying in the middle, two adults lift the corners slightly and rock slowly.',
    videoUrl: null,
  },
];
