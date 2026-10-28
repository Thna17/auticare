import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import {
  analyzeCheckIn,
  calculateResponseScore,
  CHECKIN_QUESTIONS,
} from './free-checkin.component';

describe('free developmental check-in analysis', () => {
  it('provides the ten original prompts', () => {
    expect(CHECKIN_QUESTIONS).toHaveLength(10);
    expect(CHECKIN_QUESTIONS[0].text).toContain("call your child's name");
    expect(CHECKIN_QUESTIONS[9].text).toContain('follow your pointing');
  });

  it('interprets often differently for positive and concern-related prompts', () => {
    const responses = Array.from({ length: 10 }, () => undefined as 'Often' | undefined);
    responses[0] = 'Often';
    responses[6] = 'Often';
    const areas = analyzeCheckIn(responses);
    expect(areas[0].strengths.map((item) => item.question)).toHaveLength(1);
    expect(areas[3].explore.map((item) => item.question)).toHaveLength(1);
  });

  it('keeps not sure answers separate from strengths and areas to explore', () => {
    const areas = analyzeCheckIn(['Not sure / Not observed']);
    expect(areas[0].unknown).toHaveLength(1);
    expect(areas[0].strengths).toHaveLength(0);
    expect(areas[0].explore).toHaveLength(0);
  });

  it('changes the descriptive output with the answers rather than returning a fixed band', () => {
    const mostlyOften = analyzeCheckIn(Array.from({ length: 10 }, () => 'Often' as const));
    const mostlyRarely = analyzeCheckIn(Array.from({ length: 10 }, () => 'Rarely' as const));
    expect(mostlyOften[0].strengths.length).toBeGreaterThan(mostlyRarely[0].strengths.length);
    expect(mostlyRarely[3].strengths.length).toBeGreaterThan(mostlyOften[3].strengths.length);
  });

  it('calculates a response-only percentage with question polarity', () => {
    const responses = Array.from({ length: 10 }, () => 'Often' as const);
    const score = calculateResponseScore(responses);
    expect(score.scoredResponses).toBe(10);
    expect(score.percentage).toBe(30);
  });

  it('changes the score when submitted response combinations change', () => {
    const lowerConcern = CHECKIN_QUESTIONS.map((question) =>
      question.positive ? ('Often' as const) : ('Rarely' as const),
    );
    const higherConcern = CHECKIN_QUESTIONS.map((question) =>
      question.positive ? ('Rarely' as const) : ('Often' as const),
    );
    expect(calculateResponseScore(lowerConcern).percentage).toBe(0);
    expect(calculateResponseScore(higherConcern).percentage).toBe(100);
  });

  it('excludes not sure and unanswered responses from the score', () => {
    const score = calculateResponseScore(['Rarely', 'Not sure / Not observed', undefined]);
    expect(score.scoredResponses).toBe(1);
    expect(score.notSureResponses).toBe(1);
    expect(score.percentage).toBe(100);
  });

  it('returns no percentage when every answer is not sure or unobserved', () => {
    const score = calculateResponseScore(
      Array.from({ length: 10 }, () => 'Not sure / Not observed' as const),
    );
    expect(score.percentage).toBeNull();
    expect(score.scoredResponses).toBe(0);
    expect(score.notSureResponses).toBe(10);
  });
});
