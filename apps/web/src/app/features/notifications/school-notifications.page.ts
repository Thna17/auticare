// notifications.page.ts — School notifications with live enrollment-request
// approval flow. Data comes from GET /schools/notifications (enriched with the
// sender name and linked admission request); Approve/Reject/Pending call
// PATCH /schools/notifications/:id/decision, which atomically updates the
// admission request, marks the notification read, upserts the enrollment, and
// notifies the parent.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { SchoolNotificationItem } from '@auticare/contracts';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

type StatusFilter = 'ALL' | 'PENDING' | 'DECIDED' | 'READ';

@Component({
  standalone: true,
  imports: [DatePipe, UiEmptyStateComponent, UiMessageComponent, UiSpinnerComponent],
  selector: 'ac-school-notifications',
  template: `
    <div class="notifications-card">
      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="filter-tabs">
          <button
            class="tab-btn"
            [class.active]="statusFilter() === 'ALL'"
            (click)="statusFilter.set('ALL')"
          >
            All
          </button>
          <button
            class="tab-btn"
            [class.active]="statusFilter() === 'PENDING'"
            (click)="statusFilter.set('PENDING')"
          >
            Pending
          </button>
          <button
            class="tab-btn"
            [class.active]="statusFilter() === 'DECIDED'"
            (click)="statusFilter.set('DECIDED')"
          >
            Decided
          </button>
          <button
            class="tab-btn"
            [class.active]="statusFilter() === 'READ'"
            (click)="statusFilter.set('READ')"
          >
            Read
          </button>
        </div>
        <div class="filter-controls">
          <button class="advanced-filter-btn" (click)="markAllRead()" [disabled]="markingAll()">
            {{ markingAll() ? 'Marking…' : '✓ Mark all read' }}
          </button>
          <button class="icon-btn" aria-label="Refresh" (click)="load()" [disabled]="loading()">
            {{ loading() ? '…' : '↻' }}
          </button>
        </div>
      </div>

      <!-- States -->
      @if (loading()) {
        <ac-ui-spinner label="Loading notifications…" />
      } @else if (error(); as loadError) {
        <ac-ui-message tone="error">
          {{ loadError }}
          <button type="button" class="retry-btn" (click)="load()">Retry</button>
        </ac-ui-message>
      } @else if (filtered().length === 0) {
        <ac-ui-empty-state
          [title]="notifications().length === 0 ? 'You are all caught up' : 'No matches'"
          [message]="
            notifications().length === 0
              ? 'Enrollment requests and other school updates will appear here.'
              : 'No notifications match this filter. Choose another filter to see more.'
          "
        />
      } @else {
        <!-- Table -->
        <table class="notifications-table">
          <thead>
            <tr>
              <th>SENDER & STUDENT</th>
              <th>MESSAGE</th>
              <th>DATE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @for (notification of filtered(); track notification.id) {
              <tr [class.unread-row]="notification.status === 'UNREAD'">
                <td>
                  <div class="sender-cell">
                    <div class="avatar" [class.system]="notification.type !== 'ENROLLMENT_REQUEST'">
                      @if (notification.type !== 'ENROLLMENT_REQUEST') {
                        <span class="system-icon">🔔</span>
                      } @else {
                        {{ initialsOf(notification.senderName) }}
                      }
                    </div>
                    <div class="sender-info">
                      <span class="sender-name">{{ notification.senderName || 'System' }}</span>
                      @if (notification.studentName) {
                        <span class="student-name">Student: {{ notification.studentName }}</span>
                      }
                    </div>
                  </div>
                </td>
                <td class="message-cell">
                  <span class="message-title">{{ notification.title }}</span>
                  <span class="message-body">
                    {{ notification.requestMessage ?? notification.body }}
                  </span>
                </td>
                <td class="date-cell">{{ notification.createdAt | date: 'MMM d, y · HH:mm' }}</td>
                <td class="status-cell">
                  @switch (
                    notification.type === 'ENROLLMENT_REQUEST' ? notification.admissionStatus : null
                  ) {
                    @case ('REQUESTED') {
                      <span class="status-pill status-pill--pending">Pending</span>
                    }
                    @case ('APPROVED') {
                      <span class="status-pill status-pill--approved">Approved</span>
                    }
                    @case ('REJECTED') {
                      <span class="status-pill status-pill--rejected">Rejected</span>
                    }
                    @default {
                      <span class="status-pill status-pill--info">
                        {{ notification.status === 'UNREAD' ? 'Unread' : 'Read' }}
                      </span>
                    }
                  }
                </td>
                <td class="actions-cell">
                  @if (
                    notification.type === 'ENROLLMENT_REQUEST' &&
                    notification.admissionStatus === 'REQUESTED'
                  ) {
                    @if (actingId() === notification.id) {
                      <span class="acting-label">Saving…</span>
                    } @else {
                      <button
                        type="button"
                        class="status-link approve"
                        (click)="decide(notification, 'APPROVED')"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        class="status-link reject"
                        (click)="decide(notification, 'REJECTED')"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        class="status-link details"
                        (click)="decide(notification, 'PENDING')"
                      >
                        Keep Pending
                      </button>
                    }
                  } @else if (notification.status === 'UNREAD') {
                    <button
                      type="button"
                      class="status-link details"
                      (click)="markRead(notification)"
                    >
                      Mark read
                    </button>
                  } @else {
                    <span class="no-actions">—</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Feedback -->
        @if (feedback(); as note) {
          <div class="feedback-bar" [class.feedback-bar--error]="feedbackIsError()">
            {{ note }}
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .notifications-card {
        background: var(--ac-color-surface);
        border: 1px solid #e3edf2;
        border-radius: 14px;
        padding: 20px;
        margin: 20px;
      }
      .filters-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .filter-tabs {
        display: flex;
        gap: 8px;
      }
      .tab-btn {
        padding: 7px 16px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: var(--ac-color-grey-a);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .tab-btn.active {
        background: var(--ac-color-action-alt);
        border-color: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
      }
      .filter-controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .advanced-filter-btn {
        padding: 7px 14px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .advanced-filter-btn:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .icon-btn {
        width: 34px;
        height: 34px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-grey-a);
        cursor: pointer;
        font-size: 15px;
      }

      .state-card {
        padding: 36px;
        border: 1px dashed var(--ac-color-slate-300);
        border-radius: 12px;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-slate-600);
        text-align: center;
        font-size: 14px;
      }
      .state-card--error {
        border-color: #fecaca;
        background: var(--ac-color-red-50);
        color: var(--ac-color-alert-slate);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
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

      .notifications-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13.5px;
      }
      .notifications-table th {
        text-align: left;
        font-size: 11px;
        letter-spacing: 0.06em;
        color: #7b8fa0;
        padding: 10px 12px;
        border-bottom: 1px solid #e8eff4;
      }
      .notifications-table td {
        padding: 14px 12px;
        border-bottom: 1px solid #eef3f7;
        vertical-align: top;
        color: #24404e;
      }
      .unread-row {
        background: #f4fbfd;
      }
      .sender-cell {
        display: flex;
        gap: 10px;
        align-items: center;
        min-width: 190px;
      }
      .avatar {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #e7f3f7;
        color: var(--ac-color-action-alt);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 14px;
        flex-shrink: 0;
      }
      .avatar.system {
        background: #eef2f6;
      }
      .system-icon {
        font-size: 16px;
      }
      .sender-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .sender-name {
        font-weight: 700;
        color: var(--ac-color-action-darkest);
      }
      .student-name {
        font-size: 12px;
        color: #6b8494;
      }
      .message-cell {
        display: flex;
        flex-direction: column;
        gap: 3px;
        max-width: 380px;
      }
      .message-title {
        font-weight: 600;
        color: var(--ac-color-action-darkest);
      }
      .message-body {
        color: var(--ac-color-grey-a);
        font-size: 12.5px;
        line-height: 1.45;
      }
      .date-cell {
        white-space: nowrap;
        color: var(--ac-color-grey-a);
        font-size: 12.5px;
      }
      .status-pill {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 700;
      }
      .status-pill--pending {
        background: #fdf3e2;
        color: #a4691a;
      }
      .status-pill--approved {
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
      }
      .status-pill--rejected {
        background: var(--ac-color-red-100);
        color: #b04343;
      }
      .status-pill--info {
        background: #eef2f6;
        color: var(--ac-color-grey-a);
      }
      .actions-cell {
        white-space: nowrap;
      }
      .status-link {
        background: none;
        border: none;
        padding: 0 8px 0 0;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .status-link.approve {
        color: var(--ac-color-green-600);
      }
      .status-link.reject {
        color: #b04343;
      }
      .status-link.details {
        color: var(--ac-color-action-alt);
      }
      .acting-label {
        color: #6b8494;
        font-size: 12.5px;
      }
      .no-actions {
        color: #a8bcc7;
      }

      .feedback-bar {
        margin-top: 14px;
        padding: 10px 14px;
        border-radius: 8px;
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
        font-size: 13px;
        font-weight: 600;
      }
      .feedback-bar--error {
        background: var(--ac-color-red-100);
        color: #b04343;
      }

      @media (max-width: 860px) {
        .notifications-table thead {
          display: none;
        }
        .notifications-table tr {
          display: block;
          padding: 12px 0;
          border-bottom: 1px solid #eef3f7;
        }
        .notifications-table td {
          display: block;
          border: 0;
          padding: 4px 8px;
        }
        .message-cell {
          max-width: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolNotificationsPage implements OnInit {
  private readonly api = inject(SchoolsApi);

  readonly notifications = signal<SchoolNotificationItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly actingId = signal<string | null>(null);
  readonly markingAll = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly feedbackIsError = signal(false);

  readonly filtered = computed(() => {
    const filter = this.statusFilter();
    const items = this.notifications();
    switch (filter) {
      case 'PENDING':
        return items.filter(
          (n) => n.type === 'ENROLLMENT_REQUEST' && n.admissionStatus === 'REQUESTED',
        );
      case 'DECIDED':
        return items.filter(
          (n) =>
            n.type === 'ENROLLMENT_REQUEST' &&
            (n.admissionStatus === 'APPROVED' || n.admissionStatus === 'REJECTED'),
        );
      case 'READ':
        return items.filter((n) => n.status === 'READ');
      default:
        return items;
    }
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.listNotifications().subscribe({
      next: (items) => {
        this.notifications.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load notifications. Check your connection and try again.');
      },
    });
  }

  decide(notification: SchoolNotificationItem, decision: 'APPROVED' | 'REJECTED' | 'PENDING') {
    this.actingId.set(notification.id);
    this.feedback.set(null);

    this.api.decideEnrollmentRequest(notification.id, decision).subscribe({
      next: () => {
        this.actingId.set(null);
        this.notifications.update((items) =>
          items.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  status: 'READ' as const,
                  admissionStatus:
                    decision === 'PENDING'
                      ? 'REQUESTED'
                      : decision === 'APPROVED'
                        ? 'APPROVED'
                        : 'REJECTED',
                }
              : item,
          ),
        );
        this.feedback.set(
          decision === 'APPROVED'
            ? `Approved — ${notification.studentName ?? 'the student'} is now enrolled and appears on the Students page.`
            : decision === 'REJECTED'
              ? `Request rejected — the enrollment was recorded as declined.`
              : `Request kept pending — the parent's request stays open for review.`,
        );
        this.feedbackIsError.set(false);
      },
      error: () => {
        this.actingId.set(null);
        this.feedback.set('Could not save the decision. Please try again.');
        this.feedbackIsError.set(true);
      },
    });
  }

  markRead(notification: SchoolNotificationItem) {
    this.api.markNotificationRead(notification.id).subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.map((item) =>
            item.id === notification.id ? { ...item, status: 'READ' as const } : item,
          ),
        );
      },
      error: () => {
        this.feedback.set('Could not mark the notification as read.');
        this.feedbackIsError.set(true);
      },
    });
  }

  markAllRead() {
    this.markingAll.set(true);
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.markingAll.set(false);
        this.notifications.update((items) =>
          items.map((item) => ({ ...item, status: 'READ' as const })),
        );
      },
      error: () => {
        this.markingAll.set(false);
        this.feedback.set('Could not mark all notifications as read.');
        this.feedbackIsError.set(true);
      },
    });
  }

  initialsOf(name: string): string {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || '?'
    );
  }
}
