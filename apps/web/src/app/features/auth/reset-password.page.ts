import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

const matchingPasswords = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
};

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="reset-title">
        <a class="brand" routerLink="/" aria-label="AutiCare home">AutiCare</a>
        <header>
          <h1 id="reset-title">Create a new password</h1>
          <p>Use a strong password to keep your family support space protected.</p>
        </header>

        @if (success()) {
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
            <p>{{ success() }}</p>
          </div>
          <a class="primary-link" routerLink="/login">Continue to log in</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            @if (!tokenFromUrl()) {
              <label class="field">
                <span>Reset Token</span>
                <input
                  type="text"
                  formControlName="token"
                  autocomplete="one-time-code"
                  placeholder="Paste your reset token"
                  [attr.aria-invalid]="form.controls.token.touched && form.controls.token.invalid"
                />
              </label>
              @if (form.controls.token.touched && form.controls.token.invalid) {
                <p class="field-error">Enter the reset token from your email.</p>
              }
            }

            <label class="field">
              <span>New Password</span>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
                placeholder="••••••••••••"
                [attr.aria-invalid]="
                  form.controls.password.touched && form.controls.password.invalid
                "
              />
            </label>
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <p class="field-error">Use at least 12 characters.</p>
            }

            <label class="field">
              <span>Confirm Password</span>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                autocomplete="new-password"
                placeholder="••••••••••••"
                [attr.aria-invalid]="
                  form.controls.confirmPassword.touched &&
                  (form.controls.confirmPassword.invalid || form.hasError('passwordMismatch'))
                "
              />
            </label>
            @if (form.controls.confirmPassword.touched && form.hasError('passwordMismatch')) {
              <p class="field-error">Passwords must match.</p>
            }

            <button class="toggle-button" type="button" (click)="togglePasswordVisibility()">
              {{ showPassword() ? 'Hide password' : 'Show password' }}
            </button>

            @if (error()) {
              <p class="form-error" role="alert">{{ error() }}</p>
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
          <a routerLink="/forgot-password">Request a new link</a>
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
          linear-gradient(245deg, rgb(232 246 255 / 0.65), transparent 34%), #faf8f2;
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
        width: min(100%, 540px);
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 18px 60px rgb(41 74 90 / 0.1);
        padding: 66px 64px 50px;
        display: grid;
        gap: 34px;
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
        gap: 22px;
      }

      .field {
        display: grid;
        gap: 10px;
        font-size: 16px;
        font-weight: 700;
      }

      input {
        width: 100%;
        height: 62px;
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

      .toggle-button {
        justify-self: start;
        border: 0;
        background: transparent;
        color: #164f68;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        padding: 0;
      }

      .toggle-button:hover {
        text-decoration: underline;
      }

      .submit-button,
      .primary-link {
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
      .primary-link:hover {
        background: #3d6375;
        color: #ffffff;
      }

      .submit-button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .primary-link {
        background: #8db4c8;
        color: #123f52;
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

      .field-error,
      .form-error {
        color: #ba1a1a;
        font-size: 14px;
        line-height: 1.4;
        margin-top: -12px;
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
        padding-top: 28px;
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
export class ResetPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly tokenFromUrl = signal(Boolean(this.route.snapshot.queryParamMap.get('token')));
  readonly form = this.fb.nonNullable.group(
    {
      token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
      password: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchingPasswords },
  );

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
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

  togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }
}
