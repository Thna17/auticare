// school-reports.page.ts — School Activity Reports list & observation feed.
// Loads real submitted/draft reports for the authenticated school
// (GET /schools/reports), with status/child/developmental domain filters and expandable details.
// Report creation lives on the canonical form at /schools/reports/new.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SchoolsApi } from './data-access/schools.api';
import type { EnrolledStudentOption } from './data-access/schools.api';
import type { ActivityReportListItem, PaginationMeta } from '@auticare/contracts';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';
import { AuthService } from '../../core/auth/auth.service';
import { attachmentUrl } from '../../core/config/attachment-url';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

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

export interface DomainFilterOption {
  id: string;
  label: string;
  icon: string;
}

const DOMAIN_OPTIONS: DomainFilterOption[] = [
  { id: 'ALL', label: 'All Domains', icon: '🌟' },
  { id: 'Sensory', label: 'Sensory & Motor', icon: '🌈' },
  { id: 'Social', label: 'Social & Emotional', icon: '🤝' },
  { id: 'Communication', label: 'Language & Speech', icon: '💬' },
  { id: 'Cognitive', label: 'Cognitive & Focus', icon: '🧩' },
  { id: 'Adaptive', label: 'Adaptive & Routine', icon: '🌱' },
];

@Component({
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    SchoolTopbarComponent,
    UiEmptyStateComponent,
    UiMessageComponent,
    UiPaginationComponent,
    UiSpinnerComponent,
  ],
  template: `
    @if (isSchoolStaff()) {
      <ac-school-topbar />
    }

    <!-- Page Header -->
    <header class="reports-header" [class.admin-header]="isAdmin()">
      <div class="header-titles">
        <div class="header-badge-row">
          <span class="header-badge">Clinical Observation Feed</span>
          <span class="header-badge-sub">Progress Monitoring</span>
        </div>
        <h1>
          {{ isAdmin() ? 'Administrative School Reports Oversight' : 'Activity Reports' }}
        </h1>
        <p class="reports-subtitle">
          {{
            isSchoolStaff()
              ? 'Developmental observation logs, milestones, and therapeutic reports recorded for enrolled students.'
              : isAdmin()
                ? 'Administrative platform oversight of student activity and developmental reports.'
                : 'Activity reports recorded by partner schools.'
          }}
        </p>
      </div>
      @if (isSchoolStaff()) {
        <a class="btn-new-report" routerLink="/schools/reports/new">＋ New Report</a>
      }
    </header>

    <!-- Developmental Domain Filter Pills -->
    <section class="domain-pills-bar" aria-label="Developmental domain filters">
      <span class="domain-bar-label">Developmental Domain:</span>
      <div class="domain-pills-list">
        @for (opt of domainOptions; track opt.id) {
          <button
            type="button"
            class="domain-pill-btn"
            [class.active]="selectedDomain() === opt.id"
            (click)="selectDomain(opt.id)"
          >
            <span class="pill-icon">{{ opt.icon }}</span>
            <span>{{ opt.label }}</span>
          </button>
        }
      </div>
    </section>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="filter-group">
        <label class="filter-label" for="status-filter">Report Status</label>
        <select
          id="status-filter"
          class="filter-select"
          [value]="statusFilter()"
          (change)="onStatusChange($event)"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Submitted (Published)</option>
          <option value="DRAFT">Draft Only</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label" for="child-filter">Enrolled Student</label>
        <select
          id="child-filter"
          class="filter-select"
          [value]="childFilter()"
          (change)="onChildChange($event)"
        >
          <option value="">All students ({{ students().length }})</option>
          @for (student of students(); track student.childId) {
            <option [value]="student.childId">
              {{ student.firstName }} {{ student.lastName }}
            </option>
          }
        </select>
      </div>
      <span class="filter-count">{{ pagination()?.total ?? reports().length }} report(s)</span>
    </div>

    @if (searchQuery()) {
      <div class="active-search-bar" role="status">
        <span class="search-tag">
          <span
            >Filtering by: <strong>"{{ searchQuery() }}"</strong></span
          >
          <button
            type="button"
            class="btn-clear-search"
            (click)="clearSearch()"
            aria-label="Clear search"
          >
            ✕ Clear search
          </button>
        </span>
      </div>
    }

    @if (actionMessage()) {
      <p class="action-message" role="status">{{ actionMessage() }}</p>
    }

    <!-- States -->
    @if (loading()) {
      <ac-ui-spinner label="Loading developmental reports…" />
    } @else if (error(); as loadError) {
      <ac-ui-message tone="error">
        {{ loadError }}
        <button type="button" class="retry-btn" (click)="loadReports()">Retry</button>
      </ac-ui-message>
    } @else if (filteredReports().length === 0) {
      <ac-ui-empty-state
        title="No reports found"
        [message]="
          searchQuery()
            ? 'No activity reports match &quot;' + searchQuery() + '&quot;.'
            : statusFilter() !== 'ALL' || childFilter() !== '' || selectedDomain() !== 'ALL'
              ? 'No reports match the current filters. Try resetting the filters or choosing another domain.'
              : 'No activity reports have been created yet.'
        "
      >
        @if (searchQuery()) {
          <button type="button" class="btn-clear-search-pill" (click)="clearSearch()">
            Clear search
          </button>
        } @else if (selectedDomain() !== 'ALL') {
          <button type="button" class="btn-clear-search-pill" (click)="selectDomain('ALL')">
            Reset domain filter
          </button>
        } @else if (isSchoolStaff()) {
          <a routerLink="/schools/reports/new" class="inline-link">Create school report</a>
        }
      </ac-ui-empty-state>
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
                  <span class="domain-tag" [class]="domainTone(report.activityCategory)">
                    {{ report.activityCategory }}
                  </span>
                </div>
              </div>

              <div class="report-title-block">
                <span class="report-title">{{ report.title }}</span>
                <span class="report-summary-preview">{{ report.summary }}</span>
              </div>

              <div class="report-side-block">
                <span class="status-badge" [class.status-badge--draft]="report.status === 'DRAFT'">
                  {{ report.status === 'DRAFT' ? 'Draft' : 'Submitted' }}
                </span>
                <span class="report-date">{{ report.activityDate | date: 'MMM d, y' }}</span>
                @if (report.duration) {
                  <span class="report-duration">⏱️ {{ report.duration }} min</span>
                }
              </div>

              <span class="expand-chevron" [class.expand-chevron--open]="expandedId() === report.id"
                >▾</span
              >
            </button>
            @if (canManageReports()) {
              <div class="report-card-actions" aria-label="Report actions">
                <a
                  class="report-action report-action--edit"
                  [routerLink]="['/schools/reports', report.id, 'edit']"
                  title="Edit Report"
                  aria-label="Edit Report"
                  >✏️</a
                >
                <button
                  type="button"
                  class="report-action report-action--delete"
                  title="Delete Report"
                  aria-label="Delete Report"
                  [disabled]="deletingId() === report.id"
                  (click)="deleteReport(report.id)"
                >
                  {{ deletingId() === report.id ? '…' : '🗑️' }}
                </button>
              </div>
            }

            @if (expandedId() === report.id) {
              <div class="report-detail">
                <div class="detail-grid">
                  <section class="detail-section">
                    <h3>Summary & Objective</h3>
                    <p class="detail-text">{{ report.summary }}</p>
                  </section>

                  @if (metricsOf(report).length > 0) {
                    <section class="detail-section">
                      <h3>Developmental Performance (0–10 Scale)</h3>
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
                      <h3>Teacher & Specialist Observations</h3>
                      <blockquote class="detail-quote">
                        {{ report.teacherObservation }}
                      </blockquote>
                    </section>
                  }

                  @if (report.recommendations) {
                    <section class="detail-section">
                      <h3>Home & Caregiver Recommendations</h3>
                      <div class="recommendations-box">
                        <span class="rec-icon">💡</span>
                        <p class="detail-text">{{ report.recommendations }}</p>
                      </div>
                    </section>
                  }

                  @if (imagesOf(report).length > 0) {
                    <section class="detail-section">
                      <h3>Observation Photos</h3>
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
                      <h3>Supporting Documents</h3>
                      <ul class="doc-list">
                        @for (url of documentsOf(report); track url) {
                          <li>
                            <a class="inline-link" [href]="url" target="_blank" rel="noopener">
                              📄 {{ fileNameOf(url) }}
                            </a>
                          </li>
                        }
                      </ul>
                    </section>
                  }

                  <section class="detail-section detail-section--meta">
                    <h3>Observation Record Details</h3>
                    <p class="detail-text">
                      Recorded by
                      <strong>{{ report.reporterFirstName }} {{ report.reporterLastName }}</strong>
                      · Created on {{ report.createdAt | date: 'MMMM d, y' }}
                    </p>
                  </section>
                </div>
              </div>
            }
          </article>
        }
        @if (pagination(); as meta) {
          <ac-ui-pagination
            [page]="meta.page"
            [totalPages]="meta.totalPages"
            [total]="meta.total"
            [perPage]="meta.limit"
            itemNoun="reports"
            label="Report pages"
            (pageChange)="goToPage($event)"
          />
        }
      </div>
    }
  `,
  styles: [
    `
      .reports-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .header-titles {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .header-badge-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      .header-badge {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--ac-color-tint-blue-wash);
        color: var(--ac-color-action-alt);
        padding: 2px 8px;
        border-radius: 6px;
        border: 1px solid var(--ac-color-border-info);
      }
      .header-badge-sub {
        font-size: 11px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
      }
      .reports-header h1 {
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        color: var(--ac-color-action-darkest);
        letter-spacing: -0.02em;
      }
      .reports-subtitle {
        margin: 2px 0 0;
        color: var(--ac-color-grey-a);
        font-size: 14px;
      }
      .btn-new-report {
        display: inline-flex;
        align-items: center;
        padding: 10px 20px;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        border-radius: 10px;
        font-weight: 700;
        font-size: 13.5px;
        text-decoration: none;
        white-space: nowrap;
        transition:
          background 0.15s ease,
          transform 0.1s ease;
      }
      .btn-new-report:hover {
        background: var(--ac-color-ink-a);
        transform: translateY(-1px);
      }

      /* Domain Filter Pills Bar */
      .domain-pills-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .domain-bar-label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ac-color-text-slate);
        white-space: nowrap;
      }
      .domain-pills-list {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .domain-pill-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .domain-pill-btn:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
      }
      .domain-pill-btn.active {
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action-alt);
      }
      .pill-icon {
        font-size: 13px;
      }

      /* Filters Row */
      .filters-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        padding: 14px 18px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .filter-label {
        font-size: 11.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-grey-a);
      }
      .filter-select {
        min-width: 170px;
        padding: 8px 12px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-darkest);
        font-size: 13.5px;
        font-weight: 500;
        min-height: 40px;
      }
      .filter-select:focus {
        border-color: var(--ac-color-action-alt);
        outline: none;
      }
      .filter-count {
        margin-left: auto;
        color: var(--ac-color-grey-a);
        font-size: 13px;
        font-weight: 600;
      }

      .active-search-bar {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .search-tag {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: var(--ac-color-tint-blue-mist);
        border: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-text-slate-strong);
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 13px;
      }
      .btn-clear-search {
        background: none;
        border: none;
        color: var(--ac-color-action-alt);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: background 0.15s;
      }
      .btn-clear-search:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .btn-clear-search-pill {
        display: inline-flex;
        align-items: center;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 12px;
      }

      .retry-btn {
        padding: 6px 18px;
        border: 1px solid var(--ac-color-alert-slate);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-alert-slate);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .inline-link {
        color: var(--ac-color-action-alt);
        font-weight: 600;
        text-decoration: none;
      }
      .inline-link:hover {
        text-decoration: underline;
      }

      .report-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .report-card {
        position: relative;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        transition:
          box-shadow 0.15s ease,
          border-color 0.15s ease;
      }
      .report-list > .report-card {
        margin-bottom: 16px;
      }
      .report-card:hover {
        box-shadow: 0 6px 18px rgba(16, 48, 59, 0.08);
      }
      .report-card-main {
        display: grid;
        grid-template-columns: minmax(200px, 1.2fr) 2fr minmax(150px, auto) 24px;
        align-items: center;
        gap: 16px;
        width: 100%;
        padding: 18px 112px 18px 22px;
        background: none;
        border: 0;
        text-align: left;
        cursor: pointer;
        font: inherit;
      }
      .report-card-actions {
        position: absolute;
        top: 20px;
        right: 18px;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .report-action {
        display: inline-flex;
        width: 36px;
        height: 36px;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 9px;
        background: var(--ac-color-surface);
        font-size: 16px;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s;
      }
      .report-action--edit {
        color: var(--ac-color-green-teal);
      }
      .report-action--delete {
        color: var(--ac-color-alert-slate);
      }
      .report-action:hover {
        background: var(--ac-color-surface-slate);
      }
      .report-action:disabled {
        cursor: wait;
        opacity: 0.55;
      }
      .action-message {
        margin: 0 0 16px;
        color: var(--ac-color-green-teal);
        font-size: 14px;
        font-weight: 600;
      }

      .report-child-block {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .report-avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        object-fit: cover;
        background: var(--ac-color-tint-blue-mist);
        border: 1px solid var(--ac-color-border-slate);
        flex-shrink: 0;
      }
      .report-avatar--initial {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 18px;
        color: var(--ac-color-action-alt);
      }
      .report-child-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }
      .report-child-name {
        font-weight: 700;
        color: var(--ac-color-action-darkest);
        font-size: 14.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .domain-tag {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 4px;
        display: inline-block;
        width: fit-content;
      }
      .domain-tag.sensory {
        background: var(--ac-color-purple-tint);
        color: var(--ac-color-purple-700);
      }
      .domain-tag.social {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-700);
      }
      .domain-tag.communication {
        background: var(--ac-color-blue-tint-pure);
        color: var(--ac-color-blue-600);
      }
      .domain-tag.cognitive {
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action-alt);
      }
      .domain-tag.adaptive {
        background: var(--ac-color-green-50);
        color: var(--ac-color-emerald-600);
      }

      .report-title-block {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }
      .report-title {
        font-weight: 700;
        color: var(--ac-color-action-darkest);
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .report-summary-preview {
        font-size: 12.5px;
        color: var(--ac-color-text-slate);
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
        padding: 3px 10px;
        border-radius: 999px;
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
        font-size: 11.5px;
        font-weight: 700;
      }
      .status-badge--draft {
        background: var(--ac-color-amber-tint-warm);
        color: var(--ac-color-amber-700);
      }
      .report-date {
        font-size: 12px;
        color: var(--ac-color-grey-a);
      }
      .report-duration {
        font-size: 11.5px;
        color: var(--ac-color-slate-400);
      }
      .expand-chevron {
        color: var(--ac-color-slate-400);
        transition: transform 0.15s ease;
        text-align: center;
        font-size: 16px;
      }
      .expand-chevron--open {
        transform: rotate(180deg);
      }

      /* Detail Box */
      .report-detail {
        border-top: 1px solid var(--ac-color-slate-border-mist);
        background: var(--ac-color-blue-tint-pure);
        padding: 20px 24px;
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
        font-size: 11.5px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ac-color-grey-a);
      }
      .detail-text {
        margin: 0;
        color: var(--ac-color-ink-h);
        font-size: 13.5px;
        line-height: 1.55;
        white-space: pre-wrap;
      }
      .detail-quote {
        margin: 0;
        padding: 12px 16px;
        border-left: 3px solid var(--ac-color-action-alt);
        background: var(--ac-color-surface);
        border-radius: 0 10px 10px 0;
        color: var(--ac-color-ink-h);
        font-size: 13.5px;
        line-height: 1.55;
        white-space: pre-wrap;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      }

      .recommendations-box {
        display: flex;
        gap: 10px;
        background: var(--ac-color-surface);
        padding: 12px 16px;
        border-radius: 10px;
        border: 1px solid var(--ac-color-border-slate);
      }
      .rec-icon {
        font-size: 18px;
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
        font-size: 12.5px;
        color: var(--ac-color-ink-h);
        font-weight: 500;
      }
      .metric-bar-track {
        height: 7px;
        background: var(--ac-color-slate-line-faint);
        border-radius: 999px;
        overflow: hidden;
      }
      .metric-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--ac-color-teal-accent), var(--ac-color-action-alt));
        border-radius: 999px;
      }
      .metric-value {
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-action-alt);
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
        border: 1px solid var(--ac-color-border-slate);
        display: block;
      }
      .doc-list {
        margin: 0;
        padding-left: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      @media (max-width: 860px) {
        .report-card-main {
          grid-template-columns: 1fr auto;
          grid-template-areas:
            'child side'
            'title side'
            'chev chev';
          padding-right: 90px;
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
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly domainOptions = DOMAIN_OPTIONS;
  readonly reports = signal<ActivityReportListItem[]>([]);
  readonly students = signal<EnrolledStudentOption[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly statusFilter = signal<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL');
  readonly childFilter = signal('');
  readonly selectedDomain = signal<string>('ALL');
  readonly searchQuery = signal('');
  readonly expandedId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly canManageReports = computed(() => this.auth.parent()?.role === 'SCHOOL');
  readonly isSchoolStaff = this.canManageReports;
  readonly isAdmin = computed(() => this.auth.parent()?.role === 'ADMIN');
  readonly isParent = computed(() => this.auth.parent()?.role === 'PARENT');

  readonly pagination = signal<PaginationMeta | null>(null);
  readonly page = signal(1);

  readonly filteredReports = computed(() => {
    const domain = this.selectedDomain();
    const list = this.reports();
    if (domain === 'ALL') return list;
    return list.filter((r) => {
      const cat = (r.activityCategory ?? '').toLowerCase();
      const title = (r.title ?? '').toLowerCase();
      const d = domain.toLowerCase();
      return cat.includes(d) || title.includes(d);
    });
  });

  goToPage(page: number) {
    this.page.set(page);
    void this.loadReports();
  }

  selectDomain(domainId: string) {
    this.selectedDomain.set(domainId);
  }

  domainTone(category: string): string {
    const cat = category.toLowerCase();
    if (cat.includes('sensory') || cat.includes('motor')) return 'sensory';
    if (cat.includes('social') || cat.includes('emotion')) return 'social';
    if (cat.includes('language') || cat.includes('communicat')) return 'communication';
    if (cat.includes('cognit') || cat.includes('develop')) return 'cognitive';
    if (cat.includes('adapt') || cat.includes('routine')) return 'adaptive';
    return 'cognitive';
  }

  ngOnInit() {
    if (this.auth.parent()?.role === 'PARENT') {
      void this.router.navigateByUrl('/progress');
      return;
    }

    this.route.queryParams.subscribe((params) => {
      const q = (params['search'] as string | undefined)?.trim() ?? '';
      this.searchQuery.set(q);
      this.page.set(1);
      this.loadReports();
    });

    if (this.isSchoolStaff()) {
      this.api.getEnrolledStudents().subscribe({
        next: (students) => this.students.set(students),
        error: () => this.students.set([]),
      });
    }
  }

  loadReports() {
    this.loading.set(true);
    this.error.set(null);

    const status = this.statusFilter();
    const childId = this.childFilter();
    const search = this.searchQuery();
    this.api
      .listReportsWithChild({
        ...(status !== 'ALL' && { status }),
        ...(childId !== '' && { childId }),
        ...(search !== '' && { search }),
        page: this.page(),
      })
      .subscribe({
        next: ({ reports, pagination }) => {
          this.reports.set(reports);
          this.pagination.set(pagination);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Could not load reports. Check your connection and try again.');
        },
      });
  }

  clearSearch() {
    this.searchQuery.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge',
    });
  }

  onStatusChange(event: Event) {
    this.statusFilter.set(
      (event.target as HTMLSelectElement).value as 'ALL' | 'SUBMITTED' | 'DRAFT',
    );
    this.page.set(1);
    void this.loadReports();
  }

  onChildChange(event: Event) {
    this.childFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    void this.loadReports();
  }

  toggleExpanded(reportId: string) {
    this.expandedId.set(this.expandedId() === reportId ? null : reportId);
  }

  deleteReport(reportId: string) {
    const report = this.reports().find((item) => item.id === reportId);
    if (!report || this.deletingId()) return;
    const student = this.childName(report) || 'this student';
    if (
      !window.confirm(
        `Are you sure you want to delete this report for ${student}? This action cannot be undone.`,
      )
    ) {
      return;
    }
    this.actionMessage.set(null);
    this.deletingId.set(reportId);
    this.api.deleteActivityReport(reportId).subscribe({
      next: () => {
        this.reports.update((reports) => reports.filter((item) => item.id !== reportId));
        this.deletingId.set(null);
        this.actionMessage.set('Activity report deleted successfully.');
      },
      error: (err) => {
        this.deletingId.set(null);
        this.actionMessage.set(
          err?.error?.error?.message ?? 'Could not delete this report. Please try again.',
        );
      },
    });
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
    return (report.photoUrls ?? [])
      .filter((url) => IMAGE_EXTENSIONS.test(url))
      .map((url) => attachmentUrl(report.id, url));
  }

  documentsOf(report: ActivityReportListItem): string[] {
    return (report.photoUrls ?? [])
      .filter((url) => !IMAGE_EXTENSIONS.test(url))
      .map((url) => attachmentUrl(report.id, url));
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
