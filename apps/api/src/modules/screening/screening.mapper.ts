import type {
  Screening,
  ScreeningAnswer,
  ScreeningQuestion,
  ScreeningResult,
} from '@prisma/client';
import type { ScreeningSessionRecord } from './screening.repository.js';

export type ScreeningSessionResponse = {
  id: string;
  childId: string;
  status: Screening['status'];
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

export type ScreeningResultResponse = {
  id: string;
  score: number;
  riskPercentage: number | null;
  riskLevel: ScreeningResult['riskLevel'];
  recommendation: string;
  disclaimer: string;
  analysisVersion: string;
  analyzedAt: string;
};

export type ScreeningSessionDetailResponse = ScreeningSessionResponse & {
  answers: ScreeningAnswerResponse[];
  result: ScreeningResultResponse | null;
};

export const toScreeningSessionResponse = (session: Screening): ScreeningSessionResponse => ({
  id: session.id,
  childId: session.childId,
  status: session.status,
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

export const toScreeningResultResponse = (result: ScreeningResult): ScreeningResultResponse => ({
  id: result.id,
  score: result.score,
  riskPercentage: result.riskPercentage,
  riskLevel: result.riskLevel,
  recommendation: result.recommendation,
  disclaimer: result.disclaimer,
  analysisVersion: result.analysisVersion,
  analyzedAt: result.analyzedAt.toISOString(),
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
