/**
 * AutiCare Find Support - Facility Image Resolver
 *
 * Maps curated facility photos, campuses, and logos to Cambodian schools and healthcare centres.
 * Images are located in apps/web/public/images/find-support/ and served from /images/find-support/.
 */

interface FacilityImageMapping {
  readonly keywords: readonly string[];
  readonly file: string;
}

const FACILITY_IMAGE_MAPPINGS: readonly FacilityImageMapping[] = [
  // --- Schools ---
  {
    keywords: ['hope kids', 'hopekids', 'dir-school-hope-kids'],
    file: 'Hope.png',
  },
  {
    keywords: ['parrot', 'dir-school-parrot'],
    file: 'Parrot School.png',
  },
  {
    keywords: ['skds', 'special kids', 'special kitd', 'dir-school-skds'],
    file: 'Special kitd special need.png',
  },
  {
    keywords: ['ascend', 'dir-school-ascend'],
    file: 'Ascend.png',
  },
  {
    keywords: ['orbrom', 'orb rom', 'dir-school-orbrom'],
    file: 'OrbRom Learning Support Centre.png',
  },
  {
    keywords: ['smilestone', 'smilestones', 'dir-school-smilestones'],
    file: 'smiletone.png',
  },
  {
    keywords: ['lumina', 'dir-school-lumina'],
    file: 'Lumina.png',
  },
  {
    keywords: ['growing special', 'gses', 'dir-school-gses'],
    file: 'growing special educatoin.png',
  },
  {
    keywords: ['takhmao special', 'takhmao', 'taknmao', 'dir-school-takhmao'],
    file: 'Taknmao special education high school.png',
  },
  {
    keywords: ['rabbit', 'ទន្សាយ', 'demo-school-1'],
    file: 'Rabbit.png',
  },
  {
    keywords: ['hands of hope', 'ដៃនៃក្តីសង្ឃឹម', 'ក្ដីសង្ឃឹម', 'demo-school-hands-of-hope'],
    file: 'Hands of Hope Community (សហគមន៍ដៃនៃក្តីសង្ឃឹម).png',
  },
  {
    keywords: [
      'nise',
      'national institute of special education',
      'វិទ្យាស្ថានជាតិអប់រំពិសេស',
      'demo-school-nise',
    ],
    file: 'National Institute of Special Education (វិទ្យាស្ថានជាតិអប់រំពិសេស - NISE).png',
  },
  {
    keywords: ['grace house', 'demo-school-grace-house'],
    file: 'Grace House Community Inclusive Classrooms.png',
  },

  // --- Healthcare Facilities ---
  {
    keywords: ['national pediatric', 'កុមារជាតិ', 'demo-hospital-1'],
    file: 'National Pediatric Hospital (Speech & Development Unit).png',
  },
  {
    keywords: ['kantha bopha', 'គន្ធបុប្ផា', 'demo-hospital-kantha-bopha'],
    file: 'Kantha Bopha Children’s Hospital (មន្ទីរពេទ្យគន្ធបុប្ផា).png',
  },
  {
    keywords: ['sunrise japan', 'សាន់រ៉ាយស៍', 'demo-hospital-sunrise'],
    file: 'Sunrise Japan Hospital (មន្ទីរពេទ្យ សាន់រ៉ាយស៍ ជប៉ុន).png',
  },
  {
    keywords: ['calmette', 'កាល់ម៉ែត', 'demo-hospital-calmette'],
    file: 'Calmette Hospital (មន្ទីរពេទ្យកាល់ម៉ែត).png',
  },
  {
    keywords: ['khmer-soviet', 'ខ្មែរ-សូវៀត', 'demo-hospital-khmer-soviet'],
    file: 'Khmer-Soviet Friendship Hospital (មន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត).png',
  },
  {
    keywords: ['angkor hospital', 'កុមារអង្គរ', 'demo-hospital-ahc'],
    file: 'Angkor Hospital for Children (មន្ទីរពេទ្យកុមារអង្គរ).png',
  },
  {
    keywords: ['caritas', 'ccamh', 'dir-hospital-ccamh'],
    file: 'Caritas-CCAMH (Center for Child and Adolescent Mental Health).png',
  },
  {
    keywords: ['maxicare', 'dir-hospital-maxicare'],
    file: 'Maxicare Children Hospital.png',
  },
  {
    keywords: ['intercare', 'icwc', 'dir-hospital-intercare'],
    file: 'Intercare Child Wellbeing Center (ICWC).png',
  },
];

/**
 * Returns the public image URL for a support facility if a curated asset exists.
 * Returns null if no image asset is available for this facility.
 */
export function getFacilityImageUrl(name = '', id = ''): string | null {
  const lowerName = (name || '').toLowerCase();
  const lowerId = (id || '').toLowerCase();

  const match = FACILITY_IMAGE_MAPPINGS.find((m) =>
    m.keywords.some((kw) => lowerName.includes(kw) || lowerId.includes(kw)),
  );

  return match ? `/images/find-support/${encodeURIComponent(match.file)}` : null;
}
