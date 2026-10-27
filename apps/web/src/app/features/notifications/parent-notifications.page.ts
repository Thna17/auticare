import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NotificationResponse, NotificationType, PaginationMeta } from '@auticare/contracts';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { NotificationsStateService } from '../../core/notifications/notifications-state.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ParentNotificationsApi } from './data-access/parent-notifications.api';

type ReadFilter = 'ALL' | 'UNREAD' | 'ARCHIVED';

@Component({
  standalone: true,
  selector: 'ac-parent-notifications',
  imports: [
    RouterLink,
    UiEmptyStateComponent,
    UiMessageComponent,
    UiPaginationComponent,
    UiSpinnerComponent,
  ],
  template: `
    <section class="notifications">
      <header class="head">
        <div>
          <h2>{{ currentLang() === 'km' ? 'ការជូនដំណឹងរបស់អ្នក' : 'Your notifications' }}</h2>
          <p class="sub">
            {{
              currentLang() === 'km'
                ? 'បច្ចុប្បន្នភាពពីសាលារៀន ការណាត់ជួប និងការវាយតម្លៃរបស់កូនអ្នក។'
                : 'Updates from your child’s school, appointments and screenings.'
            }}
          </p>
        </div>
        <div class="head-actions">
          @if (unreadTotal() !== null && unreadTotal()! > 0) {
            <span class="unread-pill">
              {{ unreadTotal() }} {{ currentLang() === 'km' ? 'មិនទាន់អាន' : 'unread' }}
            </span>
            <button
              type="button"
              class="mark-all-btn"
              [disabled]="markingAll()"
              (click)="markAllRead()"
            >
              {{
                markingAll()
                  ? currentLang() === 'km'
                    ? 'កំពុងសម្គាល់…'
                    : 'Marking…'
                  : currentLang() === 'km'
                    ? '✓ សម្គាល់ថាបានអានទាំងអស់'
                    : '✓ Mark all as read'
              }}
            </button>
          }
        </div>
      </header>

      <div class="filters" role="group" aria-label="Filter notifications">
        @for (option of filterOptions(); track option.value) {
          <button
            type="button"
            class="filter"
            [class.active]="filter() === option.value"
            [attr.aria-pressed]="filter() === option.value"
            (click)="setFilter(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <ac-ui-spinner
          [label]="
            currentLang() === 'km'
              ? 'កំពុងផ្ទុកការជូនដំណឹងរបស់អ្នក…'
              : 'Loading your notifications…'
          "
        />
      } @else if (error(); as problem) {
        <ac-ui-message tone="error">
          {{ problem }}
          <button type="button" class="retry" (click)="load()">
            {{ currentLang() === 'km' ? 'ព្យាយាមម្តងទៀត' : 'Try again' }}
          </button>
        </ac-ui-message>
      } @else if (notifications().length === 0) {
        <ac-ui-empty-state
          [title]="
            filter() === 'UNREAD'
              ? currentLang() === 'km'
                ? 'គ្មានសារមិនទាន់អាន'
                : 'Nothing unread'
              : currentLang() === 'km'
                ? 'មិនទាន់មានការជូនដំណឹង'
                : 'No notifications yet'
          "
          [message]="
            filter() === 'UNREAD'
              ? currentLang() === 'km'
                ? 'អ្នកបានអានការជូនដំណឹងទាំងអស់ហើយ។ ប្តូរទៅផ្ទាំង «ទាំងអស់» ដើម្បីមើលបច្ចុប្បន្នភាពមុនៗ។'
                : 'You have read everything. Switch to All to see earlier updates.'
              : currentLang() === 'km'
                ? 'អ្នកបានអានទាំងអស់រួចរាល់ហើយ។ បច្ចុប្បន្នភាពថ្មីពីសាលារៀន និងគ្លីនិកនឹងបង្ហាញនៅទីនេះ។'
                : 'You are all caught up. New updates from schools and clinics will appear here.'
          "
        />
      } @else {
        <ul class="list">
          @for (item of notifications(); track item.id) {
            <li class="row" [class.unread]="item.status === 'UNREAD'">
              <div class="row-main">
                <div class="row-head">
                  <span class="type-badge" [attr.data-tone]="presentation(item.type).tone">
                    {{ presentation(item.type).label }}
                  </span>
                  <strong>{{ item.title }}</strong>
                  @if (item.status === 'UNREAD') {
                    <span class="dot" aria-label="Unread"></span>
                  }
                </div>
                <p class="body">{{ item.body }}</p>
                <p class="when">{{ formatTimeAgo(item.createdAt) }}</p>
              </div>

              <div class="row-actions">
                @if (item.appointmentId) {
                  <a
                    class="row-link"
                    routerLink="/appointments"
                    [queryParams]="{ id: item.appointmentId }"
                    >{{ currentLang() === 'km' ? 'មើលការណាត់ជួប' : 'View appointment' }}</a
                  >
                } @else if (item.type === 'SCREENING' && item.reportId) {
                  <a class="row-link" [routerLink]="'/screening/result/' + item.reportId">{{
                    currentLang() === 'km' ? 'មើលលទ្ធផលវាយតម្លៃ' : 'View screening result'
                  }}</a>
                } @else if (item.reportId) {
                  <a
                    class="row-link"
                    routerLink="/progress"
                    [queryParams]="{ reportId: item.reportId }"
                    >{{ currentLang() === 'km' ? 'មើលរបាយការណ៍' : 'View report' }}</a
                  >
                } @else if (item.enrollmentId) {
                  <a class="row-link" routerLink="/schools">
                    {{ currentLang() === 'km' ? 'មើលការចុះឈ្មោះ' : 'View enrollment' }}
                  </a>
                } @else if (item.type === 'APPOINTMENT') {
                  <a class="row-link" routerLink="/appointments">
                    {{ currentLang() === 'km' ? 'មើលការណាត់ជួប' : 'View appointments' }}
                  </a>
                } @else if (item.type === 'SCHOOL_REPORT' || item.type === 'REPORT_REQUEST') {
                  <a class="row-link" routerLink="/progress">
                    {{ currentLang() === 'km' ? 'មើលរបាយការណ៍' : 'View reports' }}
                  </a>
                } @else if (item.type === 'ADMISSION' || item.type === 'ENROLLMENT_REQUEST') {
                  <a class="row-link" routerLink="/schools">
                    {{ currentLang() === 'km' ? 'មើលសាលារៀន' : 'View schools' }}
                  </a>
                } @else if (item.type === 'SCREENING') {
                  <a class="row-link" routerLink="/screening">
                    {{ currentLang() === 'km' ? 'មើលការវាយតម្លៃ' : 'View screenings' }}
                  </a>
                } @else if (item.type === 'ACTIVITY') {
                  <a class="row-link" routerLink="/activities">
                    {{ currentLang() === 'km' ? 'មើលសកម្មភាព' : 'View activities' }}
                  </a>
                } @else if (isCrisisNotification(item)) {
                  <a class="row-link" routerLink="/crisis">
                    {{ currentLang() === 'km' ? 'ធនធានសង្គ្រោះបន្ទាន់' : 'Crisis resources' }}
                  </a>
                }

                @if (item.status === 'UNREAD') {
                  <button
                    type="button"
                    class="mark-read-btn"
                    [disabled]="actingId() === item.id"
                    (click)="markRead(item)"
                  >
                    {{
                      actingId() === item.id
                        ? currentLang() === 'km'
                          ? 'កំពុងសម្គាល់…'
                          : 'Marking…'
                        : currentLang() === 'km'
                          ? 'សម្គាល់ថាបានអាន'
                          : 'Mark as read'
                    }}
                  </button>
                }
                @if (item.status !== 'ARCHIVED') {
                  <button
                    type="button"
                    class="archive-btn"
                    [disabled]="actingId() === item.id"
                    (click)="archive(item)"
                  >
                    {{
                      actingId() === item.id
                        ? currentLang() === 'km'
                          ? 'កំពុងរក្សាទុក…'
                          : 'Archiving…'
                        : currentLang() === 'km'
                          ? 'រក្សាទុក'
                          : 'Archive'
                    }}
                  </button>
                }
              </div>
            </li>
          }
        </ul>

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
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      h2 {
        margin: 0;
        font-size: var(--ac-type-page-title);
      }

      .sub {
        margin: 4px 0 0;
        color: var(--ac-color-text-body);
      }

      .unread-pill {
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-dark);
      }

      .head-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .mark-all-btn {
        min-height: 36px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        font-weight: var(--ac-font-weight-bold);
        font-size: var(--ac-type-meta);
        cursor: pointer;
      }

      .mark-all-btn:hover:not(:disabled) {
        background: var(--ac-color-surface-info);
      }

      .mark-all-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .filters {
        display: flex;
        gap: 8px;
        margin: 18px 0;
        flex-wrap: wrap;
      }

      .filter {
        min-height: 38px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        cursor: pointer;
      }

      .filter.active {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-bold);
      }

      .state {
        margin: 24px 0;
        color: var(--ac-color-text-body);
      }

      .state.error {
        padding: 14px 18px;
        border-radius: 10px;
        color: var(--ac-color-red-700);
        background: var(--ac-color-red-100);
        border: 1px solid var(--ac-color-red-border);
      }

      .retry {
        margin-top: 8px;
        min-height: 36px;
        padding: 0 14px;
        border-radius: 8px;
        border: 1px solid var(--ac-color-red-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-red-700);
        cursor: pointer;
      }

      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 18px;
        border: 1px solid var(--ac-color-slate-border-light);
        border-radius: 12px;
        background: var(--ac-color-surface);
      }

      .row.unread {
        border-color: var(--ac-color-border-info);
        background: var(--ac-color-tint-blue-pale);
      }

      .row-head {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .type-badge {
        padding: 3px 10px;
        border-radius: 999px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        background: var(--ac-color-slate-surface-clean);
        color: var(--ac-color-text-body);
      }

      .type-badge[data-tone='positive'] {
        background: var(--ac-color-green-tint-soft);
        color: var(--ac-color-forest-green);
      }

      .type-badge[data-tone='caution'] {
        background: var(--ac-color-amber-tint-50);
        color: var(--ac-color-amber-800);
      }

      .type-badge[data-tone='info'] {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-text-dark);
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      .body {
        margin: 8px 0 0;
        color: var(--ac-color-text);
        line-height: 1.55;
      }

      .when {
        margin: 6px 0 0;
        color: var(--ac-color-grey-b);
        font-size: var(--ac-type-meta);
      }

      .row-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        flex: 0 0 auto;
      }

      .row-link {
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: underline;
      }

      .archive-btn {
        background: transparent;
        color: var(--ac-text-muted);
        border: 1px solid var(--ac-border);
        border-radius: var(--ac-radius-sm);
        padding: 0.375rem 0.625rem;
        font-size: var(--ac-font-size-xs);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .archive-btn:hover:not(:disabled) {
        background: var(--ac-surface-hover);
        color: var(--ac-text-primary);
        border-color: var(--ac-border-strong);
      }
      .archive-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .mark-read-btn {
        min-height: 32px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .mark-read-btn:hover:not(:disabled) {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-border-info);
      }

      .mark-read-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      @media (max-width: 640px) {
        .row {
          flex-direction: column;
        }

        .row-actions {
          align-items: flex-start;
          flex-direction: row;
          margin-top: 8px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentNotificationsPage implements OnInit {
  private readonly api = inject(ParentNotificationsApi);
  private readonly notificationsState = inject(NotificationsStateService);
  private readonly i18n = inject(I18nService, { optional: true });

  readonly currentLang = computed(() => this.i18n?.currentLang?.() ?? 'en');

  protected readonly notifications = signal<readonly NotificationResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<ReadFilter>('ALL');
  protected readonly filterOptions = computed<ReadonlyArray<{ value: ReadFilter; label: string }>>(
    () => [
      { value: 'ALL', label: this.currentLang() === 'km' ? 'ទាំងអស់' : 'All' },
      { value: 'UNREAD', label: this.currentLang() === 'km' ? 'មិនទាន់អាន' : 'Unread' },
    ],
  );

  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly page = signal(1);

  /**
   * Total unread across every page, read from the unread filter's own total
   * rather than counted from the rows on screen — counting the page would have
   * reported "3 unread" when there were thirty.
   */
  protected readonly unreadTotal = signal<number | null>(null);
  protected readonly actingId = signal<string | null>(null);
  protected readonly markingAll = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected setFilter(value: ReadFilter): void {
    if (this.filter() === value) return;
    this.filter.set(value);
    // A filter narrows the result set, so page 4 of the old one may not exist.
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    const unreadOnly = this.filter() === 'UNREAD';
    this.api.list(this.page(), unreadOnly ? false : undefined).subscribe({
      next: ({ notifications, pagination }) => {
        this.notifications.set(notifications);
        this.pagination.set(pagination);
        if (unreadOnly) {
          this.unreadTotal.set(pagination.total);
          this.notificationsState.setUnreadCount(pagination.total);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Your notifications could not be loaded.');
        this.loading.set(false);
      },
    });
    if (!unreadOnly) this.loadUnreadTotal();
  }

  /**
   * One extra request for the badge when the list is unfiltered. The alternative
   * is an unread count in the list response, which would mean a second count
   * query on the server for every page either way.
   */
  private loadUnreadTotal(): void {
    this.api.list(1, false).subscribe({
      next: ({ pagination }) => {
        this.unreadTotal.set(pagination.total);
        this.notificationsState.setUnreadCount(pagination.total);
      },
      error: () => this.unreadTotal.set(null),
    });
  }

  protected archive(item: NotificationResponse): void {
    this.actingId.set(item.id);
    this.api.archive(item.id).subscribe({
      next: () => {
        this.actingId.set(null);
        if (item.status === 'UNREAD') {
          this.unreadTotal.update((total) => (total !== null ? Math.max(0, total - 1) : null));
          this.notificationsState.decrementUnread(1);
        }
        if (this.filter() !== 'ARCHIVED') {
          this.notifications.update((items) => items.filter((n) => n.id !== item.id));
        } else {
          this.notifications.update((items) =>
            items.map((n) => (n.id === item.id ? { ...n, status: 'ARCHIVED' as const } : n)),
          );
        }
      },
      error: () => {
        this.actingId.set(null);
      },
    });
  }

  protected markRead(item: NotificationResponse): void {
    this.actingId.set(item.id);
    this.api.markRead(item.id).subscribe({
      next: () => {
        this.actingId.set(null);
        this.notifications.update((items) =>
          items.map((n) => (n.id === item.id ? { ...n, status: 'READ' as const } : n)),
        );
        this.unreadTotal.update((total) => (total !== null ? Math.max(0, total - 1) : null));
        this.notificationsState.decrementUnread(1);
        if (this.filter() === 'UNREAD') {
          this.notifications.update((items) => items.filter((n) => n.id !== item.id));
        }
      },
      error: () => {
        this.actingId.set(null);
      },
    });
  }

  protected markAllRead(): void {
    this.markingAll.set(true);
    this.api.markAllRead().subscribe({
      next: () => {
        this.markingAll.set(false);
        this.notifications.update((items) => items.map((n) => ({ ...n, status: 'READ' as const })));
        this.unreadTotal.set(0);
        this.notificationsState.clearUnread();
        if (this.filter() === 'UNREAD') {
          this.notifications.set([]);
        }
      },
      error: () => {
        this.markingAll.set(false);
      },
    });
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

  presentation(type: NotificationType): { label: string; tone: string } {
    const isKm = this.currentLang() === 'km';
    switch (type) {
      case 'APPOINTMENT':
        return { label: isKm ? 'ការណាត់ជួប' : 'Appointment', tone: 'info' };
      case 'SCHOOL_REPORT':
        return { label: isKm ? 'របាយការណ៍សាលា' : 'School report', tone: 'positive' };
      case 'ADMISSION':
        return { label: isKm ? 'ការចុះឈ្មោះចូលរៀន' : 'Admission', tone: 'info' };
      case 'SCREENING':
        return { label: isKm ? 'ការវាយតម្លៃ' : 'Screening', tone: 'info' };
      case 'ACTIVITY':
        return { label: isKm ? 'សកម្មភាព' : 'Activity', tone: 'positive' };
      case 'ENROLLMENT_REQUEST':
        return { label: isKm ? 'សំណើចុះឈ្មោះ' : 'Enrollment', tone: 'caution' };
      case 'REPORT_REQUEST':
        return { label: isKm ? 'សំណើរបាយការណ៍' : 'Report request', tone: 'caution' };
      case 'SYSTEM':
      default:
        return { label: isKm ? 'ប្រព័ន្ធ' : 'AutiCare', tone: 'neutral' };
    }
  }

  protected isCrisisNotification(item: NotificationResponse): boolean {
    const text = `${item.title} ${item.body}`.toLowerCase();
    return text.includes('crisis') || text.includes('emergency') || text.includes('hotline');
  }
}
