import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import type {
  ScreeningQuestionResponse,
  ScreeningSessionDetailResponse,
} from '@auticare/contracts';
import { ScreeningApi } from './data-access/screening.api';
import { ScreeningAnswerScaleComponent } from './components/screening-answer-scale.component';

@Component({
  standalone: true,
  imports: [ScreeningAnswerScaleComponent],
  template: `
    <section class="session">
      @if (loading()) {
        <p class="status">Loading…</p>
      } @else if (fatalError()) {
        <div class="fatal">
          <p class="status error" role="alert">{{ fatalError() }}</p>
          <button type="button" class="link" (click)="goToScreeningHome()">
            Back to Screening
          </button>
        </div>
      } @else if (currentQuestion(); as question) {
        <header class="progress">
          <div class="progress-row">
            <span class="progress-label">Question {{ currentIndex() + 1 }} of {{ total() }}</span>
            <button type="button" class="save-exit" (click)="openExit()">Save and exit</button>
          </div>
          <div
            class="track"
            role="progressbar"
            [attr.aria-valuenow]="currentIndex() + 1"
            aria-valuemin="1"
            [attr.aria-valuemax]="total()"
          >
            <span class="fill" [style.width.%]="progressPct()"></span>
          </div>
        </header>

        <article class="card">
          @if (question.category) {
            <p class="category">{{ question.category }}</p>
          }
          <h1 class="question">{{ question.questionText }}</h1>

          <ac-screening-answer-scale
            [value]="currentValue()"
            [ariaLabel]="question.questionText"
            [disabled]="saving()"
            (valueChange)="selectAnswer($event)"
          />

          @if (saveError()) {
            <p class="save-error" role="alert">{{ saveError() }}</p>
          }
        </article>

        <nav class="controls">
          <button type="button" class="btn-back" [disabled]="currentIndex() === 0" (click)="back()">
            Back
          </button>
          <button
            type="button"
            class="btn-next"
            [disabled]="currentValue() === null || submitting()"
            (click)="next()"
          >
            {{ isLast() ? (submitting() ? 'Submitting…' : 'Finish') : 'Next' }}
          </button>
        </nav>
      }

      @if (showExitModal()) {
        <div class="overlay" (click)="cancelExit()">
          <div
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-title"
            (click)="$event.stopPropagation()"
          >
            <h2 id="exit-title">Save and exit?</h2>
            <p>Your progress is saved automatically. You can continue this screening later.</p>
            <div class="modal-actions">
              <button type="button" class="btn-back" (click)="cancelExit()">Keep going</button>
              <button type="button" class="btn-next" (click)="confirmExit()">Save and exit</button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      /* Named constants for this feature. Values mirror the app shell's existing
         hardcoded hex/px exactly (no token system). Descendant components inherit
         these custom properties. NOTE: duplicated from the intro page — candidate
         for extraction into a shared screening theme file. */
      :host {
        --scr-teal: #3d6375;
        --scr-teal-ink: #103443;
        --scr-text: #263238;
        --scr-text-muted: #66747a;
        --scr-surface: #ffffff;
        --scr-banner-bg: #e8f6ff;
        --scr-banner-border: #d4e6ef;
        --scr-avatar-bg: #8db4c8;
        --scr-divider: #c1d3dc;
        --scr-radius: 12px;
        --scr-shadow-btn: 0 10px 26px rgb(61 99 117 / 0.18);
        --scr-shadow-card: 0 12px 30px rgb(41 74 90 / 0.08);
        --scr-error: #a23434;
        display: block;
      }

      .session {
        max-width: 720px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .status {
        text-align: center;
        color: var(--scr-text-muted);
        font-weight: 600;
      }
      .status.error {
        color: var(--scr-error);
      }
      .fatal {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
      }

      .progress-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .progress-label {
        color: var(--scr-text-muted);
        font-weight: 800;
        font-size: 13px;
        letter-spacing: 0.04em;
      }
      .save-exit {
        border: 0;
        background: none;
        color: var(--scr-teal);
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }
      .track {
        height: 6px;
        border-radius: 999px;
        background: var(--scr-banner-bg);
        overflow: hidden;
      }
      .fill {
        display: block;
        height: 100%;
        background: var(--scr-teal);
        border-radius: 999px;
        transition: width 200ms ease;
      }

      .card {
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--scr-radius);
        box-shadow: var(--scr-shadow-card);
        padding: 32px 28px;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .category {
        margin: 0;
        color: var(--scr-text-muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .question {
        margin: 0;
        color: var(--scr-text);
        font-size: 22px;
        font-weight: 700;
        line-height: 1.35;
      }
      .save-error {
        margin: 0;
        color: var(--scr-error);
        font-weight: 600;
        font-size: 14px;
      }

      .controls {
        display: flex;
        justify-content: space-between;
        gap: 14px;
      }
      .btn-back,
      .btn-next {
        min-height: 50px;
        padding: 0 30px;
        border-radius: var(--scr-radius);
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
      }
      .btn-back {
        border: 2px solid var(--scr-banner-border);
        background: var(--scr-surface);
        color: var(--scr-text);
      }
      .btn-back:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-next {
        border: 0;
        background: var(--scr-teal);
        color: #ffffff;
        box-shadow: var(--scr-shadow-btn);
      }
      .btn-next:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
      }
      .link {
        border: 0;
        background: none;
        color: var(--scr-teal);
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }

      .overlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgb(0 30 43 / 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .modal {
        background: var(--scr-surface);
        border-radius: var(--scr-radius);
        box-shadow: var(--scr-shadow-card);
        padding: 26px;
        max-width: 420px;
        width: 100%;
      }
      .modal h2 {
        margin: 0 0 10px;
        color: var(--scr-teal);
        font-size: 20px;
      }
      .modal p {
        margin: 0 0 20px;
        color: var(--scr-text);
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningSessionPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ScreeningApi);

  private sessionId = '';

  readonly questions = signal<readonly ScreeningQuestionResponse[]>([]);
  readonly answers = signal<Record<string, number>>({});
  readonly currentIndex = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly fatalError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly showExitModal = signal(false);

  readonly total = computed(() => this.questions().length);
  readonly currentQuestion = computed(() => this.questions()[this.currentIndex()] ?? null);
  readonly currentValue = computed(() => {
    const question = this.currentQuestion();
    if (!question) return null;
    const value = this.answers()[question.id];
    return value === undefined ? null : value;
  });
  readonly isLast = computed(() => this.currentIndex() === this.total() - 1);
  readonly progressPct = computed(() =>
    this.total() === 0 ? 0 : ((this.currentIndex() + 1) / this.total()) * 100,
  );

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    if (!this.sessionId) {
      this.loading.set(false);
      this.fatalError.set('This screening session could not be found.');
      return;
    }

    // Fast-path only: if the creating flow handed the questions over via navigation
    // state, paint them immediately. This is not required — the list is re-fetched
    // authoritatively below, so a cold load / refresh / direct link works too.
    const state = history.state as { questions?: ScreeningQuestionResponse[] } | null;
    if (Array.isArray(state?.questions) && state.questions.length > 0) {
      this.setQuestions(state.questions);
    }

    forkJoin({
      session: this.api.getSession(this.sessionId),
      questions: this.api.listQuestions(),
    }).subscribe({
      next: ({ session, questions }) => {
        this.setQuestions(questions);
        this.hydrate(session);
      },
      error: () => {
        this.loading.set(false);
        this.fatalError.set('This screening session could not be loaded.');
      },
    });
  }

  private setQuestions(questions: readonly ScreeningQuestionResponse[]) {
    this.questions.set([...questions].sort((a, b) => a.displayOrder - b.displayOrder));
  }

  private hydrate(session: ScreeningSessionDetailResponse) {
    // A completed session belongs on the result page, not the questionnaire.
    if (session.status !== 'DRAFT') {
      this.router.navigate(['/screening/result', this.sessionId]);
      return;
    }
    if (this.questions().length === 0) {
      this.loading.set(false);
      this.fatalError.set('No screening questions are available right now.');
      return;
    }
    const answers: Record<string, number> = {};
    for (const answer of session.answers) answers[answer.questionId] = answer.answerValue;
    this.answers.set(answers);
    // Resume at the first unanswered question, if any.
    const firstUnanswered = this.questions().findIndex((q) => answers[q.id] === undefined);
    this.currentIndex.set(firstUnanswered === -1 ? 0 : firstUnanswered);
    this.loading.set(false);
  }

  selectAnswer(value: number) {
    const question = this.currentQuestion();
    if (!question) return;
    const previous = this.answers();
    this.answers.set({ ...previous, [question.id]: value });
    this.saveError.set(null);
    this.saving.set(true);
    this.api
      .upsertAnswer(this.sessionId, { questionId: question.id, answerValue: value })
      .subscribe({
        next: () => this.saving.set(false),
        error: () => {
          this.answers.set(previous); // revert optimistic update
          this.saving.set(false);
          this.saveError.set('That answer could not be saved. Please try again.');
        },
      });
  }

  back() {
    if (this.currentIndex() > 0) this.currentIndex.update((index) => index - 1);
  }

  next() {
    if (this.currentValue() === null) return;
    if (this.isLast()) {
      this.submit();
      return;
    }
    this.currentIndex.update((index) => Math.min(index + 1, this.total() - 1));
  }

  private submit() {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.saveError.set(null);
    this.api.submitSession(this.sessionId).subscribe({
      next: () => this.router.navigate(['/screening/result', this.sessionId]),
      error: () => {
        this.submitting.set(false);
        this.saveError.set('The screening could not be submitted. Please try again.');
      },
    });
  }

  openExit() {
    this.showExitModal.set(true);
  }

  cancelExit() {
    this.showExitModal.set(false);
  }

  confirmExit() {
    this.showExitModal.set(false);
    this.goToScreeningHome();
  }

  goToScreeningHome() {
    this.router.navigate(['/screening']);
  }
}
