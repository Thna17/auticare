import type { SchoolResponse } from '@auticare/contracts';

export interface CambodianSchoolItem extends SchoolResponse {
  readonly nameKm: string;
  readonly nameEn: string;
  readonly accreditationBadgeKm: string;
  readonly accreditationBadgeEn: string;
  readonly facilityTags: readonly string[];
  readonly facilities?: readonly string[];
}

export const CAMBODIAN_FACILITY_MAP: Record<string, { km: string; en: string; bilingual: string }> =
  {
    'sensory room': {
      km: 'បន្ទប់ញាណដឹង',
      en: 'Sensory Room',
      bilingual: 'បន្ទប់ញាណដឹង (Sensory Room)',
    },
    'calming room': {
      km: 'បន្ទប់ស្ងប់អារម្មណ៍',
      en: 'Calming Room',
      bilingual: 'បន្ទប់ស្ងប់អារម្មណ៍ (Calming Room)',
    },
    'therapy gym': {
      km: 'កន្លែងហាត់ប្រាណកុមារ',
      en: 'Therapy Gym',
      bilingual: 'កន្លែងហាត់ប្រាណកុមារ (Therapy Gym)',
    },
    'special classrooms': {
      km: 'ថ្នាក់អប់រំពិសេស',
      en: 'Special Classrooms',
      bilingual: 'ថ្នាក់អប់រំពិសេស (Special Classrooms)',
    },
    'outdoor play area': {
      km: 'សួនលេងក្រៅផ្ទះ',
      en: 'Outdoor Play Area',
      bilingual: 'សួនលេងក្រៅផ្ទះ (Outdoor Play Area)',
    },
    'speech therapy room': {
      km: 'បន្ទប់ព្យាបាលការនិយាយ',
      en: 'Speech Therapy Room',
      bilingual: 'បន្ទប់ព្យាបាលការនិយាយ (Speech Therapy Room)',
    },
    'occupational therapy room': {
      km: 'បន្ទប់ព្យាបាលចលករ',
      en: 'Occupational Therapy Room',
      bilingual: 'បន្ទប់ព្យាបាលចលករ (Occupational Therapy Room)',
    },
    'educational garden': {
      km: 'សួនកសិកម្មបង្រៀន',
      en: 'Educational Garden',
      bilingual: 'សួនកសិកម្មបង្រៀន (Educational Garden)',
    },
    'iep center': {
      km: 'មជ្ឈមណ្ឌល IEP',
      en: 'IEP Planning Suite',
      bilingual: 'មជ្ឈមណ្ឌល IEP (IEP Planning Suite)',
    },
    'assessment suite': {
      km: 'បន្ទប់វាយតម្លៃការលូតលាស់',
      en: 'Developmental Assessment Suite',
      bilingual: 'បន្ទប់វាយតម្លៃការលូតលាស់ (Assessment Suite)',
    },
  };

export function formatFacilityTag(tag: string): string {
  const normalized = tag.toLowerCase().trim();
  if (CAMBODIAN_FACILITY_MAP[normalized]) {
    return CAMBODIAN_FACILITY_MAP[normalized].bilingual;
  }
  return tag;
}

export const CAMBODIAN_INCLUSIVE_SCHOOLS: readonly CambodianSchoolItem[] = [
  {
    id: 'school_rabbit_phnom_penh',
    name: 'Rabbit School Organization (អង្គការសាលាទន្សាយ)',
    nameKm: 'អង្គការសាលាទន្សាយ',
    nameEn: 'Rabbit School Organization',
    city: 'Phnom Penh',
    address: 'Toul Kork & Sen Sok, Phnom Penh',
    description:
      'Premier special education and vocational training center in Cambodia empowering children with autism and intellectual disabilities through inclusive classrooms and life-skills.',
    logoUrl: null,
    coverImageUrl:
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop',
    availabilityStatus: 'IMMEDIATE',
    waitlistEstimate: null,
    studentTeacherRatio: '3:1',
    specializations: ['Sensory Integration', 'Speech Therapy', 'Life Skills', 'Social Skills'],
    isVerified: true,
    rating: 4.9,
    reviewCount: 38,
    isFavorite: false,
    accreditationBadgeKm: 'ដៃគូអប់រំពិសេសដែលបានបញ្ជាក់',
    accreditationBadgeEn: 'Accredited Special Ed Partner',
    facilityTags: ['Sensory Room', 'Therapy Gym', 'Special Classrooms', 'Outdoor Play Area'],
    facilities: ['Sensory Room', 'Therapy Gym', 'Special Classrooms', 'Outdoor Play Area'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'school_hands_of_hope_kandal',
    name: 'Hands of Hope Community (សហគមន៍ដៃនៃក្តីសង្ឃឹម)',
    nameKm: 'សហគមន៍ដៃនៃក្តីសង្ឃឹម',
    nameEn: 'Hands of Hope Community',
    city: 'Kandal',
    address: 'Takhmao, Kandal',
    description:
      'Compassionate community education and developmental therapy for children with autism and down syndrome, fostering family collaboration and individualized education plans (IEP).',
    logoUrl: null,
    coverImageUrl:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop',
    availabilityStatus: 'WAITLIST',
    waitlistEstimate: '1–2 months',
    studentTeacherRatio: '2:1',
    specializations: ['ABA', 'Speech Therapy', 'Sensory Integration', 'Occupational Therapy'],
    isVerified: true,
    rating: 4.8,
    reviewCount: 24,
    isFavorite: false,
    accreditationBadgeKm: 'ដៃគូអប់រំពិសេសដែលបានបញ្ជាក់',
    accreditationBadgeEn: 'Accredited Special Ed Partner',
    facilityTags: ['Calming Room', 'Educational Garden', 'Speech Therapy Room', 'IEP Center'],
    facilities: ['Calming Room', 'Educational Garden', 'Speech Therapy Room', 'IEP Center'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'school_nise_phnom_penh',
    name: 'National Institute of Special Education (វិទ្យាស្ថានជាតិអប់រំពិសេស - NISE)',
    nameKm: 'វិទ្យាស្ថានជាតិអប់រំពិសេស (NISE)',
    nameEn: 'National Institute of Special Education (NISE)',
    city: 'Phnom Penh',
    address: 'Phnom Penh',
    description:
      'National government institute under MoEYS dedicated to special education teacher training, standardized inclusive curricula, and developmental progress assessment.',
    logoUrl: null,
    coverImageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop',
    availabilityStatus: 'IMMEDIATE',
    waitlistEstimate: null,
    studentTeacherRatio: '4:1',
    specializations: [
      'Special Education',
      'Curriculum Adaptation',
      'Sign Language',
      'Social Skills',
    ],
    isVerified: true,
    rating: 4.7,
    reviewCount: 19,
    isFavorite: false,
    accreditationBadgeKm: 'ដៃគូអប់រំពិសេសដែលបានបញ្ជាក់',
    accreditationBadgeEn: 'Accredited Special Ed Partner',
    facilityTags: ['Assessment Suite', 'Special Classrooms', 'Sensory Room'],
    facilities: ['Assessment Suite', 'Special Classrooms', 'Sensory Room'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'school_grace_house_siem_reap',
    name: 'Grace House Community Inclusive Classrooms',
    nameKm: 'ថ្នាក់រៀនបរិយាបន្នសហគមន៍ Grace House',
    nameEn: 'Grace House Community Inclusive Classrooms',
    city: 'Siem Reap',
    address: 'Siem Reap',
    description:
      'Community-led inclusive education project in Siem Reap providing sensory accommodation, speech therapy access, and supportive learning environments for neurodivergent children.',
    logoUrl: null,
    coverImageUrl:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop',
    availabilityStatus: 'IMMEDIATE',
    waitlistEstimate: null,
    studentTeacherRatio: '3:1',
    specializations: ['Inclusive Education', 'Sensory Integration', 'Speech Therapy'],
    isVerified: true,
    rating: 4.9,
    reviewCount: 16,
    isFavorite: false,
    accreditationBadgeKm: 'ដៃគូអប់រំពិសេសដែលបានបញ្ជាក់',
    accreditationBadgeEn: 'Accredited Special Ed Partner',
    facilityTags: ['Sensory Room', 'Outdoor Play Area', 'Special Classrooms'],
    facilities: ['Sensory Room', 'Outdoor Play Area', 'Special Classrooms'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];
