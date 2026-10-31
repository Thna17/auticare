import { HttpErrorResponse } from '@angular/common/http';
import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChildren,
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
    digitLabel: (n: number) => `Digit ${n} of 6`,
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
    digitLabel: (n: number) => `ខ្ទង់ទី ${n} ក្នុងចំណោម ៦`,
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

          <!-- Six boxes, one digit each, backed by the single "code" form control. -->
          <fieldset
            class="code-field"
            [attr.aria-describedby]="showCodeError() ? 'code-hint code-error' : 'code-hint'"
          >
            <legend>
              {{ copy().codeLabel }} <span class="required" aria-hidden="true">*</span>
            </legend>
            <div class="code-boxes" (paste)="onPaste($event)">
              @for (slot of slots; track slot) {
                <input
                  #digitBox
                  class="code-box"
                  type="text"
                  inputmode="numeric"
                  [attr.autocomplete]="slot === 0 ? 'one-time-code' : 'off'"
                  [attr.aria-label]="copy().digitLabel(slot + 1)"
                  [attr.aria-invalid]="showCodeError() ? 'true' : null"
                  [class.filled]="digits()[slot] !== ''"
                  [value]="digits()[slot]"
                  [disabled]="loading()"
                  (input)="onDigitInput(slot, $event)"
                  (keydown)="onDigitKeydown(slot, $event)"
                  (focus)="selectContents($event)"
                />
              }
            </div>
            <p id="code-hint" class="code-hint">{{ copy().codeHint }}</p>
            @if (showCodeError()) {
              <p id="code-error" class="code-error">{{ copy().codeError }}</p>
            }
          </fieldset>

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

      .code-field {
        margin: 0;
        padding: 0;
        border: 0;
        display: grid;
        gap: 10px;
        min-width: 0;
      }

      legend {
        padding: 0;
        margin-bottom: 10px;
        font-size: 14px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .required {
        color: var(--ac-color-red-600);
      }

      .code-boxes {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 10px;
      }

      .code-box {
        height: 60px;
        padding: 0;
        border-width: 1.5px;
        text-align: center;
        font-size: 26px;
        font-weight: var(--ac-font-weight-bold);
        font-variant-numeric: tabular-nums;
        caret-color: var(--ac-color-action);
        transition:
          border-color 140ms ease,
          box-shadow 140ms ease,
          background 140ms ease;
      }

      .code-box.filled {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
      }

      .code-box[aria-invalid='true'] {
        border-color: var(--ac-color-red-600);
      }

      .code-box:disabled {
        opacity: 0.6;
      }

      .code-hint {
        color: var(--ac-color-text-muted);
        font-size: 13px;
        line-height: 1.5;
      }

      .code-error {
        color: var(--ac-color-red-600);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
      }

      @media (prefers-reduced-motion: reduce) {
        .code-box {
          transition: none;
        }
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

        .code-boxes {
          gap: 6px;
        }

        .code-box {
          height: 52px;
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

  protected readonly slots = [0, 1, 2, 3, 4, 5] as const;
  /** One digit per box; joined into the code control on every change. */
  protected readonly digits = signal<string[]>(['', '', '', '', '', '']);
  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('digitBox');
  /** Set on submit, so an untouched form does not open with an error. */
  private readonly codeTouched = signal(false);
  protected readonly showCodeError = computed(
    () => this.codeTouched() && !/^\d{6}$/.test(this.digits().join('')),
  );

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

  protected onDigitInput(slot: number, event: Event): void {
    const field = event.target as HTMLInputElement;
    const typed = field.value.replace(/\D/g, '');
    if (typed.length > 2) {
      // The browser filled in the whole code (one-time-code autofill).
      this.fillFrom(slot, typed);
      return;
    }
    // Typing into a box that already had a digit: keep the new keystroke.
    const caret = field.selectionStart ?? typed.length;
    const digit = typed.length === 2 ? (field.value[caret - 1] ?? '').replace(/\D/g, '') : typed;
    this.setDigit(slot, digit);
    field.value = digit;
    if (digit) this.focusBox(slot + 1);
    this.submitWhenComplete();
  }

  protected onDigitKeydown(slot: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[slot] && slot > 0) {
      event.preventDefault();
      this.setDigit(slot - 1, '');
      this.focusBox(slot - 1);
    } else if (event.key === 'ArrowLeft' && slot > 0) {
      event.preventDefault();
      this.focusBox(slot - 1);
    } else if (event.key === 'ArrowRight' && slot < 5) {
      event.preventDefault();
      this.focusBox(slot + 1);
    }
  }

  /** "123 456" or "Your code is 123456" pasted into any box fills them all. */
  protected onPaste(event: ClipboardEvent): void {
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    this.fillFrom(pasted.length >= 6 ? 0 : this.focusedSlot(), pasted);
  }

  protected selectContents(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  private fillFrom(start: number, value: string): void {
    const next = [...this.digits()];
    const chars = value.slice(0, 6 - start).split('');
    chars.forEach((char, offset) => (next[start + offset] = char));
    this.setDigits(next);
    this.focusBox(Math.min(start + chars.length, 5));
    this.submitWhenComplete();
  }

  private setDigit(slot: number, digit: string): void {
    const next = [...this.digits()];
    next[slot] = digit;
    this.setDigits(next);
  }

  private setDigits(next: string[]): void {
    this.digits.set(next);
    this.form.controls.code.setValue(next.join(''));
  }

  private clearDigits(): void {
    this.setDigits(['', '', '', '', '', '']);
  }

  private focusedSlot(): number {
    const index = this.boxes().findIndex((box) => box.nativeElement === document.activeElement);
    return index < 0 ? 0 : index;
  }

  private focusBox(slot: number): void {
    this.boxes()[Math.max(0, Math.min(slot, 5))]?.nativeElement.focus();
  }

  /** The sixth digit sends the code; there is nothing else to wait for. */
  private submitWhenComplete(): void {
    if (!this.loading() && /^\d{6}$/.test(this.digits().join(''))) this.submit();
  }

  submit(): void {
    this.error.set(null);
    this.notice.set(null);
    this.codeTouched.set(true);
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
        // A wrong code is retyped from the first box.
        if (err instanceof HttpErrorResponse && err.status === 400) {
          this.clearDigits();
          this.codeTouched.set(false);
          setTimeout(() => this.focusBox(0));
        }
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
        this.clearDigits();
        this.codeTouched.set(false);
        this.notice.set(this.copy().resent);
        this.focusBox(0);
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
