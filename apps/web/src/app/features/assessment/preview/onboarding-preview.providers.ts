import type { Provider } from '@angular/core';
import type {
  ChildResponse,
  CreateChildRequest,
  CreateScreeningSessionResponse,
  ScreeningAnswerResponse,
  ScreeningQuestionResponse,
  ScreeningSessionDetailResponse,
  UpsertScreeningAnswerRequest,
} from '@auticare/contracts';
import { delay, of } from 'rxjs';
import { ChildrenApi } from '../../children/data-access/children.api';
import { ScreeningApi } from '../../screening/data-access/screening.api';
import { MCHAT_QUESTIONS_DATA } from '../../screening/mchat-questions.data';
import { OnboardingState } from '../onboarding-state';

/**
 * Sample data for /preview/welcome, so the first-run questionnaire can be seen
 * without the API running. Development builds only (see app.routes.ts): nothing
 * here is sent anywhere or saved, and a refresh starts again.
 */

const now = () => new Date().toISOString();
/** A short pause so loading states show the way they do against a real API. */
const LATENCY = 250;

const QUESTIONS: ScreeningQuestionResponse[] = MCHAT_QUESTIONS_DATA.map((q) => ({
  id: `preview-q${q.id}`,
  questionText: q.questionEn,
  category: q.category,
  displayOrder: q.id,
  polarity: q.polarity,
  formKind: 'SHORT' as const,
}));

/** Starts with no child, so the preview walks through every step. */
class PreviewChildrenApi {
  private children: ChildResponse[] = [];

  listChildren() {
    return of(this.children).pipe(delay(LATENCY));
  }

  createChild(input: CreateChildRequest) {
    const child: ChildResponse = {
      id: 'preview-child',
      firstName: input.firstName,
      lastName: null,
      dateOfBirth: input.dateOfBirth,
      notes: input.notes ?? null,
      archivedAt: null,
    };
    this.children = [child];
    return of(child).pipe(delay(LATENCY));
  }
}

class PreviewScreeningApi {
  private answers = new Map<string, number>();

  createSession(childId: string) {
    this.answers.clear();
    const response: CreateScreeningSessionResponse = {
      session: {
        id: 'preview-session',
        childId,
        status: 'DRAFT',
        ageBand: 'TODDLER',
        formKind: 'SHORT',
        startedAt: now(),
        submittedAt: null,
        createdAt: now(),
        updatedAt: now(),
      },
      questions: QUESTIONS,
    };
    return of(response).pipe(delay(LATENCY));
  }

  upsertAnswer(sessionId: string, input: UpsertScreeningAnswerRequest) {
    this.answers.set(input.questionId, input.answerValue);
    const answer: ScreeningAnswerResponse = {
      id: `${sessionId}-${input.questionId}`,
      sessionId,
      questionId: input.questionId,
      answerValue: input.answerValue,
      createdAt: now(),
      updatedAt: now(),
    };
    return of(answer);
  }

  /**
   * A rough stand-in for the real scoring, only so the result screen has
   * something to show: the share of answers pointing to "more support may
   * help", by question direction. The real score is computed by the API.
   */
  submitSession(sessionId: string) {
    const max = 4;
    const flags = QUESTIONS.map((q) => {
      const value = this.answers.get(q.id) ?? 0;
      return q.polarity === 'DIRECT' ? value / max : (max - value) / max;
    });
    const percentage = Math.round((flags.reduce((a, b) => a + b, 0) / flags.length) * 100);
    const level = percentage >= 60 ? 'HIGH' : percentage >= 30 ? 'MODERATE' : 'LOW';
    const categories = [...new Set(QUESTIONS.map((q) => q.category))];
    const session: ScreeningSessionDetailResponse = {
      id: sessionId,
      childId: 'preview-child',
      status: 'ANALYZED',
      ageBand: 'TODDLER',
      formKind: 'SHORT',
      startedAt: now(),
      submittedAt: now(),
      createdAt: now(),
      updatedAt: now(),
      answers: [],
      result: {
        id: 'preview-result',
        score: Math.round(percentage / 10),
        riskPercentage: percentage,
        riskLevel: level,
        recommendation:
          'This is preview data. In the real app, the recommendation comes from the AutiCare API.',
        disclaimer: 'Educational guidance only. This is not a diagnosis.',
        analysisVersion: 'preview',
        analyzedAt: now(),
        categoryBreakdown: categories.map((category) => {
          const inCategory = QUESTIONS.map((q, i) => ({ q, flag: flags[i] ?? 0 })).filter(
            (row) => row.q.category === category,
          );
          const pct = Math.round(
            (inCategory.reduce((sum, row) => sum + row.flag, 0) / inCategory.length) * 100,
          );
          return {
            category,
            riskPercentage: pct,
            riskLevel: pct >= 60 ? 'HIGH' : pct >= 30 ? 'MODERATE' : 'LOW',
          };
        }),
      },
    };
    return of(session).pipe(delay(LATENCY * 2));
  }
}

/** Keeps the first-run state in memory, so the preview never touches storage. */
class PreviewOnboardingState {
  markComplete(): void {}
  invalidate(): void {}
  skip(): void {}
}

export const ONBOARDING_PREVIEW_PROVIDERS: Provider[] = [
  { provide: ChildrenApi, useClass: PreviewChildrenApi },
  { provide: ScreeningApi, useClass: PreviewScreeningApi },
  { provide: OnboardingState, useClass: PreviewOnboardingState },
];
