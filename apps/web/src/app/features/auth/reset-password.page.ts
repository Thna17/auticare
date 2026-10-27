import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
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
    AccessibleFormDirective,
  ],
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="reset-title">
        <a class="brand" routerLink="/" aria-label="AutiCare home">
          <img src="/images/auticare-logo.png" alt="" aria-hidden="true" width="36" height="36" />
          <span>AutiCare</span>
        </a>

        <header>
          <h1 id="reset-title">Create a new password</h1>
          <p>Choose a strong, secure password to restore access to your family space.</p>
        </header>

        <!-- Recovery Step Instructions -->
        <div class="steps-progress" aria-label="Password recovery steps">
          <div class="step-item">
            <span class="step-num">✓</span>
            <span class="step-label">Requested</span>
          </div>
          <div class="step-divider" aria-hidden="true"></div>
          <div class="step-item active">
            <span class="step-num">2</span>
            <span class="step-label">Set Password</span>
          </div>
          <div class="step-divider" aria-hidden="true"></div>
          <div class="step-item" [class.active]="success() !== null">
            <span class="step-num">3</span>
            <span class="step-label">Complete</span>
          </div>
        </div>

        @if (success()) {
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
            <h2>Password Reset Successful</h2>
            <p class="success-message">{{ success() }}</p>
            <p class="next-step-note">
              Your password has been updated securely. You can now sign in with your new
              credentials.
            </p>
            <a class="primary-link" routerLink="/login">Continue to log in</a>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
            @if (!tokenFromUrl()) {
              <ac-ui-field
                label="Reset token"
                hint="Paste the verification token provided in your reset email."
                [required]="true"
                [error]="
                  form.controls.token.touched && form.controls.token.invalid
                    ? 'Enter the reset token from your email.'
                    : null
                "
              >
                <input
                  type="text"
                  formControlName="token"
                  autocomplete="one-time-code"
                  placeholder="Paste your reset token"
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

            <div class="password-requirements">
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

            <button class="submit-button" type="submit" [disabled]="loading()">
              <span>{{ loading() ? 'Resetting password...' : 'Reset password' }}</span>
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

        <footer>
          <a routerLink="/forgot-password">Request a new reset link</a>
        </footer>
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
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 20px;
      }

      .auth-card {
        width: min(100%, 540px);
        border-radius: 24px;
        background: var(--ac-color-surface);
        box-shadow: 0 18px 60px color-mix(in srgb, var(--ac-brand-800) 10%, transparent);
        border: 1px solid var(--ac-color-border-slate);
        padding: 48px 40px 36px;
        display: grid;
        gap: 28px;
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

      header {
        text-align: center;
        display: grid;
        gap: 8px;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        font-size: 28px;
        line-height: 1.25;
        font-weight: var(--ac-font-weight-bold);
      }

      header p {
        color: var(--ac-color-text-body);
        font-size: 15px;
        line-height: 1.5;
      }

      /* Step progress indicators */
      .steps-progress {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-radius: 12px;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
      }

      .step-item {
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0.6;
      }

      .step-item.active {
        opacity: 1;
      }

      .step-num {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
      }

      .step-label {
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .step-divider {
        flex: 1;
        height: 1px;
        background: var(--ac-color-border-grey);
        margin: 0 8px;
      }

      form {
        display: grid;
        gap: 20px;
      }

      input {
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

      input:focus {
        border-color: var(--ac-color-action);
        box-shadow: 0 0 0 4px var(--ac-color-tint-blue);
        outline: none;
      }

      input[aria-invalid='true'] {
        border-color: var(--ac-color-red-600);
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

      .password-requirements {
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

      .password-requirements svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-top: 1px;
        color: var(--ac-color-action);
      }

      .submit-button {
        height: 56px;
        border-radius: 12px;
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
        box-shadow: 0 8px 20px color-mix(in srgb, var(--ac-brand-800) 16%, transparent);
        transition:
          background 160ms ease,
          box-shadow 160ms ease;
      }

      .submit-button svg {
        width: 20px;
        height: 20px;
      }

      .submit-button:hover:not(:disabled) {
        background: var(--ac-color-action-alt);
        box-shadow: 0 10px 24px color-mix(in srgb, var(--ac-brand-800) 22%, transparent);
      }

      .submit-button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      /* Success Feedback Card */
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
        font-size: 20px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-olive-darkest);
      }

      .success-message {
        color: var(--ac-color-olive-darkest);
        font-size: 15px;
        line-height: 1.5;
      }

      .next-step-note {
        font-size: 13px;
        line-height: 1.45;
        color: var(--ac-color-text-muted);
      }

      .primary-link {
        height: 48px;
        width: 100%;
        border-radius: 10px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--ac-font-weight-semibold);
        font-size: 15px;
        text-decoration: none;
        transition: background 160ms ease;
        margin-top: 6px;
      }

      .primary-link:hover {
        background: var(--ac-color-action-alt);
      }

      footer {
        border-top: 1px solid var(--ac-color-border-slate);
        padding-top: 20px;
        text-align: center;
      }

      footer a {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        font-size: 14px;
      }

      footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 560px) {
        .auth-card {
          padding: 32px 20px 24px;
        }

        h1 {
          font-size: 24px;
        }

        .step-label {
          display: none;
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
          font-size: 22px;
        }

        header p {
          font-size: 14px;
        }

        .steps-progress {
          padding: 10px 12px;
        }

        input {
          height: 52px;
          padding: 0 16px;
        }

        .password-field input {
          padding-right: 50px;
        }

        .submit-button {
          height: 52px;
          font-size: 15px;
        }

        .password-requirements {
          padding: 10px 12px;
          font-size: 12px;
        }

        .success-card {
          padding: 20px 16px;
          gap: 12px;
        }

        footer {
          padding-top: 16px;
        }

        footer a {
          display: inline-block;
          padding: 6px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly tokenFromUrl = signal(Boolean(this.route.snapshot.queryParamMap.get('token')));

  readonly form = this.fb.nonNullable.group(
    {
      token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
      password: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchingPasswords },
  );

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((v) => !v);
  }

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fix the highlighted fields before resetting your password.');
      return;
    }

    const { token, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.resetPassword({ token, password }).subscribe({
      next: (response) => {
        this.success.set(response.message);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This reset link is invalid or expired. Request a new link and try again.');
        this.loading.set(false);
      },
    });
  }
}
