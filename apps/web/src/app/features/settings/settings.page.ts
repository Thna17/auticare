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
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import type { ParentResponse, UpdateMyProfileRequest } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import type { FontSizeScale } from '../../core/preferences/preferences.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { I18nService } from '../../core/i18n/i18n.service';

export type RoleSettingsContext = {
  eyebrow: string;
  ctaLabel: string;
  ctaPath: string;
  workspaceTitle: string;
  actionTitle: string;
  actionLabel: string;
  actionPath: string;
  tipTitle: string;
  tipText: string;
};

export const roleConfigs: Record<string, RoleSettingsContext> = {
  PARENT: {
    eyebrow: 'Parent profile',
    ctaLabel: 'Manage child profiles',
    ctaPath: '/children',
    workspaceTitle: 'Care workspace',
    actionTitle: 'Review child profiles',
    actionLabel: 'Open children',
    actionPath: '/children',
    tipTitle: 'Child support tip',
    tipText:
      'Keep child support notes specific and practical. Schools and care teams can use clear context more easily than long narrative notes.',
  },
  SCHOOL: {
    eyebrow: 'School staff profile',
    ctaLabel: 'Manage school profile',
    ctaPath: '/schools/profile',
    workspaceTitle: 'School workspace',
    actionTitle: 'Student enrollments',
    actionLabel: 'View enrollments',
    actionPath: '/schools/enrollments',
    tipTitle: 'Classroom observation tip',
    tipText:
      'Document observations right after classroom learning sessions to provide accurate developmental context for parents and specialists.',
  },
  HOSPITAL: {
    eyebrow: 'Hospital coordinator profile',
    ctaLabel: 'Manage hospital profile',
    ctaPath: '/hospital/profile',
    workspaceTitle: 'Hospital workspace',
    actionTitle: 'Specialist team',
    actionLabel: 'Manage doctors',
    actionPath: '/hospital/doctors',
    tipTitle: 'Specialist coordination tip',
    tipText:
      'Keep doctor schedules and available visit hours up to date to minimize booking delays and appointment rescheduling.',
  },
  ADMIN: {
    eyebrow: 'System administrator profile',
    ctaLabel: 'Manage institutions',
    ctaPath: '/schools/admin',
    workspaceTitle: 'Platform administration',
    actionTitle: 'Hospital network',
    actionLabel: 'Manage hospitals',
    actionPath: '/hospitals/admin',
    tipTitle: 'Platform governance note',
    tipText:
      'Regularly audit registered schools and hospital partners to preserve verified clinical data integrity and family safety.',
  },
};

@Component({
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UiFieldComponent,
    UiMessageComponent,
    AccessibleFormDirective,
  ],
  template: `
    <!-- Profile Hero -->
    <section class="profile-hero">
      <div class="identity">
        <div class="avatar" aria-hidden="true">{{ initials() }}</div>
        <div>
          <p class="eyebrow">{{ roleConfig().eyebrow }}</p>
          <h1>{{ displayName() }}</h1>
          <p class="email-subtext">{{ parent()?.email || 'Loading account details...' }}</p>
        </div>
      </div>
      <a class="primary-link" [routerLink]="roleConfig().ctaPath">{{ roleConfig().ctaLabel }}</a>
    </section>

    <!-- Summary Metrics Grid -->
    <section class="summary-grid" [attr.aria-label]="roleConfig().eyebrow + ' summary'">
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
      <article>
        <span>Sensory suite</span>
        <strong class="sensory-status-text">{{ activeSensoryStatus() }}</strong>
      </article>
    </section>

    <div class="content-grid">
      <div class="panels-column">
        <!-- 1. Account Details Section -->
        <section class="profile-panel" aria-labelledby="account-title">
          <header class="panel-header">
            <div class="header-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h2 id="account-title">Account details</h2>
              <p>
                Your profile information is used across child profiles, screening assessments, and
                school reports.
              </p>
            </div>
          </header>

          <form [formGroup]="form" (ngSubmit)="save()" acAccessibleForm novalidate>
            <div class="field-grid">
              <ac-ui-field
                label="First name"
                [required]="true"
                [error]="showError('firstName') ? 'First name is required.' : null"
              >
                <input formControlName="firstName" autocomplete="given-name" />
              </ac-ui-field>
              <ac-ui-field
                label="Last name"
                [required]="true"
                [error]="showError('lastName') ? 'Last name is required.' : null"
              >
                <input formControlName="lastName" autocomplete="family-name" />
              </ac-ui-field>
              <ac-ui-field label="Phone number" [optional]="true">
                <input formControlName="phoneNumber" autocomplete="tel" inputmode="tel" />
              </ac-ui-field>
              <ac-ui-field label="Social media" [optional]="true">
                <input formControlName="socialMediaAccount" />
              </ac-ui-field>
              <ac-ui-field
                label="Email address"
                hint="Your email is your sign-in and cannot be changed here."
                [full]="true"
              >
                <input [value]="parent()?.email || ''" readonly />
              </ac-ui-field>
            </div>

            @if (saveError(); as problem) {
              <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
            }
            @if (saved()) {
              <ac-ui-message tone="success">Your profile has been updated.</ac-ui-message>
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

        <!-- 2. Change Password Section -->
        <section class="profile-panel" aria-labelledby="password-title">
          <header class="panel-header">
            <div class="header-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h2 id="password-title">Change password</h2>
              <p>Update your account password. New password must be at least 12 characters long.</p>
            </div>
          </header>

          <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" acAccessibleForm novalidate>
            <div class="field-grid">
              <ac-ui-field
                label="Current password"
                [required]="true"
                [full]="true"
                [error]="
                  showPasswordError('currentPassword') ? getPasswordError('currentPassword') : null
                "
              >
                <div class="password-input-wrap">
                  <input
                    [type]="showCurrentPass() ? 'text' : 'password'"
                    formControlName="currentPassword"
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="visibility-toggle"
                    (click)="showCurrentPass.set(!showCurrentPass())"
                    [attr.aria-label]="
                      showCurrentPass() ? 'Hide current password' : 'Show current password'
                    "
                  >
                    @if (showCurrentPass()) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path
                          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        ></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    }
                  </button>
                </div>
              </ac-ui-field>

              <ac-ui-field
                label="New password"
                [required]="true"
                hint="Minimum 12 characters"
                [error]="showPasswordError('newPassword') ? getPasswordError('newPassword') : null"
              >
                <div class="password-input-wrap">
                  <input
                    [type]="showNewPass() ? 'text' : 'password'"
                    formControlName="newPassword"
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    class="visibility-toggle"
                    (click)="showNewPass.set(!showNewPass())"
                    [attr.aria-label]="showNewPass() ? 'Hide new password' : 'Show new password'"
                  >
                    @if (showNewPass()) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path
                          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        ></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    }
                  </button>
                </div>
              </ac-ui-field>

              <ac-ui-field
                label="Confirm new password"
                [required]="true"
                [error]="
                  showPasswordError('confirmPassword') ? getPasswordError('confirmPassword') : null
                "
              >
                <div class="password-input-wrap">
                  <input
                    [type]="showConfirmPass() ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    class="visibility-toggle"
                    (click)="showConfirmPass.set(!showConfirmPass())"
                    [attr.aria-label]="
                      showConfirmPass() ? 'Hide confirmed password' : 'Show confirmed password'
                    "
                  >
                    @if (showConfirmPass()) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path
                          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        ></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    }
                  </button>
                </div>
              </ac-ui-field>
            </div>

            @if (passwordError(); as problem) {
              <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
            }
            @if (passwordSaved()) {
              <ac-ui-message tone="success"
                >Your password has been changed successfully.</ac-ui-message
              >
            }

            <div class="form-actions">
              <button
                type="submit"
                class="save-btn"
                [disabled]="passwordSaving() || passwordForm.pristine"
              >
                {{ passwordSaving() ? 'Updating…' : 'Update password' }}
              </button>
              <button
                type="button"
                class="reset-btn"
                [disabled]="passwordSaving() || passwordForm.pristine"
                (click)="resetPasswordForm()"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <!-- 3. Notification Preferences Section -->
        <section class="profile-panel" aria-labelledby="notifications-title">
          <header class="panel-header">
            <div class="header-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div>
              <h2 id="notifications-title">Notification preferences</h2>
              <p>
                Control which alerts and communications you receive across your email and dashboard.
              </p>
            </div>
          </header>

          <form [formGroup]="notificationForm" (ngSubmit)="saveNotifications()" novalidate>
            <div class="preferences-list">
              <label class="toggle-card">
                <div class="toggle-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div class="toggle-info">
                  <span class="toggle-title">Appointment alerts</span>
                  <span class="toggle-desc"
                    >Notifications for upcoming clinical visits, specialist confirmations, and
                    schedule updates.</span
                  >
                </div>
                <div class="toggle-action">
                  <input
                    type="checkbox"
                    formControlName="appointmentAlerts"
                    class="toggle-checkbox"
                  />
                </div>
              </label>

              <label class="toggle-card">
                <div class="toggle-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div class="toggle-info">
                  <span class="toggle-title">School reports</span>
                  <span class="toggle-desc"
                    >Alerts when teachers and school therapists file new developmental observation
                    notes.</span
                  >
                </div>
                <div class="toggle-action">
                  <input type="checkbox" formControlName="schoolReports" class="toggle-checkbox" />
                </div>
              </label>

              <label class="toggle-card">
                <div class="toggle-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <div class="toggle-info">
                  <span class="toggle-title">System announcements</span>
                  <span class="toggle-desc"
                    >Important updates about the AutiCare platform, clinical care guides, and
                    security.</span
                  >
                </div>
                <div class="toggle-action">
                  <input
                    type="checkbox"
                    formControlName="systemAnnouncements"
                    class="toggle-checkbox"
                  />
                </div>
              </label>
            </div>

            @if (notificationSaved()) {
              <ac-ui-message tone="success"
                >Your notification preferences have been saved.</ac-ui-message
              >
            }

            <div class="form-actions">
              <button
                type="submit"
                class="save-btn"
                [disabled]="notificationSaving() || notificationForm.pristine"
              >
                {{ notificationSaving() ? 'Saving…' : 'Save notification preferences' }}
              </button>
            </div>
          </form>
        </section>

        <!-- 4. Accessibility & Sensory Suite Section -->
        <section class="profile-panel" aria-labelledby="accessibility-title">
          <header class="panel-header">
            <div class="header-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
            </div>
            <div>
              <h2 id="accessibility-title">Accessibility preferences</h2>
              <p>
                Customize visual comfort, motion behaviors, typography scaling, and sensory
                saturation.
              </p>
            </div>
          </header>

          <form
            [formGroup]="preferencesForm"
            (ngSubmit)="savePreferences()"
            acAccessibleForm
            novalidate
          >
            <div class="preferences-list">
              <!-- Reduced Motion Toggle -->
              <label class="toggle-card">
                <div class="toggle-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
                <div class="toggle-info">
                  <span class="toggle-title">Reduced motion</span>
                  <span class="toggle-desc"
                    >Minimizes smooth scrolling and non-essential UI animations.</span
                  >
                </div>
                <div class="toggle-action">
                  <input type="checkbox" formControlName="reducedMotion" class="toggle-checkbox" />
                </div>
              </label>

              <!-- High Contrast Theme Toggle -->
              <label class="toggle-card">
                <div class="toggle-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2v20"></path>
                  </svg>
                </div>
                <div class="toggle-info">
                  <span class="toggle-title">High contrast mode</span>
                  <span class="toggle-desc"
                    >Enhances text clarity, outlines, and border contrast across the
                    workspace.</span
                  >
                </div>
                <div class="toggle-action">
                  <input type="checkbox" formControlName="highContrast" class="toggle-checkbox" />
                </div>
              </label>

              <!-- Calming Color Palette Mode -->
              <label class="toggle-card">
                <div class="toggle-icon-wrap" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </svg>
                </div>
                <div class="toggle-info">
                  <span class="toggle-title">Calming color palette mode</span>
                  <span class="toggle-desc"
                    >Low-saturation, soft-tinted sensory friendly palette designed for visual
                    comfort and reduced sensory fatigue.</span
                  >
                </div>
                <div class="toggle-action">
                  <input type="checkbox" formControlName="calmingPalette" class="toggle-checkbox" />
                </div>
              </label>

              <!-- Font Size Scaling Selector -->
              <div class="font-scale-group">
                <div class="scale-header">
                  <span class="toggle-title">Font size scaling</span>
                  <span class="toggle-desc"
                    >Responsive typography scale updating root rem base across all pages.</span
                  >
                </div>
                <div class="font-scale-chips" role="radiogroup" aria-label="Font size scaling">
                  <button
                    type="button"
                    class="scale-chip"
                    [class.active]="currentFontSize() === 'normal'"
                    (click)="setFontSize('normal')"
                  >
                    <span class="chip-sample sample-normal">A</span>
                    <span class="chip-label">Normal</span>
                    <span class="chip-size">16px</span>
                  </button>
                  <button
                    type="button"
                    class="scale-chip"
                    [class.active]="currentFontSize() === 'large'"
                    (click)="setFontSize('large')"
                  >
                    <span class="chip-sample sample-large">A</span>
                    <span class="chip-label">Large</span>
                    <span class="chip-size">18px</span>
                  </button>
                  <button
                    type="button"
                    class="scale-chip"
                    [class.active]="currentFontSize() === 'xlarge'"
                    (click)="setFontSize('xlarge')"
                  >
                    <span class="chip-sample sample-xlarge">A</span>
                    <span class="chip-label">Extra Large</span>
                    <span class="chip-size">20px</span>
                  </button>
                </div>
              </div>

              <!-- Preferred Language Selector -->
              <div class="language-field">
                <ac-ui-field
                  label="Preferred language"
                  [full]="true"
                  hint="Select the language used for interface notifications and content."
                >
                  <select formControlName="preferredLanguage" class="language-select">
                    <option value="km">🇰🇭 ភាសាខ្មែរ (Khmer)</option>
                    <option value="en">English (US)</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </ac-ui-field>
              </div>
            </div>

            @if (preferencesError(); as problem) {
              <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
            }
            @if (preferencesSaved()) {
              <ac-ui-message tone="success">Accessibility preferences saved.</ac-ui-message>
            }

            <div class="form-actions">
              <button
                type="submit"
                class="save-btn"
                [disabled]="preferencesSaving() || preferencesForm.pristine"
              >
                {{ preferencesSaving() ? 'Saving…' : 'Save preferences' }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <!-- Right Column Support & Actions Sidebar -->
      <aside class="side-panel" aria-label="Profile support">
        <h2>{{ roleConfig().workspaceTitle }}</h2>

        <div class="support-row">
          <span>Next useful action</span>
          <strong>{{ roleConfig().actionTitle }}</strong>
          <a [routerLink]="roleConfig().actionPath">{{ roleConfig().actionLabel }}</a>
        </div>

        <div class="support-row">
          <span>Security action</span>
          <strong>Password recovery ready</strong>
          <a routerLink="/forgot-password">Reset password</a>
        </div>

        <div class="sensory-summary-card">
          <div class="summary-card-header">
            <span class="summary-card-icon" aria-hidden="true">🌱</span>
            <h3>Sensory Environment</h3>
          </div>
          <div class="summary-badge-list">
            <span class="sensory-badge">Contrast: {{ contrastLabel() }}</span>
            <span class="sensory-badge">Motion: {{ motionLabel() }}</span>
            <span class="sensory-badge">Scale: {{ fontScaleLabel() }}</span>
            <span class="sensory-badge">Palette: {{ paletteLabel() }}</span>
          </div>
        </div>

        <div class="calm-note">
          <h3>{{ roleConfig().tipTitle }}</h3>
          <p>{{ roleConfig().tipText }}</p>
        </div>
      </aside>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .profile-hero {
        border-radius: 16px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: 0 4px 20px rgb(0 30 43 / 0.04);
        padding: 28px 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 20px;
      }

      .identity {
        display: flex;
        align-items: center;
        gap: 20px;
        min-width: 0;
      }

      .avatar {
        width: 72px;
        height: 72px;
        border-radius: 20px;
        background: var(--ac-color-sky-tint);
        color: var(--ac-color-ink-j);
        display: grid;
        place-items: center;
        font-size: 26px;
        font-weight: var(--ac-font-weight-bold);
        flex: 0 0 auto;
        box-shadow: 0 2px 8px rgb(0 30 43 / 0.06);
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
        letter-spacing: 0.04em;
        margin-bottom: 6px;
      }

      h1 {
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: 1.2;
      }

      .email-subtext {
        color: var(--ac-color-text-body);
        font-size: 14px;
        margin-top: 6px;
      }

      .primary-link {
        min-height: 44px;
        border-radius: 999px;
        background: var(--ac-color-primary);
        color: var(--ac-color-ink-d);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 22px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
        transition: all 120ms ease;
      }

      .primary-link:hover {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .summary-grid article {
        border: 1px solid var(--ac-color-border);
        border-radius: 14px;
        background: var(--ac-color-surface);
        box-shadow: 0 2px 10px rgb(0 30 43 / 0.03);
        padding: 18px 20px;
        display: grid;
        gap: 6px;
      }

      .summary-grid span,
      .support-row span {
        color: var(--ac-color-text-muted);
        font-size: 13px;
        font-weight: var(--ac-font-weight-medium);
      }

      .summary-grid strong,
      .support-row strong {
        color: var(--ac-color-text-strong);
        font-size: 17px;
        font-weight: var(--ac-font-weight-bold);
      }

      .sensory-status-text {
        color: var(--ac-color-action-deep);
      }

      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(290px, 0.75fr);
        gap: 24px;
        align-items: start;
      }

      .panels-column {
        display: grid;
        gap: 24px;
      }

      .profile-panel,
      .side-panel {
        border: 1px solid var(--ac-color-border);
        border-radius: 18px;
        background: var(--ac-color-surface);
        box-shadow: 0 4px 18px rgb(0 30 43 / 0.04);
        padding: 28px;
        display: grid;
        gap: 22px;
      }

      .panel-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: 18px;
      }

      .header-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .header-icon svg {
        width: 20px;
        height: 20px;
      }

      h2 {
        color: var(--ac-color-text-strong);
        font-size: 20px;
        font-weight: var(--ac-font-weight-bold);
        line-height: 1.3;
        margin-bottom: 4px;
      }

      .panel-header p,
      .calm-note p {
        color: var(--ac-color-text-body);
        font-size: 14px;
        line-height: 1.5;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      input[readonly] {
        background: var(--ac-color-tint-blue-faint);
        color: var(--ac-color-text-muted);
      }

      input {
        width: 100%;
        min-height: 50px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 10px;
        background: var(--ac-color-tint-blue-pale);
        color: var(--ac-color-text-strong);
        font: inherit;
        padding: 0 16px;
        transition: border-color 140ms ease;
      }

      input:focus {
        border-color: var(--ac-color-action);
        outline: none;
      }

      .password-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .password-input-wrap input {
        padding-right: 46px;
      }

      .visibility-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        padding: 4px;
        color: var(--ac-color-text-muted);
        cursor: pointer;
        display: grid;
        place-items: center;
        border-radius: 6px;
      }

      .visibility-toggle:hover {
        color: var(--ac-color-action);
      }

      .visibility-toggle svg {
        width: 18px;
        height: 18px;
      }

      /* Toggle Cards */
      .preferences-list {
        display: grid;
        gap: 14px;
      }

      .toggle-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 18px;
        border: 1px solid var(--ac-color-border);
        border-radius: 14px;
        background: var(--ac-color-tint-blue-pale);
        cursor: pointer;
        transition: all 120ms ease;
      }

      .toggle-card:hover {
        border-color: var(--ac-color-action);
        background: var(--ac-color-tint-blue-faint);
      }

      .toggle-icon-wrap {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        display: grid;
        place-items: center;
        flex-shrink: 0;
        color: var(--ac-color-action);
      }

      .toggle-icon-wrap svg {
        width: 18px;
        height: 18px;
      }

      .toggle-info {
        display: grid;
        gap: 4px;
        flex: 1;
        min-width: 0;
      }

      .toggle-title {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        font-size: 15px;
      }

      .toggle-desc {
        font-size: 13px;
        color: var(--ac-color-text-body);
        line-height: 1.45;
      }

      .toggle-action {
        flex-shrink: 0;
        display: flex;
        align-items: center;
      }

      .toggle-checkbox {
        width: 22px;
        height: 22px;
        min-height: 22px;
        cursor: pointer;
        accent-color: var(--ac-color-action);
      }

      /* Font Scaling Group */
      .font-scale-group {
        border: 1px solid var(--ac-color-border);
        border-radius: 14px;
        background: var(--ac-color-tint-blue-pale);
        padding: 18px;
        display: grid;
        gap: 12px;
      }

      .scale-header {
        display: grid;
        gap: 4px;
      }

      .font-scale-chips {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .scale-chip {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 8px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: 12px;
        background: var(--ac-color-surface);
        cursor: pointer;
        transition: all 120ms ease;
      }

      .scale-chip:hover {
        border-color: var(--ac-color-action);
      }

      .scale-chip.active {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
        box-shadow: 0 2px 8px rgb(0 30 43 / 0.06);
      }

      .chip-sample {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        line-height: 1;
      }

      .sample-normal {
        font-size: 16px;
      }

      .sample-large {
        font-size: 20px;
      }

      .sample-xlarge {
        font-size: 24px;
      }

      .chip-label {
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .chip-size {
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .language-select {
        width: 100%;
        min-height: 50px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 10px;
        background: var(--ac-color-tint-blue-pale);
        color: var(--ac-color-text-strong);
        font: inherit;
        padding: 0 16px;
        cursor: pointer;
      }

      .language-select:focus {
        border-color: var(--ac-color-action);
        outline: none;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .save-btn,
      .reset-btn {
        min-height: 46px;
        padding: 0 22px;
        border-radius: 10px;
        font-weight: var(--ac-font-weight-bold);
        font-size: 14px;
        cursor: pointer;
        transition: all 120ms ease;
      }

      .save-btn {
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .save-btn:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
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

      /* Sidebar Elements */
      .support-row {
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: 16px;
        display: grid;
        gap: 6px;
      }

      .support-row a {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
        font-size: 14px;
      }

      .support-row a:hover {
        text-decoration: underline;
      }

      .sensory-summary-card {
        border: 1px solid var(--ac-color-border);
        border-radius: 12px;
        background: var(--ac-color-tint-blue-pale);
        padding: 16px;
        display: grid;
        gap: 10px;
      }

      .summary-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .summary-card-header h3 {
        font-size: 15px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .summary-badge-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .sensory-badge {
        font-size: 11px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-action-deep);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        padding: 4px 8px;
        border-radius: 6px;
      }

      .calm-note {
        border-radius: 12px;
        background: var(--ac-color-sage-light);
        padding: 18px;
        display: grid;
        gap: 8px;
      }

      .calm-note h3 {
        font-size: 16px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      @media (max-width: 920px) {
        .profile-hero {
          flex-direction: column;
          align-items: flex-start;
        }

        .summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .content-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 600px) {
        .summary-grid,
        .field-grid,
        .font-scale-chips {
          grid-template-columns: 1fr;
        }

        .identity {
          flex-direction: column;
          align-items: flex-start;
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
  protected readonly preferences = inject(PreferencesService);
  protected readonly i18n = inject(I18nService, { optional: true });

  readonly parent = this.auth.parent;
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly passwordSaving = signal(false);
  protected readonly passwordSaved = signal(false);
  protected readonly passwordError = signal<string | null>(null);

  protected readonly showCurrentPass = signal(false);
  protected readonly showNewPass = signal(false);
  protected readonly showConfirmPass = signal(false);

  protected readonly notificationSaving = signal(false);
  protected readonly notificationSaved = signal(false);

  protected readonly preferencesSaving = signal(false);
  protected readonly preferencesSaved = signal(false);
  protected readonly preferencesError = signal<string | null>(null);

  readonly currentFontSize = signal<FontSizeScale>('normal');
  readonly currentCalmingPalette = signal<boolean>(false);
  readonly currentHighContrast = signal<boolean>(false);
  readonly currentReducedMotion = signal<boolean>(false);

  protected readonly form = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.maxLength(80)]),
    lastName: this.fb.control('', [Validators.required, Validators.maxLength(80)]),
    phoneNumber: this.fb.control('', [Validators.maxLength(32)]),
    socialMediaAccount: this.fb.control('', [Validators.maxLength(160)]),
  });

  protected readonly passwordForm = this.fb.group(
    {
      currentPassword: this.fb.control('', [Validators.required]),
      newPassword: this.fb.control('', [Validators.required, Validators.minLength(12)]),
      confirmPassword: this.fb.control('', [Validators.required]),
    },
    {
      validators: (group) => {
        const newPass = group.get('newPassword')?.value;
        const confirmPass = group.get('confirmPassword')?.value;
        return newPass && confirmPass && newPass !== confirmPass
          ? { passwordMismatch: true }
          : null;
      },
    },
  );

  protected readonly notificationForm = this.fb.group({
    appointmentAlerts: this.fb.control(true),
    schoolReports: this.fb.control(true),
    systemAnnouncements: this.fb.control(true),
  });

  protected readonly preferencesForm = this.fb.group({
    reducedMotion: this.fb.control(false),
    highContrast: this.fb.control(false),
    preferredLanguage: this.fb.control('en'),
    fontSize: this.fb.control<FontSizeScale>('normal'),
    calmingPalette: this.fb.control(false),
  });

  constructor() {
    effect(() => {
      const parent = this.parent();
      if (parent && this.form.pristine) this.patchFrom(parent);
    });

    // Apply live changes to document root as user toggles preferences
    this.preferencesForm.valueChanges.subscribe((val) => {
      this.currentFontSize.set((val.fontSize as FontSizeScale) ?? 'normal');
      this.currentCalmingPalette.set(Boolean(val.calmingPalette));
      this.currentHighContrast.set(Boolean(val.highContrast));
      this.currentReducedMotion.set(Boolean(val.reducedMotion));

      this.preferences.applyToRoot(
        Boolean(val.reducedMotion),
        Boolean(val.highContrast),
        val.preferredLanguage ?? 'en',
      );
      if (this.preferences.applySensorySuite) {
        this.preferences.applySensorySuite(
          (val.fontSize as FontSizeScale) ?? 'normal',
          Boolean(val.calmingPalette),
        );
      }
    });
  }

  readonly roleConfig = computed<RoleSettingsContext>(() => {
    const role = this.parent()?.role ?? 'PARENT';
    return roleConfigs[role] ?? roleConfigs['PARENT'];
  });

  readonly displayName = computed(() => {
    const parent = this.parent();
    if (!parent) return this.roleConfig().eyebrow;
    const name = `${parent.firstName} ${parent.lastName}`.trim();
    return name || this.roleConfig().eyebrow;
  });

  readonly activeSensoryStatus = computed(() => {
    if (this.currentHighContrast()) return 'High Contrast';
    if (this.currentCalmingPalette()) return 'Calming Palette';
    if (this.currentReducedMotion()) return 'Quiet Motion';
    return 'Standard';
  });

  readonly contrastLabel = computed(() => (this.currentHighContrast() ? 'Enhanced' : 'Standard'));

  readonly motionLabel = computed(() => (this.currentReducedMotion() ? 'Reduced' : 'Smooth'));

  readonly fontScaleLabel = computed(() => {
    const scale = this.currentFontSize();
    if (scale === 'large') return '18px';
    if (scale === 'xlarge') return '20px';
    return '16px';
  });

  readonly paletteLabel = computed(() => (this.currentCalmingPalette() ? 'Calming' : 'Natural'));

  ngOnInit() {
    if (!this.parent()) this.auth.loadCurrentUser().subscribe();

    // Initialize notification preferences from service if available
    if (this.preferences.appointmentAlerts) {
      this.notificationForm.patchValue({
        appointmentAlerts: this.preferences.appointmentAlerts(),
        schoolReports: this.preferences.schoolReports(),
        systemAnnouncements: this.preferences.systemAnnouncements(),
      });
    }

    this.preferences.loadPreferences().subscribe({
      next: (res) => {
        if (res.preference && this.preferencesForm.pristine) {
          this.preferencesForm.patchValue({
            reducedMotion: res.preference.reducedMotion,
            highContrast: res.preference.highContrast,
            preferredLanguage: res.preference.preferredLanguage,
            fontSize: this.preferences.fontSize ? this.preferences.fontSize() : 'normal',
            calmingPalette: this.preferences.calmingPalette
              ? this.preferences.calmingPalette()
              : false,
          });
        }
      },
    });
  }

  initials(): string {
    const parent = this.parent();
    if (!parent) return 'AC';
    return `${parent.firstName.slice(0, 1)}${parent.lastName.slice(0, 1)}`.toUpperCase();
  }

  setFontSize(scale: FontSizeScale): void {
    this.preferencesForm.controls.fontSize.setValue(scale);
    this.preferencesForm.controls.fontSize.markAsDirty();
    this.currentFontSize.set(scale);
  }

  protected showError(control: 'firstName' | 'lastName'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.dirty || field.touched);
  }

  protected showPasswordError(
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
  ): boolean {
    const ctrl = this.passwordForm.controls[field];
    if (ctrl.invalid && (ctrl.dirty || ctrl.touched)) return true;
    if (
      field === 'confirmPassword' &&
      this.passwordForm.hasError('passwordMismatch') &&
      (ctrl.dirty || ctrl.touched)
    ) {
      return true;
    }
    return false;
  }

  protected getPasswordError(
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
  ): string | null {
    const ctrl = this.passwordForm.controls[field];
    if (field === 'currentPassword' && ctrl.hasError('required')) {
      return 'Current password is required.';
    }
    if (field === 'newPassword') {
      if (ctrl.hasError('required')) return 'New password is required.';
      if (ctrl.hasError('minlength')) return 'New password must be at least 12 characters.';
    }
    if (field === 'confirmPassword') {
      if (ctrl.hasError('required')) return 'Please confirm your new password.';
      if (this.passwordForm.hasError('passwordMismatch')) return 'Passwords do not match.';
    }
    return null;
  }

  protected resetPasswordForm(): void {
    this.passwordForm.reset();
    this.passwordError.set(null);
    this.passwordSaved.set(false);
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
      this.saveError.set('Fix the highlighted fields before saving your profile.');
      return;
    }

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

  protected savePassword(): void {
    this.passwordSaved.set(false);
    this.passwordError.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.passwordError.set('Fix the highlighted fields before updating your password.');
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.passwordSaving.set(true);

    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSaved.set(true);
        this.passwordForm.reset();
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        this.passwordSaving.set(false);
        this.passwordError.set(
          err?.error?.error?.message ??
            'Your password could not be changed. Please verify your current password.',
        );
      },
    });
  }

  protected saveNotifications(): void {
    this.notificationSaved.set(false);
    this.notificationSaving.set(true);

    const val = this.notificationForm.getRawValue();
    if (this.preferences.updateNotificationPreferences) {
      this.preferences.updateNotificationPreferences(val);
    }

    setTimeout(() => {
      this.notificationSaving.set(false);
      this.notificationSaved.set(true);
      this.notificationForm.markAsPristine();
    }, 150);
  }

  protected savePreferences(): void {
    this.preferencesSaved.set(false);
    this.preferencesError.set(null);

    const val = this.preferencesForm.getRawValue();
    this.preferencesSaving.set(true);

    if (this.preferences.updateSensoryPreferences) {
      this.preferences.updateSensoryPreferences(val.fontSize, val.calmingPalette);
    }

    this.preferences
      .updatePreferences({
        reducedMotion: val.reducedMotion,
        highContrast: val.highContrast,
        preferredLanguage: val.preferredLanguage,
      })
      .subscribe({
        next: (res) => {
          this.preferencesSaving.set(false);
          this.preferencesSaved.set(true);
          this.preferencesForm.patchValue({
            reducedMotion: res.preference.reducedMotion,
            highContrast: res.preference.highContrast,
            preferredLanguage: res.preference.preferredLanguage,
          });
          if (
            this.i18n &&
            (res.preference.preferredLanguage === 'km' || res.preference.preferredLanguage === 'en')
          ) {
            this.i18n.setLanguage(res.preference.preferredLanguage);
          }
          this.preferencesForm.markAsPristine();
        },
        error: (err: { error?: { error?: { message?: string } } }) => {
          this.preferencesSaving.set(false);
          this.preferencesError.set(
            err?.error?.error?.message ??
              'Your accessibility preferences could not be saved. Please try again.',
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
