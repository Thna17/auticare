import type {
  AgeBand,
  Screening,
  ScreeningAnswer,
  ScreeningCategoryScore,
  ScreeningQuestion,
  ScreeningResult,
} from '@prisma/client';
import type { RiskLevel } from '@auticare/contracts';
import { prisma } from '../../database/prisma.js';

export type ScreeningResultWithCategories = ScreeningResult & {
  categoryScores: ScreeningCategoryScore[];
};

export type ScreeningSessionRecord = Screening & {
  answers: ScreeningAnswer[];
  result: ScreeningResultWithCategories | null;
};

const sessionInclude = {
  answers: true,
  result: { include: { categoryScores: true } },
} as const;

export class ScreeningRepository {
  findChild(childId: string) {
    return prisma.child.findUnique({ where: { id: childId } });
  }

  listActiveQuestions(): Promise<ScreeningQuestion[]> {
    return prisma.screeningQuestion.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  listActiveQuestionsForBand(ageBand: AgeBand): Promise<ScreeningQuestion[]> {
    return prisma.screeningQuestion.findMany({
      where: { isActive: true, ageBand },
      orderBy: { displayOrder: 'asc' },
    });
  }

  findQuestionById(questionId: string): Promise<ScreeningQuestion | null> {
    return prisma.screeningQuestion.findUnique({ where: { id: questionId } });
  }

  createSession(childId: string, ageBand: AgeBand): Promise<Screening> {
    return prisma.screening.create({ data: { childId, ageBand } });
  }

  findSessionById(sessionId: string): Promise<ScreeningSessionRecord | null> {
    return prisma.screening.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });
  }

  /** Most recent OTHER completed session for the child, for trend comparison. */
  findPreviousCompletedSession(
    childId: string,
    excludeSessionId: string,
  ): Promise<ScreeningSessionRecord | null> {
    return prisma.screening.findFirst({
      where: { childId, status: 'ANALYZED', id: { not: excludeSessionId } },
      orderBy: { submittedAt: 'desc' },
      include: sessionInclude,
    });
  }

  upsertAnswer(input: {
    screeningId: string;
    questionId: string;
    answerValue: number;
  }): Promise<ScreeningAnswer> {
    return prisma.screeningAnswer.upsert({
      where: {
        screeningId_questionId: {
          screeningId: input.screeningId,
          questionId: input.questionId,
        },
      },
      update: { answerValue: input.answerValue },
      create: input,
    });
  }

  submitSession(input: {
    screeningId: string;
    result: {
      score: number;
      riskPercentage: number;
      riskLevel: RiskLevel;
      recommendation: string;
      disclaimer: string;
      analysisVersion: string;
    };
    categoryScores: {
      category: string;
      riskPercentage: number;
      riskLevel: RiskLevel;
      displayOrder: number;
    }[];
  }): Promise<ScreeningSessionRecord> {
    return prisma.$transaction(async (tx) => {
      await tx.screeningResult.create({
        data: {
          screeningId: input.screeningId,
          ...input.result,
          categoryScores: { create: input.categoryScores },
        },
      });
      return tx.screening.update({
        where: { id: input.screeningId },
        data: { status: 'ANALYZED', submittedAt: new Date() },
        include: sessionInclude,
      });
    });
  }

  listSessionsForChild(childId: string): Promise<ScreeningSessionRecord[]> {
    return prisma.screening.findMany({
      where: { childId },
      include: sessionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
}
