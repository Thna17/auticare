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
            {{ isKm() ? 'ត្រឡប់ទៅទំព័រវាយតម្លៃ' : 'Back to Screening' }}
          </button>
        </div>
      } @else if (currentQuestion(); as question) {
        <!-- 1. Sticky Top Progress Bar -->
        <header class="sticky-progress-header" aria-label="Screening progress">
          <div class="header-inner">
            <div class="meta-row">
              <div class="meta-left">
                <button
                  type="button"
                  class="top-nav-btn"
                  (click)="openExit()"
                  [attr.aria-label]="isKm() ? 'ត្រឡប់ទៅទំព័រវាយតម្លៃ' : 'Back to Screening'"
                >
                  &larr; {{ isKm() ? 'ត្រឡប់ទៅទំព័រវាយតម្លៃ' : 'Back to Screening' }}
                </button>
                <div class="category-indicator">
                  <span class="category-icon" aria-hidden="true">{{
                    categoryIcon(question.category)
                  }}</span>
                  <span class="category-name">{{ formatCategory(question.category) }}</span>
                </div>
              </div>
              <div class="progress-details">
                <span class="step-count">
                  {{
                    isKm()
                      ? 'សំណួរទី ' + (currentIndex() + 1) + ' ក្នុងចំណោម ' + total()
                      : 'Question ' + (currentIndex() + 1) + ' of ' + total()
                  }}
                </span>
                <span class="pct-badge">{{
                  isKm()
                    ? 'បញ្ចប់បាន ' + Math.round(progressPct()) + '%'
                    : Math.round(progressPct()) + '% Completed'
                }}</span>
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
                  {{ isKm() ? 'រក្សាទុក និងបន្តពេលក្រោយ' : 'Save & Finish Later' }}
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
              <span class="domain-tag">{{
                isKm()
                  ? 'ការវាយតម្លៃផ្នែក ' + formatCategory(question.category)
                  : formatCategory(question.category) + ' Assessment'
              }}</span>
              @if (isLast()) {
                <span class="final-tag">{{ isKm() ? 'សំណួរចុងក្រោយ' : 'Final Question' }}</span>
              }
            </div>

            <h1 class="question-text">
              @if (isKm()) {
                <span class="question-primary-text">{{
                  getKhmerQuestion(question.questionText)
                }}</span>
              } @else {
                <span class="question-primary-text">{{ question.questionText }}</span>
              }
              <span class="required-asterisk" aria-hidden="true">*</span>
              <span class="visually-hidden">({{ isKm() ? 'តម្រូវឱ្យឆ្លើយ' : 'required' }})</span>
            </h1>

            <div class="guidance-callout">
              <span class="guidance-icon" aria-hidden="true">💡</span>
              <p>
                <strong>{{ isKm() ? 'ការណែនាំសង្កេត៖' : 'Observational guidance:' }}</strong>
                {{
                  isKm()
                    ? 'សូមពិចារណាលើអាកប្បកិរិយាធម្មជាតិក្នុងប៉ុន្មានសប្តាហ៍ថ្មីៗនេះនៅក្នុងបរិយាកាសផ្ទះដ៏ស្រណុកសុខស្រួល។ គ្មានចម្លើយណាត្រូវឬខុសឡើយ។'
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
                @if (isKm()) {
                  ឆ្លើយរហ័ស៖ ចុច <kbd>1</kbd> សម្រាប់ <strong>មិនដែល</strong>, <kbd>2</kbd> សម្រាប់
                  <strong>កម្រ</strong>, <kbd>3</kbd> សម្រាប់ <strong>ម្តងម្កាល</strong>,
                  <kbd>4</kbd> សម្រាប់ <strong>ញឹកញាប់</strong>, <kbd>5</kbd> សម្រាប់
                  <strong>ជានិច្ច</strong>
                } @else {
                  Quick answer: Press <kbd>1</kbd> for <strong>Never</strong>, <kbd>2</kbd> for
                  <strong>Rarely</strong>, <kbd>3</kbd> for <strong>Sometimes</strong>,
                  <kbd>4</kbd> for <strong>Often</strong>, <kbd>5</kbd> for <strong>Always</strong>
                }
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
              &larr; {{ isKm() ? 'សំណួរមុន' : 'Previous Question' }}
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
                      ? 'កំពុងបញ្ចប់ការវិភាគ...'
                      : 'Finalizing Analysis…'
                    : isKm()
                      ? 'បញ្ចប់ការវាយតម្លៃ'
                      : 'Submit Assessment'
                }}
              } @else {
                {{ isKm() ? 'សំណួរបន្ទាប់' : 'Next Question' }} &rarr;
              }
            </button>
          </footer>
        </main>
      }

      @if (showExitModal()) {
        <ac-ui-dialog
          [heading]="
            isKm() ? 'រក្សាទុក និងបញ្ចប់ការវាយតម្លៃពេលក្រោយ?' : 'Save and finish screening later?'
          "
          [description]="
            isKm()
              ? 'ចម្លើយរបស់អ្នកត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ។ អ្នកអាចបន្តការវាយតម្លៃនេះបានគ្រប់ពេលពីផ្ទាំងគ្រប់គ្រងការវាយតម្លៃរបស់អ្នក។'
              : 'Your answers are automatically saved. You can resume this assessment anytime from your Screening dashboard.'
          "
          dialogRole="alertdialog"
          size="sm"
          (close)="cancelExit()"
        >
          <div dialogFooter class="modal-actions">
            <button type="button" class="dialog-cancel-btn" (click)="cancelExit()">
              {{ isKm() ? 'បន្តការវាយតម្លៃ' : 'Keep Going' }}
            </button>
            <button type="button" class="dialog-confirm-btn" (click)="confirmExit()">
              {{ isKm() ? 'រក្សាទុក និងចាកចេញ' : 'Save & Finish Later' }}
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

      .meta-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .top-nav-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        padding: 4px 12px;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        cursor: pointer;
        transition:
          color var(--ac-motion-fast),
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .top-nav-btn:hover {
        background: var(--ac-color-surface-hover);
        color: var(--ac-color-action-deep);
        border-color: var(--ac-color-action);
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
      // Toddler & Common Screening Questions
      'Does your child make eye contact when you speak to them?':
        'តើកូនរបស់អ្នកសម្លឹងមើលភ្នែកនៅពេលអ្នកនិយាយជាមួយពួកគេដែរឬទេ?',
      'Does your child make consistent eye contact when interacting?':
        'តើកូនរបស់អ្នករក្សាការសម្លឹងមើលភ្នែកជាប់លាប់នៅពេលមានទំនាក់ទំនងជាមួយអ្នកដែរឬទេ?',
      'Does your child smile back when you smile at them?':
        'តើកូនរបស់អ្នកញញឹមតបវិញនៅពេលអ្នកញញឹមដាក់គេដែរឬទេ?',
      'Does your child show interest in playing with other children?':
        'តើកូនរបស់អ្នកបង្ហាញការចាប់អារម្មណ៍ក្នុងការលេងជាមួយកុមារដទៃដែរឬទេ?',
      'Does your child seem to enjoy being held or cuddled?':
        'តើកូនរបស់អ្នកចូលចិត្តឱ្យគេឱប ឬបីត្រកងដែរឬទេ?',
      'Does your child respond when you call their name?':
        'តើកូនរបស់អ្នកឆ្លើយតបនៅពេលអ្នកហៅឈ្មោះរបស់គេដែរឬទេ?',
      'Does your child respond when their name is called across the room?':
        'តើកូនរបស់អ្នកឆ្លើយតបនៅពេលគេហៅឈ្មោះរបស់គេពីចម្ងាយដែរឬទេ?',
      'Does your child use gestures (like pointing or waving) to communicate?':
        'តើកូនរបស់អ្នកប្រើកាយវិការ (ដូចជាចង្អុល ឬបក់ដៃ) ដើម្បីប្រាស្រ័យទាក់ទងដែរឬទេ?',
      "Does your child try to show you an object they're interested in?":
        'តើកូនរបស់អ្នកព្យាយាមបង្ហាញវត្ថុដែលគេចាប់អារម្មណ៍ដល់អ្នកដែរឬទេ?',
      'Does your child point to objects they want or want to show you?':
        'តើកូនរបស់អ្នកចង្អុលបង្ហាញវត្ថុដែលគេចង់បាន ឬចង់បង្ហាញដល់អ្នកដែរឬទេ?',
      'Does your child use words or phrases to ask for things they want?':
        'តើកូនរបស់អ្នកប្រើពាក្យ ឬឃ្លាដើម្បីសុំរបស់ដែលគេចង់បានដែរឬទេ?',
      'Does your child imitate sounds, words, or actions that you make?':
        'តើកូនរបស់អ្នកធ្វើត្រាប់តាមសំឡេង ពាក្យ ឬសកម្មភាពរបស់អ្នកដែរឬទេ?',
      'Does your child imitate actions like clapping or waving goodbye?':
        'តើកូនរបស់អ្នកធ្វើតាមសកម្មភាពដូចជាការទះដៃ ឬបក់ដៃលាដែរឬទេ?',
      'Does your child engage in pretend play (e.g. feeding a doll, talking on a toy phone)?':
        'តើកូនរបស់អ្នកចូលរួមក្នុងការលេងបែបស្រមើស្រមៃ (ឧទាហរណ៍៖ បញ្ចុកបាយតុក្កតា និយាយទូរស័ព្ទជ័រ) ដែរឬទេ?',
      "Does your child play with toys in the way they're meant to be used, rather than lining them up or spinning them?":
        'តើកូនរបស់អ្នកលេងប្រដាប់ក្មេងលេងតាមរបៀបដែលគេត្រូវលេង ជាជាងតម្រៀបជាជួរ ឬបង្វិលវាដែរឬទេ?',
      'Does your child show curiosity about new toys or objects?':
        'តើកូនរបស់អ្នកបង្ហាញការចង់ដឹងចង់ឃើញអំពីប្រដាប់ក្មេងលេង ឬវត្ថុថ្មីៗដែរឬទេ?',
      'Does your child copy activities they see you doing (like sweeping or stirring)?':
        'តើកូនរបស់អ្នកធ្វើតាមសកម្មភាពដែលគេឃើញអ្នកធ្វើ (ដូចជាបោសផ្ទះ ឬកូរម្ហូប) ដែរឬទេ?',
      'Does your child react strongly (covering ears, crying) to loud or unexpected sounds?':
        'តើកូនរបស់អ្នកមានប្រតិកម្មខ្លាំង (ខ្ទប់ត្រចៀក យំ) ចំពោះសំឡេងខ្លាំង ឬសំឡេងដែលមិនបានរំពឹងទុកដែរឬទេ?',
      'Does your child show unusual sensitivity to loud sounds or bright lights?':
        'តើកូនរបស់អ្នកបង្ហាញភាពប្រែប្រួលញាណខុសពីធម្មតាចំពោះសំឡេងខ្លាំង ឬពន្លឺចាំងដែរឬទេ?',
      'Does your child seem unusually sensitive to certain textures, tastes, or smells?':
        'តើកូនរបស់អ្នកហាក់ដូចជាមានភាពរសើបខុសពីធម្មតាចំពោះផ្ទៃប៉ះ រសជាតិ ឬក្លិនជាក់លាក់ដែរឬទេ?',
      'Does your child seek out spinning, rocking, or other repetitive movement?':
        'តើកូនរបស់អ្នកចូលចិត្តចលនាបង្វិល យោលខ្លួន ឬចលនាដដែលៗផ្សេងទៀតដែរឬទេ?',
      'Does your child engage in repetitive movements like hand flapping or rocking?':
        'តើកូនរបស់អ្នកមានចលនាដដែលៗដូចជាបក់ដៃ ឬយោលខ្លួនដែរឬទេ?',
      'Does your child get unusually upset by small changes in routine?':
        'តើកូនរបស់អ្នកពិបាកចិត្តខុសពីធម្មតាចំពោះការផ្លាស់ប្តូរបន្តិចបន្តួចក្នុងទម្លាប់ប្រចាំថ្ងៃដែរឬទេ?',
      'Does your child become very upset by minor changes in routines?':
        'តើកូនរបស់អ្នកពិបាកចិត្តខ្លាំងចំពោះការផ្លាស់ប្តូរបន្តិចបន្តួចក្នុងទម្លាប់ប្រចាំថ្ងៃដែរឬទេ?',
      'Does your child make repetitive hand or finger movements (flapping, wiggling near the eyes)?':
        'តើកូនរបស់អ្នកធ្វើចលនាដៃ ឬម្រាមដៃដដែលៗ (បក់ដៃ គ្រវីជិតភ្នែក) ដែរឬទេ?',
      'Does your child walk on their toes frequently?': 'តើកូនរបស់អ្នកដើរដោយចុងជើងញឹកញាប់ដែរឬទេ?',
      'Does your child repeat words or phrases without an apparent communicative purpose (echoing)?':
        'តើកូនរបស់អ្នកនិយាយពាក្យ ឬឃ្លាដដែលៗដោយគ្មានបំណងប្រាស្រ័យទាក់ទងច្បាស់លាស់ (និយាយបន្ទរ) ដែរឬទេ?',
      'Does your child insist on things being done in exactly the same way each time?':
        'តើកូនរបស់អ្នកទាមទារឱ្យធ្វើអ្វីៗតាមរបៀបដូចគ្នាបេះបិទរាល់ពេលដែរឬទេ?',

      // Preschool Screening Questions
      'Does your child seek out other children to play with?':
        'តើកូនរបស់អ្នកស្វែងរកកុមារដទៃដើម្បីលេងជាមួយដែរឬទេ?',
      'Does your child join in group games or activities with peers?':
        'តើកូនរបស់អ្នកចូលរួមលេងហ្គេមជាក្រុម ឬសកម្មភាពជាមួយមិត្តភក្តិដែរឬទេ?',
      'Does your child notice when someone else is upset or hurt?':
        'តើកូនរបស់អ្នកកត់សម្គាល់ឃើញនៅពេលអ្នកដទៃពិបាកចិត្ត ឬមានរបួសដែរឬទេ?',
      'Does your child make friends easily at school or in group settings?':
        'តើកូនរបស់អ្នកងាយស្រួលរាប់អានមិត្តភក្តិនៅសាលា ឬក្នុងក្រុមដែរឬទេ?',
      'Does your child enjoy sharing something exciting with you (a drawing, a toy, a discovery)?':
        'តើកូនរបស់អ្នកចូលចិត្តចែករំលែកអ្វីដែលគួរឱ្យរំភើបជាមួយអ្នក (គំនូរ ប្រដាប់ក្មេងលេង ឬការរកឃើញថ្មី) ដែរឬទេ?',
      'Does your child hold a back-and-forth conversation about a topic?':
        'តើកូនរបស់អ្នកអាចសន្ទនាឆ្លើយឆ្លងគ្នាអំពីប្រធានបទណាមួយបានដែរឬទេ?',
      "Does your child ask questions to learn more about something they're curious about?":
        'តើកូនរបស់អ្នកសួរសំណួរដើម្បីស្វែងយល់បន្ថែមអំពីអ្វីដែលគេចង់ដឹងដែរឬទេ?',
      "Does your child understand jokes or teasing in the way they're intended?":
        'តើកូនរបស់អ្នកយល់ពីរឿងកំប្លែង ឬការលេងសើចតាមន័យពិតរបស់វាដែរឬទេ?',
      "Does your child use facial expressions that match what they're saying or feeling?":
        'តើកូនរបស់អ្នកប្រើទឹកមុខដែលស៊ីគ្នានឹងអ្វីដែលគេកំពុងនិយាយ ឬមានអារម្មណ៍ដែរឬទេ?',
      'Does your child struggle to explain their own feelings in words?':
        'តើកូនរបស់អ្នកពិបាកក្នុងការពន្យល់អារម្មណ៍របស់ខ្លួនជាពាក្យសម្តីដែរឬទេ?',
      'Does your child engage in imaginative or make-believe play with other children?':
        'តើកូនរបស់អ្នកចូលរួមក្នុងការលេងបែបស្រមើស្រមៃជាមួយកុមារដទៃដែរឬទេ?',
      'Does your child act out different characters or roles during play?':
        'តើកូនរបស់អ្នកសម្តែងជាតួអង្គ ឬតួនាទីផ្សេងៗក្នុងពេលលេងដែរឬទេ?',
      'Does your child prefer playing the same game or activity in exactly the same way each time?':
        'តើកូនរបស់អ្នកចូលចិត្តលេងល្បែង ឬសកម្មភាពដដែលតាមរបៀបដដែលៗរាល់ពេលដែរឬទេ?',
      'Does your child show interest in a very narrow topic to the exclusion of most others?':
        'តើកូនរបស់អ្នកបង្ហាញការចាប់អារម្មណ៍ខ្លាំងលើប្រធានបទតូចចង្អៀតមួយ ដោយមិនខ្វល់ពីអ្វីផ្សេងទៀតដែរឬទេ?',
      'Does your child build or create things in a flexible, varied way, or does it stay very repetitive?':
        'តើកូនរបស់អ្នកសង់ ឬបង្កើតរបស់របរតាមរបៀបបត់បែន និងចម្រុះ ឬនៅតែធ្វើដដែលៗ?',
      'Does your child cover their ears or become distressed around loud environments (parties, assemblies)?':
        'តើកូនរបស់អ្នកខ្ទប់ត្រចៀក ឬមានអារម្មណ៍តានតឹងនៅកន្លែងដែលមានសំឡេងខ្លាំង (ពិធីជប់លៀង ការជួបជុំ) ដែរឬទេ?',
      "Does your child avoid certain clothing, food textures, or physical sensations that don't bother other children their age?":
        'តើកូនរបស់អ្នកគេចវេះពីសម្លៀកបំពាក់ អាហារ ឬការប៉ះពាល់ដែលមិនរំខានដល់កុមារដទៃក្នុងវ័យរបស់គេដែរឬទេ?',
      'Does your child seek out intense sensory input (spinning, crashing into things, seeking pressure)?':
        'តើកូនរបស់អ្នកស្វែងរកការរំញោចញាណដឹងខ្លាំង (បង្វិល បុករបស់របរ ស្វែងរកសម្ពាធ) ដែរឬទេ?',
      'Does your child get overwhelmed in busy or crowded places?':
        'តើកូនរបស់អ្នកមានអារម្មណ៍ថប់បារម្ភ ឬតានតឹងនៅកន្លែងដែលមានមនុស្សច្រើន ឬអ៊ូអរដែរឬទេ?',
      'Does your child become very upset by minor changes to a plan or routine?':
        'តើកូនរបស់អ្នកពិបាកចិត្តខ្លាំងចំពោះការផ្លាស់ប្តូរបន្តិចបន្តួចក្នុងគម្រោង ឬទម្លាប់ប្រចាំថ្ងៃដែរឬទេ?',
      'Does your child insist on doing things in a particular order or sequence?':
        'តើកូនរបស់អ្នកទាមទារឱ្យធ្វើអ្វីៗតាមលំដាប់លំដោយជាក់លាក់ដែរឬទេ?',
      'Does your child have difficulty moving from one activity to the next without distress?':
        'តើកូនរបស់អ្នកពិបាកក្នុងការផ្លាស់ប្តូរពីសកម្មភាពមួយទៅសកម្មភាពមួយទៀតដោយមិនតានតឹងដែរឬទេ?',
      'Does your child show unusual or repetitive body movements (hand-flapping, rocking, spinning)?':
        'តើកូនរបស់អ្នកបង្ហាញចលនារាងកាយមិនធម្មតា ឬដដែលៗ (បក់ដៃ យោលខ្លួន បង្វិល) ដែរឬទេ?',
      'Does your child adapt reasonably well when plans change unexpectedly?':
        'តើកូនរបស់អ្នកអាចសម្របខ្លួនបានល្អសមរម្យនៅពេលដែលគម្រោងផ្លាស់ប្តូរដោយមិនបានរំពឹងទុកដែរឬទេ?',
    };
    if (map[text]) return map[text];
    const lower = text.toLowerCase();
    if (lower.includes('eye contact')) {
      return 'តើកូនរបស់អ្នករក្សាការសម្លឹងមើលភ្នែកជាប់លាប់នៅពេលមានទំនាក់ទំនងជាមួយអ្នកដែរឬទេ?';
    }
    if (lower.includes('name') && lower.includes('call')) {
      return 'តើកូនរបស់អ្នកឆ្លើយតបនៅពេលគេហៅឈ្មោះរបស់គេពីចម្ងាយដែរឬទេ?';
    }
    if (lower.includes('point') || lower.includes('gesture')) {
      return 'តើកូនរបស់អ្នកប្រើកាយវិការ ឬចង្អុលបង្ហាញវត្ថុដែរឬទេ?';
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
    if (lower.includes('friend') || lower.includes('peer') || lower.includes('play with other')) {
      return 'តើកូនរបស់អ្នកចូលចិត្តលេងជាមួយកុមារដទៃដែរឬទេ?';
    }
    if (lower.includes('pretend') || lower.includes('role') || lower.includes('imagin')) {
      return 'តើកូនរបស់អ្នកចូលរួមក្នុងការលេងបែបស្រមើស្រមៃដែរឬទេ?';
    }
    if (lower.includes('repetitive') || lower.includes('flapping') || lower.includes('rocking')) {
      return 'តើកូនរបស់អ្នកមានចលនាដដែលៗដូចជាបក់ដៃ ឬយោលខ្លួនដែរឬទេ?';
    }
    if (lower.includes('conversation') || lower.includes('word') || lower.includes('speech')) {
      return 'តើកូនរបស់អ្នកប្រើពាក្យសម្តី ឬការសន្ទនាដើម្បីប្រាស្រ័យទាក់ទងដែរឬទេ?';
    }
    return text;
  }

  formatCategory(category?: string | null): string {
    if (!category) return this.isKm() ? 'ការលូតលាស់ទូទៅ' : 'General Development';
    const lower = category.toLowerCase();
    if (lower.includes('social') && lower.includes('communicat')) {
      return this.isKm() ? 'ទំនាក់ទំនងសង្គម និងការប្រាស្រ័យទាក់ទង' : 'Social Communication';
    }
    if (lower.includes('social') || lower.includes('interact')) {
      return this.isKm() ? 'ទំនាក់ទំនងសង្គម' : 'Social Interaction';
    }
    if (lower.includes('sensor') && lower.includes('flexib')) {
      return this.isKm() ? 'ភាពបត់បែននៃញាណដឹង' : 'Sensory Flexibility';
    }
    if (lower.includes('sensor') || lower.includes('sound') || lower.includes('touch')) {
      return this.isKm() ? 'ការឆ្លើយតបញាណដឹង' : 'Sensory Response';
    }
    if (lower.includes('communicat') || lower.includes('speech')) {
      return this.isKm() ? 'ការប្រាស្រ័យទាក់ទង' : 'Communication';
    }
    if (lower.includes('play') || lower.includes('imagin')) {
      return this.isKm() ? 'ការលេង និងការស្រមើស្រមៃ' : 'Play & Imagination';
    }
    if (
      lower.includes('routine') ||
      lower.includes('flexib') ||
      lower.includes('repetit') ||
      lower.includes('behavior')
    ) {
      return this.isKm() ? 'ភាពបត់បែន និងទម្លាប់ប្រចាំថ្ងៃ' : 'Flexibility & Routine';
    }
    if (lower.includes('motor') || lower.includes('physic')) {
      return this.isKm() ? 'ចលនាសាច់ដុំ' : 'Motor Skills';
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
