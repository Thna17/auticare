import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { ObservationCategory, ObservationResponse, ChildResponse } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { ObservationsApi } from './data-access/observations.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

// Kept local rather than imported: a value import from @auticare/contracts pulls
// zod into the browser bundle, and the web app does not depend on zod. The
// Record type makes the compiler flag a category added to the contract but not here.
const CATEGORIES: Record<ObservationCategory, true> = {
  COMMUNICATION: true,
  SENSORY: true,
  SOCIAL: true,
  EMOTIONAL: true,
  SLEEP: true,
  EATING: true,
  ROUTINE: true,
  CRYING: true,
  OTHER: true,
};
const observationCategories = Object.keys(CATEGORIES) as ObservationCategory[];

type HistoryView = 'daily' | 'weekly' | 'monthly';

const COPY = {
  en: {
    eyebrow: 'Observations',
    title: 'What you noticed',
    subtitle:
      'A short record of day-to-day events to help notice patterns. Not clinical or diagnostic, and never good or bad.',
    record: 'Record observation',
    cancel: 'Cancel',
    save: 'Save observation',
    saving: 'Saving…',
    all: 'All',
    empty: 'Nothing recorded yet',
    emptyBody:
      'Record the first thing you notice, even something small. Patterns come from ordinary days.',
    loadError: 'Your observations could not be loaded.',
    saveError: 'This observation could not be saved.',
    deleteError: 'This observation could not be deleted.',
    confirmDelete: 'Delete this observation?',
    delete: 'Delete',
    selectChild: 'Child',
    whenLabel: 'When',
    categoryLabel: 'Category',
    intensityLabel: 'Intensity',
    noteLabel: 'Observation (what happened)',
    notePlaceholder: 'e.g. Covered ears during music class and sat in corner.',
    triggerLabel: 'Possible trigger (optional)',
    triggerPlaceholder: 'e.g. Loud bell rang unexpectedly.',
    durationLabel: 'Duration in minutes (optional)',
    responseLabel: 'Parent response (optional)',
    responsePlaceholder: 'e.g. Offered noise-canceling headphones and quiet corner.',
    outcomeLabel: 'Outcome (optional)',
    outcomePlaceholder: 'e.g. Calmed down after 5 minutes and rejoined.',
    mild: 'Mild',
    severe: 'Severe',
    today: 'Today',
    yesterday: 'Yesterday',
    noChild: 'Add a child before recording an observation.',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    trends: 'Pattern trends',
    noTrends: 'No observations recorded in this period.',
    calendar: 'Month calendar',
    clearDateFilter: 'Show all dates',
    showingDate: 'Showing records for',
    historyView: 'History view',
    calendarRegion: 'Observation calendar',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    filterRegion: 'Filter by category',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    intensityOf: (level: number) => `Intensity ${level} of 5`,
    categories: {
      COMMUNICATION: 'Communication',
      SENSORY: 'Sensory',
      SOCIAL: 'Social',
      EMOTIONAL: 'Emotional',
      SLEEP: 'Sleep',
      EATING: 'Eating',
      ROUTINE: 'Routine',
      CRYING: 'Crying',
      OTHER: 'Other',
    },
  },
  km: {
    eyebrow: 'ការសង្កេត',
    title: 'អ្វីដែលអ្នកបានកត់សម្គាល់',
    subtitle:
      'កំណត់ត្រាខ្លីៗប្រចាំថ្ងៃ ដើម្បីជួយកត់សម្គាល់លំនាំ។ មិនមែនជាការវិនិច្ឆ័យរោគទេ ហើយគ្មានអាកប្បកិរិយាល្អឬអាក្រក់ឡើយ។',
    record: 'កត់ត្រាការសង្កេត',
    cancel: 'បោះបង់',
    save: 'រក្សាទុក',
    saving: 'កំពុងរក្សាទុក…',
    all: 'ទាំងអស់',
    empty: 'មិនទាន់មានកំណត់ត្រាទេ',
    emptyBody: 'កត់ត្រាអ្វីដំបូងដែលអ្នកកត់សម្គាល់ ទោះបីជារឿងតូចតាច។ លំនាំកើតចេញពីថ្ងៃធម្មតា។',
    loadError: 'មិនអាចទាញយកកំណត់ត្រាបានទេ។',
    saveError: 'មិនអាចរក្សាទុកកំណត់ត្រានេះបានទេ។',
    deleteError: 'មិនអាចលុបកំណត់ត្រានេះបានទេ។',
    confirmDelete: 'លុបការសង្កេតនេះ?',
    delete: 'លុប',
    selectChild: 'កូន',
    whenLabel: 'ពេលវេលា',
    categoryLabel: 'ប្រភេទ',
    intensityLabel: 'កម្រិត',
    noteLabel: 'ការសង្កេត (អ្វីដែលបានកើតឡើង)',
    notePlaceholder: 'ឧ. ខ្ទប់ត្រចៀកពេលម៉ោងតន្ត្រី ហើយទៅអង្គុយនៅជ្រុង។',
    triggerLabel: 'កត្តាជម្រុញដែលអាចកើតមាន (ជម្រើស)',
    triggerPlaceholder: 'ឧ. សំឡេងកណ្ដឹងរោទ៍ខ្លាំងភ្លាមៗ។',
    durationLabel: 'រយៈពេលគិតជានាទី (ជម្រើស)',
    responseLabel: 'ការឆ្លើយតបរបស់ឪពុកម្តាយ (ជម្រើស)',
    responsePlaceholder: 'ឧ. ផ្តល់កាសទប់សំឡេង និងនាំទៅកន្លែងស្ងាត់។',
    outcomeLabel: 'លទ្ធផល (ជម្រើស)',
    outcomePlaceholder: 'ឧ. ស្ងប់ចិត្តវិញបន្ទាប់ពី ៥ នាទី ហើយចូលរួមវិញ។',
    mild: 'ស្រាល',
    severe: 'ខ្លាំង',
    today: 'ថ្ងៃនេះ',
    yesterday: 'ម្សិលមិញ',
    noChild: 'សូមបន្ថែមប្រវត្តិរូបកូនមុនពេលកត់ត្រា។',
    daily: 'ប្រចាំថ្ងៃ',
    weekly: 'ប្រចាំសប្តាហ៍',
    monthly: 'ប្រចាំខែ',
    trends: 'និន្នាការលំនាំ',
    noTrends: 'គ្មានកំណត់ត្រាក្នុងកំឡុងពេលនេះទេ។',
    calendar: 'ប្រតិទិនប្រចាំខែ',
    clearDateFilter: 'បង្ហាញកាលបរិច្ឆេទទាំងអស់',
    showingDate: 'បង្ហាញកំណត់ត្រាសម្រាប់ថ្ងៃ',
    historyView: 'របៀបមើលប្រវត្តិ',
    calendarRegion: 'ប្រតិទិនការសង្កេត',
    prevMonth: 'ខែមុន',
    nextMonth: 'ខែបន្ទាប់',
    filterRegion: 'ច្រោះតាមប្រភេទ',
    weekdays: ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'],
    intensityOf: (level: number) => `កម្រិត ${level} ក្នុងចំណោម ៥`,
    categories: {
      COMMUNICATION: 'ការប្រាស្រ័យទាក់ទង',
      SENSORY: 'អារម្មណ៍វិញ្ញាណ',
      SOCIAL: 'ទំនាក់ទំនងសង្គម',
      EMOTIONAL: 'អារម្មណ៍ផ្លូវចិត្ត',
      SLEEP: 'ការគេង',
      EATING: 'ការទទួលទាន',
      ROUTINE: 'ទម្លាប់ប្រចាំថ្ងៃ',
      CRYING: 'ការយំ',
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
      <div class="head-actions">
        @if (children().length > 1) {
          <label class="child-picker">
            <span>{{ copy().selectChild }}:</span>
            <select [value]="selectedChildId()" (change)="onChildChange($event)">
              @for (c of children(); track c.id) {
                <option [value]="c.id">{{ c.firstName }}</option>
              }
            </select>
          </label>
        }
        <button type="button" class="primary" (click)="openForm()" [disabled]="!child()">
          {{ copy().record }}
        </button>
      </div>
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
                [attr.aria-label]="copy().intensityOf(level)"
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

        <label class="field">
          <span>{{ copy().triggerLabel }}</span>
          <input
            type="text"
            maxlength="2000"
            [placeholder]="copy().triggerPlaceholder"
            [value]="draftTrigger()"
            (input)="onTrigger($event)"
          />
        </label>

        <label class="field">
          <span>{{ copy().durationLabel }}</span>
          <input
            type="number"
            min="0"
            max="1440"
            placeholder="0"
            [value]="draftDurationMinutes() ?? ''"
            (input)="onDuration($event)"
          />
        </label>

        <label class="field">
          <span>{{ copy().responseLabel }}</span>
          <input
            type="text"
            maxlength="2000"
            [placeholder]="copy().responsePlaceholder"
            [value]="draftParentResponse()"
            (input)="onResponse($event)"
          />
        </label>

        <label class="field">
          <span>{{ copy().outcomeLabel }}</span>
          <input
            type="text"
            maxlength="2000"
            [placeholder]="copy().outcomePlaceholder"
            [value]="draftOutcome()"
            (input)="onOutcome($event)"
          />
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

    <!-- Trends and Analytics Section -->
    @if (observations().length > 0) {
      <div class="views-bar">
        <div class="view-toggles" role="group" [attr.aria-label]="copy().historyView">
          <button
            type="button"
            class="view-btn"
            [class.active]="viewMode() === 'daily'"
            (click)="setViewMode('daily')"
          >
            {{ copy().daily }}
          </button>
          <button
            type="button"
            class="view-btn"
            [class.active]="viewMode() === 'weekly'"
            (click)="setViewMode('weekly')"
          >
            {{ copy().weekly }}
          </button>
          <button
            type="button"
            class="view-btn"
            [class.active]="viewMode() === 'monthly'"
            (click)="setViewMode('monthly')"
          >
            {{ copy().monthly }}
          </button>
        </div>

        <button
          type="button"
          class="calendar-toggle-btn"
          [class.active]="showCalendar()"
          (click)="showCalendar.set(!showCalendar())"
        >
          {{ copy().calendar }}
        </button>
      </div>

      <!-- Month Calendar View -->
      @if (showCalendar()) {
        <section class="calendar-card" [attr.aria-label]="copy().calendarRegion">
          <div class="calendar-header">
            <h3>{{ calendarTitle() }}</h3>
            <div class="cal-nav">
              <button
                type="button"
                class="icon-btn"
                (click)="prevMonth()"
                [attr.aria-label]="copy().prevMonth"
              >
                ‹
              </button>
              <button
                type="button"
                class="icon-btn"
                (click)="nextMonth()"
                [attr.aria-label]="copy().nextMonth"
              >
                ›
              </button>
            </div>
          </div>
          <div class="calendar-grid">
            @for (day of copy().weekdays; track $index) {
              <div class="cal-day-name">{{ day }}</div>
            }
            @for (cell of calendarDays(); track cell.key) {
              <button
                type="button"
                class="cal-day-cell"
                [class.empty-cell]="cell.empty"
                [class.has-records]="cell.hasRecords"
                [class.selected-day]="selectedDate() === cell.dateStr"
                [disabled]="cell.empty"
                (click)="onSelectCalendarDate(cell.dateStr)"
              >
                @if (!cell.empty) {
                  <span class="day-num">{{ cell.dayNum }}</span>
                  @if (cell.hasRecords) {
                    <span class="cal-dot" aria-hidden="true"></span>
                  }
                }
              </button>
            }
          </div>
          @if (selectedDate()) {
            <div class="cal-selected-notice">
              <span
                >{{ copy().showingDate }}: <strong>{{ selectedDate() }}</strong></span
              >
              <button type="button" class="ghost-sm" (click)="clearSelectedDate()">
                {{ copy().clearDateFilter }}
              </button>
            </div>
          }
        </section>
      }

      <!-- Category Trends Bar Chart -->
      <section class="trends-card" [attr.aria-label]="copy().trends">
        <h3>{{ copy().trends }}</h3>
        @if (trendsData().length === 0) {
          <p class="subtitle">{{ copy().noTrends }}</p>
        } @else {
          <div class="trends-list">
            @for (t of trendsData(); track t.category) {
              <div class="trend-item">
                <div class="trend-label">
                  <span class="trend-name">{{ copy().categories[t.category] }}</span>
                  <span class="trend-count">{{ t.count }}</span>
                </div>
                <div class="trend-bar-track">
                  <div
                    class="trend-bar-fill"
                    [style.width.%]="t.percent"
                    [class]="'fill-' + t.category.toLowerCase()"
                  ></div>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- Category Filter Chips -->
      <div class="filters" role="group" [attr.aria-label]="copy().filterRegion">
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
              @if (item.trigger) {
                <p class="entry-meta">
                  <strong>{{ copy().triggerLabel }}:</strong> {{ item.trigger }}
                </p>
              }
              @if (item.durationMinutes !== null && item.durationMinutes !== undefined) {
                <p class="entry-meta">
                  <strong>{{ copy().durationLabel }}:</strong> {{ item.durationMinutes }}m
                </p>
              }
              @if (item.parentResponse) {
                <p class="entry-meta">
                  <strong>{{ copy().responseLabel }}:</strong> {{ item.parentResponse }}
                </p>
              }
              @if (item.outcome) {
                <p class="entry-meta">
                  <strong>{{ copy().outcomeLabel }}:</strong> {{ item.outcome }}
                </p>
              }
              <div
                class="intensity"
                role="img"
                [attr.aria-label]="copy().intensityOf(item.intensity)"
              >
                @for (level of intensityLevels; track level) {
                  <span class="pip" [class.on]="level <= item.intensity"></span>
                }
              </div>
            </div>
            @if (pendingDelete() === item.id) {
              <div class="confirm-del">
                <span>{{ copy().confirmDelete }}</span>
                <button
                  type="button"
                  class="del-btn"
                  (click)="remove(item)"
                  [attr.aria-label]="copy().delete"
                >
                  {{ copy().delete }}
                </button>
                <button type="button" class="ghost-sm" (click)="pendingDelete.set(null)">
                  {{ copy().cancel }}
                </button>
              </div>
            } @else {
              <button type="button" class="ghost-sm" (click)="pendingDelete.set(item.id)">
                {{ copy().delete }}
              </button>
            }
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      /* Header, buttons and panels follow the Children page so the portal reads as one. */
      :host {
        display: block;
        padding-bottom: 48px;
      }

      .page-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }

      .page-head > div:first-child {
        max-width: 680px;
      }

      .head-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .child-picker {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .child-picker select {
        min-height: 44px;
        padding: 0 12px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: var(--ac-color-action-mid);
        font-size: var(--ac-type-meta);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      h1 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: 700;
      }

      .subtitle {
        margin: 10px 0 0;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      .primary,
      .ghost {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 20px;
        border-radius: var(--ac-radius-md);
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .primary {
        border: 1px solid var(--ac-color-action);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .primary:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
      }

      .primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ghost {
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate);
      }

      .ghost:hover:not(:disabled) {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      .ghost-sm {
        padding: 4px 10px;
        border-radius: var(--ac-radius-sm);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: var(--ac-type-meta);
        font-weight: 600;
        cursor: pointer;
      }

      .ghost-sm:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      button:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .del-btn {
        padding: 4px 10px;
        border-radius: var(--ac-radius-sm);
        border: 1px solid var(--ac-color-alert-strong);
        background: var(--ac-color-surface);
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
        font-weight: 600;
        cursor: pointer;
      }

      .sheet {
        margin: 24px 0;
        padding: 24px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-sm);
      }

      .sheet h2 {
        margin: 0 0 16px;
        font-size: 20px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .group {
        margin: 0 0 18px;
        padding: 0;
        border: none;
      }

      .group legend {
        padding: 0;
        margin-bottom: 8px;
        font-size: var(--ac-type-meta);
        font-weight: 600;
        color: var(--ac-color-text-muted);
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip {
        padding: 6px 14px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .chip.selected {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action);
      }

      .scale {
        display: flex;
        gap: 8px;
      }

      .level {
        flex: 1;
        padding: 10px 0;
        border-radius: var(--ac-radius-sm);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .level.selected {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action);
      }

      .scale-legend {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
      }

      .field span {
        font-size: var(--ac-type-meta);
        font-weight: 600;
        color: var(--ac-color-text-muted);
      }

      .field input,
      .field textarea {
        padding: 10px 14px;
        border-radius: var(--ac-radius-sm);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        font: inherit;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;
      }

      .views-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin: 20px 0;
      }

      .view-toggles {
        display: flex;
        background: var(--ac-color-surface-slate);
        padding: 4px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
      }

      .view-btn {
        padding: 6px 14px;
        border-radius: var(--ac-radius-pill);
        border: none;
        background: transparent;
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .view-btn.active {
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        box-shadow: var(--ac-shadow-sm);
      }

      .calendar-toggle-btn {
        padding: 6px 14px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 13px;
        cursor: pointer;
      }

      .calendar-toggle-btn.active {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action);
      }

      .calendar-card {
        margin-bottom: 24px;
        padding: 20px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
      }

      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .calendar-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        text-align: center;
      }

      .cal-day-name {
        font-size: 11px;
        font-weight: 700;
        color: var(--ac-color-text-muted);
        padding: 4px 0;
      }

      .cal-day-cell {
        position: relative;
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: var(--ac-radius-sm);
        border: 1px solid transparent;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 13px;
        cursor: pointer;
      }

      .cal-day-cell.empty-cell {
        background: transparent;
        cursor: default;
      }

      .cal-day-cell.selected-day {
        border-color: var(--ac-color-action);
        background: color-mix(in srgb, var(--ac-color-action) 15%, var(--ac-color-surface-slate));
      }

      .cal-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ac-color-action);
        position: absolute;
        bottom: 4px;
      }

      .cal-selected-notice {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid var(--ac-color-border);
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .trends-card {
        margin-bottom: 24px;
        padding: 20px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
      }

      .trends-card h3 {
        margin: 0 0 14px;
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .trends-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .trend-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .trend-label {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .trend-count {
        color: var(--ac-color-text-muted);
      }

      .trend-bar-track {
        height: 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        overflow: hidden;
      }

      .trend-bar-fill {
        height: 100%;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action);
        transition: width 0.3s ease;
      }

      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 20px;
      }

      /* One panel with dividers rather than a separate card per entry. */
      .list {
        list-style: none;
        margin: 0;
        padding: 0 20px;
        display: flex;
        flex-direction: column;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
      }

      .entry {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid var(--ac-color-border);
      }

      .entry:last-child {
        border-bottom: 0;
      }

      .dot {
        width: 10px;
        height: 10px;
        margin-top: 6px;
        flex: none;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      .dot.cat-communication {
        background: var(--ac-color-action);
      }
      .dot.cat-sensory {
        background: var(--ac-color-category-4, var(--ac-color-action));
      }
      .dot.cat-social {
        background: var(--ac-color-category-5, var(--ac-color-action));
      }
      .dot.cat-emotional {
        background: var(--ac-color-category-2, var(--ac-color-action));
      }
      .dot.cat-sleep {
        background: var(--ac-color-category-1, var(--ac-color-action));
      }
      .dot.cat-crying {
        background: var(--ac-color-category-2, var(--ac-color-action));
      }
      .dot.cat-eating {
        background: var(--ac-color-category-3, var(--ac-color-action));
      }
      .dot.cat-routine {
        background: var(--ac-color-category-6, var(--ac-color-action));
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

      .entry-meta {
        margin: 4px 0 0;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
        line-height: 1.4;
      }

      .entry-meta strong {
        color: var(--ac-color-text-strong);
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
        font-size: 16px;
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

      .confirm-del {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
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

        .head-actions {
          align-items: stretch;
        }

        .head-actions .primary {
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
  /** Dates and times follow the page language, not the browser's. */
  protected readonly locale = computed(() =>
    this.i18n.currentLang() === 'km' ? 'km-KH' : 'en-GB',
  );
  protected readonly intensityLevels = [1, 2, 3, 4, 5] as const;

  protected readonly children = signal<readonly ChildResponse[]>([]);
  protected readonly selectedChildId = signal<string>('');
  protected readonly child = computed(() => {
    const list = this.children();
    const id = this.selectedChildId();
    return list.find((c) => c.id === id) ?? list[0] ?? null;
  });

  protected readonly observations = signal<readonly ObservationResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<ObservationCategory | null>(null);
  protected readonly pendingDelete = signal<string | null>(null);

  // Views & Calendar
  protected readonly viewMode = signal<HistoryView>('daily');
  protected readonly showCalendar = signal(false);
  protected readonly calendarDate = signal(new Date());
  protected readonly selectedDate = signal<string | null>(null);

  // Form drafts
  protected readonly formOpen = signal(false);
  protected readonly draftCategory = signal<ObservationCategory>('COMMUNICATION');
  protected readonly draftIntensity = signal(3);
  protected readonly draftWhen = signal(this.localNow());
  protected readonly draftNote = signal('');
  protected readonly draftTrigger = signal('');
  protected readonly draftDurationMinutes = signal<number | null>(null);
  protected readonly draftParentResponse = signal('');
  protected readonly draftOutcome = signal('');

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
        this.selectedChildId.set(child.id);
        this.load(child.id);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.copy().loadError);
      },
    });
  }

  protected onChildChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedChildId.set(id);
    this.load(id);
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

  protected setViewMode(mode: HistoryView): void {
    this.viewMode.set(mode);
    this.selectedDate.set(null);
  }

  protected setFilter(category: ObservationCategory | null): void {
    this.filter.set(category);
  }

  protected openForm(): void {
    this.formOpen.set(true);
    this.draftWhen.set(this.localNow());
    this.draftNote.set('');
    this.draftTrigger.set('');
    this.draftDurationMinutes.set(null);
    this.draftParentResponse.set('');
    this.draftOutcome.set('');
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

  protected onTrigger(event: Event): void {
    this.draftTrigger.set((event.target as HTMLInputElement).value);
  }

  protected onDuration(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.draftDurationMinutes.set(val === '' ? null : Number(val));
  }

  protected onResponse(event: Event): void {
    this.draftParentResponse.set((event.target as HTMLInputElement).value);
  }

  protected onOutcome(event: Event): void {
    this.draftOutcome.set((event.target as HTMLInputElement).value);
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
        ...(this.draftTrigger().trim() ? { trigger: this.draftTrigger().trim() } : {}),
        ...(this.draftDurationMinutes() !== null
          ? { durationMinutes: this.draftDurationMinutes()! }
          : {}),
        ...(this.draftParentResponse().trim()
          ? { parentResponse: this.draftParentResponse().trim() }
          : {}),
        ...(this.draftOutcome().trim() ? { outcome: this.draftOutcome().trim() } : {}),
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
    let rows = [...this.observations()];
    const selDate = this.selectedDate();
    if (selDate) {
      rows = rows.filter((r) => r.occurredAt.slice(0, 10) === selDate);
    } else {
      const mode = this.viewMode();
      const now = new Date();
      if (mode === 'daily') {
        const todayStr = now.toISOString().slice(0, 10);
        rows = rows.filter((r) => r.occurredAt.slice(0, 10) === todayStr);
      } else if (mode === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
        rows = rows.filter((r) => new Date(r.occurredAt) >= weekAgo);
      } else if (mode === 'monthly') {
        const monthAgo = new Date(now.getTime() - 30 * 86_400_000);
        rows = rows.filter((r) => new Date(r.occurredAt) >= monthAgo);
      }
    }

    const cat = this.filter();
    return cat ? rows.filter((row) => row.category === cat) : rows;
  });

  // Trends calculation
  protected readonly trendsData = computed(() => {
    const list = this.visible();
    const counts = new Map<ObservationCategory, number>();
    for (const cat of observationCategories) counts.set(cat, 0);
    for (const r of list) {
      counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    return observationCategories
      .map((category) => {
        const count = counts.get(category) ?? 0;
        return {
          category,
          count,
          percent: Math.round((count / max) * 100),
        };
      })
      .filter((t) => t.count > 0);
  });

  // Month Calendar data
  protected readonly calendarTitle = computed(() => {
    const d = this.calendarDate();
    return d.toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' });
  });

  protected readonly calendarDays = computed(() => {
    const d = this.calendarDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const recordDates = new Set(this.observations().map((o) => o.occurredAt.slice(0, 10)));

    const cells: {
      key: string;
      dayNum: number;
      dateStr: string;
      empty: boolean;
      hasRecords: boolean;
    }[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ key: `empty-${i}`, dayNum: 0, dateStr: '', empty: true, hasRecords: false });
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      cells.push({
        key: `day-${day}`,
        dayNum: day,
        dateStr,
        empty: false,
        hasRecords: recordDates.has(dateStr),
      });
    }
    return cells;
  });

  protected prevMonth(): void {
    const d = this.calendarDate();
    this.calendarDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const d = this.calendarDate();
    this.calendarDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  protected onSelectCalendarDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
  }

  protected clearSelectedDate(): void {
    this.selectedDate.set(null);
  }

  protected whenLabel(iso: string): string {
    const date = new Date(iso);
    const copy = this.copy();
    const time = date.toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' });
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayMs = 86_400_000;
    if (day === startOfToday) return `${copy.today} • ${time}`;
    if (day === startOfToday - dayMs) return `${copy.yesterday} • ${time}`;
    return `${date.toLocaleDateString(this.locale())} • ${time}`;
  }

  private localNow(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}
