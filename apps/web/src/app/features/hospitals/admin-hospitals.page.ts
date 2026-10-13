import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminHospitalAccountResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { HospitalsApi } from './data-access/hospitals.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiCardComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    UiEmptyStateComponent,
  ],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Manage hospitals</h1>
        <p>Create and review hospital manager login accounts linked to hospital profiles.</p>
      </div>
      <a routerLink="/hospitals/admin/new">Create hospital account</a>
    </section>

    @if (loading()) {
      <ac-ui-card><ac-ui-spinner label="Loading hospital accounts…" /></ac-ui-card>
    } @else if (error()) {
      <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
    }
    @if (message()) {
      <ac-ui-message tone="success">{{ message() }}</ac-ui-message>
    }
    @if (!loading() && !accounts().length) {
      <ac-ui-empty-state
        title="No hospital accounts yet"
        message="A hospital account lets a hospital manager oversee specialists, appointments, and hospital profiles."
      >
        <a class="cta" routerLink="/hospitals/admin/new">Create a hospital account</a>
      </ac-ui-empty-state>
    } @else {
      <section class="grid" aria-label="Hospital accounts">
        @for (item of accounts(); track item.staff.id) {
          <ac-ui-card>
            <h2>{{ item.hospital.name }}</h2>
            <p class="meta">{{ item.hospital.city }} · {{ item.account.email }}</p>
            <p>{{ item.hospital.address }}</p>
            <p>
              {{ item.account.firstName }} {{ item.account.lastName }}
              @if (item.staff.title) {
                <span>· {{ item.staff.title }}</span>
              }
            </p>
            <button
              type="button"
              class="resend-btn"
              [disabled]="resendingEmail() === item.account.email"
              (click)="resendInvitation(item.account.email)"
            >
              {{ resendingEmail() === item.account.email ? 'Sending…' : 'Resend Invitation' }}
            </button>
          </ac-ui-card>
        }
      </section>
    }
  `,
  styles: [
    `
      .cta {
        display: inline-flex;
        align-items: center;
        min-height: 40px;
        padding: 0 var(--ac-space-4);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: start;
        margin-bottom: 28px;
      }
      .page-header a {
        border-radius: 8px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        padding: 12px 16px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
      }
      .eyebrow,
      .meta {
        color: var(--ac-color-action);
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
      .resend-btn {
        margin-top: 12px;
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        border-radius: 6px;
        padding: 6px 12px;
        font: inherit;
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }
      .resend-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        color: var(--ac-color-alert-text);
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
export class AdminHospitalsPage implements OnInit {
  private readonly api = inject(HospitalsApi);
  readonly accounts = signal<readonly AdminHospitalAccountResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly resendingEmail = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.api.listAdminHospitalAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Hospital accounts could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }

  resendInvitation(email: string) {
    this.resendingEmail.set(email);
    this.error.set(null);
    this.message.set(null);
    this.api.resendInvitation({ email }).subscribe({
      next: (res) => {
        this.message.set(res.message);
        this.resendingEmail.set(null);
      },
      error: (err) => {
        const msg = err?.error?.error?.message || 'Failed to resend invitation. Please try again.';
        this.error.set(msg);
        this.resendingEmail.set(null);
      },
    });
  }
}
