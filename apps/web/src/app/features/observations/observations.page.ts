import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { ObservationCategory, ObservationResponse } from '@auticare/contracts';
import { observationCategories } from '@auticare/contracts';
import type { ChildResponse } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { ObservationsApi } from './data-access/observations.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

const COPY = {
  en: {
    eyebrow: 'Observations',
    title: 'What you noticed',
    subtitle:
      'A short record of the day-to-day. Nothing here is a diagnosis — it is the evidence you would otherwise have to remember at an appointment.',
    record: 'Record something',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    all: 'All',
    empty: 'Nothing recorded yet',
    emptyBody:
      'Record the first thing you notice, even something small. Patterns come from ordinary days.',
    loadError: 'Your observations could not be loaded.',
    saveError: 'This observation could not be saved.',
    deleteError: 'This observation could not be deleted.',
    confirmDelete: 'Delete?',
    delete: 'Delete',
    whenLabel: 'When',
    noteLabel: 'What happened (optional)',
    notePlaceholder: 'e.g. Covered his ears at the market and cried for ten minutes.',
    intensityLabel: 'How intense was it',
    categoryLabel: 'What was it',
    mild: 'Mild',
    severe: 'Severe',
    today: 'Today',
    yesterday: 'Yesterday',
    noChild: 'Add a child before recording an observation.',
    categories: {
      CRYING: 'Crying',
      SLEEP: 'Sleep',
      EATING: 'Eating',
      SENSORY: 'Sensory',
      SOCIAL: 'Social',
      ROUTINE: 'Routine',
      OTHER: 'Other',
    },
  },
  km: {
    eyebrow: 'ការសង្កេត',
    title: 'អ្វីដែលអ្នកបានកត់សម្គាល់',
    subtitle:
      'កំណត់ត្រាខ្លីៗប្រចាំថ្ងៃ។ គ្មានអ្វីនៅទីនេះជាការធ្វើរោគវិនិច្ឆ័យទេ — វាជាភស្តុតាងដែលអ្នកប្រហែលជាត្រូវចងចាំនៅពេលជួបគ្រូពេទ្យ។',
    record: 'កត់ត្រាថ្មី',
    cancel: 'បោះបង់',
    save: 'រក្សាទុក',
    saving: 'កំពុងរក្សាទុក…',
    all: 'ទាំងអស់',
    empty: 'មិនទាន់មានកំណត់ត្រាទេ',
    emptyBody: 'កត់ត្រាអ្វីដំបូងដែលអ្នកសង្កេតឃើញ ទោះតូចក៏ដោយ។ គំរូកើតចេញពីថ្ងៃធម្មតា។',
    loadError: 'មិនអាចផ្ទុកកំណត់ត្រារបស់អ្នកបានទេ។',
    saveError: 'មិនអាចរក្សាទុកកំណត់ត្រានេះបានទេ។',
    deleteError: 'មិនអាចលុបកំណត់ត្រានេះបានទេ។',
    confirmDelete: 'លុបមែនទេ?',
    delete: 'លុប',
    whenLabel: 'ពេលណា',
    noteLabel: 'មានអ្វីកើតឡើង (មិនចាំបាច់)',
    notePlaceholder: 'ឧ. គាត់បិទត្រចៀកនៅផ្សារ ហើយយំដប់នាទី។',
    intensityLabel: 'វាខ្លាំងប៉ុណ្ណា',
    categoryLabel: 'វាជាអ្វី',
    mild: 'ស្រាល',
    severe: 'ខ្លាំង',
    today: 'ថ្ងៃនេះ',
    yesterday: 'ម្សិលមិញ',
    noChild: 'សូមបន្ថែមកុមារមុនពេលកត់ត្រា។',
    categories: {
      CRYING: 'យំ',
      SLEEP: 'ការគេង',
      EATING: 'ការញ៉ាំ',
      SENSORY: 'អារម្មណ៍វិញ្ញាណ',
      SOCIAL: 'ទំនាក់ទំនងសង្គម',
      ROUTINE: 'ទម្លាប់ប្រចាំថ្ងៃ',
      OTHER: 'ផ្សេងៗ',
    },
  },
};

/**
 * Recording is deliberately a two-tap action with a single screen: a parent doing
 * this at 11pm with a crying child will not fill in a form. Category, intensity
 * and time are enough; the note is optional and never required.
 */
@Component({
  standalone: true,
  imports: [UiMessageComponent, UiSpinnerComponent],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ copy().eyebrow }}</p>
        <h1>{{ copy().title }}</h1>
        <p class="subtitle">{{ copy().subtitle }}</p>
      </div>
      <button type="button" class="primary" (click)="openForm()" [disabled]="!child()">
        {{ copy().record }}
      </button>
    </header>

    @if (error()) {
      <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
    }

    @if (!loading() && children().length === 0) {
      <p class="notice">{{ copy().noChild }}</p>
    }

    <!-- Recording sheet -->
    @if (formOpen()) {
      <section class="sheet" aria-labelledby="sheet-title">
        <h2 id="sheet-title">{{ copy().record }}</h2>

        <fieldset class="group">
          <legend>{{ copy().categoryLabel }}</legend>
          <div class="chips">
            @for (item of categories(); track item.value) {
              <button
                type="button"
                class="chip"
                [class.selected]="draftCategory() === item.value"
                [attr.aria-pressed]="draftCategory() === item.value"
                (click)="draftCategory.set(item.value)"
              >
                {{ item.label }}
              </button>
            }
          </div>
        </fieldset>

        <fieldset class="group">
          <legend>{{ copy().intensityLabel }}</legend>
          <div class="scale">
            @for (level of intensityLevels; track level) {
              <button
                type="button"
                class="level"
                [class.selected]="draftIntensity() === level"
                [attr.aria-pressed]="draftIntensity() === level"
                [attr.aria-label]="level + ' / 5'"
                (click)="draftIntensity.set(level)"
              >
                {{ level }}
              </button>
            }
          </div>
          <div class="scale-legend">
            <span>{{ copy().mild }}</span>
            <span>{{ copy().severe }}</span>
          </div>
        </fieldset>

        <label class="field">
          <span>{{ copy().whenLabel }}</span>
          <input type="datetime-local" [value]="draftWhen()" (change)="onWhen($event)" />
        </label>

        <label class="field">
          <span>{{ copy().noteLabel }}</span>
          <textarea
            rows="3"
            maxlength="2000"
            [placeholder]="copy().notePlaceholder"
            [value]="draftNote()"
            (input)="onNote($event)"
          ></textarea>
        </label>

        <div class="actions">
          <button type="button" class="ghost" (click)="closeForm()" [disabled]="saving()">
            {{ copy().cancel }}
          </button>
          <button type="button" class="primary" (click)="save()" [disabled]="saving()">
            {{ saving() ? copy().saving : copy().save }}
          </button>
        </div>
      </section>
    }

    <!-- Filters -->
    @if (observations().length > 0) {
      <div class="filters" role="group" aria-label="Filter by category">
        <button
          type="button"
          class="chip"
          [class.selected]="filter() === null"
          [attr.aria-pressed]="filter() === null"
          (click)="setFilter(null)"
        >
          {{ copy().all }}
        </button>
        @for (item of categories(); track item.value) {
          <button
            type="button"
            class="chip"
            [class.selected]="filter() === item.value"
            [attr.aria-pressed]="filter() === item.value"
            (click)="setFilter(item.value)"
          >
            {{ item.label }}
          </button>
        }
      </div>
    }

    @if (loading()) {
      <ac-ui-spinner [label]="copy().saving" />
    } @else if (visible().length === 0 && !formOpen()) {
      <div class="empty">
        <p class="empty-title">{{ copy().empty }}</p>
        <p class="subtitle">{{ copy().emptyBody }}</p>
      </div>
    } @else {
      <ul class="list">
        @for (item of visible(); track item.id) {
          <li class="entry">
            <span
              class="dot"
              [class]="'cat-' + item.category.toLowerCase()"
              aria-hidden="true"
            ></span>
            <div class="entry-body">
              <div class="entry-head">
                <span class="entry-cat">{{ copy().categories[item.category] }}</span>
                <span class="entry-when">{{ whenLabel(item.occurredAt) }}</span>
              </div>
              @if (item.note) {
                <p class="entry-note">{{ item.note }}</p>
              }
              <div
                class="intensity"
                [attr.aria-label]="copy().intensityLabel + ': ' + item.intensity + ' / 5'"
              >
                @for (level of intensityLevels; track level) {
                  <span class="pip" [class.on]="level <= item.intensity"></span>
                }
              </div>
            </div>
            @if (pendingDelete() === item.id) {
              <button type="button" class="danger" (click)="remove(item)">
                {{ copy().confirmDelete }}
              </button>
            } @else {
              <button
                type="button"
                class="icon-btn"
                [attr.aria-label]="copy().delete"
                (click)="pendingDelete.set(item.id)"
              >
                ×
              </button>
            }
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 880px;
        margin: 0 auto;
      }

      .page-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 22px;
        flex-wrap: wrap;
      }

      .eyebrow {
        margin: 0 0 6px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: var(--ac-type-label);
        font-weight: 700;
        color: var(--ac-color-action);
      }

      h1 {
        margin: 0 0 8px;
        font-size: var(--ac-type-page-title);
        color: var(--ac-color-text-strong);
      }

      h2 {
        margin: 0 0 10px;
        font-size: var(--ac-type-section-title);
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 0;
        max-width: 62ch;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
      }

      .notice {
        padding: 14px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
      }

      .sheet {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-action);
        border-radius: var(--ac-radius-lg);
        padding: 22px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: var(--ac-shadow-sm);
      }

      .group {
        border: 0;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      legend,
      .field span {
        font-size: var(--ac-type-label);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
        color: var(--ac-color-text-muted);
        padding: 0;
        margin-bottom: 6px;
      }

      .chips,
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .filters {
        margin-bottom: 18px;
      }

      .chip {
        font: inherit;
        font-size: var(--ac-type-meta);
        font-weight: 600;
        padding: 8px 14px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .chip:hover {
        border-color: var(--ac-color-action);
      }

      .chip.selected {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .scale {
        display: flex;
        gap: 8px;
      }

      .level {
        font: inherit;
        width: 44px;
        height: 44px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-weight: 700;
        cursor: pointer;
      }

      .level.selected {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .scale-legend {
        display: flex;
        justify-content: space-between;
        width: 252px;
        max-width: 100%;
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .field {
        display: flex;
        flex-direction: column;
      }

      input,
      textarea {
        font: inherit;
        padding: 11px 13px;
        border-radius: var(--ac-radius-sm);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        resize: vertical;
      }

      input:focus-visible,
      textarea:focus-visible,
      button:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .primary,
      .ghost,
      .danger {
        font: inherit;
        padding: 11px 20px;
        border-radius: var(--ac-radius-pill);
        font-weight: 700;
        cursor: pointer;
      }

      .primary {
        border: 1px solid var(--ac-color-action-deep);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .ghost {
        border: 1px solid var(--ac-color-border);
        background: transparent;
        color: var(--ac-color-text-strong);
      }

      .danger {
        border: 1px solid var(--ac-color-alert-strong);
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
        padding: 8px 12px;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .entry {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 16px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
      }

      .dot {
        width: 10px;
        height: 10px;
        margin-top: 6px;
        flex: none;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      .dot.cat-sleep {
        background: #6b7fa8;
      }

      .dot.cat-crying {
        background: #b3756a;
      }

      .dot.cat-eating {
        background: #8a9a6b;
      }

      .dot.cat-sensory {
        background: #a98dbe;
      }

      .dot.cat-social {
        background: #5f9ea0;
      }

      .dot.cat-routine {
        background: #c09a4e;
      }

      .dot.cat-other {
        background: var(--ac-color-text-muted);
      }

      .entry-body {
        flex: 1;
        min-width: 0;
      }

      .entry-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
      }

      .entry-cat {
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .entry-when {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .entry-note {
        margin: 6px 0 0;
        color: var(--ac-color-text-strong);
        line-height: 1.55;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .intensity {
        display: flex;
        gap: 4px;
        margin-top: 8px;
      }

      .pip {
        width: 18px;
        height: 4px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
      }

      .pip.on {
        background: var(--ac-color-action);
      }

      .icon-btn {
        font: inherit;
        font-size: 20px;
        line-height: 1;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid transparent;
        background: transparent;
        color: var(--ac-color-text-muted);
        cursor: pointer;
      }

      .icon-btn:hover {
        background: var(--ac-color-surface-slate);
      }

      .empty {
        padding: 32px;
        border: 1.5px dashed var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        text-align: center;
      }

      .empty-title {
        margin: 0 0 6px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      @media (max-width: 640px) {
        .page-head {
          flex-direction: column;
          align-items: stretch;
        }

        .page-head .primary {
          width: 100%;
        }

        .scale-legend {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObservationsPage implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly api = inject(ObservationsApi);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);
  protected readonly intensityLevels = [1, 2, 3, 4, 5] as const;

  protected readonly children = signal<readonly ChildResponse[]>([]);
  protected readonly child = computed(() => this.children()[0] ?? null);
  protected readonly observations = signal<readonly ObservationResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<ObservationCategory | null>(null);
  protected readonly pendingDelete = signal<string | null>(null);

  protected readonly formOpen = signal(false);
  protected readonly draftCategory = signal<ObservationCategory>('CRYING');
  protected readonly draftIntensity = signal(3);
  protected readonly draftWhen = signal(this.localNow());
  protected readonly draftNote = signal('');

  protected readonly categories = computed(() =>
    observationCategories.map((value) => ({ value, label: this.copy().categories[value] })),
  );

  ngOnInit(): void {
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        const child = children[0];
        if (!child) {
          this.loading.set(false);
          return;
        }
        this.load(child.id);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.copy().loadError);
      },
    });
  }

  private load(childId: string): void {
    this.loading.set(true);
    this.api.list({ childId }).subscribe({
      next: (rows) => {
        this.observations.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.copy().loadError);
      },
    });
  }

  protected setFilter(category: ObservationCategory | null): void {
    this.filter.set(category);
  }

  protected openForm(): void {
    this.formOpen.set(true);
    this.draftWhen.set(this.localNow());
    this.draftNote.set('');
    this.error.set(null);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected onWhen(event: Event): void {
    this.draftWhen.set((event.target as HTMLInputElement).value);
  }

  protected onNote(event: Event): void {
    this.draftNote.set((event.target as HTMLTextAreaElement).value);
  }

  protected save(): void {
    const child = this.child();
    if (!child || this.saving()) return;

    const when = new Date(this.draftWhen());
    this.saving.set(true);
    this.error.set(null);

    this.api
      .create({
        childId: child.id,
        category: this.draftCategory(),
        intensity: this.draftIntensity(),
        occurredAt: (Number.isNaN(when.getTime()) ? new Date() : when).toISOString(),
        ...(this.draftNote().trim() ? { note: this.draftNote().trim() } : {}),
      })
      .subscribe({
        next: (row) => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.observations.update((rows) =>
            [row, ...rows].sort(
              (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
            ),
          );
        },
        error: () => {
          this.saving.set(false);
          this.error.set(this.copy().saveError);
        },
      });
  }

  protected remove(item: ObservationResponse): void {
    this.api.remove(item.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.observations.update((rows) => rows.filter((row) => row.id !== item.id));
      },
      error: () => {
        this.pendingDelete.set(null);
        this.error.set(this.copy().deleteError);
      },
    });
  }

  /**
   * Displayed list is filtered client-side: the page already holds the child's
   * recent observations, and a filter tap should not cost a round trip.
   */
  protected readonly visible = computed(() => {
    const category = this.filter();
    return category
      ? this.observations().filter((row) => row.category === category)
      : this.observations();
  });

  protected whenLabel(iso: string): string {
    const date = new Date(iso);
    const copy = this.copy();
    const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayMs = 86_400_000;
    if (day === startOfToday) return `${copy.today} · ${time}`;
    if (day === startOfToday - dayMs) return `${copy.yesterday} · ${time}`;
    return `${date.toLocaleDateString()} · ${time}`;
  }

  private localNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}
