import type { QuestionPolarity, RiskLevel } from '@auticare/contracts';

const MAX_ANSWER_VALUE = 4;

export type ScreeningAnswerScore = {
  answerValue: number;
  polarity: QuestionPolarity;
  category: string;
};

export type CategoryScore = {
  category: string;
  riskPercentage: number;
  riskLevel: RiskLevel;
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
  /** Same formula applied to each category subset, in first-appearance order. */
  categoryBreakdown: CategoryScore[];
};

export interface ScoringEngine {
  calculate(answers: readonly ScreeningAnswerScore[]): ScreeningScore;
}

const riskLevelFor = (riskPercentage: number): RiskLevel =>
  riskPercentage <= 33 ? 'LOW' : riskPercentage <= 66 ? 'MODERATE' : 'HIGH';

const contributionOf = (answer: ScreeningAnswerScore): number =>
  answer.polarity === 'REVERSE' ? MAX_ANSWER_VALUE - answer.answerValue : answer.answerValue;

// Shared normalized-percentage computation, used identically for the overall
// score and for each per-category subset (the overall formula is unchanged).
const percentageFor = (
  answers: readonly ScreeningAnswerScore[],
): { score: number; maxScore: number; riskPercentage: number } => {
  const maxScore = answers.length * MAX_ANSWER_VALUE;
  const score = answers.reduce((total, answer) => total + contributionOf(answer), 0);
  const riskPercentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  return { score, maxScore, riskPercentage };
};

/**
 * Deterministic, HEURISTIC scoring engine. The questions, polarity assignments,
 * age-band split, and risk bands are original and heuristic — this is NOT a
 * clinically validated screening instrument and must not be presented as one.
 *
 * Each answered question contributes risk points corrected for its polarity:
 *   - DIRECT  (higher answer = more concern):  contribution = answerValue
 *   - REVERSE (higher answer = less concern):  contribution = MAX_ANSWER_VALUE - answerValue
 * The total is normalized to a 0-100 percentage so the banding stays stable as
 * the number of questions changes. The same normalization is applied per category
 * to produce the breakdown, layered on top of the unchanged overall calculation.
 */
export class DeterministicScoringEngine implements ScoringEngine {
  calculate(answers: readonly ScreeningAnswerScore[]): ScreeningScore {
    const overall = percentageFor(answers);

    const order: string[] = [];
    const byCategory = new Map<string, ScreeningAnswerScore[]>();
    for (const answer of answers) {
      const bucket = byCategory.get(answer.category);
      if (bucket) {
        bucket.push(answer);
      } else {
        byCategory.set(answer.category, [answer]);
        order.push(answer.category);
      }
    }
    const categoryBreakdown: CategoryScore[] = order.map((category) => {
      const { riskPercentage } = percentageFor(byCategory.get(category) ?? []);
      return { category, riskPercentage, riskLevel: riskLevelFor(riskPercentage) };
    });

    return {
      score: overall.score,
      maxScore: overall.maxScore,
      riskPercentage: overall.riskPercentage,
      riskLevel: riskLevelFor(overall.riskPercentage),
      recommendation:
        'Review the screening history with a qualified clinician or support professional.',
      analysisVersion: 'deterministic-v3',
      categoryBreakdown,
    };
  }
}
