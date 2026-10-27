import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AdminQuestion, AdminQuestionnaire } from '@auticare/contracts';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

type FormKind = AdminQuestion['formKind'];
type AgeBand = AdminQuestion['ageBand'];
type Polarity = AdminQuestion['polarity'];

const TABS: readonly { formKind: FormKind; ageBand: AgeBand; label: string }[] = [
  { formKind: 'SHORT', ageBand: 'TODDLER', label: 'Short · Toddler' },
  { formKind: 'SHORT', ageBand: 'PRESCHOOL', label: 'Short · Preschool' },
  { formKind: 'FULL', ageBand: 'TODDLER', label: 'Full · Toddler' },
  { formKind: 'FULL', ageBand: 'PRESCHOOL', label: 'Full · Preschool' },
];

/**
 * The questions parents answer. Editing never rewrites a question: it
 * publishes a new version and retires the old one, so answers already given
 * stay with the wording the parent actually saw.
 */
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiFieldComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    AccessibleFormDirective,
  ],
  selector: 'ac-admin-questionnaire-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Questionnaire Management</h1>
        <p class="subtitle">
          The questions behind each child's educational summary. Saving an edit publishes a new
          version for new questionnaires; finished questionnaires keep the wording they were
          answered with. The questionnaire is educational, not a diagnostic test.
        </p>
      </div>
      <button type="button" class="btn-primary" (click)="openNew()">
        {{ editing() === 'new' ? 'Close' : 'Add question' }}
      </button>
    </header>

    <div class="actions" role="tablist" aria-label="Form and age group">
      @for (option of tabs; track option.label) {
        <button
          type="button"
          role="tab"
          class="btn-small"
          [attr.aria-selected]="tab() === option"
          [attr.aria-pressed]="tab() === option"
          (click)="selectTab(option)"
        >
          {{ option.label }}
        </button>
      }
    </div>

    @if (loading()) {
      <ac-ui-spinner label="Loading questions…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else {
      @if (stats(); as s) {
        <section class="stats" aria-label="Completion">
          <div class="stat">
            <strong>{{ s.started }}</strong
            ><span>Questionnaires started</span>
          </div>
          <div class="stat">
            <strong>{{ s.completed }}</strong
            ><span>Completed</span>
          </div>
          <div class="stat">
            <strong>{{ s.started ? ((s.completed / s.started) * 100).toFixed(0) : 0 }}%</strong>
            <span>Completion rate</span>
          </div>
          <div class="stat">
            <strong>{{ live().length }}</strong
            ><span>Live questions</span>
          </div>
        </section>
      }

      @if (editing() !== null) {
        <section class="card" aria-labelledby="question-form-title">
          <h2 id="question-form-title">
            {{ editing() === 'new' ? 'New question for ' + tab().label : 'Publish a new version' }}
          </h2>
          @if (editing() !== 'new') {
            <ac-ui-message tone="info">
              The current wording is kept for the {{ editingAnswers() }} answers already given. New
              questionnaires will use this version.
            </ac-ui-message>
          }
          <form [formGroup]="form" (ngSubmit)="save()" acAccessibleForm novalidate>
            <ac-ui-field
              label="Question"
              [required]="true"
              [error]="
                form.controls.questionText.touched && form.controls.questionText.invalid
                  ? 'Use 5 to 500 characters.'
                  : null
              "
            >
              <textarea formControlName="questionText" rows="3" maxlength="500"></textarea>
            </ac-ui-field>
            <div class="form-grid">
              <ac-ui-field label="Area" [required]="true" hint="For example: Social Interaction">
                <input type="text" formControlName="category" maxlength="80" />
              </ac-ui-field>
              <ac-ui-field
                label="Scoring direction"
                [required]="true"
                hint="Reverse: 'Always' is a good sign. Direct: 'Always' suggests more support may help."
              >
                <select formControlName="polarity">
                  <option value="REVERSE">Reverse (a typical skill)</option>
                  <option value="DIRECT">Direct (e.g. sensory sensitivity)</option>
                </select>
              </ac-ui-field>
              <ac-ui-field label="Position" [required]="true">
                <input type="number" formControlName="displayOrder" min="0" max="9999" />
              </ac-ui-field>
            </div>
            @if (formError(); as message) {
              <ac-ui-message tone="error">{{ message }}</ac-ui-message>
            }
            <div class="actions">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Publishing…' : 'Publish' }}
              </button>
              <button type="button" class="btn-ghost" (click)="editing.set(null)">Cancel</button>
            </div>
          </form>
        </section>
      }

      <section class="card" aria-label="Live questions">
        <ol class="rows">
          @for (question of live(); track question.id) {
            <li class="row">
              <div class="who">
                <strong>{{ question.displayOrder }}. {{ question.questionText }}</strong>
                <span class="meta">
                  {{ question.category }} ·
                  {{ question.polarity === 'REVERSE' ? 'Reverse' : 'Direct' }} · version
                  {{ question.version }} · {{ question.answerCount }} answers
                </span>
              </div>
              <div class="actions">
                <button type="button" class="btn-small" (click)="edit(question)">Edit</button>
                <button type="button" class="btn-small danger" (click)="setActive(question, false)">
                  Archive
                </button>
              </div>
            </li>
          } @empty {
            <li class="empty">No live questions in this form.</li>
          }
        </ol>
      </section>

      <label class="check">
        <input
          type="checkbox"
          [checked]="showRetired()"
          (change)="showRetired.set(!showRetired())"
        />
        Show retired versions ({{ retired().length }})
      </label>
      @if (showRetired()) {
        <section class="card" aria-label="Retired versions">
          <ul class="rows">
            @for (question of retired(); track question.id) {
              <li class="row">
                <div class="who">
                  <strong>{{ question.questionText }}</strong>
                  <span class="meta">
                    version {{ question.version }} · {{ question.answerCount }} answers
                    @if (hasNewer(question)) {
                      · replaced by a newer version
                    }
                  </span>
                </div>
                @if (!hasNewer(question)) {
                  <button type="button" class="btn-small" (click)="setActive(question, true)">
                    Restore
                  </button>
                }
              </li>
            } @empty {
              <li class="empty">No retired versions.</li>
            }
          </ul>
        </section>
      }

      @if (actionError(); as message) {
        <ac-ui-message tone="error">{{ message }}</ac-ui-message>
      }
    }
  `,
  styles: [
    PORTAL_PAGE_STYLES,
    `
      form {
        display: grid;
        gap: 14px;
      }

      textarea {
        width: 100%;
        font: inherit;
      }

      .check {
        display: flex;
        gap: 8px;
        align-items: center;
        color: var(--ac-color-text-body);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminQuestionnairePage implements OnInit {
  private readonly api = inject(AdminPortalApi);
  private readonly fb = inject(FormBuilder);

  protected readonly data = signal<AdminQuestionnaire | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly showRetired = signal(false);
  /** null: no form; 'new': adding; otherwise the id of the question being edited. */
  protected readonly editing = signal<string | null>(null);
  protected readonly tabs = TABS;
  protected readonly tab = signal(TABS[0]!);

  private readonly inTab = computed(() =>
    (this.data()?.questions ?? []).filter(
      (q) => q.formKind === this.tab().formKind && q.ageBand === this.tab().ageBand,
    ),
  );
  protected readonly live = computed(() =>
    this.inTab()
      .filter((q) => q.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder),
  );
  protected readonly retired = computed(() => this.inTab().filter((q) => !q.isActive));
  protected readonly stats = computed(() =>
    this.data()?.stats.find(
      (s) => s.formKind === this.tab().formKind && s.ageBand === this.tab().ageBand,
    ),
  );
  protected readonly editingAnswers = computed(
    () => this.data()?.questions.find((q) => q.id === this.editing())?.answerCount ?? 0,
  );

  protected readonly form = this.fb.nonNullable.group({
    questionText: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    category: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    polarity: ['REVERSE' as Polarity],
    displayOrder: [1, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.load();
  }

  protected selectTab(option: (typeof TABS)[number]): void {
    this.tab.set(option);
    this.editing.set(null);
  }

  protected hasNewer(question: AdminQuestion): boolean {
    return (this.data()?.questions ?? []).some((q) => q.replacesId === question.id);
  }

  protected openNew(): void {
    if (this.editing() === 'new') {
      this.editing.set(null);
      return;
    }
    const next = Math.max(0, ...this.live().map((q) => q.displayOrder)) + 1;
    this.form.reset({ questionText: '', category: '', polarity: 'REVERSE', displayOrder: next });
    this.formError.set(null);
    this.editing.set('new');
  }

  protected edit(question: AdminQuestion): void {
    this.form.setValue({
      questionText: question.questionText,
      category: question.category,
      polarity: question.polarity,
      displayOrder: question.displayOrder,
    });
    this.formError.set(null);
    this.editing.set(question.id);
  }

  protected save(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const target = this.editing();
    const request =
      target === 'new'
        ? this.api.createQuestion({
            ...value,
            formKind: this.tab().formKind,
            ageBand: this.tab().ageBand,
          })
        : this.api.updateQuestion(target as string, value);
    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.load();
      },
      error: (err: unknown) => {
        this.formError.set(errorMessage(err, 'The question could not be published.'));
        this.saving.set(false);
      },
    });
  }

  protected setActive(question: AdminQuestion, active: boolean): void {
    if (
      !active &&
      !confirm(
        'Archive this question? New questionnaires will no longer ask it. Past answers stay.',
      )
    ) {
      return;
    }
    this.actionError.set(null);
    this.api.setQuestionActive(question.id, active).subscribe({
      next: () => this.load(),
      error: (err: unknown) =>
        this.actionError.set(errorMessage(err, 'The question could not be changed.')),
    });
  }

  private load(): void {
    this.api.questionnaire().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Questions could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
