import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import type {
  ActivityProgressResponse,
  ActivityResponse,
  PaginationMeta,
  ParentActivityReportResponse,
  RiskLevel,
  ScreeningSessionDetailResponse,
} from '@auticare/contracts';
import { ChildrenApi } from '../children/data-access/children.api';
import { ParentActivityApi } from './data-access/parent-activity.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { ActivitiesApi } from '../activities/data-access/activities.api';
import { attachmentUrl } from '../../core/config/attachment-url';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { ScreeningBadgeComponent } from '../screening/components/screening-badge.component';
import type { BadgeTone } from '../screening/components/screening-badge.component';

interface EngagementMetric {
  label: string;
  value: number; // 0-100 for bar width
  display: string; // e.g. "8/10"
  color: string;
}

interface AttachmentImage {
  url: string;
  label: string;
}

interface AttachmentDocument {
  url: string;
  name: string;
}

interface TrajectoryPoint {
  index: number;
  id: string;
  date: string;
  score: number;
  riskPercentage: number;
  riskLevel: RiskLevel;
  x: number;
  y: number;
  deltaText?: string;
  isImprovement?: boolean;
}

const METRIC_DEFS: { key: string; label: string; color: string }[] = [
  { key: 'participation', label: 'Participation', color: 'var(--ac-color-green-500)' },
  { key: 'communication', label: 'Communication', color: 'var(--ac-color-blue-500)' },
  { key: 'socialInteraction', label: 'Social Skills', color: 'var(--ac-color-status-purple)' },
  { key: 'attention', label: 'Attention', color: 'var(--ac-color-amber-500)' },
  {
    key: 'emotionalRegulation',
    label: 'Emotional Regulation',
    color: 'var(--ac-color-status-pink)',
  },
  { key: 'taskCompletion', label: 'Task Completion', color: 'var(--ac-color-status-cyan)' },
];

@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiEmptyStateComponent,
    UiMessageComponent,
    UiPaginationComponent,
    UiSpinnerComponent,
    ScreeningBadgeComponent,
  ],
  selector: 'ac-parent-report-detail-page',
  template: `
    <div class="page-layout">
      <main class="main-content">
        <!-- Topbar Child Switcher & Page Header -->
        <header class="topbar">
          <div class="child-switcher">
            <label class="child-switcher-label" for="child-select">Child:</label>
            <select id="child-select" class="child-select" (change)="onChildChange($event)">
              @for (child of children(); track child.id) {
                <option [value]="child.id" [selected]="child.id === selectedChildId()">
                  {{ child.lastName ? child.firstName + ' ' + child.lastName : child.firstName }}
                </option>
              }
            </select>
          </div>
          <div class="topbar-actions">
            @if (activeTab() === 'reports' && reports().length > 1) {
              <select
                class="child-select report-select"
                [value]="selectedReportId() ?? ''"
                (change)="onReportChange($event)"
                aria-label="Choose report"
              >
                @for (item of reports(); track item.id) {
                  <option [value]="item.id">{{ item.activityDate }} — {{ item.title }}</option>
                }
              </select>
            }
            <a class="back-link" routerLink="/dashboard">← Back to Dashboard</a>
          </div>
          @if (activeTab() === 'reports' && pagination(); as meta) {
            @if (meta.totalPages > 1) {
              <ac-ui-pagination
                [page]="meta.page"
                [totalPages]="meta.totalPages"
                [total]="meta.total"
                [perPage]="meta.limit"
                itemNoun="reports"
                label="Report pages"
                (pageChange)="goToReportPage($event)"
              />
            }
          }
        </header>

        <!-- Printable Clinical Header (Visible only when printed) -->
        <header class="print-header" aria-hidden="true">
          <div class="print-header-top">
            <div class="print-logo">
              <span class="print-brand">AutiCare</span>
              <span class="print-tagline"
                >Clinical Developmental Health &amp; Progress Summary</span
              >
            </div>
            <div class="print-generated">
              <span>Generated: </span>
              <strong>{{ currentDateFormatted() }}</strong>
            </div>
          </div>
          <div class="print-patient-meta">
            <div class="meta-item">
              <span class="meta-label">Child:</span>
              <span class="meta-value">{{ selectedChildName() }}</span>
            </div>
            @if (selectedChild()?.dateOfBirth) {
              <div class="meta-item">
                <span class="meta-label">DOB:</span>
                <span class="meta-value">{{ formatDate(selectedChild()?.dateOfBirth) }}</span>
              </div>
            }
            <div class="meta-item">
              <span class="meta-label">Clinical Risk Level:</span>
              <span class="meta-value">{{
                latestRiskLevel() ? riskLabel(latestRiskLevel()) : 'Not Screened'
              }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Completed Sessions:</span>
              <span class="meta-value">{{ completedScreenings().length }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Home Milestones:</span>
              <span class="meta-value">{{ completedActivities().length }}</span>
            </div>
          </div>
          <div class="print-disclaimer">
            <p>
              <strong>Clinical Notice:</strong> This developmental trajectory and milestone summary
              compiles screening results, clinical observations, and completed developmental
              activities recorded in AutiCare. It is intended to support discussions with
              pediatricians, therapists, and educators and does not replace formal medical
              evaluation.
            </p>
          </div>
        </header>

        <!-- View Navigation Tabs -->
        <nav class="progress-tabs" aria-label="Progress navigation tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'trajectory'"
            (click)="setTab('trajectory')"
          >
            <span class="tab-icon" aria-hidden="true">📈</span>
            <span>Developmental Trajectory</span>
            @if (completedScreenings().length > 0) {
              <span class="tab-count">{{ completedScreenings().length }}</span>
            }
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'reports'"
            (click)="setTab('reports')"
          >
            <span class="tab-icon" aria-hidden="true">📋</span>
            <span>School Observation Reports</span>
            @if (reports().length > 0) {
              <span class="tab-count">{{ reports().length }}</span>
            }
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'milestones'"
            (click)="setTab('milestones')"
          >
            <span class="tab-icon" aria-hidden="true">⭐</span>
            <span>Home Milestones</span>
            @if (completedActivities().length > 0) {
              <span class="tab-count">{{ completedActivities().length }}</span>
            }
          </button>
        </nav>

        <!-- ================= TAB 1: MILESTONES ================= -->
        @if (activeTab() === 'milestones') {
          <div class="milestones-container">
            <div class="tab-header-row">
              <div class="tab-title-group">
                <h2>Developmental Milestones &amp; Daily Practice</h2>
                <p>
                  Chronological record of skill practices, sensory exercises, and parent
                  reflections.
                </p>
              </div>
              <div class="tab-actions-group">
                <a
                  class="btn-primary-compact"
                  [routerLink]="['/activities']"
                  [queryParams]="{ childId: selectedChildId() }"
                >
                  <span>Explore Activities Catalogue →</span>
                </a>
                <button
                  type="button"
                  class="print-btn"
                  (click)="printReport()"
                  aria-label="Print Milestones Summary"
                >
                  <svg
                    aria-hidden="true"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path
                      d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                    ></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  <span>Print Summary</span>
                </button>
              </div>
            </div>

            <!-- Milestones Stat Strip -->
            <div class="milestones-metrics-grid">
              <div class="metric-card">
                <div class="metric-card-header">
                  <span class="metric-card-icon" aria-hidden="true">✓</span>
                  <span class="metric-card-label">Total Completed</span>
                </div>
                <div class="metric-card-stat">{{ completedActivities().length }}</div>
                <span class="metric-card-subtext">Verified home exercises</span>
              </div>
              <div class="metric-card">
                <div class="metric-card-header">
                  <span class="metric-card-icon" aria-hidden="true">🧩</span>
                  <span class="metric-card-label">Active Domains</span>
                </div>
                <div class="metric-card-stat">{{ activeDomainsCount() }}</div>
                <span class="metric-card-subtext">Skill domains practiced</span>
              </div>
              <div class="metric-card">
                <div class="metric-card-header">
                  <span class="metric-card-icon" aria-hidden="true">📅</span>
                  <span class="metric-card-label">Latest Activity</span>
                </div>
                <div class="metric-card-stat metric-card-stat-date">
                  {{ latestActivityDateLabel() }}
                </div>
                <span class="metric-card-subtext">Most recent exercise date</span>
              </div>
            </div>

            <!-- Filter Toolbar -->
            <div class="milestone-filter-toolbar">
              <div class="search-input-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  class="search-input"
                  placeholder="Search milestones by title or observation notes…"
                  [value]="milestoneSearchQuery()"
                  (input)="onMilestoneSearch($event)"
                  aria-label="Search milestones"
                />
                @if (milestoneSearchQuery()) {
                  <button
                    type="button"
                    class="clear-search-btn"
                    (click)="clearMilestoneSearch()"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                }
              </div>

              <!-- Domain Filter Pills -->
              <div
                class="domain-pills"
                role="radiogroup"
                aria-label="Filter by developmental domain"
              >
                @for (d of milestoneDomains; track d.value) {
                  <button
                    type="button"
                    class="domain-pill-btn"
                    [class.active]="selectedMilestoneDomain() === d.value"
                    (click)="setMilestoneDomain(d.value)"
                  >
                    {{ d.label }}
                  </button>
                }
              </div>

              <div class="milestone-count-badge">
                Showing {{ displayedMilestones().length }} of {{ completedActivities().length }}
              </div>
            </div>

            <!-- Milestones Feed -->
            @if (displayedMilestones().length === 0) {
              @if (completedActivities().length === 0) {
                <ac-ui-empty-state
                  title="No milestones completed yet"
                  message="Completed home exercises and sensory play activities will appear here in a developmental timeline."
                >
                  <div class="empty-state-actions">
                    <a
                      class="btn-primary"
                      [routerLink]="['/activities']"
                      [queryParams]="{ childId: selectedChildId() }"
                    >
                      Browse Recommended Activities
                    </a>
                  </div>
                </ac-ui-empty-state>
              } @else {
                <div class="empty-box">
                  <p>No completed milestones match the selected domain or search filter.</p>
                  <button
                    type="button"
                    class="btn-secondary-compact"
                    (click)="resetMilestoneFilters()"
                  >
                    Clear Filters
                  </button>
                </div>
              }
            } @else {
              <div class="milestone-feed-grid">
                @for (item of displayedMilestones(); track item.id) {
                  <article class="milestone-card">
                    <div class="milestone-card-top">
                      <div class="milestone-badge-icon" aria-hidden="true">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div class="milestone-header-info">
                        <div class="milestone-tag-row">
                          <span
                            class="domain-badge"
                            [attr.data-domain]="getDomainForActivity(item)"
                          >
                            {{ getDomainForActivity(item) }}
                          </span>
                          <span class="completed-date-pill">
                            {{ formatDate(item.completedAt) }}
                          </span>
                        </div>
                        <h3 class="milestone-title">{{ item.activityTitle }}</h3>
                      </div>
                    </div>

                    @if (item.parentObservation) {
                      <div class="milestone-observation-box">
                        <span class="quote-glyph" aria-hidden="true">“</span>
                        <p class="observation-quote">{{ item.parentObservation }}</p>
                      </div>
                    }

                    <div class="milestone-card-footer">
                      <a
                        class="repeat-link"
                        [routerLink]="['/activities']"
                        [queryParams]="{ childId: selectedChildId() }"
                      >
                        Practice Again ↻
                      </a>
                    </div>
                  </article>
                }
              </div>
            }
          </div>
        }

        <!-- ================= TAB 2: DEVELOPMENTAL TRAJECTORY ================= -->
        @else if (activeTab() === 'trajectory') {
          @if (loadingTrajectory()) {
            <ac-ui-spinner label="Loading developmental trajectory…" />
          } @else {
            <div class="trajectory-container">
              <!-- Interactive Toolbar for Screen -->
              <div class="trajectory-toolbar">
                <div class="trajectory-heading">
                  <h2>Developmental Trajectory &amp; Clinical History</h2>
                  <p>
                    Longitudinal screening progression, clinical risk evolution, and developmental
                    trajectory.
                  </p>
                </div>
                <div class="tab-actions-group">
                  <a
                    class="btn-primary-compact"
                    [routerLink]="['/screening']"
                    [queryParams]="{ childId: selectedChildId() }"
                  >
                    + New Clinical Screening
                  </a>
                  <button
                    type="button"
                    class="btn-download-clinical"
                    (click)="downloadClinicalReport()"
                    aria-label="Download Clinical Report"
                  >
                    <svg
                      aria-hidden="true"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download Clinical Report</span>
                  </button>
                  <button
                    type="button"
                    class="print-btn"
                    (click)="printReport()"
                    aria-label="Print Trajectory Report"
                  >
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path
                        d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                      ></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    <span>Print Trajectory Report</span>
                  </button>
                </div>
              </div>

              <!-- Overview Cards -->
              <div class="trajectory-overview-grid">
                <div class="overview-card">
                  <div class="overview-card-header">
                    <span class="overview-label">Clinical Risk Level</span>
                    <ac-screening-badge [tone]="riskTone(latestRiskLevel())">
                      {{ riskLabel(latestRiskLevel()) }}
                    </ac-screening-badge>
                  </div>
                  <div class="overview-stat">
                    {{ latestRiskLevel() ? riskLabel(latestRiskLevel()) : 'Not Screened' }}
                  </div>
                  <span class="overview-subtext">
                    @if (latestScreening(); as s) {
                      Latest assessment on {{ formatDate(s.submittedAt || s.startedAt) }}
                    } @else {
                      No clinical screening completed yet
                    }
                  </span>
                </div>

                <div class="overview-card">
                  <div class="overview-card-header">
                    <span class="overview-label">Screening History</span>
                  </div>
                  <div class="overview-stat">{{ completedScreenings().length }}</div>
                  <span class="overview-subtext">Completed clinical sessions</span>
                </div>

                <div class="overview-card">
                  <div class="overview-card-header">
                    <span class="overview-label">Trajectory Trend</span>
                  </div>
                  <div class="overview-stat overview-trend-stat">
                    {{ overallTrajectoryTrend() }}
                  </div>
                  <span class="overview-subtext">Longitudinal risk shift over time</span>
                </div>
              </div>

              <!-- Home Activity Milestones by Domain Counter Strip -->
              <section class="trajectory-section domain-counters-section">
                <div class="section-header-row">
                  <div class="section-title-group">
                    <span class="card-icon" aria-hidden="true">⭐</span>
                    <h2>Home Activity Milestones by Domain</h2>
                  </div>
                  <a
                    class="view-milestones-link"
                    (click)="setTab('milestones')"
                    role="button"
                    tabindex="0"
                  >
                    View Milestones Feed →
                  </a>
                </div>
                <div class="domain-milestones-grid">
                  <div class="domain-counter-card" data-domain="Sensory">
                    <div class="domain-counter-top">
                      <span class="domain-icon" aria-hidden="true">✨</span>
                      <span class="domain-label">Sensory</span>
                    </div>
                    <div class="domain-count-stat">{{ domainMilestoneCounts().sensory }}</div>
                    <span class="domain-subtext">Completed routines</span>
                  </div>
                  <div class="domain-counter-card" data-domain="Motor">
                    <div class="domain-counter-top">
                      <span class="domain-icon" aria-hidden="true">🏃</span>
                      <span class="domain-label">Motor</span>
                    </div>
                    <div class="domain-count-stat">{{ domainMilestoneCounts().motor }}</div>
                    <span class="domain-subtext">Gross &amp; fine motor</span>
                  </div>
                  <div class="domain-counter-card" data-domain="Social">
                    <div class="domain-counter-top">
                      <span class="domain-icon" aria-hidden="true">🤝</span>
                      <span class="domain-label">Social</span>
                    </div>
                    <div class="domain-count-stat">{{ domainMilestoneCounts().social }}</div>
                    <span class="domain-subtext">Social interaction</span>
                  </div>
                  <div class="domain-counter-card" data-domain="Communication">
                    <div class="domain-counter-top">
                      <span class="domain-icon" aria-hidden="true">💬</span>
                      <span class="domain-label">Communication</span>
                    </div>
                    <div class="domain-count-stat">{{ domainMilestoneCounts().communication }}</div>
                    <span class="domain-subtext">Speech &amp; picture matching</span>
                  </div>
                </div>
              </section>

              <!-- Trajectory Visualizer Progression Chart -->
              @if (trajectoryChartData(); as chart) {
                <section class="trajectory-section visualizer-section">
                  <div class="section-header-row">
                    <div class="section-title-group">
                      <span class="card-icon" aria-hidden="true">📈</span>
                      <h2>Longitudinal Risk Trajectory Visualizer</h2>
                    </div>
                    <div class="chart-legend">
                      <span class="legend-item"
                        ><span class="legend-dot dot-low"></span> Low Risk (&lt;30%)</span
                      >
                      <span class="legend-item"
                        ><span class="legend-dot dot-mod"></span> Moderate (30–65%)</span
                      >
                      <span class="legend-item"
                        ><span class="legend-dot dot-high"></span> Elevated (&gt;65%)</span
                      >
                    </div>
                  </div>

                  <div class="chart-wrapper">
                    <svg
                      class="trajectory-chart-svg"
                      viewBox="0 0 560 180"
                      preserveAspectRatio="xMidYMid meet"
                      role="img"
                      aria-label="Developmental risk trajectory progression over time"
                    >
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stop-color="var(--ac-color-teal-500)"
                            stop-opacity="0.32"
                          />
                          <stop
                            offset="100%"
                            stop-color="var(--ac-color-teal-500)"
                            stop-opacity="0.02"
                          />
                        </linearGradient>
                      </defs>

                      <!-- Grid Lines (25%, 50%, 75%) -->
                      <line
                        x1="40"
                        y1="120"
                        x2="520"
                        y2="120"
                        stroke="var(--ac-color-slate-line-mist)"
                        stroke-dasharray="3 3"
                      />
                      <line
                        x1="40"
                        y1="85"
                        x2="520"
                        y2="85"
                        stroke="var(--ac-color-slate-line-mist)"
                        stroke-dasharray="3 3"
                      />
                      <line
                        x1="40"
                        y1="50"
                        x2="520"
                        y2="50"
                        stroke="var(--ac-color-slate-line-mist)"
                        stroke-dasharray="3 3"
                      />

                      <text x="34" y="123" text-anchor="end" class="chart-axis-label">25%</text>
                      <text x="34" y="88" text-anchor="end" class="chart-axis-label">50%</text>
                      <text x="34" y="53" text-anchor="end" class="chart-axis-label">75%</text>

                      <!-- Area under curve -->
                      @if (chart.areaD) {
                        <path [attr.d]="chart.areaD" fill="url(#chartGradient)" />
                      }

                      <!-- Connecting line -->
                      @if (chart.pathD) {
                        <path
                          [attr.d]="chart.pathD"
                          fill="none"
                          stroke="var(--ac-color-teal-600)"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      }

                      <!-- Plotted Points -->
                      @for (p of chart.points; track p.id) {
                        <g class="chart-point-group">
                          <!-- Outer glow circle -->
                          <circle
                            [attr.cx]="p.x"
                            [attr.cy]="p.y"
                            r="8"
                            fill="var(--ac-color-teal-100)"
                            stroke="var(--ac-color-teal-600)"
                            stroke-width="2"
                          />
                          <!-- Center dot -->
                          <circle
                            [attr.cx]="p.x"
                            [attr.cy]="p.y"
                            r="4"
                            fill="var(--ac-color-teal-600)"
                          />
                          <!-- Percentage text above -->
                          <text
                            [attr.x]="p.x"
                            [attr.y]="p.y - 12"
                            text-anchor="middle"
                            class="chart-point-label"
                          >
                            {{ p.riskPercentage }}%
                          </text>
                          <!-- Date label below -->
                          <text
                            [attr.x]="p.x"
                            [attr.y]="168"
                            text-anchor="middle"
                            class="chart-axis-date"
                          >
                            {{ p.date }}
                          </text>
                        </g>
                      }
                    </svg>
                  </div>

                  <!-- Trend Deltas Summary -->
                  <div class="trend-deltas-strip">
                    @for (p of chart.points; track p.id) {
                      <div class="trend-node-summary">
                        <span class="node-date">{{ p.date }}</span>
                        <ac-screening-badge [tone]="riskTone(p.riskLevel)">
                          {{ riskLabel(p.riskLevel) }} ({{ p.riskPercentage }}%)
                        </ac-screening-badge>
                        @if (p.deltaText) {
                          <span
                            class="delta-badge"
                            [class.delta-improving]="p.isImprovement"
                            [class.delta-shifting]="!p.isImprovement"
                          >
                            {{ p.isImprovement ? '▼ ' : '▲ ' }}{{ p.deltaText }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- Clinical Screening Timeline -->
              <section class="trajectory-section">
                <div class="section-header-row">
                  <div class="section-title-group">
                    <span class="card-icon" aria-hidden="true">🩺</span>
                    <h2>Screening History &amp; Diagnostic Assessments</h2>
                  </div>
                  <a
                    class="btn-primary-compact"
                    [routerLink]="['/screening']"
                    [queryParams]="{ childId: selectedChildId() }"
                  >
                    + New Screening
                  </a>
                </div>

                @if (screeningSessions().length === 0) {
                  <div class="empty-box">
                    <p>
                      No screening assessments recorded for this child yet. Periodic screenings
                      provide early developmental guidance.
                    </p>
                    <a
                      class="btn-primary-compact"
                      [routerLink]="['/screening']"
                      [queryParams]="{ childId: selectedChildId() }"
                    >
                      Start First Screening Assessment
                    </a>
                  </div>
                } @else {
                  <div class="timeline-list">
                    @for (session of screeningSessions(); track session.id) {
                      <div class="timeline-card">
                        <div class="timeline-card-header">
                          <div class="timeline-meta">
                            <span class="timeline-date">{{
                              formatDate(session.submittedAt || session.startedAt)
                            }}</span>
                            @if (session.ageBand) {
                              <span class="timeline-band">{{ session.ageBand }}</span>
                            }
                          </div>
                          @if (session.result) {
                            <ac-screening-badge [tone]="riskTone(session.result.riskLevel)">
                              {{ riskLabel(session.result.riskLevel) }}
                            </ac-screening-badge>
                          } @else {
                            <span class="timeline-band">In Progress</span>
                          }
                        </div>
                        @if (session.result; as res) {
                          <p class="timeline-body">{{ res.recommendation }}</p>
                          <div class="timeline-footer">
                            <a class="view-link" [routerLink]="['/screening/result', session.id]">
                              View Full Assessment Result →
                            </a>
                          </div>
                        } @else {
                          <p class="timeline-body">
                            This screening session was started but has not yet been completed.
                          </p>
                          <div class="timeline-footer">
                            <a class="view-link" [routerLink]="['/screening/session', session.id]">
                              Resume Session →
                            </a>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </section>
            </div>
          }
        }

        <!-- ================= TAB 3: SCHOOL REPORTS ================= -->
        @else if (activeTab() === 'reports') {
          @if (loading()) {
            <ac-ui-spinner label="Loading report…" />
          } @else if (error()) {
            <ac-ui-message tone="error">
              {{ error() }}
              <button type="button" class="btn-secondary" (click)="loadReports()">Try again</button>
            </ac-ui-message>
          } @else if (!report()) {
            <ac-ui-empty-state
              title="No activity reports yet"
              message="Reports will appear here once your child's school shares them. In the meantime, you can explore developmental milestones, clinical screening history, and home activities."
            >
              <div class="empty-state-actions">
                <button type="button" class="btn-primary" (click)="setTab('milestones')">
                  Explore Milestones
                </button>
                <button type="button" class="btn-secondary" (click)="setTab('trajectory')">
                  View Developmental Trajectory
                </button>
                <a
                  class="btn-secondary"
                  [routerLink]="['/screening']"
                  [queryParams]="{ childId: selectedChildId() }"
                >
                  Start Screening Assessment
                </a>
              </div>
            </ac-ui-empty-state>
          } @else if (report(); as r) {
            <div class="report-container">
              @if (reports().length > 1) {
                <div class="chronological-reports-bar">
                  <span class="bar-label"
                    >Chronological Observation Reports ({{ reports().length }}):</span
                  >
                  <div class="report-chips-list">
                    @for (item of reports(); track item.id) {
                      <button
                        type="button"
                        class="report-chip-card"
                        [class.active]="item.id === selectedReportId()"
                        (click)="selectedReportId.set(item.id)"
                      >
                        <div class="chip-avatar" aria-hidden="true">
                          {{ getReporterInitials(item.reporter) }}
                        </div>
                        <div class="chip-details">
                          <span class="chip-date">{{ formatDate(item.activityDate) }}</span>
                          <span class="chip-title">{{ item.title }}</span>
                        </div>
                        <span class="domain-pill-sm">{{ item.activityCategory }}</span>
                      </button>
                    }
                  </div>
                </div>
              }

              <header class="report-header">
                <div class="report-header-top">
                  <div class="report-title-group">
                    <div class="report-tags-row">
                      <span class="domain-badge" [attr.data-domain]="r.activityCategory">
                        {{ r.activityCategory }}
                      </span>
                      <span class="date-pill">{{ formatDate(r.activityDate) }}</span>
                    </div>
                    <h1>Activity Report: {{ r.title }}</h1>
                  </div>
                  <div class="tab-actions-group">
                    <button
                      type="button"
                      class="btn-download-clinical"
                      (click)="downloadClinicalReport()"
                      aria-label="Download Clinical Summary"
                    >
                      <svg
                        aria-hidden="true"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <span>Download Clinical Summary</span>
                    </button>
                    <button
                      type="button"
                      class="print-btn"
                      (click)="printReport()"
                      aria-label="Print School Report"
                    >
                      <svg
                        aria-hidden="true"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path
                          d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                        ></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                      </svg>
                      <span>Print Report</span>
                    </button>
                  </div>
                </div>
                <div class="report-meta">
                  <div class="teacher-author-chip">
                    <div class="author-avatar" aria-hidden="true">
                      {{ getReporterInitials(r.reporter) }}
                    </div>
                    <div class="author-info">
                      <span class="teacher-name">
                        {{
                          r.reporter
                            ? r.reporter.firstName + ' ' + r.reporter.lastName
                            : 'Classroom Specialist'
                        }}
                      </span>
                      @if (r.schoolName) {
                        <span class="school-chip">{{ r.schoolName }}</span>
                      }
                    </div>
                  </div>
                </div>
              </header>

              <div class="report-grid">
                <div class="report-main">
                  <section class="report-card">
                    <div class="card-header">
                      <span class="card-icon" aria-hidden="true">✎</span>
                      <h2>Teacher Observations</h2>
                    </div>
                    <p class="observation-text">
                      {{
                        r.teacherObservation ||
                          'No teacher observations were included in this report.'
                      }}
                    </p>
                    @if (r.reporter) {
                      <p class="teacher-name">
                        {{ r.reporter.firstName }} {{ r.reporter.lastName }} · {{ r.schoolName }}
                      </p>
                    }
                  </section>

                  <!-- Teacher Accommodation Tags Card -->
                  <section class="report-card accommodation-card">
                    <div class="card-header">
                      <span class="card-icon" aria-hidden="true">🛡️</span>
                      <h2>Classroom Accommodations &amp; Adaptations</h2>
                    </div>
                    <p class="section-subtext">
                      Sensory and classroom adaptations provided during this observation:
                    </p>
                    <div class="accommodation-tags-list">
                      @for (tag of getAccommodationTags(r); track tag) {
                        <span class="accommodation-tag">
                          <span class="tag-icon" aria-hidden="true">✓</span>
                          <span>{{ tag }}</span>
                        </span>
                      }
                    </div>
                  </section>

                  <section class="report-card">
                    <div class="card-header">
                      <span class="card-icon" aria-hidden="true">▥</span>
                      <h2>Performance Metrics</h2>
                    </div>
                    @if (engagementMetrics().length) {
                      <div class="engagement-breakdown">
                        @for (metric of engagementMetrics(); track metric.label) {
                          <div class="metric-row">
                            <div class="metric-heading">
                              <span class="metric-label">{{ metric.label }}</span>
                              <span class="metric-value">{{ metric.display }}</span>
                            </div>
                            <div
                              class="metric-bar-bg"
                              role="progressbar"
                              [attr.aria-label]="metric.label"
                              [attr.aria-valuenow]="metric.value / 10"
                              aria-valuemin="0"
                              aria-valuemax="10"
                            >
                              <div
                                class="metric-bar-fill"
                                [style.width.%]="metric.value"
                                [style.background-color]="metric.color"
                              ></div>
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="empty-note">Performance scores were not included in this report.</p>
                    }
                  </section>

                  <section class="report-card">
                    <div class="card-header">
                      <span class="card-icon" aria-hidden="true">▧</span>
                      <h2>Activity Photos &amp; Documents</h2>
                    </div>
                    @if (images().length || documents().length) {
                      <div class="activity-moments">
                        @for (image of images(); track image.url) {
                          <a
                            class="moment-card"
                            [href]="image.url"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              [src]="image.url"
                              [alt]="image.label"
                              class="moment-image"
                              loading="lazy"
                            />
                          </a>
                        }
                        @for (doc of documents(); track doc.url) {
                          <a
                            class="document-link"
                            [href]="doc.url"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span class="document-icon" aria-hidden="true">▤</span>
                            <span class="document-name">{{ doc.name }}</span>
                            <span class="document-open">Open ↗</span>
                          </a>
                        }
                      </div>
                    } @else {
                      <p class="empty-note">No activity photos or documents were attached.</p>
                    }
                  </section>
                </div>

                <aside class="report-sidebar">
                  <section class="report-card">
                    <div class="card-header">
                      <span class="card-icon" aria-hidden="true">◷</span>
                      <h2>Activity Summary</h2>
                    </div>
                    <p class="summary-description">
                      {{ r.summary || 'No activity summary was included.' }}
                    </p>
                    <div class="summary-facts">
                      <span class="fact-chip">Category: {{ r.activityCategory }}</span>
                      @if (r.duration !== null) {
                        <span class="fact-chip">Duration: {{ r.duration }} min</span>
                      }
                    </div>
                  </section>

                  <section class="report-card">
                    <div class="card-header">
                      <span class="card-icon" aria-hidden="true">⌂</span>
                      <h2>Home Recommendations</h2>
                    </div>
                    @if (recommendationItems().length) {
                      <ul class="recommendation-list">
                        @for (item of recommendationItems(); track $index) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    } @else {
                      <p class="empty-note">No specific recommendations included.</p>
                    }
                  </section>

                  <div class="action-buttons">
                    <button type="button" class="btn-primary" (click)="downloadReport()">
                      <span aria-hidden="true">↓</span>
                      <span>Download Full Report</span>
                    </button>
                    <button type="button" class="btn-secondary" (click)="shareReport()">
                      <span aria-hidden="true">↗</span>
                      <span>Share with Specialist</span>
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [
    `
      .page-layout {
        display: flex;
        min-height: 100vh;
        background: var(--ac-color-surface-slate);
      }

      .main-content {
        flex: 1;
        max-width: 1440px;
        margin: 0 auto;
        padding: 24px 32px 56px;
        overflow-y: auto;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        gap: 20px;
        flex-wrap: wrap;
      }

      .child-switcher {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .child-switcher-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-slate-600);
      }

      .child-select {
        padding: 9px 14px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md, 12px);
        font-size: 14px;
        font-weight: 600;
        background: white;
        color: var(--ac-color-slate-800);
        outline: none;
        cursor: pointer;
        transition: border-color var(--ac-motion-fast, 150ms);
      }

      .child-select:focus {
        border-color: var(--ac-color-action-alt);
      }

      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .back-link {
        color: var(--ac-color-action-alt);
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      .report-select {
        max-width: 320px;
      }

      /* Tab Navigation */
      .progress-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        border-bottom: 2px solid var(--ac-color-border-slate);
        padding-bottom: 2px;
        overflow-x: auto;
      }

      .tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 18px;
        border: none;
        background: transparent;
        font-size: 15px;
        font-weight: 600;
        color: var(--ac-color-slate-600);
        cursor: pointer;
        border-bottom: 3px solid transparent;
        margin-bottom: -4px;
        transition: all var(--ac-motion-fast, 150ms) ease;
        white-space: nowrap;
      }

      .tab-btn:hover {
        color: var(--ac-color-action-alt);
      }

      .tab-btn.active {
        color: var(--ac-color-action-alt);
        border-bottom-color: var(--ac-color-action-alt);
        font-weight: 700;
      }

      .tab-icon {
        font-size: 16px;
      }

      .tab-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: var(--ac-radius-pill, 999px);
        font-size: 12px;
        font-weight: 700;
        background: var(--ac-color-border-slate);
        color: var(--ac-color-slate-800);
      }

      .tab-btn.active .tab-count {
        background: var(--ac-color-blue-tint-sky);
        color: var(--ac-color-action-alt);
      }

      /* Common Tab Header & Actions */
      .tab-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .tab-title-group h2 {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .tab-title-group p {
        margin: 0;
        font-size: 14px;
        color: var(--ac-color-text-muted);
      }

      .tab-actions-group {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .print-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 15px;
        border-radius: var(--ac-radius-md, 12px);
        font-size: 13px;
        font-weight: 600;
        border: 1px solid var(--ac-color-border-slate);
        background: white;
        color: var(--ac-color-slate-800);
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms) ease;
      }

      .print-btn:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-blue-tint-sky);
        color: var(--ac-color-action-alt);
      }

      .btn-download-clinical {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 15px;
        border-radius: var(--ac-radius-md, 12px);
        font-size: 13px;
        font-weight: 600;
        border: 1px solid var(--ac-color-border-grey);
        background: white;
        color: var(--ac-color-action-alt);
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms) ease;
      }

      .btn-download-clinical:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-blue-tint-sky);
      }

      /* Domain Milestones Counters Section */
      .domain-counters-section {
        margin: 20px 0;
      }

      .view-milestones-link {
        color: var(--ac-color-action-alt);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
      }

      .view-milestones-link:hover {
        text-decoration: underline;
      }

      .domain-milestones-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
        margin-top: 14px;
      }

      .domain-counter-card {
        padding: 16px;
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md, 12px);
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: var(--ac-shadow-xs);
        transition: transform var(--ac-motion-fast, 150ms);
      }

      .domain-counter-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-sm);
      }

      .domain-counter-top {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .domain-icon {
        font-size: 18px;
      }

      .domain-label {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .domain-count-stat {
        font-size: 1.8rem;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-action-alt);
      }

      .domain-subtext {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .btn-primary-compact {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 15px;
        border-radius: var(--ac-radius-md, 12px);
        font-size: 13px;
        font-weight: 600;
        background: var(--ac-color-action-alt);
        color: white;
        text-decoration: none;
        cursor: pointer;
        border: none;
        transition: background var(--ac-motion-fast, 150ms);
      }

      .btn-primary-compact:hover {
        background: var(--ac-color-ink-a);
      }

      .btn-secondary-compact {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 15px;
        border-radius: var(--ac-radius-md, 12px);
        font-size: 13px;
        font-weight: 600;
        background: white;
        color: var(--ac-color-action-alt);
        border: 1px solid var(--ac-color-action-alt);
        cursor: pointer;
        text-decoration: none;
      }

      .btn-secondary-compact:hover {
        background: var(--ac-color-blue-tint-sky);
      }

      /* Milestones View */
      .milestones-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .milestones-metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .metric-card {
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg, 16px);
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: var(--ac-shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
      }

      .metric-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .metric-card-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: var(--ac-radius-sm, 8px);
        background: var(--ac-color-tint-green);
        color: var(--ac-color-status-green);
        font-size: 13px;
        font-weight: 700;
      }

      .metric-card-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-slate-600);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .metric-card-stat {
        font-size: 26px;
        font-weight: 700;
        color: var(--ac-color-slate-800);
        line-height: 1.1;
      }

      .metric-card-stat-date {
        font-size: 18px;
        font-weight: 600;
      }

      .metric-card-subtext {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }

      /* Milestones Filter Toolbar */
      .milestone-filter-toolbar {
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg, 16px);
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
        box-shadow: var(--ac-shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
      }

      .search-input-wrapper {
        position: relative;
        flex: 1;
        min-width: 220px;
      }

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 13px;
        color: var(--ac-color-slate-500);
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 8px 32px 8px 34px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-pill, 999px);
        font-size: 13px;
        outline: none;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-slate-800);
        box-sizing: border-box;
      }

      .search-input:focus {
        border-color: var(--ac-color-action-alt);
        background: white;
      }

      .clear-search-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: transparent;
        font-size: 11px;
        color: var(--ac-color-slate-500);
        cursor: pointer;
      }

      .domain-pills {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .domain-pill-btn {
        padding: 6px 12px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-pill, 999px);
        background: white;
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-slate-600);
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms) ease;
      }

      .domain-pill-btn:hover {
        border-color: var(--ac-color-action-alt);
        color: var(--ac-color-action-alt);
      }

      .domain-pill-btn.active {
        background: var(--ac-color-action-alt);
        color: white;
        border-color: var(--ac-color-action-alt);
      }

      .milestone-count-badge {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-slate-500);
        white-space: nowrap;
        margin-left: auto;
      }

      /* Milestones Feed Grid */
      .milestone-feed-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }

      .milestone-card {
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg, 16px);
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: var(--ac-shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
        transition:
          transform var(--ac-motion-fast, 150ms) ease,
          box-shadow var(--ac-motion-fast, 150ms) ease;
      }

      .milestone-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-sm, 0 4px 6px rgba(0, 0, 0, 0.06));
      }

      .milestone-card-top {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .milestone-badge-icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-md, 12px);
        background: var(--ac-color-tint-green);
        color: var(--ac-color-status-green);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .milestone-header-info {
        flex: 1;
        min-width: 0;
      }

      .milestone-tag-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        flex-wrap: wrap;
      }

      .domain-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill, 999px);
        font-size: 11px;
        font-weight: 700;
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action-alt);
      }

      .domain-badge[data-domain='Sensory'] {
        background: var(--ac-color-amber-tint-100);
        color: var(--ac-color-amber-800);
      }

      .domain-badge[data-domain='Communication'] {
        background: var(--ac-color-blue-tint-sky);
        color: var(--ac-color-action-alt);
      }

      .domain-badge[data-domain='Social Skills'] {
        background: var(--ac-color-tint-purple);
        color: var(--ac-color-status-purple);
      }

      .domain-badge[data-domain='Motor Skills'] {
        background: var(--ac-color-tint-cyan);
        color: var(--ac-color-status-cyan);
      }

      .completed-date-pill {
        font-size: 11px;
        color: var(--ac-color-slate-500);
        font-weight: 500;
      }

      .milestone-title {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-slate-800);
        line-height: 1.35;
      }

      .milestone-observation-box {
        position: relative;
        background: var(--ac-color-surface-slate);
        border-left: 3px solid var(--ac-color-action-alt);
        border-radius: 0 var(--ac-radius-md, 12px) var(--ac-radius-md, 12px) 0;
        padding: 10px 14px 10px 24px;
      }

      .quote-glyph {
        position: absolute;
        left: 8px;
        top: 4px;
        font-size: 20px;
        line-height: 1;
        color: var(--ac-color-action-alt);
        opacity: 0.6;
        font-family: serif;
      }

      .observation-quote {
        margin: 0;
        font-size: 13px;
        font-style: italic;
        color: var(--ac-color-slate-700);
        line-height: 1.5;
      }

      .milestone-card-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: auto;
      }

      .repeat-link {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-action-alt);
        text-decoration: none;
      }

      .repeat-link:hover {
        text-decoration: underline;
      }

      /* Trajectory View Styles */
      .trajectory-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .trajectory-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .trajectory-heading h2 {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .trajectory-heading p {
        margin: 0;
        font-size: 14px;
        color: var(--ac-color-text-muted);
      }

      .trajectory-overview-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .overview-card {
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg, 16px);
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: var(--ac-shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
      }

      .overview-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .overview-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-slate-600);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .overview-stat {
        font-size: 26px;
        font-weight: 700;
        color: var(--ac-color-slate-800);
        line-height: 1.1;
      }

      .overview-trend-stat {
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-teal-600);
      }

      .overview-subtext {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }

      .trajectory-section {
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg, 16px);
        padding: 24px;
        box-shadow: var(--ac-shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
      }

      .section-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        gap: 12px;
        flex-wrap: wrap;
      }

      .section-title-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .section-title-group h2 {
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-slate-800);
        margin: 0;
      }

      /* Trajectory Chart SVG */
      .chart-legend {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--ac-color-slate-600);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .dot-low {
        background: var(--ac-color-status-green);
      }

      .dot-mod {
        background: var(--ac-color-status-amber);
      }

      .dot-high {
        background: var(--ac-color-status-red);
      }

      .chart-wrapper {
        width: 100%;
        max-width: 720px;
        margin: 0 auto 16px;
      }

      .trajectory-chart-svg {
        width: 100%;
        height: auto;
        display: block;
      }

      .chart-axis-label {
        font-size: 10px;
        font-weight: 600;
        fill: var(--ac-color-slate-500);
      }

      .chart-axis-date {
        font-size: 11px;
        font-weight: 600;
        fill: var(--ac-color-slate-600);
      }

      .chart-point-label {
        font-size: 11px;
        font-weight: 700;
        fill: var(--ac-color-slate-800);
      }

      .trend-deltas-strip {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-slate-line-mist);
      }

      .trend-node-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }

      .node-date {
        font-weight: 600;
        color: var(--ac-color-slate-700);
      }

      .delta-badge {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
      }

      .delta-improving {
        background: var(--ac-color-tint-green);
        color: var(--ac-color-status-green);
      }

      .delta-shifting {
        background: var(--ac-color-tint-pink);
        color: var(--ac-color-status-pink);
      }

      .timeline-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .timeline-card {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md, 12px);
        padding: 16px 20px;
        background: var(--ac-color-surface-slate);
        display: flex;
        flex-direction: column;
        gap: 10px;
        transition: border-color var(--ac-motion-fast, 150ms) ease;
      }

      .timeline-card:hover {
        border-color: var(--ac-color-action-alt);
      }

      .timeline-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .timeline-meta {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .timeline-date {
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-slate-800);
      }

      .timeline-band {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--ac-color-border-slate);
        color: var(--ac-color-slate-700);
        font-weight: 500;
      }

      .timeline-body {
        font-size: 14px;
        color: var(--ac-color-slate-700);
        line-height: 1.5;
        margin: 0;
      }

      .timeline-footer {
        display: flex;
        justify-content: flex-end;
      }

      .view-link {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-action-alt);
        text-decoration: none;
      }

      .view-link:hover {
        text-decoration: underline;
      }

      /* School Reports View Styles */
      .report-container {
        width: 100%;
      }

      .report-header {
        margin-bottom: 24px;
      }

      .report-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }

      .report-title-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .report-tags-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .date-pill {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-text-muted);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill, 999px);
      }

      .report-header h1 {
        margin: 0;
        font-size: clamp(22px, 3vw, 28px);
        font-weight: 700;
        color: var(--ac-color-slate-800);
      }

      .report-meta {
        display: flex;
        gap: 14px;
        align-items: center;
        flex-wrap: wrap;
      }

      .teacher-author-chip {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .author-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--ac-color-tint-blue-mist);
        border: 2px solid var(--ac-color-border-info);
        color: var(--ac-color-action-alt);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
      }

      .author-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .teacher-name {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: var(--ac-color-slate-800);
      }

      .date {
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }

      .school-chip {
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action-alt);
        font-size: 13px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--ac-radius-sm, 8px);
      }

      /* Chronological Reports Strip */
      .chronological-reports-bar {
        margin-bottom: 20px;
        padding: 14px 16px;
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md, 12px);
        box-shadow: var(--ac-shadow-xs);
      }

      .bar-label {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        margin-bottom: 10px;
      }

      .report-chips-list {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 4px;
      }

      .report-chip-card {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        border-radius: var(--ac-radius-md, 10px);
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface-slate);
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms);
        white-space: nowrap;
        text-align: left;
      }

      .report-chip-card:hover {
        background: var(--ac-color-tint-blue-wash);
        border-color: var(--ac-color-action-alt);
      }

      .report-chip-card.active {
        background: var(--ac-color-tint-blue-mist);
        border-color: var(--ac-color-action-alt);
      }

      .chip-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: white;
        border: 1px solid var(--ac-color-border-grey);
        color: var(--ac-color-action-alt);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
      }

      .chip-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .chip-date {
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .chip-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .domain-pill-sm {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill, 999px);
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-action-alt);
      }

      /* Classroom Accommodation Tags */
      .accommodation-card {
        margin-top: 4px;
      }

      .section-subtext {
        margin: -6px 0 10px;
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .accommodation-tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .accommodation-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: var(--ac-radius-pill, 999px);
        background: var(--ac-color-green-tint-50);
        border: 1px solid var(--ac-color-green-border-soft);
        color: var(--ac-color-green-700);
        font-size: 13px;
        font-weight: 600;
      }

      .accommodation-tag .tag-icon {
        font-size: 11px;
        color: var(--ac-color-green-600);
      }

      .report-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
        gap: 24px;
      }

      .report-main {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .report-sidebar {
        display: flex;
        flex-direction: column;
        gap: 20px;
        position: sticky;
        top: 20px;
      }

      .report-card {
        background: white;
        border: 1px solid var(--ac-color-slate-border-dim, var(--ac-color-border-slate));
        border-radius: var(--ac-radius-lg, 16px);
        padding: 22px;
        box-shadow: var(--ac-shadow-xs);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }

      .card-icon {
        display: inline-flex;
        width: 32px;
        height: 32px;
        align-items: center;
        justify-content: center;
        border-radius: var(--ac-radius-sm, 8px);
        background: var(--ac-color-blue-surface-pale, var(--ac-color-tint-blue-mist));
        color: var(--ac-color-action-alt);
        font-size: 16px;
      }

      .card-header h2 {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: var(--ac-color-slate-800);
      }

      .observation-text,
      .summary-description {
        margin: 0;
        color: var(--ac-color-slate-700);
        font-size: 14px;
        line-height: 1.7;
        white-space: pre-wrap;
      }

      .teacher-name {
        margin-top: 12px;
        margin-bottom: 0;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        font-size: 13px;
      }

      .engagement-breakdown {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .metric-row {
        display: block;
      }

      .metric-heading {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .metric-label {
        font-size: 13px;
        color: var(--ac-color-slate-600);
        font-weight: 600;
      }

      .metric-value {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-slate-800);
      }

      .metric-bar-bg {
        height: 8px;
        background: var(--ac-color-border-slate);
        border-radius: var(--ac-radius-pill, 999px);
        overflow: hidden;
      }

      .metric-bar-fill {
        height: 100%;
        border-radius: var(--ac-radius-pill, 999px);
        transition: width var(--ac-motion-normal, 300ms) ease;
      }

      .activity-moments {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .moment-card {
        display: block;
        border-radius: var(--ac-radius-md, 12px);
        overflow: hidden;
        aspect-ratio: 16/10;
        border: 1px solid var(--ac-color-border-slate);
      }

      .moment-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .document-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md, 12px);
        text-decoration: none;
        color: var(--ac-color-slate-700);
        transition: all var(--ac-motion-fast, 150ms);
      }

      .document-link:hover {
        background: var(--ac-color-blue-tint-sky);
        border-color: var(--ac-color-action-alt);
      }

      .document-icon {
        font-size: 18px;
      }

      .document-name {
        flex: 1;
        font-size: 13px;
        font-weight: 600;
        word-break: break-all;
      }

      .document-open {
        font-size: 11px;
        font-weight: 600;
        color: var(--ac-color-action-alt);
      }

      .summary-facts {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }

      .fact-chip {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-slate-600);
        font-size: 12px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill, 999px);
        border: 1px solid var(--ac-color-border-slate);
      }

      .recommendation-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 0;
        padding-left: 18px;
        color: var(--ac-color-slate-700);
        font-size: 13px;
        line-height: 1.6;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .btn-primary,
      .btn-secondary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 18px;
        border-radius: var(--ac-radius-md, 12px);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all var(--ac-motion-fast, 150ms);
        border: none;
        text-decoration: none;
      }

      .btn-primary {
        background: var(--ac-color-action-alt);
        color: white;
      }

      .btn-primary:hover {
        background: var(--ac-color-ink-a);
      }

      .btn-secondary {
        background: white;
        color: var(--ac-color-action-alt);
        border: 1px solid var(--ac-color-action-alt);
      }

      .btn-secondary:hover {
        background: var(--ac-color-blue-tint-sky);
      }

      .empty-note {
        margin: 0;
        color: var(--ac-color-text-slate);
        font-size: 13px;
      }

      .empty-box {
        text-align: center;
        padding: 32px 16px;
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg, 16px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .empty-box p {
        font-size: 14px;
        color: var(--ac-color-text-slate);
        max-width: 440px;
        margin: 0;
      }

      .empty-state-actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
        flex-wrap: wrap;
        justify-content: center;
      }

      /* Responsive Breakpoints */
      @media (max-width: 1024px) {
        .report-grid {
          grid-template-columns: 1fr;
        }

        .report-sidebar {
          position: static;
        }
      }

      @media (max-width: 768px) {
        .main-content {
          padding: 16px 16px 48px;
        }

        .milestones-metrics-grid,
        .trajectory-overview-grid {
          grid-template-columns: 1fr;
        }

        .topbar {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .topbar-actions {
          justify-content: space-between;
        }

        .activity-moments {
          grid-template-columns: 1fr;
        }
      }

      /* Print Stylesheet */
      .print-header {
        display: none;
      }

      @media print {
        .topbar,
        .progress-tabs,
        .trajectory-toolbar,
        .tab-actions-group,
        .topbar-actions,
        .btn-primary-compact,
        .btn-secondary-compact,
        .milestone-filter-toolbar,
        .repeat-link,
        .view-link,
        .empty-state-actions,
        .action-buttons,
        .back-link,
        nav,
        button {
          display: none !important;
        }

        body,
        .page-layout,
        .main-content {
          background: white !important;
          color: black !important;
          padding: 0 !important;
          margin: 0 !important;
          min-height: auto !important;
          overflow: visible !important;
        }

        .print-header {
          display: block !important;
          border-bottom: 2px solid var(--ac-color-slate-line-mist);
          padding-bottom: 14px;
          margin-bottom: 18px;
        }

        .print-header-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
        }

        .print-brand {
          font-size: 20px;
          font-weight: 700;
          color: var(--ac-color-text-strong);
          display: block;
        }

        .print-tagline {
          font-size: 11px;
          color: var(--ac-color-text-muted);
        }

        .print-generated {
          font-size: 11px;
          color: var(--ac-color-text-muted);
        }

        .print-patient-meta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          background: var(--ac-color-surface-slate);
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 10px;
        }

        .meta-item {
          display: flex;
          gap: 6px;
          font-size: 11px;
        }

        .meta-label {
          font-weight: 600;
          color: var(--ac-color-text-muted);
        }

        .meta-value {
          font-weight: 700;
          color: var(--ac-color-text-strong);
        }

        .print-disclaimer {
          border: 1px solid var(--ac-color-slate-line-mist);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 10px;
          line-height: 1.35;
          color: var(--ac-color-text-muted);
        }

        .print-disclaimer p {
          margin: 0;
        }

        .trajectory-overview-grid,
        .milestones-metrics-grid {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 10px !important;
          margin-bottom: 16px !important;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .overview-card,
        .metric-card {
          border: 1px solid var(--ac-color-slate-line-mist) !important;
          background: white !important;
          box-shadow: none !important;
          padding: 10px !important;
        }

        .trajectory-section,
        .report-card,
        .milestone-card {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 16px !important;
          border: 1px solid var(--ac-color-slate-line-mist) !important;
          box-shadow: none !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly activityApi = inject(ParentActivityApi);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly activitiesApi = inject(ActivitiesApi);

  readonly activeTab = signal<'milestones' | 'trajectory' | 'reports'>('reports');
  readonly children = signal<
    Array<{
      id: string;
      firstName: string;
      lastName?: string | null;
      dateOfBirth?: string;
    }>
  >([]);
  readonly selectedChildId = signal<string | null>(null);

  readonly selectedChild = computed(() => {
    const id = this.selectedChildId();
    return this.children().find((c) => c.id === id) ?? null;
  });

  readonly selectedChildName = computed(() => {
    const child = this.selectedChild();
    if (!child) return '';
    return child.lastName ? `${child.firstName} ${child.lastName}` : child.firstName;
  });

  printReport() {
    window.print();
  }

  currentDateFormatted(): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date());
  }

  // School reports state
  readonly reports = signal<ParentActivityReportResponse[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly reportPage = signal(1);
  readonly selectedReportId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Trajectory & Milestones state
  readonly screeningSessions = signal<ScreeningSessionDetailResponse[]>([]);
  readonly homeActivities = signal<ActivityProgressResponse[]>([]);
  readonly activityCatalogue = signal<ActivityResponse[]>([]);
  readonly loadingTrajectory = signal(false);

  // Milestones filter state
  readonly selectedMilestoneDomain = signal<string>('ALL');
  readonly milestoneSearchQuery = signal<string>('');

  readonly milestoneDomains = [
    { value: 'ALL', label: 'All Domains' },
    { value: 'Sensory', label: 'Sensory' },
    { value: 'Communication', label: 'Communication' },
    { value: 'Social Skills', label: 'Social Skills' },
    { value: 'Motor Skills', label: 'Motor Skills' },
    { value: 'Daily Living', label: 'Daily Living' },
  ];

  readonly activityCatalogueMap = computed(() => {
    const map = new Map<string, string>();
    for (const item of this.activityCatalogue()) {
      map.set(item.id, item.category);
    }
    return map;
  });

  readonly completedScreenings = computed(() =>
    this.screeningSessions().filter((s) => s.result !== null),
  );

  readonly latestScreening = computed(() => this.completedScreenings()[0] ?? null);

  readonly latestRiskLevel = computed<RiskLevel | null>(
    () => this.latestScreening()?.result?.riskLevel ?? null,
  );

  readonly completedActivities = computed(() =>
    this.homeActivities().filter((a) => a.completedAt !== null),
  );

  readonly activeDomainsCount = computed(() => {
    const domains = new Set<string>();
    for (const item of this.completedActivities()) {
      domains.add(this.getDomainForActivity(item));
    }
    return domains.size;
  });

  readonly domainMilestoneCounts = computed(() => {
    const list = this.completedActivities();
    let sensory = 0;
    let motor = 0;
    let social = 0;
    let communication = 0;
    for (const item of list) {
      const d = this.getDomainForActivity(item).toLowerCase();
      if (d.includes('sensor')) sensory++;
      else if (d.includes('motor')) motor++;
      else if (d.includes('social')) social++;
      else if (d.includes('communicat')) communication++;
    }
    return { sensory, motor, social, communication, total: list.length };
  });

  readonly latestActivityDateLabel = computed(() => {
    const acts = this.completedActivities();
    if (acts.length === 0) return 'None yet';
    return this.formatDate(acts[0]?.completedAt);
  });

  readonly displayedMilestones = computed(() => {
    const filterDomain = this.selectedMilestoneDomain();
    const query = this.milestoneSearchQuery().trim().toLowerCase();
    return this.completedActivities().filter((act) => {
      const domain = this.getDomainForActivity(act);
      const matchesDomain =
        filterDomain === 'ALL' || domain.toLowerCase() === filterDomain.toLowerCase();
      if (!matchesDomain) return false;
      if (!query) return true;
      const title = (act.activityTitle || '').toLowerCase();
      const obs = (act.parentObservation || '').toLowerCase();
      return title.includes(query) || obs.includes(query);
    });
  });

  /** Chronologically sorted screenings (oldest to newest) for chart plotting */
  readonly chronologicalScreenings = computed(() => {
    return [...this.completedScreenings()].sort((a, b) => {
      const dateA = a.submittedAt || a.startedAt;
      const dateB = b.submittedAt || b.startedAt;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  });

  readonly trajectoryChartData = computed(() => {
    const screenings = this.chronologicalScreenings();
    if (screenings.length === 0) return null;
    const width = 560;
    const height = 180;
    const paddingX = 40;
    const paddingTop = 30;
    const paddingBottom = 40;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingTop - paddingBottom;

    const points: TrajectoryPoint[] = screenings.map((s, i) => {
      const pct = Math.max(0, Math.min(100, s.result?.riskPercentage ?? 50));
      const x =
        screenings.length === 1 ? width / 2 : paddingX + (i / (screenings.length - 1)) * plotWidth;
      const y = paddingTop + ((100 - pct) / 100) * plotHeight;
      let deltaText: string | undefined;
      let isImprovement: boolean | undefined;

      if (i > 0) {
        const prevPct = screenings[i - 1].result?.riskPercentage ?? 50;
        const diff = pct - prevPct;
        if (diff < 0) {
          deltaText = `${Math.abs(diff)}% reduction`;
          isImprovement = true;
        } else if (diff > 0) {
          deltaText = `${diff}% shift`;
          isImprovement = false;
        } else {
          deltaText = 'stable';
          isImprovement = true;
        }
      }

      return {
        index: i,
        id: s.id,
        date: this.formatDate(s.submittedAt || s.startedAt),
        score: s.result?.score ?? 0,
        riskPercentage: pct,
        riskLevel: s.result?.riskLevel ?? 'LOW',
        x: Math.round(x),
        y: Math.round(y),
        deltaText,
        isImprovement,
      };
    });

    const pathD =
      points.length === 1
        ? ''
        : points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const areaD =
      points.length > 1
        ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
        : '';

    return { width, height, points, pathD, areaD };
  });

  readonly overallTrajectoryTrend = computed(() => {
    const points = this.trajectoryChartData()?.points ?? [];
    if (points.length === 0) return 'No Screenings Completed';
    if (points.length === 1) return 'Baseline Assessment Established';
    const first = points[0].riskPercentage;
    const latest = points[points.length - 1].riskPercentage;
    const diff = latest - first;
    if (diff < -5) return `Risk Reduced by ${Math.abs(diff)}% (Improving Trend)`;
    if (diff > 5) return `Mild Risk Increase (+${diff}%) — Review Specialist`;
    return 'Stable Developmental Trajectory';
  });

  /** The report currently displayed (most recent by default). */
  readonly report = computed(() => {
    const id = this.selectedReportId();
    const list = this.reports();
    if (id) return list.find((report) => report.id === id) ?? null;
    return list[0] ?? null;
  });

  /** The performanceMetrics JSON (0-10 sliders) mapped to progress bars. */
  readonly engagementMetrics = computed<EngagementMetric[]>(() => {
    const raw = (this.report()?.performanceMetrics ?? null) as Record<string, unknown> | null;
    const metrics: EngagementMetric[] = [];
    for (const def of METRIC_DEFS) {
      const value = raw?.[def.key];
      if (typeof value !== 'number' || Number.isNaN(value)) {
        metrics.push({ label: def.label, value: 0, display: '—/10', color: def.color });
        continue;
      }
      const clamped = Math.max(0, Math.min(10, value));
      metrics.push({
        label: def.label,
        value: clamped * 10,
        display: `${Math.round(clamped)}/10`,
        color: def.color,
      });
    }
    return metrics;
  });

  /** photoUrls split into images (grid) and documents (links). */
  readonly images = computed<AttachmentImage[]>(() => {
    const report = this.report();
    const urls = report?.photoUrls ?? [];
    if (!report) return [];
    return urls
      .filter((url) => this.isImage(url))
      .map((url, index) => ({ url: attachmentUrl(report.id, url), label: `Photo ${index + 1}` }));
  });

  readonly documents = computed<AttachmentDocument[]>(() => {
    const report = this.report();
    const urls = report?.photoUrls ?? [];
    if (!report) return [];
    return urls
      .filter((url) => !this.isImage(url))
      .map((url) => ({ url: attachmentUrl(report.id, url), name: this.fileName(url) }));
  });

  readonly recommendationItems = computed<string[]>(() => {
    const text = this.report()?.recommendations?.trim() ?? '';
    if (!text) return [];
    return text
      .split(/\r?\n|(?=\s*\d+[.)]\s)/)
      .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);
  });

  setTab(tab: 'milestones' | 'trajectory' | 'reports') {
    this.activeTab.set(tab);
  }

  setMilestoneDomain(domain: string) {
    this.selectedMilestoneDomain.set(domain);
  }

  onMilestoneSearch(event: Event) {
    this.milestoneSearchQuery.set((event.target as HTMLInputElement).value);
  }

  clearMilestoneSearch() {
    this.milestoneSearchQuery.set('');
  }

  resetMilestoneFilters() {
    this.selectedMilestoneDomain.set('ALL');
    this.milestoneSearchQuery.set('');
  }

  getDomainForActivity(activity: ActivityProgressResponse): string {
    const cat = this.activityCatalogueMap().get(activity.activityId);
    if (cat) return cat;
    const title = (activity.activityTitle || '').toLowerCase();
    if (/sensory|bubble|texture|touch|sound|listen|light/i.test(title)) return 'Sensory';
    if (/speech|talk|word|language|vocal|story|read/i.test(title)) return 'Communication';
    if (/social|turn|share|friend|group|play|facial/i.test(title)) return 'Social Skills';
    if (/motor|movement|jump|catch|balance|run|climb|finger/i.test(title)) return 'Motor Skills';
    return 'Daily Living';
  }

  getReporterInitials(reporter?: { firstName: string; lastName: string } | null): string {
    if (!reporter) return 'T';
    const first = reporter.firstName?.trim()?.[0] ?? '';
    const last = reporter.lastName?.trim()?.[0] ?? '';
    return (first + last).toUpperCase() || 'T';
  }

  getAccommodationTags(report: ParentActivityReportResponse): string[] {
    const text =
      `${report.title} ${report.summary} ${report.teacherObservation || ''} ${report.recommendations || ''}`.toLowerCase();
    const tags: string[] = [];

    if (
      text.includes('noise') ||
      text.includes('headphone') ||
      text.includes('sound') ||
      text.includes('auditory') ||
      text.includes('quiet')
    ) {
      tags.push('Used Noise-Cancelling Headphones');
    }
    if (
      text.includes('break') ||
      text.includes('sensory') ||
      text.includes('calm') ||
      text.includes('bubble') ||
      text.includes('decompress') ||
      text.includes('regulation')
    ) {
      tags.push('Sensory Break Provided');
    }
    if (
      text.includes('card') ||
      text.includes('visual') ||
      text.includes('schedule') ||
      text.includes('pecs') ||
      text.includes('picture')
    ) {
      tags.push('Visual Schedule & Picture Cues');
    }
    if (
      text.includes('movement') ||
      text.includes('motor') ||
      text.includes('wobble') ||
      text.includes('walk') ||
      text.includes('seat')
    ) {
      tags.push('Movement & Flexible Seating');
    }
    if (
      text.includes('turn') ||
      text.includes('wait') ||
      text.includes('share') ||
      text.includes('praise') ||
      text.includes('token')
    ) {
      tags.push('Positive Reinforcement Tokens');
    }

    if (tags.length === 0) {
      const cat = (report.activityCategory || '').toLowerCase();
      if (cat.includes('sensor')) {
        tags.push('Used Noise-Cancelling Headphones', 'Sensory Break Provided');
      } else if (cat.includes('communicat')) {
        tags.push('Visual Schedule & Picture Cues', 'Extended Response Time');
      } else if (cat.includes('motor')) {
        tags.push('Movement & Flexible Seating', 'Sensory Break Provided');
      } else {
        tags.push('Used Noise-Cancelling Headphones', 'Sensory Break Provided');
      }
    }

    return tags.slice(0, 3);
  }

  downloadClinicalReport() {
    const child = this.selectedChild();
    const childName = this.selectedChildName() || 'Child';
    const screenings = this.completedScreenings();
    const activities = this.completedActivities();
    const reports = this.reports();
    const risk = this.latestRiskLevel() ? this.riskLabel(this.latestRiskLevel()) : 'Not Screened';
    const trend = this.overallTrajectoryTrend();

    const lines = [
      '========================================================================',
      'AUTICARE CLINICAL DEVELOPMENTAL HEALTH & PROGRESS REPORT',
      '========================================================================',
      `Child Name:         ${childName}`,
      `Date of Birth:      ${child?.dateOfBirth ? this.formatDate(child.dateOfBirth) : 'Not specified'}`,
      `Report Generated:   ${this.currentDateFormatted()}`,
      `Latest Risk Level:  ${risk}`,
      `Trajectory Trend:   ${trend}`,
      `Screening Sessions: ${screenings.length}`,
      `Home Milestones:    ${activities.length}`,
      `School Reports:     ${reports.length}`,
      '------------------------------------------------------------------------',
      '',
      '1. LONGITUDINAL SCREENING TRAJECTORY',
      '------------------------------------------------------------------------',
    ];

    if (screenings.length === 0) {
      lines.push('No completed screening assessments recorded.');
    } else {
      for (const s of screenings) {
        const date = this.formatDate(s.submittedAt || s.startedAt);
        const score = s.result?.score ?? 'N/A';
        const pct = s.result?.riskPercentage ?? 'N/A';
        const level = s.result?.riskLevel ?? 'N/A';
        const rec = s.result?.recommendation ?? '';
        lines.push(`• Assessment Date: ${date} | Score: ${score} | Risk: ${level} (${pct}%)`);
        if (rec) lines.push(`  Clinical Guidance: ${rec}`);
      }
    }

    lines.push(
      '',
      '2. HOME ACTIVITY MILESTONES BY DOMAIN',
      '------------------------------------------------------------------------',
      `• Sensory Practice:         ${this.domainMilestoneCounts().sensory} completed routines`,
      `• Gross & Fine Motor:       ${this.domainMilestoneCounts().motor} completed routines`,
      `• Social Interaction:       ${this.domainMilestoneCounts().social} completed routines`,
      `• Functional Communication: ${this.domainMilestoneCounts().communication} completed routines`,
      `• Total Milestones:         ${this.domainMilestoneCounts().total} completed routines`,
    );

    lines.push(
      '',
      '3. SCHOOL OBSERVATIONS & CLASSROOM ACCOMMODATIONS',
      '------------------------------------------------------------------------',
    );

    if (reports.length === 0) {
      lines.push('No school observation reports recorded.');
    } else {
      for (const r of reports) {
        lines.push(`• ${this.formatDate(r.activityDate)} — ${r.title} (${r.schoolName})`);
        lines.push(
          `  Category: ${r.activityCategory} | Teacher: ${r.reporter?.firstName} ${r.reporter?.lastName}`,
        );
        if (r.teacherObservation) lines.push(`  Observation: ${r.teacherObservation}`);
        const acc = this.getAccommodationTags(r).join(', ');
        if (acc) lines.push(`  Accommodations: ${acc}`);
        if (r.recommendations) lines.push(`  Home Recommendations: ${r.recommendations}`);
        lines.push('');
      }
    }

    lines.push(
      '------------------------------------------------------------------------',
      'CONFIDENTIAL CLINICAL SUMMARY — PREPARED FOR DEVELOPMENTAL PEDIATRICIAN',
      'This summary compiles home routines, validated screening trajectories,',
      'and classroom observations to facilitate multidisciplinary care coordination.',
      '========================================================================',
    );

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName =
      childName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'child';
    link.download = `clinical-developmental-report-${safeName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  riskTone(level?: RiskLevel | string | null): BadgeTone {
    switch (level) {
      case 'LOW':
        return 'positive';
      case 'MODERATE':
        return 'caution';
      case 'HIGH':
        return 'alert';
      default:
        return 'neutral';
    }
  }

  riskLabel(level?: RiskLevel | string | null): string {
    switch (level) {
      case 'LOW':
        return 'Low Risk';
      case 'MODERATE':
        return 'Moderate Risk';
      case 'HIGH':
        return 'High Risk';
      default:
        return 'Not Screened';
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date);
  }

  downloadReport() {
    const report = this.report();
    if (!report) return;
    const lines = [
      `Activity Report: ${report.title}`,
      `Date: ${this.formatDate(report.activityDate)}`,
      `School: ${report.schoolName}`,
      `Category: ${report.activityCategory}`,
      `Duration: ${report.duration ?? 'Not specified'} min`,
      '',
      'Activity Summary',
      report.summary,
      '',
      'Teacher Observations',
      report.teacherObservation || 'No teacher observations included.',
      '',
      'Performance Metrics',
      ...this.engagementMetrics().map((metric) => `${metric.label}: ${metric.display}`),
      '',
      'Home Recommendations',
      ...this.recommendationItems().map((item, index) => `${index + 1}. ${item}`),
      '',
      'Attachments',
      ...(report.photoUrls ?? []),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'activity-report'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async shareReport() {
    const report = this.report();
    if (!report) return;
    const shareData = {
      title: `Activity Report: ${report.title}`,
      text: `${report.title} — ${this.formatDate(report.activityDate)} (${report.schoolName})`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
    } else if (navigator.clipboard) {
      await navigator.clipboard
        .writeText(`${shareData.text}\n${shareData.url}`)
        .catch(() => undefined);
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const targetReportId = (params['reportId'] as string | undefined)?.trim();
      const targetChildId = (params['childId'] as string | undefined)?.trim();
      const targetTab = (params['tab'] as string | undefined)?.trim();

      if (targetTab === 'trajectory') {
        this.activeTab.set('trajectory');
      } else if (targetTab === 'milestones') {
        this.activeTab.set('milestones');
      } else if (targetReportId) {
        this.activeTab.set('reports');
      }

      this.childrenApi.listChildren().subscribe({
        next: (children) => {
          this.children.set(
            children.map((child) => ({
              id: child.id,
              firstName: child.firstName,
              lastName: child.lastName ?? null,
              dateOfBirth: child.dateOfBirth,
            })),
          );
          if (children.length === 0) {
            this.loading.set(false);
            this.loadingTrajectory.set(false);
            return;
          }

          if (targetReportId) {
            this.findAndSelectReport(children, targetReportId);
          } else {
            const childToSelect =
              targetChildId && children.some((c) => c.id === targetChildId)
                ? targetChildId
                : children[0].id;
            this.selectedChildId.set(childToSelect);
            this.loadReports();
            this.loadTrajectory(childToSelect);
          }
        },
        error: () => {
          this.loading.set(false);
          this.loadingTrajectory.set(false);
          this.error.set('Could not load your children. Please refresh the page.');
        },
      });
    });
  }

  private findAndSelectReport(
    children: Array<{
      id: string;
      firstName: string;
      lastName?: string | null;
      dateOfBirth?: string;
    }>,
    targetReportId: string,
  ) {
    this.loading.set(true);
    this.error.set(null);

    const requests = children.map((child) =>
      this.activityApi.listActivityReports(child.id).pipe(
        map((res) => ({ childId: child.id, ...res })),
        catchError(() => of(null)),
      ),
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const found = results.find(
          (res) => res && res.reports.some((r) => r.id === targetReportId),
        );

        if (found) {
          this.selectedChildId.set(found.childId);
          this.reports.set(found.reports);
          this.pagination.set(found.pagination);
          this.selectedReportId.set(targetReportId);
          this.loading.set(false);
          this.loadTrajectory(found.childId);
        } else {
          this.selectedChildId.set(children[0].id);
          this.loadReports();
          this.loadTrajectory(children[0].id);
        }
      },
      error: () => {
        this.selectedChildId.set(children[0].id);
        this.loadReports();
        this.loadTrajectory(children[0].id);
      },
    });
  }

  onChildChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedChildId.set(value);
    this.reportPage.set(1);
    this.loadReports();
    this.loadTrajectory(value);
  }

  onReportChange(event: Event) {
    this.selectedReportId.set((event.target as HTMLSelectElement).value);
  }

  goToReportPage(page: number) {
    this.reportPage.set(page);
    this.loadReports();
  }

  loadReports() {
    const childId = this.selectedChildId();
    if (!childId) return;
    this.loading.set(true);
    this.error.set(null);
    this.activityApi.listActivityReports(childId, this.reportPage()).subscribe({
      next: ({ reports, pagination }) => {
        this.reports.set(reports);
        this.pagination.set(pagination);
        this.selectedReportId.set(reports[0]?.id ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.error?.message ?? 'Could not load activity reports. Please try again.',
        );
      },
    });
  }

  loadTrajectory(childId: string) {
    if (!childId) return;
    this.loadingTrajectory.set(true);
    const catalogue$ = this.activitiesApi?.listActivities
      ? this.activitiesApi.listActivities({ childId }).pipe(catchError(() => of([])))
      : of([]);

    forkJoin({
      sessions: this.screeningApi.listSessions(childId).pipe(catchError(() => of([]))),
      activities: this.activitiesApi.listProgress(childId).pipe(catchError(() => of([]))),
      catalogue: catalogue$,
    }).subscribe({
      next: ({ sessions, activities, catalogue }) => {
        const sortedSessions = [...sessions].sort((a, b) => {
          const dateA = a.submittedAt || a.startedAt;
          const dateB = b.submittedAt || b.startedAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        this.screeningSessions.set(sortedSessions);
        this.homeActivities.set(activities);
        this.activityCatalogue.set(catalogue);
        this.loadingTrajectory.set(false);
      },
      error: () => {
        this.screeningSessions.set([]);
        this.homeActivities.set([]);
        this.activityCatalogue.set([]);
        this.loadingTrajectory.set(false);
      },
    });
  }

  private isImage(url: string): boolean {
    try {
      const extension = new URL(url, window.location.origin).pathname
        .split('.')
        .pop()
        ?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(extension ?? '');
    } catch {
      return false;
    }
  }

  private fileName(url: string): string {
    try {
      return new URL(url, window.location.origin).pathname.split('/').pop() ?? url;
    } catch {
      return url;
    }
  }
}
