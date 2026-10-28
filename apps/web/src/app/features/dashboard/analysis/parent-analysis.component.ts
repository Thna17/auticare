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
      COMMUNICATION: 'Communication',
      EMOTIONAL: 'Emotional expression',
      CRYING: 'Crying',
      SLEEP: 'Sleep',
      EATING: 'Eating',
      SENSORY: 'Sensory reactions',
      SOCIAL: 'Social difficulty',
      ROUTINE: 'Routine changes',
      OTHER: 'Other',
    },
    loadError: 'This summary could not be loaded.',
    nextStep: 'Your next step',
    orAsk: 'Or ask AutiCare a question',
    next: {
      checkin: {
        title: 'Start with a three-minute check-in',
        body: 'Ten simple questions give you a starting point you can compare against later.',
        cta: 'Start the check-in',
      },
      book: {
        title: 'A professional look is the right next step',
        body: 'The check-in suggested several areas worth a closer look. Booking early means less time waiting.',
        cta: 'Book an appointment',
      },
      record: {
        title: (name: string) => `Note one thing ${name} did today`,
        body: 'One sentence a day is enough. After a few notes, patterns start to appear here.',
        cta: 'Record a note',
      },
      ask: {
        title: 'Have a question about this week?',
        body: 'Ask in Khmer or English. Answers are plain, sourced, and never a diagnosis.',
        cta: 'Ask AutiCare',
      },
    },
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
      COMMUNICATION: 'ការប្រាស្រ័យទាក់ទង',
      EMOTIONAL: 'ការបញ្ចេញអារម្មណ៍',
      CRYING: 'ការយំ',
      SLEEP: 'ការគេង',
      EATING: 'ការញ៉ាំ',
      SENSORY: 'ប្រតិកម្មវិញ្ញាណ',
      SOCIAL: 'ការលំបាកសង្គម',
      ROUTINE: 'ការផ្លាស់ប្តូរទម្លាប់',
      OTHER: 'ផ្សេងៗ',
    },
    loadError: 'មិនអាចផ្ទុកសេចក្តីសង្ខេបនេះបានទេ។',
    nextStep: 'ជំហានបន្ទាប់របស់អ្នក',
    orAsk: 'ឬសួរ AutiCare នូវសំណួរមួយ',
    next: {
      checkin: {
        title: 'ចាប់ផ្តើមជាមួយការពិនិត្យខ្លីបីនាទី',
        body: 'សំណួរងាយៗដប់ ផ្តល់ឱ្យអ្នកនូវចំណុចចាប់ផ្តើមដែលអាចប្រៀបធៀបនៅពេលក្រោយ។',
        cta: 'ចាប់ផ្តើមការពិនិត្យ',
      },
      book: {
        title: 'ការពិនិត្យដោយអ្នកជំនាញ គឺជាជំហានបន្ទាប់ដ៏ត្រឹមត្រូវ',
        body: 'ការពិនិត្យបានបង្ហាញផ្នែកជាច្រើនដែលគួរមើលឱ្យកាន់តែច្បាស់។ ការណាត់ជួបឆាប់ ជួយកាត់បន្ថយពេលរង់ចាំ។',
        cta: 'ណាត់ជួបគ្រូពេទ្យ',
      },
      record: {
        title: (name: string) => `កត់ត្រារឿងមួយដែល ${name} បានធ្វើថ្ងៃនេះ`,
        body: 'មួយប្រយោគក្នុងមួយថ្ងៃគឺគ្រប់គ្រាន់។ បន្ទាប់ពីកំណត់ត្រាពីរបី គំរូនឹងចាប់ផ្តើមលេចឡើងនៅទីនេះ។',
        cta: 'កត់ត្រាថ្មី',
      },
      ask: {
        title: 'មានសំណួរអំពីសប្តាហ៍នេះទេ?',
        body: 'សួរជាភាសាខ្មែរ ឬអង់គ្លេស។ ចម្លើយច្បាស់ មានប្រភព និងមិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ។',
        cta: 'សួរ AutiCare',
      },
    },
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
      <!-- One suggested next action, not a menu of ten. -->
      @if (nextStep(); as step) {
        <section
          class="next-card"
          [class.next-ask]="step.kind === 'ask'"
          aria-labelledby="next-heading"
        >
          <div class="next-text">
            <p class="next-eyebrow">{{ copy().nextStep }}</p>
            <h2 id="next-heading">{{ step.title }}</h2>
            <p class="next-body">{{ step.body }}</p>
          </div>
          <div class="next-actions">
            <a class="next-cta" [routerLink]="step.link">
              {{ step.cta }}
              <span class="arrow" aria-hidden="true">→</span>
            </a>
            @if (step.kind !== 'ask') {
              <a class="ask-link" routerLink="/ai">
                {{ copy().orAsk }}
              </a>
            }
          </div>
        </section>
      }

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
              <div class="areas" [attr.aria-label]="copy().areas">
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
            <!-- The next-step card above already carries the button. -->
            <h2 id="band-heading">{{ copy().notAssessedTitle }}</h2>
            <p class="band-line">{{ copy().notAssessedBody }}</p>
          }
        </section>

        <!-- Pattern insight -->
        <section class="card pattern-card" aria-labelledby="patterns-heading">
          <p class="card-eyebrow">{{ copy().patternsTitle }}</p>

          @if (insight()?.observationCount) {
            <p class="window">
              {{ copy().countLabel(insight()!.observationCount, insight()!.distinctDays) }} ·
              {{ copy().windowLabel(INSIGHT_DAYS) }}
            </p>
            <ul class="lines">
              @for (line of patternLines(); track line) {
                <li>{{ line }}</li>
              }
            </ul>
            <a class="link" routerLink="/observations">{{ copy().seeAll }} →</a>
          } @else {
            <h2 id="patterns-heading">{{ copy().patternsEmptyTitle }}</h2>
            <p class="band-line">{{ copy().patternsEmptyBody }}</p>
            @if (nextStep()?.kind !== 'record') {
              <a class="link" routerLink="/observations">{{ copy().record }} →</a>
            }
          }

          <p class="fine">{{ copy().disclaimer }}</p>
        </section>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 18px;

        --a-primary: var(--ac-color-action);
        --a-ink: var(--ac-color-text-strong);
        --a-muted: var(--ac-color-text-muted);
        --a-line: var(--ac-color-border);
      }

      /* ---- Next step ---- */
      .next-card {
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px 32px;
        flex-wrap: wrap;
        padding: 22px 24px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        animation: rise 0.45s ease both;
      }

      .next-text {
        flex: 1 1 320px;
        min-width: 0;
      }

      .next-eyebrow {
        margin: 0 0 6px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--a-primary);
      }

      .next-card h2 {
        margin: 0;
        font-size: clamp(18px, 2vw, 20px);
        line-height: 1.3;
        color: var(--a-ink);
      }

      .next-body {
        margin: 6px 0 0;
        font-size: 15px;
        line-height: 1.55;
        color: var(--a-muted);
        max-width: 56ch;
      }

      .next-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        position: relative;
        z-index: 1;
      }

      /* Same size and shape as the dashboard's quick-action buttons. */
      .next-cta {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 36px;
        padding: 0 16px;
        border: 1px solid var(--a-primary);
        border-radius: var(--ac-radius-md);
        background: var(--a-primary);
        color: var(--ac-color-text-on-action);
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        transition: background 0.18s ease;
      }

      .next-cta:hover {
        background: var(--ac-color-action-deep);
      }

      .next-cta:hover .arrow {
        transform: translateX(3px);
      }

      .next-cta:focus-visible,
      .ask-link:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 3px;
      }

      .arrow {
        transition: transform 0.18s ease;
      }

      .ask-link {
        color: var(--a-primary);
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
      }

      .ask-link:hover {
        text-decoration: underline;
      }

      /* ---- Cards ---- */
      /* One quiet panel split in two, rather than two floating cards. */
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        background: var(--ac-color-surface);
        border: 1px solid var(--a-line);
        border-radius: var(--ac-radius-lg);
        animation: rise 0.45s ease both;
      }

      .card {
        min-width: 0;
        padding: 22px 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .card + .card {
        border-left: 1px solid var(--a-line);
      }

      .card-eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
        font-weight: 700;
        color: var(--a-muted);
      }

      h2 {
        margin: 2px 0 0;
        font-size: var(--ac-type-card-title);
        color: var(--a-ink);
        line-height: 1.35;
      }

      .chip {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
        background: var(--ac-color-blue-surface-soft);
        color: var(--ac-color-action-darkest);
      }

      .band-moderate .chip {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-dark);
      }

      .band-high .chip {
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-text);
      }

      .band-line {
        margin: 0;
        color: var(--a-muted);
        line-height: 1.6;
        font-size: 15px;
      }

      .window {
        margin: 0;
        font-size: 13px;
        color: var(--a-muted);
      }

      .areas {
        margin: 4px 0;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .area {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 110px;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: var(--a-ink);
      }

      .area-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bar {
        display: block;
        height: 8px;
        border-radius: 999px;
        background: var(--ac-color-surface-slate);
        overflow: hidden;
      }

      .bar-fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        background: var(--ac-color-green-teal);
        transform-origin: left;
        animation: grow 0.8s 0.2s cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }

      .bar-fill.lv-moderate {
        background: var(--ac-color-amber-dark);
      }

      .bar-fill.lv-high {
        background: var(--ac-color-alert-strong);
      }

      .lines {
        margin: 0;
        padding-left: 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        color: var(--a-ink);
        line-height: 1.55;
        font-size: 15px;
      }

      .link {
        margin-top: auto;
        padding-top: 4px;
        color: var(--a-primary);
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
      }

      .link:hover {
        text-decoration: underline;
      }

      .fine {
        margin: 0;
        font-size: 12px;
        color: var(--a-muted);
        line-height: 1.5;
      }

      .load-error {
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
      }

      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
      }

      @keyframes grow {
        from {
          transform: scaleX(0);
        }
      }

      @media (max-width: 760px) {
        .grid {
          grid-template-columns: 1fr;
        }

        .card + .card {
          border-left: 0;
          border-top: 1px solid var(--a-line);
        }
      }

      @media (max-width: 640px) {
        .next-card {
          padding: 22px 20px;
        }

        .next-actions {
          width: 100%;
        }
      }

      /* Honour both the OS setting and AutiCare's own reduced-motion preference. */
      @media (prefers-reduced-motion: reduce) {
        .next-card,
        .grid,
        .bar-fill {
          animation: none;
        }

        .next-cta:hover .arrow {
          transform: none;
        }
      }

      :host-context(.reduced-motion) .next-card,
      :host-context(.reduced-motion) .grid,
      :host-context(.reduced-motion) .bar-fill {
        animation: none;
      }

      :host-context(.reduced-motion) .next-cta:hover .arrow {
        transform: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentAnalysisComponent {
  /** The child currently selected on the dashboard, or null before it loads. */
  readonly childId = input<string | null>(null);
  /** First name, used only in on-screen copy; it is never sent anywhere. */
  readonly childName = input<string>('');

  private readonly i18n = inject(I18nService);
  private readonly insightsApi = inject(InsightsApi);
  private readonly screeningApi = inject(ScreeningApi);

  protected readonly INSIGHT_DAYS = INSIGHT_DAYS;
  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);

  protected readonly insight = signal<ChildInsightResponse | null>(null);
  protected readonly assessment = signal<ScreeningSessionResultResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  /** Held apart from `loading` so the next step never flashes "take the check-in" first. */
  private readonly assessmentLoaded = signal(false);

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
      .slice(0, 3)
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
      ? lines.slice(0, 3)
      : [copy.trend.STABLE(copy.categories[data.patterns[0]?.category ?? 'OTHER'])];
  });

  /**
   * The single action the overview leads with, in the order the planner gives:
   * no check-in yet → take it; an elevated band → booking comes first; nothing
   * recorded → record; otherwise the assistant.
   */
  protected readonly nextStep = computed(() => {
    if (!this.assessmentLoaded()) return null;
    const next = this.copy().next;
    const latest = this.assessment();

    if (!latest) return { kind: 'checkin', ...next.checkin, link: '/welcome' } as const;
    if (latest.result?.riskLevel === 'HIGH') {
      return { kind: 'book', ...next.book, link: '/appointments' } as const;
    }
    if (!this.insight()?.observationCount) {
      const name = this.childName() || (this.i18n.currentLang() === 'km' ? 'កូន' : 'your child');
      return {
        kind: 'record',
        ...next.record,
        title: next.record.title(name),
        link: '/observations',
      } as const;
    }
    return { kind: 'ask', ...next.ask, link: '/ai' } as const;
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
    this.assessmentLoaded.set(false);

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
      next: (latest) => {
        this.assessment.set(latest);
        this.assessmentLoaded.set(true);
      },
      error: () => {
        this.assessment.set(null);
        this.assessmentLoaded.set(true);
      },
    });
  }
}
