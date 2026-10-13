import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  ActivityProgressResponse,
  ActivityResponse,
  ScreeningSessionDetailResponse,
} from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { ActivitiesApi } from './data-access/activities.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { CAMBODIAN_HOME_ACTIVITIES, findCambodianActivity } from './cambodia-activities.data';

interface ChildOption {
  readonly id: string;
  readonly firstName: string;
}

/** An activity paired with this child's progress on it, if any. */
export interface ActivityRow {
  readonly activity: ActivityResponse;
  readonly progress: ActivityProgressResponse | null;
}

export type ActivityStatusFilter = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';

interface StatusOption {
  readonly value: ActivityStatusFilter;
  readonly label: string;
}

interface CategoryOption {
  readonly value: string;
  readonly label: string;
  readonly icon: string;
}

const statusOptions: readonly StatusOption[] = [
  { value: 'ALL', label: 'All (ទាំងអស់)' },
  { value: 'IN_PROGRESS', label: 'In Progress (កំពុងអនុវត្ត)' },
  { value: 'COMPLETED', label: 'Completed (បានបញ្ចប់)' },
  { value: 'NOT_STARTED', label: 'Not Started (មិនទាន់ចាប់ផ្តើម)' },
];

const DEFAULT_CATEGORIES: readonly CategoryOption[] = [
  { value: '', label: 'All Categories (ទាំងអស់)', icon: '🌟' },
  { value: 'Sensory', label: 'Sensory (ញាណដឹង)', icon: '✨' },
  { value: 'Fine Motor', label: 'Fine Motor (ចលករតូច)', icon: '✍️' },
  { value: 'Communication', label: 'Communication (ការប្រាស្រ័យទាក់ទង)', icon: '💬' },
  { value: 'Social', label: 'Social Skills (ទំនាក់ទំនងសង្គម)', icon: '🤝' },
  { value: 'Motor', label: 'Gross Motor (ចលករធំ)', icon: '🏃' },
  { value: 'Daily Living', label: 'Daily Living (ទម្លាប់ប្រចាំថ្ងៃ)', icon: '🧩' },
];

const monthsToLabel = (months: number): string => {
  if (months < 24) return `${months} months`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} years` : `${years}y ${rest}m`;
};

const normalizeDomain = (cat: string): string => cat.toLowerCase().replace(/[^a-z0-9]/g, '');

const matchesDomain = (activityCategory: string, screeningCategory: string): boolean => {
  const a = normalizeDomain(activityCategory);
  const s = normalizeDomain(screeningCategory);
  if (!a || !s) return false;
  if (a === s || a.includes(s) || s.includes(a)) return true;
  if (
    (a.includes('social') && s.includes('social')) ||
    (a.includes('communicat') && s.includes('communicat')) ||
    (a.includes('sensor') && s.includes('sensor')) ||
    (a.includes('motor') && s.includes('motor')) ||
    (a.includes('play') && s.includes('play')) ||
    (a.includes('behavior') && s.includes('behavior'))
  ) {
    return true;
  }
  return false;
};

@Component({
  standalone: true,
  selector: 'ac-activities-page',
  imports: [
    FormsModule,
    RouterLink,
    UiCardComponent,
    UiEmptyStateComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    UiDialogComponent,
  ],
  template: `
    <section class="page-header">
      <div class="header-content">
        <p class="eyebrow">Home &amp; Sensory Support • ការគាំទ្រញាណដឹង និងល្បែងនៅផ្ទះ</p>
        <h1>Activities &amp; Play Library • បណ្ណាល័យសកម្មភាព និងការលេង</h1>
        <p class="intro">
          Developmental home routines and playful exercises matched to your child’s age band and
          screening recommendations (សកម្មភាពលេងអភិវឌ្ឍន៍នៅផ្ទះ
          និងទម្លាប់សម្រួលអារម្មណ៍ដែលសមស្របតាមក្រុមអាយុកុមារ)។
        </p>
      </div>
    </section>

    @if (childrenError(); as problem) {
      <ac-ui-card>
        <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
      </ac-ui-card>
    } @else if (children().length === 0 && !loadingChildren()) {
      <ac-ui-empty-state
        title="Add a child first (សូមបន្ថែមទិន្នន័យកុមារជាមុនសិន)"
        message="Activities are matched to a child’s age, so add a child to your family profile to see suitable ideas (សកម្មភាពត្រូវគ្នានឹងអាយុកុមារ សូមបន្ថែមទិន្នន័យកុមារក្នុងប្រវត្តិរូបគ្រួសារ)។"
      >
        <a class="cta" routerLink="/children">Add a child (បន្ថែមទិន្នន័យកុមារ)</a>
      </ac-ui-empty-state>
    } @else {
      <!-- Filter Toolbar -->
      <ac-ui-card>
        <div class="controls">
          <label class="control">
            <span>Child (កុមារ)</span>
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

          <label class="control search-control">
            <span>Search Activities (ស្វែងរកសកម្មភាព)</span>
            <div class="search-field-wrapper">
              <input
                type="search"
                placeholder="Search activities by keyword (e.g. bubbles, clay, calming, អង្ករ, ស្លឹកចេក)..."
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                name="search"
              />
            </div>
          </label>
        </div>

        <!-- Playful Category Pills Toolbar -->
        <div class="category-pills-row" role="group" aria-label="Filter by developmental category">
          <span class="toolbar-label">Category (ប្រភេទ):</span>
          <div class="category-pills">
            @for (cat of categoryOptions(); track cat.value) {
              <button
                type="button"
                class="category-pill-btn"
                [class.active]="category() === cat.value"
                (click)="selectCategory(cat.value)"
              >
                <span class="cat-icon" aria-hidden="true">{{ cat.icon }}</span>
                <span>{{ cat.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Status & Screening Priority Filter Pills -->
        <div class="filter-pills-row">
          <span class="filter-pills-label">Status (ស្ថានភាព):</span>
          <div class="status-pills" role="group" aria-label="Filter by activity status">
            @for (opt of statusOptions; track opt.value) {
              <button
                type="button"
                class="pill-btn"
                [class.active]="statusFilter() === opt.value"
                (click)="statusFilter.set(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>

          <button
            type="button"
            class="pill-btn pill-btn--recommended"
            [class.active]="onlyRecommended()"
            (click)="onlyRecommended.set(!onlyRecommended())"
            aria-label="Filter activities recommended for child"
          >
            <span class="recommend-star" aria-hidden="true">★</span>
            <span>Recommended for {{ selectedChild()?.firstName || 'Child' }}</span>
          </button>
        </div>
      </ac-ui-card>

      <!-- Summary Statistics Bar -->
      <section class="summary-bar" aria-label="Activity statistics">
        <button
          type="button"
          class="summary-card"
          [class.active]="statusFilter() === 'ALL'"
          (click)="statusFilter.set('ALL')"
        >
          <span class="metric-label">Total Available</span>
          <span class="metric-val">{{ summaryCounts().total }}</span>
        </button>
        <button
          type="button"
          class="summary-card"
          [class.active]="statusFilter() === 'IN_PROGRESS'"
          (click)="statusFilter.set('IN_PROGRESS')"
        >
          <span class="metric-label">In Progress</span>
          <span class="metric-val going">{{ summaryCounts().inProgress }}</span>
        </button>
        <button
          type="button"
          class="summary-card"
          [class.active]="statusFilter() === 'COMPLETED'"
          (click)="statusFilter.set('COMPLETED')"
        >
          <span class="metric-label">Completed</span>
          <span class="metric-val done">{{ summaryCounts().completed }}</span>
        </button>
      </section>

      @if (loading()) {
        <ac-ui-card><ac-ui-spinner label="Loading activities…" /></ac-ui-card>
      } @else if (error(); as problem) {
        <ac-ui-card>
          <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
          <button type="button" class="retry" (click)="load()">Try again</button>
        </ac-ui-card>
      } @else if (activities().length === 0) {
        <ac-ui-empty-state
          title="No activities yet for this age (មិនទាន់មានសកម្មភាពសម្រាប់អាយុនេះ)"
          message="The activity library is still being built. In the meantime, your child’s progress reports and school updates are the best picture of how they are doing."
        >
          <a class="cta" routerLink="/progress">View progress</a>
        </ac-ui-empty-state>
      } @else if (rows().length === 0) {
        <ac-ui-empty-state
          title="No matching activities (មិនមានសកម្មភាពត្រូវគ្នានឹងការស្វែងរក)"
          message="No activities match your current search, category, or status filter."
        >
          <button type="button" class="plain" (click)="resetFilters()">
            Clear filters (សម្អាតការស្វែងរក)
          </button>
        </ac-ui-empty-state>
      } @else {
        @if (actionError(); as problem) {
          <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
        }

        <!-- Activities Grid -->
        <ul class="grid" aria-label="Suggested activities">
          @for (row of rows(); track row.activity.id) {
            <li>
              <ac-ui-card [interactive]="true">
                <article class="activity">
                  <header>
                    <div class="category-badges">
                      <span class="category" [attr.data-domain]="row.activity.category">
                        {{ row.activity.category }}
                      </span>
                      @if (isRecommendedActivity(row.activity)) {
                        <span class="priority-badge">Screening Priority</span>
                      }
                      <span
                        class="difficulty-badge"
                        [attr.data-level]="getDifficulty(row.activity)"
                      >
                        <span class="difficulty-dot"></span>
                        {{ getDifficulty(row.activity) }}
                      </span>
                      <span class="duration-badge">⏱ {{ getDuration(row.activity) }}</span>
                    </div>
                    <span class="ages">
                      {{ monthsToLabel(row.activity.minAgeMonths) }} –
                      {{ monthsToLabel(row.activity.maxAgeMonths) }}
                    </span>
                  </header>

                  <h2 (click)="openActivityDrawer(row)" class="activity-title-link">
                    {{ row.activity.title }}
                  </h2>
                  <p class="summary">{{ row.activity.summary }}</p>

                  <div class="card-footer-actions">
                    <button
                      type="button"
                      class="guide-btn"
                      (click)="openActivityDrawer(row)"
                      aria-label="Open step-by-step activity guide"
                    >
                      <span>Activity Guide &amp; Steps ↗</span>
                    </button>

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
                          <span class="status done">✓ Completed</span>
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
                    }
                  </div>

                  <!-- Quick reflection note preview (collapsible) -->
                  @if (row.progress) {
                    <label class="note">
                      <span>Parent reflection note <em>(only visible to you)</em></span>
                      <textarea
                        rows="2"
                        [ngModel]="noteDraft(row.progress)"
                        (ngModelChange)="setNoteDraft(row.progress.id, $event)"
                        [name]="'note-' + row.progress.id"
                        maxlength="2000"
                        placeholder="កត់ត្រាការសង្កេត៖ ការឆ្លើយតបរបស់កុមារ ការសម្លឹងភ្នែក កាយវិការ ឬចំណុចដែលកុមារចូលចិត្ត… (Log observations: eye contact, gestures, favourite moments…)"
                      ></textarea>
                      <button
                        type="button"
                        class="plain save-note-btn"
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

      <!-- Interactive Activity Guide Modal / Drawer -->
      @if (selectedActivityRow(); as selected) {
        <ac-ui-dialog
          [heading]="selected.activity.title"
          description="Developmental Home Guide &amp; Checklist (ការណែនាំ និងបញ្ជីអនុវត្តនៅផ្ទះ)"
          size="lg"
          (close)="closeActivityDrawer()"
        >
          <div class="activity-modal-body">
            <!-- Modal Meta Tags -->
            <div class="modal-meta-strip">
              <span class="category" [attr.data-domain]="selected.activity.category">
                {{ selected.activity.category }}
              </span>
              @if (isRecommendedActivity(selected.activity)) {
                <span class="priority-badge">Screening Priority</span>
              }
              <span class="difficulty-badge" [attr.data-level]="getDifficulty(selected.activity)">
                <span class="difficulty-dot"></span>
                {{ getDifficulty(selected.activity) }} Difficulty
              </span>
              <span class="duration-badge">⏱ {{ getDuration(selected.activity) }}</span>
              <span class="ages">
                Ages: {{ monthsToLabel(selected.activity.minAgeMonths) }} –
                {{ monthsToLabel(selected.activity.maxAgeMonths) }}
              </span>
            </div>

            @if (isRecommendedActivity(selected.activity)) {
              <div class="recommended-banner">
                <span class="banner-star" aria-hidden="true">★</span>
                <div>
                  <strong
                    >Recommended for
                    {{ selectedChild()?.firstName }} (ណែនាំពិសេសសម្រាប់កុមារ)</strong
                  >
                  <p>
                    ត្រូវគ្នានឹងដែនអភិវឌ្ឍន៍ដែលការវាយតម្លៃបានបង្ហាញថាត្រូវការការគាំទ្របន្ថែម។
                    (Corresponds to developmental domains where elevated screening risk was
                    observed.)
                  </p>
                </div>
              </div>
            }

            <div class="modal-section">
              <h3 class="section-title">Overview &amp; Purpose (ទិដ្ឋភាពទូទៅ និងគោលបំណង)</h3>
              <p class="section-summary">{{ selected.activity.summary }}</p>
            </div>

            <!-- Materials Checklist -->
            <div class="modal-section materials-section">
              <h3 class="section-title">
                <span aria-hidden="true">📦</span>
                Materials Checklist (បញ្ជីសម្ភារចាំបាច់)
              </h3>
              <p class="section-hint">
                Gather these simple home items before beginning
                (រៀបចំសម្ភារសាមញ្ញៗទាំងនេះមុនពេលចាប់ផ្តើម)៖
              </p>
              <div class="materials-list">
                @for (item of getMaterialsList(selected.activity); track item) {
                  <label
                    class="material-item"
                    [class.checked]="isMaterialChecked(selected.activity.id, item)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isMaterialChecked(selected.activity.id, item)"
                      (change)="toggleMaterial(selected.activity.id, item)"
                    />
                    <span class="material-text">{{ item }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Step-by-Step Instructions -->
            <div class="modal-section steps-section">
              <h3 class="section-title">
                <span aria-hidden="true">👣</span>
                Step-by-Step Instructions (ការណែនាំជាជំហានៗ)
              </h3>
              <div class="steps-list">
                @for (step of getStepsList(selected.activity); track step.title; let idx = $index) {
                  <label
                    class="step-card"
                    [class.checked]="isStepChecked(selected.activity.id, idx)"
                  >
                    <input
                      type="checkbox"
                      class="step-checkbox"
                      [checked]="isStepChecked(selected.activity.id, idx)"
                      (change)="toggleStep(selected.activity.id, idx)"
                      [attr.aria-label]="'Mark ' + step.title + ' as complete'"
                    />
                    <div class="step-card-content">
                      <h4 class="step-card-title">{{ step.title }}</h4>
                      <p class="step-card-desc">{{ step.desc }}</p>
                    </div>
                  </label>
                }
              </div>

              <div class="neuro-tip-box">
                <span class="tip-icon" aria-hidden="true">💡</span>
                <p>
                  <strong>Sensory Tip:</strong> គោរពកម្រិតទទួលអារម្មណ៍របស់កុមារ។
                  ប្រសិនបើកុមារបង្ហាញការស្ទាក់ស្ទើរ ឬអស់កម្លាំងពីការភ្ញោច សូមផ្អាកមួយរយៈ
                  ហើយចាប់ផ្តើមឡើងវិញនៅពេលក្រោយ។ ការលេងគួរតែមានភាពសប្បាយរីករាយ ស្ងប់ស្ងាត់
                  និងគ្មានការបង្ខិតបង្ខំ។ (Honor your child's sensory threshold. If they show
                  hesitation or sensory fatigue, pause and resume at another time. Play should
                  always feel fun, calming, and pressure-free.)
                </p>
              </div>
            </div>

            <!-- Completion & Progress Action -->
            <div class="modal-section completion-section">
              <h3 class="section-title">
                Progress &amp; Verification (វឌ្ឍនភាព និងការផ្ទៀងផ្ទាត់)
              </h3>
              <div class="completion-action-box">
                @if (selected.progress === null) {
                  <p class="progress-status-text">
                    Not yet started for {{ selectedChild()?.firstName }} (មិនទាន់បានចាប់ផ្តើមនៅឡើយ)។
                  </p>
                  <button
                    type="button"
                    class="primary start-lg-btn"
                    [disabled]="busyActivityId() === selected.activity.id"
                    (click)="start(selected.activity)"
                  >
                    {{
                      busyActivityId() === selected.activity.id
                        ? 'Starting…'
                        : 'Start This Activity (ចាប់ផ្តើមសកម្មភាពនេះ)'
                    }}
                  </button>
                } @else if (selected.progress.completedAt) {
                  <div class="celebration-banner">
                    <span class="celebration-icon" aria-hidden="true">🎉</span>
                    <div>
                      <strong
                        >Well Done! Completed on
                        {{ formatDate(selected.progress.completedAt) }} (អបអរសាទរ!
                        បានបញ្ចប់)</strong
                      >
                      <p>
                        Great job practicing this developmental routine at home! (ពូកែណាស់!
                        បានអនុវត្តទម្លាប់លេងអភិវឌ្ឍន៍នេះនៅផ្ទះដោយជោគជ័យ។)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="plain"
                    [disabled]="busyProgressId() === selected.progress.id"
                    (click)="setCompleted(selected.progress, false)"
                  >
                    Mark as Not Done (សម្គាល់ថាមិនទាន់រួច)
                  </button>
                } @else {
                  <div class="in-progress-banner">
                    <span class="going-dot" aria-hidden="true"></span>
                    <div>
                      <strong>In Progress (កំពុងអនុវត្ត)</strong>
                      <p>
                        Started on {{ formatDate(selected.progress.startedAt) }}. Ready to finish?
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="primary complete-lg-btn"
                    [disabled]="busyProgressId() === selected.progress.id"
                    (click)="setCompleted(selected.progress, true)"
                  >
                    {{
                      busyProgressId() === selected.progress.id ? 'Saving…' : '✓ Mark as Completed'
                    }}
                  </button>
                }
              </div>
            </div>

            <!-- Parent Reflection Note Input -->
            @if (selected.progress) {
              <div class="modal-section note-section">
                <h3 class="section-title">
                  Parent Reflection &amp; Observations (កំណត់ត្រាសង្កេតរបស់មាតាបិតា)
                </h3>
                <p class="section-hint">
                  កត់ត្រាការឆ្លើយតបរបស់កុមារ ការសម្លឹងភ្នែក កាយវិការ ឬចំណុចដែលកុមារចូលចិត្ត (Log
                  your child's reaction, eye contact, gestures, or favorite moments)៖
                </p>
                <textarea
                  rows="3"
                  class="modal-textarea"
                  [ngModel]="noteDraft(selected.progress)"
                  (ngModelChange)="setNoteDraft(selected.progress.id, $event)"
                  placeholder="កត់ត្រាការសង្កេត៖ ឧ. ចូលចិត្តលេងអង្ករខ្លាំង មានការសម្លឹងភ្នែក និងញញឹមពេលធ្វើកាយវិការតាម… (e.g. Loved feeling the foam, made eye contact and smiled during repetition…)"
                  maxlength="2000"
                ></textarea>
                <div class="note-submit-row">
                  <button
                    type="button"
                    class="primary"
                    [disabled]="
                      !noteChanged(selected.progress) || busyProgressId() === selected.progress.id
                    "
                    (click)="saveNote(selected.progress)"
                  >
                    Save Reflection Note (រក្សាទុកកំណត់ចំណាំ)
                  </button>
                  @if (!noteChanged(selected.progress) && selected.progress.parentObservation) {
                    <span class="note-saved-pill"
                      >✓ បានរក្សាទុកក្នុងទម្រង់កុមារ (Saved to child portfolio)</span
                    >
                  }
                </div>
              </div>
            }
          </div>
        </ac-ui-dialog>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1040px;
        margin: 0 auto;
        padding: 0 8px 48px;
      }

      .page-header {
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0;
        color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.05em;
      }

      h1 {
        margin: 4px 0 8px;
        font-size: var(--ac-type-page-title);
        color: var(--ac-color-text-strong);
      }

      .intro {
        margin: 0;
        max-width: 72ch;
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
        font-size: 13px;
      }

      .search-control {
        flex: 1 1 280px;
      }

      select,
      textarea,
      input[type='search'] {
        min-height: 44px;
        padding: 8px 14px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: var(--ac-radius-md, 12px);
        background: var(--ac-color-surface);
        font: inherit;
        color: var(--ac-color-text-strong);
        transition: border-color var(--ac-motion-fast, 150ms);
      }

      input[type='search']:focus,
      select:focus,
      textarea:focus {
        outline: 2px solid var(--ac-color-action);
        outline-offset: -1px;
        border-color: var(--ac-color-action);
      }

      /* Category Pills Toolbar */
      .category-pills-row {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid var(--ac-color-border-slate);
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .toolbar-label {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        white-space: nowrap;
      }

      .category-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .category-pill-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        padding: 0 14px;
        border-radius: var(--ac-radius-pill, 999px);
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms) ease;
      }

      .category-pill-btn:hover {
        background: var(--ac-color-tint-blue-wash);
        border-color: var(--ac-color-action);
      }

      .category-pill-btn.active {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .cat-icon {
        font-size: 14px;
      }

      /* Status Filter Pills Row */
      .filter-pills-row {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-border-slate);
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .filter-pills-label {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .status-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .pill-btn {
        min-height: 34px;
        padding: 0 14px;
        border-radius: var(--ac-radius-pill, 999px);
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms) ease;
      }

      .pill-btn:hover {
        background: var(--ac-color-tint-blue-wash);
      }

      .pill-btn.active {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .pill-btn--recommended {
        border-color: var(--ac-color-amber-500);
        color: var(--ac-color-amber-800);
        background: var(--ac-color-amber-tint-100);
        margin-left: auto;
      }

      .pill-btn--recommended:hover {
        border-color: var(--ac-color-alert-amber);
        background: var(--ac-color-amber-tint-50);
      }

      .pill-btn--recommended.active {
        background: var(--ac-color-amber-500);
        color: white;
        border-color: var(--ac-color-amber-600);
      }

      .recommend-star {
        margin-right: 4px;
      }

      /* Summary Metrics Strip */
      .summary-bar {
        margin: 16px 0 20px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .summary-card {
        padding: 14px 18px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md, 12px);
        display: flex;
        flex-direction: column;
        gap: 4px;
        text-align: left;
        cursor: pointer;
        font: inherit;
        box-shadow: var(--ac-shadow-xs);
        transition:
          border-color var(--ac-motion-fast, 150ms) ease,
          box-shadow var(--ac-motion-fast, 150ms) ease;
      }

      .summary-card:hover {
        background: var(--ac-color-tint-blue-wash);
        box-shadow: var(--ac-shadow-sm);
      }

      .summary-card.active {
        border-color: var(--ac-color-action);
        outline: 2px solid var(--ac-color-action);
        outline-offset: -2px;
      }

      .metric-label {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .metric-val {
        font-size: 1.5rem;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .metric-val.going {
        color: var(--ac-color-action-deep);
      }

      .metric-val.done {
        color: var(--ac-color-success);
      }

      /* Grid of Activity Cards */
      .grid {
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
        gap: 16px;
      }

      .activity header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }

      .category-badges {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .category {
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill, 999px);
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
      }

      .priority-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        border-radius: var(--ac-radius-pill, 999px);
        font-size: 11px;
        font-weight: 700;
        background: var(--ac-color-amber-tint-100);
        color: var(--ac-color-amber-800);
        border: 1px solid var(--ac-color-amber-500);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .difficulty-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill, 999px);
        font-size: 11px;
        font-weight: 600;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-slate-700);
        border: 1px solid var(--ac-color-border-slate);
      }

      .difficulty-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ac-color-green-500);
      }

      .difficulty-badge[data-level='Moderate'] .difficulty-dot {
        background: var(--ac-color-amber-500);
      }

      .difficulty-badge[data-level='Active'] .difficulty-dot {
        background: var(--ac-color-status-purple);
      }

      .duration-badge {
        font-size: 11px;
        font-weight: 600;
        color: var(--ac-color-slate-600);
        background: var(--ac-color-surface-slate);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .ages {
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: 500;
      }

      .activity-title-link {
        margin: 8px 0 6px;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        cursor: pointer;
        transition: color var(--ac-motion-fast, 150ms);
      }

      .activity-title-link:hover {
        color: var(--ac-color-action);
      }

      .summary {
        margin: 0 0 14px;
        color: var(--ac-color-text);
        line-height: 1.55;
        font-size: 14px;
      }

      .card-footer-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .guide-btn {
        background: transparent;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: var(--ac-radius-md, 10px);
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-action);
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms);
      }

      .guide-btn:hover {
        background: var(--ac-color-tint-blue-wash);
        border-color: var(--ac-color-action);
      }

      .progress-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .status {
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill, 999px);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
      }

      .status.done {
        background: var(--ac-color-green-tint-50);
        color: var(--ac-color-green-700);
      }

      .status.going {
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action);
      }

      .primary,
      .plain,
      .retry,
      .cta {
        min-height: 38px;
        padding: 0 14px;
        border-radius: var(--ac-radius-md, 10px);
        font-weight: var(--ac-font-weight-bold);
        font-size: 13px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all var(--ac-motion-fast, 150ms);
      }

      .primary {
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .primary:hover {
        background: var(--ac-color-action-deep);
      }

      .plain,
      .retry {
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
      }

      .plain:hover,
      .retry:hover {
        background: var(--ac-color-tint-blue-wash);
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
        gap: 6px;
        margin-top: 12px;
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

      .note textarea {
        width: 100%;
        box-sizing: border-box;
      }

      .save-note-btn {
        margin-top: 4px;
      }

      /* Activity Guide Modal Styles */
      .activity-modal-body {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 8px 0;
      }

      .modal-meta-strip {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .recommended-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--ac-radius-md, 12px);
        background: var(--ac-color-amber-tint-100);
        border: 1px solid var(--ac-color-amber-500);
        color: var(--ac-color-amber-800);
      }

      .recommended-banner p {
        margin: 2px 0 0;
        font-size: 13px;
      }

      .banner-star {
        font-size: 18px;
        line-height: 1;
      }

      .modal-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .section-title {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .section-summary {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--ac-color-text-body);
      }

      .section-hint {
        margin: 0;
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      /* Materials Checklist */
      .materials-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 8px;
        margin-top: 4px;
      }

      .material-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: var(--ac-radius-sm, 8px);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        cursor: pointer;
        font-size: 13px;
        transition: all var(--ac-motion-fast, 150ms);
      }

      .material-item:hover {
        background: var(--ac-color-tint-blue-wash);
      }

      .material-item.checked {
        background: var(--ac-color-green-tint-50);
        border-color: var(--ac-color-green-border-soft);
      }

      .material-item.checked .material-text {
        text-decoration: line-through;
        color: var(--ac-color-text-muted);
      }

      /* Step Cards */
      .steps-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 4px;
      }

      .step-card {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--ac-radius-md, 12px);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-left: 4px solid var(--ac-color-action);
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms);
      }

      .step-card:hover {
        background: var(--ac-color-tint-blue-wash);
      }

      .step-card.checked {
        border-left-color: var(--ac-color-green-600);
        background: var(--ac-color-green-tint-50);
        border-color: var(--ac-color-green-border-soft);
      }

      .step-card.checked .step-card-title {
        text-decoration: line-through;
        color: var(--ac-color-text-muted);
      }

      .step-checkbox {
        margin-top: 3px;
        width: 18px;
        height: 18px;
        accent-color: var(--ac-color-action);
        cursor: pointer;
        flex-shrink: 0;
      }

      .step-card-content {
        flex: 1;
      }

      .step-card-title {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .step-card-desc {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      .neuro-tip-box {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 14px;
        border-radius: var(--ac-radius-md, 12px);
        background: var(--ac-color-tint-blue-mist);
        border: 1px solid var(--ac-color-border-slate);
        font-size: 13px;
        line-height: 1.5;
        color: var(--ac-color-text-strong);
        margin-top: 6px;
      }

      .tip-icon {
        font-size: 16px;
      }

      .neuro-tip-box p {
        margin: 0;
      }

      /* Completion & Action Box */
      .completion-action-box {
        padding: 14px 18px;
        border-radius: var(--ac-radius-md, 12px);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .progress-status-text {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .start-lg-btn,
      .complete-lg-btn {
        min-height: 42px;
        padding: 0 20px;
        font-size: 14px;
      }

      .celebration-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--ac-radius-md, 12px);
        background: var(--ac-color-green-tint-50);
        border: 1px solid var(--ac-color-green-border-soft);
        color: var(--ac-color-green-700);
        animation: celebrationBounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
      }

      .celebration-banner::after {
        content: '✨';
        position: absolute;
        right: 14px;
        top: 10px;
        font-size: 18px;
        animation: celebrationSparkle 1.4s infinite ease-in-out;
      }

      .celebration-icon {
        font-size: 28px;
        line-height: 1;
        display: inline-block;
        animation: celebrationPop 800ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes celebrationSparkle {
        0%,
        100% {
          transform: scale(0.8) rotate(-10deg);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.2) rotate(10deg);
          opacity: 1;
        }
      }

      @keyframes celebrationBounce {
        0% {
          transform: scale(0.92);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.02);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes celebrationPop {
        0% {
          transform: scale(0.5) rotate(-15deg);
        }
        60% {
          transform: scale(1.25) rotate(10deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }

      .celebration-banner p {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .in-progress-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--ac-color-action);
      }

      .going-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      .in-progress-banner p {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .modal-textarea {
        width: 100%;
        box-sizing: border-box;
      }

      .note-submit-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .note-saved-pill {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-green-700);
      }

      @media (max-width: 640px) {
        .grid {
          grid-template-columns: 1fr;
        }

        .pill-btn--recommended {
          margin-left: 0;
        }

        .completion-action-box {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesPage implements OnInit {
  private readonly api = inject(ActivitiesApi);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly children = signal<readonly ChildOption[]>([]);
  protected readonly loadingChildren = signal(true);
  protected readonly childrenError = signal<string | null>(null);

  protected readonly selectedChildId = signal<string | null>(null);
  protected readonly category = signal('');
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<ActivityStatusFilter>('ALL');
  protected readonly statusOptions = statusOptions;

  protected readonly latestScreeningSession = signal<ScreeningSessionDetailResponse | null>(null);
  protected readonly onlyRecommended = signal(false);

  protected readonly activities = signal<readonly ActivityResponse[]>([]);
  protected readonly progress = signal<readonly ActivityProgressResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  protected readonly busyActivityId = signal<string | null>(null);
  protected readonly busyProgressId = signal<string | null>(null);

  /** Active activity row displayed in the modal / drawer */
  protected readonly selectedActivityRow = signal<ActivityRow | null>(null);

  /** Materials checked by activityId and item string */
  protected readonly checkedMaterials = signal<Record<string, Record<string, boolean>>>({});

  /** Steps checked by activityId and step index */
  protected readonly checkedSteps = signal<Record<string, Record<number, boolean>>>({});

  /** Note text being edited, keyed by progress id, so drafts survive a re-render. */
  private readonly noteDrafts = signal<Readonly<Record<string, string>>>({});

  protected readonly monthsToLabel = monthsToLabel;

  protected readonly selectedChild = computed(() => {
    const id = this.selectedChildId();
    return this.children().find((c) => c.id === id) ?? null;
  });

  protected readonly elevatedScreeningDomains = computed<string[]>(() => {
    const session = this.latestScreeningSession();
    const res = session?.result;
    if (!res) return [];

    if (res.categoryBreakdown && res.categoryBreakdown.length > 0) {
      const elevated = res.categoryBreakdown
        .filter((c) => c.riskLevel === 'MODERATE' || c.riskLevel === 'HIGH')
        .map((c) => c.category);
      if (elevated.length > 0) return elevated;
    }

    if (res.riskLevel === 'MODERATE' || res.riskLevel === 'HIGH') {
      return ['Communication', 'Social Interaction'];
    }

    return [];
  });

  protected isRecommendedActivity(activity: ActivityResponse): boolean {
    const domains = this.elevatedScreeningDomains();
    if (domains.length === 0) return false;
    return domains.some((domain) => matchesDomain(activity.category, domain));
  }

  /**
   * Categories offered in the filter come from what the catalogue actually
   * returned, merged with standard categories.
   */
  protected readonly categories = computed(() => {
    const unique = new Set(this.activities().map((activity) => activity.category));
    return [...unique].sort();
  });

  protected readonly categoryOptions = computed<CategoryOption[]>(() => {
    const known = DEFAULT_CATEGORIES;
    const dynamic = this.categories();
    const result: CategoryOption[] = [...known];
    for (const name of dynamic) {
      if (!result.some((c) => c.value.toLowerCase() === name.toLowerCase())) {
        result.push({ value: name, label: name, icon: '🎯' });
      }
    }
    return result;
  });

  protected readonly summaryCounts = computed(() => {
    const all = this.activities();
    const prog = this.progress();
    const byActivityId = new Map(prog.map((p) => [p.activityId, p]));

    let inProgress = 0;
    let completed = 0;

    for (const act of all) {
      const p = byActivityId.get(act.id);
      if (p?.completedAt) {
        completed++;
      } else if (p) {
        inProgress++;
      }
    }

    return {
      total: all.length,
      inProgress,
      completed,
    };
  });

  protected readonly rows = computed<ActivityRow[]>(() => {
    const byActivityId = new Map(this.progress().map((row) => [row.activityId, row]));
    const status = this.statusFilter();
    const query = this.searchQuery().trim().toLowerCase();
    const recOnly = this.onlyRecommended();

    return this.activities()
      .map((activity) => ({
        activity,
        progress: byActivityId.get(activity.id) ?? null,
      }))
      .filter((row) => {
        if (recOnly && !this.isRecommendedActivity(row.activity)) {
          return false;
        }

        if (status === 'IN_PROGRESS') {
          if (!row.progress || row.progress.completedAt) return false;
        } else if (status === 'COMPLETED') {
          if (!row.progress?.completedAt) return false;
        } else if (status === 'NOT_STARTED') {
          if (row.progress !== null) return false;
        }

        if (query) {
          const title = row.activity.title.toLowerCase();
          const summary = row.activity.summary.toLowerCase();
          const category = row.activity.category.toLowerCase();
          if (!title.includes(query) && !summary.includes(query) && !category.includes(query)) {
            return false;
          }
        }

        return true;
      });
  });

  getDifficulty(activity: ActivityResponse): 'Gentle' | 'Moderate' | 'Active' {
    const title = activity.title.toLowerCase();
    const cat = activity.category.toLowerCase();
    if (
      cat.includes('motor') ||
      title.includes('jump') ||
      title.includes('climb') ||
      title.includes('obstacle') ||
      title.includes('run')
    ) {
      return 'Active';
    }
    if (
      cat.includes('social') ||
      title.includes('rhythm') ||
      title.includes('turn') ||
      title.includes('exchange')
    ) {
      return 'Moderate';
    }
    return 'Gentle';
  }

  getDuration(activity: ActivityResponse): string {
    const title = activity.title.toLowerCase();
    if (title.includes('quick') || title.includes('card') || title.includes('mirror')) {
      return '15m';
    }
    if (title.includes('clapping') || title.includes('turn') || title.includes('song')) {
      return '20m';
    }
    if (title.includes('sensory') || title.includes('bubble') || title.includes('water')) {
      return '30m';
    }
    return '25m';
  }

  getMaterialsList(activity: ActivityResponse): string[] {
    const cambodian = findCambodianActivity(activity);
    if (cambodian) {
      return [...cambodian.materialsBilingual];
    }
    const title = activity.title.toLowerCase();
    const cat = activity.category.toLowerCase();
    if (title.includes('bubble') || cat.includes('sensory')) {
      return [
        'Non-toxic sensory bubbles or gentle tactile foam',
        'Large shallow sensory tray or basin',
        'Soft towel for tactile drying',
        'Comfortable observation mat',
      ];
    }
    if (title.includes('picture') || title.includes('card') || cat.includes('communication')) {
      return [
        'Visual choice or picture exchange cards',
        'Clean table surface at child eye level',
        'Favorite motivator or reward toy',
        'Visual turn indicator card',
      ];
    }
    if (title.includes('rhythm') || title.includes('clapping') || cat.includes('social')) {
      return [
        'Pair of soft shakers or clapping hands',
        'Seating cushions for comfortable turn taking',
        'Calm background melody or rhythm metronome',
        'Visual "My Turn / Your Turn" token',
      ];
    }
    if (cat.includes('motor')) {
      return [
        'Soft balance cushions or stepping stones',
        'Lightweight ball or toss beanbag',
        'Open carpeted floor area free of obstacles',
        'Supportive encouragement stickers',
      ];
    }
    return [
      'Everyday household items (cups, spoons, or blocks)',
      'Comfortable, distraction-free play space',
      'Positive praise gestures or token chart',
      'Sensory soothing toy for rest intervals',
    ];
  }

  getStepsList(activity: ActivityResponse): Array<{ title: string; desc: string }> {
    const cambodian = findCambodianActivity(activity);
    if (cambodian) {
      return cambodian.steps.map((s) => ({
        title: s.bilingualTitle,
        desc: s.bilingualDesc,
      }));
    }
    return [
      {
        title: '1. Prepare Sensory Environment',
        desc: 'Set up a calm, well-lit space free from sudden auditory distractions so your child feels secure.',
      },
      {
        title: '2. Model & Gentle Invitation',
        desc: 'Demonstrate the play motion yourself with a friendly smile, pairing the action with a clear simple phrase.',
      },
      {
        title: '3. Child-Led Exploration',
        desc: 'Let your child inspect, touch, and participate at their own natural pace without hand-over-hand forcing.',
      },
      {
        title: '4. Celebrate Small Wins',
        desc: 'Affirm every micro-attempt with gentle clapping, verbal praise, or their favourite soothing rhythm.',
      },
    ];
  }

  openActivityDrawer(row: ActivityRow): void {
    this.selectedActivityRow.set(row);
  }

  closeActivityDrawer(): void {
    this.selectedActivityRow.set(null);
  }

  isMaterialChecked(activityId: string, item: string): boolean {
    return this.checkedMaterials()[activityId]?.[item] ?? false;
  }

  toggleMaterial(activityId: string, item: string): void {
    this.checkedMaterials.update((map) => {
      const actMap = { ...(map[activityId] || {}) };
      actMap[item] = !actMap[item];
      return { ...map, [activityId]: actMap };
    });
  }

  isStepChecked(activityId: string, stepIndex: number): boolean {
    return this.checkedSteps()[activityId]?.[stepIndex] ?? false;
  }

  toggleStep(activityId: string, stepIndex: number): void {
    this.checkedSteps.update((map) => {
      const actMap = { ...(map[activityId] || {}) };
      actMap[stepIndex] = !actMap[stepIndex];
      return { ...map, [activityId]: actMap };
    });
  }

  ngOnInit(): void {
    const requestedChildId = this.route.snapshot.queryParamMap.get('childId');
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        const options = children.map((child) => ({
          id: child.id,
          firstName: child.firstName,
        }));
        this.children.set(options);
        this.loadingChildren.set(false);
        const match = requestedChildId ? options.find((c) => c.id === requestedChildId) : undefined;
        const target = match ?? options[0];
        if (target) {
          this.selectedChildId.set(target.id);
          this.load();
        }
      },
      error: () => {
        this.loadingChildren.set(false);
        this.childrenError.set('Could not load your children. Please refresh the page.');
      },
    });

    this.route.queryParamMap.subscribe((params) => {
      const childId = params.get('childId');
      if (childId && childId !== this.selectedChildId()) {
        const found = this.children().find((c) => c.id === childId);
        if (found) {
          this.selectChild(found.id);
        }
      }
    });
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('ALL');
    this.category.set('');
    this.onlyRecommended.set(false);
    this.load();
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
        const effectiveActivities =
          activities && activities.length > 0
            ? activities
            : CAMBODIAN_HOME_ACTIVITIES.filter((a) => {
                if (!filters.category) return true;
                return a.category.toLowerCase() === filters.category.toLowerCase();
              });
        this.activities.set(effectiveActivities);
        this.api.listProgress(childId).subscribe({
          next: (progress) => {
            this.progress.set(progress);
            this.syncSelectedDrawerProgress(progress);
            this.loading.set(false);
          },
          error: () => {
            this.progress.set([]);
            this.loading.set(false);
          },
        });
      },
      error: () => {
        const fallback = CAMBODIAN_HOME_ACTIVITIES.filter((a) => {
          if (!filters.category) return true;
          return a.category.toLowerCase() === filters.category.toLowerCase();
        });
        if (fallback.length > 0) {
          this.activities.set(fallback);
          this.loading.set(false);
        } else {
          this.error.set('Activities could not be loaded.');
          this.loading.set(false);
        }
      },
    });

    this.screeningApi.listSessions(childId).subscribe({
      next: (sessions) => {
        const completed = sessions.filter((s) => s.result !== null);
        this.latestScreeningSession.set(completed[0] ?? null);
      },
      error: () => {
        this.latestScreeningSession.set(null);
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

    const active = this.selectedActivityRow();
    if (active && active.activity.id === row.activityId) {
      this.selectedActivityRow.set({
        activity: active.activity,
        progress: row,
      });
    }
  }

  private syncSelectedDrawerProgress(progressList: readonly ActivityProgressResponse[]): void {
    const active = this.selectedActivityRow();
    if (!active) return;
    const found = progressList.find((p) => p.activityId === active.activity.id);
    this.selectedActivityRow.set({
      activity: active.activity,
      progress: found ?? null,
    });
  }

  protected formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
      ? dateStr
      : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  }
}
