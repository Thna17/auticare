import type { RiskLevel } from '@auticare/contracts';
export type ScreeningAnswerScore = { answerValue: number };
export type ScreeningScore = {
  score: number;
  riskLevel: RiskLevel;
  recommendation: string;
  analysisVersion: string;
};
export interface ScoringEngine {
  calculate(answers: readonly ScreeningAnswerScore[]): ScreeningScore;
}
export class DeterministicScoringEngine implements ScoringEngine {
  calculate(answers: readonly ScreeningAnswerScore[]): ScreeningScore {
    const score = answers.reduce((total, answer) => total + answer.answerValue, 0);
    const riskLevel: RiskLevel = score >= 12 ? 'HIGH' : score >= 6 ? 'MODERATE' : 'LOW';
    return {
      score,
      riskLevel,
      recommendation:
        'Review the screening history with a qualified clinician or support professional.',
      analysisVersion: 'deterministic-v1',
    };
  }
}
