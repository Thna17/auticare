import type { QuestionPolarity, RiskLevel } from '@auticare/contracts';

const MAX_ANSWER_VALUE = 4;

export type ScreeningAnswerScore = {
  answerValue: number;
  polarity: QuestionPolarity;
};

export type ScreeningScore = {
  /** Polarity-corrected total risk points across the answered questions. */
  score: number;
  /** answeredQuestions * MAX_ANSWER_VALUE. */
  maxScore: number;
  /** Normalized 0-100 risk indicator, robust to changes in the question count. */
  riskPercentage: number;
  riskLevel: RiskLevel;
  recommendation: string;
  analysisVersion: string;
};

export interface ScoringEngine {
  calculate(answers: readonly ScreeningAnswerScore[]): ScreeningScore;
}

/**
 * Deterministic, HEURISTIC scoring engine. The questions, polarity assignments,
 * and risk bands are original and heuristic — this is NOT a clinically validated
 * screening instrument and must not be presented as equivalent to one.
 *
 * Each answered question contributes risk points corrected for its polarity:
 *   - DIRECT  (higher answer = more concern):  contribution = answerValue
 *   - REVERSE (higher answer = less concern):  contribution = MAX_ANSWER_VALUE - answerValue
 * The total is normalized to a 0-100 percentage so the banding stays stable as
 * the number of seeded questions changes over time.
 */
export class DeterministicScoringEngine implements ScoringEngine {
  calculate(answers: readonly ScreeningAnswerScore[]): ScreeningScore {
    const maxScore = answers.length * MAX_ANSWER_VALUE;
    const score = answers.reduce((total, answer) => {
      const contribution =
        answer.polarity === 'REVERSE' ? MAX_ANSWER_VALUE - answer.answerValue : answer.answerValue;
      return total + contribution;
    }, 0);

    const riskPercentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
    const riskLevel: RiskLevel =
      riskPercentage <= 33 ? 'LOW' : riskPercentage <= 66 ? 'MODERATE' : 'HIGH';

    return {
      score,
      maxScore,
      riskPercentage,
      riskLevel,
      recommendation:
        'Review the screening history with a qualified clinician or support professional.',
      analysisVersion: 'deterministic-v2',
    };
  }
}
