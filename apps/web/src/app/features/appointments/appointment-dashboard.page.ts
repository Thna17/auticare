import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { AppointmentsFacade } from './state/appointments.facade';
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
        <ul class="appointment-list">
          @for (appointment of visibleAppointments(); track appointment.id) {
            <li class="appointment-row">
              <div class="appointment-main">
                <p class="doctor-name">{{ appointment.doctorName ?? 'Specialist TBD' }}</p>
                <p class="meta">
                  {{ appointment.hospitalName }} · {{ appointment.childName ?? 'Patient TBD' }}
                </p>
                <p class="meta">{{ formatDate(appointment.scheduledAt) }}</p>
                @if (appointment.status === 'CANCELLED' && appointment.reason) {
                  <p class="meta reason">{{ appointment.reason }}</p>
                }
              </div>
              <ac-ui-badge [tone]="statusTone[appointment.status]">
                {{ presentation(appointment.status).label }}
              </ac-ui-badge>
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
        color: #66747a;
        font-size: var(--ac-type-meta);
      }

      .breadcrumbs span[aria-current] {
        color: #294a5a;
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
        color: #001e2b;
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
      }

      .page-header p {
        margin: 0;
        max-width: 640px;
        color: #41484b;
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      .schedule-cta {
        flex: 0 0 auto;
        min-height: 46px;
        border-radius: 12px;
        background: #3d6375;
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        padding: 0 20px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
      }

      .schedule-cta:hover {
        background: #244b5d;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .stat-card {
        border: 1px solid #dde5e4;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-6);
      }

      .stat-label {
        margin: 0 0 8px;
        color: #66747a;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
      }

      .stat-value {
        margin: 0;
        color: #001e2b;
        font-size: 2rem;
        font-weight: var(--ac-font-weight-bold);
      }

      .list-section {
        border: 1px solid #dde5e4;
        border-radius: 8px;
        background: #ffffff;
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
        border: 1px solid #dde5e4;
        border-radius: 999px;
        background: #ffffff;
        color: #41484b;
        padding: 0 14px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .time-pills button.active {
        background: #294a5a;
        border-color: #294a5a;
        color: #ffffff;
      }

      .status-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: -6px 0 18px;
      }

      .status-pills button {
        min-height: 34px;
        border: 1px solid #dde5e4;
        border-radius: 999px;
        background: #ffffff;
        color: #41484b;
        padding: 0 12px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .status-pills button.active {
        background: var(--ac-color-sage-light);
        border-color: var(--ac-color-sage);
        color: #294a5a;
      }

      .status,
      .error {
        border-radius: 12px;
        padding: 16px;
        background: #e8f6ff;
        color: #163f52;
      }

      .error {
        background: #ffdad6;
        color: #93000a;
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
        color: #001e2b;
        font-weight: var(--ac-font-weight-semibold);
      }

      .meta {
        margin: 0;
        color: #66747a;
        font-size: var(--ac-type-meta);
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
        color: #294a5a;
      }

      .banner p {
        margin: 0;
        color: #546343;
        font-size: var(--ac-type-meta);
      }

      .banner a {
        flex: 0 0 auto;
        color: #294a5a;
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
