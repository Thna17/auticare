import type { UserRole } from '@auticare/contracts';
import { screeningDisclaimer } from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { DeterministicScoringEngine } from './scoring-engine.js';
import { ScreeningRepository } from './screening.repository.js';
import type { ScreeningSessionRecord } from './screening.repository.js';
import {
  toScreeningAnswerResponse,
  toScreeningQuestionResponse,
  toScreeningSessionDetailResponse,
  toScreeningSessionResponse,
} from './screening.mapper.js';
import type {
  CreateScreeningSessionRequest,
  UpsertScreeningAnswerRequest,
} from './screening.schemas.js';

type Actor = { parentId: string; role: UserRole };

export class ScreeningService {
  constructor(
    private readonly repository = new ScreeningRepository(),
    private readonly scoringEngine = new DeterministicScoringEngine(),
  ) {}

  async listQuestions() {
    const questions = await this.repository.listActiveQuestions();
    return questions.map(toScreeningQuestionResponse);
  }

  async createSession(actor: Actor, input: CreateScreeningSessionRequest) {
    await this.assertChildOwnership(actor, input.childId);
    const [session, questions] = await Promise.all([
      this.repository.createSession(input.childId),
      this.repository.listActiveQuestions(),
    ]);
    return {
      session: toScreeningSessionResponse(session),
      questions: questions.map(toScreeningQuestionResponse),
    };
  }

  async upsertAnswer(actor: Actor, sessionId: string, input: UpsertScreeningAnswerRequest) {
    const session = await this.getOwnedSession(actor, sessionId);
    if (session.status !== 'DRAFT') {
      throw new AppError('CONFLICT', 'This screening session has already been submitted.', 409);
    }
    const question = await this.repository.findQuestionById(input.questionId);
    if (!question || !question.isActive) {
      throw new AppError(
        'VALIDATION_ERROR',
        'The answer references an unknown screening question.',
        400,
      );
    }
    const answer = await this.repository.upsertAnswer({
      screeningId: sessionId,
      questionId: input.questionId,
      answerValue: input.answerValue,
    });
    return toScreeningAnswerResponse(answer);
  }

  async submitSession(actor: Actor, sessionId: string) {
    const session = await this.getOwnedSession(actor, sessionId);
    if (session.status !== 'DRAFT') {
      throw new AppError('CONFLICT', 'This screening session has already been submitted.', 409);
    }
    const questions = await this.repository.listActiveQuestions();
    const answeredQuestionIds = new Set(session.answers.map((answer) => answer.questionId));
    const allAnswered =
      questions.length > 0 && questions.every((question) => answeredQuestionIds.has(question.id));
    if (!allAnswered) {
      throw new AppError(
        'VALIDATION_ERROR',
        'All screening questions must be answered before submitting.',
        400,
      );
    }
    // Score over the active question set (validated as fully answered above), so
    // each answer is corrected by its question's polarity. Raw answer values in
    // screening_answer are never modified — correction happens only here.
    const answerByQuestionId = new Map(
      session.answers.map((answer) => [answer.questionId, answer.answerValue]),
    );
    const score = this.scoringEngine.calculate(
      questions.map((question) => ({
        answerValue: answerByQuestionId.get(question.id) ?? 0,
        polarity: question.polarity,
      })),
    );
    const submitted = await this.repository.submitSession({
      screeningId: sessionId,
      result: {
        score: score.score,
        riskPercentage: score.riskPercentage,
        riskLevel: score.riskLevel,
        recommendation: score.recommendation,
        disclaimer: screeningDisclaimer,
        analysisVersion: score.analysisVersion,
      },
    });
    return toScreeningSessionDetailResponse(submitted);
  }

  async getSession(actor: Actor, sessionId: string) {
    const session = await this.getOwnedSession(actor, sessionId);
    return toScreeningSessionDetailResponse(session);
  }

  async listSessionsForChild(actor: Actor, childId: string) {
    await this.assertChildOwnership(actor, childId);
    const sessions = await this.repository.listSessionsForChild(childId);
    return sessions.map(toScreeningSessionDetailResponse);
  }

  private async assertChildOwnership(actor: Actor, childId: string) {
    if (actor.role !== 'PARENT') throw forbidden();
    const child = await this.repository.findChild(childId);
    if (!child) throw notFound('Child profile was not found.');
    if (child.parentId !== actor.parentId) throw forbidden();
    return child;
  }

  private async getOwnedSession(actor: Actor, sessionId: string): Promise<ScreeningSessionRecord> {
    if (actor.role !== 'PARENT') throw forbidden();
    const session = await this.repository.findSessionById(sessionId);
    if (!session) throw notFound('Screening session was not found.');
    const child = await this.repository.findChild(session.childId);
    if (!child || child.parentId !== actor.parentId) throw forbidden();
    return session;
  }
}
