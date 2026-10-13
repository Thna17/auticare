import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ChildResponse, RiskLevel, ScreeningSessionDetailResponse } from '@auticare/contracts';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from './data-access/screening.api';
import { ChildSelectCardComponent } from './components/child-select-card.component';
import { ScreeningBadgeComponent } from './components/screening-badge.component';
import type { BadgeTone } from './components/screening-badge.component';
import { ScreeningHistoryFilterComponent } from './components/screening-history-filter.component';
import type { RiskFilter } from './components/screening-history-filter.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

const MAX_ANSWER_VALUE = 4;
const PAGE_SIZE = 5;

const riskTones: Record<RiskLevel, BadgeTone> = {
  LOW: 'positive',
  MODERATE: 'caution',
  HIGH: 'alert',
};

const riskLabels: Record<RiskLevel, string> = {
  LOW: 'Low Risk',
  MODERATE: 'Moderate Risk',
  HIGH: 'High Risk',
};

type TimelineItem = {
  id: string;
  date: string;
  ageBand: string | null;
  riskLevel: RiskLevel;
  scoreLabel: string;
  scorePercentage: number | null;
  recommendation: string | null;
  comparison?: {
    direction: 'improved' | 'elevated' | 'stable';
    arrow: string;
    text: string;
  };
};

@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiEmptyStateComponent,
    ChildSelectCardComponent,
    ScreeningBadgeComponent,
    ScreeningHistoryFilterComponent,
    UiPaginationComponent,
    UiMessageComponent,
    UiSpinnerComponent,
  ],
  template: `
    <section class="history">
      <header class="head">
        <h1>Screening History</h1>
        <p class="subtitle">
          Review your child's past screenings, compare trajectories, and revisit clinical results.
        </p>
      </header>

      @if (loading()) {
        <div class="state-center">
          <ac-ui-spinner label="Loading screening history…" />
        </div>
      } @else if (error()) {
        <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
      } @else {
        @if (children().length > 1) {
          <section class="select-child" role="group" aria-labelledby="history-child-label">
            <p id="history-child-label" class="section-label">Child Profile</p>
            <div class="child-row">
              @for (child of children(); track child.id) {
                <ac-child-select-card
                  [child]="child"
                  [selected]="child.id === selectedChildId()"
                  (select)="onSelectChild($event)"
                />
              }
            </div>
          </section>
        }

        <!-- Developmental Risk Progression Timeline -->
        @if (timelineItems().length >= 1) {
          <section class="timeline-section" aria-label="Developmental risk progression timeline">
            <div class="timeline-header">
              <div class="timeline-title-group">
                <span class="timeline-icon" aria-hidden="true">📈</span>
                <div>
                  <h2>Developmental Risk Progression Timeline</h2>
                  <p>Longitudinal comparison of screening indicators across assessment dates</p>
                </div>
              </div>
              <span class="timeline-count-badge">
                {{ timelineItems().length }}
                {{ timelineItems().length === 1 ? 'assessment recorded' : 'assessments recorded' }}
              </span>
            </div>

            <div class="timeline-track-container">
              <div class="timeline-track">
                @for (
                  item of timelineItems();
                  track item.id;
                  let idx = $index;
                  let isLast = $last
                ) {
                  <article class="timeline-node" [class.latest-node]="isLast">
                    <div class="node-marker-col">
                      <span class="node-dot" [class]="item.riskLevel.toLowerCase()"></span>
                      @if (!isLast) {
                        <span class="node-line"></span>
                      }
                    </div>

                    <div class="node-content-card">
                      <div class="node-card-top">
                        <div class="node-date-info">
                          <strong class="node-date">{{ item.date }}</strong>
                          @if (item.ageBand) {
                            <span class="node-age-band">{{ item.ageBand }}</span>
                          }
                        </div>
                        <ac-screening-badge [tone]="tone(item.riskLevel)">
                          {{ label(item.riskLevel) }}
                        </ac-screening-badge>
                      </div>

                      <div class="node-metrics-row">
                        <div class="node-score-box">
                          <span class="metric-label">Score Indicator:</span>
                          <strong class="metric-val">{{ item.scoreLabel }}</strong>
                        </div>
                        @if (item.comparison; as comp) {
                          <div class="node-delta-box" [class]="comp.direction">
                            <span class="delta-arrow" aria-hidden="true">{{ comp.arrow }}</span>
                            <span class="delta-text">{{ comp.text }}</span>
                          </div>
                        }
                      </div>

                      @if (item.recommendation) {
                        <p class="node-recom">
                          {{ item.recommendation }}
                        </p>
                      }

                      <div class="node-action-line">
                        <a class="view-session-link" [routerLink]="['/screening/result', item.id]">
                          View Full Diagnostic Breakdown &rarr;
                        </a>
                      </div>
                    </div>
                  </article>
                }
              </div>
            </div>
          </section>
        }

        <div class="toolbar-row">
          <ac-screening-history-filter
            [value]="riskFilter()"
            (valueChange)="onFilterChange($event)"
          />
        </div>

        @if (!filteredSessions().length) {
          <ac-ui-empty-state title="No screenings to show" [message]="emptyMessage()">
            @if (selectedChildId()) {
              <a
                class="primary-link"
                routerLink="/screening/new"
                [queryParams]="{ childId: selectedChildId() }"
              >
                Start a screening
              </a>
            } @else {
              <a class="primary-link" routerLink="/screening">Start a screening</a>
            }
          </ac-ui-empty-state>
        } @else {
          <ul class="list">
            @for (session of pagedSessions(); track session.id) {
              <li>
                <article class="history-card">
                  <div class="hc-main">
                    <p class="hc-child">{{ childName() }}</p>
                    <p class="hc-date">{{ formatDate(session) }}</p>
                  </div>
                  <div class="hc-result">
                    @if (session.result; as res) {
                      @if (res.riskPercentage !== null) {
                        <span class="hc-score">{{ res.riskPercentage }}%</span>
                      } @else {
                        <span class="hc-score">{{ res.score }}/{{ maxScore(session) }}</span>
                      }
                      <ac-screening-badge [tone]="tone(res.riskLevel)">
                        {{ label(res.riskLevel) }}
                      </ac-screening-badge>
                    } @else {
                      <ac-screening-badge tone="neutral">In progress</ac-screening-badge>
                    }
                  </div>
                  <div class="hc-action">
                    @if (session.result) {
                      <a class="hc-link" [routerLink]="['/screening/result', session.id]">
                        View details
                      </a>
                    } @else {
                      <a class="hc-link" [routerLink]="['/screening/session', session.id]">
                        Continue
                      </a>
                    }
                  </div>
                </article>
              </li>
            }
          </ul>

          <ac-ui-pagination
            [page]="page()"
            [totalPages]="totalPages()"
            [total]="filteredSessions().length"
            [perPage]="pageSize"
            itemNoun="screenings"
            label="Screening history pages"
            (pageChange)="onPageChange($event)"
          />
        }
      }
    </section>
  `,
  styles: [
    `
      :host {
        --scr-teal: var(--ac-color-action);
        --scr-teal-ink: var(--ac-color-ink-f);
        --scr-text: var(--ac-color-text);
        --scr-text-muted: var(--ac-color-text-muted);
        --scr-surface: var(--ac-color-surface);
        --scr-banner-bg: var(--ac-color-surface-info);
        --scr-banner-border: var(--ac-color-border-info);
        --scr-avatar-bg: var(--ac-color-primary);
        --scr-divider: var(--ac-color-grey-pale);
        --scr-radius: 12px;
        --scr-shadow-card: var(--ac-shadow-sm);
        --scr-error: var(--ac-color-alert-text);
        display: block;
      }

      .history {
        max-width: 820px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .state-center {
        display: flex;
        justify-content: center;
        padding: 60px 0;
      }

      .head h1 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: 800;
      }

      .subtitle {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: 15px;
        line-height: var(--ac-line-body);
      }

      .section-label {
        margin: 0 0 12px;
        color: var(--scr-text-muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .child-row {
        display: flex;
        gap: 14px;
        overflow-x: auto;
        padding-bottom: 4px;
      }

      /* Developmental Risk Progression Timeline */
      .timeline-section {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-xl);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 24px 28px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--ac-color-border-subtle);
        padding-bottom: 14px;
      }

      .timeline-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .timeline-icon {
        font-size: 24px;
        line-height: 1;
      }

      .timeline-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .timeline-header p {
        margin: 3px 0 0;
        font-size: 13px;
        color: var(--scr-text-muted);
      }

      .timeline-count-badge {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
      }

      .timeline-track-container {
        padding: 6px 0;
      }

      .timeline-track {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .timeline-node {
        display: flex;
        gap: 18px;
        position: relative;
      }

      .node-marker-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 24px;
        flex: 0 0 24px;
      }

      .node-dot {
        width: 14px;
        height: 14px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-border-grey);
        box-shadow: 0 0 0 3px var(--ac-color-surface);
        z-index: 1;
        margin-top: 14px;
      }

      .node-dot.low {
        background: var(--ac-color-success);
        box-shadow: 0 0 0 3px var(--ac-color-tint-green-soft);
      }

      .node-dot.moderate {
        background: var(--ac-color-warning);
        box-shadow: 0 0 0 3px var(--ac-color-tint-amber-wash);
      }

      .node-dot.high {
        background: var(--ac-color-attention);
        box-shadow: 0 0 0 3px var(--ac-color-alert-surface);
      }

      .node-line {
        width: 2px;
        flex: 1;
        background: var(--ac-color-slate-line-mist);
        margin: 4px 0;
      }

      .node-content-card {
        flex: 1;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface-slate);
        padding: 16px 18px;
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        transition:
          border-color var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
      }

      .node-content-card:hover {
        border-color: var(--ac-color-action);
        box-shadow: var(--ac-shadow-xs);
      }

      .node-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .node-date-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .node-date {
        font-size: 15px;
        color: var(--ac-color-text-strong);
      }

      .node-age-band {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-subtle);
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
      }

      .node-metrics-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .node-score-box {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }

      .metric-label {
        color: var(--scr-text-muted);
      }

      .metric-val {
        color: var(--ac-color-text-strong);
        font-size: 15px;
      }

      .node-delta-box {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
      }

      .node-delta-box.improved {
        color: var(--ac-color-success);
        background: var(--ac-color-tint-green-soft);
      }

      .node-delta-box.elevated {
        color: var(--ac-color-attention);
        background: var(--ac-color-alert-surface);
      }

      .node-delta-box.stable {
        color: var(--ac-color-text-slate);
        background: var(--ac-color-surface);
      }

      .node-recom {
        margin: 0;
        font-size: 12px;
        line-height: 1.45;
        color: var(--ac-color-text-body);
      }

      .node-action-line {
        margin-top: 4px;
      }

      .view-session-link {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        text-decoration: none;
        transition: color var(--ac-motion-fast);
      }

      .view-session-link:hover {
        text-decoration: underline;
        color: var(--ac-color-action);
      }

      /* Toolbar & List */
      .toolbar-row {
        display: flex;
        justify-content: flex-start;
      }

      .primary-link {
        color: var(--ac-color-action-deep);
        font-weight: 700;
      }

      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .history-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--ac-radius-lg);
        box-shadow: var(--ac-shadow-xs);
        padding: 18px 22px;
        transition:
          border-color var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
      }

      .history-card:hover {
        border-color: var(--ac-color-action);
        box-shadow: var(--ac-shadow-sm);
      }

      .hc-main {
        flex: 1 1 auto;
        min-width: 0;
      }

      .hc-child {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-weight: 700;
        font-size: 16px;
      }

      .hc-date {
        margin: 2px 0 0;
        color: var(--scr-text-muted);
        font-size: 13px;
        font-weight: 600;
      }

      .hc-result {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .hc-score {
        color: var(--ac-color-action-deep);
        font-weight: 800;
        font-size: 18px;
      }

      .hc-action {
        flex: 0 0 auto;
      }

      .hc-link {
        color: var(--ac-color-action-deep);
        font-weight: 700;
        text-decoration: underline;
        white-space: nowrap;
      }

      @media (max-width: 560px) {
        .history-card {
          flex-wrap: wrap;
          gap: 10px;
        }

        .hc-main {
          flex-basis: 100%;
        }

        .timeline-section {
          padding: 18px 16px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningHistoryPage implements OnInit {
  private readonly childrenApi = inject(ChildrenApi);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly route = inject(ActivatedRoute);

  readonly children = signal<readonly ChildResponse[]>([]);
  readonly selectedChildId = signal<string | null>(null);
  readonly sessions = signal<readonly ScreeningSessionDetailResponse[]>([]);
  readonly riskFilter = signal<RiskFilter>('ALL');
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly childName = computed(
    () => this.children().find((child) => child.id === this.selectedChildId())?.firstName ?? '',
  );

  readonly filteredSessions = computed(() => {
    const filter = this.riskFilter();
    const all = this.sessions();
    if (filter === 'ALL') return all;
    return all.filter((session) => session.result?.riskLevel === filter);
  });

  protected readonly pageSize = PAGE_SIZE;

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSessions().length / PAGE_SIZE)),
  );

  readonly pagedSessions = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredSessions().slice(start, start + PAGE_SIZE);
  });

  readonly timelineItems = computed<TimelineItem[]>(() => {
    const completed = this.sessions()
      .filter((s) => s.result !== null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return completed.map((s, index) => {
      const res = s.result!;
      const scoreLabel = res.riskPercentage !== null ? `${res.riskPercentage}%` : `${res.score}`;
      const item: TimelineItem = {
        id: s.id,
        date: this.formatDate(s),
        ageBand: s.ageBand,
        riskLevel: res.riskLevel,
        scoreLabel,
        scorePercentage: res.riskPercentage,
        recommendation: res.recommendation,
      };

      if (index > 0) {
        const prevRes = completed[index - 1]?.result;
        if (prevRes && res.riskPercentage !== null && prevRes.riskPercentage !== null) {
          const delta = res.riskPercentage - prevRes.riskPercentage;
          if (delta < 0) {
            item.comparison = {
              direction: 'improved',
              arrow: '▼',
              text: `${Math.abs(delta)}% reduction in risk indicator`,
            };
          } else if (delta > 0) {
            item.comparison = {
              direction: 'elevated',
              arrow: '▲',
              text: `+${delta}% shift in risk indicator`,
            };
          } else {
            item.comparison = {
              direction: 'stable',
              arrow: '■',
              text: 'Risk indicator stable',
            };
          }
        }
      }

      return item;
    });
  });

  readonly emptyMessage = computed(() =>
    this.riskFilter() === 'ALL'
      ? 'When you complete a screening it will appear here.'
      : 'No screenings match this risk level.',
  );

  ngOnInit() {
    this.loading.set(true);
    const requestedChildId = this.route.snapshot.queryParamMap.get('childId');
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        const match = requestedChildId
          ? children.find((c) => c.id === requestedChildId)
          : undefined;
        const target = match ?? children[0];
        if (!target) {
          this.loading.set(false);
          return;
        }
        this.selectedChildId.set(target.id);
        this.loadSessions(target.id);
      },
      error: () => {
        this.error.set('Screening history could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });

    this.route.queryParamMap.subscribe((params) => {
      const childId = params.get('childId');
      if (childId && childId !== this.selectedChildId()) {
        const found = this.children().find((c) => c.id === childId);
        if (found) {
          this.onSelectChild(found.id);
        }
      }
    });
  }

  onSelectChild(childId: string) {
    this.selectedChildId.set(childId);
    this.riskFilter.set('ALL');
    this.page.set(1);
    this.loading.set(true);
    this.loadSessions(childId);
  }

  onFilterChange(filter: RiskFilter) {
    this.riskFilter.set(filter);
    this.page.set(1);
  }

  onPageChange(page: number) {
    this.page.set(page);
  }

  tone(riskLevel: RiskLevel): BadgeTone {
    return riskTones[riskLevel];
  }

  label(riskLevel: RiskLevel): string {
    return riskLabels[riskLevel];
  }

  maxScore(session: ScreeningSessionDetailResponse): number {
    return session.answers.length * MAX_ANSWER_VALUE;
  }

  formatDate(session: ScreeningSessionDetailResponse): string {
    const iso = session.submittedAt ?? session.result?.analyzedAt ?? session.createdAt;
    return new Date(iso).toLocaleDateString();
  }

  private loadSessions(childId: string) {
    this.screeningApi.listSessions(childId).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Screening history could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
