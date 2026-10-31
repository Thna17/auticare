import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { homeRouteFor } from '../../core/auth/home-route';
import { I18nService } from '../../core/i18n/i18n.service';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';

/** Matches RESEND_COOLDOWN_SECONDS on the server. */
const RESEND_COOLDOWN_SECONDS = 60;

const COPY = {
  en: {
    title: 'Check your email',
    intro: 'We sent a 6-digit code to',
    introNoEmail: 'Enter your email and the 6-digit code we sent you.',
    emailLabel: 'Email address',
    emailError: 'Enter a valid email address.',
    codeLabel: 'Verification code',
    codeHint: 'The code works for 15 minutes. Check your spam folder if you do not see it.',
    codeError: 'Enter the 6 digits from the email.',
    submit: 'Verify and continue',
    submitting: 'Checking…',
    resend: 'Send a new code',
    resendIn: (s: number) => `Send a new code in ${s}s`,
    resent: 'A new code is on its way. Only the newest code works.',
    wrongCode:
      'That code is wrong or has expired. Use the code from the latest email, or send a new one.',
    tooMany: 'Too many attempts. Wait a few minutes, then try again.',
    offline: 'Cannot reach AutiCare. Check your connection and try again.',
    serverError: 'Something went wrong. Please try again in a moment.',
    back: 'Back to log in',
    lang: 'ខ្មែរ',
  },
  km: {
    title: 'សូមពិនិត្យអ៊ីមែលរបស់អ្នក',
    intro: 'យើងបានផ្ញើលេខកូដ ៦ ខ្ទង់ទៅ',
    introNoEmail: 'សូមបញ្ចូលអ៊ីមែល និងលេខកូដ ៦ ខ្ទង់ដែលយើងបានផ្ញើទៅអ្នក។',
    emailLabel: 'អាសយដ្ឋានអ៊ីមែល',
    emailError: 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលឱ្យបានត្រឹមត្រូវ។',
    codeLabel: 'លេខកូដផ្ទៀងផ្ទាត់',
    codeHint: 'លេខកូដប្រើបាន ១៥ នាទី។ ប្រសិនបើរកមិនឃើញ សូមពិនិត្យថត Spam។',
    codeError: 'សូមបញ្ចូលលេខ ៦ ខ្ទង់ពីអ៊ីមែល។',
    submit: 'ផ្ទៀងផ្ទាត់ និងបន្ត',
    submitting: 'កំពុងពិនិត្យ…',
    resend: 'ផ្ញើលេខកូដថ្មី',
    resendIn: (s: number) => `ផ្ញើលេខកូដថ្មីបានក្នុងរយៈពេល ${s} វិនាទី`,
    resent: 'លេខកូដថ្មីកំពុងផ្ញើទៅអ្នក។ មានតែលេខកូដចុងក្រោយប៉ុណ្ណោះដែលប្រើបាន។',
    wrongCode: 'លេខកូដមិនត្រឹមត្រូវ ឬផុតកំណត់ហើយ។ សូមប្រើលេខកូដពីអ៊ីមែលចុងក្រោយ ឬផ្ញើលេខកូដថ្មី។',
    tooMany: 'អ្នកបានព្យាយាមច្រើនដងពេក។ សូមរង់ចាំប៉ុន្មាននាទី រួចព្យាយាមម្តងទៀត។',
    offline: 'មិនអាចភ្ជាប់ទៅ AutiCare បានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។',
    serverError: 'មានបញ្ហាមួយកើតឡើង។ សូមព្យាយាមម្តងទៀតបន្តិចទៀត។',
    back: 'ត្រឡប់ទៅការចូលគណនី',
    lang: 'English',
  },
} as const;

/**
 * /verify-email — a new parent types the 6-digit code from their email. Reached
 * from sign-up, or from logging in before the address was confirmed (either way
 * a code has just been sent, so the resend button starts on its cooldown).
 */
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
      <section class="auth-card" aria-labelledby="verify-title">
        <div class="top-row">
          <a class="brand" routerLink="/" aria-label="AutiCare home">
            <img src="/images/auticare-logo.png" alt="" aria-hidden="true" width="36" height="36" />
            <span>AutiCare</span>
          </a>
          <button type="button" class="lang-toggle" (click)="toggleLanguage()">
            {{ copy().lang }}
          </button>
        </div>

        <header>
          <div class="mail-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M4 6h16v12H4z M4 7l8 6 8-6"
                fill="none"
                stroke="currentColor"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </div>
          <h1 id="verify-title">{{ copy().title }}</h1>
          @if (knownEmail()) {
            <p>
              {{ copy().intro }} <strong>{{ knownEmail() }}</strong>
            </p>
          } @else {
            <p>{{ copy().introNoEmail }}</p>
          }
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
          @if (!knownEmail()) {
            <ac-ui-field
              [label]="copy().emailLabel"
              [required]="true"
              [error]="
                form.controls.email.touched && form.controls.email.invalid
                  ? copy().emailError
                  : null
              "
            >
              <input type="email" formControlName="email" autocomplete="email" />
            </ac-ui-field>
          }

          <ac-ui-field
            [label]="copy().codeLabel"
            [hint]="copy().codeHint"
            [required]="true"
            [error]="
              form.controls.code.touched && form.controls.code.invalid ? copy().codeError : null
            "
          >
            <input
              class="code-input"
              type="text"
              formControlName="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="••••••"
              (input)="keepDigits($event)"
            />
          </ac-ui-field>

          @if (error()) {
            <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
          }
          @if (notice()) {
            <ac-ui-message tone="success">{{ notice() }}</ac-ui-message>
          }

          <button class="submit-button" type="submit" [disabled]="loading()">
            {{ loading() ? copy().submitting : copy().submit }}
          </button>

          <button
            type="button"
            class="resend-btn"
            [disabled]="cooldown() > 0 || resending()"
            (click)="resend()"
          >
            {{ cooldown() > 0 ? copy().resendIn(cooldown()) : copy().resend }}
          </button>
        </form>

        <footer>
          <a routerLink="/login">{{ copy().back }}</a>
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
        width: min(100%, 480px);
        border-radius: 24px;
        background: var(--ac-color-surface);
        box-shadow: 0 18px 60px color-mix(in srgb, var(--ac-brand-800) 10%, transparent);
        border: 1px solid var(--ac-color-border-slate);
        padding: 40px 36px 32px;
        display: grid;
        gap: 24px;
      }

      .top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .brand {
        color: var(--ac-color-action-mid);
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 22px;
        line-height: 1;
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }

      .brand img {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        object-fit: cover;
      }

      .lang-toggle {
        min-height: 36px;
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font: inherit;
        font-size: 14px;
        cursor: pointer;
      }

      header {
        text-align: center;
        display: grid;
        justify-items: center;
        gap: 10px;
      }

      .mail-icon {
        width: 52px;
        height: 52px;
        border-radius: 999px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        display: grid;
        place-items: center;
      }

      .mail-icon svg {
        width: 26px;
        height: 26px;
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        font-size: 26px;
        line-height: 1.3;
        font-weight: var(--ac-font-weight-bold);
      }

      header p {
        color: var(--ac-color-text-body);
        font-size: 15px;
        line-height: 1.55;
        overflow-wrap: anywhere;
      }

      header strong {
        color: var(--ac-color-text-strong);
      }

      form {
        display: grid;
        gap: 18px;
      }

      input {
        width: 100%;
        height: 56px;
        box-sizing: border-box;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 12px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 16px;
        padding: 0 18px;
      }

      .code-input {
        font-size: 28px;
        font-weight: var(--ac-font-weight-bold);
        letter-spacing: 0.4em;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }

      input:focus {
        border-color: var(--ac-color-action);
        box-shadow: 0 0 0 4px var(--ac-color-tint-blue);
        outline: none;
      }

      .submit-button {
        height: 54px;
        border-radius: 12px;
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font: inherit;
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      .submit-button:hover:not(:disabled) {
        background: var(--ac-color-action-alt);
      }

      .submit-button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .resend-btn {
        justify-self: center;
        min-height: 40px;
        padding: 8px 12px;
        border: 0;
        background: transparent;
        color: var(--ac-color-action-deep);
        font: inherit;
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: underline;
        cursor: pointer;
      }

      .resend-btn:disabled {
        color: var(--ac-color-text-muted);
        text-decoration: none;
        cursor: default;
      }

      .lang-toggle:focus-visible,
      .submit-button:focus-visible,
      .resend-btn:focus-visible,
      footer a:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      footer {
        border-top: 1px solid var(--ac-color-border-slate);
        padding-top: 18px;
        text-align: center;
      }

      footer a {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        font-size: 14px;
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
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang() === 'km' ? 'km' : 'en']);
  protected readonly knownEmail = signal(
    (inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '').trim(),
  );
  protected readonly loading = signal(false);
  protected readonly resending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  /** Seconds until another code may be requested; a code was just sent. */
  protected readonly cooldown = signal(RESEND_COOLDOWN_SECONDS);

  readonly form = this.fb.nonNullable.group({
    email: [this.knownEmail(), [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor() {
    const timer = setInterval(() => {
      if (this.cooldown() > 0) this.cooldown.update((s) => s - 1);
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected toggleLanguage(): void {
    this.i18n.setLanguage(this.i18n.currentLang() === 'km' ? 'en' : 'km');
  }

  /** Phones paste "123 456" or offer the code with spaces; keep the digits only. */
  protected keepDigits(event: Event): void {
    const field = event.target as HTMLInputElement;
    const digits = field.value.replace(/\D/g, '').slice(0, 6);
    if (digits !== field.value) {
      field.value = digits;
      this.form.controls.code.setValue(digits);
    }
  }

  submit(): void {
    this.error.set(null);
    this.notice.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, code } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.verifyEmail(email.trim(), code).subscribe({
      next: (parent) => void this.router.navigateByUrl(homeRouteFor(parent.role)),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.describe(err));
      },
    });
  }

  resend(): void {
    this.error.set(null);
    this.notice.set(null);
    const email = this.form.controls.email;
    if (email.invalid) {
      email.markAsTouched();
      return;
    }
    this.resending.set(true);
    this.auth.resendVerification(email.value.trim()).subscribe({
      next: () => {
        this.resending.set(false);
        this.cooldown.set(RESEND_COOLDOWN_SECONDS);
        this.form.controls.code.reset('');
        this.notice.set(this.copy().resent);
      },
      error: (err: unknown) => {
        this.resending.set(false);
        this.error.set(this.describe(err));
      },
    });
  }

  private describe(err: unknown): string {
    const copy = this.copy();
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return copy.offline;
      if (err.status === 400) return copy.wrongCode;
      if (err.status === 429) return copy.tooMany;
    }
    return copy.serverError;
  }
}
