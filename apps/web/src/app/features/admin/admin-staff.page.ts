import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { AdminStaff, AdminStaffList, AdminStaffStatus } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage, totalPages } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<AdminStaffStatus, string> = {
  ACTIVE: 'Active',
  SETUP_PENDING: 'Waiting for setup',
  DEACTIVATED: 'Removed by school',
  SUSPENDED: 'Suspended',
};

/**
 * School admins and teachers across every school. Teachers are created and
 * assigned by their own school admin; the platform admin helps with access
 * problems and can suspend an account when needed.
 */
@Component({
  standalone: true,
  imports: [UiMessageComponent, UiPaginationComponent, UiSpinnerComponent],
  selector: 'ac-admin-staff-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Teachers &amp; Staff</h1>
        <p class="subtitle">
          Staff at every school. Teachers sign in with a username and a setup code from their school
          admin, who also decides which children they see. If a teacher's setup code has expired,
          their school admin issues a new one from the school's Team page.
        </p>
      </div>
    </header>

    <form class="toolbar" role="search" (submit)="$event.preventDefault(); search(query.value)">
      <input
        #query
        type="search"
        placeholder="Search by name, username, email or school"
        aria-label="Search staff"
      />
      <button type="submit" class="btn-ghost">Search</button>
    </form>

    @if (actionError(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    }

    @if (loading()) {
      <ac-ui-spinner label="Loading staff…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      <section class="card" aria-label="Staff">
        <ul class="rows">
          @for (member of d.items; track member.id) {
            <li class="row">
              <div class="who">
                <strong>{{ member.firstName }} {{ member.lastName }}</strong>
                <span class="meta">
                  {{ member.role === 'ADMIN' ? 'School admin' : member.title || 'Teacher' }} ·
                  {{ member.schoolName }}
                </span>
                <span class="meta">
                  @if (member.username) {
                    <code>{{ member.username }}</code>
                  }
                  @if (member.email) {
                    {{ member.email }}
                  }
                </span>
              </div>
              <span
                class="chip"
                [class.warn]="member.status === 'SETUP_PENDING' || member.status === 'SUSPENDED'"
                [class.off]="member.status === 'DEACTIVATED'"
                >{{ statusLabel[member.status] }}</span
              >
              @if (member.status === 'SUSPENDED') {
                <button type="button" class="btn-small" (click)="reactivate(member)">
                  Reactivate
                </button>
              } @else {
                <button type="button" class="btn-small danger" (click)="suspend(member)">
                  Suspend
                </button>
              }
            </li>
          } @empty {
            <li class="empty">No staff match.</li>
          }
        </ul>
      </section>
      @if (pages() > 1) {
        <ac-ui-pagination
          [page]="d.page"
          [totalPages]="pages()"
          [total]="d.total"
          [perPage]="d.pageSize"
          itemNoun="staff"
          (pageChange)="goTo($event)"
        />
      }
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStaffPage implements OnInit {
  private readonly api = inject(AdminPortalApi);

  protected readonly data = signal<AdminStaffList | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly pages = signal(1);
  protected readonly statusLabel = STATUS_LABEL;

  private searchTerm = '';
  private page = 1;

  ngOnInit(): void {
    this.load();
  }

  protected search(term: string): void {
    this.searchTerm = term.trim();
    this.page = 1;
    this.load();
  }

  protected goTo(page: number): void {
    this.page = page;
    this.load();
  }

  protected suspend(member: AdminStaff): void {
    const name = `${member.firstName} ${member.lastName}`;
    const reason = prompt(
      `Suspend ${name}? They are signed out and cannot sign in at any school until reactivated.\n\nReason (kept in the audit log):`,
    );
    if (reason === null) return;
    if (reason.trim().length < 3) {
      this.actionError.set('Give a reason of at least 3 characters.');
      return;
    }
    this.actionError.set(null);
    this.api.suspendAccount(member.accountId, reason.trim()).subscribe({
      next: () => this.load(),
      error: (err: unknown) =>
        this.actionError.set(errorMessage(err, 'The account could not be suspended.')),
    });
  }

  protected reactivate(member: AdminStaff): void {
    if (!confirm(`Reactivate ${member.firstName} ${member.lastName}?`)) return;
    this.actionError.set(null);
    this.api.reactivateAccount(member.accountId).subscribe({
      next: () => this.load(),
      error: (err: unknown) =>
        this.actionError.set(errorMessage(err, 'The account could not be reactivated.')),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.staff({ page: this.page, pageSize: PAGE_SIZE, search: this.searchTerm }).subscribe({
      next: (data) => {
        this.data.set(data);
        this.pages.set(totalPages(data.total, data.pageSize));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Staff could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
