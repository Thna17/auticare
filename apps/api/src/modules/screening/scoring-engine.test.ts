import { describe, expect, it } from 'vitest';
import { DeterministicScoringEngine } from './scoring-engine.js';

describe('DeterministicScoringEngine', () => {
  const engine = new DeterministicScoringEngine();

  it('treats a high value on a DIRECT question as high risk', () => {
    const result = engine.calculate([
      { answerValue: 4, polarity: 'DIRECT' },
      { answerValue: 4, polarity: 'DIRECT' },
      { answerValue: 4, polarity: 'DIRECT' },
    ]);
    expect(result.score).toBe(12);
    expect(result.maxScore).toBe(12);
    expect(result.riskPercentage).toBe(100);
    expect(result.riskLevel).toBe('HIGH');
    expect(result.analysisVersion).toBe('deterministic-v2');
  });

  it('treats a high value on a REVERSE question as low risk (the direction fix)', () => {
    const result = engine.calculate([
      { answerValue: 4, polarity: 'REVERSE' },
      { answerValue: 4, polarity: 'REVERSE' },
      { answerValue: 4, polarity: 'REVERSE' },
    ]);
    expect(result.score).toBe(0);
    expect(result.riskPercentage).toBe(0);
    expect(result.riskLevel).toBe('LOW');
  });

  it('normalizes to a percentage that is stable regardless of question count', () => {
    // Every question answered at the mid-point contributes 2 of 4 risk points => 50%.
    const three = engine.calculate([
      { answerValue: 2, polarity: 'DIRECT' },
      { answerValue: 2, polarity: 'REVERSE' },
      { answerValue: 2, polarity: 'DIRECT' },
    ]);
    const twenty = engine.calculate(
      Array.from({ length: 20 }, (_, i) => ({
        answerValue: 2,
        polarity: (i % 2 === 0 ? 'DIRECT' : 'REVERSE') as 'DIRECT' | 'REVERSE',
      })),
    );
    expect(three.riskPercentage).toBe(50);
    expect(twenty.riskPercentage).toBe(50);
    expect(three.riskLevel).toBe('MODERATE');
    expect(twenty.riskLevel).toBe('MODERATE');
  });

  it('bands percentages into Low / Moderate / High', () => {
    // 1 of 4 => 25% => LOW
    expect(engine.calculate([{ answerValue: 1, polarity: 'DIRECT' }]).riskLevel).toBe('LOW');
    // 2 of 4 => 50% => MODERATE
    expect(engine.calculate([{ answerValue: 2, polarity: 'DIRECT' }]).riskLevel).toBe('MODERATE');
    // 3 of 4 => 75% => HIGH
    expect(engine.calculate([{ answerValue: 3, polarity: 'DIRECT' }]).riskLevel).toBe('HIGH');
  });

  it('handles an empty answer set without dividing by zero', () => {
    const result = engine.calculate([]);
    expect(result.maxScore).toBe(0);
    expect(result.riskPercentage).toBe(0);
    expect(result.riskLevel).toBe('LOW');
  });
});
