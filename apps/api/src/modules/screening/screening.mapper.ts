import type { Screening, ScreeningAnswer, ScreeningQuestion } from '@prisma/client';
import type {
  ScreeningResultWithCategories,
  ScreeningSessionRecord,
} from './screening.repository.js';

export type ScreeningSessionResponse = {
  id: string;
  childId: string;
  status: Screening['status'];
  ageBand: Screening['ageBand'];
  startedAt: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScreeningQuestionResponse = {
  id: string;
  questionText: string;
  category: string;
  displayOrder: number;
  polarity: ScreeningQuestion['polarity'];
};

export type ScreeningAnswerResponse = {
  id: string;
  sessionId: string;
  questionId: string;
  answerValue: number;
  createdAt: string;
  updatedAt: string;
};

export type ScreeningCategoryScoreResponse = {
  category: string;
  riskPercentage: number;
  riskLevel: ScreeningResultWithCategories['riskLevel'];
};

export type ScreeningResultResponse = {
  id: string;
  score: number;
  riskPercentage: number | null;
  riskLevel: ScreeningResultWithCategories['riskLevel'];
  recommendation: string;
  disclaimer: string;
  analysisVersion: string;
  analyzedAt: string;
  categoryBreakdown: ScreeningCategoryScoreResponse[];
};

export type ScreeningSessionDetailResponse = ScreeningSessionResponse & {
  answers: ScreeningAnswerResponse[];
  result: ScreeningResultResponse | null;
};

export type PreviousScreeningComparison = {
  comparable: boolean;
  previousRiskPercentage: number | null;
  previousCompletedAt: string | null;
  delta: number | null;
  reason: string | null;
};

export type ScreeningSessionResultResponse = ScreeningSessionDetailResponse & {
  previousComparison: PreviousScreeningComparison | null;
};

export const toScreeningSessionResponse = (session: Screening): ScreeningSessionResponse => ({
  id: session.id,
  childId: session.childId,
  status: session.status,
  ageBand: session.ageBand,
  startedAt: session.startedAt.toISOString(),
  submittedAt: session.submittedAt?.toISOString() ?? null,
  createdAt: session.createdAt.toISOString(),
  updatedAt: session.updatedAt.toISOString(),
});

export const toScreeningQuestionResponse = (
  question: ScreeningQuestion,
): ScreeningQuestionResponse => ({
  id: question.id,
  questionText: question.questionText,
  category: question.category,
  displayOrder: question.displayOrder,
  polarity: question.polarity,
});

export const toScreeningAnswerResponse = (answer: ScreeningAnswer): ScreeningAnswerResponse => ({
  id: answer.id,
  sessionId: answer.screeningId,
  questionId: answer.questionId,
  answerValue: answer.answerValue,
  createdAt: answer.createdAt.toISOString(),
  updatedAt: answer.updatedAt.toISOString(),
});

export const toScreeningResultResponse = (
  result: ScreeningResultWithCategories,
): ScreeningResultResponse => ({
  id: result.id,
  score: result.score,
  riskPercentage: result.riskPercentage,
  riskLevel: result.riskLevel,
  recommendation: result.recommendation,
  disclaimer: result.disclaimer,
  analysisVersion: result.analysisVersion,
  analyzedAt: result.analyzedAt.toISOString(),
  categoryBreakdown: [...result.categoryScores]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((score) => ({
      category: score.category,
      riskPercentage: score.riskPercentage,
      riskLevel: score.riskLevel,
    })),
});

export const toScreeningSessionDetailResponse = (
  session: ScreeningSessionRecord,
): ScreeningSessionDetailResponse => ({
  ...toScreeningSessionResponse(session),
  answers: [...session.answers]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(toScreeningAnswerResponse),
  result: session.result ? toScreeningResultResponse(session.result) : null,
});

export const toScreeningSessionResultResponse = (
  session: ScreeningSessionRecord,
  previousComparison: PreviousScreeningComparison | null,
): ScreeningSessionResultResponse => ({
  ...toScreeningSessionDetailResponse(session),
  previousComparison,
});
