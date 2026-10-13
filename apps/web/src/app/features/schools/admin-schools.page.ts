import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminSchoolAccountResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { SchoolsApi } from './data-access/schools.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiCardComponent,
    UiBadgeComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    UiEmptyStateComponent,
  ],
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
      <ac-ui-card><ac-ui-spinner label="Loading school accounts…" /></ac-ui-card>
    } @else if (error()) {
      <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
    }
    @if (message()) {
      <ac-ui-message tone="success">{{ message() }}</ac-ui-message>
    }
    @if (!loading() && !accounts().length) {
      <ac-ui-empty-state
        title="No school accounts yet"
        message="A school account lets a school manage its own students, reports and enrollment requests."
      >
        <a class="cta" routerLink="/schools/admin/new">Create a school account</a>
      </ac-ui-empty-state>
    } @else {
      <section class="grid" aria-label="School accounts">
        @for (item of accounts(); track item.staff.id) {
          <ac-ui-card>
            <div class="card-header">
              <h2>{{ item.school.name }}</h2>
              <ac-ui-badge [tone]="item.school.isVerified ? 'positive' : 'neutral'">
                {{ item.school.isVerified ? 'Verified' : 'Unverified' }}
              </ac-ui-badge>
            </div>
            <p class="meta">{{ item.school.city }} · {{ item.account.email }}</p>
            <p>{{ item.school.address }}</p>
            <p>
              {{ item.account.firstName }} {{ item.account.lastName }}
              @if (item.staff.title) {
                <span>· {{ item.staff.title }}</span>
              }
            </p>
            <div class="card-actions">
              <button
                type="button"
                class="verify-toggle-btn"
                [class.is-verified]="item.school.isVerified"
                [disabled]="togglingSchoolId() === item.school.id"
                (click)="toggleVerification(item)"
              >
                {{
                  togglingSchoolId() === item.school.id
                    ? 'Updating…'
                    : item.school.isVerified
                      ? 'Revoke Verification'
                      : 'Verify School'
                }}
              </button>
              <button
                type="button"
                class="resend-btn"
                [disabled]="resendingEmail() === item.account.email"
                (click)="resendInvitation(item.account.email)"
              >
                {{ resendingEmail() === item.account.email ? 'Sending…' : 'Resend Invitation' }}
              </button>
            </div>
          </ac-ui-card>
        }
      </section>
    }

    @if (toastMessage()) {
      <div class="toast" role="status">{{ toastMessage() }}</div>
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
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 4px;
      }
      h2 {
        margin: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }
      .verify-toggle-btn {
        border: 1px solid var(--ac-color-action);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        border-radius: 6px;
        padding: 6px 12px;
        font: inherit;
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          border-color 0.15s ease,
          color 0.15s ease;
      }
      .verify-toggle-btn:hover {
        background: var(--ac-color-surface-slate);
      }
      .verify-toggle-btn.is-verified {
        border-color: var(--ac-color-red-border);
        color: var(--ac-color-alert-text);
      }
      .verify-toggle-btn.is-verified:hover {
        background: var(--ac-color-red-50);
      }
      .resend-btn {
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
      .resend-btn:hover {
        background: var(--ac-color-surface-slate);
      }
      .verify-toggle-btn:disabled,
      .resend-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--ac-color-action-darkest);
        color: var(--ac-color-text-on-action);
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        pointer-events: none;
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
export class AdminSchoolsPage implements OnInit, OnDestroy {
  private readonly api = inject(SchoolsApi);
  readonly accounts = signal<readonly AdminSchoolAccountResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly resendingEmail = signal<string | null>(null);
  readonly togglingSchoolId = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

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

  ngOnDestroy() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  showToast(msg: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(msg);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 4000);
  }

  toggleVerification(item: AdminSchoolAccountResponse) {
    const newVerified = !item.school.isVerified;
    this.togglingSchoolId.set(item.school.id);
    this.error.set(null);

    this.api.updateSchool(item.school.id, { isVerified: newVerified }).subscribe({
      next: (updatedSchool) => {
        this.accounts.update((accounts) =>
          accounts.map((acc) =>
            acc.school.id === item.school.id
              ? { ...acc, school: { ...acc.school, isVerified: updatedSchool.isVerified } }
              : acc,
          ),
        );
        this.togglingSchoolId.set(null);
        this.showToast(
          updatedSchool.isVerified
            ? `${item.school.name} is now verified.`
            : `Verification revoked for ${item.school.name}.`,
        );
      },
      error: (err) => {
        this.togglingSchoolId.set(null);
        const msg = err?.error?.error?.message || 'Failed to update school verification status.';
        this.error.set(msg);
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
