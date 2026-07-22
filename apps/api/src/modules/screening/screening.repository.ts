import type {
  Screening,
  ScreeningAnswer,
  ScreeningQuestion,
  ScreeningResult,
} from '@prisma/client';
import type { RiskLevel } from '@auticare/contracts';
import { prisma } from '../../database/prisma.js';

export type ScreeningSessionRecord = Screening & {
  answers: ScreeningAnswer[];
  result: ScreeningResult | null;
};

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

  findQuestionById(questionId: string): Promise<ScreeningQuestion | null> {
    return prisma.screeningQuestion.findUnique({ where: { id: questionId } });
  }

  createSession(childId: string): Promise<Screening> {
    return prisma.screening.create({ data: { childId } });
  }

  findSessionById(sessionId: string): Promise<ScreeningSessionRecord | null> {
    return prisma.screening.findUnique({
      where: { id: sessionId },
      include: { answers: true, result: true },
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
  }): Promise<ScreeningSessionRecord> {
    return prisma.$transaction(async (tx) => {
      await tx.screeningResult.create({
        data: { screeningId: input.screeningId, ...input.result },
      });
      return tx.screening.update({
        where: { id: input.screeningId },
        data: { status: 'ANALYZED', submittedAt: new Date() },
        include: { answers: true, result: true },
      });
    });
  }

  listSessionsForChild(childId: string): Promise<ScreeningSessionRecord[]> {
    return prisma.screening.findMany({
      where: { childId },
      include: { answers: true, result: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
