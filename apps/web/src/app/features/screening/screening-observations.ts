import type { AgeBand, RiskLevel } from '@auticare/contracts';

/**
 * Static, deterministic observation sentences for the "What we noticed" section.
 * Keyed by age band + category + risk level. Only MODERATE and HIGH have entries
 * (LOW categories are skipped). This is a fixed lookup — NOT AI/LLM-generated —
 * and the text is used verbatim.
 */
const SCREENING_OBSERVATIONS: Record<
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

/**
 * Returns the observation sentence for a category at a given band + risk level,
 * or null when there is no entry (e.g. LOW risk, or an unknown category/band).
 */
export const observationFor = (
  ageBand: AgeBand | null,
  category: string,
  riskLevel: RiskLevel,
): string | null => {
  if (!ageBand) return null;
  return SCREENING_OBSERVATIONS[ageBand]?.[category]?.[riskLevel] ?? null;
};
