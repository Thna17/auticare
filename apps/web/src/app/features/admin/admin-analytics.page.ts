import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { AdminAnalytics, AnalyticsMonth } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

type Metric = { key: keyof Omit<AnalyticsMonth, 'month'>; label: string; money?: boolean };

const METRICS: readonly Metric[] = [
  { key: 'parentRegistrations', label: 'Parent registrations' },
  { key: 'schoolsAdded', label: 'Schools added' },
  { key: 'proStarted', label: 'Pro plans started' },
  { key: 'businessStarted', label: 'Business plans started' },
  { key: 'plansEnded', label: 'Plans canceled or ended' },
  { key: 'recordedPlanValueCents', label: 'Recorded plan value', money: true },
  { key: 'questionnairesCompleted', label: 'Questionnaires completed' },
  { key: 'aiQuestions', label: 'Questions asked to the AI' },
  { key: 'activitiesCompleted', label: 'Activities completed' },
];

const monthName = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });

const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`;

/**
 * Month-by-month growth, as counts only. Plan value is the list price of plans
 * recorded by hand, since online payment isn't connected yet.
 */
@Component({
  standalone: true,
  imports: [UiMessageComponent, UiSpinnerComponent],
  selector: 'ac-admin-analytics-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Analytics &amp; Reports</h1>
        <p class="subtitle">
          How AutiCare is growing. Numbers only — no names or child information. "Recorded plan
          value" is the list price of plans you recorded, not money received.
        </p>
      </div>
      <div class="actions">
        <select aria-label="Period" (change)="setMonths(+$any($event.target).value)">
          @for (option of periods; track option) {
            <option [value]="option" [selected]="option === months()">
              Last {{ option }} months
            </option>
          }
        </select>
        <button type="button" class="btn-ghost" [disabled]="!data()" (click)="exportCsv()">
          Export CSV
        </button>
      </div>
    </header>

    @if (loading()) {
      <ac-ui-spinner label="Loading analytics…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      <section class="stats" aria-label="Totals">
        <div class="stat">
          <strong>{{ d.totals.parents }}</strong
          ><span>Parents</span>
        </div>
        <div class="stat">
          <strong>{{ conversion() }}%</strong>
          <span>On Pro ({{ d.totals.parentsOnPro }} of {{ d.totals.parents }})</span>
        </div>
        <div class="stat">
          <strong>{{ d.totals.activeChildren }}</strong
          ><span>Active child profiles</span>
        </div>
        <div class="stat">
          <strong>{{ completion() }}%</strong>
          <span>Children with a completed questionnaire</span>
        </div>
      </section>

      @for (metric of metrics; track metric.key) {
        <section class="card chart" [attr.aria-label]="metric.label">
          <h2>{{ metric.label }}</h2>
          <ol class="bars">
            @for (month of d.months; track month.month) {
              <li>
                <span class="bar-wrap" aria-hidden="true">
                  <span class="bar" [style.height.%]="height(metric, month)"></span>
                </span>
                <span class="value">{{ value(metric, month) }}</span>
                <span class="label">{{ monthName(month.month) }}</span>
              </li>
            }
          </ol>
        </section>
      }
    }
  `,
  styles: [
    PORTAL_PAGE_STYLES,
    `
      .chart {
        gap: 10px;
      }

      .bars {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(36px, 1fr);
        gap: 8px;
        overflow-x: auto;
      }

      .bars li {
        display: grid;
        justify-items: center;
        gap: 4px;
      }

      .bar-wrap {
        display: flex;
        align-items: flex-end;
        width: 100%;
        height: 96px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .bar {
        display: block;
        width: 100%;
        min-height: 2px;
        border-radius: 6px 6px 0 0;
        background: var(--ac-color-action);
      }

      .value {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .label {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAnalyticsPage implements OnInit {
  private readonly api = inject(AdminPortalApi);

  protected readonly data = signal<AdminAnalytics | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly months = signal(6);
  protected readonly periods = [3, 6, 12, 24];
  protected readonly metrics = METRICS;
  protected readonly monthName = monthName;

  protected readonly conversion = computed(() => {
    const totals = this.data()?.totals;
    return totals && totals.parents > 0
      ? Math.round((totals.parentsOnPro / totals.parents) * 100)
      : 0;
  });
  protected readonly completion = computed(() => {
    const totals = this.data()?.totals;
    return totals && totals.activeChildren > 0
      ? Math.round((totals.childrenWithCompletedQuestionnaire / totals.activeChildren) * 100)
      : 0;
  });

  ngOnInit(): void {
    this.load();
  }

  protected setMonths(months: number): void {
    this.months.set(months);
    this.load();
  }

  protected value(metric: Metric, month: AnalyticsMonth): string {
    const raw = month[metric.key];
    return metric.money ? dollars(raw) : String(raw);
  }

  protected height(metric: Metric, month: AnalyticsMonth): number {
    const max = Math.max(...(this.data()?.months ?? []).map((m) => m[metric.key]), 0);
    return max === 0 ? 0 : (month[metric.key] / max) * 100;
  }

  protected exportCsv(): void {
    const d = this.data();
    if (!d) return;
    const header = ['month', ...METRICS.map((m) => m.label)];
    const lines = [
      header.join(','),
      ...d.months.map((month) =>
        [
          month.month,
          ...METRICS.map((m) => (m.money ? (month[m.key] / 100).toFixed(2) : String(month[m.key]))),
        ].join(','),
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `auticare-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.analytics(this.months()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Analytics could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
