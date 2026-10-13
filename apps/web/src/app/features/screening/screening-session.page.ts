import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  ScreeningQuestionResponse,
  ScreeningSessionDetailResponse,
} from '@auticare/contracts';
import { ScreeningApi } from './data-access/screening.api';
import { ScreeningAnswerScaleComponent } from './components/screening-answer-scale.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  standalone: true,
  imports: [
    ScreeningAnswerScaleComponent,
    UiMessageComponent,
    UiDialogComponent,
    UiSpinnerComponent,
  ],
  template: `
    <div class="session-wrapper">
      @if (loading()) {
        <div class="state-center">
          <ac-ui-spinner label="Loading clinical screening session…" />
        </div>
      } @else if (fatalError()) {
        <div class="state-center fatal">
          <ac-ui-message tone="error">{{ fatalError() }}</ac-ui-message>
          <button type="button" class="back-home-btn" (click)="goToScreeningHome()">
            {{ isKm() ? 'ត្រឡប់ទៅទំព័រវាយតម្លៃ (Back to Screening)' : 'Back to Screening' }}
          </button>
        </div>
      } @else if (currentQuestion(); as question) {
        <!-- 1. Sticky Top Progress Bar -->
        <header class="sticky-progress-header" aria-label="Screening progress">
          <div class="header-inner">
            <div class="meta-row">
              <div class="category-indicator">
                <span class="category-icon" aria-hidden="true">{{
                  categoryIcon(question.category)
                }}</span>
                <span class="category-name">{{ formatCategoryBilingual(question.category) }}</span>
              </div>
              <div class="progress-details">
                <span class="step-count">
                  Question {{ currentIndex() + 1 }} of {{ total() }}
                  <small class="text-sub-bilingual">
                    ({{
                      isKm()
                        ? 'សំណួរទី ' + (currentIndex() + 1) + ' ក្នុងចំណោម ' + total()
                        : 'Question ' + (currentIndex() + 1) + ' of ' + total()
                    }})
                  </small>
                </span>
                <span class="pct-badge">{{ Math.round(progressPct()) }}% Completed</span>
              </div>
              <div class="header-actions">
                <button
                  type="button"
                  class="lang-toggle-btn"
                  (click)="toggleLanguage()"
                  [attr.aria-label]="isKm() ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'"
                >
                  <span class="lang-flag" aria-hidden="true">{{ isKm() ? '🇬🇧' : '🇰🇭' }}</span>
                  <span class="lang-text">{{ isKm() ? 'English' : 'ភាសាខ្មែរ' }}</span>
                </button>
                <button type="button" class="save-exit-btn" (click)="openExit()">
                  Save & Finish Later
                </button>
              </div>
            </div>
            <div
              class="progress-track"
              role="progressbar"
              aria-label="Screening progress"
              [attr.aria-valuenow]="currentIndex() + 1"
              aria-valuemin="1"
              [attr.aria-valuemax]="total()"
            >
              <div class="progress-fill" [style.width.%]="progressPct()"></div>
            </div>
          </div>
        </header>

        <!-- 2. Centered Question Assessment Card -->
        <main class="question-container">
          <article class="question-card" [class.transitioning]="isTransitioning()">
            <div class="card-eyebrow">
              <span class="domain-tag"
                >{{ formatCategoryBilingual(question.category) }} Assessment</span
              >
              @if (isLast()) {
                <span class="final-tag">{{
                  isKm() ? 'សំណួរចុងក្រោយ (Final Question)' : 'Final Question'
                }}</span>
              }
            </div>

            <h1 class="question-text">
              @if (isKm()) {
                <span class="question-primary-text">{{
                  getKhmerQuestion(question.questionText)
                }}</span>
                <span class="question-sub-text">({{ question.questionText }})</span>
              } @else {
                <span class="question-primary-text">{{ question.questionText }}</span>
                <span class="question-sub-text"
                  >({{ getKhmerQuestion(question.questionText) }})</span
                >
              }
              <span class="required-asterisk" aria-hidden="true">*</span>
              <span class="visually-hidden">(required)</span>
            </h1>

            <div class="guidance-callout">
              <span class="guidance-icon" aria-hidden="true">💡</span>
              <p>
                <strong>Observational guidance:</strong>
                <span class="text-sub-bilingual">(ការណែនាំសង្កេត)</span>
                {{
                  isKm()
                    ? 'សូមពិចារណាលើអាកប្បកិរិយាធម្មជាតិក្នុងប៉ុន្មានសប្តាហ៍ថ្មីៗនេះនៅក្នុងបរិយាកាសផ្ទះដ៏ស្រណុកសុខស្រួល។ គ្មានចម្លើយណាត្រូវឬខុសឡើយ។ (Consider spontaneous behaviors across recent weeks in relaxed home environments. There are no right or wrong answers.)'
                    : 'Consider spontaneous behaviors across recent weeks in relaxed home environments. There are no right or wrong answers.'
                }}
              </p>
            </div>

            <div class="answer-scale-section">
              <ac-screening-answer-scale
                [value]="currentValue()"
                [ariaLabel]="question.questionText"
                [disabled]="saving()"
                (valueChange)="selectAnswer($event)"
              />
            </div>

            <div class="shortcuts-legend">
              <span class="legend-icon" aria-hidden="true">⌨️</span>
              <span class="legend-text">
                Quick answer: Press <kbd>1</kbd> for <strong>Never (មិនដែល)</strong>,
                <kbd>2</kbd> for <strong>Rarely (កម្រ)</strong>, <kbd>3</kbd> for
                <strong>Sometimes (ជួនកាល)</strong>, <kbd>4</kbd> for
                <strong>Often (ញឹកញាប់)</strong>, <kbd>5</kbd> for <strong>Always (ជានិច្ច)</strong>
              </span>
            </div>

            @if (saveError()) {
              <ac-ui-message tone="error">{{ saveError() }}</ac-ui-message>
            }
          </article>

          <!-- 3. Navigation Controls -->
          <footer class="assessment-controls">
            <button
              type="button"
              class="nav-btn btn-secondary"
              [disabled]="currentIndex() === 0"
              (click)="back()"
            >
              &larr; {{ isKm() ? 'សំណួរមុន (Previous Question)' : 'Previous Question' }}
            </button>

            <button
              type="button"
              class="nav-btn btn-primary"
              [disabled]="currentValue() === null || saving() || submitting()"
              (click)="next()"
            >
              @if (isLast()) {
                {{
                  submitting()
                    ? isKm()
                      ? 'កំពុងបញ្ចប់ការវិភាគ... (Finalizing Analysis…)'
                      : 'Finalizing Analysis…'
                    : isKm()
                      ? 'បញ្ចប់ការវាយតម្លៃ (Complete Screening)'
                      : 'Complete Screening'
                }}
              } @else {
                {{ isKm() ? 'សំណួរបន្ទាប់ (Next Question)' : 'Next Question' }} &rarr;
              }
            </button>
          </footer>
        </main>
      }

      @if (showExitModal()) {
        <ac-ui-dialog
          [heading]="
            isKm()
              ? 'រក្សាទុក និងបញ្ចប់ការវាយតម្លៃពេលក្រោយ? (Save and finish screening later?)'
              : 'Save and finish screening later?'
          "
          [description]="
            isKm()
              ? 'ចម្លើយរបស់អ្នកត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ។ អ្នកអាចបន្តការវាយតម្លៃនេះបានគ្រប់ពេលពីផ្ទាំងគ្រប់គ្រងការវាយតម្លៃរបស់អ្នក។ (Your answers are automatically saved. You can resume this assessment anytime from your Screening dashboard.)'
              : 'Your answers are automatically saved. You can resume this assessment anytime from your Screening dashboard.'
          "
          dialogRole="alertdialog"
          size="sm"
          (close)="cancelExit()"
        >
          <div dialogFooter class="modal-actions">
            <button type="button" class="dialog-cancel-btn" (click)="cancelExit()">
              {{ isKm() ? 'បន្តការវាយតម្លៃ (Keep Going)' : 'Keep Going' }}
            </button>
            <button type="button" class="dialog-confirm-btn" (click)="confirmExit()">
              Save & Finish Later
            </button>
          </div>
        </ac-ui-dialog>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .session-wrapper {
        display: flex;
        flex-direction: column;
        min-height: 80vh;
      }

      .state-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        text-align: center;
        gap: 16px;
      }

      .back-home-btn {
        margin-top: 12px;
        min-height: 44px;
        padding: 0 20px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: 0;
        font-weight: 700;
        cursor: pointer;
      }

      /* Sticky Top Progress Header */
      .sticky-progress-header {
        position: sticky;
        top: 0;
        z-index: var(--ac-z-header);
        background: var(--ac-color-surface);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-xs);
        padding: 12px 24px;
      }

      .header-inner {
        max-width: 820px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .category-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
      }

      .category-icon {
        font-size: 14px;
      }

      .category-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        text-transform: capitalize;
      }

      .progress-details {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .step-count {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .text-sub-bilingual {
        font-size: 11px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        margin-left: 2px;
      }

      .pct-badge {
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-action-mid);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .lang-toggle-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        padding: 5px 12px;
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        cursor: pointer;
        transition: all var(--ac-motion-fast);
      }

      .lang-toggle-btn:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .lang-flag {
        font-size: 13px;
      }

      .save-exit-btn {
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        border-radius: var(--ac-radius-md);
        padding: 6px 14px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all var(--ac-motion-fast);
      }

      .save-exit-btn:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .progress-track {
        height: 6px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-slate-line-mist);
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--ac-color-action);
        border-radius: var(--ac-radius-pill);
        transition: width 350ms cubic-bezier(0.2, 0, 0, 1);
      }

      /* Question Container & Card */
      .question-container {
        max-width: 820px;
        width: 100%;
        margin: 36px auto;
        padding: 0 20px 48px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .question-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-xl);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 36px 40px;
        display: flex;
        flex-direction: column;
        gap: 22px;
        transition:
          opacity 200ms ease,
          transform 200ms ease;
      }

      .question-card.transitioning {
        opacity: 0.7;
        transform: translateY(-4px);
      }

      .card-eyebrow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .domain-tag {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ac-color-action-mid);
      }

      .final-tag {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
      }

      .question-text {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: clamp(22px, 3.2vw, 28px);
        font-weight: 700;
        line-height: 1.35;
      }

      .question-primary-text {
        display: inline;
      }

      .question-sub-text {
        display: block;
        margin-top: 6px;
        font-size: clamp(15px, 2vw, 18px);
        font-weight: 500;
        color: var(--ac-color-text-slate);
        line-height: 1.4;
      }

      .required-asterisk {
        color: var(--ac-color-alert-strong);
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .guidance-callout {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-md);
        padding: 14px 18px;
      }

      .guidance-icon {
        font-size: 18px;
        line-height: 1.2;
        flex: 0 0 auto;
      }

      .guidance-callout p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      .guidance-callout p strong {
        color: var(--ac-color-text-strong);
      }

      .answer-scale-section {
        margin-top: 6px;
      }

      .shortcuts-legend {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--ac-color-text-slate);
        padding-top: 6px;
      }

      .legend-icon {
        font-size: 14px;
      }

      .shortcuts-legend kbd {
        display: inline-block;
        padding: 1px 6px;
        border-radius: var(--ac-radius-xs);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-grey);
        font-weight: 700;
        font-size: 11px;
        color: var(--ac-color-text-strong);
      }

      /* Assessment Controls */
      .assessment-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .nav-btn {
        min-height: 48px;
        padding: 0 24px;
        border-radius: var(--ac-radius-md);
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all var(--ac-motion-fast);
      }

      .btn-secondary {
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
      }

      .btn-secondary:hover:not(:disabled) {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        box-shadow: var(--ac-shadow-sm);
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-1px);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Exit Modal Actions */
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .dialog-cancel-btn {
        min-height: 40px;
        padding: 0 16px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-weight: 700;
        cursor: pointer;
      }

      .dialog-confirm-btn {
        min-height: 40px;
        padding: 0 18px;
        border-radius: var(--ac-radius-md);
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-weight: 700;
        cursor: pointer;
      }

      @media (max-width: 640px) {
        .sticky-progress-header {
          padding: 10px 16px;
        }

        .meta-row {
          gap: 10px;
        }

        .question-card {
          padding: 24px 20px;
        }

        .assessment-controls {
          flex-direction: column-reverse;
        }

        .nav-btn {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningSessionPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ScreeningApi);
  private readonly i18n = inject(I18nService);

  readonly currentLang = this.i18n.currentLang;
  readonly isKm = computed(() => this.currentLang() === 'km');

  protected readonly Math = Math;
  private sessionId = '';
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly questions = signal<readonly ScreeningQuestionResponse[]>([]);
  readonly answers = signal<Record<string, number>>({});
  readonly currentIndex = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly isTransitioning = signal(false);
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

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.showExitModal() || this.loading() || this.submitting()) return;
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

    if (event.key === '1') {
      event.preventDefault();
      this.selectAnswer(0); // Never
    } else if (event.key === '2') {
      event.preventDefault();
      this.selectAnswer(1); // Rarely
    } else if (event.key === '3') {
      event.preventDefault();
      this.selectAnswer(2); // Sometimes
    } else if (event.key === '4') {
      event.preventDefault();
      this.selectAnswer(3); // Often
    } else if (event.key === '5') {
      event.preventDefault();
      this.selectAnswer(4); // Always
    } else if (event.key === 'ArrowLeft' && this.currentIndex() > 0) {
      event.preventDefault();
      this.back();
    } else if (
      (event.key === 'ArrowRight' || event.key === 'Enter') &&
      this.currentValue() !== null
    ) {
      event.preventDefault();
      this.next();
    }
  }

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    if (!this.sessionId) {
      this.loading.set(false);
      this.fatalError.set('This screening session could not be found.');
      return;
    }

    const state = history.state as { questions?: ScreeningQuestionResponse[] } | null;
    if (Array.isArray(state?.questions) && state.questions.length > 0) {
      this.setQuestions(state.questions);
    }

    this.api.getSession(this.sessionId).subscribe({
      next: (session) => {
        if (session.status !== 'DRAFT') {
          this.router.navigate(['/screening/result', this.sessionId], { replaceUrl: true });
          return;
        }
        this.api.listQuestions(session.ageBand ?? undefined).subscribe({
          next: (questions) => {
            this.setQuestions(questions);
            this.hydrate(session);
          },
          error: () => {
            this.loading.set(false);
            this.fatalError.set('This screening session could not be loaded.');
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.fatalError.set('This screening session could not be loaded.');
      },
    });
  }

  ngOnDestroy() {
    this.clearAutoAdvance();
  }

  categoryIcon(category?: string | null): string {
    if (!category) return '🧩';
    const lower = category.toLowerCase();
    if (lower.includes('communicat') || lower.includes('speech')) return '💬';
    if (lower.includes('social') || lower.includes('interact')) return '🤝';
    if (lower.includes('sensor') || lower.includes('sound') || lower.includes('touch')) return '🎨';
    if (lower.includes('routine') || lower.includes('repetit') || lower.includes('behavior'))
      return '🔄';
    if (lower.includes('motor') || lower.includes('physic')) return '🏃';
    return '🧩';
  }

  toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  getKhmerQuestion(text?: string | null): string {
    if (!text) return '';
    const map: Record<string, string> = {
      'Does your child make consistent eye contact when interacting?':
        'តើកូនរបស់អ្នករក្សាការសម្លឹងមើលភ្នែកជាប់លាប់នៅពេលមានទំនាក់ទំនងជាមួយអ្នកដែរឬទេ?',
      'Does your child respond when their name is called across the room?':
        'តើកូនរបស់អ្នកឆ្លើយតបនៅពេលគេហៅឈ្មោះរបស់គេពីចម្ងាយដែរឬទេ?',
      'Does your child point to objects they want or want to show you?':
        'តើកូនរបស់អ្នកចង្អុលបង្ហាញវត្ថុដែលគេចង់បាន ឬចង់បង្ហាញដល់អ្នកដែរឬទេ?',
      'Does your child smile back when you smile at them?':
        'តើកូនរបស់អ្នកញញឹមតបវិញនៅពេលអ្នកញញឹមដាក់គេដែរឬទេ?',
      'Does your child imitate actions like clapping or waving goodbye?':
        'តើកូនរបស់អ្នកធ្វើតាមសកម្មភាពដូចជាការទះដៃ ឬបក់ដៃលាដែរឬទេ?',
      'Does your child show unusual sensitivity to loud sounds or bright lights?':
        'តើកូនរបស់អ្នកបង្ហាញភាពប្រែប្រួលញាណខុសពីធម្មតាចំពោះសំឡេងខ្លាំង ឬពន្លឺចាំងដែរឬទេ?',
      'Does your child engage in repetitive movements like hand flapping or rocking?':
        'តើកូនរបស់អ្នកមានចលនាដដែលៗដូចជាបក់ដៃ ឬយោលខ្លួនដែរឬទេ?',
      'Does your child become very upset by minor changes in routines?':
        'តើកូនរបស់អ្នកពិបាកចិត្តខ្លាំងចំពោះការផ្លាស់ប្តូរបន្តិចបន្តួចក្នុងទម្លាប់ប្រចាំថ្ងៃដែរឬទេ?',
    };
    if (map[text]) return map[text];
    const lower = text.toLowerCase();
    if (lower.includes('eye contact')) {
      return 'តើកូនរបស់អ្នករក្សាការសម្លឹងមើលភ្នែកជាប់លាប់នៅពេលមានទំនាក់ទំនងជាមួយអ្នកដែរឬទេ?';
    }
    if (lower.includes('name') && lower.includes('call')) {
      return 'តើកូនរបស់អ្នកឆ្លើយតបនៅពេលគេហៅឈ្មោះរបស់គេពីចម្ងាយដែរឬទេ?';
    }
    if (lower.includes('point')) {
      return 'តើកូនរបស់អ្នកចង្អុលបង្ហាញវត្ថុដែលគេចង់បាន ឬចង់បង្ហាញដល់អ្នកដែរឬទេ?';
    }
    if (lower.includes('smile')) {
      return 'តើកូនរបស់អ្នកញញឹមតបវិញនៅពេលអ្នកញញឹមដាក់គេដែរឬទេ?';
    }
    if (lower.includes('sound') || lower.includes('sensor') || lower.includes('light')) {
      return 'តើកូនរបស់អ្នកបង្ហាញភាពប្រែប្រួលញាណខុសពីធម្មតាចំពោះសំឡេង ឬពន្លឺដែរឬទេ?';
    }
    if (lower.includes('routine') || lower.includes('change')) {
      return 'តើកូនរបស់អ្នកពិបាកចិត្តខ្លាំងចំពោះការផ្លាស់ប្តូរទម្លាប់ប្រចាំថ្ងៃដែរឬទេ?';
    }
    return text;
  }

  formatCategoryBilingual(category?: string | null): string {
    if (!category) return 'ការលូតលាស់ទូទៅ (General Development)';
    const lower = category.toLowerCase();
    if (lower.includes('social') && lower.includes('communicat')) {
      return 'ទំនាក់ទំនងសង្គម និងការប្រាស្រ័យទាក់ទង (Social Communication)';
    }
    if (lower.includes('social') || lower.includes('interact')) {
      return 'ទំនាក់ទំនងសង្គម (Social Interaction)';
    }
    if (lower.includes('sensor') || lower.includes('sound') || lower.includes('touch')) {
      return 'ការឆ្លើយតបញាណដឹង (Sensory Response)';
    }
    if (lower.includes('communicat') || lower.includes('speech')) {
      return 'ការប្រាស្រ័យទាក់ទង (Communication)';
    }
    if (
      lower.includes('routine') ||
      lower.includes('flexib') ||
      lower.includes('repetit') ||
      lower.includes('behavior')
    ) {
      return 'ទម្លាប់ប្រចាំថ្ងៃ (Flexibility & Routine)';
    }
    if (lower.includes('motor') || lower.includes('physic')) {
      return 'ចលនាសាច់ដុំ (Motor Skills)';
    }
    return `${category}`;
  }

  private setQuestions(questions: readonly ScreeningQuestionResponse[]) {
    this.questions.set([...questions].sort((a, b) => a.displayOrder - b.displayOrder));
  }

  private hydrate(session: ScreeningSessionDetailResponse) {
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
    const firstUnanswered = this.questions().findIndex((q) => answers[q.id] === undefined);
    this.currentIndex.set(firstUnanswered === -1 ? 0 : firstUnanswered);
    this.loading.set(false);
  }

  selectAnswer(value: number) {
    const question = this.currentQuestion();
    if (!question) return;
    this.clearAutoAdvance();

    const previous = this.answers();
    this.answers.set({ ...previous, [question.id]: value });
    this.saveError.set(null);
    this.saving.set(true);

    this.api
      .upsertAnswer(this.sessionId, { questionId: question.id, answerValue: value })
      .subscribe({
        next: () => {
          this.saving.set(false);
          // Auto-advance to next question if not the final question
          if (!this.isLast()) {
            this.autoAdvanceTimer = setTimeout(() => {
              this.triggerTransitionNext();
            }, 320);
          }
        },
        error: () => {
          this.answers.set(previous);
          this.saving.set(false);
          this.saveError.set('That answer could not be saved. Please try again.');
        },
      });
  }

  private triggerTransitionNext() {
    this.isTransitioning.set(true);
    setTimeout(() => {
      this.next();
      this.isTransitioning.set(false);
    }, 120);
  }

  private clearAutoAdvance() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  back() {
    this.clearAutoAdvance();
    if (this.currentIndex() > 0) {
      this.currentIndex.update((index) => index - 1);
    }
  }

  next() {
    this.clearAutoAdvance();
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
    this.clearAutoAdvance();
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
