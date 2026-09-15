import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { AppointmentResponse, AppointmentStatus } from '@auticare/contracts';
import { HospitalManagementApi } from './hospital-management.api';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { UiButtonComponent } from '../../design-system/components/ui-button.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { RejectReasonModalComponent } from './reject-reason-modal.component';
import { AppointmentDetailDrawerComponent } from './appointment-detail-drawer.component';
import { statusPresentation, statusTone } from '../appointments/appointments.types';

type StatusFilter = 'ALL' | AppointmentStatus;

const statusFilters: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'REQUESTED', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Approved' },
  { value: 'CANCELLED', label: 'Rejected' },
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
  ],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <span>Dashboard</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Appointment requests</span>
    </nav>

    <section class="page-header">
      <div>
        <h1>Appointment requests</h1>
        <p>Review incoming requests and keep patients updated on their status.</p>
      </div>
    </section>

    <section class="stats" aria-label="Request summary">
      <button type="button" class="stat-card" (click)="statusFilter.set('REQUESTED')">
        <p class="stat-label">Pending</p>
        <p class="stat-value">{{ counts().pending }}</p>
      </button>
      <button type="button" class="stat-card" (click)="statusFilter.set('CONFIRMED')">
        <p class="stat-label">Approved</p>
        <p class="stat-value">{{ counts().approved }}</p>
      </button>
      <button type="button" class="stat-card" (click)="statusFilter.set('CANCELLED')">
        <p class="stat-label">Rejected</p>
        <p class="stat-value">{{ counts().rejected }}</p>
      </button>
    </section>

    <section class="list-section">
      <div class="filter-bar">
        <div class="status-pills" role="group" aria-label="Filter by status">
          @for (option of statusFilters; track option.value) {
            <button
              type="button"
              [class.active]="statusFilter() === option.value"
              (click)="statusFilter.set(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>
        <select
          class="doctor-select"
          [value]="doctorFilter()"
          (change)="doctorFilter.set($any($event.target).value)"
        >
          <option value="ALL">All doctors</option>
          @for (doctor of doctorNames(); track doctor) {
            <option [value]="doctor">{{ doctor }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <p class="status" aria-live="polite">Loading requests...</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (visibleAppointments().length === 0) {
        <ac-ui-empty-state
          title="No requests to show"
          message="Nothing matches these filters right now."
        />
      } @else {
        <div class="table-wrap">
          <table>
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
                <tr (click)="openDetail(item)">
                  <td>{{ item.childName ?? 'Patient TBD' }}</td>
                  <td>{{ item.doctorName ?? 'Unassigned' }}</td>
                  <td>{{ formatDate(item.scheduledAt) }}</td>
                  <td class="reason-cell">{{ item.reason ?? '—' }}</td>
                  <td>
                    <ac-ui-badge [tone]="statusTone[item.status]">
                      {{ statusPresentation[item.status].label }}
                    </ac-ui-badge>
                  </td>
                  <td class="actions-cell" (click)="$event.stopPropagation()">
                    @if (item.status === 'REQUESTED') {
                      <ac-ui-button variant="primary" (click)="approve(item)">Approve</ac-ui-button>
                      <ac-ui-button variant="destructive" (click)="openReject(item)">
                        Reject
                      </ac-ui-button>
                    } @else {
                      <ac-ui-button variant="secondary" (click)="openDetail(item)"
                        >View</ac-ui-button
                      >
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    @if (rejectingAppointment(); as target) {
      <ac-reject-reason-modal
        [appointment]="target"
        (cancel)="rejectingAppointment.set(null)"
        (confirm)="confirmReject(target, $event)"
      />
    }

    @if (detailAppointment(); as target) {
      <ac-appointment-detail-drawer
        [appointment]="target"
        [allAppointments]="appointments()"
        (close)="detailAppointment.set(null)"
        (approve)="approve(target)"
        (reject)="openReject(target)"
      />
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
        color: #294a5a;
        font-weight: var(--ac-font-weight-semibold);
      }

      .page-header {
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
        text-align: left;
        cursor: pointer;
        font-family: inherit;
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
        color: #001e2b;
        font-size: 2rem;
        font-weight: var(--ac-font-weight-bold);
      }

      .list-section {
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
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
        gap: 8px;
        flex-wrap: wrap;
      }

      .status-pills button {
        min-height: 38px;
        border: 1px solid var(--ac-color-border);
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: #41484b;
        padding: 0 14px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .status-pills button.active {
        background: #294a5a;
        border-color: #294a5a;
        color: #ffffff;
      }

      .doctor-select {
        min-height: 38px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: 0 10px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text);
        background: var(--ac-color-surface);
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

      .table-wrap {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--ac-type-meta);
      }

      thead th {
        text-align: left;
        padding: 10px 8px;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
        font-size: 0.75rem;
        border-bottom: var(--ac-border-subtle);
      }

      tbody tr {
        cursor: pointer;
        border-bottom: var(--ac-border-subtle);
      }

      tbody tr:hover {
        background: var(--ac-color-background);
      }

      tbody td {
        padding: 12px 8px;
        min-height: 44px;
        color: var(--ac-color-text);
        vertical-align: middle;
      }

      .reason-cell {
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--ac-color-text-muted);
      }

      .actions-cell {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      @media (max-width: 640px) {
        .filter-bar {
          flex-direction: column;
          align-items: flex-start;
        }

        table,
        thead,
        tbody,
        tr,
        td {
          display: block;
          width: 100%;
        }

        thead {
          display: none;
        }

        tbody tr {
          border: 1px solid var(--ac-color-border);
          border-radius: 8px;
          margin-bottom: 12px;
          padding: 12px;
        }

        tbody td {
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

  protected readonly counts = computed(() => {
    const items = this.appointments();
    return {
      pending: items.filter((a) => a.status === 'REQUESTED').length,
      approved: items.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length,
      rejected: items.filter((a) => a.status === 'CANCELLED').length,
    };
  });

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
    return this.appointments().filter((item) => {
      if (status !== 'ALL' && item.status !== status) return false;
      if (doctor !== 'ALL' && item.doctorName !== doctor) return false;
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

  protected approve(item: AppointmentResponse) {
    this.setStatus(item, 'CONFIRMED');
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

  protected formatDate(scheduledAt: string): string {
    return new Date(scheduledAt).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private setStatus(item: AppointmentResponse, status: AppointmentStatus, reason?: string) {
    this.api.changeStatus(item.id, status, reason).subscribe({
      next: () => {
        this.detailAppointment.set(null);
        this.load();
      },
      error: () => this.error.set('This status change is not allowed.'),
    });
  }
}
