import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { AdminParent, AdminParentList } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage, formatDate, totalPages } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

type StatusFilter = '' | 'ACTIVE' | 'SUSPENDED';

const PAGE_SIZE = 25;

/**
 * Parent accounts for the platform admin. Shows each family's plan and how many
 * child profiles they have, never which children or anything about them.
 */
@Component({
  standalone: true,
  imports: [UiMessageComponent, UiPaginationComponent, UiSpinnerComponent],
  selector: 'ac-admin-parents-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Parents &amp; Families</h1>
        <p class="subtitle">
          Registered parent accounts. You see the plan and the number of child profiles, not the
          children's information.
        </p>
      </div>
    </header>

    <form class="toolbar" role="search" (submit)="$event.preventDefault(); search(query.value)">
      <input
        #query
        type="search"
        placeholder="Search by name or email"
        aria-label="Search parents"
      />
      <button type="submit" class="btn-ghost">Search</button>
      <div class="actions" role="group" aria-label="Filter by status">
        @for (option of filters; track option.value) {
          <button
            type="button"
            class="btn-small"
            [attr.aria-pressed]="status() === option.value"
            (click)="setStatus(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>
    </form>

    @if (actionError(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    }

    @if (loading()) {
      <ac-ui-spinner label="Loading parents…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      <section class="card" aria-label="Parents">
        <ul class="rows">
          @for (parent of d.items; track parent.id) {
            <li class="row">
              <div class="who">
                <strong>{{ parent.firstName }} {{ parent.lastName }}</strong>
                <span class="meta"
                  >{{ parent.email }} · joined {{ formatDate(parent.createdAt) }}</span
                >
                @if (parent.status === 'SUSPENDED' && parent.suspendedReason) {
                  <span class="meta">Suspended: {{ parent.suspendedReason }}</span>
                }
              </div>
              <span class="chip" [class.off]="parent.plan === 'FREE'">{{
                parent.plan === 'PRO' ? 'Pro' : 'Free'
              }}</span>
              <span class="meta">
                {{ parent.childCount }} {{ parent.childCount === 1 ? 'child' : 'children' }}
              </span>
              @if (parent.status === 'SUSPENDED') {
                <span class="chip warn">Suspended</span>
                <button type="button" class="btn-small" (click)="reactivate(parent)">
                  Reactivate
                </button>
              } @else {
                <button type="button" class="btn-small danger" (click)="suspend(parent)">
                  Suspend
                </button>
              }
            </li>
          } @empty {
            <li class="empty">No parents match.</li>
          }
        </ul>
      </section>
      @if (pages() > 1) {
        <ac-ui-pagination
          [page]="d.page"
          [totalPages]="pages()"
          [total]="d.total"
          [perPage]="d.pageSize"
          itemNoun="parents"
          (pageChange)="goTo($event)"
        />
      }
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminParentsPage implements OnInit {
  private readonly api = inject(AdminPortalApi);

  protected readonly data = signal<AdminParentList | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly status = signal<StatusFilter>('');
  protected readonly pages = signal(1);
  protected readonly formatDate = formatDate;
  protected readonly filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Suspended', value: 'SUSPENDED' },
  ];

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

  protected setStatus(value: StatusFilter): void {
    this.status.set(value);
    this.page = 1;
    this.load();
  }

  protected goTo(page: number): void {
    this.page = page;
    this.load();
  }

  protected suspend(parent: AdminParent): void {
    const reason = prompt(
      `Suspend ${parent.email}? They will be signed out and cannot sign in until reactivated. Nothing is deleted.\n\nReason (kept in the audit log):`,
    );
    if (reason === null) return;
    if (reason.trim().length < 3) {
      this.actionError.set('Give a reason of at least 3 characters.');
      return;
    }
    this.actionError.set(null);
    this.api.suspendAccount(parent.id, reason.trim()).subscribe({
      next: () => this.load(),
      error: (err: unknown) =>
        this.actionError.set(errorMessage(err, 'The account could not be suspended.')),
    });
  }

  protected reactivate(parent: AdminParent): void {
    if (!confirm(`Reactivate ${parent.email}?`)) return;
    this.actionError.set(null);
    this.api.reactivateAccount(parent.id).subscribe({
      next: () => this.load(),
      error: (err: unknown) =>
        this.actionError.set(errorMessage(err, 'The account could not be reactivated.')),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .parents({
        page: this.page,
        pageSize: PAGE_SIZE,
        search: this.searchTerm,
        status: this.status(),
      })
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.pages.set(totalPages(data.total, data.pageSize));
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(errorMessage(err, 'Parents could not be loaded.'));
          this.loading.set(false);
        },
      });
  }
}
