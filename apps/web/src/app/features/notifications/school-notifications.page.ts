// notifications.page.ts — School notifications with live enrollment-request
// approval flow. Data comes from GET /schools/notifications (enriched with the
// sender name and linked admission request); Approve/Reject/Pending call
// PATCH /schools/notifications/:id/decision, which atomically updates the
// admission request, marks the notification read, upserts the enrollment, and
// notifies the parent.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type {
  PaginationMeta,
  SchoolNotificationItem,
  SchoolNotificationView,
} from '@auticare/contracts';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { NotificationsStateService } from '../../core/notifications/notifications-state.service';
import { I18nService } from '../../core/i18n/i18n.service';

type StatusFilter = 'ALL' | 'PENDING' | 'DECIDED' | 'READ';

@Component({
  standalone: true,
  imports: [UiEmptyStateComponent, UiMessageComponent, UiPaginationComponent, UiSpinnerComponent],
  selector: 'ac-school-notifications',
  template: `
    <div class="notifications-card">
      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="filter-tabs">
          <button
            class="tab-btn"
            [class.active]="statusFilter() === 'ALL'"
            (click)="setFilter('ALL')"
          >
            {{ currentLang() === 'km' ? 'ទាំងអស់' : 'All' }}
          </button>
          <button
            class="tab-btn"
            [class.active]="statusFilter() === 'PENDING'"
            (click)="setFilter('PENDING')"
          >
            {{ currentLang() === 'km' ? 'រង់ចាំ' : 'Pending' }}
          </button>
          <button
            class="tab-btn"
            [class.active]="statusFilter() === 'DECIDED'"
            (click)="setFilter('DECIDED')"
          >
            {{ currentLang() === 'km' ? 'បានសម្រេច' : 'Decided' }}
          </button>
          <button
            class="tab-btn"
            [class.active]="statusFilter() === 'READ'"
            (click)="setFilter('READ')"
          >
            {{ currentLang() === 'km' ? 'បានអាន' : 'Read' }}
          </button>
        </div>
        <div class="filter-controls">
          <button class="advanced-filter-btn" (click)="markAllRead()" [disabled]="markingAll()">
            {{
              markingAll()
                ? currentLang() === 'km'
                  ? 'កំពុងសម្គាល់…'
                  : 'Marking…'
                : currentLang() === 'km'
                  ? '✓ សម្គាល់ថាបានអានទាំងអស់'
                  : '✓ Mark all read'
            }}
          </button>
          <button class="icon-btn" aria-label="Refresh" (click)="load()" [disabled]="loading()">
            {{ loading() ? '…' : '↻' }}
          </button>
        </div>
      </div>

      <!-- States -->
      @if (loading()) {
        <ac-ui-spinner
          [label]="currentLang() === 'km' ? 'កំពុងផ្ទុកការជូនដំណឹង…' : 'Loading notifications…'"
        />
      } @else if (error(); as loadError) {
        <ac-ui-message tone="error">
          {{ loadError }}
          <button type="button" class="retry-btn" (click)="load()">
            {{ currentLang() === 'km' ? 'ព្យាយាមម្តងទៀត' : 'Retry' }}
          </button>
        </ac-ui-message>
      } @else if (notifications().length === 0) {
        <ac-ui-empty-state
          [title]="
            statusFilter() === 'ALL'
              ? currentLang() === 'km'
                ? 'អ្នកបានអានទាំងអស់រួចរាល់ហើយ'
                : 'You are all caught up'
              : currentLang() === 'km'
                ? 'គ្មានលទ្ធផលត្រូវគ្នាទេ'
                : 'No matches'
          "
          [message]="
            statusFilter() === 'ALL'
              ? currentLang() === 'km'
                ? 'សំណើចុះឈ្មោះ និងបច្ចុប្បន្នភាពសាលានឹងបង្ហាញនៅទីនេះ។'
                : 'Enrollment requests and other school updates will appear here.'
              : currentLang() === 'km'
                ? 'គ្មានការជូនដំណឹងដែលត្រូវនឹងតម្រងនេះទេ។ សូមជ្រើសរើសតម្រងផ្សេង។'
                : 'No notifications match this filter. Choose another filter to see more.'
          "
        />
      } @else {
        <!-- Table -->
        <table class="notifications-table">
          <thead>
            <tr>
              <th>{{ currentLang() === 'km' ? 'អ្នកផ្ញើ និងសិស្ស' : 'SENDER & STUDENT' }}</th>
              <th>{{ currentLang() === 'km' ? 'សារ' : 'MESSAGE' }}</th>
              <th>{{ currentLang() === 'km' ? 'កាលបរិច្ឆេទ' : 'DATE' }}</th>
              <th>{{ currentLang() === 'km' ? 'ស្ថានភាព' : 'STATUS' }}</th>
              <th>{{ currentLang() === 'km' ? 'សកម្មភាព' : 'ACTIONS' }}</th>
            </tr>
          </thead>
          <tbody>
            @for (notification of notifications(); track notification.id) {
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
                      <span class="sender-name">{{
                        notification.senderName || (currentLang() === 'km' ? 'ប្រព័ន្ធ' : 'System')
                      }}</span>
                      @if (notification.studentName) {
                        <span class="student-name"
                          >{{ currentLang() === 'km' ? 'សិស្ស៖ ' : 'Student: '
                          }}{{ notification.studentName }}</span
                        >
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
                <td class="date-cell">{{ formatTimeAgo(notification.createdAt) }}</td>
                <td class="status-cell">
                  @switch (
                    notification.type === 'ENROLLMENT_REQUEST' ? notification.admissionStatus : null
                  ) {
                    @case ('REQUESTED') {
                      <span class="status-pill status-pill--pending">{{
                        currentLang() === 'km' ? 'រង់ចាំ' : 'Pending'
                      }}</span>
                    }
                    @case ('APPROVED') {
                      <span class="status-pill status-pill--approved">{{
                        currentLang() === 'km' ? 'បានអនុម័ត' : 'Approved'
                      }}</span>
                    }
                    @case ('REJECTED') {
                      <span class="status-pill status-pill--rejected">{{
                        currentLang() === 'km' ? 'បានបដិសេធ' : 'Rejected'
                      }}</span>
                    }
                    @default {
                      <span class="status-pill status-pill--info">
                        {{
                          notification.status === 'UNREAD'
                            ? currentLang() === 'km'
                              ? 'មិនទាន់អាន'
                              : 'Unread'
                            : currentLang() === 'km'
                              ? 'បានអាន'
                              : 'Read'
                        }}
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
                      <span class="acting-label">{{
                        currentLang() === 'km' ? 'កំពុងរក្សាទុក…' : 'Saving…'
                      }}</span>
                    } @else {
                      <button
                        type="button"
                        class="status-link approve"
                        (click)="decide(notification, 'APPROVED')"
                      >
                        {{ currentLang() === 'km' ? 'អនុម័ត' : 'Approve' }}
                      </button>
                      <button
                        type="button"
                        class="status-link reject"
                        (click)="decide(notification, 'REJECTED')"
                      >
                        {{ currentLang() === 'km' ? 'បដិសេធ' : 'Reject' }}
                      </button>
                      <button
                        type="button"
                        class="status-link details"
                        (click)="decide(notification, 'PENDING')"
                      >
                        {{ currentLang() === 'km' ? 'រក្សាទុកសិន' : 'Keep Pending' }}
                      </button>
                    }
                  } @else if (notification.status === 'UNREAD') {
                    <button
                      type="button"
                      class="status-link details"
                      (click)="markRead(notification)"
                    >
                      {{ currentLang() === 'km' ? 'សម្គាល់ថាបានអាន' : 'Mark read' }}
                    </button>
                  } @else {
                    <span class="no-actions">—</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (pagination(); as meta) {
          <ac-ui-pagination
            [page]="meta.page"
            [totalPages]="meta.totalPages"
            [total]="meta.total"
            [perPage]="meta.limit"
            itemNoun="notifications"
            label="Notification pages"
            (pageChange)="goToPage($event)"
          />
        }

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
        border: 1px solid var(--ac-color-slate-line-light);
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
        padding: 8px 16px;
        min-height: 44px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
      }
      .advanced-filter-btn:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .icon-btn {
        width: 44px;
        height: 44px;
        min-width: 44px;
        min-height: 44px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-grey-a);
        cursor: pointer;
        font-size: 15px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
        border-color: var(--ac-color-red-tint-200);
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
        color: var(--ac-color-slate-muted-alt);
        padding: 10px 12px;
        border-bottom: 1px solid var(--ac-color-slate-surface-light);
      }
      .notifications-table td {
        padding: 14px 12px;
        border-bottom: 1px solid var(--ac-color-slate-border-clean);
        vertical-align: top;
        color: var(--ac-color-ink-deep-slate);
      }
      .unread-row {
        background: var(--ac-color-blue-tint-polar);
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
        background: var(--ac-color-blue-surface-soft);
        color: var(--ac-color-action-alt);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 14px;
        flex-shrink: 0;
      }
      .avatar.system {
        background: var(--ac-color-slate-border-mist);
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
        color: var(--ac-color-slate-text-dim);
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
        background: var(--ac-color-amber-tint-warm);
        color: var(--ac-color-amber-700);
      }
      .status-pill--approved {
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
      }
      .status-pill--rejected {
        background: var(--ac-color-red-100);
        color: var(--ac-color-red-rose);
      }
      .status-pill--info {
        background: var(--ac-color-slate-border-mist);
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
        color: var(--ac-color-red-rose);
      }
      .status-link.details {
        color: var(--ac-color-action-alt);
      }
      .acting-label {
        color: var(--ac-color-slate-text-dim);
        font-size: 12.5px;
      }
      .no-actions {
        color: var(--ac-color-slate-border-dim-alt);
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
        color: var(--ac-color-red-rose);
      }

      @media (max-width: 860px) {
        .notifications-table thead {
          display: none;
        }
        .notifications-table tr {
          display: block;
          padding: 12px 0;
          border-bottom: 1px solid var(--ac-color-slate-border-clean);
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
  private readonly notificationsState = inject(NotificationsStateService);
  private readonly i18n = inject(I18nService, { optional: true });

  readonly currentLang = computed(() => this.i18n?.currentLang?.() ?? 'en');

  readonly notifications = signal<SchoolNotificationItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly actingId = signal<string | null>(null);
  readonly markingAll = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly feedbackIsError = signal(false);

  readonly pagination = signal<PaginationMeta | null>(null);
  readonly page = signal(1);

  /**
   * Every tab is a server-side filter now. They used to narrow the fetched array,
   * which stops being correct once the list is a page: "No matches" would show
   * whenever the newest 20 rows happened to contain none of the wanted kind, even
   * with hundreds of matches further back.
   */
  private queryFor(filter: StatusFilter): { isRead?: boolean; view?: SchoolNotificationView } {
    switch (filter) {
      case 'PENDING':
        return { view: 'PENDING' };
      case 'DECIDED':
        return { view: 'DECIDED' };
      case 'READ':
        return { isRead: true };
      default:
        return {};
    }
  }

  setFilter(filter: StatusFilter) {
    if (this.statusFilter() === filter) return;
    this.statusFilter.set(filter);
    this.page.set(1);
    this.load();
  }

  goToPage(page: number) {
    this.page.set(page);
    this.load();
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listNotifications({ ...this.queryFor(this.statusFilter()), page: this.page() })
      .subscribe({
        next: ({ notifications, pagination }) => {
          this.notifications.set(notifications);
          this.pagination.set(pagination);
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
        if (notification.status === 'UNREAD') {
          this.notificationsState.decrementUnread(1);
        }
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
        this.notificationsState.decrementUnread(1);
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
        this.notificationsState.clearUnread();
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

  formatTimeAgo(dateInput: string | Date | number): string {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const isKm = this.currentLang() === 'km';

    if (diffMin < 1) {
      return isKm ? 'ទើបតែឥឡូវនេះ' : 'Just now';
    }
    if (diffHours < 1) {
      if (isKm) {
        return `${diffMin} នាទីមុន`;
      }
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    }
    if (diffDays < 1) {
      if (isKm) {
        return `${diffHours} ម៉ោងមុន`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    if (diffDays < 30) {
      if (isKm) {
        return `${diffDays} ថ្ងៃមុន`;
      }
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
    if (diffMonths < 12) {
      if (isKm) {
        return `${diffMonths} ខែមុន`;
      }
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    }
    if (isKm) {
      return `${diffYears} ឆ្នាំមុន`;
    }
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }
}
