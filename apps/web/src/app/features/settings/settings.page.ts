import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ParentResponse, UpdateMyProfileRequest } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <section class="profile-hero">
      <div class="identity">
        <div class="avatar" aria-hidden="true">{{ initials() }}</div>
        <div>
          <p class="eyebrow">Parent profile</p>
          <h1>{{ displayName() }}</h1>
          <p>{{ parent()?.email || 'Loading account details...' }}</p>
        </div>
      </div>
      <a class="primary-link" routerLink="/children">Manage child profiles</a>
    </section>

    <section class="summary-grid" aria-label="Parent account summary">
      <article>
        <span>Role</span>
        <strong>{{ parent()?.role || 'Parent' }}</strong>
      </article>
      <article>
        <span>Account status</span>
        <strong>Active</strong>
      </article>
      <article>
        <span>Security</span>
        <strong>Protected</strong>
      </article>
    </section>

    <section class="content-grid">
      <section class="profile-panel" aria-labelledby="account-title">
        <header>
          <h2 id="account-title">Account details</h2>
          <p>
            Your profile information is used across child profiles, screening, and school reports.
          </p>
        </header>

        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="field-grid">
            <label class="field">
              <span>First name</span>
              <input formControlName="firstName" autocomplete="given-name" />
              @if (showError('firstName')) {
                <small class="field-error" role="alert">First name is required.</small>
              }
            </label>
            <label class="field">
              <span>Last name</span>
              <input formControlName="lastName" autocomplete="family-name" />
              @if (showError('lastName')) {
                <small class="field-error" role="alert">Last name is required.</small>
              }
            </label>
            <label class="field">
              <span>Phone number <em>(optional)</em></span>
              <input formControlName="phoneNumber" autocomplete="tel" inputmode="tel" />
            </label>
            <label class="field">
              <span>Social media <em>(optional)</em></span>
              <input formControlName="socialMediaAccount" />
            </label>
            <label class="field full">
              <span>Email address</span>
              <input [value]="parent()?.email || ''" readonly aria-describedby="email-note" />
              <small id="email-note" class="field-hint">
                Your email is your sign-in and cannot be changed here.
              </small>
            </label>
          </div>

          @if (saveError()) {
            <p class="form-error" role="alert">{{ saveError() }}</p>
          }
          @if (saved()) {
            <p class="form-success" role="status">Your profile has been updated.</p>
          }

          <div class="form-actions">
            <button type="submit" class="save-btn" [disabled]="saving() || form.pristine">
              {{ saving() ? 'Saving…' : 'Save changes' }}
            </button>
            <button
              type="button"
              class="reset-btn"
              [disabled]="saving() || form.pristine"
              (click)="resetForm()"
            >
              Discard
            </button>
          </div>
        </form>
      </section>

      <aside class="side-panel" aria-label="Profile support">
        <h2>Care workspace</h2>
        <div class="support-row">
          <span>Next useful action</span>
          <strong>Review child profiles</strong>
          <a routerLink="/children">Open children</a>
        </div>
        <div class="support-row">
          <span>Security action</span>
          <strong>Password recovery ready</strong>
          <a routerLink="/forgot-password">Reset password</a>
        </div>
        <div class="calm-note">
          <h3>Profile tip</h3>
          <p>
            Keep child support notes specific and practical. Schools and care teams can use clear
            context more easily than long narrative notes.
          </p>
        </div>
      </aside>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .profile-hero {
        border-radius: 8px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.06);
        padding: 26px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 18px;
      }

      .identity {
        display: flex;
        align-items: center;
        gap: 18px;
        min-width: 0;
      }

      .avatar {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        background: #c0e8fe;
        color: var(--ac-color-ink-j);
        display: grid;
        place-items: center;
        font-size: 28px;
        font-weight: var(--ac-font-weight-bold);
        flex: 0 0 auto;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .eyebrow {
        color: var(--ac-color-olive);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0;
        margin-bottom: 6px;
      }

      h1 {
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: 1.2;
        letter-spacing: 0;
      }

      .identity p:last-child {
        color: var(--ac-color-text-body);
        margin-top: 8px;
      }

      .primary-link {
        min-height: 46px;
        border-radius: 999px;
        background: var(--ac-color-primary);
        color: var(--ac-color-ink-d);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 18px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
      }

      .primary-link:hover {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      .summary-grid article,
      .profile-panel,
      .side-panel {
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
        background: var(--ac-color-surface);
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.05);
      }

      .summary-grid article {
        padding: 18px;
        display: grid;
        gap: 8px;
      }

      .summary-grid span,
      .support-row span {
        color: var(--ac-color-grey-c);
        font-size: var(--ac-type-label);
        line-height: 1.3;
      }

      .summary-grid strong,
      .support-row strong {
        color: var(--ac-color-text-strong);
        font-size: 18px;
      }

      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
        gap: 18px;
        align-items: start;
      }

      .profile-panel,
      .side-panel {
        padding: 24px;
        display: grid;
        gap: 20px;
      }

      header {
        display: grid;
        gap: 10px;
      }

      h2 {
        color: var(--ac-color-text-strong);
        font-size: 24px;
        line-height: 1.3;
      }

      header p,
      .calm-note p,
      .info-note {
        color: var(--ac-color-text-body);
        line-height: 1.55;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .field {
        display: grid;
        gap: 10px;
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-bold);
      }

      .field.full {
        grid-column: 1 / -1;
      }

      .field span em {
        font-style: normal;
        font-weight: var(--ac-font-weight-regular, 400);
        color: var(--ac-color-grey-b);
      }

      .field-hint {
        font-weight: var(--ac-font-weight-regular, 400);
        color: var(--ac-color-grey-b);
      }

      .field-error {
        font-weight: var(--ac-font-weight-regular, 400);
        color: var(--ac-color-red-700);
      }

      .form-error,
      .form-success {
        margin: 18px 0 0;
        padding: 12px 16px;
        border-radius: 10px;
        font-weight: var(--ac-font-weight-bold);
      }

      .form-error {
        color: var(--ac-color-red-700);
        background: var(--ac-color-red-100);
        border: 1px solid var(--ac-color-red-border);
      }

      .form-success {
        color: #0b6b3a;
        background: #e8f7ee;
        border: 1px solid #bfe3cd;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        flex-wrap: wrap;
      }

      .save-btn,
      .reset-btn {
        min-height: 48px;
        padding: 0 22px;
        border-radius: 12px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }

      .save-btn {
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .reset-btn {
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
      }

      .save-btn:disabled,
      .reset-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      input[readonly] {
        background: #eef3f6;
        color: var(--ac-color-text-body);
      }

      input {
        width: 100%;
        min-height: 54px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 12px;
        background: var(--ac-color-tint-blue-pale);
        color: var(--ac-color-text-strong);
        font: inherit;
        padding: 0 16px;
      }

      input:focus {
        border-color: var(--ac-color-action);
        box-shadow: 0 0 0 4px rgb(61 99 117 / 0.12);
        outline: none;
      }

      .info-note {
        border-radius: 12px;
        background: var(--ac-color-surface-info);
        padding: 14px 16px;
      }

      .support-row {
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: 16px;
        display: grid;
        gap: 8px;
      }

      .support-row a {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }

      .support-row a:hover {
        text-decoration: underline;
      }

      .calm-note {
        border-radius: 8px;
        background: var(--ac-color-sage-light);
        padding: 18px;
        display: grid;
        gap: 8px;
      }

      h3 {
        font-size: 18px;
        line-height: 1.3;
      }

      @media (max-width: 860px) {
        .profile-hero,
        .identity {
          align-items: flex-start;
        }

        .profile-hero {
          flex-direction: column;
        }

        .summary-grid,
        .content-grid,
        .field-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        h1 {
          font-size: 32px;
        }

        .identity {
          flex-direction: column;
        }

        .primary-link {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly parent = this.auth.parent;
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.maxLength(80)]),
    lastName: this.fb.control('', [Validators.required, Validators.maxLength(80)]),
    phoneNumber: this.fb.control('', [Validators.maxLength(32)]),
    socialMediaAccount: this.fb.control('', [Validators.maxLength(160)]),
  });

  constructor() {
    // Keep the form in step with whoever is signed in: the parent signal is
    // populated asynchronously by loadCurrentUser, and is refreshed again after a
    // save. Only reset while untouched, so an in-progress edit is never clobbered.
    effect(() => {
      const parent = this.parent();
      if (parent && this.form.pristine) this.patchFrom(parent);
    });
  }
  readonly displayName = computed(() => {
    const parent = this.parent();
    if (!parent) return 'Parent profile';
    return `${parent.firstName} ${parent.lastName}`.trim();
  });

  ngOnInit() {
    if (!this.parent()) this.auth.loadCurrentUser().subscribe();
  }

  initials(): string {
    const parent = this.parent();
    if (!parent) return 'AC';
    return `${parent.firstName.slice(0, 1)}${parent.lastName.slice(0, 1)}`.toUpperCase();
  }

  protected showError(control: 'firstName' | 'lastName'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.dirty || field.touched);
  }

  protected resetForm(): void {
    const parent = this.parent();
    if (parent) this.patchFrom(parent);
    this.saveError.set(null);
    this.saved.set(false);
  }

  protected save(): void {
    this.saved.set(false);
    this.saveError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Send only what changed. Empty optional fields are sent as null so a value
    // can be cleared, which an empty string would not do.
    const value = this.form.getRawValue();
    const parent = this.parent();
    const payload: UpdateMyProfileRequest = {};
    if (value.firstName !== parent?.firstName) payload.firstName = value.firstName;
    if (value.lastName !== parent?.lastName) payload.lastName = value.lastName;
    const phone = value.phoneNumber.trim() === '' ? null : value.phoneNumber.trim();
    if (phone !== (parent?.phoneNumber ?? null)) payload.phoneNumber = phone;
    const social = value.socialMediaAccount.trim() === '' ? null : value.socialMediaAccount.trim();
    if (social !== (parent?.socialMediaAccount ?? null)) payload.socialMediaAccount = social;

    if (Object.keys(payload).length === 0) {
      this.form.markAsPristine();
      return;
    }

    this.saving.set(true);
    this.auth.updateMyProfile(payload).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.saved.set(true);
        this.patchFrom(updated);
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        this.saving.set(false);
        this.saveError.set(
          err?.error?.error?.message ?? 'Your profile could not be saved. Please try again.',
        );
      },
    });
  }

  private patchFrom(parent: ParentResponse): void {
    this.form.reset({
      firstName: parent.firstName,
      lastName: parent.lastName,
      phoneNumber: parent.phoneNumber ?? '',
      socialMediaAccount: parent.socialMediaAccount ?? '',
    });
  }
}
