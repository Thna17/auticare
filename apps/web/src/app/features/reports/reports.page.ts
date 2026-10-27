import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  ActivityReportListItem,
  ChildResponse,
  ObservationResponse,
  ScreeningSessionResultResponse,
} from '@auticare/contracts';
import { ChildrenApi } from '../children/data-access/children.api';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { ObservationsApi } from '../observations/data-access/observations.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';

export type ReportTab = 'school' | 'behaviour' | 'educational';
export type DateRange = '7d' | '30d' | '90d' | 'all';

@Component({
  selector: 'ac-reports',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, UiSpinnerComponent, UiEmptyStateComponent],
  template: `
    <div class="reports-container">
      <header class="reports-header no-print">
        <div class="header-left">
          <h1 class="page-title">Child Progress Reports</h1>
          <p class="page-subtitle">
            Consolidated reports from schools, daily home observations, and developmental insights.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="/settings" class="btn-share-link">
            <span>Manage sharing &rarr;</span>
          </a>

          <button type="button" class="btn-print" (click)="printReport()">
            <span aria-hidden="true">&#x1F5B6;</span>
            <span>Download / Print PDF</span>
          </button>
        </div>
      </header>

      <section class="controls-panel no-print">
        <div class="control-group">
          <label for="child-select" class="control-label">Select Child</label>
          <select
            id="child-select"
            class="control-select"
            [ngModel]="selectedChildId()"
            (ngModelChange)="onChildChange($event)"
          >
            @for (child of children(); track child.id) {
              <option [value]="child.id">{{ child.firstName }} {{ child.lastName || '' }}</option>
            }
          </select>
        </div>

        <div class="control-group">
          <label for="date-range" class="control-label">Date Window</label>
          <select
            id="date-range"
            class="control-select"
            [ngModel]="dateRange()"
            (ngModelChange)="dateRange.set($event)"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        <div class="tabs-group" role="tablist" aria-label="Report sections">
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.active]="activeTab() === 'school'"
            [attr.aria-selected]="activeTab() === 'school'"
            (click)="activeTab.set('school')"
          >
            School Reports
          </button>
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.active]="activeTab() === 'behaviour'"
            [attr.aria-selected]="activeTab() === 'behaviour'"
            (click)="activeTab.set('behaviour')"
          >
            Parent Observations
          </button>
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.active]="activeTab() === 'educational'"
            [attr.aria-selected]="activeTab() === 'educational'"
            (click)="activeTab.set('educational')"
          >
            Educational Summaries
          </button>
        </div>
      </section>

      <!-- Printable Header for physical paper and PDF downloads -->
      <section class="print-header print-only">
        <div class="print-brand">
          <h2>AutiCare Developmental & Educational Report</h2>
          <span class="report-badge">Non-Diagnostic Document</span>
        </div>
        <div class="print-meta-grid">
          <div>
            <strong>Child:</strong> {{ activeChild()?.firstName }}
            {{ activeChild()?.lastName || '' }}
          </div>
          <div><strong>Report Date:</strong> {{ currentDate | date: 'mediumDate' }}</div>
          <div><strong>Date Filter Window:</strong> {{ dateRangeLabel() }}</div>
          <div><strong>Report Focus:</strong> {{ activeTabLabel() }}</div>
        </div>
        <div class="print-disclaimer">
          <strong>Important Clinical & Legal Notice:</strong>
          This document compiles educational reports, parent observations, and automated
          developmental suggestions. It is not a clinical diagnosis or medical evaluation.
        </div>
      </section>

      <main class="report-main">
        @if (loading()) {
          <div class="loading-state no-print">
            <ac-ui-spinner label="Compiling report data..."></ac-ui-spinner>
          </div>
        } @else {
          <!-- TAB 1: SCHOOL REPORTS -->
          @if (activeTab() === 'school') {
            <section class="report-section">
              <div class="section-heading">
                <h2>School Activity & Progress Reports</h2>
                <span class="badge-source">Source: Enrolled School Educators</span>
              </div>

              @if (filteredSchoolReports().length === 0) {
                <ac-ui-empty-state
                  title="No school reports in this window"
                  message="When your child's teachers submit reports, they will be compiled and displayed here."
                ></ac-ui-empty-state>
              } @else {
                <div class="reports-list">
                  @for (rep of filteredSchoolReports(); track rep.id) {
                    <article class="report-card">
                      <div class="card-header">
                        <div>
                          <h3 class="card-title">{{ rep.title }}</h3>
                          <span class="card-date">{{ rep.createdAt | date: 'mediumDate' }}</span>
                        </div>
                        <span class="chip-status">{{ rep.status }}</span>
                      </div>

                      <p class="report-summary">{{ rep.summary }}</p>

                      <div class="metrics-grid">
                        <div class="metric-pill">
                          <span class="metric-name">Category:</span>
                          <span class="metric-val">{{ rep.activityCategory }}</span>
                        </div>
                        @if (rep.duration) {
                          <div class="metric-pill">
                            <span class="metric-name">Duration:</span>
                            <span class="metric-val">{{ rep.duration }} min</span>
                          </div>
                        }
                      </div>
                    </article>
                  }
                </div>
              }
            </section>
          }

          <!-- TAB 2: BEHAVIOUR OBSERVATIONS (Parent Observations) -->
          @if (activeTab() === 'behaviour') {
            <section class="report-section">
              <div class="section-heading">
                <h2>Parent Observations Report</h2>
                <span class="badge-source">Source: Home Logged Records</span>
              </div>

              <div class="notice-callout">
                <span class="notice-icon">&#x2139;</span>
                <p>
                  <strong>Parent observations:</strong> Logged by family members during daily
                  routines. These records help educators and therapists understand sensory
                  preferences, triggers, and calming responses.
                </p>
              </div>

              <div class="metrics-summary-cards">
                <div class="summary-card">
                  <span class="summary-label">Total Observations</span>
                  <span class="summary-value">{{ filteredObservations().length }}</span>
                </div>
                <div class="summary-card">
                  <span class="summary-label">Top Category</span>
                  <span class="summary-value">{{ topCategory() }}</span>
                </div>
                <div class="summary-card">
                  <span class="summary-label">Recorded Triggers</span>
                  <span class="summary-value">{{ uniqueTriggersCount() }}</span>
                </div>
              </div>

              @if (filteredObservations().length === 0) {
                <ac-ui-empty-state
                  title="No behavior observations recorded"
                  message="Log behavior observations from the Daily Log page to generate summary patterns."
                ></ac-ui-empty-state>
              } @else {
                <div class="table-card">
                  <table class="report-table">
                    <thead>
                      <tr>
                        <th scope="col">Date/Time</th>
                        <th scope="col">Category</th>
                        <th scope="col">Intensity</th>
                        <th scope="col">Trigger</th>
                        <th scope="col">Parent Response</th>
                        <th scope="col">Outcome</th>
                        <th scope="col">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (obs of filteredObservations(); track obs.id) {
                        <tr>
                          <td class="cell-date">{{ obs.occurredAt | date: 'short' }}</td>
                          <td>
                            <span class="category-chip">{{ obs.category }}</span>
                          </td>
                          <td>
                            <span class="intensity-chip" [class]="'int-' + obs.intensity">{{
                              obs.intensity
                            }}</span>
                          </td>
                          <td>{{ obs.trigger || '—' }}</td>
                          <td>{{ obs.parentResponse || '—' }}</td>
                          <td>{{ obs.outcome || '—' }}</td>
                          <td class="cell-notes">{{ obs.note || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          }

          <!-- TAB 3: EDUCATIONAL SUMMARIES (AI Suggestions & Questionnaire) -->
          @if (activeTab() === 'educational') {
            <section class="report-section">
              <div class="section-heading">
                <h2>Educational Summaries & Guidance</h2>
                <span class="badge-source">Source: Screening & Educational Suggestions</span>
              </div>

              <div class="warning-callout">
                <span class="warning-icon">&#x26A0;</span>
                <p>
                  <strong>AI educational suggestions, not a diagnosis:</strong>
                  The summaries below are generated from screening questionnaires and developmental
                  patterns to suggest learning activities. AutiCare does not provide clinical
                  diagnoses.
                </p>
              </div>

              @if (screeningResult(); as result) {
                <div class="screening-summary-card">
                  <div class="card-header">
                    <div>
                      <h3 class="card-title">Developmental Screening Overview</h3>
                      <span class="card-date"
                        >Completed:
                        {{ result.submittedAt || result.startedAt | date: 'mediumDate' }}</span
                      >
                    </div>
                    <span
                      class="concern-chip"
                      [class]="'risk-' + (result.result?.riskLevel || 'moderate').toLowerCase()"
                    >
                      Concern Level: {{ result.result?.riskLevel || 'Pending' }}
                    </span>
                  </div>

                  <p class="screening-desc">
                    Overall concern score: {{ result.result?.score || 0 }} points ({{
                      result.result?.riskPercentage || 0
                    }}%). Educational focus areas have been identified based on parent responses.
                  </p>

                  <div class="domain-scores-grid">
                    @for (domain of result.result?.categoryBreakdown || []; track domain.category) {
                      <div class="domain-card">
                        <div class="domain-head">
                          <span class="domain-title">{{ domain.category }}</span>
                          <span class="domain-val">{{ domain.riskPercentage }}%</span>
                        </div>
                        <div class="progress-bar-bg">
                          <div
                            class="progress-bar-fill"
                            [style.width.%]="domain.riskPercentage"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <ac-ui-empty-state
                  title="No questionnaire records found"
                  message="Complete the developmental questionnaire for this child to populate educational suggestions."
                ></ac-ui-empty-state>
              }

              <div class="suggestions-card">
                <h3 class="suggestions-title">Educational & Home Strategy Suggestions</h3>
                <ul class="suggestions-list">
                  <li>
                    <strong>Sensory Integration:</strong> Provide designated quiet corners with
                    weighted blankets or fidget tools before transitions between activities.
                  </li>
                  <li>
                    <strong>Visual Supports:</strong> Utilize first-then schedule boards and visual
                    activity strips to reduce transition anxiety.
                  </li>
                  <li>
                    <strong>Communication Expansion:</strong> Incorporate favorite high-interest
                    toys during turn-taking routines to encourage verbal or gestural requests.
                  </li>
                  <li>
                    <strong>Collaborative Support:</strong> Share these observational patterns with
                    your school educator via the "Manage sharing" section.
                  </li>
                </ul>
              </div>
            </section>
          }
        }
      </main>
    </div>
  `,
  styles: [
    `
      .reports-container {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-lg);
        padding: var(--ac-spacing-lg);
        max-width: 1200px;
        margin: 0 auto;
      }

      .reports-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: var(--ac-spacing-md);
        flex-wrap: wrap;
        gap: var(--ac-spacing-md);
      }

      .page-title {
        font-size: var(--ac-type-h1);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
        margin: 0 0 var(--ac-spacing-xs) 0;
      }

      .page-subtitle {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-muted);
        margin: 0;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--ac-spacing-sm);
        flex-wrap: wrap;
      }

      .btn-share-link {
        color: var(--ac-color-primary);
        text-decoration: none;
        font-weight: var(--ac-font-weight-medium);
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
      }

      .btn-share-link:hover {
        text-decoration: underline;
      }

      .btn-print {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-spacing-xs);
        background: var(--ac-color-primary);
        color: var(--ac-color-surface);
        border: none;
        padding: var(--ac-spacing-sm) var(--ac-spacing-lg);
        border-radius: var(--ac-radius-md);
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-print:hover {
        opacity: 0.92;
      }

      .controls-panel {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ac-spacing-md);
        align-items: flex-end;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-md);
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-xs);
        min-width: 200px;
      }

      .control-label {
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
      }

      .control-select {
        padding: var(--ac-spacing-sm);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-background);
        color: var(--ac-color-text);
        font-size: var(--ac-type-body);
      }

      .tabs-group {
        display: flex;
        gap: var(--ac-spacing-xs);
        margin-left: auto;
      }

      .tab-btn {
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-background);
        color: var(--ac-color-text-muted);
        cursor: pointer;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-medium);
        transition: all 0.2s;
      }

      .tab-btn.active {
        background: var(--ac-color-primary);
        color: var(--ac-color-surface);
        border-color: var(--ac-color-primary);
      }

      .print-only {
        display: none;
      }

      .report-main {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-md);
      }

      .section-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--ac-spacing-md);
      }

      .section-heading h2 {
        font-size: var(--ac-type-h2);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
        margin: 0;
      }

      .badge-source {
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
        background: color-mix(in srgb, var(--ac-color-border) 60%, transparent);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
      }

      .notice-callout,
      .warning-callout {
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        display: flex;
        align-items: flex-start;
        gap: var(--ac-spacing-sm);
        margin-bottom: var(--ac-spacing-md);
      }

      .notice-callout {
        background: color-mix(in srgb, var(--ac-color-primary) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--ac-color-primary) 30%, transparent);
        color: var(--ac-color-text);
      }

      .warning-callout {
        background: color-mix(in srgb, var(--ac-color-warning) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--ac-color-warning) 40%, transparent);
        color: var(--ac-color-text);
      }

      .notice-icon,
      .warning-icon {
        font-size: 1.25rem;
        line-height: 1;
      }

      .metrics-summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--ac-spacing-md);
        margin-bottom: var(--ac-spacing-md);
      }

      .summary-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-xs);
      }

      .summary-label {
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .summary-value {
        font-size: var(--ac-type-h2);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
      }

      .reports-list {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-md);
      }

      .report-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-sm);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .card-title {
        font-size: var(--ac-type-h3);
        font-weight: var(--ac-font-weight-bold);
        margin: 0;
        color: var(--ac-color-text);
      }

      .card-date {
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .chip-status {
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-bold);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
        background: color-mix(in srgb, var(--ac-color-success) 15%, transparent);
        color: var(--ac-color-success);
      }

      .report-summary {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text);
        line-height: 1.5;
        margin: 0;
      }

      .metrics-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ac-spacing-xs);
        margin-top: var(--ac-spacing-xs);
      }

      .metric-pill {
        background: color-mix(in srgb, var(--ac-color-surface) 60%, var(--ac-color-border));
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-full, 9999px);
        padding: 0.2rem 0.6rem;
        font-size: var(--ac-type-small);
        display: inline-flex;
        gap: 0.25rem;
      }

      .metric-name {
        color: var(--ac-color-text-muted);
        text-transform: capitalize;
      }

      .metric-val {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
      }

      .table-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        overflow-x: auto;
      }

      .report-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: var(--ac-type-body);
      }

      .report-table th {
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        background: color-mix(in srgb, var(--ac-color-surface) 60%, var(--ac-color-border));
        color: var(--ac-color-text);
        font-weight: var(--ac-font-weight-bold);
        border-bottom: 1px solid var(--ac-color-border);
        white-space: nowrap;
      }

      .report-table td {
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        border-bottom: 1px solid var(--ac-color-border);
        vertical-align: top;
        color: var(--ac-color-text);
      }

      .category-chip {
        background: color-mix(in srgb, var(--ac-color-primary) 15%, transparent);
        color: var(--ac-color-primary);
        font-weight: var(--ac-font-weight-medium);
        font-size: var(--ac-type-small);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
      }

      .intensity-chip {
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-bold);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
        display: inline-block;
      }

      .int-1,
      .int-2 {
        background: color-mix(in srgb, var(--ac-color-success) 15%, transparent);
        color: var(--ac-color-success);
      }

      .int-3 {
        background: color-mix(in srgb, var(--ac-color-warning) 15%, transparent);
        color: var(--ac-color-warning);
      }

      .int-4,
      .int-5 {
        background: color-mix(in srgb, var(--ac-color-danger) 15%, transparent);
        color: var(--ac-color-danger);
      }

      .screening-summary-card,
      .suggestions-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-lg);
        margin-bottom: var(--ac-spacing-md);
      }

      .concern-chip {
        padding: 0.2rem 0.6rem;
        border-radius: var(--ac-radius-sm);
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-bold);
      }

      .risk-high {
        background: color-mix(in srgb, var(--ac-color-danger) 15%, transparent);
        color: var(--ac-color-danger);
      }

      .risk-moderate,
      .risk-medium {
        background: color-mix(in srgb, var(--ac-color-warning) 15%, transparent);
        color: var(--ac-color-warning);
      }

      .risk-low {
        background: color-mix(in srgb, var(--ac-color-success) 15%, transparent);
        color: var(--ac-color-success);
      }

      .domain-scores-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--ac-spacing-md);
        margin-top: var(--ac-spacing-md);
      }

      .domain-card {
        background: color-mix(in srgb, var(--ac-color-background) 50%, var(--ac-color-surface));
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-sm);
        padding: var(--ac-spacing-sm);
      }

      .domain-head {
        display: flex;
        justify-content: space-between;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-medium);
        margin-bottom: var(--ac-spacing-xs);
      }

      .progress-bar-bg {
        height: 8px;
        background: color-mix(in srgb, var(--ac-color-border) 60%, transparent);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--ac-color-primary);
      }

      .suggestions-title {
        font-size: var(--ac-type-h3);
        font-weight: var(--ac-font-weight-bold);
        margin: 0 0 var(--ac-spacing-md) 0;
      }

      .suggestions-list {
        margin: 0;
        padding-left: var(--ac-spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-sm);
        font-size: var(--ac-type-body);
        line-height: 1.5;
      }

      .loading-state {
        padding: var(--ac-spacing-xl);
        display: flex;
        justify-content: center;
      }

      /* Print Stylesheet */
      @media print {
        .no-print {
          display: none !important;
        }

        .print-only {
          display: block !important;
        }

        body,
        .reports-container {
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
          color: var(--ac-text-primary) !important;
        }

        .print-header {
          border-bottom: 2px solid var(--ac-text-primary);
          padding-bottom: 12pt;
          margin-bottom: 16pt;
        }

        .print-brand {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .print-brand h2 {
          margin: 0;
          font-size: 16pt;
        }

        .report-badge {
          border: 1px solid var(--ac-text-primary);
          padding: 2pt 6pt;
          font-size: 9pt;
          font-weight: bold;
        }

        .print-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6pt;
          margin-top: 8pt;
          font-size: 10pt;
        }

        .print-disclaimer {
          margin-top: 10pt;
          font-size: 8.5pt;
          font-style: italic;
          border-top: 1px solid var(--ac-border);
          padding-top: 4pt;
        }

        .report-card,
        .table-card,
        .screening-summary-card,
        .suggestions-card {
          border: 1px solid var(--ac-text-muted) !important;
          page-break-inside: avoid;
          box-shadow: none !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  private readonly childrenApi = inject(ChildrenApi);
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly observationsApi = inject(ObservationsApi);
  private readonly screeningApi = inject(ScreeningApi);

  readonly currentDate = new Date();
  readonly children = signal<ChildResponse[]>([]);
  readonly selectedChildId = signal('');
  readonly activeTab = signal<ReportTab>('school');
  readonly dateRange = signal<DateRange>('30d');
  readonly loading = signal(true);

  readonly schoolReports = signal<ActivityReportListItem[]>([]);
  readonly observations = signal<ObservationResponse[]>([]);
  readonly screeningResult = signal<ScreeningSessionResultResponse | null>(null);

  readonly activeChild = computed(() =>
    this.children().find((c) => c.id === this.selectedChildId()),
  );

  readonly dateRangeLabel = computed(() => {
    switch (this.dateRange()) {
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      case '90d':
        return 'Last 90 days';
      default:
        return 'All time';
    }
  });

  readonly activeTabLabel = computed(() => {
    switch (this.activeTab()) {
      case 'school':
        return 'School Activity Reports';
      case 'behaviour':
        return 'Parent Observations';
      case 'educational':
        return 'Educational Guidance & Screening';
    }
  });

  private getCutoffDate(): Date | null {
    const range = this.dateRange();
    if (range === 'all') return null;
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  readonly filteredSchoolReports = computed(() => {
    const cutoff = this.getCutoffDate();
    if (!cutoff) return this.schoolReports();
    return this.schoolReports().filter((r) => new Date(r.createdAt) >= cutoff);
  });

  readonly filteredObservations = computed(() => {
    const cutoff = this.getCutoffDate();
    if (!cutoff) return this.observations();
    return this.observations().filter((o) => new Date(o.occurredAt) >= cutoff);
  });

  readonly topCategory = computed(() => {
    const list = this.filteredObservations();
    if (list.length === 0) return 'None';
    const counts: Record<string, number> = {};
    for (const o of list) counts[o.category] = (counts[o.category] || 0) + 1;
    let top = 'None';
    let max = 0;
    for (const [cat, cnt] of Object.entries(counts)) {
      if (cnt > max) {
        max = cnt;
        top = cat;
      }
    }
    return top;
  });

  readonly uniqueTriggersCount = computed(() => {
    const triggers = this.filteredObservations()
      .map((o) => o.trigger?.trim())
      .filter(Boolean);
    return new Set(triggers).size;
  });

  ngOnInit(): void {
    this.loadChildren();
  }

  loadChildren(): void {
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        if (children.length > 0 && !this.selectedChildId()) {
          this.selectedChildId.set(children[0]?.id || '');
          this.loadChildData(children[0]?.id || '');
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  onChildChange(childId: string): void {
    this.selectedChildId.set(childId);
    this.loadChildData(childId);
  }

  loadChildData(childId: string): void {
    if (!childId) return;
    this.loading.set(true);

    this.schoolsApi.listReportsWithChild({ childId, status: 'SUBMITTED' }).subscribe({
      next: (res) => this.schoolReports.set(res?.reports || []),
      error: () => this.schoolReports.set([]),
    });

    this.observationsApi.list({ childId }).subscribe({
      next: (obs) => this.observations.set(obs || []),
      error: () => this.observations.set([]),
    });

    this.screeningApi.getLatest(childId).subscribe({
      next: (result) => {
        this.screeningResult.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.screeningResult.set(null);
        this.loading.set(false);
      },
    });
  }

  printReport(): void {
    window.print();
  }
}
