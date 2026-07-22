import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChildResponse, RiskLevel, ScreeningSessionDetailResponse } from '@auticare/contracts';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from './data-access/screening.api';
import { ChildSelectCardComponent } from './components/child-select-card.component';
import { ScreeningBadgeComponent } from './components/screening-badge.component';
import type { BadgeTone } from './components/screening-badge.component';
import { ScreeningHistoryFilterComponent } from './components/screening-history-filter.component';
import type { RiskFilter } from './components/screening-history-filter.component';
import { ScreeningPaginationComponent } from './components/screening-pagination.component';

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

@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiEmptyStateComponent,
    ChildSelectCardComponent,
    ScreeningBadgeComponent,
    ScreeningHistoryFilterComponent,
    ScreeningPaginationComponent,
  ],
  template: `
    <section class="history">
      <header class="head">
        <h1>Screening History</h1>
        <p class="subtitle">Review your child's past screenings and revisit their results.</p>
      </header>

      @if (loading()) {
        <p class="status">Loading…</p>
      } @else if (error()) {
        <p class="status error" role="alert">{{ error() }}</p>
      } @else {
        @if (children().length > 1) {
          <section class="select-child" role="group" aria-labelledby="history-child-label">
            <p id="history-child-label" class="section-label">Child</p>
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

        <div class="toolbar">
          <ac-screening-history-filter
            [value]="riskFilter()"
            (valueChange)="onFilterChange($event)"
          />
        </div>

        @if (!filteredSessions().length) {
          <ac-ui-empty-state title="No screenings to show" [message]="emptyMessage()" />
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

          @if (totalPages() > 1) {
            <ac-screening-pagination
              [page]="page()"
              [totalPages]="totalPages()"
              (pageChange)="onPageChange($event)"
            />
          }
        }
      }
    </section>
  `,
  styles: [
    `
      /* Named constants for this feature. Values mirror the app shell's existing
         hardcoded hex/px exactly (no token system). NOTE: duplicated across
         screening pages — candidate for extraction into a shared theme file. */
      :host {
        --scr-teal: #3d6375;
        --scr-teal-ink: #103443;
        --scr-text: #263238;
        --scr-text-muted: #66747a;
        --scr-surface: #ffffff;
        --scr-banner-bg: #e8f6ff;
        --scr-banner-border: #d4e6ef;
        --scr-avatar-bg: #8db4c8;
        --scr-divider: #c1d3dc;
        --scr-radius: 12px;
        --scr-shadow-card: 0 12px 30px rgb(41 74 90 / 0.08);
        --scr-error: #a23434;
        display: block;
      }

      .history {
        max-width: 760px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }
      .head h1 {
        margin: 0 0 8px;
        color: var(--scr-teal);
        font-size: 34px;
        font-weight: 800;
      }
      .subtitle {
        margin: 0;
        color: var(--scr-text-muted);
        font-size: 16px;
      }
      .status {
        text-align: center;
        color: var(--scr-text-muted);
        font-weight: 600;
      }
      .status.error {
        color: var(--scr-error);
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
      .toolbar {
        display: flex;
        justify-content: flex-start;
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
        border-radius: var(--scr-radius);
        box-shadow: var(--scr-shadow-card);
        padding: 18px 22px;
      }
      .hc-main {
        flex: 1 1 auto;
        min-width: 0;
      }
      .hc-child {
        margin: 0;
        color: var(--scr-text);
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
        color: var(--scr-teal);
        font-weight: 800;
        font-size: 18px;
      }
      .hc-action {
        flex: 0 0 auto;
      }
      .hc-link {
        color: var(--scr-teal);
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
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningHistoryPage implements OnInit {
  private readonly childrenApi = inject(ChildrenApi);
  private readonly screeningApi = inject(ScreeningApi);

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

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSessions().length / PAGE_SIZE)),
  );

  readonly pagedSessions = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredSessions().slice(start, start + PAGE_SIZE);
  });

  readonly emptyMessage = computed(() =>
    this.riskFilter() === 'ALL'
      ? 'When you complete a screening it will appear here.'
      : 'No screenings match this risk level.',
  );

  ngOnInit() {
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        const first = children[0];
        if (!first) {
          this.loading.set(false);
          return;
        }
        this.selectedChildId.set(first.id);
        this.loadSessions(first.id);
      },
      error: () => {
        this.error.set('Screening history could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
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
