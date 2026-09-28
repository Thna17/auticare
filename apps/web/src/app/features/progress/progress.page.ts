// parent-report-detail.page.ts
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ParentActivityReportResponse } from '@auticare/contracts';
import { ChildrenApi } from '../children/data-access/children.api';
import { ParentActivityApi } from './data-access/parent-activity.api';

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

const METRIC_DEFS: { key: string; label: string; color: string }[] = [
  { key: 'participation', label: 'Participation', color: '#10B981' },
  { key: 'communication', label: 'Communication', color: '#3B82F6' },
  { key: 'socialInteraction', label: 'Social Skills', color: '#8B5CF6' },
  { key: 'attention', label: 'Attention', color: '#F59E0B' },
  { key: 'emotionalRegulation', label: 'Emotional Regulation', color: '#EC4899' },
  { key: 'taskCompletion', label: 'Task Completion', color: '#06B6D4' },
];

@Component({
  standalone: true,
  imports: [RouterLink],
  selector: 'ac-parent-report-detail-page',
  template: `
    <div class="page-layout">
      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <header class="topbar">
          <div class="child-switcher">
            <label class="child-switcher-label" for="child-select">Child:</label>
            <select id="child-select" class="child-select" (change)="onChildChange($event)">
              @for (child of children(); track child.id) {
                <option [value]="child.id" [selected]="child.id === selectedChildId()">
                  {{ child.firstName }}
                </option>
              }
            </select>
          </div>
          <div class="topbar-actions">
            @if (reports().length > 1) {
              <select
                class="child-select report-select"
                [value]="selectedReportId() ?? ''"
                (change)="onReportChange($event)"
                aria-label="Choose report"
              >
                @for (report of reports(); track report.id) {
                  <option [value]="report.id">
                    {{ report.activityDate }} — {{ report.title }}
                  </option>
                }
              </select>
            }
            <a class="back-link" routerLink="/dashboard">← Back to Dashboard</a>
          </div>
        </header>

        <!-- Loading state -->
        @if (loading()) {
          <div class="report-container">
            <div class="state-block">
              <span class="spinner"></span>
              <p>Loading report…</p>
            </div>
          </div>
        }

        <!-- Error state -->
        @else if (error()) {
          <div class="report-container">
            <div class="state-block error-state">
              <span class="state-icon">⚠️</span>
              <p>{{ error() }}</p>
              <button type="button" class="mark-all-btn" (click)="loadReports()">Try again</button>
            </div>
          </div>
        }

        <!-- Empty state -->
        @else if (!report()) {
          <div class="report-container">
            <div class="state-block">
              <span class="state-icon">📋</span>
              <p>
                No submitted activity reports yet.<br />
                Reports appear here once your child's school shares them.
              </p>
            </div>
          </div>
        }

        <!-- Report Content -->
        @else if (report(); as r) {
          <div class="report-container">
            <!-- Report Header -->
            <div class="report-header">
              <div>
                <h1>Activity Report: {{ r.title }}</h1>
                <div class="report-meta">
                  <span class="date">Date: {{ r.activityDate }}</span>
                  <span class="school-chip">🏫 {{ r.schoolName }}</span>
                  <span class="status-badge completed">✓ Completed Successfully</span>
                </div>
              </div>
            </div>

            <div class="report-grid">
              <!-- Left Column -->
              <div class="report-main">
                <!-- Activity Summary -->
                <section class="report-card">
                  <div class="card-header">
                    <span class="card-icon"></span>
                    <h2>Activity Summary</h2>
                  </div>
                  <div class="card-content">
                    @for (paragraph of summaryParagraphs(); track $index) {
                      <p>{{ paragraph }}</p>
                    }
                    <div class="summary-facts">
                      <span class="fact-chip">Category: {{ r.activityCategory }}</span>
                      @if (r.duration !== null) {
                        <span class="fact-chip">Duration: {{ r.duration }} min</span>
                      }
                    </div>
                  </div>
                </section>

                <!-- Activity Moments -->
                @if (images().length > 0) {
                  <section class="report-card">
                    <div class="card-header">
                      <span class="card-icon">📷</span>
                      <h2>Activity Moments</h2>
                    </div>
                    <div class="activity-moments">
                      @for (image of images(); track image.url) {
                        <div class="moment-card">
                          <img [src]="image.url" [alt]="image.label" class="moment-image" />
                          <div class="moment-overlay">
                            <span>{{ image.label }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </section>
                }

                <!-- Documents -->
                @if (documents().length > 0) {
                  <section class="report-card">
                    <div class="card-header">
                      <span class="card-icon">📎</span>
                      <h2>Documents</h2>
                    </div>
                    <div class="document-grid">
                      @for (doc of documents(); track doc.url) {
                        <a class="document-link" [href]="doc.url" target="_blank" rel="noopener">
                          <span class="document-icon">📄</span>
                          <span class="document-name">{{ doc.name }}</span>
                          <span class="document-open">Open ↗</span>
                        </a>
                      }
                    </div>
                  </section>
                }

                <!-- Teacher Observations -->
                @if (r.teacherObservation) {
                  <section class="report-card observations-card">
                    <div class="card-header">
                      <div class="teacher-info">
                        <div class="teacher-avatar">‍🏫</div>
                        <div>
                          <h3>Teacher Observations</h3>
                        </div>
                      </div>
                    </div>
                    <div class="card-content">
                      <blockquote class="observation-quote">
                        "{{ r.teacherObservation }}"
                      </blockquote>
                      <cite class="teacher-name">
                        — {{ r.reporter.firstName }} {{ r.reporter.lastName }}, {{ r.schoolName }}
                      </cite>
                    </div>
                  </section>
                }
              </div>

              <!-- Right Column -->
              <div class="report-sidebar">
                <!-- Engagement Metrics -->
                <section class="report-card engagement-card">
                  <div class="card-header">
                    <span class="card-icon">📊</span>
                    <h2>Engagement</h2>
                  </div>
                  <div class="engagement-overall">
                    <div class="circular-progress">
                      <svg viewBox="0 0 120 120" class="progress-svg">
                        <circle class="progress-bg" cx="60" cy="60" r="52"></circle>
                        <circle
                          class="progress-bar"
                          cx="60"
                          cy="60"
                          r="52"
                          [attr.stroke-dasharray]="2 * 3.14159 * 52"
                          [attr.stroke-dashoffset]="
                            2 * 3.14159 * 52 * (1 - overallProgress() / 100)
                          "
                        ></circle>
                      </svg>
                      <div class="progress-text">
                        <span class="progress-value">{{ overallProgress() }}%</span>
                        <span class="progress-label">Overall Participation</span>
                      </div>
                    </div>
                  </div>
                  <div class="engagement-breakdown">
                    @for (metric of engagementMetrics(); track metric.label) {
                      <div class="metric-row">
                        <span class="metric-label">{{ metric.label }}</span>
                        <div class="metric-bar-bg">
                          <div
                            class="metric-bar-fill"
                            [style.width.%]="metric.value"
                            [style.background]="metric.color"
                          ></div>
                        </div>
                        <span class="metric-value">{{ metric.display }}</span>
                      </div>
                    }
                  </div>
                </section>

                <!-- Home Follow-up -->
                <section class="report-card followup-card">
                  <div class="card-header">
                    <span class="card-icon">🏠</span>
                    <h2>Home Follow-up</h2>
                  </div>
                  <div class="card-content">
                    <p class="followup-intro">
                      Recommended steps to reinforce this activity at home:
                    </p>
                    <blockquote class="observation-quote followup-quote">
                      {{
                        r.recommendations ??
                          'No specific recommendations were included in this report.'
                      }}
                    </blockquote>
                  </div>
                </section>

                <!-- Action Buttons -->
                <div class="action-buttons">
                  <button type="button" class="btn-secondary">
                    <span>↗</span>
                    <span>Share with Specialist</span>
                  </button>
                  <button type="button" class="btn-primary">
                    <span>⬇</span>
                    <span>Download Full Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [
    `
      .page-layout {
        display: flex;
        min-height: 100vh;
        background: #f8fafc;
      }

      /* Main Content */
      .main-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        gap: 24px;
      }

      .child-switcher {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .child-switcher-label {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
      }

      .child-select {
        padding: 10px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        background: white;
        color: #1e293b;
        outline: none;
        cursor: pointer;
      }

      .child-select:focus {
        border-color: #3b82f6;
      }

      .back-link {
        color: #2d6a7a;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
      }

      .report-select {
        max-width: 320px;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      /* Loading / error / empty states */
      .state-block {
        background: white;
        border-radius: 16px;
        padding: 48px 24px;
        text-align: center;
        color: #64748b;
        font-size: 14px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .state-icon {
        font-size: 40px;
      }

      .error-state p {
        color: #b91c1c;
        font-weight: 600;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 4px solid #e2e8f0;
        border-top-color: #2d6a7a;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Report Container */
      .report-container {
        width: 100%;
      }

      .report-header {
        margin-bottom: 32px;
      }

      .report-header h1 {
        margin: 0 0 12px 0;
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
      }

      .report-meta {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
      }

      .date {
        color: #64748b;
        font-size: 14px;
      }

      .school-chip {
        background: #eef8fc;
        color: #2d6a7a;
        font-size: 13px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 8px;
      }

      .status-badge {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-badge.completed {
        background: #d1fae5;
        color: #059669;
      }

      /* Report Grid */
      .report-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 24px;
      }

      .report-main {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .report-sidebar {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* Report Card */
      .report-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .card-icon {
        font-size: 24px;
      }

      .card-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .card-content {
        color: #475569;
        line-height: 1.7;
      }

      .card-content p {
        margin: 0 0 16px 0;
      }

      .card-content p:last-child {
        margin-bottom: 0;
      }

      .summary-facts {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
      }

      .fact-chip {
        background: #f1f5f9;
        color: #475569;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 999px;
      }

      /* Activity Moments */
      .activity-moments {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .moment-card {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        aspect-ratio: 16/10;
      }

      .moment-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .moment-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        color: white;
        padding: 12px;
        font-size: 13px;
        font-weight: 600;
      }

      /* Documents */
      .document-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .document-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        text-decoration: none;
        color: #334155;
        transition: all 0.2s;
      }

      .document-link:hover {
        background: #f0f7fa;
        border-color: #2d6a7a;
      }

      .document-icon {
        font-size: 20px;
      }

      .document-name {
        flex: 1;
        font-size: 13px;
        font-weight: 600;
        word-break: break-all;
      }

      .document-open {
        font-size: 12px;
        font-weight: 600;
        color: #2d6a7a;
        white-space: nowrap;
      }

      /* Observations Card */
      .observations-card .card-header {
        justify-content: flex-start;
      }

      .teacher-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .teacher-avatar {
        width: 44px;
        height: 44px;
        background: #dbeafe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      .teacher-info h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .observation-quote {
        margin: 0 0 16px 0;
        padding: 0;
        font-style: italic;
        color: #475569;
        line-height: 1.8;
        border: none;
      }

      .followup-quote {
        margin-bottom: 0;
      }

      .teacher-name {
        font-style: normal;
        font-weight: 600;
        color: #64748b;
        font-size: 13px;
      }

      /* Engagement Card */
      .engagement-overall {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
      }

      .circular-progress {
        position: relative;
        width: 140px;
        height: 140px;
      }

      .progress-svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
      }

      .progress-bg {
        fill: none;
        stroke: #e2e8f0;
        stroke-width: 8;
      }

      .progress-bar {
        fill: none;
        stroke: #10b981;
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s ease;
      }

      .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .progress-value {
        display: block;
        font-size: 32px;
        font-weight: 700;
        color: #10b981;
        line-height: 1;
      }

      .progress-label {
        font-size: 12px;
        color: #64748b;
        margin-top: 4px;
      }

      .engagement-breakdown {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .metric-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .metric-label {
        width: 118px;
        font-size: 13px;
        color: #475569;
        font-weight: 500;
      }

      .metric-bar-bg {
        flex: 1;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .metric-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
      }

      .metric-value {
        width: 44px;
        text-align: right;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }

      /* Follow-up Card */
      .followup-intro {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: #64748b;
      }

      /* Action Buttons */
      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .btn-primary,
      .btn-secondary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 20px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .btn-primary {
        background: #2d6a7a;
        color: white;
      }

      .btn-primary:hover {
        background: #1f4f5c;
      }

      .btn-secondary {
        background: white;
        color: #2d6a7a;
        border: 1px solid #2d6a7a;
      }

      .btn-secondary:hover {
        background: #f0f7fa;
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .report-grid {
          grid-template-columns: 1fr;
        }

        .report-sidebar {
          order: -1;
        }
      }

      @media (max-width: 768px) {
        .main-content {
          padding: 20px;
        }

        .report-grid {
          grid-template-columns: 1fr;
        }

        .activity-moments,
        .document-grid {
          grid-template-columns: 1fr;
        }

        .topbar {
          flex-direction: column;
          gap: 16px;
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

  readonly children = signal<{ id: string; firstName: string }[]>([]);
  readonly selectedChildId = signal<string | null>(null);
  readonly reports = signal<ParentActivityReportResponse[]>([]);
  readonly selectedReportId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

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
    if (!raw) return [];
    const metrics: EngagementMetric[] = [];
    for (const def of METRIC_DEFS) {
      const value = raw[def.key];
      if (typeof value !== 'number' || Number.isNaN(value)) continue;
      const clamped = Math.max(0, Math.min(10, value));
      metrics.push({
        label: def.label,
        value: clamped * 10, // 0-10 → percentage
        display: `${Math.round(clamped)}/10`,
        color: def.color,
      });
    }
    return metrics;
  });

  /** Average of all present metrics, for the circular gauge. */
  readonly overallProgress = computed(() => {
    const metrics = this.engagementMetrics();
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((total, metric) => total + metric.value, 0);
    return Math.round(sum / metrics.length);
  });

  /** photoUrls split into images (grid) and documents (links). */
  readonly images = computed<AttachmentImage[]>(() => {
    const urls = this.report()?.photoUrls ?? [];
    return urls
      .filter((url) => this.isImage(url))
      .map((url, index) => ({ url, label: `Photo ${index + 1}` }));
  });

  readonly documents = computed<AttachmentDocument[]>(() => {
    const urls = this.report()?.photoUrls ?? [];
    return urls
      .filter((url) => !this.isImage(url))
      .map((url) => ({ url, name: this.fileName(url) }));
  });

  /** summary is one long text — split on blank lines into paragraphs. */
  readonly summaryParagraphs = computed<string[]>(() => {
    const summary = this.report()?.summary ?? '';
    const paragraphs = summary
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
    return paragraphs.length > 0 ? paragraphs : [summary];
  });

  ngOnInit() {
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children.map((child) => ({ id: child.id, firstName: child.firstName })));
        if (children.length > 0) {
          this.selectedChildId.set(children[0].id);
          this.loadReports();
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load your children. Please refresh the page.');
      },
    });
  }

  onChildChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedChildId.set(value);
    this.loadReports();
  }

  onReportChange(event: Event) {
    this.selectedReportId.set((event.target as HTMLSelectElement).value);
  }

  loadReports() {
    const childId = this.selectedChildId();
    if (!childId) return;
    this.loading.set(true);
    this.error.set(null);
    this.activityApi.listActivityReports(childId).subscribe({
      next: (reports) => {
        this.reports.set(reports);
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

  private isImage(url: string): boolean {
    try {
      const extension = new URL(url, window.location.origin).pathname
        .split('.')
        .pop()
        ?.toLowerCase();
      return extension === 'jpg' || extension === 'jpeg' || extension === 'png';
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
