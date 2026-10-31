import type { AiLanguage } from '@auticare/contracts';
import type { ChatMessage } from './ai.client.js';

/** A reviewed passage the answer is allowed to draw on. */
export type GroundingPassage = {
  title: string;
  publisher: string;
  url: string;
  text: string;
};

/**
 * What the model is told about the child.
 *
 * Data minimisation is structural, not a matter of discipline: there is no field
 * here for a name, a date of birth, an address, a questionnaire result, school
 * record or a photo, so none of those can be sent even by mistake. Only an
 * approximate age and a count of recent observations are available when a
 * parent explicitly opts in.
 */
export type ChildContext = {
  ageMonths: number | null;
  observationsLast14Days: number;
};

const languageName = (language: AiLanguage): string =>
  language === 'km' ? 'Khmer (ភាសាខ្មែរ)' : 'English';

/** Exported read-only for the admin AI monitoring page. */
export const RULES = `You are AutiCare's assistant for parents of young children who may be showing signs of autism, in Cambodia. You are not a clinician, you do not diagnose, and you never present yourself as a doctor.

How to answer:
- Answer in PLAIN, WARM, EVERYDAY language, the way an experienced and patient person would explain something to a worried parent.
- Be brief. Three to six sentences, or a short list of steps. A tired parent is reading this on a phone, often at night.
- If the situation is unclear, ask ONE specific follow-up question instead of guessing.
- Prefer what the parent can do tonight, this week, at bedtime, at the market, at a haircut.
- Write plain text, the way a person types a message: no markdown, no asterisks or underscores for emphasis, no headings. To list things, start each line with a dash.
- Acknowledge the parent's effort where it is genuine. Do not flatter.

What you must never do:
- Never say or imply that the child has autism, does not have autism, or has any specific level of autism. Describe behaviour; never name a diagnosis.
- Never estimate autism probability or severity, assign a risk percentage, or derive such a score from chat messages or questionnaire results.
- Never name a medication, dose, supplement, or treatment protocol, and never advise starting or stopping one.
- Never predict what will happen to the child's future.
- Never invent a source, organisation, statistic or study. If reference material is provided, use only that, and cite it as (1), (2) and so on.
- Never claim to replace a doctor, and never discourage a parent from seeing one.

If the parent describes immediate danger to themselves or to the child, stop and tell them to contact emergency services or the crisis page. That takes priority over answering the question.`;

const formatContext = (context: ChildContext | null): string => {
  if (!context) return '';
  const parts: string[] = [];
  if (context.ageMonths !== null) {
    parts.push(`The child is about ${context.ageMonths} months old.`);
  }
  if (context.observationsLast14Days > 0) {
    parts.push(
      `The parent has recorded ${context.observationsLast14Days} observation(s) in the last 14 days.`,
    );
  }
  if (parts.length === 0) return '';
  return `\n\nBackground you may use (never repeat it back word for word, and never read it out as a list):\n${parts.map((part) => `- ${part}`).join('\n')}`;
};

const formatPassages = (passages: readonly GroundingPassage[]): string => {
  if (passages.length === 0) {
    return '\n\nNo reference material was retrieved for this question. Answer from general caregiving practice only, keep it practical, and do not cite anything.';
  }
  const body = passages
    .map(
      (passage, index) => `(${index + 1}) ${passage.title} — ${passage.publisher}\n${passage.text}`,
    )
    .join('\n\n');
  return `\n\nReference material you may use, and the only material you may cite:\n${body}`;
};

export const buildSystemPrompt = (input: {
  language: AiLanguage;
  context: ChildContext | null;
  passages: readonly GroundingPassage[];
}): string =>
  `${RULES}\n\nWrite your entire answer in ${languageName(input.language)}. Do not answer in another language, and do not provide a translation.${formatContext(input.context)}${formatPassages(input.passages)}`;

/**
 * The language to answer in: the one the parent wrote in, not the site's language
 * switch. Someone browsing in Khmer who types in English wants English back, and
 * the other way round. Only a message with no letters to go on ("ok", "?", a
 * number) falls back to the language the parent selected.
 */
export const replyLanguage = (message: string, selected: AiLanguage): AiLanguage => {
  const khmer = (message.match(/[ក-៿]/g) ?? []).length;
  const latin = (message.match(/[A-Za-z]/g) ?? []).length;
  if (khmer + latin < 3) return selected;
  return khmer >= latin ? 'km' : 'en';
};

/**
 * Room for one answer. The rules already ask for three to six sentences; this is
 * only the ceiling. Khmer script costs several times more tokens than English for
 * the same sentence, and at 700 an ordinary Khmer answer was cut off mid-word
 * (5 of 30 in the AI evaluation), so Khmer gets more room.
 */
export const answerTokenLimit = (language: AiLanguage): number => (language === 'km' ? 1800 : 700);

/** Recent turns only: a long transcript is neither needed nor cheap. */
export const buildConversationMessages = (
  history: readonly { role: 'USER' | 'ASSISTANT'; content: string }[],
  maxTurns = 10,
): ChatMessage[] =>
  history.slice(-maxTurns).map((message) => ({
    role: message.role === 'USER' ? 'user' : 'assistant',
    content: message.content,
  }));

/** A short title for the conversation list, taken from the parent's own words. */
export const titleFromMessage = (content: string): string => {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  return cleaned.length <= 60 ? cleaned : `${cleaned.slice(0, 57)}…`;
};
