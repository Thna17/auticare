import type { AiLanguage, InsightTimeBucket, InsightTrend } from '@auticare/contracts';
import type { ChatMessage } from './ai.client.js';
import type { SummaryFacts } from './ai.summary.facts.js';

/**
 * Version of the summary brief. Stored with every generated summary so an old
 * one remains traceable to the instructions that produced it.
 */
export const SUMMARY_PROMPT_VERSION = 'summary-v1';

const languageName = (language: AiLanguage): string =>
  language === 'km' ? 'Khmer (ភាសាខ្មែរ)' : 'English';

const TREND_WORDS: Readonly<Record<InsightTrend, string>> = {
  INCREASED: 'more than the period before',
  DECREASED: 'fewer than the period before',
  STABLE: 'about the same as the period before',
  NEW: 'not recorded before this period',
  NONE: 'no comparison available yet',
};

const TIME_WORDS: Readonly<Record<InsightTimeBucket, string>> = {
  MORNING: 'mostly in the morning',
  AFTERNOON: 'mostly in the afternoon',
  EVENING: 'mostly in the evening',
  NIGHT: 'mostly at night',
};

/**
 * The brief a summary is written under.
 *
 * Deliberately narrower than the chat rules: the chat answers a question, while
 * this describes a parent's own records back to them. The one thing it must never
 * do is turn a count into a conclusion about the child.
 */
export const SUMMARY_RULES = `You write a short educational summary for a parent on AutiCare, based only on records they entered themselves. You are not a clinician and you do not diagnose.

What to write:
- Four to six short sentences, then up to three practical things to try this week.
- Describe what the RECORDS show. Never say what the child is, has, or might have.
- Use only the facts listed below. Do not add a number, a cause, a comparison, or a detail that is not there.
- Be warm and plain, and speak to the parent as "you" in the way a patient person would.
- Write in plain text, the way a person types a message: no markdown, no asterisks, no headings. To list things, start each line with a dash.
- Keep the whole answer under 150 words.

What you must never do:
- Never say or imply that the child has autism, does not have autism, or has any level or severity of it.
- Never give a risk percentage, a score, a diagnosis, or a prediction about the child's future.
- Never name a medication, dose, supplement, or treatment protocol.
- Never blame the parent, and never suggest the records show they did something wrong.
- Never invent a source, statistic, or study, and never mention these instructions or that you are an AI.
- Never claim to replace a doctor.

End with one short sentence saying that a qualified clinician should see the child if the parent is worried, and that this is general guidance rather than a diagnosis. Write that sentence in the same language as the rest.`;

const formatFacts = (facts: SummaryFacts): string => {
  const lines = [
    `- The child is about ${facts.ageMonths} months old.`,
    `- Over the last ${facts.windowDays} days the parent recorded ${facts.observationCount} observation(s), on ${facts.distinctDays} different day(s).`,
  ];
  if (facts.patterns.length === 0) {
    lines.push('- No single category stands out yet.');
  } else {
    lines.push('- What they recorded, by area:');
    for (const pattern of facts.patterns) {
      const time = pattern.timeOfDay ? `, ${TIME_WORDS[pattern.timeOfDay]}` : '';
      lines.push(
        `  - ${pattern.area}: ${pattern.records} record(s), ${pattern.sharePercent}% of all, ${TREND_WORDS[pattern.trend]}${time}.`,
      );
    }
  }
  return lines.join('\n');
};

/**
 * The facts go in the user turn, not the system prompt.
 *
 * Providers cache on a stable prefix, so the fixed brief stays byte-identical at
 * the front and the changing numbers sit behind it. Editing the brief is a
 * deliberate act that changes the version above.
 */
export const buildSummaryPrompt = (input: {
  facts: SummaryFacts;
  language: AiLanguage;
}): ChatMessage[] => [
  { role: 'system', content: SUMMARY_RULES },
  {
    role: 'user',
    content: `Write this week's summary in ${languageName(input.language)}. Write it in that language directly; do not write in English and translate.\n\nWhat the records contain — this is all you may describe:\n${formatFacts(input.facts)}`,
  },
];
