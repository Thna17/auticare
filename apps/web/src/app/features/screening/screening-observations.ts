import type { AgeBand, RiskLevel } from '@auticare/contracts';

/**
 * Static, deterministic observation sentences for the "What we noticed" section.
 * Keyed by age band + category + risk level. Only MODERATE and HIGH have entries
 * (LOW categories are skipped). This is a fixed lookup — NOT AI/LLM-generated —
 * and the text is used verbatim.
 */
const EN_SCREENING_OBSERVATIONS: Record<
  AgeBand,
  Record<string, Partial<Record<RiskLevel, string>>>
> = {
  TODDLER: {
    'Social Interaction': {
      MODERATE:
        'Responses suggest your child may engage with others somewhat less often than expected for their age.',
      HIGH: 'Responses suggest your child may show limited engagement with others, such as eye contact or shared enjoyment.',
    },
    Communication: {
      MODERATE:
        "Responses suggest your child's use of gestures or words to communicate may be developing more slowly than expected.",
      HIGH: 'Responses suggest your child may rely less on gestures, words, or imitation to communicate than is typical for their age.',
    },
    'Play & Imagination': {
      MODERATE:
        'Responses suggest your child may show less pretend or imaginative play than expected for their age.',
      HIGH: 'Responses suggest your child may show limited pretend play or unusual use of toys, such as repetitive lining up or spinning.',
    },
    'Sensory Response': {
      MODERATE:
        'Responses suggest your child may react more strongly than typical to certain sounds, textures, or sensations.',
      HIGH: 'Responses suggest your child may show frequent strong reactions to sensory input, such as loud noises or specific textures.',
    },
    'Motor & Repetitive Behaviors': {
      MODERATE:
        'Responses suggest your child may show some repetitive movements or routines more often than expected.',
      HIGH: 'Responses suggest your child may frequently show repetitive movements, such as hand-flapping or insisting on strict routines.',
    },
  },
  PRESCHOOL: {
    'Social Interaction': {
      MODERATE:
        'Responses suggest your child may find it somewhat harder than expected to connect with other children.',
      HIGH: "Responses suggest your child may have significant difficulty seeking out peers or noticing others' feelings.",
    },
    Communication: {
      MODERATE:
        'Responses suggest your child may find back-and-forth conversation or understanding social cues somewhat challenging.',
      HIGH: 'Responses suggest your child may have significant difficulty holding conversations or reading social and emotional cues.',
    },
    'Play & Imagination': {
      MODERATE:
        "Responses suggest your child's play may be somewhat more repetitive or narrowly focused than expected for their age.",
      HIGH: "Responses suggest your child's play may be strongly repetitive or centered on a narrow set of interests.",
    },
    'Sensory Response': {
      MODERATE:
        'Responses suggest your child may be more sensitive than typical to certain sounds, textures, or busy environments.',
      HIGH: 'Responses suggest your child may frequently become distressed or overwhelmed by sensory input or crowded settings.',
    },
    'Flexibility & Routine': {
      MODERATE:
        'Responses suggest your child may find changes to routine somewhat more difficult than expected.',
      HIGH: 'Responses suggest your child may become significantly distressed by changes to routine or transitions between activities.',
    },
  },
};

const KM_SCREENING_OBSERVATIONS: Record<
  AgeBand,
  Record<string, Partial<Record<RiskLevel, string>>>
> = {
  TODDLER: {
    'Social Interaction': {
      MODERATE:
        'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានទំនាក់ទំនងជាមួយអ្នកដទៃតិចជាងការរំពឹងទុកសម្រាប់អាយុរបស់ពួកគេ។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានទំនាក់ទំនងមានកម្រិតជាមួយអ្នកដទៃ ដូចជាការសម្លឹងមើលភ្នែក ឬការចែករំលែកភាពរីករាយ។',
    },
    Communication: {
      MODERATE:
        'ចម្លើយបង្ហាញថាការប្រើកាយវិការ ឬពាក្យសម្តីដើម្បីប្រាស្រ័យទាក់ទង អាចមានការវិវត្តយឺតជាងការរំពឹងទុក។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចពឹងផ្អែកតិចជាងលើកាយវិការ ពាក្យសម្តី ឬការធ្វើត្រាប់តាមដើម្បីប្រាស្រ័យទាក់ទង។',
    },
    'Play & Imagination': {
      MODERATE:
        'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចបង្ហាញការលេងបែបស្រមើស្រមៃតិចជាងការរំពឹងទុកសម្រាប់អាយុរបស់ពួកគេ។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានការលេងបែបស្រមើស្រមៃមានកម្រិត ឬប្រើប្រាស់ប្រដាប់ក្មេងលេងមិនធម្មតា ដូចជាតម្រៀបជាជួរដដែលៗ ឬបង្វិល។',
    },
    'Sensory Response': {
      MODERATE:
        'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានប្រតិកម្មខ្លាំងជាងធម្មតាចំពោះសំឡេង ផ្ទៃប៉ះ ឬញាណដឹងមួយចំនួន។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានប្រតិកម្មខ្លាំងញឹកញាប់ចំពោះញាណដឹង ដូចជាសំឡេងខ្លាំង ឬផ្ទៃប៉ះជាក់លាក់។',
    },
    'Motor & Repetitive Behaviors': {
      MODERATE:
        'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចបង្ហាញចលនា ឬទម្លាប់ដដែលៗមួយចំនួនញឹកញាប់ជាងការរំពឹងទុក។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចបង្ហាញចលនាដដែលៗញឹកញាប់ ដូចជាការបក់ដៃ ឬទាមទារទម្លាប់យ៉ាងតឹងរ៉ឹង។',
    },
  },
  PRESCHOOL: {
    'Social Interaction': {
      MODERATE:
        'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចពិបាកក្នុងការផ្សារភ្ជាប់ទំនាក់ទំនងជាមួយកុមារដទៃជាងការរំពឹងទុក។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានការលំបាកខ្លាំងក្នុងការស្វែងរកមិត្តភក្តិ ឬកត់សម្គាល់អារម្មណ៍អ្នកដទៃ។',
    },
    Communication: {
      MODERATE: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចពិបាកក្នុងការសន្ទនាឆ្លើយឆ្លង ឬការយល់ដឹងពីសញ្ញាសង្គម។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានការលំបាកខ្លាំងក្នុងការសន្ទនា ឬការយល់ដឹងពីសញ្ញាសង្គម និងអារម្មណ៍។',
    },
    'Play & Imagination': {
      MODERATE:
        'ចម្លើយបង្ហាញថាការលេងរបស់កូនអ្នកអាចមានលក្ខណៈដដែលៗ ឬផ្តោតលើចំណាប់អារម្មណ៍ចង្អៀតជាងការរំពឹងទុក។',
      HIGH: 'ចម្លើយបង្ហាញថាការលេងរបស់កូនអ្នកអាចមានលក្ខណៈដដែលៗខ្លាំង ឬផ្តោតលើចំណាប់អារម្មណ៍ចង្អៀត។',
    },
    'Sensory Response': {
      MODERATE:
        'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានភាពរសើបជាងធម្មតាចំពោះសំឡេង ផ្ទៃប៉ះ ឬបរិស្ថានដែលមានសកម្មភាពច្រើន។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានអារម្មណ៍តានតឹងញឹកញាប់ដោយសារញាណដឹង ឬកន្លែងដែលមានមនុស្សច្រើន។',
    },
    'Flexibility & Routine': {
      MODERATE:
        'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចពិបាកក្នុងការសម្របខ្លួនទៅនឹងការផ្លាស់ប្តូរទម្លាប់ជាងការរំពឹងទុក។',
      HIGH: 'ចម្លើយបង្ហាញថាកូនរបស់អ្នកអាចមានអារម្មណ៍តានតឹងខ្លាំងចំពោះការផ្លាស់ប្តូរទម្លាប់ ឬការផ្លាស់ប្តូរសកម្មភាព។',
    },
  },
};

/**
 * Returns the observation sentence for a category at a given band + risk level,
 * or null when there is no entry (e.g. LOW risk, or an unknown category/band).
 */
export const observationFor = (
  ageBand: AgeBand | null,
  category: string,
  riskLevel: RiskLevel,
  lang: 'km' | 'en' = 'en',
): string | null => {
  if (!ageBand) return null;
  const dict = lang === 'km' ? KM_SCREENING_OBSERVATIONS : EN_SCREENING_OBSERVATIONS;
  return dict[ageBand]?.[category]?.[riskLevel] ?? null;
};
