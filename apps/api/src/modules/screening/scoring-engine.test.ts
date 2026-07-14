import { describe, expect, it } from 'vitest';
import { DeterministicScoringEngine } from './scoring-engine.js';
describe('DeterministicScoringEngine', () => {
  it('returns high risk for higher deterministic scores without claiming diagnosis', () => {
    const result = new DeterministicScoringEngine().calculate([
      { answerValue: 4 },
      { answerValue: 4 },
      { answerValue: 4 },
    ]);
    expect(result.riskLevel).toBe('HIGH');
    expect(result.analysisVersion).toBe('deterministic-v1');
  });
});
