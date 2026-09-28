// school-reports.page.ts — School Activity Reports list.
// Loads real submitted/draft reports for the authenticated school
// (GET /schools/reports), with status/child filters and expandable details.
// Report creation lives on the canonical form at /schools/reports/new.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SchoolsApi } from './data-access/schools.api';
import type { EnrolledStudentOption } from './data-access/schools.api';
import type { ActivityReportListItem } from '@auticare/contracts';

interface MetricRow {
  label: string;
  value: number;
}

const METRIC_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['participation', 'Participation'],
  ['communication', 'Communication'],
  ['socialInteraction', 'Social Interaction'],
  ['attention', 'Attention'],
  ['emotionalRegulation', 'Emotional Regulation'],
  ['taskCompletion', 'Task Completion'],
];

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)$/i;

@Component({
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="reports-container">
      <!-- Page Header -->
      <header class="reports-header">
        <div>
          <h1>Activity Reports</h1>
          <p class="reports-subtitle">Everything your school has recorded for its students.</p>
        </div>
        <a class="btn-new-report" routerLink="/schools/reports/new">＋ New Report</a>
      </header>

      <!-- Filters -->
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label" for="status-filter">Status</label>
          <select
            id="status-filter"
            class="filter-select"
            [value]="statusFilter()"
            (change)="onStatusChange($event)"
          >
            <option value="ALL">All</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label" for="child-filter">Student</label>
          <select
            id="child-filter"
            class="filter-select"
            [value]="childFilter()"
            (change)="onChildChange($event)"
          >
            <option value="">All students</option>
            @for (student of students(); track student.childId) {
              <option [value]="student.childId">
                {{ student.firstName }} {{ student.lastName }}
              </option>
            }
          </select>
        </div>
        <span class="filter-count">{{ filteredReports().length }} report(s)</span>
      </div>

      <!-- States -->
      @if (loading()) {
        <div class="state-card">Loading reports…</div>
      } @else if (error(); as loadError) {
        <div class="state-card state-card--error">
          {{ loadError }}
          <button type="button" class="retry-btn" (click)="loadReports()">Retry</button>
        </div>
      } @else if (filteredReports().length === 0) {
        <div class="state-card">
          @if (reports().length === 0) {
            No reports yet.
            <a routerLink="/schools/reports/new" class="inline-link">Create the first one</a>.
          } @else {
            No reports match the current filters.
          }
        </div>
      } @else {
        <!-- Report list -->
        <div class="report-list">
          @for (report of filteredReports(); track report.id) {
            <article class="report-card">
              <button
                type="button"
                class="report-card-main"
                (click)="toggleExpanded(report.id)"
                [attr.aria-expanded]="expandedId() === report.id"
              >
                <div class="report-child-block">
                  @if (report.childPhotoUrl) {
                    <img
                      class="report-avatar"
                      [src]="report.childPhotoUrl"
                      [alt]="childName(report)"
                    />
                  } @else {
                    <span class="report-avatar report-avatar--initial">{{ initial(report) }}</span>
                  }
                  <div class="report-child-meta">
                    <span class="report-child-name">{{ childName(report) }}</span>
                    <span class="report-category">{{ report.activityCategory }}</span>
                  </div>
                </div>

                <div class="report-title-block">
                  <span class="report-title">{{ report.title }}</span>
                  <span class="report-summary-preview">{{ report.summary }}</span>
                </div>

                <div class="report-side-block">
                  <span
                    class="status-badge"
                    [class.status-badge--draft]="report.status === 'DRAFT'"
                  >
                    {{ report.status === 'DRAFT' ? 'Draft' : 'Submitted' }}
                  </span>
                  <span class="report-date">{{ report.activityDate | date: 'MMM d, y' }}</span>
                  @if (report.duration) {
                    <span class="report-duration">{{ report.duration }} min</span>
                  }
                </div>

                <span
                  class="expand-chevron"
                  [class.expand-chevron--open]="expandedId() === report.id"
                  >▾</span
                >
              </button>

              @if (expandedId() === report.id) {
                <div class="report-detail">
                  <div class="detail-grid">
                    <section class="detail-section">
                      <h3>Summary</h3>
                      <p class="detail-text">{{ report.summary }}</p>
                    </section>

                    @if (metricsOf(report).length > 0) {
                      <section class="detail-section">
                        <h3>Performance</h3>
                        <div class="metric-rows">
                          @for (metric of metricsOf(report); track metric.label) {
                            <div class="metric-row">
                              <span class="metric-label">{{ metric.label }}</span>
                              <div class="metric-bar-track">
                                <div
                                  class="metric-bar-fill"
                                  [style.width.%]="metric.value * 10"
                                ></div>
                              </div>
                              <span class="metric-value">{{ metric.value }}/10</span>
                            </div>
                          }
                        </div>
                      </section>
                    }

                    @if (report.teacherObservation) {
                      <section class="detail-section">
                        <h3>Teacher Observations</h3>
                        <blockquote class="detail-quote">
                          {{ report.teacherObservation }}
                        </blockquote>
                      </section>
                    }

                    @if (report.recommendations) {
                      <section class="detail-section">
                        <h3>Recommendations</h3>
                        <p class="detail-text">{{ report.recommendations }}</p>
                      </section>
                    }

                    @if (imagesOf(report).length > 0) {
                      <section class="detail-section">
                        <h3>Photos</h3>
                        <div class="photo-grid">
                          @for (url of imagesOf(report); track url) {
                            <a [href]="url" target="_blank" rel="noopener">
                              <img class="photo-thumb" [src]="url" alt="Activity photo" />
                            </a>
                          }
                        </div>
                      </section>
                    }

                    @if (documentsOf(report).length > 0) {
                      <section class="detail-section">
                        <h3>Documents</h3>
                        <ul class="doc-list">
                          @for (url of documentsOf(report); track url) {
                            <li>
                              <a class="inline-link" [href]="url" target="_blank" rel="noopener">
                                {{ fileNameOf(url) }}
                              </a>
                            </li>
                          }
                        </ul>
                      </section>
                    }

                    <section class="detail-section detail-section--meta">
                      <h3>Recorded by</h3>
                      <p class="detail-text">
                        {{ report.reporterFirstName }} {{ report.reporterLastName }} · created
                        {{ report.createdAt | date: 'MMM d, y' }}
                      </p>
                    </section>
                  </div>
                </div>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .reports-container {
        max-width: 1080px;
        margin: 0 auto;
        padding: 28px 24px 60px;
      }
      .reports-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
      }
      .reports-header h1 {
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        color: #10303b;
      }
      .reports-subtitle {
        margin: 4px 0 0;
        color: #5b7280;
        font-size: 14px;
      }
      .btn-new-report {
        display: inline-flex;
        align-items: center;
        padding: 10px 20px;
        background: #2d6a7a;
        color: #fff;
        border-radius: 10px;
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
        white-space: nowrap;
      }
      .btn-new-report:hover {
        background: #245764;
      }

      .filters-row {
        display: flex;
        align-items: flex-end;
        gap: 16px;
        margin-bottom: 18px;
        flex-wrap: wrap;
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .filter-label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #5b7280;
      }
      .filter-select {
        min-width: 160px;
        padding: 8px 12px;
        border: 1px solid #d7e3ea;
        border-radius: 8px;
        background: #fff;
        color: #10303b;
        font-size: 14px;
      }
      .filter-count {
        margin-left: auto;
        color: #5b7280;
        font-size: 13px;
      }

      .state-card {
        padding: 32px;
        border: 1px dashed #cbd5e1;
        border-radius: 12px;
        background: #f8fafc;
        color: #475569;
        text-align: center;
        font-size: 14px;
      }
      .state-card--error {
        border-color: #fecaca;
        background: #fef2f2;
        color: #b91c1c;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }
      .retry-btn {
        padding: 6px 18px;
        border: 1px solid #b91c1c;
        border-radius: 8px;
        background: #fff;
        color: #b91c1c;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .inline-link {
        color: #2d6a7a;
        font-weight: 600;
        text-decoration: none;
      }
      .inline-link:hover {
        text-decoration: underline;
      }

      .report-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .report-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        transition: box-shadow 0.15s ease;
      }
      .report-card:hover {
        box-shadow: 0 4px 14px rgba(16, 48, 59, 0.08);
      }
      .report-card-main {
        display: grid;
        grid-template-columns: minmax(180px, 1.1fr) 2fr minmax(150px, auto) 24px;
        align-items: center;
        gap: 16px;
        width: 100%;
        padding: 14px 18px;
        background: none;
        border: 0;
        text-align: left;
        cursor: pointer;
        font: inherit;
      }
      .report-child-block {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .report-avatar {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        object-fit: cover;
        background: #eef8fc;
        border: 1px solid #e2e8f0;
        flex-shrink: 0;
      }
      .report-avatar--initial {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 18px;
        color: #2d6a7a;
      }
      .report-child-meta {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .report-child-name {
        font-weight: 700;
        color: #10303b;
        font-size: 15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .report-category {
        font-size: 12px;
        color: #5b7280;
      }
      .report-title-block {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .report-title {
        font-weight: 600;
        color: #10303b;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .report-summary-preview {
        font-size: 12.5px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .report-side-block {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 3px;
      }
      .status-badge {
        padding: 2px 10px;
        border-radius: 999px;
        background: #e7f6ef;
        color: #177a4c;
        font-size: 12px;
        font-weight: 700;
      }
      .status-badge--draft {
        background: #fdf3e2;
        color: #a4691a;
      }
      .report-date {
        font-size: 12px;
        color: #5b7280;
      }
      .report-duration {
        font-size: 12px;
        color: #94a3b8;
      }
      .expand-chevron {
        color: #94a3b8;
        transition: transform 0.15s ease;
        text-align: center;
      }
      .expand-chevron--open {
        transform: rotate(180deg);
      }

      .report-detail {
        border-top: 1px solid #eef2f6;
        background: #fbfdfe;
        padding: 18px 20px 22px;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .detail-section--meta {
        grid-column: 1 / -1;
      }
      .detail-section h3 {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #5b7280;
      }
      .detail-text {
        margin: 0;
        color: #234;
        font-size: 14px;
        line-height: 1.55;
        white-space: pre-wrap;
      }
      .detail-quote {
        margin: 0;
        padding: 10px 14px;
        border-left: 3px solid #2d6a7a;
        background: #eef8fc;
        border-radius: 0 8px 8px 0;
        color: #234;
        font-size: 14px;
        line-height: 1.55;
        white-space: pre-wrap;
      }

      .metric-rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .metric-row {
        display: grid;
        grid-template-columns: 150px 1fr 44px;
        align-items: center;
        gap: 10px;
      }
      .metric-label {
        font-size: 13px;
        color: #234;
      }
      .metric-bar-track {
        height: 8px;
        background: #e6eef3;
        border-radius: 999px;
        overflow: hidden;
      }
      .metric-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #4ba3b8, #2d6a7a);
        border-radius: 999px;
      }
      .metric-value {
        font-size: 12.5px;
        font-weight: 700;
        color: #2d6a7a;
        text-align: right;
      }

      .photo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 10px;
      }
      .photo-thumb {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        display: block;
      }
      .doc-list {
        margin: 0;
        padding-left: 18px;
        color: #234;
        font-size: 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      @media (max-width: 860px) {
        .report-card-main {
          grid-template-columns: 1fr auto;
          grid-template-areas:
            'child side'
            'title side'
            'chev chev';
        }
        .report-child-block {
          grid-area: child;
        }
        .report-title-block {
          grid-area: title;
        }
        .report-side-block {
          grid-area: side;
        }
        .expand-chevron {
          grid-area: chev;
        }
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolReportsPage implements OnInit {
  private readonly api = inject(SchoolsApi);

  readonly reports = signal<ActivityReportListItem[]>([]);
  readonly students = signal<EnrolledStudentOption[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly statusFilter = signal<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL');
  readonly childFilter = signal('');
  readonly expandedId = signal<string | null>(null);

  readonly filteredReports = computed(() => {
    const status = this.statusFilter();
    const childId = this.childFilter();
    return this.reports().filter(
      (report) =>
        (status === 'ALL' || report.status === status) &&
        (childId === '' || report.childId === childId),
    );
  });

  ngOnInit() {
    void this.loadReports();
    this.api.getEnrolledStudents().subscribe({
      next: (students) => this.students.set(students),
      // Filters degrade gracefully if the student list fails — no error state.
      error: () => this.students.set([]),
    });
  }

  loadReports() {
    this.loading.set(true);
    this.error.set(null);

    this.api.listReportsWithChild().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load reports. Check your connection and try again.');
      },
    });
  }

  onStatusChange(event: Event) {
    this.statusFilter.set(
      (event.target as HTMLSelectElement).value as 'ALL' | 'SUBMITTED' | 'DRAFT',
    );
  }

  onChildChange(event: Event) {
    this.childFilter.set((event.target as HTMLSelectElement).value);
  }

  toggleExpanded(reportId: string) {
    this.expandedId.set(this.expandedId() === reportId ? null : reportId);
  }

  childName(report: ActivityReportListItem): string {
    return [report.childFirstName, report.childLastName].filter(Boolean).join(' ').trim();
  }

  initial(report: ActivityReportListItem): string {
    return (report.childFirstName?.[0] ?? '?').toUpperCase();
  }

  metricsOf(report: ActivityReportListItem): MetricRow[] {
    const raw = report.performanceMetrics;
    if (raw === null || raw === undefined || typeof raw !== 'object') return [];
    const metrics = raw as Record<string, unknown>;
    const rows: MetricRow[] = [];
    for (const [key, label] of METRIC_LABELS) {
      const value = metrics[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        rows.push({ label, value: Math.max(0, Math.min(10, Math.round(value))) });
      }
    }
    return rows;
  }

  imagesOf(report: ActivityReportListItem): string[] {
    return (report.photoUrls ?? []).filter((url) => IMAGE_EXTENSIONS.test(url));
  }

  documentsOf(report: ActivityReportListItem): string[] {
    return (report.photoUrls ?? []).filter((url) => !IMAGE_EXTENSIONS.test(url));
  }

  fileNameOf(url: string): string {
    try {
      const name = new URL(url, window.location.origin).pathname.split('/').pop() ?? url;
      return decodeURIComponent(name);
    } catch {
      return url;
    }
  }
}
