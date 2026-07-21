import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminSchoolAccountResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';

@Component({
  standalone: true,
  imports: [RouterLink, UiCardComponent],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Manage schools</h1>
        <p>Create and review school login accounts linked to school profiles.</p>
      </div>
      <a routerLink="/schools/admin/new">Create school account</a>
    </section>

    @if (loading()) {
      <ac-ui-card><p>Loading school accounts...</p></ac-ui-card>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    } @else if (!accounts().length) {
      <ac-ui-card><p>No school accounts have been created yet.</p></ac-ui-card>
    } @else {
      <section class="grid" aria-label="School accounts">
        @for (item of accounts(); track item.staff.id) {
          <ac-ui-card>
            <h2>{{ item.school.name }}</h2>
            <p class="meta">{{ item.school.city }} · {{ item.account.email }}</p>
            <p>{{ item.school.address }}</p>
            <p>
              {{ item.account.firstName }} {{ item.account.lastName }}
              @if (item.staff.title) {
                <span>· {{ item.staff.title }}</span>
              }
            </p>
          </ac-ui-card>
        }
      </section>
    }
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: start;
        margin-bottom: 28px;
      }
      .page-header a {
        border-radius: 8px;
        background: #3d6375;
        color: #ffffff;
        padding: 12px 16px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
      }
      .eyebrow,
      .meta {
        color: #3d6375;
        font-weight: var(--ac-font-weight-bold);
      }
      h1 {
        margin: 0;
        font-size: var(--ac-type-page-title);
      }
      h2 {
        margin-top: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .error {
        color: #a23434;
        font-weight: var(--ac-font-weight-semibold);
      }
      @media (max-width: 720px) {
        .page-header {
          display: block;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSchoolsPage implements OnInit {
  private readonly api = inject(SchoolsApi);
  readonly accounts = signal<readonly AdminSchoolAccountResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.api.listAdminSchoolAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('School accounts could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
