import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { PasswordResetResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="forgot-title">
        <a class="brand" routerLink="/" aria-label="AutiCare home">AutiCare</a>
        <header>
          <h1 id="forgot-title">Reset your password</h1>
          <p>Enter your account email and we'll prepare a secure reset link.</p>
        </header>

        @if (result()) {
          <div class="success" role="status">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="m5 12 4.2 4.2L19 6.8"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.4"
              />
            </svg>
            <p>{{ result()?.message }}</p>
          </div>

          @if (result()?.resetUrl) {
            <a class="dev-link" [href]="result()?.resetUrl">Open development reset link</a>
          }
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label class="field">
              <span>Email Address</span>
              <input
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="leo.parent@example.com"
                [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
              />
            </label>
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <p class="field-error">Enter a valid email address.</p>
            }

            @if (error()) {
              <p class="form-error" role="alert">{{ error() }}</p>
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
        background:
          linear-gradient(115deg, rgb(231 238 223 / 0.52), transparent 36%),
          linear-gradient(245deg, rgb(232 246 255 / 0.65), transparent 34%),
          #faf8f2;
        color: #001e2b;
      }

      .auth-page {
        min-height: 100svh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
      }

      .auth-card {
        width: min(100%, 520px);
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 18px 60px rgb(41 74 90 / 0.1);
        padding: 72px 64px 52px;
        display: grid;
        gap: 42px;
      }

      .brand {
        color: #315d72;
        text-align: center;
        font-size: 42px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 0;
        text-decoration: none;
      }

      header {
        text-align: center;
        display: grid;
        gap: 14px;
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        font-size: 31px;
        line-height: 1.25;
        font-weight: 800;
        letter-spacing: 0;
      }

      header p {
        color: #41484b;
        font-size: 17px;
        line-height: 1.55;
      }

      form {
        display: grid;
        gap: 24px;
      }

      .field {
        display: grid;
        gap: 10px;
        font-size: 16px;
        font-weight: 700;
      }

      input {
        width: 100%;
        height: 64px;
        border: 1px solid #b8c2c8;
        border-radius: 14px;
        background: #f2f9ff;
        color: #001e2b;
        font: inherit;
        font-weight: 400;
        padding: 0 24px;
      }

      input:focus {
        border-color: #3d6375;
        background: #ffffff;
        box-shadow: 0 0 0 4px rgb(61 99 117 / 0.12);
        outline: none;
      }

      input[aria-invalid='true'] {
        border-color: #ba1a1a;
      }

      .submit-button,
      .dev-link {
        min-height: 64px;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        text-decoration: none;
        font-size: 18px;
        font-weight: 800;
      }

      .submit-button {
        border: 0;
        background: #8db4c8;
        color: #123f52;
        cursor: pointer;
        box-shadow: 0 14px 28px rgb(61 99 117 / 0.12);
      }

      .submit-button svg {
        width: 24px;
        height: 24px;
      }

      .submit-button:hover:not(:disabled),
      .dev-link:hover {
        background: #3d6375;
        color: #ffffff;
      }

      .submit-button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .success {
        border-radius: 16px;
        background: #e7eedf;
        color: #244b2d;
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr);
        align-items: start;
        gap: 14px;
        padding: 18px;
        line-height: 1.5;
      }

      .success svg {
        width: 26px;
        height: 26px;
      }

      .dev-link {
        border: 1px solid #3d6375;
        color: #164f68;
      }

      .field-error,
      .form-error {
        color: #ba1a1a;
        font-size: 14px;
        line-height: 1.4;
        margin-top: -14px;
      }

      .form-error {
        margin-top: 0;
        border-radius: 12px;
        background: #ffdad6;
        color: #93000a;
        padding: 14px 16px;
      }

      footer {
        border-top: 1px solid #c1c7cc;
        padding-top: 32px;
        text-align: center;
      }

      footer a {
        color: #164f68;
        font-weight: 800;
        text-decoration: none;
      }

      footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 560px) {
        .auth-page {
          padding: 20px;
        }

        .auth-card {
          padding: 48px 28px 38px;
        }

        .brand {
          font-size: 38px;
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

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
