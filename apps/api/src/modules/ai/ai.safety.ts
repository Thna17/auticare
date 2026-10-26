import type { AiLanguage } from '@auticare/contracts';

/**
 * The parts of the assistant's behaviour that must not depend on a model.
 *
 * Everything in this file is a pure function with no network access, so it can be
 * unit-tested and reviewed line by line. It is a floor, not a guarantee: the
 * system prompt does most of the work, and this catches the two cases where
 * getting it wrong would be worst — a parent in danger, and a request for
 * medication advice — plus a backstop against a verdict slipping into an answer.
 */

export type MessageClassification = 'OK' | 'CRISIS' | 'MEDICATION';

/**
 * Phrases that suggest immediate danger. Deliberately literal rather than clever:
 * a false positive costs one reassuring message and a crisis link, a false
 * negative costs much more.
 */
const CRISIS_PATTERNS: readonly RegExp[] = [
  /\b(kill|hurt|harm)\s+(myself|my ?self)\b/i,
  /\bend (it|my life)\b/i,
  /\bwant to die\b/i,
  /\bdon'?t want to (live|be here) anymore\b/i,
  /\bsuicid/i,
  /\bself[-\s]?harm/i,
  /\bkill (my|the|her|him|their) (baby|child|son|daughter)\b/i,
  // Khmer: self-harm / wanting to die / killing oneself.
  /សម្លាប់ខ្លួន/,
  /ចង់ស្លាប់/,
  /ធ្វើបាបខ្លួនឯង/,
  /ចង់បំផ្លាញខ្លួន/,
];

/**
 * Medication, dose and supplement requests. The product rule is absolute — no
 * medication advice in any form — so this refuses before a model is involved.
 */
const MEDICATION_PATTERNS: readonly RegExp[] = [
  /\b\d+\s?(mg|milligram|ml|mcg|ug)\b/i,
  /\b(dose|dosage|overdose)\b/i,
  /\b(melatonin|risperidone|risperdal|aripiprazole|abilify|fluoxetine|prozac|ssri|methylphenidate|ritalin|haloperidol|clonidine)\b/i,
  /\b(prescribe|prescription|supplement|medication|medicine|drug)\b/i,
  // Khmer: medicine, dose, giving medicine.
  /ថ្នាំ/,
  /កម្រិតថ្នាំ/,
  /ឱសថ/,
];

export const classifyParentMessage = (text: string): MessageClassification => {
  if (CRISIS_PATTERNS.some((pattern) => pattern.test(text))) return 'CRISIS';
  if (MEDICATION_PATTERNS.some((pattern) => pattern.test(text))) return 'MEDICATION';
  return 'OK';
};

export const crisisReply = (language: AiLanguage): string =>
  language === 'km'
    ? 'អ្វីដែលអ្នកកំពុងពិពណ៌នាស្តាប់ទៅដូចជាត្រូវការជំនួយឥឡូវនេះ មិនមែនការសន្ទនាធម្មតាទេ។ សូមទាក់ទងសេវាសង្គ្រោះបន្ទាន់ ឬមន្ទីរពេទ្យដែលនៅជិតបំផុតភ្លាមៗ។ ទំព័រជំនួយបន្ទាន់របស់ AutiCare មានលេខទូរស័ព្ទដែលអ្នកអាចទូរស័ព្ទបាន។ ប្រសិនបើអាច សូមប្រាប់នរណាម្នាក់នៅក្បែរអ្នកថាអ្នកត្រូវការជំនួយយប់នេះ — អ្នកមិនគួរនៅម្នាក់ឯងជាមួយរឿងនេះទេ។'
    : 'The way you are describing this sounds like it needs help right now, not a conversation. Please contact emergency services or the nearest hospital immediately. AutiCare’s crisis page lists people you can call from the app. If you can, tell someone near you that you need support tonight — you should not have to carry this alone.';

export const medicationReply = (language: AiLanguage): string =>
  language === 'km'
    ? 'ខ្ញុំមិនអាចផ្តល់យោបល់អំពីថ្នាំ កម្រិតថ្នាំ ឬអាហារបំប៉នបានទេ — រឿងនេះត្រូវមកពីគ្រូពេទ្យដែលស្គាល់កូនអ្នក។ អ្វីដែលខ្ញុំអាចជួយបាន គឺជុំវិញការលេបថ្នាំ៖ ទម្លាប់ប្រចាំថ្ងៃ ការគេង ការផ្លាស់ប្តូរសកម្មភាព និងរបៀបរៀបចំសំណួរសម្រាប់ពេលជួបគ្រូពេទ្យ។'
    : 'I can’t advise on medication, doses or supplements — that has to come from the clinician who knows your child. What I can help with is everything around it: routines, sleep, transitions, and how to prepare the questions to ask at the appointment where you raise it.';

const HAS_REFERRAL =
  /clinician|doctor|paediatric|pediatric|specialist|គ្រូពេទ្យ|វេជ្ជបណ្ឌិត|អ្នកជំនាញ/i;

const REFERRAL = {
  en: 'If any of this worries you, a qualified clinician should see your child. This is general guidance, not a diagnosis.',
  km: 'ប្រសិនបើអ្វីមួយក្នុងចំណោមនេះធ្វើឱ្យអ្នកបារម្ភ គ្រូពេទ្យជំនាញគួរពិនិត្យកូនអ្នក។ នេះជាការណែនាំទូទៅ មិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ។',
} as const;

/** Every health answer ends by pointing back to a clinician. */
export const ensureReferral = (answer: string, language: AiLanguage): string =>
  HAS_REFERRAL.test(answer) ? answer : `${answer.trim()}\n\n${REFERRAL[language]}`;

/**
 * Backstop against a verdict appearing in model output.
 *
 * This deliberately does not try to detect every phrasing — that race cannot be
 * won with regular expressions. It catches the two constructions a model reaches
 * for most often when it slides from describing behaviour to naming a condition,
 * and replaces them with a statement the product can stand behind.
 */
const VERDICT_PATTERNS: readonly RegExp[] = [
  /\byour child (?:is|has|seems to be|appears to be)\s+(?:on the autism spectrum|autistic|suffering from autism|with autism)\b/gi,
  /\b(?:this|that) (?:means|suggests|confirms)\s+(?:your child has|your child is)\s+(?:autism|autistic)\b/gi,
];

export const softenDiagnosisClaims = (answer: string): string =>
  VERDICT_PATTERNS.reduce(
    (text, pattern) =>
      text.replace(pattern, 'what you are describing is worth having a professional look at'),
    answer,
  );

/** True when the answer still asserts a diagnosis after softening. Used in tests. */
export const containsDiagnosisClaim = (answer: string): boolean =>
  VERDICT_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(answer);
  });
