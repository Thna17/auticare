import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="login-page">
      <section class="login-card" aria-labelledby="login-title">
        <header class="login-header">
          <a class="brand" routerLink="/" aria-label="AutiCare home">AutiCare</a>
          <h1 id="login-title">Welcome back</h1>
          <p>Let's continue supporting your child.</p>
        </header>

        <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
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

          <div class="password-label-row">
            <label for="login-password">Password</label>
            <a routerLink="/forgot-password">Forgot password?</a>
          </div>
          <div class="password-field">
            <input
              id="login-password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              placeholder="••••••••"
              [attr.aria-invalid]="form.controls.password.touched && form.controls.password.invalid"
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
                    d="M2.2 11c-.3.6-.3 1.3 0 1.9 1.2 1.9 4.6 6.3 9.8 6.3s8.6-4.4 9.8-6.3c.3-.6.3-1.3 0-1.9-1.2-1.9-4.6-6.3-9.8-6.3S3.4 9.1 2.2 11Z"
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
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="field-error">Enter your password.</p>
          }

          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }

          <button class="submit-button" type="submit" [disabled]="loading()">
            <span>{{ loading() ? 'Logging in...' : 'Log in' }}</span>
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

        <div class="divider" aria-hidden="true">
          <span></span>
          <strong>OR</strong>
          <span></span>
        </div>

        <p class="create-account">
          New to AutiCare?
          <a routerLink="/register">Create account</a>
        </p>

        <div class="trust-note">
          <span class="trust-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M12 21s7-3.2 7-10.1V5.8L12 3 5 5.8v5.1C5 17.8 12 21 12 21Z"
                fill="none"
                stroke="currentColor"
                stroke-linejoin="round"
                stroke-width="2"
              />
              <path
                d="m9.2 12 1.8 1.8 3.8-4"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </span>
          <span>Secure, HIPAA-compliant support.</span>
        </div>
      </section>
    </main>

    <footer class="login-footer">
      <p>(c) 2024 AutiCare. All rights reserved.</p>
      <nav aria-label="Login footer links">
        <a routerLink="/privacy">Privacy Policy</a>
        <a routerLink="/support">Support</a>
      </nav>
    </footer>
  `,
  styles: [
    `
      :host {
        display: grid;
        min-height: 100svh;
        grid-template-rows: 1fr auto;
        background:
          linear-gradient(135deg, rgb(250 248 242 / 1) 0%, rgb(250 248 242 / 1) 48%),
          linear-gradient(45deg, rgb(231 238 223 / 0.7), rgb(232 246 255 / 0.75));
        color: #001e2b;
      }

      :host::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(115deg, rgb(231 238 223 / 0.52), transparent 36%),
          linear-gradient(245deg, rgb(232 246 255 / 0.65), transparent 34%);
      }

      .login-page {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
      }

      .login-card {
        width: min(100%, 600px);
        min-height: 860px;
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 18px 60px rgb(41 74 90 / 0.1);
        padding: 104px 96px 76px;
      }

      .login-header {
        display: grid;
        justify-items: center;
        text-align: center;
        margin-bottom: 66px;
      }

      .brand {
        color: #315d72;
        font-size: 44px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 0;
        text-decoration: none;
        margin-bottom: 48px;
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        color: #001e2b;
        font-size: 32px;
        line-height: 1.25;
        font-weight: 700;
        letter-spacing: 0;
        margin-bottom: 14px;
      }

      .login-header p {
        color: #273a43;
        font-size: 18px;
        line-height: 1.5;
      }

      .login-form {
        display: grid;
        gap: 24px;
      }

      .field {
        display: grid;
        gap: 10px;
      }

      .field span,
      .password-label-row label,
      .password-label-row a {
        color: #001e2b;
        font-size: 16px;
        line-height: 1.2;
        font-weight: 600;
        letter-spacing: 0;
      }

      .password-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: -14px;
      }

      .password-label-row a {
        color: #164f68;
        text-decoration: none;
      }

      .password-label-row a:hover {
        text-decoration: underline;
      }

      input {
        width: 100%;
        height: 70px;
        min-width: 0;
        border: 1px solid #b8c2c8;
        border-radius: 14px;
        background: #f2f9ff;
        color: #001e2b;
        font: inherit;
        font-size: 18px;
        line-height: 1.3;
        padding: 0 30px;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease,
          background 160ms ease;
      }

      input::placeholder {
        color: #707b84;
        opacity: 1;
      }

      input:hover {
        border-color: #8da0aa;
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

      .password-field {
        position: relative;
      }

      .password-field input {
        padding-right: 76px;
      }

      .visibility-button {
        position: absolute;
        top: 50%;
        right: 20px;
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #6a747b;
        display: grid;
        place-items: center;
        cursor: pointer;
        transition:
          background 160ms ease,
          color 160ms ease;
        transform: translateY(-50%);
      }

      .visibility-button:hover {
        background: #e8f6ff;
        color: #164f68;
      }

      .visibility-button svg {
        width: 26px;
        height: 26px;
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

      .submit-button {
        width: 100%;
        height: 70px;
        border: 1px solid rgb(193 199 204 / 0.36);
        border-radius: 14px;
        background: #ffffff;
        color: #001e2b;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        font-size: 20px;
        font-weight: 600;
        line-height: 1;
        box-shadow: 0 10px 28px rgb(41 74 90 / 0.06);
        transition:
          background 160ms ease,
          border-color 160ms ease,
          color 160ms ease,
          transform 160ms ease,
          box-shadow 160ms ease;
        margin-top: 18px;
      }

      .submit-button svg {
        width: 24px;
        height: 24px;
      }

      .submit-button:hover:not(:disabled) {
        border-color: #8db4c8;
        background: #e8f6ff;
        color: #164f68;
        box-shadow: 0 14px 34px rgb(41 74 90 / 0.12);
      }

      .submit-button:active:not(:disabled) {
        transform: translateY(1px);
      }

      .submit-button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .divider {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 30px;
        margin: 64px 0;
      }

      .divider span {
        height: 1px;
        background: #c1c7cc;
      }

      .divider strong {
        color: #68737a;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 5px;
      }

      .create-account {
        color: #273a43;
        text-align: center;
        font-size: 18px;
        line-height: 1.5;
      }

      .create-account a {
        color: #164f68;
        font-weight: 800;
        text-decoration: none;
        margin-left: 6px;
      }

      .create-account a:hover {
        text-decoration: underline;
      }

      .trust-note {
        margin-top: 104px;
        padding-top: 58px;
        border-top: 1px solid #c1c7cc;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 18px;
        color: #41484b;
        font-size: 14px;
        line-height: 1.4;
      }

      .trust-icon {
        width: 42px;
        height: 42px;
        flex: 0 0 auto;
        border-radius: 999px;
        background: #d7e9c0;
        color: #5a6949;
        display: grid;
        place-items: center;
      }

      .trust-icon svg {
        width: 22px;
        height: 22px;
      }

      .login-footer {
        position: relative;
        z-index: 1;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 34px;
        padding: 18px 24px 30px;
        color: rgb(65 72 75 / 0.66);
        font-size: 14px;
        line-height: 1.4;
      }

      .login-footer nav {
        display: inline-flex;
        gap: 34px;
      }

      .login-footer a {
        color: inherit;
        text-decoration: none;
      }

      .login-footer a:hover {
        color: #164f68;
        text-decoration: underline;
      }

      @media (max-width: 720px) {
        .login-page {
          align-items: stretch;
          padding: 20px;
        }

        .login-card {
          min-height: auto;
          padding: 52px 28px 42px;
        }

        .brand {
          font-size: 38px;
          margin-bottom: 38px;
        }

        .login-header {
          margin-bottom: 46px;
        }

        h1 {
          font-size: 30px;
        }

        .login-header p,
        .create-account {
          font-size: 16px;
        }

        input,
        .submit-button {
          height: 62px;
        }

        input {
          padding-left: 22px;
          padding-right: 22px;
          font-size: 16px;
        }

        .password-field input {
          padding-right: 70px;
        }

        .password-label-row {
          align-items: flex-start;
        }

        .divider {
          margin: 46px 0;
          gap: 20px;
        }

        .trust-note {
          margin-top: 66px;
          padding-top: 38px;
          text-align: left;
        }

        .login-footer {
          flex-direction: column;
          gap: 12px;
          padding-bottom: 24px;
          text-align: center;
        }

        .login-footer nav {
          gap: 24px;
        }
      }

      @media (max-width: 380px) {
        .login-card {
          padding-left: 22px;
          padding-right: 22px;
        }

        .password-label-row {
          flex-direction: column;
          gap: 8px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: () => {
        this.error.set('Log in failed. Check your email and password.');
        this.loading.set(false);
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }
}
