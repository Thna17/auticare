import type { HospitalResponse } from '@auticare/contracts';
import type { DoctorResponse } from '../appointments/appointments.types';

export interface CambodianProvince {
  readonly key: string;
  readonly nameEn: string;
  readonly nameKm: string;
  readonly label: string;
}

export const CAMBODIA_PROVINCES: readonly CambodianProvince[] = [
  {
    key: 'Phnom Penh',
    nameEn: 'Phnom Penh',
    nameKm: 'ភ្នំពេញ',
    label: 'Phnom Penh',
  },
  {
    key: 'Siem Reap',
    nameEn: 'Siem Reap',
    nameKm: 'សៀមរាប',
    label: 'Siem Reap',
  },
  {
    key: 'Battambang',
    nameEn: 'Battambang',
    nameKm: 'បាត់ដំបង',
    label: 'Battambang',
  },
  {
    key: 'Kandal',
    nameEn: 'Kandal',
    nameKm: 'កណ្តាល',
    label: 'Kandal',
  },
  {
    key: 'Sihanoukville',
    nameEn: 'Sihanoukville',
    nameKm: 'ព្រះសីហនុ',
    label: 'Sihanoukville',
  },
];

export interface SpecialtyDefinition {
  readonly en: string;
  readonly km: string;
  readonly bilingual: string;
}

export const CAMBODIAN_SPECIALTY_MAP: Record<string, SpecialtyDefinition> = {
  'developmental pediatrician': {
    en: 'Developmental Pediatrician',
    km: 'វេជ្ជបណ្ឌិតឯកទេសកុមារ',
    bilingual: 'Developmental Pediatrician (វេជ្ជបណ្ឌិតឯកទេសកុមារ)',
  },
  'developmental pediatrics': {
    en: 'Developmental Pediatrician',
    km: 'វេជ្ជបណ្ឌិតឯកទេសកុមារ',
    bilingual: 'Developmental Pediatrician (វេជ្ជបណ្ឌិតឯកទេសកុមារ)',
  },
  pediatrician: {
    en: 'Developmental Pediatrician',
    km: 'វេជ្ជបណ្ឌិតឯកទេសកុមារ',
    bilingual: 'Developmental Pediatrician (វេជ្ជបណ្ឌិតឯកទេសកុមារ)',
  },
  'speech-language pathologist': {
    en: 'Speech-Language Pathologist',
    km: 'អ្នកព្យាបាលការនិយាយ និងភាសា',
    bilingual: 'Speech-Language Pathologist (អ្នកព្យាបាលការនិយាយ និងភាសា)',
  },
  'speech therapy': {
    en: 'Speech-Language Pathologist',
    km: 'អ្នកព្យាបាលការនិយាយ និងភាសា',
    bilingual: 'Speech-Language Pathologist (អ្នកព្យាបាលការនិយាយ និងភាសា)',
  },
  'speech therapist': {
    en: 'Speech-Language Pathologist',
    km: 'អ្នកព្យាបាលការនិយាយ និងភាសា',
    bilingual: 'Speech-Language Pathologist (អ្នកព្យាបាលការនិយាយ និងភាសា)',
  },
  'occupational therapist': {
    en: 'Occupational Therapist',
    km: 'អ្នកព្យាបាលចលករ និងញាណដឹង',
    bilingual: 'Occupational Therapist (អ្នកព្យាបាលចលករ និងញាណដឹង)',
  },
  'occupational therapy': {
    en: 'Occupational Therapist',
    km: 'អ្នកព្យាបាលចលករ និងញាណដឹង',
    bilingual: 'Occupational Therapist (អ្នកព្យាបាលចលករ និងញាណដឹង)',
  },
  'child neurologist': {
    en: 'Child Neurologist',
    km: 'វេជ្ជបណ្ឌិតឯកទេសប្រព័ន្ធប្រសាទកុមារ',
    bilingual: 'Child Neurologist (វេជ្ជបណ្ឌិតឯកទេសប្រព័ន្ធប្រសាទកុមារ)',
  },
  'pediatric neurologist': {
    en: 'Child Neurologist',
    km: 'វេជ្ជបណ្ឌិតឯកទេសប្រព័ន្ធប្រសាទកុមារ',
    bilingual: 'Child Neurologist (វេជ្ជបណ្ឌិតឯកទេសប្រព័ន្ធប្រសាទកុមារ)',
  },
  'child neurology': {
    en: 'Child Neurologist',
    km: 'វេជ្ជបណ្ឌិតឯកទេសប្រព័ន្ធប្រសាទកុមារ',
    bilingual: 'Child Neurologist (វេជ្ជបណ្ឌិតឯកទេសប្រព័ន្ធប្រសាទកុមារ)',
  },
};

export function formatSpecialtyBilingual(specialty: string, lang = 'km'): string {
  const norm = (specialty || '').toLowerCase().trim();
  const def = CAMBODIAN_SPECIALTY_MAP[norm];
  if (!def) return specialty;
  if (lang === 'km') {
    return def.km;
  }
  return def.en;
}

export function formatCityBilingual(city: string, lang = 'km'): string {
  const norm = (city || '').toLowerCase().trim();
  const match = CAMBODIA_PROVINCES.find(
    (p) =>
      p.key.toLowerCase() === norm ||
      p.nameEn.toLowerCase() === norm ||
      p.nameKm.toLowerCase() === norm ||
      norm.includes(p.nameEn.toLowerCase()) ||
      norm.includes(p.nameKm.toLowerCase()) ||
      (p.key === 'Phnom Penh' && (norm.includes('phnom penh') || norm.includes('ភ្នំពេញ'))),
  );
  if (!match) return city;
  if (lang === 'km') {
    return match.nameKm;
  }
  return match.nameEn;
}

export function formatHospitalName(name: string, lang = 'km'): string {
  if (!name) return '';
  const match = name.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    const en = match[1].trim();
    const km = match[2].trim();
    return lang === 'km' ? km : en;
  }
  return name;
}

export const CAMBODIAN_HOSPITALS_SEED: readonly HospitalResponse[] = [
  {
    id: 'demo-hospital-1',
    name: 'National Pediatric Hospital (មន្ទីរពេទ្យកុមារជាតិ)',
    city: 'Phnom Penh',
    address: 'Russian Federation Blvd, Tuol Kork, Phnom Penh',
    services:
      'Developmental pediatrics, Speech therapy, Child neurology, Autism screening, Neurodevelopmental diagnostics',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-hospital-kantha-bopha',
    name: 'Kantha Bopha Children’s Hospital (មន្ទីរពេទ្យគន្ធបុប្ផា)',
    city: 'Phnom Penh',
    address: 'Wat Phnom, Daun Penh, Phnom Penh & Jayavarman VII, Siem Reap',
    services:
      'Free pediatric emergency care, Pediatric neurology, Child development, Comprehensive inpatient pediatric care',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-hospital-sunrise',
    name: 'Sunrise Japan Hospital (មន្ទីរពេទ្យ សាន់រ៉ាយស៍ ជប៉ុន)',
    city: 'Phnom Penh',
    address: 'Kola Loum St, Chroy Changvar, Phnom Penh',
    services:
      'Pediatrics, Child neurology, Occupational therapy, Sensory integration, Pediatric rehabilitation',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-hospital-calmette',
    name: 'Calmette Hospital (មន្ទីរពេទ្យកាល់ម៉ែត)',
    city: 'Phnom Penh',
    address: 'No 3 Monivong Blvd, Srah Chork, Daun Penh, Phnom Penh',
    services:
      'Pediatric consultation, Neurodevelopmental diagnostics, Child mental health, Brain imaging',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-hospital-khmer-soviet',
    name: 'Khmer-Soviet Friendship Hospital (មន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត)',
    city: 'Phnom Penh',
    address: 'Yothapol Khemarak Phoumin Blvd (271), Chamkar Mon, Phnom Penh',
    services: 'Pediatrics, Physical therapy, Speech therapy, Occupational therapy, Child neurology',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-hospital-ahc',
    name: 'Angkor Hospital for Children (មន្ទីរពេទ្យកុមារអង្គរ)',
    city: 'Siem Reap',
    address: 'Tep Vong St & Oum Chhay St, Svay Dangkum, Siem Reap',
    services:
      'Pediatric intensive care, Developmental pediatrics, Speech support, Physical therapy, Community healthcare',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const CAMBODIAN_SPECIALISTS_SEED: readonly DoctorResponse[] = [
  {
    id: 'doc-nph-lina',
    hospitalId: 'demo-hospital-1',
    fullName: 'Dr. Lina Sok',
    specialty: 'Developmental Pediatrician',
    bio: 'Lead developmental pediatrician at National Pediatric Hospital, specializing in autism assessments, developmental milestones, and parent coaching.',
    availableDays: '1,2,3,4,5',
    startHour: 8,
    endHour: 17,
    slotDurationMinutes: 30,
  },
  {
    id: 'doc-kb-vicheth',
    hospitalId: 'demo-hospital-kantha-bopha',
    fullName: 'Dr. Chan Vicheth',
    specialty: 'Speech-Language Pathologist',
    bio: 'Clinical speech-language pathologist specializing in non-verbal communication, augmentative systems, and early pediatric language breakthroughs.',
    availableDays: '1,2,3,4,5',
    startHour: 8,
    endHour: 16,
    slotDurationMinutes: 30,
  },
  {
    id: 'doc-sjh-sreymom',
    hospitalId: 'demo-hospital-sunrise',
    fullName: 'Dr. Sreymom Keo',
    specialty: 'Occupational Therapist',
    bio: 'Sensory integration certified occupational therapist focusing on tactile regulation, motor coordination, and neurodivergent child independence.',
    availableDays: '1,3,5',
    startHour: 9,
    endHour: 17,
    slotDurationMinutes: 45,
  },
  {
    id: 'doc-calmette-sophea',
    hospitalId: 'demo-hospital-calmette',
    fullName: 'Dr. Sophea Meng',
    specialty: 'Child Neurologist',
    bio: 'Pediatric neurologist specializing in comprehensive neurodevelopmental assessments, EEG interpretation, and epilepsy co-management.',
    availableDays: '2,4',
    startHour: 9,
    endHour: 16,
    slotDurationMinutes: 45,
  },
  {
    id: 'doc-ks-buntheoun',
    hospitalId: 'demo-hospital-khmer-soviet',
    fullName: 'Dr. Buntheoun Rath',
    specialty: 'Developmental Pediatrician',
    bio: 'Pediatric care specialist with over 15 years experience in child health, developmental screening, and family-centered intervention.',
    availableDays: '1,2,3,4',
    startHour: 8,
    endHour: 15,
    slotDurationMinutes: 30,
  },
  {
    id: 'doc-ahc-rithy',
    hospitalId: 'demo-hospital-ahc',
    fullName: 'Dr. Rithy Sam',
    specialty: 'Speech-Language Pathologist',
    bio: 'Angkor Hospital for Children speech therapy director, supporting speech milestones and neurodivergent communication across Siem Reap.',
    availableDays: '1,3,5',
    startHour: 8,
    endHour: 16,
    slotDurationMinutes: 30,
  },
];
