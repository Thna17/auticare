import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
    <main class="signup-page">
      <section class="form-panel" aria-labelledby="register-title">
        <div class="form-shell">
          <a class="brand" routerLink="/" aria-label="AutiCare home">
            <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
              <path
                d="M20 33c-8.1 0-14-5.9-14-14.2V8.6l7.2 4.1C17.5 15.2 20 19.4 20 24.4V33Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.6"
              />
              <path
                d="M20 33c8.1 0 14-5.9 14-14.2V8.6l-7.2 4.1C22.5 15.2 20 19.4 20 24.4V33Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.6"
              />
              <path
                d="M20 24.5c0-6.4-3.7-11.6-9.2-14.1M20 24.5c0-6.4 3.7-11.6 9.2-14.1"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2.2"
              />
            </svg>
            <span>AutiCare</span>
          </a>

          <header class="intro">
            <h1 id="register-title">Create your account</h1>
            <p>Join our supportive community and start your child's journey today.</p>
          </header>

          <form class="register-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label class="field">
              <span>Full Name</span>
              <input
                type="text"
                formControlName="fullName"
                autocomplete="name"
                placeholder="Leo Miller"
                [attr.aria-invalid]="
                  form.controls.fullName.touched && form.controls.fullName.invalid
                "
              />
            </label>
            @if (form.controls.fullName.touched && form.controls.fullName.invalid) {
              <p class="field-error">Enter your full name.</p>
            }

            <label class="field">
              <span>Email Address</span>
              <input
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="leo@example.com"
                [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
              />
            </label>
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <p class="field-error">Enter a valid email address.</p>
            }

            <div class="password-grid">
              <label class="field">
                <span>Password</span>
                <input
                  type="password"
                  formControlName="password"
                  autocomplete="new-password"
                  placeholder="••••••••••••"
                  aria-describedby="password-help"
                  [attr.aria-invalid]="
                    form.controls.password.touched && form.controls.password.invalid
                  "
                />
              </label>

              <label class="field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  placeholder="••••••••••••"
                  [attr.aria-invalid]="
                    form.controls.confirmPassword.touched &&
                    (form.controls.confirmPassword.invalid || form.hasError('passwordMismatch'))
                  "
                />
              </label>
            </div>
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <p class="field-error">Use at least 12 characters.</p>
            }
            @if (form.controls.confirmPassword.touched && form.hasError('passwordMismatch')) {
              <p class="field-error">Passwords must match.</p>
            }

            <div class="password-note" id="password-help">
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8" />
                <path
                  d="M10 9.1v4.5M10 6.4h.01"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
              </svg>
              <p>
                Password must be at least 12 characters long and include a mix of uppercase
                letters, numbers, and symbols.
              </p>
            </div>

            <label class="terms">
              <input type="checkbox" formControlName="terms" />
              <span>
                I agree to the <a routerLink="/terms">Terms of Service</a> and
                <a routerLink="/privacy">Privacy Policy</a>.
              </span>
            </label>
            @if (form.controls.terms.touched && form.controls.terms.invalid) {
              <p class="field-error">Accept the terms to continue.</p>
            }

            @if (error()) {
              <p class="form-error" role="alert">{{ error() }}</p>
            }

            <button class="submit-button" type="submit" [disabled]="loading()">
              <span>{{ loading() ? 'Creating account...' : 'Create account' }}</span>
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

          <footer class="signin-footer">
            <p>Already have an account?</p>
            <a routerLink="/login">Log in</a>
          </footer>
        </div>
      </section>

      <section class="hero-panel" aria-label="AutiCare family support">
        <img src="/images/signup-hero.png" alt="" />
        <div class="hero-wash" aria-hidden="true"></div>
        <aside class="support-card">
          <div class="heart-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M12 20s-7-4.4-9.1-8.3C.9 8 .7 4.8 3.2 3.2c2.2-1.4 5-.6 6.4 1.5L12 8l2.4-3.3c1.5-2.1 4.2-2.9 6.4-1.5 2.5 1.6 2.3 4.8.3 8.5C19 15.6 12 20 12 20Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </div>
          <h2>You're not alone.</h2>
          <p>
            Join 5,000+ families who use AutiCare to track progress, access expert support, and
            nurture their child's unique potential every day.
          </p>
          <div class="dots" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </aside>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100svh;
        background: #f4faff;
        color: #001e2b;
      }

      .signup-page {
        min-height: 100svh;
        display: grid;
        background: #ffffff;
      }

      .form-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        padding: 48px 24px;
        background: #ffffff;
      }

      .form-shell {
        width: min(100%, 560px);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 58px;
        color: #315d72;
        text-decoration: none;
      }

      .brand svg {
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
      }

      .brand span {
        font-size: 40px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 0;
      }

      .intro {
        margin-bottom: 64px;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      .intro h1 {
        color: #001e2b;
        font-size: 32px;
        line-height: 1.25;
        font-weight: 700;
        letter-spacing: 0;
        margin-bottom: 16px;
      }

      .intro p {
        max-width: 510px;
        color: #273a43;
        font-size: 18px;
        line-height: 1.55;
      }

      .register-form {
        display: grid;
        gap: 24px;
      }

      .field {
        display: grid;
        gap: 12px;
        color: #001e2b;
        font-size: 16px;
        font-weight: 700;
      }

      .field input {
        width: 100%;
        min-width: 0;
        height: 60px;
        border: 1px solid #b8c2c8;
        border-radius: 12px;
        background: #ffffff;
        color: #001e2b;
        font: inherit;
        font-weight: 400;
        line-height: 1.3;
        padding: 0 22px;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease,
          background 160ms ease;
      }

      .field input::placeholder {
        color: #6a7486;
        opacity: 1;
      }

      .field input:hover {
        border-color: #8da0aa;
      }

      .field input:focus {
        border-color: #3d6375;
        box-shadow: 0 0 0 4px rgb(141 180 200 / 0.25);
        outline: none;
      }

      .field input[aria-invalid='true'] {
        border-color: #ba1a1a;
      }

      .password-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 20px;
      }

      .password-note {
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr);
        align-items: start;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        background: #e2f3ff;
        color: #163f52;
      }

      .password-note svg {
        width: 18px;
        height: 18px;
        margin-top: 1px;
      }

      .password-note p {
        font-size: 14px;
        line-height: 1.45;
      }

      .terms {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr);
        gap: 14px;
        align-items: start;
        color: #41484b;
        font-size: 16px;
        line-height: 1.5;
      }

      .terms input {
        appearance: none;
        width: 30px;
        height: 30px;
        margin: 0;
        border: 1px solid #b8c2c8;
        border-radius: 10px;
        background: #ffffff;
        cursor: pointer;
        display: grid;
        place-items: center;
        transition:
          border-color 160ms ease,
          background 160ms ease,
          box-shadow 160ms ease;
      }

      .terms input::after {
        content: '';
        width: 13px;
        height: 7px;
        border-left: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        transform: rotate(-45deg) scale(0);
        transform-origin: center;
        transition: transform 160ms ease;
      }

      .terms input:checked {
        border-color: #3d6375;
        background: #3d6375;
      }

      .terms input:checked::after {
        transform: rotate(-45deg) scale(1);
      }

      .terms input:focus-visible {
        outline: 3px solid rgb(141 180 200 / 0.6);
        outline-offset: 3px;
      }

      .terms a {
        color: #164f68;
        font-weight: 700;
        text-decoration: none;
      }

      .terms a:hover {
        text-decoration: underline;
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
        border: 0;
        border-radius: 24px;
        background: #8db4c8;
        color: #123f52;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 18px;
        font-weight: 800;
        line-height: 1;
        box-shadow: 0 14px 28px rgb(61 99 117 / 0.12);
        transition:
          background 160ms ease,
          color 160ms ease,
          transform 160ms ease,
          box-shadow 160ms ease;
      }

      .submit-button svg {
        width: 24px;
        height: 24px;
      }

      .submit-button:hover:not(:disabled) {
        background: #3d6375;
        color: #ffffff;
        box-shadow: 0 18px 34px rgb(61 99 117 / 0.22);
      }

      .submit-button:active:not(:disabled) {
        transform: translateY(1px);
      }

      .submit-button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .signin-footer {
        margin-top: 58px;
        padding-top: 46px;
        border-top: 1px solid #c9d0d5;
        display: grid;
        justify-items: center;
        gap: 26px;
        color: #41484b;
        font-size: 18px;
      }

      .signin-footer a {
        min-width: 138px;
        min-height: 64px;
        border: 1.5px solid #164f68;
        border-radius: 999px;
        color: #164f68;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 32px;
        text-decoration: none;
        font-size: 18px;
        font-weight: 600;
        transition:
          background 160ms ease,
          color 160ms ease;
      }

      .signin-footer a:hover {
        background: #e8f6ff;
      }

      .hero-panel {
        position: relative;
        display: none;
        min-width: 0;
        overflow: hidden;
        background: #c5e7fb;
      }

      .hero-panel img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: 47% center;
        transform: scale(1.05);
      }

      .hero-wash {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(180deg, rgb(244 250 255 / 0.06), rgb(219 241 255 / 0.38)),
          linear-gradient(90deg, rgb(255 255 255 / 0.1), rgb(244 250 255 / 0.18));
      }

      .support-card {
        position: absolute;
        right: 8%;
        bottom: 6.8%;
        width: min(560px, 70%);
        min-height: 338px;
        border: 1px solid rgb(255 255 255 / 0.7);
        border-radius: 24px;
        background: rgb(255 255 255 / 0.72);
        box-shadow: 0 24px 70px rgb(16 52 67 / 0.2);
        backdrop-filter: blur(14px);
        display: grid;
        justify-items: center;
        align-content: center;
        gap: 22px;
        padding: 48px 56px 42px;
        text-align: center;
      }

      .heart-badge {
        width: 62px;
        height: 62px;
        border-radius: 999px;
        background: #d7e9c0;
        color: #5a6949;
        display: grid;
        place-items: center;
      }

      .heart-badge svg {
        width: 31px;
        height: 31px;
      }

      .support-card h2 {
        color: #001e2b;
        font-size: 34px;
        line-height: 1.25;
        font-weight: 800;
        letter-spacing: 0;
      }

      .support-card p {
        max-width: 470px;
        color: #273a43;
        font-size: 18px;
        line-height: 1.6;
      }

      .dots {
        display: inline-flex;
        gap: 6px;
        margin-top: 6px;
      }

      .dots span {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #b7cbd4;
      }

      .dots span:first-child {
        background: #3d6375;
      }

      @media (min-width: 1024px) {
        .signup-page {
          grid-template-columns: minmax(520px, 1fr) minmax(0, 1fr);
        }

        .form-panel {
          min-height: 100svh;
          padding: 72px 7.5vw;
        }

        .hero-panel {
          display: block;
          min-height: 100svh;
        }
      }

      @media (max-width: 1240px) {
        .form-panel {
          padding-left: 56px;
          padding-right: 56px;
        }

        .support-card {
          right: 5%;
          width: min(500px, 82%);
          padding: 42px 40px 36px;
        }
      }

      @media (max-width: 720px) {
        .form-panel {
          padding: 36px 20px;
        }

        .brand {
          margin-bottom: 42px;
        }

        .brand span {
          font-size: 34px;
        }

        .intro {
          margin-bottom: 42px;
        }

        .intro h1 {
          font-size: 30px;
        }

        .intro p {
          font-size: 16px;
        }

        .password-grid {
          grid-template-columns: 1fr;
        }

        .submit-button {
          height: 62px;
          border-radius: 22px;
        }

        .signin-footer {
          margin-top: 42px;
          padding-top: 34px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    },
    { validators: matchingPasswords },
  );

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, email, password } = this.form.getRawValue();
    const { firstName, lastName } = this.splitName(fullName);

    this.loading.set(true);
    this.auth.register({ firstName, lastName, email, password }).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: () => {
        this.error.set('Registration failed. Please review the form and try again.');
        this.loading.set(false);
      },
    });
  }

  private splitName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') || firstName;

    return { firstName, lastName };
  }
}
