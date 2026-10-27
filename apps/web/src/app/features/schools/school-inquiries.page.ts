import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { OrganizationInquiryResponse } from '@auticare/contracts';
import { InquiriesApi } from '../find-support/data-access/inquiries.api';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';

@Component({
  selector: 'ac-school-inquiries',
  standalone: true,
  imports: [DatePipe, UiSpinnerComponent, UiEmptyStateComponent],
  template: `
    <div class="inquiries-container">
      <header class="inquiries-header">
        <div>
          <h1 class="page-title">Parent Inquiries</h1>
          <p class="page-subtitle">
            Messages and interest submissions received from parents inquiring about your school.
          </p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <ac-ui-spinner label="Loading school inquiries..."></ac-ui-spinner>
        </div>
      } @else if (error()) {
        <div class="error-banner" role="alert">
          <p>{{ error() }}</p>
          <button type="button" class="btn-retry" (click)="loadInquiries()">Try Again</button>
        </div>
      } @else if (inquiries().length === 0) {
        <ac-ui-empty-state
          title="No inquiries received yet"
          message="When parents send inquiries through the support directory, they will appear here."
        ></ac-ui-empty-state>
      } @else {
        <div class="table-card">
          <table class="inquiries-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Parent Name</th>
                <th scope="col">Child First Name</th>
                <th scope="col">Subject</th>
                <th scope="col">Message</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (inquiry of inquiries(); track inquiry.id) {
                <tr [class.read-row]="inquiry.status === 'READ'">
                  <td class="date-cell">{{ inquiry.createdAt | date: 'shortDate' }}</td>
                  <td class="parent-cell">
                    {{
                      inquiry.parentName ||
                        (inquiry.parent
                          ? inquiry.parent.firstName + ' ' + inquiry.parent.lastName
                          : 'Parent')
                    }}
                  </td>
                  <td class="child-cell">{{ inquiry.childFirstName || '—' }}</td>
                  <td class="subject-cell">{{ inquiry.subject }}</td>
                  <td class="message-cell">
                    <p class="message-text" [class.expanded]="expandedMap()[inquiry.id]">
                      {{ inquiry.message }}
                    </p>
                    @if (inquiry.message.length > 100) {
                      <button
                        type="button"
                        class="btn-toggle-expand"
                        (click)="toggleExpand(inquiry.id)"
                      >
                        {{ expandedMap()[inquiry.id] ? 'Show less' : 'Read more' }}
                      </button>
                    }
                  </td>
                  <td class="status-cell">
                    <span
                      class="status-chip"
                      [class.new-status]="inquiry.status === 'NEW'"
                      [class.read-status]="inquiry.status === 'READ'"
                    >
                      {{ inquiry.status }}
                    </span>
                  </td>
                  <td class="action-cell">
                    @if (inquiry.status === 'NEW') {
                      <button
                        type="button"
                        class="btn-mark-read"
                        (click)="markAsRead(inquiry)"
                        [disabled]="updatingId() === inquiry.id"
                      >
                        {{ updatingId() === inquiry.id ? 'Saving...' : 'Mark as read' }}
                      </button>
                    } @else {
                      <span class="muted-label">Completed</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .inquiries-container {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-lg);
        padding: var(--ac-spacing-lg);
        max-width: 1200px;
        margin: 0 auto;
      }

      .inquiries-header {
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: var(--ac-spacing-md);
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

      .table-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        overflow-x: auto;
      }

      .inquiries-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: var(--ac-type-body);
      }

      .inquiries-table th {
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        background: color-mix(in srgb, var(--ac-color-surface) 60%, var(--ac-color-border));
        color: var(--ac-color-text);
        font-weight: var(--ac-font-weight-bold);
        border-bottom: 1px solid var(--ac-color-border);
        white-space: nowrap;
      }

      .inquiries-table td {
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        border-bottom: 1px solid var(--ac-color-border);
        vertical-align: top;
        color: var(--ac-color-text);
      }

      .inquiries-table tr:last-child td {
        border-bottom: none;
      }

      .read-row {
        background: color-mix(in srgb, var(--ac-color-surface) 90%, var(--ac-color-background));
      }

      .date-cell {
        white-space: nowrap;
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .parent-cell {
        font-weight: var(--ac-font-weight-medium);
        white-space: nowrap;
      }

      .child-cell {
        white-space: nowrap;
      }

      .subject-cell {
        font-weight: var(--ac-font-weight-medium);
        max-width: 220px;
      }

      .message-cell {
        max-width: 320px;
      }

      .message-text {
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
      }

      .message-text.expanded {
        display: block;
        -webkit-line-clamp: unset;
      }

      .btn-toggle-expand {
        background: transparent;
        border: none;
        padding: 0;
        color: var(--ac-color-primary);
        cursor: pointer;
        font-size: var(--ac-type-small);
        margin-top: 0.25rem;
      }

      .status-chip {
        display: inline-block;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-bold);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
      }

      .status-chip.new-status {
        background: color-mix(in srgb, var(--ac-color-warning) 15%, transparent);
        color: var(--ac-color-warning);
      }

      .status-chip.read-status {
        background: color-mix(in srgb, var(--ac-color-text-muted) 15%, transparent);
        color: var(--ac-color-text-muted);
      }

      .action-cell {
        white-space: nowrap;
      }

      .btn-mark-read {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-sm);
        padding: var(--ac-spacing-xs) var(--ac-spacing-sm);
        font-size: var(--ac-type-small);
        color: var(--ac-color-text);
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-mark-read:hover {
        border-color: var(--ac-color-primary);
        color: var(--ac-color-primary);
      }

      .muted-label {
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .loading-state {
        padding: var(--ac-spacing-xl);
        display: flex;
        justify-content: center;
      }

      .error-banner {
        padding: var(--ac-spacing-md);
        background: color-mix(in srgb, var(--ac-color-danger) 15%, transparent);
        border: 1px solid var(--ac-color-danger);
        border-radius: var(--ac-radius-md);
        color: var(--ac-color-danger);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .btn-retry {
        background: var(--ac-color-danger);
        color: var(--ac-color-surface);
        border: none;
        padding: var(--ac-spacing-xs) var(--ac-spacing-md);
        border-radius: var(--ac-radius-sm);
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolInquiriesPage implements OnInit {
  private readonly inquiriesApi = inject(InquiriesApi);

  readonly inquiries = signal<OrganizationInquiryResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly expandedMap = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadInquiries();
  }

  loadInquiries(): void {
    this.loading.set(true);
    this.error.set(null);

    this.inquiriesApi.listSchoolInquiries().subscribe({
      next: (data) => {
        this.inquiries.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.error?.message || 'Failed to load school inquiries.');
        this.loading.set(false);
      },
    });
  }

  toggleExpand(id: string): void {
    this.expandedMap.update((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  markAsRead(inquiry: OrganizationInquiryResponse): void {
    this.updatingId.set(inquiry.id);
    this.inquiriesApi.markSchoolInquiryRead(inquiry.id).subscribe({
      next: (updated) => {
        this.inquiries.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.updatingId.set(null);
      },
      error: () => {
        this.updatingId.set(null);
      },
    });
  }
}
