import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { AdminAuditEvent, AdminAuditList } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { actionLabel, errorMessage, formatDateTime, totalPages } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

const PAGE_SIZE = 50;

const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * The audit log: account, permission, plan and school changes, newest first.
 * Read-only; entries cannot be edited or removed from here.
 */
@Component({
  standalone: true,
  imports: [UiMessageComponent, UiPaginationComponent, UiSpinnerComponent],
  selector: 'ac-admin-audit-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Audit Logs</h1>
        <p class="subtitle">
          A record of important actions: accounts created, suspended or removed, plan changes,
          school approvals and sign-in setup. Entries can't be changed.
        </p>
      </div>
      <button
        type="button"
        class="btn-ghost"
        [disabled]="!data()?.items?.length"
        (click)="exportCsv()"
      >
        Export this page (CSV)
      </button>
    </header>

    <form
      class="toolbar"
      (submit)="$event.preventDefault(); apply(action.value, from.value, to.value, target.value)"
    >
      <select #action aria-label="Action">
        <option value="">All actions</option>
        @for (name of data()?.actions ?? []; track name) {
          <option [value]="name" [selected]="name === filters.action">{{ label(name) }}</option>
        }
      </select>
      <input #from type="date" aria-label="From date" [value]="filters.from" />
      <input #to type="date" aria-label="To date" [value]="filters.to" />
      <input
        #target
        type="search"
        placeholder="Target email or id"
        aria-label="Target email or id"
        [value]="filters.search"
      />
      <button type="submit" class="btn-ghost">Apply</button>
    </form>

    @if (loading()) {
      <ac-ui-spinner label="Loading audit log…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      <section class="card" aria-label="Audit entries">
        <ul class="rows">
          @for (event of d.items; track event.id) {
            <li class="row">
              <div class="who">
                <strong>{{ label(event.action) }}</strong>
                <span class="meta">
                  {{ formatDateTime(event.createdAt) }} · by
                  {{
                    event.actorEmail ?? (event.actorRole ? event.actorRole.toLowerCase() : 'system')
                  }}
                </span>
                @if (event.targetEmail || event.targetId) {
                  <span class="meta">Target: {{ event.targetEmail ?? event.targetId }}</span>
                }
                @if (summary(event); as text) {
                  <span class="meta">{{ text }}</span>
                }
              </div>
            </li>
          } @empty {
            <li class="empty">No entries match.</li>
          }
        </ul>
      </section>
      @if (pages() > 1) {
        <ac-ui-pagination
          [page]="d.page"
          [totalPages]="pages()"
          [total]="d.total"
          [perPage]="d.pageSize"
          itemNoun="entries"
          (pageChange)="goTo($event)"
        />
      }
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAuditPage implements OnInit {
  private readonly api = inject(AdminPortalApi);

  protected readonly data = signal<AdminAuditList | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pages = signal(1);
  protected readonly label = actionLabel;
  protected readonly formatDateTime = formatDateTime;
  protected filters = { action: '', from: '', to: '', search: '' };

  private page = 1;

  ngOnInit(): void {
    this.load();
  }

  protected apply(action: string, from: string, to: string, search: string): void {
    this.filters = { action, from, to, search: search.trim() };
    this.page = 1;
    this.load();
  }

  protected goTo(page: number): void {
    this.page = page;
    this.load();
  }

  /** Safe, short metadata (reason, plan, school) shown under an entry. */
  protected summary(event: AdminAuditEvent): string {
    const meta = event.metadata ?? {};
    const parts = ['reason', 'plan', 'schoolName', 'hospitalName', 'role', 'from', 'to']
      .filter((key) => typeof meta[key] === 'string' && meta[key] !== '')
      .map((key) => `${key}: ${meta[key] as string}`);
    return parts.join(' · ');
  }

  protected exportCsv(): void {
    const rows = this.data()?.items ?? [];
    const header = [
      'time',
      'action',
      'actor',
      'actor role',
      'target email',
      'target id',
      'details',
    ];
    const lines = [
      header.join(','),
      ...rows.map((event) =>
        [
          event.createdAt,
          event.action,
          event.actorEmail,
          event.actorRole,
          event.targetEmail,
          event.targetId,
          this.summary(event),
        ]
          .map(csvCell)
          .join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auticare-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .audit({
        page: this.page,
        pageSize: PAGE_SIZE,
        action: this.filters.action,
        from: this.filters.from,
        to: this.filters.to,
        search: this.filters.search,
      })
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.pages.set(totalPages(data.total, data.pageSize));
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err, 'The audit log could not be loaded.'));
          this.loading.set(false);
        },
      });
  }
}
