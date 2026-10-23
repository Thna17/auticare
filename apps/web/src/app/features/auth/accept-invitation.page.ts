import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { VerifyInvitationResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';

export const matchingPasswords = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
};

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiMessageComponent,
    UiFieldComponent,
    UiSpinnerComponent,
    UiBadgeComponent,
    AccessibleFormDirective,
  ],
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="invitation-title">
        <a class="brand" routerLink="/" aria-label="AutiCare home">
          <img src="/images/auticare-logo.jpg" alt="" aria-hidden="true" width="36" height="34" />
          <span>AutiCare</span>
        </a>

        @if (verifying()) {
          <div class="verifying-box">
            <ac-ui-spinner label="Verifying your invitation link…" />
          </div>
        } @else if (verificationError()) {
          <div class="error-state-card" role="alert">
            <div class="error-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
                <path
                  d="M12 8v5M12 16h.01"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <header>
              <h1 id="invitation-title">Invitation Invalid</h1>
              <p>{{ verificationError() }}</p>
            </header>
            <ac-ui-message tone="error">{{ verificationError() }}</ac-ui-message>
            <div class="actions">
              <a class="primary-link" routerLink="/login">Return to log in</a>
            </div>
          </div>
        } @else if (success()) {
          <div class="success-card" role="status">
            <div class="success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  d="m5 12 4.2 4.2L19 6.8"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.6"
                />
              </svg>
            </div>
            <h2>Account Activated</h2>
            <p class="success-message">{{ success() }}</p>
            <p class="sub-message">
              Your password has been configured and your institutional account is now active.
            </p>
            <a class="primary-link" routerLink="/login">Continue to log in</a>
          </div>
        } @else {
          <!-- Institutional Header & Org Badge -->
          <header class="invite-header">
            @if (invitationDetails(); as details) {
              <div class="badges-row">
                @if (details.organizationName) {
                  <span class="org-badge">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h2M13 9h2M9 13h2M13 13h2M9 17h2M13 17h2"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                      />
                    </svg>
                    <span>{{ details.organizationName }}</span>
                  </span>
                }
                <ac-ui-badge tone="neutral">{{ formatRole(details.role) }}</ac-ui-badge>
              </div>

              <h1 id="invitation-title">Set up your password</h1>
              <p class="invite-description">
                Welcome <strong>{{ details.firstName }} {{ details.lastName }}</strong
                >!
                @if (details.organizationName) {
                  <span> ({{ details.organizationName }})</span>
                }
                Choose a secure password for <strong>{{ details.email }}</strong> to activate your
                access.
              </p>
            } @else {
              <h1 id="invitation-title">Set up your password</h1>
              <p class="invite-description">
                Set a secure password to activate your AutiCare account.
              </p>
            }
          </header>

          <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
            @if (!tokenFromUrl()) {
              <ac-ui-field
                label="Invitation token"
                hint="Paste the invitation token from your email."
                [required]="true"
                [error]="
                  form.controls.token.touched && form.controls.token.invalid
                    ? 'Enter the invitation token.'
                    : null
                "
              >
                <input
                  type="text"
                  formControlName="token"
                  placeholder="Paste your invitation token"
                />
              </ac-ui-field>
            }

            <ac-ui-field
              label="New password"
              hint="Use at least 12 characters."
              [required]="true"
              [error]="
                form.controls.password.touched && form.controls.password.invalid
                  ? 'Use at least 12 characters.'
                  : null
              "
            >
              <div class="password-field">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="new-password"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  class="visibility-button"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  (click)="togglePasswordVisibility()"
                >
                  @if (showPassword()) {
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M3.5 3.5 20.5 20.5M10.6 10.6a2 2 0 0 0 2.8 2.8M8.7 5.3A9.8 9.8 0 0 1 12 4.7c5.2 0 8.6 4.4 9.8 6.3.3.6.3 1.3 0 1.9a17 17 0 0 1-2.7 3.2M6.4 6.7A17 17 0 0 0 2.2 11c-.3.6-.3 1.3 0 1.9 1.2 1.9 4.6 6.3 9.8 6.3 1.6 0 3-.4 4.3-1"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      />
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M2.2 11c-.3.6-.3 1.3 0 1.9 1.2 1.9 4.6 6.3 9.8 6.3s8.6-4.4 9.8-6.3c.3-.6.3-1.3 0-1.9-1.2-1.9-4.6-6.3-9.8-6.3S3.4 9.1 2.2 11c-.3.6-.3 1.3 0 1.9Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-linejoin="round"
                        stroke-width="2"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                  }
                </button>
              </div>
            </ac-ui-field>

            <ac-ui-field
              label="Confirm password"
              [required]="true"
              [error]="
                form.controls.confirmPassword.touched &&
                (form.controls.confirmPassword.invalid || form.hasError('passwordMismatch'))
                  ? form.hasError('passwordMismatch')
                    ? 'Passwords must match.'
                    : 'Confirm your password.'
                  : null
              "
            >
              <div class="password-field">
                <input
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  class="visibility-button"
                  [attr.aria-label]="
                    showConfirmPassword() ? 'Hide confirm password' : 'Show confirm password'
                  "
                  (click)="toggleConfirmPasswordVisibility()"
                >
                  @if (showConfirmPassword()) {
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M3.5 3.5 20.5 20.5M10.6 10.6a2 2 0 0 0 2.8 2.8M8.7 5.3A9.8 9.8 0 0 1 12 4.7c5.2 0 8.6 4.4 9.8 6.3.3.6.3 1.3 0 1.9a17 17 0 0 1-2.7 3.2M6.4 6.7A17 17 0 0 0 2.2 11c-.3.6-.3 1.3 0 1.9 1.2 1.9 4.6 6.3 9.8 6.3 1.6 0 3-.4 4.3-1"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      />
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M2.2 11c-.3.6-.3 1.3 0 1.9 1.2 1.9 4.6 6.3 9.8 6.3s8.6-4.4 9.8-6.3c.3-.6.3-1.3 0-1.9-1.2-1.9-4.6-6.3-9.8-6.3S3.4 9.1 2.2 11c-.3.6-.3 1.3 0 1.9Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-linejoin="round"
                        stroke-width="2"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                  }
                </button>
              </div>
            </ac-ui-field>

            <div class="password-note">
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M10 9v4.5M10 6.5h.01"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <p>Passwords must be at least 12 characters and include a mixture of characters.</p>
            </div>

            @if (error()) {
              <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
            }

            <button type="submit" class="submit-btn" [disabled]="submitting()">
              <span>{{ submitting() ? 'Saving password…' : 'Activate account' }}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M5 12h13M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.4"
                />
              </svg>
            </button>
          </form>
        }
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100svh;
        background: var(--ac-color-background);
        color: var(--ac-color-text-strong);
      }

      .auth-page {
        min-height: 100svh;
        display: grid;
        place-items: center;
        padding: 32px 20px;
      }

      .auth-card {
        width: 100%;
        max-width: 520px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 24px;
        padding: 44px 38px 40px;
        box-shadow: 0 16px 40px -12px rgb(16 35 48 / 0.12);
        display: grid;
        gap: 26px;
      }

      .brand {
        color: var(--ac-color-action-mid);
        justify-self: center;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: var(--ac-type-page-title);
        line-height: 1;
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }

      .brand img {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        object-fit: cover;
        box-shadow: 0 0 0 1px var(--ac-color-sky-light);
      }

      .invite-header {
        text-align: center;
        display: grid;
        gap: 12px;
      }

      .badges-row {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 4px;
      }

      .org-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .org-badge svg {
        width: 16px;
        height: 16px;
      }

      h1 {
        margin: 0;
        font-size: 26px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .invite-description {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: 14px;
        line-height: 1.5;
      }

      form {
        display: grid;
        gap: 20px;
      }

      input[type='text'],
      input[type='password'] {
        width: 100%;
        height: 56px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 12px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 16px;
        padding: 0 18px;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease;
      }

      input[type='text']:focus,
      input[type='password']:focus {
        border-color: var(--ac-color-action);
        outline: none;
        box-shadow: 0 0 0 4px var(--ac-color-tint-blue);
      }

      .password-field {
        position: relative;
      }

      .password-field input {
        padding-right: 52px;
      }

      .visibility-button {
        position: absolute;
        top: 50%;
        right: 8px;
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--ac-color-slate-text-subtle);
        display: grid;
        place-items: center;
        cursor: pointer;
        transform: translateY(-50%);
        transition:
          background 160ms ease,
          color 160ms ease;
      }

      .visibility-button:hover {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
      }

      .visibility-button svg {
        width: 20px;
        height: 20px;
      }

      .password-note {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 10px;
        background: var(--ac-color-blue-tint-wash);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: 1.45;
      }

      .password-note svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-top: 1px;
        color: var(--ac-color-action);
      }

      .password-note p {
        margin: 0;
      }

      .submit-btn,
      .primary-link {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        height: 54px;
        border: none;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font: inherit;
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        text-decoration: none;
        padding: 0 24px;
        box-shadow: 0 8px 20px rgb(41 74 90 / 0.16);
        transition:
          background 160ms ease,
          box-shadow 160ms ease;
      }

      .submit-btn svg {
        width: 18px;
        height: 18px;
      }

      .submit-btn:hover:not(:disabled),
      .primary-link:hover {
        background: var(--ac-color-action-alt);
        box-shadow: 0 10px 24px rgb(41 74 90 / 0.22);
      }

      .submit-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      /* Error card */
      .error-state-card {
        border-radius: 16px;
        background: var(--ac-color-alert-surface);
        border: 1px solid var(--ac-color-alert-strong);
        padding: 28px 24px;
        text-align: center;
        display: grid;
        justify-items: center;
        gap: 14px;
      }

      .error-icon {
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
      }

      .error-icon svg {
        width: 28px;
        height: 28px;
      }

      /* Success card */
      .success-card {
        border-radius: 16px;
        background: var(--ac-color-sage-light);
        border: 1px solid var(--ac-color-green-border-soft);
        padding: 28px 24px;
        text-align: center;
        display: grid;
        justify-items: center;
        gap: 14px;
      }

      .success-icon {
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: var(--ac-color-green-600);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
      }

      .success-icon svg {
        width: 28px;
        height: 28px;
      }

      .success-card h2 {
        margin: 0;
        font-size: 20px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-olive-darkest);
      }

      .success-message {
        margin: 0;
        color: var(--ac-color-olive-darkest);
        font-size: 15px;
        line-height: 1.5;
      }

      .sub-message {
        margin: 0;
        font-size: 13px;
        color: var(--ac-color-text-muted);
        line-height: 1.45;
      }

      .verifying-box {
        display: grid;
        place-items: center;
        padding: 40px 0;
      }

      .actions {
        display: grid;
        width: 100%;
      }

      @media (max-width: 560px) {
        .auth-card {
          padding: 32px 20px 24px;
        }

        h1 {
          font-size: 22px;
        }
      }

      @media (max-width: 480px) {
        .auth-page {
          padding: 16px 12px;
        }

        .auth-card {
          padding: 24px 16px 20px;
          border-radius: 18px;
          gap: 20px;
        }

        h1 {
          font-size: 20px;
        }

        .invite-description {
          font-size: 13px;
        }

        input[type='text'],
        input[type='password'] {
          height: 52px;
          padding: 0 16px;
        }

        .password-field input {
          padding-right: 50px;
        }

        .password-note {
          padding: 10px 12px;
          font-size: 12px;
        }

        .submit-btn,
        .primary-link {
          height: 50px;
          font-size: 15px;
        }

        .success-card,
        .error-state-card {
          padding: 20px 16px;
          gap: 12px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptInvitationPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly verifying = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly verificationError = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly tokenFromUrl = signal(Boolean(this.route.snapshot.queryParamMap.get('token')));
  readonly invitationDetails = signal<VerifyInvitationResponse | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
      password: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchingPasswords },
  );

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verifying.set(true);
      this.auth.verifyInvitation(token).subscribe({
        next: (details) => {
          this.invitationDetails.set(details);
          this.verifying.set(false);
        },
        error: (err) => {
          const msg =
            err?.error?.error?.message || 'This invitation link is invalid or has expired.';
          this.verificationError.set(msg);
          this.verifying.set(false);
        },
      });
    }
  }

  formatRole(role?: string): string {
    if (!role) return 'Institutional Staff';
    if (role === 'SCHOOL') return 'School Staff';
    if (role === 'HOSPITAL') return 'Hospital Coordinator';
    if (role === 'ADMIN') return 'Administrator';
    return role;
  }

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fix the highlighted fields before activating your account.');
      return;
    }

    const { token, password } = this.form.getRawValue();
    this.submitting.set(true);

    this.auth.acceptInvitation({ token, password }).subscribe({
      next: (response) => {
        this.success.set(response.message);
        this.submitting.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.error?.message ||
          'Failed to set password. The invitation may be invalid, expired, or already accepted.';
        this.error.set(msg);
        this.submitting.set(false);
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((visible) => !visible);
  }
}
