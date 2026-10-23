import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { PasswordResetResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';

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
      <section class="auth-card" aria-labelledby="forgot-title">
        <a class="brand" routerLink="/" aria-label="AutiCare home">
          <img src="/images/auticare-logo.jpg" alt="" aria-hidden="true" width="36" height="34" />
          <span>AutiCare</span>
        </a>

        <header>
          <h1 id="forgot-title">Reset your password</h1>
          <p>We'll email you a secure link to reset your account password and restore access.</p>
        </header>

        <!-- Recovery Step Instructions -->
        <div class="steps-progress" aria-label="Password recovery steps">
          <div class="step-item active">
            <span class="step-num">1</span>
            <span class="step-label">Enter Email</span>
          </div>
          <div class="step-divider" aria-hidden="true"></div>
          <div class="step-item" [class.active]="result() !== null">
            <span class="step-num">2</span>
            <span class="step-label">Check Inbox</span>
          </div>
          <div class="step-divider" aria-hidden="true"></div>
          <div class="step-item">
            <span class="step-num">3</span>
            <span class="step-label">New Password</span>
          </div>
        </div>

        @if (result()) {
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
            <h2>Check Your Email</h2>
            <p class="success-message">{{ result()?.message }}</p>
            <p class="expiry-note">
              The reset link will remain valid for 1 hour. If you don't see it in a few minutes, be
              sure to check your spam or junk folder.
            </p>

            @if (result()?.resetUrl) {
              <a class="dev-link" [href]="result()?.resetUrl">Open development reset link</a>
            }

            <div class="success-actions">
              <a routerLink="/login" class="back-login-btn">Return to log in</a>
              <button type="button" class="resend-btn" (click)="resetForm()">
                Try another email
              </button>
            </div>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
            <ac-ui-field
              label="Email address"
              hint="Enter the email associated with your AutiCare account."
              [required]="true"
              [error]="
                form.controls.email.touched && form.controls.email.invalid
                  ? 'Enter a valid email address.'
                  : null
              "
            >
              <input
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="leo.parent@example.com"
              />
            </ac-ui-field>

            <div class="security-tip">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
              <p>
                For your family's safety, reset links are cryptographically signed and expire in 60
                minutes.
              </p>
            </div>

            @if (error()) {
              <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
            }

            <button class="submit-button" type="submit" [disabled]="loading()">
              <span>{{ loading() ? 'Preparing link...' : 'Send reset link' }}</span>
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
          <a routerLink="/login">Back to log in</a>
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
        box-shadow: 0 18px 60px rgb(41 74 90 / 0.1);
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
        color: var(--ac-color-text-strong);
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
        opacity: 0.55;
        transition: opacity 160ms ease;
      }

      .step-item.active {
        opacity: 1;
      }

      .step-num {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: var(--ac-color-border-grey);
        color: var(--ac-color-text-strong);
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
      }

      .step-item.active .step-num {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
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

      .security-tip {
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

      .security-tip svg {
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
        box-shadow: 0 8px 20px rgb(41 74 90 / 0.16);
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
        box-shadow: 0 10px 24px rgb(41 74 90 / 0.22);
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

      .expiry-note {
        font-size: 13px;
        line-height: 1.45;
        color: var(--ac-color-text-muted);
      }

      .dev-link {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px dashed var(--ac-color-action);
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        word-break: break-all;
        max-width: 100%;
        box-sizing: border-box;
      }

      .dev-link:hover {
        background: var(--ac-color-surface-info);
      }

      .success-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        margin-top: 8px;
      }

      .back-login-btn {
        height: 48px;
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
      }

      .back-login-btn:hover {
        background: var(--ac-color-action-alt);
      }

      .resend-btn {
        border: 0;
        background: transparent;
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        text-decoration: underline;
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

        .submit-button {
          height: 52px;
          font-size: 15px;
        }

        .security-tip {
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
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<PasswordResetResponse | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm() {
    this.result.set(null);
    this.error.set(null);
    this.form.reset();
  }

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fix the highlighted field before requesting a reset link.');
      return;
    }

    this.loading.set(true);
    this.auth.requestPasswordReset(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.result.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not prepare a reset link. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
