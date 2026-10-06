import { DatePipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NotificationResponse, NotificationType, PaginationMeta } from '@auticare/contracts';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { ParentNotificationsApi } from './data-access/parent-notifications.api';

/** Plain-language label and tone per notification type. */
const PRESENTATION: Record<NotificationType, { label: string; tone: string }> = {
  SYSTEM: { label: 'AutiCare', tone: 'neutral' },
  APPOINTMENT: { label: 'Appointment', tone: 'info' },
  ADMISSION: { label: 'Admission', tone: 'info' },
  SCREENING: { label: 'Screening', tone: 'info' },
  ACTIVITY: { label: 'Activity', tone: 'positive' },
  SCHOOL_REPORT: { label: 'School report', tone: 'positive' },
  ENROLLMENT_REQUEST: { label: 'Enrollment', tone: 'caution' },
  REPORT_REQUEST: { label: 'Report request', tone: 'caution' },
};

type ReadFilter = 'ALL' | 'UNREAD';

@Component({
  standalone: true,
  selector: 'ac-parent-notifications',
  imports: [
    DatePipe,
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
          <h2>Your notifications</h2>
          <p class="sub">Updates from your child’s school, appointments and screenings.</p>
        </div>
        @if (unreadTotal() !== null && unreadTotal()! > 0) {
          <span class="unread-pill">{{ unreadTotal() }} unread</span>
        }
      </header>

      <div class="filters" role="group" aria-label="Filter notifications">
        @for (option of filterOptions; track option.value) {
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
        <ac-ui-spinner label="Loading your notifications…" />
      } @else if (error(); as problem) {
        <ac-ui-message tone="error">
          {{ problem }}
          <button type="button" class="retry" (click)="load()">Try again</button>
        </ac-ui-message>
      } @else if (notifications().length === 0) {
        <ac-ui-empty-state
          [title]="filter() === 'UNREAD' ? 'Nothing unread' : 'No notifications yet'"
          [message]="
            filter() === 'UNREAD'
              ? 'You have read everything. Switch to All to see earlier updates.'
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
                <p class="when">{{ item.createdAt | date: 'medium' }}</p>
              </div>

              @if (item.reportId) {
                <a class="row-link" routerLink="/progress">View report</a>
              }
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
        border: 1px solid #dbe5e8;
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
        background: #eef3f6;
        color: var(--ac-color-text-body);
      }

      .type-badge[data-tone='positive'] {
        background: #e8f7ee;
        color: #0b6b3a;
      }

      .type-badge[data-tone='caution'] {
        background: #fff4e5;
        color: #8a5a00;
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

      .row-link {
        flex: 0 0 auto;
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: underline;
      }

      @media (max-width: 640px) {
        .row {
          flex-direction: column;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentNotificationsPage implements OnInit {
  private readonly api = inject(ParentNotificationsApi);

  protected readonly notifications = signal<readonly NotificationResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<ReadFilter>('ALL');
  protected readonly filterOptions: ReadonlyArray<{ value: ReadFilter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'UNREAD', label: 'Unread' },
  ];

  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly page = signal(1);

  /**
   * Total unread across every page, read from the unread filter's own total
   * rather than counted from the rows on screen — counting the page would have
   * reported "3 unread" when there were thirty.
   */
  protected readonly unreadTotal = signal<number | null>(null);

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
        if (unreadOnly) this.unreadTotal.set(pagination.total);
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
      next: ({ pagination }) => this.unreadTotal.set(pagination.total),
      error: () => this.unreadTotal.set(null),
    });
  }

  protected presentation(type: NotificationType): { label: string; tone: string } {
    return PRESENTATION[type] ?? { label: 'Update', tone: 'neutral' };
  }
}
