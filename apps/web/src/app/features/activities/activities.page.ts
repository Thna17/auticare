import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ActivityProgressResponse, ActivityResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { ActivitiesApi } from './data-access/activities.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';

interface ChildOption {
  readonly id: string;
  readonly firstName: string;
}

/** An activity paired with this child's progress on it, if any. */
interface ActivityRow {
  readonly activity: ActivityResponse;
  readonly progress: ActivityProgressResponse | null;
}

const monthsToLabel = (months: number): string => {
  if (months < 24) return `${months} months`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} years` : `${years}y ${rest}m`;
};

@Component({
  standalone: true,
  selector: 'ac-activities-page',
  imports: [FormsModule, RouterLink, UiCardComponent, UiEmptyStateComponent, UiMessageComponent],
  template: `
    <section class="page-header">
      <p class="eyebrow">Home support</p>
      <h1>Activities</h1>
      <p class="intro">
        Ideas you can try at home, matched to your child’s age. Starting one is just for your own
        tracking — there is no right pace, and nothing here is a substitute for advice from a
        clinician.
      </p>
    </section>

    @if (childrenError(); as problem) {
      <ac-ui-card>
        <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
      </ac-ui-card>
    } @else if (children().length === 0 && !loadingChildren()) {
      <ac-ui-empty-state
        title="Add a child first"
        message="Activities are matched to a child’s age, so add a child to your family profile to see suitable ideas."
      >
        <a class="cta" routerLink="/children">Add a child</a>
      </ac-ui-empty-state>
    } @else {
      <ac-ui-card>
        <div class="controls">
          <label class="control">
            <span>Child</span>
            <select
              [ngModel]="selectedChildId()"
              (ngModelChange)="selectChild($event)"
              name="child"
            >
              @for (child of children(); track child.id) {
                <option [value]="child.id">{{ child.firstName }}</option>
              }
            </select>
          </label>

          @if (categories().length > 1) {
            <label class="control">
              <span>Category</span>
              <select
                [ngModel]="category()"
                (ngModelChange)="selectCategory($event)"
                name="category"
              >
                <option value="">All categories</option>
                @for (name of categories(); track name) {
                  <option [value]="name">{{ name }}</option>
                }
              </select>
            </label>
          }
        </div>
      </ac-ui-card>

      @if (loading()) {
        <ac-ui-card><p>Loading activities…</p></ac-ui-card>
      } @else if (error(); as problem) {
        <ac-ui-card>
          <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
          <button type="button" class="retry" (click)="load()">Try again</button>
        </ac-ui-card>
      } @else if (rows().length === 0) {
        <!--
          An empty catalogue is a real state here, not a bug: the activity library
          is still being written. Saying so is better than an empty grid that looks
          broken, and better than implying there is nothing suitable for this child.
        -->
        <ac-ui-empty-state
          title="No activities yet for this age"
          message="The activity library is still being built. In the meantime, your child’s progress reports and school updates are the best picture of how they are doing."
        >
          <a class="cta" routerLink="/progress">View progress</a>
        </ac-ui-empty-state>
      } @else {
        @if (actionError(); as problem) {
          <p class="error banner" role="alert">{{ problem }}</p>
        }

        <ul class="grid" aria-label="Suggested activities">
          @for (row of rows(); track row.activity.id) {
            <li>
              <ac-ui-card>
                <article class="activity">
                  <header>
                    <span class="category">{{ row.activity.category }}</span>
                    <span class="ages">
                      {{ monthsToLabel(row.activity.minAgeMonths) }} –
                      {{ monthsToLabel(row.activity.maxAgeMonths) }}
                    </span>
                  </header>

                  <h2>{{ row.activity.title }}</h2>
                  <p class="summary">{{ row.activity.summary }}</p>

                  @if (row.progress === null) {
                    <button
                      type="button"
                      class="primary"
                      [disabled]="busyActivityId() === row.activity.id"
                      (click)="start(row.activity)"
                    >
                      {{ busyActivityId() === row.activity.id ? 'Starting…' : 'Start activity' }}
                    </button>
                  } @else {
                    <div class="progress-row">
                      @if (row.progress.completedAt) {
                        <span class="status done">Completed</span>
                        <button
                          type="button"
                          class="plain"
                          [disabled]="busyProgressId() === row.progress.id"
                          (click)="setCompleted(row.progress, false)"
                        >
                          Mark as not done
                        </button>
                      } @else {
                        <span class="status going">In progress</span>
                        <button
                          type="button"
                          class="primary"
                          [disabled]="busyProgressId() === row.progress.id"
                          (click)="setCompleted(row.progress, true)"
                        >
                          {{
                            busyProgressId() === row.progress.id ? 'Saving…' : 'Mark as completed'
                          }}
                        </button>
                      }
                    </div>

                    <label class="note">
                      <span>Your notes <em>(optional, only you can see these)</em></span>
                      <textarea
                        rows="2"
                        [ngModel]="noteDraft(row.progress)"
                        (ngModelChange)="setNoteDraft(row.progress.id, $event)"
                        [name]="'note-' + row.progress.id"
                        maxlength="2000"
                      ></textarea>
                      <button
                        type="button"
                        class="plain"
                        [disabled]="
                          !noteChanged(row.progress) || busyProgressId() === row.progress.id
                        "
                        (click)="saveNote(row.progress)"
                      >
                        Save note
                      </button>
                    </label>
                  }
                </article>
              </ac-ui-card>
            </li>
          }
        </ul>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 960px;
      }

      .page-header {
        margin-bottom: 20px;
      }

      .eyebrow {
        margin: 0;
        color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
      }

      h1 {
        margin: 4px 0 8px;
        font-size: var(--ac-type-page-title);
      }

      .intro {
        margin: 0;
        max-width: 68ch;
        color: var(--ac-color-text-body);
        line-height: 1.55;
      }

      .controls {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .control {
        display: grid;
        gap: 6px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      select,
      textarea {
        min-height: 44px;
        padding: 8px 12px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 10px;
        background: var(--ac-color-tint-blue-pale);
        font: inherit;
        color: var(--ac-color-text-strong);
      }

      textarea {
        width: 100%;
        resize: vertical;
      }

      .grid {
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }

      .activity header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }

      .category {
        padding: 3px 10px;
        border-radius: 999px;
        background: #eef3f6;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
      }

      .ages {
        color: var(--ac-color-grey-b);
        font-size: var(--ac-type-meta);
      }

      h2 {
        margin: 12px 0 6px;
        font-size: 1.05rem;
      }

      .summary {
        margin: 0 0 14px;
        color: var(--ac-color-text);
        line-height: 1.55;
      }

      .progress-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .status {
        padding: 4px 12px;
        border-radius: 999px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
      }

      .status.done {
        background: #e8f7ee;
        color: #0b6b3a;
      }

      .status.going {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-text-dark);
      }

      .primary,
      .plain,
      .retry,
      .cta {
        min-height: 40px;
        padding: 0 16px;
        border-radius: 10px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
      }

      .primary {
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .plain,
      .retry {
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
      }

      .cta {
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        text-decoration: none;
      }

      .primary:disabled,
      .plain:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .note {
        display: grid;
        gap: 8px;
        margin-top: 14px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        justify-items: start;
      }

      .note em {
        font-style: normal;
        font-weight: var(--ac-font-weight-regular, 400);
        color: var(--ac-color-grey-b);
      }

      .error {
        color: var(--ac-color-red-700);
      }

      .error.banner {
        margin: 16px 0 0;
        padding: 12px 16px;
        border-radius: 10px;
        background: var(--ac-color-red-100);
        border: 1px solid var(--ac-color-red-border);
      }

      @media (max-width: 640px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesPage implements OnInit {
  private readonly api = inject(ActivitiesApi);
  private readonly childrenApi = inject(ChildrenApi);

  protected readonly children = signal<readonly ChildOption[]>([]);
  protected readonly loadingChildren = signal(true);
  protected readonly childrenError = signal<string | null>(null);

  protected readonly selectedChildId = signal<string | null>(null);
  protected readonly category = signal('');

  protected readonly activities = signal<readonly ActivityResponse[]>([]);
  protected readonly progress = signal<readonly ActivityProgressResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  protected readonly busyActivityId = signal<string | null>(null);
  protected readonly busyProgressId = signal<string | null>(null);

  /** Note text being edited, keyed by progress id, so drafts survive a re-render. */
  private readonly noteDrafts = signal<Readonly<Record<string, string>>>({});

  protected readonly monthsToLabel = monthsToLabel;

  /**
   * Categories offered in the filter come from what the catalogue actually
   * returned, so the dropdown never offers a category with nothing in it.
   */
  protected readonly categories = computed(() => {
    const unique = new Set(this.activities().map((activity) => activity.category));
    return [...unique].sort();
  });

  protected readonly rows = computed<ActivityRow[]>(() => {
    const byActivityId = new Map(this.progress().map((row) => [row.activityId, row]));
    return this.activities().map((activity) => ({
      activity,
      progress: byActivityId.get(activity.id) ?? null,
    }));
  });

  ngOnInit(): void {
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        const options = children.map((child) => ({
          id: child.id,
          firstName: child.firstName,
        }));
        this.children.set(options);
        this.loadingChildren.set(false);
        if (options.length > 0) {
          this.selectedChildId.set(options[0]!.id);
          this.load();
        }
      },
      error: () => {
        this.loadingChildren.set(false);
        this.childrenError.set('Could not load your children. Please refresh the page.');
      },
    });
  }

  protected selectChild(childId: string): void {
    this.selectedChildId.set(childId);
    this.load();
  }

  protected selectCategory(category: string): void {
    this.category.set(category);
    this.load();
  }

  /**
   * Catalogue and progress are fetched together: a card cannot decide whether to
   * offer "Start" or "Mark as completed" without both.
   */
  protected load(): void {
    const childId = this.selectedChildId();
    if (childId === null) return;

    this.loading.set(true);
    this.error.set(null);
    this.actionError.set(null);

    const filters: { childId: string; category?: string } = { childId };
    if (this.category() !== '') filters.category = this.category();

    this.api.listActivities(filters).subscribe({
      next: (activities) => {
        this.activities.set(activities);
        this.api.listProgress(childId).subscribe({
          next: (progress) => {
            this.progress.set(progress);
            this.loading.set(false);
          },
          error: () => {
            // The catalogue loaded, so show it rather than failing the whole page;
            // cards simply fall back to their "not started" state.
            this.progress.set([]);
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Activities could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  protected start(activity: ActivityResponse): void {
    const childId = this.selectedChildId();
    if (childId === null) return;

    this.actionError.set(null);
    this.busyActivityId.set(activity.id);
    this.api.startActivity(activity.id, childId).subscribe({
      next: (row) => {
        this.upsertProgress(row);
        this.busyActivityId.set(null);
      },
      error: () => {
        this.actionError.set('That activity could not be started.');
        this.busyActivityId.set(null);
      },
    });
  }

  protected setCompleted(row: ActivityProgressResponse, completed: boolean): void {
    this.actionError.set(null);
    this.busyProgressId.set(row.id);
    this.api.updateProgress(row.id, { completed }).subscribe({
      next: (updated) => {
        this.upsertProgress(updated);
        this.busyProgressId.set(null);
      },
      error: () => {
        this.actionError.set('That change could not be saved.');
        this.busyProgressId.set(null);
      },
    });
  }

  protected noteDraft(row: ActivityProgressResponse): string {
    return this.noteDrafts()[row.id] ?? row.parentObservation ?? '';
  }

  protected setNoteDraft(progressId: string, value: string): void {
    this.noteDrafts.update((drafts) => ({ ...drafts, [progressId]: value }));
  }

  protected noteChanged(row: ActivityProgressResponse): boolean {
    const draft = this.noteDrafts()[row.id];
    return draft !== undefined && draft !== (row.parentObservation ?? '');
  }

  protected saveNote(row: ActivityProgressResponse): void {
    const draft = this.noteDrafts()[row.id];
    if (draft === undefined) return;

    this.actionError.set(null);
    this.busyProgressId.set(row.id);
    // An emptied note is sent as null so it clears, rather than storing "".
    this.api
      .updateProgress(row.id, { parentObservation: draft.trim() === '' ? null : draft })
      .subscribe({
        next: (updated) => {
          this.upsertProgress(updated);
          this.noteDrafts.update((drafts) => {
            const next = { ...drafts };
            delete next[row.id];
            return next;
          });
          this.busyProgressId.set(null);
        },
        error: () => {
          this.actionError.set('Your note could not be saved.');
          this.busyProgressId.set(null);
        },
      });
  }

  private upsertProgress(row: ActivityProgressResponse): void {
    this.progress.update((rows) => {
      const index = rows.findIndex((existing) => existing.id === row.id);
      if (index === -1) return [row, ...rows];
      const next = [...rows];
      next[index] = row;
      return next;
    });
  }
}
