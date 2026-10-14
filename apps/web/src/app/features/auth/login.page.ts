import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';

export type AuthRoleOption = 'PARENT' | 'SCHOOL' | 'HOSPITAL' | 'ADMIN';

export const DEMO_CREDENTIALS: Record<
  AuthRoleOption,
  { email: string; password: string; label: string }
> = {
  PARENT: {
    email: 'demo.parent@auticare.local',
    password: 'AutiCareDemoPassword123',
    label: 'Demo Parent',
  },
  SCHOOL: {
    email: 'school@auticare.local',
    password: 'AutiCareSchoolPassword123',
    label: 'Demo School Staff',
  },
  HOSPITAL: {
    email: 'hospital@auticare.local',
    password: 'AutiCareHospitalPassword123',
    label: 'Demo Hospital Coordinator',
  },
  ADMIN: {
    email: 'admin@auticare.local',
    password: 'AutiCareAdminPassword123',
    label: 'Demo Admin',
  },
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
    <main class="login-page">
      <section class="form-panel" aria-labelledby="login-title">
        <div class="form-shell">
          <a class="brand" routerLink="/" aria-label="AutiCare home">
            <img src="/images/auticare-logo.jpg" alt="" aria-hidden="true" width="36" height="34" />
            <span>AutiCare</span>
          </a>

          <header class="login-header">
            <h1 id="login-title">Welcome back</h1>
            <p>Sign in to continue supporting your child and clinical team.</p>
          </header>

          <div class="role-selector" role="radiogroup" aria-label="Sign in role perspective">
            <span class="role-selector-label">I am signing in as:</span>
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
                <span>Parent / Caregiver</span>
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

              <button
                type="button"
                role="radio"
                class="role-chip"
                [class.active]="selectedRole() === 'ADMIN'"
                [attr.aria-checked]="selectedRole() === 'ADMIN'"
                (click)="selectRole('ADMIN')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
                <span>System Admin</span>
              </button>
            </div>
          </div>

          <div class="role-hint" role="note">
            @if (selectedRole() === 'PARENT') {
              <p>
                <strong>Family Care Portal:</strong> Access developmental screenings, appointments,
                and sensory home activities.
              </p>
            } @else if (selectedRole() === 'SCHOOL') {
              <p>
                <strong>Education Portal:</strong> Manage student enrollments, developmental
                observation reports, and classroom adaptations.
              </p>
            } @else if (selectedRole() === 'HOSPITAL') {
              <p>
                <strong>Clinical Portal:</strong> Oversee specialist doctor schedules, clinic triage
                queues, and patient consultations.
              </p>
            } @else {
              <p>
                <strong>System Administration:</strong> Manage institutions, audit school and
                hospital registrations, and review platform telemetry.
              </p>
            }
            <button
              type="button"
              class="demo-fill-btn"
              (click)="fillDemoCredentials()"
              aria-label="Fill demo credentials for this role"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
              <span>Use demo credentials ({{ demoCredentials[selectedRole()].email }})</span>
            </button>
          </div>

          <form
            class="login-form"
            [formGroup]="form"
            (ngSubmit)="submit()"
            acAccessibleForm
            novalidate
          >
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
                placeholder="parent@example.com"
              />
            </ac-ui-field>

            <ac-ui-field
              label="Password"
              [required]="true"
              [error]="
                form.controls.password.touched && form.controls.password.invalid
                  ? 'Enter your password.'
                  : null
              "
            >
              <a fieldAction routerLink="/forgot-password">Forgot password?</a>
              <div class="password-field">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
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

            @if (error()) {
              <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
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
            <span>Secure, private family support.</span>
          </div>
        </div>
      </section>

      <section class="hero-panel" aria-label="AutiCare care network">
        <picture>
          <source srcset="/images/signup-hero.webp" type="image/webp" />
          <img src="/images/signup-hero.png" alt="" width="1376" height="768" loading="lazy" />
        </picture>
        <div class="hero-wash" aria-hidden="true"></div>
        <aside class="support-card">
          <div class="heart-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M12 21s-7-4.4-9.1-8.3C.9 8 .7 4.8 3.2 3.2c2.2-1.4 5-.6 6.4 1.5L12 8l2.4-3.3c1.5-2.1 4.2-2.9 6.4-1.5 2.5 1.6 2.3 4.8.3 8.5C19 15.6 12 20 12 20Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </div>
          <h2>A Connected Circle of Care</h2>
          <p>
            Bridging parents, developmental pediatricians, therapists, and educators into one
            supportive continuum for every neurodivergent child.
          </p>
          <div class="dots" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </aside>
      </section>
    </main>

    <footer class="login-footer">
      <p>(c) {{ currentYear }} AutiCare. All rights reserved.</p>
      <nav aria-label="Login footer links">
        <a routerLink="/privacy">Privacy Policy</a>
        <a routerLink="/terms">Terms</a>
        <a routerLink="/crisis">Crisis Resources</a>
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
        background: var(--ac-color-background);
        color: var(--ac-color-text-strong);
      }

      .login-page {
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
        width: min(100%, 540px);
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
        width: 36px;
        height: 36px;
        border-radius: 999px;
        object-fit: cover;
        box-shadow: 0 0 0 1px var(--ac-color-sky-light);
      }

      .brand span {
        font-size: var(--ac-type-page-title);
        line-height: 1;
        font-weight: var(--ac-font-weight-bold);
      }

      .login-header {
        margin-bottom: 28px;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      .login-header h1 {
        color: var(--ac-color-text-strong);
        font-size: 32px;
        line-height: 1.25;
        font-weight: var(--ac-font-weight-bold);
        margin-bottom: 8px;
      }

      .login-header p {
        color: var(--ac-color-text-body);
        font-size: 16px;
        line-height: 1.5;
      }

      /* Role Selector Chips */
      .role-selector {
        display: grid;
        gap: 8px;
        margin-bottom: 16px;
      }

      .role-selector-label {
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-muted);
      }

      .role-chips {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }

      .role-chip {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 4px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 12px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 11.5px;
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

      .role-hint {
        border-radius: 10px;
        background: var(--ac-color-blue-tint-wash);
        border: 1px solid var(--ac-color-border-info);
        padding: 10px 14px;
        margin-bottom: 24px;
        font-size: 13px;
        line-height: 1.45;
        color: var(--ac-color-text-body);
      }

      .role-hint strong {
        color: var(--ac-color-text-strong);
      }

      .demo-fill-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        padding: 5px 10px;
        background: var(--ac-color-action-tint);
        color: var(--ac-color-action-mid);
        border: 1px dashed var(--ac-color-action-mid);
        border-radius: var(--ac-radius-sm);
        font-size: var(--ac-type-body-sm-size);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition:
          background 0.15s ease,
          border-color 0.15s ease;
      }

      .demo-fill-btn:hover {
        background: var(--ac-color-sky-light);
      }

      .demo-fill-btn svg {
        width: 14px;
        height: 14px;
      }

      /* Form */
      .login-form {
        display: grid;
        gap: 20px;
      }

      [fieldAction] {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        font-size: 14px;
      }

      [fieldAction]:hover {
        text-decoration: underline;
      }

      input {
        width: 100%;
        height: 56px;
        min-width: 0;
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

      input::placeholder {
        color: var(--ac-color-slate-text-dimmed);
        opacity: 1;
      }

      input:hover {
        border-color: var(--ac-color-slate-border-card);
      }

      input:focus {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface);
        box-shadow: 0 0 0 4px var(--ac-color-tint-blue);
        outline: none;
      }

      input[aria-invalid='true'] {
        border-color: var(--ac-color-red-600);
      }

      .password-field {
        position: relative;
      }

      .password-field input {
        padding-right: 56px;
      }

      .visibility-button {
        position: absolute;
        top: 50%;
        right: 12px;
        width: 38px;
        height: 38px;
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
        width: 22px;
        height: 22px;
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
        gap: 10px;
        font-size: 17px;
        font-weight: var(--ac-font-weight-semibold);
        line-height: 1;
        box-shadow: 0 8px 20px rgb(41 74 90 / 0.16);
        transition:
          background 160ms ease,
          transform 160ms ease,
          box-shadow 160ms ease;
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

      .divider {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 20px;
        margin: 36px 0 24px;
      }

      .divider span {
        height: 1px;
        background: var(--ac-color-border-slate);
      }

      .divider strong {
        color: var(--ac-color-slate-text-dimmed);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        letter-spacing: 3px;
      }

      .create-account {
        color: var(--ac-color-text-body);
        text-align: center;
        font-size: 15px;
        line-height: 1.5;
      }

      .create-account a {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
        margin-left: 6px;
      }

      .create-account a:hover {
        text-decoration: underline;
      }

      .trust-note {
        margin-top: 40px;
        padding-top: 24px;
        border-top: 1px solid var(--ac-color-border-slate);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-label);
        line-height: 1.4;
      }

      .trust-icon {
        width: 32px;
        height: 32px;
        flex: 0 0 auto;
        border-radius: 999px;
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-mid);
        display: grid;
        place-items: center;
      }

      .trust-icon svg {
        width: 18px;
        height: 18px;
      }

      /* Hero panel */
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
          linear-gradient(180deg, rgb(244 250 255 / 0.1), rgb(219 241 255 / 0.42)),
          linear-gradient(90deg, rgb(255 255 255 / 0.12), rgb(244 250 255 / 0.22));
      }

      .support-card {
        position: absolute;
        right: 8%;
        bottom: 8%;
        width: min(520px, 75%);
        min-height: 280px;
        border: 1px solid rgb(255 255 255 / 0.75);
        border-radius: 24px;
        background: rgb(255 255 255 / 0.8);
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

      .login-footer {
        position: relative;
        z-index: 1;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
        padding: 16px 24px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-label);
        line-height: 1.4;
      }

      .login-footer nav {
        display: inline-flex;
        gap: 24px;
      }

      .login-footer a {
        color: inherit;
        text-decoration: none;
      }

      .login-footer a:hover {
        color: var(--ac-color-action-deep);
        text-decoration: underline;
      }

      @media (min-width: 1024px) {
        .login-page {
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

        .login-header {
          margin-bottom: 22px;
        }

        .login-header h1 {
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

        .login-footer {
          flex-direction: column;
          gap: 10px;
          text-align: center;
        }

        .login-footer nav {
          gap: 16px;
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
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly selectedRole = signal<AuthRoleOption>('PARENT');
  readonly currentYear = new Date().getFullYear();
  readonly demoCredentials = DEMO_CREDENTIALS;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  selectRole(role: AuthRoleOption) {
    this.selectedRole.set(role);
  }

  fillDemoCredentials(role?: AuthRoleOption) {
    const targetRole = role ?? this.selectedRole();
    this.selectedRole.set(targetRole);
    const creds = DEMO_CREDENTIALS[targetRole];
    this.form.setValue({
      email: creds.email,
      password: creds.password,
    });
    this.error.set(null);
  }

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fix the highlighted fields before logging in.');
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (parent) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const roleTarget =
          parent.role === 'HOSPITAL'
            ? '/hospital/dashboard'
            : parent.role === 'SCHOOL'
              ? '/schools/enrollments'
              : '/dashboard';
        const target =
          returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
            ? returnUrl
            : roleTarget;
        void this.router.navigateByUrl(target);
      },
      error: (err: unknown) => {
        this.error.set(describeLoginError(err));
        this.loading.set(false);
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }
}

/**
 * Turn a failed login request into an honest message: only a 401 means the
 * credentials were rejected — network failures and server errors (e.g. the
 * database being unreachable) should not be reported as a wrong password.
 */
export const describeLoginError = (err: unknown): string => {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 401) return 'Log in failed. Check your email and password.';
    if (err.status === 0)
      return 'Cannot reach the AutiCare server. Check that the API is running and try again.';
    return `Server error (${err.status}). Please try again in a moment.`;
  }
  return 'Log in failed. Please try again.';
};
