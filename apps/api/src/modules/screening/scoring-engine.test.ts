import { describe, expect, it } from 'vitest';
import { DeterministicScoringEngine } from './scoring-engine.js';

describe('DeterministicScoringEngine', () => {
  const engine = new DeterministicScoringEngine();
  const A = 'Social Interaction';
  const B = 'Sensory Response';

  it('treats a high value on a DIRECT question as high risk', () => {
    const result = engine.calculate([
      { answerValue: 4, polarity: 'DIRECT', category: B },
      { answerValue: 4, polarity: 'DIRECT', category: B },
      { answerValue: 4, polarity: 'DIRECT', category: B },
    ]);
    expect(result.score).toBe(12);
    expect(result.maxScore).toBe(12);
    expect(result.riskPercentage).toBe(100);
    expect(result.riskLevel).toBe('HIGH');
    expect(result.analysisVersion).toBe('deterministic-v3');
  });

  it('treats a high value on a REVERSE question as low risk (the direction fix)', () => {
    const result = engine.calculate([
      { answerValue: 4, polarity: 'REVERSE', category: A },
      { answerValue: 4, polarity: 'REVERSE', category: A },
      { answerValue: 4, polarity: 'REVERSE', category: A },
    ]);
    expect(result.score).toBe(0);
    expect(result.riskPercentage).toBe(0);
    expect(result.riskLevel).toBe('LOW');
  });

  it('normalizes to a percentage that is stable regardless of question count', () => {
    const three = engine.calculate([
      { answerValue: 2, polarity: 'DIRECT', category: B },
      { answerValue: 2, polarity: 'REVERSE', category: A },
      { answerValue: 2, polarity: 'DIRECT', category: B },
    ]);
    const twenty = engine.calculate(
      Array.from({ length: 20 }, (_, i) => ({
        answerValue: 2,
        polarity: (i % 2 === 0 ? 'DIRECT' : 'REVERSE') as 'DIRECT' | 'REVERSE',
        category: i % 2 === 0 ? B : A,
      })),
    );
    expect(three.riskPercentage).toBe(50);
    expect(twenty.riskPercentage).toBe(50);
  });

  it('bands percentages into Low / Moderate / High', () => {
    expect(engine.calculate([{ answerValue: 1, polarity: 'DIRECT', category: B }]).riskLevel).toBe(
      'LOW',
    );
    expect(engine.calculate([{ answerValue: 2, polarity: 'DIRECT', category: B }]).riskLevel).toBe(
      'MODERATE',
    );
    expect(engine.calculate([{ answerValue: 3, polarity: 'DIRECT', category: B }]).riskLevel).toBe(
      'HIGH',
    );
  });

  it('produces a per-category breakdown alongside the overall score', () => {
    // Category A (reverse, answered "Always") => 0% LOW.
    // Category B (direct, answered "Always") => 100% HIGH.
    const result = engine.calculate([
      { answerValue: 4, polarity: 'REVERSE', category: A },
      { answerValue: 4, polarity: 'REVERSE', category: A },
      { answerValue: 4, polarity: 'DIRECT', category: B },
      { answerValue: 4, polarity: 'DIRECT', category: B },
    ]);
    expect(result.categoryBreakdown).toEqual([
      { category: A, riskPercentage: 0, riskLevel: 'LOW' },
      { category: B, riskPercentage: 100, riskLevel: 'HIGH' },
    ]);
    // Overall unchanged: 8 of 16 risk points => 50% MODERATE.
    expect(result.riskPercentage).toBe(50);
    expect(result.riskLevel).toBe('MODERATE');
  });

  it('handles an empty answer set without dividing by zero', () => {
    const result = engine.calculate([]);
    expect(result.maxScore).toBe(0);
    expect(result.riskPercentage).toBe(0);
    expect(result.riskLevel).toBe('LOW');
    expect(result.categoryBreakdown).toEqual([]);
  });
});
