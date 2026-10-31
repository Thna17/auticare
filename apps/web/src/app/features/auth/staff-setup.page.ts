import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { homeRouteFor } from '../../core/auth/home-route';
import { I18nService } from '../../core/i18n/i18n.service';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { matchingPasswords } from './accept-invitation.page';
import { BackHomeLinkComponent } from './back-home-link.component';

const COPY = {
  en: {
    title: 'Set up your account',
    intro:
      'Your school or hospital gave you a username and a one-time setup code. Enter them here and choose your own password.',
    username: 'Username',
    usernameHint: 'For example: sereysokbotra.ssla',
    usernameError: 'Enter the username your school or hospital gave you.',
    code: 'Setup code',
    codeHint: 'Eight letters and numbers, e.g. K7QM-4XPA. It works once and expires after 3 days.',
    codeError: 'Enter the setup code.',
    password: 'New password',
    passwordHint: 'At least 12 characters.',
    passwordError: 'Use at least 12 characters.',
    confirm: 'Confirm password',
    mismatch: 'The passwords do not match.',
    submit: 'Set password and sign in',
    working: 'Setting up…',
    lost: 'Lost your code, or it expired? Ask your school or hospital admin for a new one.',
    login: 'Already set up? Sign in',
    failed: 'Something went wrong. Please try again.',
  },
  km: {
    title: 'រៀបចំគណនីរបស់អ្នក',
    intro:
      'សាលា ឬមន្ទីរពេទ្យរបស់អ្នកបានផ្តល់ឈ្មោះអ្នកប្រើ និងលេខកូដរៀបចំមួយដង។ បញ្ចូលវានៅទីនេះ ហើយជ្រើសរើសពាក្យសម្ងាត់ផ្ទាល់ខ្លួន។',
    username: 'ឈ្មោះអ្នកប្រើ',
    usernameHint: 'ឧទាហរណ៍៖ sereysokbotra.ssla',
    usernameError: 'បញ្ចូលឈ្មោះអ្នកប្រើដែលសាលា ឬមន្ទីរពេទ្យបានផ្តល់។',
    code: 'លេខកូដរៀបចំ',
    codeHint: 'អក្សរ និងលេខប្រាំបីខ្ទង់ ឧ. K7QM-4XPA។ ប្រើបានតែម្តង ហើយផុតកំណត់ក្រោយ ៣ ថ្ងៃ។',
    codeError: 'បញ្ចូលលេខកូដរៀបចំ។',
    password: 'ពាក្យសម្ងាត់ថ្មី',
    passwordHint: 'យ៉ាងហោចណាស់ ១២ តួអក្សរ។',
    passwordError: 'ប្រើយ៉ាងហោចណាស់ ១២ តួអក្សរ។',
    confirm: 'បញ្ជាក់ពាក្យសម្ងាត់',
    mismatch: 'ពាក្យសម្ងាត់មិនដូចគ្នាទេ។',
    submit: 'កំណត់ពាក្យសម្ងាត់ ហើយចូល',
    working: 'កំពុងរៀបចំ…',
    lost: 'បាត់លេខកូដ ឬផុតកំណត់? សុំលេខកូដថ្មីពីអ្នកគ្រប់គ្រងសាលា ឬមន្ទីរពេទ្យ។',
    login: 'បានរៀបចំរួចហើយ? ចូលប្រើ',
    failed: 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។',
  },
};

/**
 * First sign-in for a teacher whose school created the account. There is no
 * email involved: the school hands over a username and a single-use setup code
 * in person, and the teacher chooses a password here.
 */
@Component({
  standalone: true,
  imports: [
    BackHomeLinkComponent,
    ReactiveFormsModule,
    RouterLink,
    UiFieldComponent,
    UiMessageComponent,
    AccessibleFormDirective,
  ],
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="setup-title">
        <ac-back-home-link />
        <a class="brand" routerLink="/" aria-label="AutiCare home">
          <img src="/images/auticare-logo.png" alt="" aria-hidden="true" width="36" height="36" />
          <span>AutiCare</span>
        </a>

        <header class="head">
          <h1 id="setup-title">{{ copy().title }}</h1>
          <p>{{ copy().intro }}</p>
        </header>

        @if (error(); as message) {
          <ac-ui-message tone="error">{{ message }}</ac-ui-message>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
          <ac-ui-field
            [label]="copy().username"
            [required]="true"
            [hint]="copy().usernameHint"
            [error]="
              form.controls.username.touched && form.controls.username.invalid
                ? copy().usernameError
                : null
            "
          >
            <input
              type="text"
              formControlName="username"
              autocomplete="username"
              autocapitalize="off"
              spellcheck="false"
            />
          </ac-ui-field>

          <ac-ui-field
            [label]="copy().code"
            [required]="true"
            [hint]="copy().codeHint"
            [error]="
              form.controls.setupCode.touched && form.controls.setupCode.invalid
                ? copy().codeError
                : null
            "
          >
            <input
              type="text"
              class="code-input"
              formControlName="setupCode"
              autocomplete="one-time-code"
              autocapitalize="characters"
              spellcheck="false"
              placeholder="XXXX-XXXX"
            />
          </ac-ui-field>

          <ac-ui-field
            [label]="copy().password"
            [required]="true"
            [hint]="copy().passwordHint"
            [error]="
              form.controls.password.touched && form.controls.password.invalid
                ? copy().passwordError
                : null
            "
          >
            <input type="password" formControlName="password" autocomplete="new-password" />
          </ac-ui-field>

          <ac-ui-field
            [label]="copy().confirm"
            [required]="true"
            [error]="
              form.controls.confirmPassword.touched && form.hasError('passwordMismatch')
                ? copy().mismatch
                : null
            "
          >
            <input type="password" formControlName="confirmPassword" autocomplete="new-password" />
          </ac-ui-field>

          <button type="submit" class="submit" [disabled]="submitting()">
            {{ submitting() ? copy().working : copy().submit }}
          </button>
        </form>

        <footer class="foot">
          <p>{{ copy().lost }}</p>
          <a routerLink="/login">{{ copy().login }}</a>
        </footer>
      </section>
    </main>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100svh;
        display: grid;
        place-items: center;
        padding: 32px 20px;
        background: var(--ac-color-tint-blue-faint);
      }

      .auth-card {
        width: 100%;
        max-width: 480px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 24px;
        padding: 40px 36px 34px;
        box-shadow: 0 16px 40px -12px color-mix(in srgb, var(--ac-brand-950) 12%, transparent);
        display: grid;
        gap: 22px;
      }

      .brand {
        justify-self: center;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--ac-color-action-mid);
        font-size: 24px;
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }

      .brand img {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        object-fit: cover;
      }

      .head {
        text-align: center;
        display: grid;
        gap: 8px;
      }

      .head h1 {
        margin: 0;
        font-size: 24px;
        line-height: 1.25;
        color: var(--ac-color-text-strong);
      }

      .head p {
        margin: 0;
        font-size: 15px;
        line-height: 1.55;
        color: var(--ac-color-text-body);
      }

      form {
        display: grid;
        gap: 16px;
      }

      .code-input {
        font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .submit {
        height: 48px;
        border: 0;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font: inherit;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }

      .submit:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
      }

      .submit:disabled {
        opacity: 0.6;
        cursor: progress;
      }

      .submit:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .foot {
        display: grid;
        gap: 6px;
        text-align: center;
        font-size: 14px;
        color: var(--ac-color-text-muted);
      }

      .foot p {
        margin: 0;
      }

      .foot a {
        color: var(--ac-color-action-deep);
        font-weight: 700;
      }

      @media (max-width: 480px) {
        .auth-card {
          padding: 32px 20px 26px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffSetupPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      setupCode: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchingPasswords },
  );

  submit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, setupCode, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.auth
      .staffSetup({ username: username.trim(), setupCode: setupCode.trim(), password })
      .subscribe({
        next: (parent) => void this.router.navigateByUrl(homeRouteFor(parent.role)),
        error: (err: unknown) => {
          this.submitting.set(false);
          const message =
            err instanceof HttpErrorResponse
              ? (err.error?.error?.message as string | undefined)
              : undefined;
          this.error.set(message ?? this.copy().failed);
        },
      });
  }
}
