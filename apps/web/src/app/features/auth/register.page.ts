import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';

export type RegisterRoleOption = 'PARENT' | 'SCHOOL' | 'HOSPITAL';

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
    <main class="signup-page">
      <section class="form-panel" aria-labelledby="register-title">
        <div class="form-shell">
          <a class="brand" routerLink="/" aria-label="AutiCare home">
            <img src="/images/auticare-logo.jpg" alt="" aria-hidden="true" width="36" height="34" />
            <span>AutiCare</span>
          </a>

          <header class="intro">
            <h1 id="register-title">Create your account</h1>
            <p>Join our supportive community and start your child's developmental journey today.</p>
          </header>

          <div class="role-selector" role="radiogroup" aria-label="Account registration type">
            <span class="role-selector-label">I am joining as:</span>
            <div class="role-chips">
              <button
                type="button"
                role="radio"
                class="role-chip"
                [class.active]="selectedRole() === 'PARENT'"
                [attr.aria-checked]="selectedRole() === 'PARENT'"
                (click)="selectRole('PARENT')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M12 21s-7-4.4-9.1-8.3C.9 8 .7 4.8 3.2 3.2c2.2-1.4 5-.6 6.4 1.5L12 8l2.4-3.3c1.5-2.1 4.2-2.9 6.4-1.5 2.5 1.6 2.3 4.8.3 8.5C19 15.6 12 20 12 20Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
                <span>Parent / Family</span>
              </button>

              <button
                type="button"
                role="radio"
                class="role-chip"
                [class.active]="selectedRole() === 'SCHOOL'"
                [attr.aria-checked]="selectedRole() === 'SCHOOL'"
                (click)="selectRole('SCHOOL')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M22 10v6M2 10l10-5 10 5-10 5z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                  <path
                    d="M6 12v5c3 3 9 3 12 0v-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
                <span>School Staff</span>
              </button>

              <button
                type="button"
                role="radio"
                class="role-chip"
                [class.active]="selectedRole() === 'HOSPITAL'"
                [attr.aria-checked]="selectedRole() === 'HOSPITAL'"
                (click)="selectRole('HOSPITAL')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M22 12h-4l-3 9L9 3l-3 9H2"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
                <span>Hospital Coordinator</span>
              </button>
            </div>
          </div>

          @if (selectedRole() === 'PARENT') {
            <form
              class="register-form"
              [formGroup]="form"
              (ngSubmit)="submit()"
              acAccessibleForm
              novalidate
            >
              <ac-ui-field
                label="Full name"
                [required]="true"
                [error]="
                  form.controls.fullName.touched && form.controls.fullName.invalid
                    ? 'Enter your full name.'
                    : null
                "
              >
                <input
                  type="text"
                  formControlName="fullName"
                  autocomplete="name"
                  placeholder="Leo Miller"
                />
              </ac-ui-field>

              <ac-ui-field
                label="Email address"
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
                  placeholder="leo@example.com"
                />
              </ac-ui-field>

              <div class="password-grid">
                <ac-ui-field
                  label="Password"
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
              </div>

              <div class="password-note" id="password-help">
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <circle
                    cx="10"
                    cy="10"
                    r="7.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  />
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
                <input
                  type="checkbox"
                  formControlName="terms"
                  required
                  [attr.aria-invalid]="form.controls.terms.touched && form.controls.terms.invalid"
                  [attr.aria-describedby]="
                    form.controls.terms.touched && form.controls.terms.invalid
                      ? 'terms-error'
                      : null
                  "
                />
                <span>
                  I agree to the <a routerLink="/terms">Terms of Service</a> and
                  <a routerLink="/privacy">Privacy Policy</a>.
                  <span class="required-indicator" aria-hidden="true">*</span>
                  <span class="visually-hidden">(required)</span>
                </span>
              </label>
              @if (form.controls.terms.touched && form.controls.terms.invalid) {
                <p id="terms-error" class="field-error" role="alert">
                  Accept the terms to continue.
                </p>
              }

              @if (error()) {
                <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
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
          } @else {
            <section class="institutional-onboarding-card" aria-label="Institutional onboarding">
              <div class="org-icon-badge" aria-hidden="true">
                @if (selectedRole() === 'SCHOOL') {
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M22 10v6M2 10l10-5 10 5-10 5z"
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                    <path
                      d="M6 12v5c3 3 9 3 12 0v-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M22 12h-4l-3 9L9 3l-3 9H2"
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                }
              </div>

              <h2>Institutional Team Access</h2>
              <p>
                @if (selectedRole() === 'SCHOOL') {
                  Special education teachers and school coordinators are provisioned through
                  administrative organization invites to preserve student data privacy.
                } @else {
                  Hospital coordinators and clinical specialists are provisioned through verified
                  hospital accounts to comply with healthcare provider regulations.
                }
              </p>

              <div class="invite-action-box">
                <p>Have an invitation link or token from your administrator?</p>
                <a routerLink="/accept-invitation" class="invite-cta-btn">
                  <span>Activate with Invitation Token</span>
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
                </a>
              </div>

              <div class="alternative-row">
                <button type="button" class="switch-role-btn" (click)="selectRole('PARENT')">
                  Return to Parent / Family Registration
                </button>
              </div>
            </section>
          }

          <footer class="signin-footer">
            <p>Already have an account?</p>
            <a routerLink="/login">Log in</a>
          </footer>
        </div>
      </section>

      <section class="hero-panel" aria-label="AutiCare family support">
        <picture>
          <source srcset="/images/signup-hero.webp" type="image/webp" />
          <img src="/images/signup-hero.png" alt="" width="1376" height="768" loading="lazy" />
        </picture>
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
          <h2>You're Not Alone.</h2>
          <p>
            Join 5,000+ families and specialists who use AutiCare to track development, access
            expert clinical care, and nurture their child's unique potential every day.
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
        background: var(--ac-color-tint-blue-wash);
        color: var(--ac-color-text-strong);
      }

      .signup-page {
        min-height: 100svh;
        display: grid;
        background: var(--ac-color-surface);
      }

      .form-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        padding: 48px 24px;
        background: var(--ac-color-surface);
      }

      .form-shell {
        width: min(100%, 560px);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 36px;
        color: var(--ac-color-action-mid);
        text-decoration: none;
      }

      .brand img {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        flex: 0 0 auto;
        object-fit: cover;
        box-shadow: 0 0 0 1px var(--ac-color-sky-light);
      }

      .brand span {
        font-size: var(--ac-type-page-title);
        line-height: 1;
        font-weight: var(--ac-font-weight-bold);
      }

      .intro {
        margin-bottom: 28px;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      .intro h1 {
        color: var(--ac-color-text-strong);
        font-size: 32px;
        line-height: 1.25;
        font-weight: var(--ac-font-weight-bold);
        margin-bottom: 8px;
      }

      .intro p {
        color: var(--ac-color-text-body);
        font-size: 16px;
        line-height: 1.55;
      }

      /* Role Selector Chips */
      .role-selector {
        display: grid;
        gap: 8px;
        margin-bottom: 24px;
      }

      .role-selector-label {
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-muted);
      }

      .role-chips {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .role-chip {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 6px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 12px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        text-align: center;
        line-height: 1.2;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          color 160ms ease,
          box-shadow 160ms ease;
      }

      .role-chip svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      .role-chip:hover {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
      }

      .role-chip.active {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        box-shadow: 0 0 0 2px var(--ac-color-tint-blue);
      }

      .register-form {
        display: grid;
        gap: 20px;
      }

      ac-ui-field input {
        width: 100%;
        min-width: 0;
        height: 56px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 12px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 16px;
        line-height: 1.3;
        padding: 0 18px;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease,
          background 160ms ease;
      }

      ac-ui-field input::placeholder {
        color: var(--ac-color-slate-text-dimmed);
        opacity: 1;
      }

      ac-ui-field input:hover {
        border-color: var(--ac-color-slate-border-card);
      }

      ac-ui-field input:focus {
        border-color: var(--ac-color-action);
        box-shadow: 0 0 0 4px var(--ac-color-tint-blue);
        outline: none;
      }

      ac-ui-field input[aria-invalid='true'] {
        border-color: var(--ac-color-red-600);
      }

      .password-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 16px;
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
        right: 10px;
        width: 36px;
        height: 36px;
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

      .required-indicator {
        color: var(--ac-color-alert-strong);
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .password-note {
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr);
        align-items: start;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 12px;
        background: var(--ac-color-blue-tint-wash);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-text-body);
      }

      .password-note svg {
        width: 18px;
        height: 18px;
        margin-top: 2px;
        color: var(--ac-color-action);
      }

      .password-note p {
        font-size: var(--ac-type-label);
        line-height: 1.45;
      }

      .terms {
        display: grid;
        grid-template-columns: 26px minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-body);
        line-height: 1.5;
      }

      .terms input {
        appearance: none;
        width: 24px;
        height: 24px;
        margin-top: 2px;
        border: 1.5px solid var(--ac-color-border-grey);
        border-radius: 6px;
        background: var(--ac-color-surface);
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
        width: 10px;
        height: 5px;
        border-left: 2px solid var(--ac-color-surface);
        border-bottom: 2px solid var(--ac-color-surface);
        transform: rotate(-45deg) scale(0);
        transform-origin: center;
        transition: transform 160ms ease;
      }

      .terms input:checked {
        border-color: var(--ac-color-action);
        background: var(--ac-color-action);
      }

      .terms input:checked::after {
        transform: rotate(-45deg) scale(1);
      }

      .terms input:focus-visible {
        outline: 3px solid var(--ac-color-tint-blue);
        outline-offset: 2px;
      }

      .terms a {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
      }

      .terms a:hover {
        text-decoration: underline;
      }

      .field-error {
        color: var(--ac-color-red-600);
        font-size: var(--ac-type-label);
        line-height: 1.4;
        margin-top: -8px;
      }

      .submit-button {
        width: 100%;
        height: 56px;
        border: 0;
        border-radius: 14px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 17px;
        font-weight: var(--ac-font-weight-semibold);
        line-height: 1;
        box-shadow: 0 8px 20px rgb(41 74 90 / 0.16);
        transition:
          background 160ms ease,
          box-shadow 160ms ease,
          transform 160ms ease;
        margin-top: 8px;
      }

      .submit-button svg {
        width: 20px;
        height: 20px;
      }

      .submit-button:hover:not(:disabled) {
        background: var(--ac-color-action-alt);
        box-shadow: 0 10px 24px rgb(41 74 90 / 0.22);
      }

      .submit-button:active:not(:disabled) {
        transform: translateY(1px);
      }

      .submit-button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      /* Institutional Onboarding Guidance Card */
      .institutional-onboarding-card {
        border: 1px solid var(--ac-color-border-info);
        border-radius: 16px;
        background: var(--ac-color-surface-info);
        padding: 32px 28px;
        text-align: center;
        display: grid;
        justify-items: center;
        gap: 16px;
        margin-bottom: 12px;
      }

      .org-icon-badge {
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: var(--ac-color-primary);
        color: var(--ac-color-text-strong);
        display: grid;
        place-items: center;
      }

      .org-icon-badge svg {
        width: 24px;
        height: 24px;
      }

      .institutional-onboarding-card h2 {
        font-size: 20px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .institutional-onboarding-card p {
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
        max-width: 420px;
      }

      .invite-action-box {
        margin-top: 8px;
        display: grid;
        gap: 12px;
        width: 100%;
        max-width: 380px;
      }

      .invite-action-box p {
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .invite-cta-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        height: 52px;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        text-decoration: none;
        font-weight: var(--ac-font-weight-semibold);
        font-size: 15px;
        transition: background 160ms ease;
      }

      .invite-cta-btn svg {
        width: 18px;
        height: 18px;
      }

      .invite-cta-btn:hover {
        background: var(--ac-color-action-alt);
      }

      .alternative-row {
        margin-top: 6px;
      }

      .switch-role-btn {
        border: 0;
        background: transparent;
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        text-decoration: underline;
      }

      .signin-footer {
        margin-top: 36px;
        padding-top: 28px;
        border-top: 1px solid var(--ac-color-border-slate);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--ac-color-text-body);
        font-size: 15px;
      }

      .signin-footer a {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }

      .signin-footer a:hover {
        text-decoration: underline;
      }

      /* Hero Panel */
      .hero-panel {
        position: relative;
        display: none;
        min-width: 0;
        overflow: hidden;
        background: var(--ac-color-sky-tint-light);
      }

      .hero-panel picture,
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
        bottom: 8%;
        width: min(520px, 75%);
        min-height: 280px;
        border: 1px solid rgb(255 255 255 / 0.7);
        border-radius: 24px;
        background: rgb(255 255 255 / 0.78);
        box-shadow: 0 24px 60px rgb(16 52 67 / 0.18);
        backdrop-filter: blur(14px);
        display: grid;
        justify-items: center;
        align-content: center;
        gap: 16px;
        padding: 36px 42px;
        text-align: center;
      }

      .heart-badge {
        width: 52px;
        height: 52px;
        border-radius: 999px;
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-mid);
        display: grid;
        place-items: center;
      }

      .heart-badge svg {
        width: 26px;
        height: 26px;
      }

      .support-card h2 {
        color: var(--ac-color-text-strong);
        font-size: 26px;
        line-height: 1.25;
        font-weight: var(--ac-font-weight-bold);
      }

      .support-card p {
        max-width: 440px;
        color: var(--ac-color-ink-i);
        font-size: 15px;
        line-height: 1.6;
      }

      .dots {
        display: inline-flex;
        gap: 6px;
        margin-top: 4px;
      }

      .dots span {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--ac-color-slate-line);
      }

      .dots span:first-child {
        background: var(--ac-color-action);
      }

      @media (min-width: 1024px) {
        .signup-page {
          grid-template-columns: minmax(520px, 1fr) minmax(0, 1fr);
        }

        .form-panel {
          min-height: 100svh;
          padding: 64px 6vw;
        }

        .hero-panel {
          display: block;
          min-height: 100svh;
        }
      }

      @media (max-width: 720px) {
        .form-panel {
          padding: 32px 18px;
        }

        .brand {
          margin-bottom: 28px;
        }

        .intro {
          margin-bottom: 22px;
        }

        .intro h1 {
          font-size: 26px;
        }

        .role-chips {
          grid-template-columns: 1fr;
        }

        .role-chip {
          flex-direction: row;
          justify-content: flex-start;
          padding: 10px 14px;
        }

        .password-grid {
          grid-template-columns: 1fr;
        }

        .signin-footer {
          margin-top: 32px;
          padding-top: 24px;
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
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly selectedRole = signal<RegisterRoleOption>('PARENT');

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

  selectRole(role: RegisterRoleOption) {
    this.selectedRole.set(role);
  }

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
      this.error.set('Fix the highlighted fields before creating your account.');
      return;
    }

    const { fullName, email, password } = this.form.getRawValue();
    const { firstName, lastName } = this.splitName(fullName);

    this.loading.set(true);
    this.auth.register({ firstName, lastName, email, password }).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: (err: unknown) => {
        this.error.set(describeRegisterError(err));
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

/**
 * Turn a failed registration request into an honest message: surface specific
 * conflicts (e.g. email already exists) or validation messages, while providing
 * honest fallbacks for network (status 0) and 500 server errors.
 */
export const describeRegisterError = (err: unknown): string => {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the AutiCare server. Check that the API is running and try again.';
    }
    if (err.status === 409) {
      return err.error?.error?.message ?? 'An account with this email address already exists.';
    }
    if (err.error?.error?.message) {
      return err.error.error.message;
    }
    if (err.status >= 500) {
      return `Server error (${err.status}). Please try again in a moment.`;
    }
  }
  return 'Registration failed. Please review the form and try again.';
};
