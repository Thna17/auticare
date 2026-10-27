import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { AppointmentResponse, AppointmentStatus } from '@auticare/contracts';
import { HospitalManagementApi } from './hospital-management.api';
import { HospitalStaffState } from './data-access/hospital-staff.state';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { UiButtonComponent } from '../../design-system/components/ui-button.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { RejectReasonModalComponent } from './reject-reason-modal.component';
import { AppointmentDetailDrawerComponent } from './appointment-detail-drawer.component';
import { statusPresentation, statusTone } from '../appointments/appointments.types';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

export type StatusFilter = 'ALL' | 'TODAY' | AppointmentStatus;

export const statusFilters: ReadonlyArray<{
  value: StatusFilter;
  label: string;
  tabLabel: string;
}> = [
  { value: 'ALL', label: 'All', tabLabel: 'All' },
  { value: 'TODAY', label: "Today's Visits", tabLabel: "Today's Visits" },
  { value: 'REQUESTED', label: 'Pending Approval', tabLabel: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed', tabLabel: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed', tabLabel: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled', tabLabel: 'Cancelled' },
];

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    RejectReasonModalComponent,
    AppointmentDetailDrawerComponent,
    UiMessageComponent,
    UiSpinnerComponent,
  ],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <span>Dashboard</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Appointment requests</span>
    </nav>

    <section class="page-header">
      <div class="header-main">
        <p class="eyebrow">Clinical Appointments &amp; Queue</p>
        <div class="header-title-row">
          <h1>Appointment requests</h1>
          <div class="queue-status-indicator">
            <span class="live-dot" aria-hidden="true"></span>
            <span>Daily Queue Active &bull; {{ todayCount() }} scheduled today</span>
          </div>
        </div>
        <p class="subtitle">
          Manage specialist triage, review developmental dossiers, coordinate check-ins, and keep
          families informed.
        </p>
      </div>
    </section>

    <!-- Gentle Sensory Feedback Alert Banner -->
    @if (sensoryFeedback(); as feedback) {
      <div class="sensory-feedback-banner" role="status" aria-live="polite">
        <div class="feedback-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <span class="feedback-text">{{ feedback }}</span>
        <button
          type="button"
          class="dismiss-feedback-btn"
          (click)="sensoryFeedback.set(null)"
          aria-label="Dismiss feedback"
        >
          ✕
        </button>
      </div>
    }

    <!-- Top KPI Cards -->
    <section class="stats" aria-label="Request summary">
      <button
        type="button"
        class="stat-card pending-stat"
        [class.active]="statusFilter() === 'REQUESTED'"
        (click)="statusFilter.set('REQUESTED')"
      >
        <div class="stat-top">
          <p class="stat-label">Pending</p>
          <span class="stat-badge-pill">{{ counts().pending }}</span>
        </div>
        <p class="stat-value">{{ counts().pending }}</p>
      </button>

      <button
        type="button"
        class="stat-card approved-stat"
        [class.active]="statusFilter() === 'CONFIRMED'"
        (click)="statusFilter.set('CONFIRMED')"
      >
        <div class="stat-top">
          <p class="stat-label">Approved</p>
          <span class="stat-badge-pill">{{ counts().approved }}</span>
        </div>
        <p class="stat-value">{{ counts().approved }}</p>
      </button>

      <button
        type="button"
        class="stat-card completed-stat"
        [class.active]="statusFilter() === 'COMPLETED'"
        (click)="statusFilter.set('COMPLETED')"
      >
        <div class="stat-top">
          <p class="stat-label">Completed</p>
          <span class="stat-badge-pill">{{ counts().completed }}</span>
        </div>
        <p class="stat-value">{{ counts().completed }}</p>
      </button>

      <button
        type="button"
        class="stat-card rejected-stat"
        [class.active]="statusFilter() === 'CANCELLED'"
        (click)="statusFilter.set('CANCELLED')"
      >
        <div class="stat-top">
          <p class="stat-label">Rejected</p>
          <span class="stat-badge-pill">{{ counts().rejected }}</span>
        </div>
        <p class="stat-value">{{ counts().rejected }}</p>
      </button>
    </section>

    <section class="list-section">
      <!-- Status Filter Tabs & Controls -->
      <div class="filter-bar">
        <div class="status-pills" role="tablist" aria-label="Filter by status">
          @for (option of statusFilters; track option.value) {
            <button
              type="button"
              role="tab"
              [class.active]="statusFilter() === option.value"
              [attr.aria-selected]="statusFilter() === option.value"
              (click)="statusFilter.set(option.value)"
            >
              <span>{{ option.label }}</span>
              <span class="pill-count">{{ getTabCount(option.value) }}</span>
            </button>
          }
        </div>

        <div class="filter-controls">
          <div class="search-wrap">
            <svg
              class="search-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="search"
              aria-label="Search appointments"
              class="search-input"
              placeholder="Search patient, doctor, reason…"
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
            />
            @if (searchQuery()) {
              <button
                type="button"
                class="clear-search-btn"
                (click)="searchQuery.set('')"
                aria-label="Clear search"
              >
                ✕
              </button>
            }
          </div>

          @if (!isDoctor()) {
            <div class="doctor-select-wrap">
              <select
                aria-label="Filter appointments by doctor"
                class="doctor-select"
                [value]="doctorFilter()"
                (change)="doctorFilter.set($any($event.target).value)"
              >
                <option value="ALL">All doctors ({{ doctorNames().length }})</option>
                @for (doctor of doctorNames(); track doctor) {
                  <option [value]="doctor">{{ doctor }}</option>
                }
              </select>
            </div>
          }

          <div class="view-switch-group" role="group" aria-label="View format">
            <button
              type="button"
              class="view-switch-btn"
              [class.active]="viewMode() === 'board'"
              (click)="viewMode.set('board')"
              aria-label="Queue board view"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Board</span>
            </button>
            <button
              type="button"
              class="view-switch-btn"
              [class.active]="viewMode() === 'table'"
              (click)="viewMode.set('table')"
              aria-label="Table view"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <ac-ui-spinner label="Loading appointment requests…" />
      } @else if (error()) {
        <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
      } @else if (visibleAppointments().length === 0) {
        <ac-ui-empty-state
          title="No requests to show"
          message="Nothing matches these filters right now."
        />
      } @else if (viewMode() === 'board') {
        <!-- Daily Patient Queue & Scheduling Board View -->
        <div class="patient-queue-grid">
          @for (item of visibleAppointments(); track item.id) {
            <article
              class="patient-quick-card"
              [class.checked-in]="isCheckedIn(item.id)"
              (click)="openDetail(item)"
              role="button"
              tabindex="0"
              (keydown.enter)="openDetail(item)"
            >
              <div class="card-top-bar">
                <div class="patient-avatar-chip">
                  <div class="avatar-circle">{{ getInitials(item.childName) }}</div>
                  <div class="patient-info-meta">
                    <h3 class="patient-name">{{ item.childName ?? 'Patient TBD' }}</h3>
                    <span class="patient-age-badge">{{ formatAge(item.childDateOfBirth) }}</span>
                  </div>
                </div>
                <ac-ui-badge [tone]="statusTone[item.status]">
                  {{ statusPresentation[item.status].label }}
                </ac-ui-badge>
              </div>

              <div class="card-scheduled-strip">
                <div class="scheduled-time-chip">
                  <svg
                    class="time-icon"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{ formatTimeChip(item.scheduledAt) }}</span>
                  <span class="date-chip-sub">&bull; {{ formatShortDate(item.scheduledAt) }}</span>
                </div>
                @if (isCheckedIn(item.id)) {
                  <span class="checked-in-pill">
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Checked In
                  </span>
                }
              </div>

              <div class="card-details-section">
                <div class="diagnosis-row">
                  <span class="detail-label">Consultation Focus / Reason</span>
                  <p class="diagnosis-text" [title]="item.reason ?? ''">
                    {{ item.reason ?? 'Developmental screening evaluation' }}
                  </p>
                </div>

                <div class="doctor-guardian-meta">
                  <div class="meta-item">
                    <span class="detail-label">Specialist</span>
                    <span class="meta-val">{{ item.doctorName ?? 'Unassigned' }}</span>
                  </div>
                  @if (item.parentName) {
                    <div class="meta-item">
                      <span class="detail-label">Guardian</span>
                      <span class="meta-val">{{ item.parentName }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="card-actions-bar" (click)="$event.stopPropagation()">
                @if (item.status === 'REQUESTED') {
                  <button type="button" class="action-pill confirm-pill" (click)="approve(item)">
                    Confirm
                  </button>
                  <button type="button" class="action-pill reject-pill" (click)="openReject(item)">
                    Decline
                  </button>
                } @else if (item.status === 'CONFIRMED') {
                  @if (!isCheckedIn(item.id)) {
                    <button type="button" class="action-pill checkin-pill" (click)="checkIn(item)">
                      Check-in
                    </button>
                  }
                  <button type="button" class="action-pill complete-pill" (click)="complete(item)">
                    Complete
                  </button>
                  <button type="button" class="action-pill view-pill" (click)="openDetail(item)">
                    Dossier
                  </button>
                } @else {
                  <button type="button" class="action-pill view-pill" (click)="openDetail(item)">
                    View Dossier
                  </button>
                }
              </div>
            </article>
          }
        </div>
      } @else {
        <!-- Table View -->
        <div class="table-wrap">
          <table class="appointments-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date &amp; time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of visibleAppointments(); track item.id) {
                <tr (click)="openDetail(item)" class="appointment-row">
                  <td>
                    <div class="patient-cell">
                      <div class="patient-row-header">
                        <span class="patient-name">{{ item.childName ?? 'Patient TBD' }}</span>
                        <span class="patient-age-inline">{{
                          formatAge(item.childDateOfBirth)
                        }}</span>
                      </div>
                      @if (item.parentName) {
                        <span class="guardian-hint">Guardian: {{ item.parentName }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="doctor-cell">
                      <span class="doctor-name">{{ item.doctorName ?? 'Unassigned' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="date-cell">
                      <span class="time-bold">{{ formatTimeChip(item.scheduledAt) }}</span>
                      <span class="date-sub">{{ formatDate(item.scheduledAt) }}</span>
                    </div>
                  </td>
                  <td class="reason-cell" [title]="item.reason ?? ''">
                    {{ item.reason ?? '—' }}
                  </td>
                  <td>
                    <div class="status-stack">
                      <ac-ui-badge [tone]="statusTone[item.status]">
                        {{ statusPresentation[item.status].label }}
                      </ac-ui-badge>
                      @if (isCheckedIn(item.id)) {
                        <span class="checked-in-pill mini">✓ Checked In</span>
                      }
                    </div>
                  </td>
                  <td class="actions-cell" (click)="$event.stopPropagation()">
                    @if (item.status === 'REQUESTED') {
                      <ac-ui-button variant="primary" (click)="approve(item)">Approve</ac-ui-button>
                      <ac-ui-button variant="destructive" (click)="openReject(item)">
                        Reject
                      </ac-ui-button>
                    } @else if (item.status === 'CONFIRMED') {
                      @if (!isCheckedIn(item.id)) {
                        <button
                          type="button"
                          class="action-pill checkin-pill"
                          (click)="checkIn(item)"
                        >
                          Check-in
                        </button>
                      }
                      <ac-ui-button variant="primary" (click)="complete(item)">
                        Mark Completed
                      </ac-ui-button>
                      <ac-ui-button variant="secondary" (click)="openDetail(item)">
                        View
                      </ac-ui-button>
                    } @else {
                      <ac-ui-button variant="secondary" (click)="openDetail(item)">
                        View
                      </ac-ui-button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <!-- Reject Reason Modal -->
    @if (rejectingAppointment(); as target) {
      <ac-reject-reason-modal
        [appointment]="target"
        (cancel)="rejectingAppointment.set(null)"
        (confirm)="confirmReject(target, $event)"
      />
    }

    <!-- Interactive Appointment Detail Drawer -->
    @if (detailAppointment(); as target) {
      <ac-appointment-detail-drawer
        [appointment]="target"
        [allAppointments]="appointments()"
        (close)="detailAppointment.set(null)"
        (approve)="approve(target)"
        (reject)="openReject(target)"
        (complete)="complete(target)"
      />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1040px;
        margin: 0 auto;
      }

      .breadcrumbs {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .breadcrumbs span[aria-current] {
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
      }

      .page-header {
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: var(--ac-color-action);
        font-size: var(--ac-type-meta);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .header-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }

      h1 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
      }

      .queue-status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-slate);
        font-weight: var(--ac-font-weight-medium);
      }

      .live-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--ac-color-success);
        box-shadow: 0 0 0 2px var(--ac-color-green-tint-50);
      }

      .subtitle {
        margin: 0;
        max-width: 640px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      /* ── Sensory Feedback Banner ─────────────────────────────── */
      .sensory-feedback-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-sage-light);
        border: 1px solid var(--ac-color-olive-light);
        margin-bottom: 20px;
        animation: fadeInFeedback 200ms ease;
      }

      @keyframes fadeInFeedback {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .feedback-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 999px;
        background: var(--ac-color-success);
        color: var(--ac-color-surface);
        flex-shrink: 0;
      }

      .feedback-text {
        flex: 1;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-olive-darkest);
      }

      .dismiss-feedback-btn {
        background: transparent;
        border: 0;
        color: var(--ac-color-text-muted);
        cursor: pointer;
        padding: 4px;
        font-size: 14px;
      }

      /* ── KPI Cards ─────────────────────────────────────────── */
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 16px 20px;
        text-align: left;
        cursor: pointer;
        font-family: inherit;
        transition:
          border-color 0.15s ease,
          transform 0.15s ease,
          box-shadow 0.15s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-md);
      }

      .stat-card.active {
        border-color: var(--ac-color-action);
        outline: 2px solid var(--ac-color-action);
        outline-offset: -1px;
      }

      .stat-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .stat-label {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .stat-badge-pill {
        display: inline-block;
        padding: 1px 7px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-slate);
        font-size: 11px;
        font-weight: 700;
      }

      .pending-stat.active .stat-badge-pill {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-800);
      }

      .stat-value {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 26px;
        font-weight: var(--ac-font-weight-bold);
        line-height: 1;
      }

      /* ── List Section & Toolbar ──────────────────────────────── */
      .list-section {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-6);
      }

      .filter-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }

      .status-pills {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .status-pills button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        padding: 0 12px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all 160ms ease;
      }

      .status-pills button:hover {
        background: var(--ac-color-surface-slate);
      }

      .status-pills button.active {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .pill-count {
        display: inline-block;
        padding: 1px 6px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-slate-100);
        color: var(--ac-color-slate-700);
        font-size: 11px;
        font-weight: 700;
      }

      .status-pills button.active .pill-count {
        background: var(--ac-color-action-deep);
        color: var(--ac-color-text-on-action);
      }

      .filter-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .search-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 10px;
        color: var(--ac-color-text-muted);
        pointer-events: none;
      }

      .search-input {
        min-height: 38px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-sm);
        padding: 0 30px 0 32px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text);
        background: var(--ac-color-surface);
        min-width: 200px;
      }

      .search-input:focus {
        outline: 2px solid var(--ac-color-action);
        outline-offset: -1px;
      }

      .clear-search-btn {
        position: absolute;
        right: 8px;
        background: transparent;
        border: 0;
        color: var(--ac-color-text-muted);
        font-size: 12px;
        cursor: pointer;
        padding: 2px 4px;
      }

      .doctor-select-wrap select {
        min-height: 38px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-sm);
        padding: 0 10px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text);
        background: var(--ac-color-surface);
      }

      .view-switch-group {
        display: inline-flex;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-pill);
        overflow: hidden;
      }

      .view-switch-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 12px;
        border: 0;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all 140ms ease;
      }

      .view-switch-btn.active {
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
      }

      /* ── Queue Board Card Grid ───────────────────────────────── */
      .patient-queue-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
        gap: 16px;
      }

      .patient-quick-card {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        cursor: pointer;
        transition:
          transform 140ms ease,
          box-shadow 140ms ease,
          border-color 140ms ease;
      }

      .patient-quick-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-md);
        border-color: var(--ac-color-action-alt);
      }

      .patient-quick-card.checked-in {
        border-color: var(--ac-color-success);
        background: var(--ac-color-surface);
      }

      .card-top-bar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .patient-avatar-chip {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .avatar-circle {
        width: 38px;
        height: 38px;
        border-radius: 999px;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-action-darkest);
        font-weight: var(--ac-font-weight-bold);
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .patient-info-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .patient-name {
        margin: 0;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-slate-strong);
      }

      .patient-age-badge {
        font-size: 11.5px;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
      }

      .card-scheduled-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 6px 10px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface-slate);
      }

      .scheduled-time-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ac-color-action-deep);
        font-size: 12.5px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .time-icon {
        color: var(--ac-color-action);
      }

      .date-chip-sub {
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-normal);
        font-size: 11.5px;
      }

      .checked-in-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-sage-light);
        border: 1px solid var(--ac-color-olive-light);
        color: var(--ac-color-olive-darkest);
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
      }

      .checked-in-pill.mini {
        padding: 1px 6px;
        font-size: 10px;
      }

      .card-details-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
      }

      .detail-label {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
        margin-bottom: 2px;
      }

      .diagnosis-text {
        margin: 0;
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-body);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .doctor-guardian-meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding-top: 4px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .meta-item {
        display: flex;
        flex-direction: column;
      }

      .meta-val {
        font-size: 12px;
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-medium);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-actions-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .action-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 12px;
        border-radius: var(--ac-radius-sm);
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 140ms ease;
      }

      .confirm-pill {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        flex: 1;
      }

      .confirm-pill:hover {
        background: var(--ac-color-action-deep);
      }

      .reject-pill {
        background: var(--ac-color-surface);
        border-color: var(--ac-color-border-slate);
        color: var(--ac-color-alert-text);
      }

      .reject-pill:hover {
        background: var(--ac-color-surface-slate);
      }

      .checkin-pill {
        background: var(--ac-color-sage-light);
        border-color: var(--ac-color-olive-light);
        color: var(--ac-color-olive-darkest);
        font-weight: var(--ac-font-weight-bold);
      }

      .checkin-pill:hover {
        background: var(--ac-color-sage);
      }

      .complete-pill {
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        flex: 1;
      }

      .complete-pill:hover {
        background: var(--ac-color-action-deep);
      }

      .view-pill {
        background: var(--ac-color-surface);
        border-color: var(--ac-color-border-slate);
        color: var(--ac-color-text-body);
      }

      .view-pill:hover {
        background: var(--ac-color-surface-slate);
      }

      /* ── Table Styles ────────────────────────────────────────── */
      .table-wrap {
        overflow-x: auto;
      }

      .appointments-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--ac-type-meta);
      }

      .appointments-table thead th {
        text-align: left;
        padding: 10px 12px;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.04em;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .appointment-row {
        cursor: pointer;
        border-bottom: 1px solid var(--ac-color-border-slate);
        transition: background 140ms ease;
      }

      .appointment-row:hover {
        background: var(--ac-color-background);
      }

      .appointment-row td {
        padding: 12px;
        color: var(--ac-color-text);
        vertical-align: middle;
      }

      .patient-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .patient-row-header {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .patient-name {
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .patient-age-inline {
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .guardian-hint {
        font-size: 11.5px;
        color: var(--ac-color-text-muted);
      }

      .doctor-cell {
        color: var(--ac-color-action-darkest);
        font-weight: 500;
      }

      .date-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .time-bold {
        color: var(--ac-color-action-deep);
        font-weight: 600;
      }

      .date-sub {
        font-size: 11px;
        color: var(--ac-color-text-muted);
        white-space: nowrap;
      }

      .reason-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--ac-color-text-muted);
      }

      .status-stack {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
      }

      .actions-cell {
        display: flex;
        gap: 8px;
        align-items: center;
        white-space: nowrap;
      }

      @media (max-width: 720px) {
        .appointments-table tr,
        .appointments-table td {
          display: block;
          width: 100%;
        }

        .appointments-table thead {
          display: none;
        }

        .appointment-row {
          border: 1px solid var(--ac-color-border-slate);
          border-radius: var(--ac-radius-sm);
          margin-bottom: 12px;
          padding: 12px;
        }

        .appointment-row td {
          padding: 4px 0;
        }

        .actions-cell {
          padding-top: 8px;
        }
      }
    `,
  ],
})
export class HospitalAppointmentsPage {
  private readonly api = inject(HospitalManagementApi);
  protected readonly isDoctor = inject(HospitalStaffState).isDoctor;

  protected readonly appointments = signal<readonly AppointmentResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly statusFilter = signal<StatusFilter>('ALL');
  protected readonly doctorFilter = signal('ALL');
  protected readonly statusFilters = statusFilters;
  protected readonly statusPresentation = statusPresentation;
  protected readonly statusTone = statusTone;

  protected readonly rejectingAppointment = signal<AppointmentResponse | null>(null);
  protected readonly detailAppointment = signal<AppointmentResponse | null>(null);

  protected readonly searchQuery = signal('');
  protected readonly viewMode = signal<'board' | 'table'>('board');
  protected readonly checkedInIds = signal<Set<string>>(new Set());
  protected readonly sensoryFeedback = signal<string | null>(null);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly counts = computed(() => {
    const items = this.appointments();
    return {
      pending: items.filter((a) => a.status === 'REQUESTED').length,
      approved: items.filter((a) => a.status === 'CONFIRMED').length,
      completed: items.filter((a) => a.status === 'COMPLETED').length,
      rejected: items.filter((a) => a.status === 'CANCELLED').length,
    };
  });

  protected readonly todayCount = computed(() => {
    return this.appointments().filter((a) => this.isToday(a.scheduledAt)).length;
  });

  protected readonly totalCount = computed(() => this.appointments().length);

  protected readonly doctorNames = computed(() =>
    Array.from(
      new Set(
        this.appointments()
          .map((a) => a.doctorName)
          .filter((name): name is string => !!name),
      ),
    ).sort(),
  );

  protected readonly visibleAppointments = computed(() => {
    const status = this.statusFilter();
    const doctor = this.doctorFilter();
    const query = this.searchQuery().trim().toLowerCase();
    return this.appointments().filter((item) => {
      if (status === 'TODAY') {
        if (!this.isToday(item.scheduledAt)) return false;
      } else if (status !== 'ALL' && item.status !== status) {
        return false;
      }
      if (doctor !== 'ALL' && item.doctorName !== doctor) return false;
      if (query) {
        const patientMatch = item.childName?.toLowerCase().includes(query) ?? false;
        const doctorMatch = item.doctorName?.toLowerCase().includes(query) ?? false;
        const reasonMatch = item.reason?.toLowerCase().includes(query) ?? false;
        if (!patientMatch && !doctorMatch && !reasonMatch) return false;
      }
      return true;
    });
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.appointments().subscribe({
      next: (v) => {
        this.appointments.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load appointments.');
        this.loading.set(false);
      },
    });
  }

  protected getTabCount(filter: StatusFilter): number {
    switch (filter) {
      case 'ALL':
        return this.totalCount();
      case 'TODAY':
        return this.todayCount();
      case 'REQUESTED':
        return this.counts().pending;
      case 'CONFIRMED':
        return this.counts().approved;
      case 'COMPLETED':
        return this.counts().completed;
      case 'CANCELLED':
        return this.counts().rejected;
    }
  }

  protected approve(item: AppointmentResponse) {
    this.setStatus(
      item,
      'CONFIRMED',
      undefined,
      `✓ Appointment confirmed for ${item.childName ?? 'patient'}. Sensory accommodations logged.`,
    );
  }

  protected checkIn(item: AppointmentResponse) {
    const updated = new Set(this.checkedInIds());
    updated.add(item.id);
    this.checkedInIds.set(updated);
    this.showSensoryFeedback(
      `✓ Patient ${item.childName ?? 'Patient'} checked in for ${this.formatTimeChip(item.scheduledAt)}. Care team alerted & sensory room prepared.`,
    );
  }

  protected isCheckedIn(id: string): boolean {
    return this.checkedInIds().has(id);
  }

  protected complete(item: AppointmentResponse) {
    this.setStatus(
      item,
      'COMPLETED',
      undefined,
      `✓ Consultation concluded for ${item.childName ?? 'patient'}. Clinical summary generated.`,
    );
  }

  protected openReject(item: AppointmentResponse) {
    this.detailAppointment.set(null);
    this.rejectingAppointment.set(item);
  }

  protected confirmReject(item: AppointmentResponse, reason: string) {
    this.rejectingAppointment.set(null);
    this.setStatus(item, 'CANCELLED', reason);
  }

  protected openDetail(item: AppointmentResponse) {
    this.detailAppointment.set(item);
  }

  protected isToday(iso: string | null | undefined): boolean {
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  protected formatTimeChip(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Time unrecorded';
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  protected formatShortDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Date unrecorded';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  protected formatDate(scheduledAt: string): string {
    return new Date(scheduledAt).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  protected formatAge(dob: string | null | undefined): string {
    if (!dob) return 'Age unrecorded';
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return 'Age unrecorded';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 0) return 'Infant';
    if (years === 0) return `${months} mo${months === 1 ? '' : 's'} old`;
    if (months === 0) return `${years} yr${years === 1 ? '' : 's'} old`;
    return `${years}y ${months}m`;
  }

  protected getInitials(name: string | null | undefined): string {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  protected showSensoryFeedback(message: string) {
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }
    this.sensoryFeedback.set(message);
    this.feedbackTimer = setTimeout(() => {
      this.sensoryFeedback.set(null);
      this.feedbackTimer = null;
    }, 4000);
  }

  private setStatus(
    item: AppointmentResponse,
    status: AppointmentStatus,
    reason?: string,
    successFeedback?: string,
  ) {
    this.api.changeStatus(item.id, status, reason).subscribe({
      next: () => {
        this.detailAppointment.set(null);
        if (successFeedback) {
          this.showSensoryFeedback(successFeedback);
        }
        this.load();
      },
      error: () => this.error.set('This status change is not allowed.'),
    });
  }
}
