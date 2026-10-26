import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type {
  ChildInsightResponse,
  ObservationPattern,
  RiskLevel,
  ScreeningSessionResultResponse,
} from '@auticare/contracts';
import { I18nService } from '../../../core/i18n/i18n.service';
import { InsightsApi } from '../../insights/data-access/insights.api';
import { ScreeningApi } from '../../screening/data-access/screening.api';
import { UiSpinnerComponent } from '../../../design-system/components/ui-spinner.component';

const COPY = {
  en: {
    bandTitle: 'Where things stand',
    bandLabel: 'Concern band',
    bands: {
      LOW: { label: 'Low', line: 'Nothing in the last check-in stood out.' },
      MODERATE: { label: 'Moderate', line: 'A few areas are worth watching.' },
      HIGH: { label: 'Elevated', line: 'Several areas are worth a professional look.' },
    },
    areas: 'Areas we asked about',
    fullResult: 'See the full result',
    retake: 'Take the short check-in',
    notAssessedTitle: 'You have not done the short check-in yet',
    notAssessedBody:
      'Ten questions, about three minutes. It gives you a starting point and something to compare against later.',
    patternsTitle: 'What your records add up to',
    patternsEmptyTitle: 'Nothing recorded yet',
    patternsEmptyBody:
      'Even one note a day builds a picture. Patterns appear once there are a few entries.',
    record: 'Record something',
    seeAll: 'See all observations',
    windowLabel: (days: number) => `Last ${days} days`,
    countLabel: (count: number, days: number) => `${count} records on ${days} days`,
    trend: {
      INCREASED: (label: string) => `${label} has increased since the previous weeks.`,
      DECREASED: (label: string) => `${label} has reduced since the previous weeks.`,
      STABLE: (label: string) => `${label} has stayed about the same.`,
      NEW: (label: string) => `${label} is new in this period.`,
      NONE: () => '',
    },
    clusterWeekday: (label: string, on: number, total: number) =>
      `${label} mostly happens on school days (${on} of ${total}).`,
    clusterWeekend: (label: string, on: number, total: number) =>
      `${label} mostly happens at weekends (${on} of ${total}).`,
    timeOfDay: {
      MORNING: (label: string) => `${label} is most often recorded in the morning.`,
      AFTERNOON: (label: string) => `${label} is most often recorded in the afternoon.`,
      EVENING: (label: string) => `${label} is most often recorded in the evening.`,
      NIGHT: (label: string) => `${label} is most often recorded at night.`,
    },
    disclaimer: 'Counts of what you recorded. Not a diagnosis, and not a cause.',
    categories: {
      CRYING: 'Crying',
      SLEEP: 'Sleep',
      EATING: 'Eating',
      SENSORY: 'Sensory reactions',
      SOCIAL: 'Social difficulty',
      ROUTINE: 'Routine changes',
      OTHER: 'Other',
    },
    loadError: 'This summary could not be loaded.',
  },
  km: {
    bandTitle: 'ស្ថានភាពបច្ចុប្បន្ន',
    bandLabel: 'កម្រិតនៃការព្រួយបារម្ភ',
    bands: {
      LOW: { label: 'ទាប', line: 'គ្មានអ្វីគួរឱ្យបារម្ភនៅក្នុងការពិនិត្យចុងក្រោយទេ។' },
      MODERATE: { label: 'មធ្យម', line: 'មានផ្នែកខ្លះគួរតាមដាន។' },
      HIGH: { label: 'ខ្ពស់', line: 'មានផ្នែកជាច្រើនគួរឱ្យអ្នកជំនាញពិនិត្យ។' },
    },
    areas: 'ផ្នែកដែលយើងបានសួរ',
    fullResult: 'មើលលទ្ធផលពេញលេញ',
    retake: 'ធ្វើការពិនិត្យខ្លី',
    notAssessedTitle: 'អ្នកមិនទាន់បានធ្វើការពិនិត្យខ្លីទេ',
    notAssessedBody:
      'សំណួរដប់ ប្រហែលបីនាទី។ វាផ្តល់ឱ្យអ្នកនូវចំណុចចាប់ផ្តើម និងអ្វីដែលអាចប្រៀបធៀបនៅពេលក្រោយ។',
    patternsTitle: 'អ្វីដែលកំណត់ត្រារបស់អ្នកបង្ហាញ',
    patternsEmptyTitle: 'មិនទាន់មានកំណត់ត្រាទេ',
    patternsEmptyBody:
      'ទោះតែកំណត់ត្រាមួយក្នុងមួយថ្ងៃ ក៏បង្កើតជារូបភាពមួយ។ គំរូនឹងលេចឡើងនៅពេលមានកំណត់ត្រាពីរបី។',
    record: 'កត់ត្រាថ្មី',
    seeAll: 'មើលកំណត់ត្រាទាំងអស់',
    windowLabel: (days: number) => `${days} ថ្ងៃចុងក្រោយ`,
    countLabel: (count: number, days: number) => `កំណត់ត្រា ${count} ក្នុង ${days} ថ្ងៃ`,
    trend: {
      INCREASED: (label: string) => `${label} បានកើនឡើងចាប់ពីសប្តាហ៍មុនៗ។`,
      DECREASED: (label: string) => `${label} បានថយចុះចាប់ពីសប្តាហ៍មុនៗ។`,
      STABLE: (label: string) => `${label} នៅដូចដើម។`,
      NEW: (label: string) => `${label} គឺថ្មីក្នុងរយៈពេលនេះ។`,
      NONE: () => '',
    },
    clusterWeekday: (label: string, on: number, total: number) =>
      `${label} កើតឡើងភាគច្រើននៅថ្ងៃសាលា (${on} ក្នុង ${total})។`,
    clusterWeekend: (label: string, on: number, total: number) =>
      `${label} កើតឡើងភាគច្រើននៅចុងសប្តាហ៍ (${on} ក្នុង ${total})។`,
    timeOfDay: {
      MORNING: (label: string) => `${label} កត់ត្រាភាគច្រើននៅពេលព្រឹក។`,
      AFTERNOON: (label: string) => `${label} កតត្រាភាគច្រើននៅពេលរសៀល។`,
      EVENING: (label: string) => `${label} កត់ត្រាភាគច្រើននៅពេលល្ងាច។`,
      NIGHT: (label: string) => `${label} កត់ត្រាភាគច្រើននៅពេលយប់។`,
    },
    disclaimer: 'ការរាប់ពីអ្វីដែលអ្នកបានកត់ត្រា។ មិនមែនជាការធ្វើរោគវិនិច្ឆ័យ និងមិនមែនជាមូលហេតុទេ។',
    categories: {
      CRYING: 'ការយំ',
      SLEEP: 'ការគេង',
      EATING: 'ការញ៉ាំ',
      SENSORY: 'ប្រតិកម្មវិញ្ញាណ',
      SOCIAL: 'ការលំបាកសង្គម',
      ROUTINE: 'ការផ្លាស់ប្តូរទម្លាប់',
      OTHER: 'ផ្សេងៗ',
    },
    loadError: 'មិនអាចផ្ទុកសេចក្តីសង្ខេបនេះបានទេ។',
  },
};

const INSIGHT_DAYS = 28;

/**
 * The dashboard's analysis block.
 *
 * Two answers, in the order a parent asks them: where do things stand (the band
 * from the short check-in), and what do my own records add up to (patterns from
 * the last four weeks). Both are shown with their limits attached — a band is not
 * a diagnosis, and a pattern is a count, not a cause.
 */
@Component({
  selector: 'ac-parent-analysis',
  standalone: true,
  imports: [RouterLink, UiSpinnerComponent],
  template: `
    @if (loading()) {
      <ac-ui-spinner [label]="copy().bandTitle" />
    } @else if (error()) {
      <p class="load-error">{{ error() }}</p>
    } @else {
      <div class="grid">
        <!-- Concern band -->
        <section
          class="card band-card"
          [class]="'band-' + bandKey()"
          aria-labelledby="band-heading"
        >
          <p class="card-eyebrow">{{ copy().bandTitle }}</p>

          @if (assessment(); as latest) {
            <h2 id="band-heading">
              <span class="chip">{{ copy().bandLabel }} · {{ band().label }}</span>
            </h2>
            <p class="band-line">{{ band().line }}</p>

            @if (areas().length > 0) {
              <div class="areas" aria-label="Areas we asked about">
                <p class="areas-label">{{ copy().areas }}</p>
                @for (area of areas(); track area.category) {
                  <div class="area">
                    <span class="area-name">{{ area.category }}</span>
                    <span class="bar">
                      <span
                        class="bar-fill"
                        [class.lv-moderate]="area.riskLevel === 'MODERATE'"
                        [class.lv-high]="area.riskLevel === 'HIGH'"
                        [style.width.%]="area.percent"
                      ></span>
                    </span>
                  </div>
                }
              </div>
            }

            <a class="link" [routerLink]="['/screening/result', latest.id]">
              {{ copy().fullResult }} →
            </a>
          } @else {
            <h2 id="band-heading">{{ copy().notAssessedTitle }}</h2>
            <p class="band-line">{{ copy().notAssessedBody }}</p>
            <a class="link" routerLink="/welcome">{{ copy().retake }} →</a>
          }
        </section>

        <!-- Pattern insight -->
        <section class="card pattern-card" aria-labelledby="patterns-heading">
          <p class="card-eyebrow">{{ copy().patternsTitle }}</p>

          @if (insight(); as data) {
            @if (data.observationCount === 0) {
              <h2 id="patterns-heading">{{ copy().patternsEmptyTitle }}</h2>
              <p class="band-line">{{ copy().patternsEmptyBody }}</p>
            } @else {
              <p class="window">
                {{ copy().countLabel(data.observationCount, data.distinctDays) }} ·
                {{ copy().windowLabel(INSIGHT_DAYS) }}
              </p>
              <ul class="lines">
                @for (line of patternLines(); track line) {
                  <li>{{ line }}</li>
                }
              </ul>
            }
          } @else {
            <h2 id="patterns-heading">{{ copy().patternsEmptyTitle }}</h2>
            <p class="band-line">{{ copy().patternsEmptyBody }}</p>
          }

          <div class="card-actions">
            <a class="primary-link" routerLink="/observations">{{ copy().record }}</a>
            @if (insight()?.observationCount) {
              <a class="link" routerLink="/observations">{{ copy().seeAll }} →</a>
            }
          </div>

          <p class="fine">{{ copy().disclaimer }}</p>
        </section>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        margin: 22px 0;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 18px;
      }

      .card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: 22px;
        box-shadow: var(--ac-shadow-xs);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .card-eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: var(--ac-type-label);
        font-weight: 700;
        color: var(--ac-color-text-muted);
      }

      h2 {
        margin: 2px 0 0;
        font-size: var(--ac-type-card-title);
        color: var(--ac-color-text-strong);
        line-height: 1.35;
      }

      .chip {
        display: inline-block;
        padding: 5px 12px;
        border-radius: var(--ac-radius-pill);
        font-size: var(--ac-type-label);
        letter-spacing: 0.02em;
        background: var(--ac-color-blue-surface-soft);
        color: var(--ac-color-action-darkest);
      }

      .band-high .chip {
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-text);
      }

      .band-moderate .chip {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-dark);
      }

      .band-line {
        margin: 0;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
        font-size: var(--ac-type-body);
      }

      .window {
        margin: 0;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .areas {
        margin: 8px 0 4px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .areas-label {
        margin: 0 0 2px;
        font-size: var(--ac-type-label);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ac-color-text-muted);
      }

      .area {
        display: grid;
        grid-template-columns: 1fr 90px;
        align-items: center;
        gap: 10px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-strong);
      }

      .area-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bar {
        display: block;
        height: 7px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        overflow: hidden;
      }

      .bar-fill {
        display: block;
        height: 100%;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-teal);
      }

      .bar-fill.lv-moderate {
        background: var(--ac-color-amber-dark);
      }

      .bar-fill.lv-high {
        background: var(--ac-color-alert-strong);
      }

      .lines {
        margin: 2px 0 0;
        padding-left: 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        color: var(--ac-color-text-strong);
        line-height: 1.55;
        font-size: var(--ac-type-body);
      }

      .card-actions {
        margin-top: auto;
        padding-top: 10px;
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      .primary-link {
        display: inline-block;
        padding: 9px 16px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-weight: 700;
        font-size: var(--ac-type-meta);
        text-decoration: none;
      }

      .link {
        color: var(--ac-color-action);
        font-weight: 700;
        font-size: var(--ac-type-meta);
        text-decoration: none;
      }

      .link:hover {
        text-decoration: underline;
      }

      .fine {
        margin: 0;
        font-size: 11px;
        color: var(--ac-color-text-muted);
        line-height: 1.5;
      }

      .load-error {
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentAnalysisComponent {
  /** The child currently selected on the dashboard, or null before it loads. */
  readonly childId = input<string | null>(null);

  private readonly i18n = inject(I18nService);
  private readonly insightsApi = inject(InsightsApi);
  private readonly screeningApi = inject(ScreeningApi);

  protected readonly INSIGHT_DAYS = INSIGHT_DAYS;
  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);

  protected readonly insight = signal<ChildInsightResponse | null>(null);
  protected readonly assessment = signal<ScreeningSessionResultResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const childId = this.childId();
      if (!childId) {
        this.loading.set(false);
        return;
      }
      this.load(childId);
    });
  }

  protected readonly bandKey = computed(() => {
    const level: RiskLevel = this.assessment()?.result?.riskLevel ?? 'LOW';
    return level.toLowerCase();
  });

  protected readonly band = computed(() => this.copy().bands[this.bandLevel()]);

  protected readonly areas = computed(() =>
    (this.assessment()?.result?.categoryBreakdown ?? [])
      .slice()
      .sort((a, b) => b.riskPercentage - a.riskPercentage)
      .slice(0, 4)
      .map((area) => ({
        category: area.category,
        riskLevel: area.riskLevel,
        percent: area.riskPercentage,
      })),
  );

  /**
   * Sentences composed in the browser, from the counts the API returned. The API
   * deliberately sends evidence rather than prose so the same numbers can be read
   * in either language without a second round trip.
   */
  protected readonly patternLines = computed(() => {
    const data = this.insight();
    if (!data) return [];
    const copy = this.copy();
    const lines: string[] = [];

    for (const pattern of data.patterns.slice(0, 2)) {
      const label = copy.categories[pattern.category];
      if (pattern.count >= 2) {
        if (pattern.weekdayCount / pattern.count >= 0.6) {
          lines.push(copy.clusterWeekday(label, pattern.weekdayCount, pattern.count));
        } else if (pattern.weekendCount / pattern.count >= 0.6) {
          lines.push(copy.clusterWeekend(label, pattern.weekendCount, pattern.count));
        }
      }
      if (pattern.timeOfDay) {
        lines.push(copy.timeOfDay[pattern.timeOfDay](label));
      }
      const trendLine = this.trendLine(pattern, label);
      if (trendLine) lines.push(trendLine);
    }

    // Never leave the card empty when there are records but no cluster: say the
    // plain thing rather than implying there is nothing to notice.
    return lines.length > 0
      ? lines
      : [copy.trend.STABLE(copy.categories[data.patterns[0]?.category ?? 'OTHER'])];
  });

  private bandLevel(): RiskLevel {
    return this.assessment()?.result?.riskLevel ?? 'LOW';
  }

  private trendLine(pattern: ObservationPattern, label: string): string {
    const copy = this.copy();
    if (pattern.trend === 'INCREASED' || pattern.trend === 'DECREASED') {
      return copy.trend[pattern.trend](label);
    }
    return '';
  }

  private load(childId: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Minutes east of UTC: the API uses that convention for local-day bucketing.
    const tzOffsetMinutes = -new Date().getTimezoneOffset();
    this.insightsApi.get(childId, INSIGHT_DAYS, tzOffsetMinutes).subscribe({
      next: (insight) => {
        this.insight.set(insight);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.copy().loadError);
      },
    });

    this.screeningApi.getLatest(childId, 'SHORT').subscribe({
      next: (latest) => this.assessment.set(latest),
      error: () => this.assessment.set(null),
    });
  }
}
