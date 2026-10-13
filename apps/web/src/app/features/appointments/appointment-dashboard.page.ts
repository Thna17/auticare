import type { OnDestroy, OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { AppointmentsFacade } from './state/appointments.facade';
import type { AppointmentResponse } from '@auticare/contracts';
import type { AppointmentStatus } from './appointments.types';
import { statusPresentation, statusTone } from './appointments.types';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { RescheduleAppointmentModalComponent } from './reschedule-appointment-modal.component';
import { AuthService } from '../../core/auth/auth.service';

type TimeFilter = 'ALL' | 'UPCOMING' | 'PAST';

const statusFilterOptions: ReadonlyArray<{ value: AppointmentStatus; label: string }> = [
  { value: 'REQUESTED', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiEmptyStateComponent,
    UiBadgeComponent,
    UiMessageComponent,
    UiPaginationComponent,
    UiSpinnerComponent,
    RescheduleAppointmentModalComponent,
  ],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <span>Dashboard</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Appointments</span>
    </nav>

    <section class="page-header">
      <div>
        <h1>Appointment Dashboard</h1>
        <p>
          {{
            isAdmin()
              ? 'Administrative oversight for all clinical appointments across the platform.'
              : 'Track upcoming visits, specialist schedules, and clinical consultations.'
          }}
        </p>
      </div>
      @if (!isAdmin()) {
        <a class="schedule-cta" routerLink="/appointments/new">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Schedule New
        </a>
      }
    </section>

    @if (isAdmin()) {
      <section class="admin-oversight-banner" aria-label="Administrative Appointment Oversight">
        <div class="admin-oversight-top">
          <span class="admin-pill">ADMIN OVERSIGHT</span>
          <h2>Administrative Appointment Oversight</h2>
          <p>
            You have system-wide visibility into all patient bookings and specialist schedules.
            Filter by parent, child, or specialist below.
          </p>
        </div>
        <div class="admin-filter-row">
          <input
            type="search"
            class="admin-search-input"
            placeholder="Filter by parent, child, or specialist…"
            [value]="adminSearchQuery()"
            (input)="adminSearchQuery.set($any($event.target).value)"
            aria-label="Filter appointments by parent, child, or specialist"
          />
          @if (adminSearchQuery()) {
            <button type="button" class="admin-clear-btn" (click)="adminSearchQuery.set('')">
              Clear filter
            </button>
          }
        </div>
      </section>
    }

    <section class="stats" aria-label="Appointment summary">
      <article class="stat-card">
        <div class="stat-header">
          <span class="stat-icon upcoming-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
          <p class="stat-label">Upcoming Visits</p>
        </div>
        <p class="stat-value">{{ facade.stats().upcoming }}</p>
        <p class="stat-desc">Scheduled &amp; confirmed clinical sessions</p>
      </article>

      <article class="stat-card">
        <div class="stat-header">
          <span class="stat-icon pending-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </span>
          <p class="stat-label">Pending Approval</p>
        </div>
        <p class="stat-value">{{ facade.stats().pendingReview }}</p>
        <p class="stat-desc">Awaiting specialist &amp; hospital review</p>
      </article>

      <article class="stat-card">
        <div class="stat-header">
          <span class="stat-icon completed-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </span>
          <p class="stat-label">Past Completed Visits</p>
        </div>
        <p class="stat-value">{{ completedCount() }}</p>
        <p class="stat-desc">Past consultations and assessments</p>
      </article>

      <article class="stat-card">
        <div class="stat-header">
          <span class="stat-icon total-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </span>
          <p class="stat-label">Total Appointments</p>
        </div>
        <p class="stat-value">{{ facade.stats().total }}</p>
        <p class="stat-desc">Overall bookings and requests</p>
      </article>
    </section>

    <section class="list-section">
      <div class="filter-bar">
        <div class="time-pills" role="group" aria-label="Filter by time">
          @for (option of timeOptions; track option.value) {
            <button
              type="button"
              [class.active]="timeFilter() === option.value"
              (click)="timeFilter.set(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>
        <button
          type="button"
          class="filters-toggle"
          (click)="showStatusFilters.set(!showStatusFilters())"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          {{ showStatusFilters() ? 'Hide filters' : 'Status filters' }}
        </button>
      </div>

      @if (showStatusFilters()) {
        <div class="status-pills" role="group" aria-label="Filter by status">
          @for (option of statusOptions; track option.value) {
            <button
              type="button"
              [class.active]="isStatusVisible(option.value)"
              (click)="toggleStatus(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      }

      @if (facade.loading()) {
        <ac-ui-spinner label="Loading appointments…" />
      } @else if (facade.error()) {
        <ac-ui-message tone="error">{{ facade.error() }}</ac-ui-message>
      } @else if (visibleAppointments().length === 0) {
        <ac-ui-empty-state
          title="No appointments to show"
          [message]="
            adminSearchQuery()
              ? 'No appointments match &quot;' + adminSearchQuery() + '&quot;.'
              : isAdmin()
                ? 'No appointments are currently recorded in the system.'
                : 'Schedule a visit with a specialist to see it listed here.'
          "
        >
          @if (adminSearchQuery()) {
            <button type="button" class="admin-clear-btn" (click)="adminSearchQuery.set('')">
              Clear filter
            </button>
          } @else if (!isAdmin()) {
            <a class="schedule-cta" routerLink="/appointments/new">Schedule appointment</a>
          }
        </ac-ui-empty-state>
      } @else {
        @if (cancelError(); as problem) {
          <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
        }
        <ul class="appointment-list">
          @for (appointment of visibleAppointments(); track appointment.id) {
            <li
              class="appointment-row"
              [id]="'appointment-' + appointment.id"
              [class.highlighted]="targetAppointmentId() === appointment.id"
            >
              <div class="appointment-card-inner">
                <!-- Top Header: Specialist Avatar & Name + Status Badge -->
                <div class="appointment-card-top">
                  <div class="doctor-profile">
                    <span class="doctor-avatar" aria-hidden="true">
                      {{ doctorInitials(appointment.doctorName) }}
                    </span>
                    <div class="doctor-info">
                      <div class="doctor-heading-row">
                        <p class="doctor-name">{{ appointment.doctorName ?? 'Specialist TBD' }}</p>
                        <span class="specialty-badge">{{ doctorSpecialty(appointment) }}</span>
                      </div>
                      <span class="child-tag">
                        <svg
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          aria-hidden="true"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Patient: {{ appointment.childName ?? 'Patient TBD' }}
                      </span>
                    </div>
                  </div>
                  <ac-ui-badge [tone]="statusTone[appointment.status]">
                    {{ presentation(appointment.status).label }}
                  </ac-ui-badge>
                </div>

                <!-- Middle: Hospital Location & Scheduled Date Badges -->
                <div class="appointment-card-meta">
                  <div class="meta-item location-meta">
                    <svg
                      class="meta-icon"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span class="meta-text">{{ appointment.hospitalName }}</span>
                  </div>

                  <div class="meta-item schedule-meta">
                    <span class="appointment-time-chip scheduled-badge">
                      <svg
                        class="meta-icon"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {{ formatDate(appointment.scheduledAt) }}
                    </span>
                  </div>

                  @if (isAdmin() && (appointment.parentName || appointment.parentEmail)) {
                    <div class="meta-item parent-meta">
                      <svg
                        class="meta-icon"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span class="meta-text">
                        <strong class="meta-label">Parent:</strong>
                        {{ appointment.parentName ?? 'Unknown' }}
                        @if (appointment.parentEmail) {
                          ({{ appointment.parentEmail }})
                        }
                      </span>
                    </div>
                  }
                </div>

                <!-- Reason description if present -->
                @if (appointment.reason) {
                  <div class="visit-reason-box">
                    <span class="reason-tag">Visit Reason</span>
                    <span class="reason-content">{{ appointment.reason }}</span>
                  </div>
                }

                <!-- Rejection note if cancelled -->
                @if (appointment.status === 'CANCELLED' && appointment.rejectionReason) {
                  <div class="cancellation-reason-box">
                    <p class="meta reason">
                      <span class="reason-label">Cancellation reason:</span>
                      {{ appointment.rejectionReason }}
                    </p>
                  </div>
                }

                <!-- Bottom Actions -->
                @if (isCancellable(appointment)) {
                  <div class="appointment-card-actions">
                    @if (confirmingId() === appointment.id) {
                      <div class="cancel-confirm" role="group" aria-label="Confirm cancellation">
                        <div class="cancel-confirm-msg">
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <span>Cancel this appointment?</span>
                        </div>
                        <div class="cancel-confirm-buttons">
                          <button
                            type="button"
                            class="cancel-yes"
                            [disabled]="isCancelling(appointment.id)"
                            (click)="confirmCancel(appointment)"
                          >
                            {{ isCancelling(appointment.id) ? 'Cancelling…' : 'Yes, cancel' }}
                          </button>
                          <button type="button" class="cancel-no" (click)="confirmingId.set(null)">
                            Keep it
                          </button>
                        </div>
                      </div>
                    } @else {
                      <div class="row-side">
                        <button
                          type="button"
                          class="reschedule-btn"
                          (click)="facade.openReschedule(appointment)"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                          </svg>
                          Reschedule
                        </button>
                        <button type="button" class="cancel-btn" (click)="askCancel(appointment)">
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                          Cancel Visit
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </li>
          }
        </ul>

        @if (facade.pagination(); as meta) {
          <ac-ui-pagination
            [page]="meta.page"
            [totalPages]="meta.totalPages"
            [total]="meta.total"
            [perPage]="meta.limit"
            itemNoun="appointments"
            label="Appointment pages"
            (pageChange)="facade.goToPage($event)"
          />
        }
      }
    </section>

    @if (facade.reschedule().isOpen) {
      <ac-reschedule-appointment-modal />
    }

    @if (!isAdmin()) {
      <section class="banners">
        <article class="banner">
          <div>
            <h2>Need assistance scheduling?</h2>
            <p>Our care coordinators can help you find the right specialist and time slot.</p>
          </div>
          <a routerLink="/support">Contact support</a>
        </article>
        <article class="banner">
          <div>
            <h2>Insurance &amp; Claims</h2>
            <p>Check coverage details and submit claims for completed appointments.</p>
          </div>
          <a routerLink="/support">Learn more</a>
        </article>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
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
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 28px;
      }

      h1 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
      }

      .page-header p {
        margin: 0;
        max-width: 640px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      .schedule-cta {
        flex: 0 0 auto;
        min-height: 46px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 20px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
        box-shadow: var(--ac-shadow-sm);
        transition:
          background-color 0.2s ease,
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .schedule-cta:hover {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-md);
        transform: translateY(-1px);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .stat-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-5);
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .stat-card:hover {
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-2px);
      }

      .stat-header {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .stat-icon {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-md);
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .upcoming-icon {
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action);
      }

      .pending-icon {
        background: var(--ac-color-amber-tint-100);
        color: var(--ac-color-warning);
      }

      .completed-icon {
        background: var(--ac-color-green-tint-100);
        color: var(--ac-color-success);
      }

      .total-icon {
        background: var(--ac-color-slate-surface-light);
        color: var(--ac-color-text-slate);
      }

      .stat-label {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .stat-value {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 2.25rem;
        font-weight: var(--ac-font-weight-bold);
        line-height: 1.1;
      }

      .stat-desc {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .list-section {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-6);
        margin-bottom: 28px;
      }

      .filter-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }

      .time-pills {
        display: flex;
        gap: 8px;
      }

      .time-pills button,
      .filters-toggle {
        min-height: 38px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        padding: 0 16px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition:
          background-color 0.2s ease,
          border-color 0.2s ease,
          color 0.2s ease;
      }

      .time-pills button:hover,
      .filters-toggle:hover {
        background: var(--ac-color-surface-slate);
      }

      .time-pills button.active {
        background: var(--ac-color-text-dark);
        border-color: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
      }

      .status-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: -6px 0 18px;
        padding-top: 4px;
      }

      .status-pills button {
        min-height: 34px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        padding: 0 14px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .status-pills button:hover {
        background: var(--ac-color-surface-slate);
      }

      .status-pills button.active {
        background: var(--ac-color-sage-light);
        border-color: var(--ac-color-sage);
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
      }

      .appointment-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 16px;
      }

      .appointment-row {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
        padding: 18px 20px;
        transition:
          border-color 0.3s ease,
          box-shadow 0.3s ease,
          background-color 0.3s ease;

        &.highlighted {
          border-color: var(--ac-color-focus);
          box-shadow: 0 0 0 3px var(--ac-color-tint-blue);
          background-color: var(--ac-color-blue-surface-pale);
        }

        &:hover {
          border-color: var(--ac-color-border-info);
          box-shadow: var(--ac-shadow-sm);
        }
      }

      .appointment-card-inner {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .appointment-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .doctor-profile {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .doctor-avatar {
        width: 44px;
        height: 44px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action);
        border: 1.5px solid var(--ac-color-border-info);
        display: grid;
        place-items: center;
        font-weight: var(--ac-font-weight-bold);
        font-size: 15px;
        flex-shrink: 0;
      }

      .doctor-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .doctor-heading-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .specialty-badge {
        display: inline-block;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action-deep);
        padding: 2px 10px;
        font-size: 11px;
        font-weight: var(--ac-font-weight-semibold);
        letter-spacing: 0.02em;
      }

      .appointment-time-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .doctor-name {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 1.05rem;
        font-weight: var(--ac-font-weight-bold);
      }

      .child-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
      }

      .appointment-card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 10px 14px;
        background: var(--ac-color-surface-slate);
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border-slate);
      }

      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
      }

      .meta-icon {
        color: var(--ac-color-text-slate);
        flex-shrink: 0;
      }

      .scheduled-badge {
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .parent-meta {
        color: var(--ac-color-text-dark);
      }

      .meta-label {
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
        margin-right: 4px;
      }

      .visit-reason-box {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-body);
        background: var(--ac-color-tint-blue-pale);
        padding: 8px 12px;
        border-radius: var(--ac-radius-sm);
        border-left: 3px solid var(--ac-color-action);
      }

      .reason-tag {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-action-deep);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .reason-content {
        color: var(--ac-color-text-strong);
      }

      .cancellation-reason-box {
        padding: 8px 12px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-red-tint-100);
        border: 1px solid var(--ac-color-red-border);
      }

      .meta.reason {
        margin: 0;
        color: var(--ac-color-alert-strong);
        font-size: var(--ac-type-meta);
      }

      .reason-label {
        font-weight: var(--ac-font-weight-bold);
      }

      .appointment-card-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding-top: 8px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .row-side {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .reschedule-btn,
      .cancel-btn,
      .cancel-yes,
      .cancel-no {
        min-height: 38px;
        padding: 0 16px;
        border-radius: var(--ac-radius-sm);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }

      .reschedule-btn {
        border: 1.5px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
      }

      .reschedule-btn:hover {
        background: var(--ac-color-tint-blue-soft);
        border-color: var(--ac-color-border-info);
      }

      .cancel-btn {
        border: 1.5px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-red-brick);
      }

      .cancel-btn:hover {
        background: var(--ac-color-red-tint-100);
        border-color: var(--ac-color-red-border);
      }

      .cancel-confirm {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        width: 100%;
        padding: 10px 14px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-red-tint-50);
        border: 1px solid var(--ac-color-red-border);
      }

      .cancel-confirm-msg {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-alert-strong);
      }

      .cancel-confirm-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .cancel-yes {
        border: 0;
        background: var(--ac-color-red-brick);
        color: var(--ac-color-text-on-action);
      }

      .cancel-yes:hover {
        background: var(--ac-color-alert-strong);
      }

      .cancel-yes:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .cancel-no {
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
      }

      .cancel-no:hover {
        background: var(--ac-color-surface-slate);
      }

      .banners {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }

      .banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-sage-light);
        padding: 20px;
        border: 1px solid var(--ac-color-border);
      }

      .banner h2 {
        margin: 0 0 6px;
        font-size: var(--ac-type-label);
        color: var(--ac-color-text-dark);
      }

      .banner p {
        margin: 0;
        color: var(--ac-color-olive);
        font-size: var(--ac-type-meta);
      }

      .banner a {
        flex: 0 0 auto;
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: underline;
      }

      .admin-oversight-banner {
        margin-bottom: 24px;
        padding: 20px;
        background: var(--ac-color-tint-blue-mist);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-lg);
      }

      .admin-pill {
        display: inline-block;
        padding: 3px 10px;
        margin-bottom: 8px;
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-action-deep);
        background: var(--ac-color-tint-blue);
        border-radius: var(--ac-radius-pill);
        letter-spacing: 0.04em;
      }

      .admin-oversight-top h2 {
        margin: 0 0 6px;
        font-size: var(--ac-type-card-title);
        color: var(--ac-color-text-strong);
      }

      .admin-oversight-top p {
        margin: 0 0 16px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .admin-filter-row {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .admin-search-input {
        flex: 1;
        max-width: 480px;
        padding: 10px 16px;
        font-size: var(--ac-type-label);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
        outline: none;
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;

        &:focus {
          border-color: var(--ac-color-action);
          box-shadow: 0 0 0 3px var(--ac-color-tint-blue);
        }
      }

      .admin-clear-btn {
        padding: 9px 16px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-dark);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        cursor: pointer;

        &:hover {
          background: var(--ac-color-surface-slate);
        }
      }

      @media (max-width: 640px) {
        .page-header {
          flex-direction: column;
        }

        .schedule-cta {
          align-self: stretch;
          justify-content: center;
        }

        .filter-bar {
          flex-direction: column;
          align-items: flex-start;
        }

        .appointment-card-top {
          flex-direction: column;
          align-items: flex-start;
        }

        .appointment-card-actions {
          justify-content: stretch;
        }

        .row-side {
          width: 100%;
        }

        .reschedule-btn,
        .cancel-btn {
          flex: 1;
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDashboardPage implements OnInit, OnDestroy {
  protected readonly facade = inject(AppointmentsFacade);
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly isAdmin = computed(() => this.auth.parent()?.role === 'ADMIN');
  protected readonly adminSearchQuery = signal('');
  protected readonly targetAppointmentId = signal<string | null>(null);
  protected readonly timeFilter = signal<TimeFilter>('ALL');
  protected readonly showStatusFilters = signal(false);
  protected readonly visibleStatuses = signal<ReadonlySet<AppointmentStatus>>(
    new Set(statusFilterOptions.map((option) => option.value)),
  );
  protected readonly statusOptions = statusFilterOptions;
  protected readonly statusTone = statusTone;
  protected readonly cancelError = this.facade.cancelError;
  /** Which row is showing its inline confirmation, if any. */
  protected readonly confirmingId = signal<string | null>(null);

  protected readonly completedCount = computed(
    () => this.facade.appointments().filter((a) => a.status === 'COMPLETED').length,
  );

  protected readonly timeOptions: ReadonlyArray<{ value: TimeFilter; label: string }> = [
    { value: 'ALL', label: 'All Time' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'PAST', label: 'Past' },
  ];
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const targetId = this.targetAppointmentId();
      const appointments = this.facade.appointments();
      if (targetId && appointments.some((a) => a.id === targetId)) {
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
          if (typeof document !== 'undefined') {
            const el = document.getElementById(`appointment-${targetId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 150);
      }
    });
  }

  ngOnDestroy() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
  }

  protected readonly visibleAppointments = computed(() => {
    const now = Date.now();
    const visibleStatuses = this.visibleStatuses();
    const query = this.adminSearchQuery().trim().toLowerCase();

    return this.facade
      .appointments()
      .filter((appointment) => visibleStatuses.has(appointment.status))
      .filter((appointment) => {
        if (this.timeFilter() === 'ALL') return true;
        const scheduledTime = new Date(appointment.scheduledAt).getTime();
        return this.timeFilter() === 'UPCOMING' ? scheduledTime >= now : scheduledTime < now;
      })
      .filter((appointment) => {
        if (!query) return true;
        const parentMatch =
          appointment.parentName?.toLowerCase().includes(query) ||
          appointment.parentEmail?.toLowerCase().includes(query);
        const childMatch = appointment.childName?.toLowerCase().includes(query);
        const doctorMatch = appointment.doctorName?.toLowerCase().includes(query);
        const hospitalMatch = appointment.hospitalName?.toLowerCase().includes(query);
        return Boolean(parentMatch || childMatch || doctorMatch || hospitalMatch);
      });
  });

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const id = (params['id'] as string | undefined)?.trim();
      if (id) {
        this.targetAppointmentId.set(id);
      }
    });
    this.facade.loadAppointments();
  }

  protected isStatusVisible(status: AppointmentStatus): boolean {
    return this.visibleStatuses().has(status);
  }

  protected toggleStatus(status: AppointmentStatus) {
    this.visibleStatuses.update((current) => {
      const next = new Set(current);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  protected isCancellable(appointment: AppointmentResponse): boolean {
    if (this.isAdmin()) return false;
    return appointment.status === 'REQUESTED' || appointment.status === 'CONFIRMED';
  }

  protected isCancelling(appointmentId: string): boolean {
    return this.facade.cancelling().includes(appointmentId);
  }

  protected askCancel(appointment: AppointmentResponse): void {
    this.confirmingId.set(appointment.id);
  }

  protected confirmCancel(appointment: AppointmentResponse): void {
    this.facade.cancelAppointment(appointment.id);
    this.confirmingId.set(null);
  }

  protected presentation(status: AppointmentStatus) {
    return statusPresentation[status];
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

  protected doctorInitials(name?: string | null): string {
    if (!name) return 'SP';
    const clean = name.replace(/^Dr\.?\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'SP';
  }

  protected doctorSpecialty(appointment: AppointmentResponse): string {
    const reason = appointment.reason?.toLowerCase() ?? '';
    if (reason.includes('speech') || reason.includes('communication')) {
      return 'Speech & Language';
    }
    if (reason.includes('sensory') || reason.includes('motor')) {
      return 'Occupational Therapy';
    }
    return 'Pediatric Specialist';
  }
}
