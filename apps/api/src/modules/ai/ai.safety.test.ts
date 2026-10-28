import { describe, expect, it } from 'vitest';
import {
  classifyParentMessage,
  containsDiagnosisClaim,
  crisisReply,
  ensureReferral,
  medicationReply,
  softenDiagnosisClaims,
} from './ai.safety.js';
import { RULES } from './ai.prompt.js';

describe('classifyParentMessage', () => {
  it('flags an explicit statement of self-harm risk', () => {
    expect(classifyParentMessage('I want to kill myself tonight')).toBe('CRISIS');
  });

  it('flags risk expressed in Khmer', () => {
    expect(classifyParentMessage('ខ្ញុំចង់ស្លាប់')).toBe('CRISIS');
  });

  it('flags a medication question', () => {
    expect(classifyParentMessage('Is 5 mg of melatonin safe for a 3 year old?')).toBe('MEDICATION');
    expect(classifyParentMessage('តើថ្នាំនេះល្អទេ?')).toBe('MEDICATION');
  });

  it('lets an ordinary caregiving question through', () => {
    expect(classifyParentMessage('My son screams when we leave the house. What can I do?')).toBe(
      'OK',
    );
    expect(classifyParentMessage('Is it normal that he does not point at things?')).toBe('OK');
  });
});

describe('fixed safety replies', () => {
  it('sends a parent in distress to emergency help, not to a model', () => {
    expect(crisisReply('en')).toMatch(/emergency services/i);
    expect(crisisReply('km')).toContain('សង្គ្រោះបន្ទាន់');
  });

  it('refuses medication advice while still being useful', () => {
    const reply = medicationReply('en');
    expect(reply).toMatch(/can’t advise on medication/i);
    expect(reply).toMatch(/clinician/i);
  });
});

describe('ensureReferral', () => {
  it('appends the clinician referral when the answer has none', () => {
    const answer = ensureReferral('Try a visual schedule before bedtime.', 'en');
    expect(answer).toMatch(/qualified clinician/);
    expect(answer).toMatch(/not a diagnosis/);
  });

  it('does not repeat the referral when the answer already points at a clinician', () => {
    const answer = 'Ask your paediatrician about this.';
    expect(ensureReferral(answer, 'en')).toBe(answer);
  });

  it('uses Khmer referral wording for Khmer answers', () => {
    expect(ensureReferral('សាកល្បងកាលវិភាគរូបភាព។', 'km')).toContain('គ្រូពេទ្យ');
  });
});

describe('softenDiagnosisClaims', () => {
  it('removes a verdict about the child', () => {
    const softened = softenDiagnosisClaims(
      'Your child is autistic. That is why he lines up his cars.',
    );
    expect(containsDiagnosisClaim(softened)).toBe(false);
    expect(softened).not.toMatch(/is autistic/i);
    expect(softened).toMatch(/professional look/);
  });

  it('leaves ordinary descriptive language alone', () => {
    const answer = 'Many three-year-olds line up their toys. It is worth mentioning at your visit.';
    expect(softenDiagnosisClaims(answer)).toBe(answer);
  });
});

describe('assistant system prompt safety', () => {
  it('prohibits autism probability and severity estimates from chat or questionnaire answers', () => {
    expect(RULES).toMatch(/Never estimate autism probability or severity/i);
    expect(RULES).toMatch(/questionnaire results/i);
  });
});
