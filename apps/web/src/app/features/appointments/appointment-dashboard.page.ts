import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { AppointmentsFacade } from './state/appointments.facade';
import type { AppointmentResponse } from '@auticare/contracts';
import type { AppointmentStatus } from './appointments.types';
import { statusPresentation, statusTone } from './appointments.types';

type TimeFilter = 'ALL' | 'UPCOMING' | 'PAST';

const statusFilterOptions: ReadonlyArray<{ value: AppointmentStatus; label: string }> = [
  { value: 'REQUESTED', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

@Component({
  standalone: true,
  imports: [RouterLink, UiEmptyStateComponent, UiBadgeComponent],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <span>Dashboard</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Appointments</span>
    </nav>

    <section class="page-header">
      <div>
        <h1>Appointment Dashboard</h1>
        <p>Track upcoming visits and follow up on anything that still needs review.</p>
      </div>
      <a class="schedule-cta" routerLink="/appointments/new">+ Schedule New</a>
    </section>

    <section class="stats" aria-label="Appointment summary">
      <article class="stat-card">
        <p class="stat-label">Total Appointments</p>
        <p class="stat-value">{{ facade.stats().total }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">Pending Review</p>
        <p class="stat-value">{{ facade.stats().pendingReview }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">Upcoming Sessions</p>
        <p class="stat-value">{{ facade.stats().upcoming }}</p>
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
          {{ showStatusFilters() ? 'Hide filters' : 'Filters' }}
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
        <p class="status" aria-live="polite">Loading appointments...</p>
      } @else if (facade.error()) {
        <p class="error" role="alert">{{ facade.error() }}</p>
      } @else if (visibleAppointments().length === 0) {
        <ac-ui-empty-state
          title="No appointments to show"
          message="Schedule a visit with a specialist to see it listed here."
        />
      } @else {
        @if (cancelError(); as problem) {
          <p class="cancel-error" role="alert">{{ problem }}</p>
        }
        <ul class="appointment-list">
          @for (appointment of visibleAppointments(); track appointment.id) {
            <li class="appointment-row">
              <div class="appointment-main">
                <p class="doctor-name">{{ appointment.doctorName ?? 'Specialist TBD' }}</p>
                <p class="meta">
                  {{ appointment.hospitalName }} · {{ appointment.childName ?? 'Patient TBD' }}
                </p>
                <p class="meta">{{ formatDate(appointment.scheduledAt) }}</p>
                @if (appointment.status === 'CANCELLED' && appointment.rejectionReason) {
                  <p class="meta reason">
                    <span class="reason-label">Reason given:</span>
                    {{ appointment.rejectionReason }}
                  </p>
                }
              </div>
              <div class="row-side">
                <ac-ui-badge [tone]="statusTone[appointment.status]">
                  {{ presentation(appointment.status).label }}
                </ac-ui-badge>

                @if (isCancellable(appointment)) {
                  @if (confirmingId() === appointment.id) {
                    <div class="cancel-confirm" role="group" aria-label="Confirm cancellation">
                      <span>Cancel this appointment?</span>
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
                  } @else {
                    <button type="button" class="cancel-btn" (click)="askCancel(appointment)">
                      Cancel
                    </button>
                  }
                }
              </div>
            </li>
          }
        </ul>
      }
    </section>

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
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        padding: 0 20px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
      }

      .schedule-cta:hover {
        background: var(--ac-color-ink-j);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .stat-card {
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-6);
      }

      .stat-label {
        margin: 0 0 8px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
      }

      .stat-value {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 2rem;
        font-weight: var(--ac-font-weight-bold);
      }

      .list-section {
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
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
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        padding: 0 14px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
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
      }

      .status-pills button {
        min-height: 34px;
        border: 1px solid var(--ac-color-border);
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        padding: 0 12px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .status-pills button.active {
        background: var(--ac-color-sage-light);
        border-color: var(--ac-color-sage);
        color: var(--ac-color-text-dark);
      }

      .status,
      .error {
        border-radius: 12px;
        padding: 16px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-ink-c);
      }

      .error {
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
      }

      .appointment-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .appointment-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        border: 1px solid #eef1f0;
        border-radius: 10px;
        padding: 14px 16px;
      }

      .doctor-name {
        margin: 0 0 4px;
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-semibold);
      }

      .meta {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .row-side {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .cancel-btn,
      .cancel-yes,
      .cancel-no {
        min-height: 36px;
        padding: 0 12px;
        border-radius: 8px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }

      .cancel-btn {
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: #8b3d3d;
      }

      .cancel-confirm {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-size: var(--ac-type-meta);
      }

      .cancel-yes {
        border: 0;
        background: #8b3d3d;
        color: var(--ac-color-text-on-action);
      }

      .cancel-no {
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
      }

      .cancel-yes:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .cancel-error {
        margin: 0 0 12px;
        padding: 10px 14px;
        border-radius: 10px;
        color: var(--ac-color-red-700);
        background: var(--ac-color-red-100);
        border: 1px solid var(--ac-color-red-border);
      }

      .reason-label {
        font-weight: var(--ac-font-weight-bold);
      }
      .meta.reason {
        margin-top: 4px;
        font-style: italic;
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
        border-radius: 12px;
        background: var(--ac-color-sage-light);
        padding: 20px;
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
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDashboardPage implements OnInit {
  protected readonly facade = inject(AppointmentsFacade);
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
  protected readonly timeOptions: ReadonlyArray<{ value: TimeFilter; label: string }> = [
    { value: 'ALL', label: 'All Time' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'PAST', label: 'Past' },
  ];

  protected readonly visibleAppointments = computed(() => {
    const now = Date.now();
    const visibleStatuses = this.visibleStatuses();
    return this.facade
      .appointments()
      .filter((appointment) => visibleStatuses.has(appointment.status))
      .filter((appointment) => {
        if (this.timeFilter() === 'ALL') return true;
        const scheduledTime = new Date(appointment.scheduledAt).getTime();
        return this.timeFilter() === 'UPCOMING' ? scheduledTime >= now : scheduledTime < now;
      });
  });

  ngOnInit() {
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

  /**
   * The API allows cancellation only while an appointment is REQUESTED or
   * CONFIRMED, so the button is hidden otherwise rather than offered and refused.
   */
  protected isCancellable(appointment: AppointmentResponse): boolean {
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
}
