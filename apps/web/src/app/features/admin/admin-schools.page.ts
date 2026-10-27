import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminSchool, AdminSchoolList, UpdateAdminSchoolRequest } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage, formatDate, totalPages } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

type StatusFilter = '' | 'ACTIVE' | 'INACTIVE';

const PAGE_SIZE = 25;

/**
 * Schools for the platform admin: plan, teachers and sponsored slots at a
 * glance, plus verifying the directory listing and suspending access.
 */
@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent, UiPaginationComponent, UiSpinnerComponent],
  selector: 'ac-admin-schools-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Schools &amp; Organizations</h1>
        <p class="subtitle">
          Partner schools. Suspending a school hides it from the directory and signs its staff out
          until you reactivate it. No school or child data is deleted.
        </p>
      </div>
      <div class="actions">
        <a class="btn-ghost" routerLink="/admin/school-registrations">School requests</a>
        <a class="btn-primary" routerLink="/schools/admin/new">Create school account</a>
      </div>
    </header>

    <form class="toolbar" role="search" (submit)="$event.preventDefault(); search(query.value)">
      <input
        #query
        type="search"
        placeholder="Search by school name or city"
        aria-label="Search schools"
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
      <ac-ui-spinner label="Loading schools…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      <section class="card" aria-label="Schools">
        <ul class="rows">
          @for (school of d.items; track school.id) {
            <li class="row">
              <div class="who">
                <strong>{{ school.name }}</strong>
                <span class="meta">
                  {{ school.city }} · since {{ formatDate(school.createdAt) }}
                  @if (school.adminEmail) {
                    · {{ school.adminEmail }}
                  }
                </span>
                <span class="meta">
                  {{ school.teacherCount }}
                  {{ school.teacherCount === 1 ? 'teacher' : 'teachers' }} ·
                  {{ school.sponsoredUsed }} of 5 sponsored Pro accounts in use
                </span>
              </div>
              <span class="chip" [class.off]="!school.businessActive">{{
                school.businessActive ? 'Business' : 'No plan'
              }}</span>
              @if (school.isVerified) {
                <span class="chip">Verified</span>
              }
              @if (school.status === 'INACTIVE') {
                <span class="chip warn">Suspended</span>
              }
              <div class="actions">
                <button type="button" class="btn-small" (click)="toggleVerified(school)">
                  {{ school.isVerified ? 'Remove verified' : 'Verify' }}
                </button>
                @if (school.status === 'INACTIVE') {
                  <button
                    type="button"
                    class="btn-small"
                    (click)="setSchoolStatus(school, 'ACTIVE')"
                  >
                    Reactivate
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn-small danger"
                    (click)="setSchoolStatus(school, 'INACTIVE')"
                  >
                    Suspend
                  </button>
                }
              </div>
            </li>
          } @empty {
            <li class="empty">No schools match.</li>
          }
        </ul>
      </section>
      @if (pages() > 1) {
        <ac-ui-pagination
          [page]="d.page"
          [totalPages]="pages()"
          [total]="d.total"
          [perPage]="d.pageSize"
          itemNoun="schools"
          (pageChange)="goTo($event)"
        />
      }
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSchoolsPage implements OnInit {
  private readonly api = inject(AdminPortalApi);

  protected readonly data = signal<AdminSchoolList | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly status = signal<StatusFilter>('');
  protected readonly pages = signal(1);
  protected readonly formatDate = formatDate;
  protected readonly filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Suspended', value: 'INACTIVE' },
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

  protected toggleVerified(school: AdminSchool): void {
    this.update(school, { isVerified: !school.isVerified });
  }

  protected setSchoolStatus(school: AdminSchool, status: 'ACTIVE' | 'INACTIVE'): void {
    if (status === 'INACTIVE') {
      const reason = prompt(
        `Suspend ${school.name}? It disappears from the directory and its staff are signed out.\n\nReason (kept in the audit log):`,
      );
      if (reason === null) return;
      this.update(school, { status, reason: reason.trim() });
      return;
    }
    if (!confirm(`Reactivate ${school.name}?`)) return;
    this.update(school, { status });
  }

  private update(school: AdminSchool, input: UpdateAdminSchoolRequest): void {
    this.actionError.set(null);
    this.api.updateSchool(school.id, input).subscribe({
      next: (updated) =>
        this.data.update((d) =>
          d ? { ...d, items: d.items.map((row) => (row.id === updated.id ? updated : row)) } : d,
        ),
      error: (err: unknown) =>
        this.actionError.set(errorMessage(err, 'The school could not be updated.')),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .schools({
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
          this.error.set(errorMessage(err, 'Schools could not be loaded.'));
          this.loading.set(false);
        },
      });
  }
}
