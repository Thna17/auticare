import type { AgeBand, ScreeningFormKind, UserRole } from '@auticare/contracts';
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
  toScreeningSessionResultResponse,
} from './screening.mapper.js';
import type { PreviousScreeningComparison } from './screening.mapper.js';
import type {
  CreateScreeningSessionRequest,
  UpsertScreeningAnswerRequest,
} from './screening.schemas.js';

type Actor = { parentId: string; role: UserRole };

/** Whole years from date of birth to `at` (default now). */
const ageInYears = (dateOfBirth: Date, at: Date = new Date()): number => {
  let age = at.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = at.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getUTCDate() < dateOfBirth.getUTCDate())) age -= 1;
  return age;
};

/** Under 4 years => TODDLER, 4 years and older => PRESCHOOL. */
const bandForAge = (dateOfBirth: Date, at: Date = new Date()): AgeBand =>
  ageInYears(dateOfBirth, at) < 4 ? 'TODDLER' : 'PRESCHOOL';

/**
 * The next step suggested by a short assessment, scaled by band.
 *
 * The wording matters as much as the logic: each of these is a suggestion, never
 * a verdict, and the elevated band points at a person rather than at more
 * screening. Full-form sessions keep the original generic recommendation so
 * existing behaviour and stored results are unaffected.
 */
const shortFormRecommendation = (riskLevel: 'LOW' | 'MODERATE' | 'HIGH'): string => {
  if (riskLevel === 'HIGH') {
    return 'Several of the areas we asked about are worth a professional look. Booking an appointment with a paediatric or developmental specialist is the best next step. This screening is not a diagnosis.';
  }
  if (riskLevel === 'MODERATE') {
    return 'Some of the areas we asked about are worth watching. Try a few age-appropriate activities at home over the next few weeks, keep a record of what you notice, and consider booking an appointment so a professional can look properly. This screening is not a diagnosis.';
  }
  return 'Nothing in these answers stands out as a concern right now. Keep playing, talking and reading together, and come back to the full screening if something changes. This screening is not a diagnosis.';
};

export class ScreeningService {
  constructor(
    private readonly repository = new ScreeningRepository(),
    private readonly scoringEngine = new DeterministicScoringEngine(),
  ) {}

  async listQuestions(ageBand?: AgeBand, formKind?: ScreeningFormKind) {
    const questions = ageBand
      ? await this.repository.listActiveQuestionsForBand(ageBand, formKind ?? 'FULL')
      : await this.repository.listActiveQuestions(formKind);
    return questions.map(toScreeningQuestionResponse);
  }

  async createSession(actor: Actor, input: CreateScreeningSessionRequest) {
    const child = await this.assertChildOwnership(actor, input.childId);
    // Age band is computed from the child's date of birth at session-creation time.
    const ageBand = bandForAge(child.dateOfBirth);
    const formKind: ScreeningFormKind = input.formKind ?? 'FULL';
    const [session, questions] = await Promise.all([
      this.repository.createSession(input.childId, ageBand, formKind),
      this.repository.listActiveQuestionsForBand(ageBand, formKind),
    ]);
    // A form kind with no active questions would produce a session that can never
    // be submitted, so say so here rather than at submit time.
    if (questions.length === 0) {
      throw new AppError(
        'VALIDATION_ERROR',
        'No screening questions are configured for this age group.',
        400,
      );
    }
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
    // A session may only be answered with its own question set. Without this, a
    // short session could be filled with answers to long-form items, which would
    // produce a percentage that means nothing.
    if (
      question.formKind !== session.formKind ||
      (session.ageBand !== null && question.ageBand !== session.ageBand)
    ) {
      throw new AppError(
        'VALIDATION_ERROR',
        'That question does not belong to this screening session.',
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
    const child = await this.childFor(session);
    const ageBand = session.ageBand ?? bandForAge(child.dateOfBirth);
    const questions = await this.repository.listActiveQuestionsForBand(ageBand, session.formKind);
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
    // Score over the band's question set (validated as fully answered above). Each
    // answer is corrected by its question's polarity; raw answer values in
    // screening_answer are never modified. Per-category breakdown is layered on top.
    const answerByQuestionId = new Map(
      session.answers.map((answer) => [answer.questionId, answer.answerValue]),
    );
    const score = this.scoringEngine.calculate(
      questions.map((question) => ({
        answerValue: answerByQuestionId.get(question.id) ?? 0,
        polarity: question.polarity,
        category: question.category,
      })),
    );
    const submitted = await this.repository.submitSession({
      screeningId: sessionId,
      result: {
        score: score.score,
        riskPercentage: score.riskPercentage,
        riskLevel: score.riskLevel,
        recommendation:
          session.formKind === 'SHORT'
            ? shortFormRecommendation(score.riskLevel)
            : score.recommendation,
        disclaimer: screeningDisclaimer,
        analysisVersion: score.analysisVersion,
      },
      categoryScores: score.categoryBreakdown.map((entry, index) => ({
        category: entry.category,
        riskPercentage: entry.riskPercentage,
        riskLevel: entry.riskLevel,
        displayOrder: index,
      })),
      notification: {
        parentId: child.parentId,
        type: 'SCREENING',
        title: 'Screening Completed for ' + child.firstName,
        body:
          'Developmental screening finalized with ' +
          score.riskLevel +
          ' risk identified. Tap to view summary and clinical recommendations.',
        reportId: sessionId,
      },
    });
    return this.buildResultResponse(submitted);
  }

  async getSession(actor: Actor, sessionId: string) {
    const session = await this.getOwnedSession(actor, sessionId);
    return this.buildResultResponse(session);
  }

  async listSessionsForChild(actor: Actor, childId: string) {
    await this.assertChildOwnership(actor, childId);
    const sessions = await this.repository.listSessionsForChild(childId);
    return sessions.map(toScreeningSessionDetailResponse);
  }

  /**
   * The child's most recent completed session of one form kind, or null.
   *
   * The post-login flow asks for SHORT to decide whether to run the assessment;
   * the dashboard asks for SHORT to render the current concern band. Returning
   * null rather than throwing is deliberate — "not answered yet" is a normal
   * state, not an error.
   */
  async getLatestCompleted(actor: Actor, childId: string, formKind: ScreeningFormKind) {
    await this.assertChildOwnership(actor, childId);
    const session = await this.repository.findLatestCompletedSession(childId, formKind);
    if (!session) return null;
    return this.buildResultResponse(session);
  }

  private async buildResultResponse(session: ScreeningSessionRecord) {
    const previousComparison = await this.computePreviousComparison(session);
    return toScreeningSessionResultResponse(session, previousComparison);
  }

  /**
   * Trend against the child's most recent OTHER completed session. Same age band
   * => comparable with a delta; different band => not comparable; none => null.
   */
  private async computePreviousComparison(
    session: ScreeningSessionRecord,
  ): Promise<PreviousScreeningComparison | null> {
    if (!session.result) return null;
    const previous = await this.repository.findPreviousCompletedSession(
      session.childId,
      session.id,
    );
    if (!previous || !previous.result) return null;

    if (session.ageBand && previous.ageBand && session.ageBand === previous.ageBand) {
      const previousRiskPercentage = previous.result.riskPercentage;
      const currentRiskPercentage = session.result.riskPercentage;
      return {
        comparable: true,
        previousRiskPercentage,
        previousCompletedAt: (previous.submittedAt ?? previous.result.analyzedAt).toISOString(),
        delta:
          previousRiskPercentage != null && currentRiskPercentage != null
            ? currentRiskPercentage - previousRiskPercentage
            : null,
        reason: null,
      };
    }
    return {
      comparable: false,
      previousRiskPercentage: null,
      previousCompletedAt: null,
      delta: null,
      reason: 'different age group question set',
    };
  }

  private async childFor(session: ScreeningSessionRecord) {
    const child = await this.repository.findChild(session.childId);
    if (!child) throw notFound('Child profile was not found.');
    return child;
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
