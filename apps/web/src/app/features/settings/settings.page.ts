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

import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';

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

export const getRoleConfigs = (isKm: boolean): Record<string, RoleSettingsContext> => ({
  PARENT: {
    eyebrow: isKm ? 'ប្រវត្តិរូបអាណាព្យាបាល' : 'Parent profile',
    ctaLabel: isKm ? 'គ្រប់គ្រងប្រវត្តិរូបកុមារ' : 'Manage child profiles',
    ctaPath: '/children',
    workspaceTitle: isKm ? 'កន្លែងធ្វើការថែទាំ' : 'Care workspace',
    actionTitle: isKm ? 'ពិនិត្យប្រវត្តិរូបកុមារ' : 'Review child profiles',
    actionLabel: isKm ? 'បើកបញ្ជីកុមារ' : 'Open children',
    actionPath: '/children',
    tipTitle: isKm ? 'គន្លឹះគាំទ្រកុមារ' : 'Child support tip',
    tipText: isKm
      ? 'រក្សាកំណត់ត្រាគាំទ្រកុមារឱ្យជាក់លាក់ និងអនុវត្តបាន។ សាលារៀន និងក្រុមការងារថែទាំអាចប្រើប្រាស់បរិបទច្បាស់លាស់បានងាយស្រួលជាងកំណត់ត្រាពិពណ៌នាវែងអន្លាយ។'
      : 'Keep child support notes specific and practical. Schools and care teams can use clear context more easily than long narrative notes.',
  },
  SCHOOL: {
    eyebrow: isKm ? 'ប្រវត្តិរូបបុគ្គលិកសាលា' : 'School staff profile',
    ctaLabel: isKm ? 'គ្រប់គ្រងប្រវត្តិរូបសាលា' : 'Manage school profile',
    ctaPath: '/schools/profile',
    workspaceTitle: isKm ? 'កន្លែងធ្វើការសាលារៀន' : 'School workspace',
    actionTitle: isKm ? 'ការចុះឈ្មោះសិស្ស' : 'Student enrollments',
    actionLabel: isKm ? 'មើលការចុះឈ្មោះ' : 'View enrollments',
    actionPath: '/schools/enrollments',
    tipTitle: isKm ? 'គន្លឹះសង្កេតក្នុងថ្នាក់រៀន' : 'Classroom observation tip',
    tipText: isKm
      ? 'កត់ត្រាការសង្កេតភ្លាមៗបន្ទាប់ពីវគ្គរៀនក្នុងថ្នាក់ ដើម្បីផ្តល់បរិបទនៃការវិវត្តជាក់លាក់សម្រាប់ឪពុកម្តាយ និងអ្នកឯកទេស។'
      : 'Document observations right after classroom learning sessions to provide accurate developmental context for parents and specialists.',
  },
  HOSPITAL: {
    eyebrow: isKm ? 'ប្រវត្តិរូបអ្នកសម្របសម្រួលមន្ទីរពេទ្យ' : 'Hospital coordinator profile',
    ctaLabel: isKm ? 'គ្រប់គ្រងប្រវត្តិរូបមន្ទីរពេទ្យ' : 'Manage hospital profile',
    ctaPath: '/hospital/profile',
    workspaceTitle: isKm ? 'កន្លែងធ្វើការមន្ទីរពេទ្យ' : 'Hospital workspace',
    actionTitle: isKm ? 'ក្រុមវេជ្ជបណ្ឌិតឯកទេស' : 'Specialist team',
    actionLabel: isKm ? 'គ្រប់គ្រងវេជ្ជបណ្ឌិត' : 'Manage doctors',
    actionPath: '/hospital/doctors',
    tipTitle: isKm ? 'គន្លឹះសម្របសម្រួលអ្នកឯកទេស' : 'Specialist coordination tip',
    tipText: isKm
      ? 'រក្សាកាលវិភាគវេជ្ជបណ្ឌិត និងម៉ោងពិគ្រោះឱ្យទាន់សម័យ ដើម្បីកាត់បន្ថយការពន្យារពេលកក់ និងការកំណត់ពេលណាត់ជួបឡើងវិញ។'
      : 'Keep doctor schedules and available visit hours up to date to minimize booking delays and appointment rescheduling.',
  },
  ADMIN: {
    eyebrow: isKm ? 'ប្រវត្តិរូបអ្នកគ្រប់គ្រងប្រព័ន្ធ' : 'System administrator profile',
    ctaLabel: isKm ? 'គ្រប់គ្រងស្ថាប័ន' : 'Manage institutions',
    ctaPath: '/schools/admin',
    workspaceTitle: isKm ? 'ការគ្រប់គ្រងប្រព័ន្ធ' : 'Platform administration',
    actionTitle: isKm ? 'បណ្តាញមន្ទីរពេទ្យ' : 'Hospital network',
    actionLabel: isKm ? 'គ្រប់គ្រងមន្ទីរពេទ្យ' : 'Manage hospitals',
    actionPath: '/hospitals/admin',
    tipTitle: isKm ? 'កំណត់ចំណាំអភិបាលកិច្ចប្រព័ន្ធ' : 'Platform governance note',
    tipText: isKm
      ? 'ធ្វើសវនកម្មលើសាលារៀន និងមន្ទីរពេទ្យដៃគូដែលបានចុះឈ្មោះជាប្រចាំ ដើម្បីរក្សាភាពត្រឹមត្រូវនៃទិន្នន័យគ្លីនិកដែលបានផ្ទៀងផ្ទាត់ និងសុវត្ថិភាពគ្រួសារ។'
      : 'Regularly audit registered schools and hospital partners to preserve verified clinical data integrity and family safety.',
  },
});

export const roleConfigs: Record<string, RoleSettingsContext> = getRoleConfigs(false);

@Component({
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UiFieldComponent,
    UiMessageComponent,
    UiDialogComponent,
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
        <span>{{ currentLang() === 'km' ? 'តួនាទី' : 'Role' }}</span>
        <strong>{{ getRoleDisplay(parent()?.role) }}</strong>
      </article>
      <article>
        <span>{{ currentLang() === 'km' ? 'ស្ថានភាពគណនី' : 'Account status' }}</span>
        <strong>{{ currentLang() === 'km' ? 'សកម្ម' : 'Active' }}</strong>
      </article>
      <article>
        <span>{{ currentLang() === 'km' ? 'សុវត្ថិភាព' : 'Security' }}</span>
        <strong>{{ currentLang() === 'km' ? 'បានការពារ' : 'Protected' }}</strong>
      </article>
      <article>
        <span>{{ currentLang() === 'km' ? 'ឈុតវិញ្ញាណ' : 'Sensory suite' }}</span>
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
              <h2 id="account-title">
                {{ currentLang() === 'km' ? 'ព័ត៌មានលម្អិតគណនី' : 'Account details' }}
              </h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'ព័ត៌មានប្រវត្តិរូបរបស់អ្នកត្រូវបានប្រើប្រាស់លើប្រវត្តិរូបកុមារ ការវាយតម្លៃ និងរបាយការណ៍សាលារៀន។'
                    : 'Your profile information is used across child profiles, screening assessments, and school reports.'
                }}
              </p>
            </div>
          </header>

          <form [formGroup]="form" (ngSubmit)="save()" acAccessibleForm novalidate>
            <div class="field-grid">
              <ac-ui-field
                [label]="currentLang() === 'km' ? 'នាមខ្លួន' : 'First name'"
                [required]="true"
                [error]="
                  showError('firstName')
                    ? currentLang() === 'km'
                      ? 'សូមបញ្ចូលនាមខ្លួន។'
                      : 'First name is required.'
                    : null
                "
              >
                <input formControlName="firstName" autocomplete="given-name" />
              </ac-ui-field>
              <ac-ui-field
                [label]="currentLang() === 'km' ? 'គោត្តនាម' : 'Last name'"
                [required]="true"
                [error]="
                  showError('lastName')
                    ? currentLang() === 'km'
                      ? 'សូមបញ្ចូលគោត្តនាម។'
                      : 'Last name is required.'
                    : null
                "
              >
                <input formControlName="lastName" autocomplete="family-name" />
              </ac-ui-field>
              <ac-ui-field
                [label]="currentLang() === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone number'"
                [optional]="true"
              >
                <input formControlName="phoneNumber" autocomplete="tel" inputmode="tel" />
              </ac-ui-field>
              <ac-ui-field
                [label]="currentLang() === 'km' ? 'បណ្តាញសង្គម' : 'Social media'"
                [optional]="true"
              >
                <input formControlName="socialMediaAccount" />
              </ac-ui-field>
              <ac-ui-field
                [label]="currentLang() === 'km' ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email address'"
                [hint]="
                  currentLang() === 'km'
                    ? 'អ៊ីមែលរបស់អ្នកត្រូវបានប្រើសម្រាប់ចូលគណនី ហើយមិនអាចប្តូរនៅទីនេះបានទេ។'
                    : 'Your email is your sign-in and cannot be changed here.'
                "
                [full]="true"
              >
                <input [value]="parent()?.email || ''" readonly />
              </ac-ui-field>
            </div>

            @if (saveError(); as problem) {
              <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
            }
            @if (saved()) {
              <ac-ui-message tone="success">{{
                currentLang() === 'km'
                  ? 'ព័ត៌មានគណនីរបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាព។'
                  : 'Your profile has been updated.'
              }}</ac-ui-message>
            }

            <div class="form-actions">
              <button type="submit" class="save-btn" [disabled]="saving() || form.pristine">
                {{
                  saving()
                    ? currentLang() === 'km'
                      ? 'កំពុងរក្សាទុក…'
                      : 'Saving…'
                    : currentLang() === 'km'
                      ? 'រក្សាទុកការផ្លាស់ប្តូរ'
                      : 'Save changes'
                }}
              </button>
              <button
                type="button"
                class="reset-btn"
                [disabled]="saving() || form.pristine"
                (click)="resetForm()"
              >
                {{ currentLang() === 'km' ? 'បោះបង់' : 'Discard' }}
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
              <h2 id="password-title">
                {{ currentLang() === 'km' ? 'ប្តូរពាក្យសម្ងាត់' : 'Change password' }}
              </h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់គណនីរបស់អ្នក។ ពាក្យសម្ងាត់ថ្មីត្រូវតែមានយ៉ាងតិច 12 តួអក្សរ។'
                    : 'Update your account password. New password must be at least 12 characters long.'
                }}
              </p>
            </div>
          </header>

          <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" acAccessibleForm novalidate>
            <div class="field-grid">
              <ac-ui-field
                [label]="currentLang() === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current password'"
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
                      showCurrentPass()
                        ? currentLang() === 'km'
                          ? 'លាក់ពាក្យសម្ងាត់បច្ចុប្បន្ន'
                          : 'Hide current password'
                        : currentLang() === 'km'
                          ? 'បង្ហាញពាក្យសម្ងាត់បច្ចុប្បន្ន'
                          : 'Show current password'
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
                [label]="currentLang() === 'km' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New password'"
                [required]="true"
                [hint]="currentLang() === 'km' ? 'យ៉ាងតិច 12 តួអក្សរ' : 'Minimum 12 characters'"
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
                    [attr.aria-label]="
                      showNewPass()
                        ? currentLang() === 'km'
                          ? 'លាក់ពាក្យសម្ងាត់ថ្មី'
                          : 'Hide new password'
                        : currentLang() === 'km'
                          ? 'បង្ហាញពាក្យសម្ងាត់ថ្មី'
                          : 'Show new password'
                    "
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
                [label]="
                  currentLang() === 'km' ? 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី' : 'Confirm new password'
                "
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
                      showConfirmPass()
                        ? currentLang() === 'km'
                          ? 'លាក់ពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់'
                          : 'Hide confirmed password'
                        : currentLang() === 'km'
                          ? 'បង្ហាញពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់'
                          : 'Show confirmed password'
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
              <ac-ui-message tone="success">{{
                currentLang() === 'km'
                  ? 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។'
                  : 'Your password has been changed successfully.'
              }}</ac-ui-message>
            }

            <div class="form-actions">
              <button
                type="submit"
                class="save-btn"
                [disabled]="passwordSaving() || passwordForm.pristine"
              >
                {{
                  passwordSaving()
                    ? currentLang() === 'km'
                      ? 'កំពុងធ្វើបច្ចុប្បន្នភាព…'
                      : 'Updating…'
                    : currentLang() === 'km'
                      ? 'ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់'
                      : 'Update password'
                }}
              </button>
              <button
                type="button"
                class="reset-btn"
                [disabled]="passwordSaving() || passwordForm.pristine"
                (click)="resetPasswordForm()"
              >
                {{ currentLang() === 'km' ? 'សម្អាត' : 'Clear' }}
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
              <h2 id="notifications-title">
                {{ currentLang() === 'km' ? 'ចំណូលចិត្តការជូនដំណឹង' : 'Notification preferences' }}
              </h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'គ្រប់គ្រងការជូនដំណឹង និងទំនាក់ទំនងដែលអ្នកទទួលបានតាមអ៊ីមែល និងផ្ទាំងគ្រប់គ្រង។'
                    : 'Control which alerts and communications you receive across your email and dashboard.'
                }}
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
                  <span class="toggle-title">{{
                    currentLang() === 'km' ? 'ការជូនដំណឹងណាត់ជួប' : 'Appointment alerts'
                  }}</span>
                  <span class="toggle-desc">{{
                    currentLang() === 'km'
                      ? 'ការជូនដំណឹងសម្រាប់ការជួបពិគ្រោះព្យាបាលខាងមុខ ការបញ្ជាក់ពីអ្នកឯកទេស និងបច្ចុប្បន្នភាពកាលវិភាគ។'
                      : 'Notifications for upcoming clinical visits, specialist confirmations, and schedule updates.'
                  }}</span>
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
                  <span class="toggle-title">{{
                    currentLang() === 'km' ? 'របាយការណ៍សាលារៀន' : 'School reports'
                  }}</span>
                  <span class="toggle-desc">{{
                    currentLang() === 'km'
                      ? 'ការជូនដំណឹងនៅពេលគ្រូបង្រៀន និងអ្នកព្យាបាលនៅសាលាដាក់បញ្ចូលកំណត់សម្គាល់ការវិវត្តថ្មី។'
                      : 'Alerts when teachers and school therapists file new developmental observation notes.'
                  }}</span>
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
                  <span class="toggle-title">{{
                    currentLang() === 'km' ? 'សេចក្តីប្រកាសពីប្រព័ន្ធ' : 'System announcements'
                  }}</span>
                  <span class="toggle-desc">{{
                    currentLang() === 'km'
                      ? 'បច្ចុប្បន្នភាពសំខាន់ៗអំពីប្រព័ន្ធ AutiCare ការណែនាំអំពីការថែទាំគ្លីនិក និងសុវត្ថិភាព។'
                      : 'Important updates about the AutiCare platform, clinical care guides, and security.'
                  }}</span>
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
              <ac-ui-message tone="success">{{
                currentLang() === 'km'
                  ? 'ចំណូលចិត្តការជូនដំណឹងរបស់អ្នកត្រូវបានរក្សាទុក។'
                  : 'Your notification preferences have been saved.'
              }}</ac-ui-message>
            }

            <div class="form-actions">
              <button
                type="submit"
                class="save-btn"
                [disabled]="notificationSaving() || notificationForm.pristine"
              >
                {{
                  notificationSaving()
                    ? currentLang() === 'km'
                      ? 'កំពុងរក្សាទុក…'
                      : 'Saving…'
                    : currentLang() === 'km'
                      ? 'រក្សាទុកចំណូលចិត្តការជូនដំណឹង'
                      : 'Save notification preferences'
                }}
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
              <h2 id="accessibility-title">
                {{
                  currentLang() === 'km'
                    ? 'ចំណូលចិត្តភាពងាយស្រួលប្រើប្រាស់'
                    : 'Accessibility preferences'
                }}
              </h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'កែសម្រួលភាពស្រួលភ្នែក ចលនា ទំហំអក្សរ និងពណ៌វិញ្ញាណ។'
                    : 'Customize visual comfort, motion behaviors, typography scaling, and sensory saturation.'
                }}
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
                  <span class="toggle-title">{{
                    currentLang() === 'km' ? 'កាត់បន្ថយចលនា' : 'Reduced motion'
                  }}</span>
                  <span class="toggle-desc">{{
                    currentLang() === 'km'
                      ? 'កាត់បន្ថយការរមូររលូន និងចលនាដែលមិនចាំបាច់។'
                      : 'Minimizes smooth scrolling and non-essential UI animations.'
                  }}</span>
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
                  <span class="toggle-title">{{
                    currentLang() === 'km' ? 'កម្រិតពណ៌ខ្ពស់' : 'High contrast mode'
                  }}</span>
                  <span class="toggle-desc">{{
                    currentLang() === 'km'
                      ? 'បង្កើនភាពច្បាស់នៃអក្សរ គែមបន្ទាត់ និងកម្រិតពណ៌ទូទាំងប្រព័ន្ធ។'
                      : 'Enhances text clarity, outlines, and border contrast across the workspace.'
                  }}</span>
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
                  <span class="toggle-title">{{
                    currentLang() === 'km' ? 'ក្ដារពណ៌ស្រាលស្រទន់' : 'Calming color palette mode'
                  }}</span>
                  <span class="toggle-desc">{{
                    currentLang() === 'km'
                      ? 'ក្ដារពណ៌ដែលស្រទន់ភ្នែក កាត់បន្ថយភាពនឿយហត់នៃភ្នែក និងវិញ្ញាណ។'
                      : 'Low-saturation, soft-tinted sensory friendly palette designed for visual comfort and reduced sensory fatigue.'
                  }}</span>
                </div>
                <div class="toggle-action">
                  <input type="checkbox" formControlName="calmingPalette" class="toggle-checkbox" />
                </div>
              </label>

              <!-- Font Size Scaling Selector -->
              <div class="font-scale-group">
                <div class="scale-header">
                  <span class="toggle-title">{{
                    currentLang() === 'km' ? 'ទំហំអក្សរ' : 'Font size scaling'
                  }}</span>
                  <span class="toggle-desc">{{
                    currentLang() === 'km'
                      ? 'ការកែសម្រួលទំហំអក្សរទូទាំងគ្រប់ទំព័រនៃប្រព័ន្ធ។'
                      : 'Responsive typography scale updating root rem base across all pages.'
                  }}</span>
                </div>
                <div class="font-scale-chips" role="radiogroup" aria-label="Font size scaling">
                  <button
                    type="button"
                    class="scale-chip"
                    [class.active]="currentFontSize() === 'normal'"
                    (click)="setFontSize('normal')"
                  >
                    <span class="chip-sample sample-normal">A</span>
                    <span class="chip-label">{{
                      currentLang() === 'km' ? 'ធម្មតា' : 'Normal'
                    }}</span>
                    <span class="chip-size">16px</span>
                  </button>
                  <button
                    type="button"
                    class="scale-chip"
                    [class.active]="currentFontSize() === 'large'"
                    (click)="setFontSize('large')"
                  >
                    <span class="chip-sample sample-large">A</span>
                    <span class="chip-label">{{ currentLang() === 'km' ? 'ធំ' : 'Large' }}</span>
                    <span class="chip-size">18px</span>
                  </button>
                  <button
                    type="button"
                    class="scale-chip"
                    [class.active]="currentFontSize() === 'xlarge'"
                    (click)="setFontSize('xlarge')"
                  >
                    <span class="chip-sample sample-xlarge">A</span>
                    <span class="chip-label">{{
                      currentLang() === 'km' ? 'ធំបំផុត' : 'Extra Large'
                    }}</span>
                    <span class="chip-size">20px</span>
                  </button>
                </div>
              </div>

              <!-- Preferred Language Selector -->
              <div class="language-field">
                <ac-ui-field
                  [label]="currentLang() === 'km' ? 'ភាសាដែលពេញចិត្ត' : 'Preferred language'"
                  [full]="true"
                  [hint]="
                    currentLang() === 'km'
                      ? 'ជ្រើសរើសភាសាសម្រាប់ប្រើប្រាស់លើផ្ទាំងកម្មវិធី និងការជូនដំណឹង។'
                      : 'Select the language used for interface notifications and content.'
                  "
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
              <ac-ui-message tone="success">
                {{
                  currentLang() === 'km'
                    ? 'ចំណូលចិត្តភាពងាយស្រួលប្រើប្រាស់ត្រូវបានរក្សាទុក។'
                    : 'Accessibility preferences saved.'
                }}
              </ac-ui-message>
            }

            <div class="form-actions">
              <button
                type="submit"
                class="save-btn"
                [disabled]="preferencesSaving() || preferencesForm.pristine"
              >
                {{
                  preferencesSaving()
                    ? currentLang() === 'km'
                      ? 'កំពុងរក្សាទុក…'
                      : 'Saving…'
                    : currentLang() === 'km'
                      ? 'រក្សាទុកចំណូលចិត្ត'
                      : 'Save preferences'
                }}
              </button>
            </div>
          </form>
        </section>

        <!-- 5. Danger Zone / Account Deletion Section -->
        <section class="profile-panel danger-panel" aria-labelledby="danger-title">
          <header class="panel-header">
            <div class="header-icon danger-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <div>
              <h2 id="danger-title">
                {{ currentLang() === 'km' ? 'តំបន់គ្រោះថ្នាក់' : 'Danger zone' }}
              </h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'លុបគណនីរបស់អ្នកជាអចិន្ត្រៃយ៍ និងទិន្នន័យដែលពាក់ព័ន្ធទាំងអស់។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។'
                    : 'Permanently delete your account and all associated profile data. This action cannot be undone.'
                }}
              </p>
            </div>
          </header>

          <div class="danger-action-row">
            <button type="button" class="danger-btn" (click)="showDeleteDialog.set(true)">
              {{ currentLang() === 'km' ? 'លុបគណនី' : 'Delete account' }}
            </button>
          </div>
        </section>
      </div>

      <!-- Right Column Support & Actions Sidebar -->
      <aside class="side-panel" aria-label="Profile support">
        <h2>{{ roleConfig().workspaceTitle }}</h2>

        <div class="support-row">
          <span>{{
            currentLang() === 'km' ? 'សកម្មភាពមានប្រយោជន៍បន្ទាប់' : 'Next useful action'
          }}</span>
          <strong>{{ roleConfig().actionTitle }}</strong>
          <a [routerLink]="roleConfig().actionPath">{{ roleConfig().actionLabel }}</a>
        </div>

        <div class="support-row">
          <span>{{ currentLang() === 'km' ? 'សកម្មភាពសុវត្ថិភាព' : 'Security action' }}</span>
          <strong>{{
            currentLang() === 'km' ? 'ការកំណត់ពាក្យសម្ងាត់ឡើងវិញរួចរាល់' : 'Password recovery ready'
          }}</strong>
          <a routerLink="/forgot-password">{{
            currentLang() === 'km' ? 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ' : 'Reset password'
          }}</a>
        </div>

        <div class="sensory-summary-card">
          <div class="summary-card-header">
            <span class="summary-card-icon" aria-hidden="true">🌱</span>
            <h3>{{ currentLang() === 'km' ? 'បរិយាកាសវិញ្ញាណ' : 'Sensory Environment' }}</h3>
          </div>
          <div class="summary-badge-list">
            <span class="sensory-badge"
              >{{ currentLang() === 'km' ? 'កម្រិតពណ៌៖ ' : 'Contrast: '
              }}{{ contrastLabel() }}</span
            >
            <span class="sensory-badge"
              >{{ currentLang() === 'km' ? 'ចលនា៖ ' : 'Motion: ' }}{{ motionLabel() }}</span
            >
            <span class="sensory-badge"
              >{{ currentLang() === 'km' ? 'ទំហំ៖ ' : 'Scale: ' }}{{ fontScaleLabel() }}</span
            >
            <span class="sensory-badge"
              >{{ currentLang() === 'km' ? 'ក្ដារពណ៌៖ ' : 'Palette: ' }}{{ paletteLabel() }}</span
            >
          </div>
        </div>

        <div class="calm-note">
          <h3>{{ roleConfig().tipTitle }}</h3>
          <p>{{ roleConfig().tipText }}</p>
        </div>
      </aside>
    </div>

    @if (showDeleteDialog()) {
      <ac-ui-dialog
        [heading]="currentLang() === 'km' ? 'លុបគណនីរបស់អ្នក?' : 'Delete your account?'"
        [description]="
          currentLang() === 'km'
            ? 'តើអ្នកប្រាកដជាចង់លុបគណនីរបស់អ្នកមែនទេ? ទិន្នន័យកុមារ ការវាយតម្លៃ និងកំណត់ត្រាទាំងអស់នឹងត្រូវលុបជាអចិន្ត្រៃយ៍។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។'
            : 'Are you sure you want to delete your account? All child profiles, screening assessments, and clinical records will be permanently removed. This action cannot be reversed.'
        "
        dialogRole="alertdialog"
        size="sm"
        (close)="showDeleteDialog.set(false)"
      >
        <div dialogFooter class="dialog-actions">
          <button type="button" class="cancel-btn" (click)="showDeleteDialog.set(false)">
            {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
          </button>
          <button
            type="button"
            class="delete-confirm-btn"
            [disabled]="deletingAccount()"
            (click)="confirmDeleteAccount()"
          >
            {{
              deletingAccount()
                ? currentLang() === 'km'
                  ? 'កំពុងលុប…'
                  : 'Deleting…'
                : currentLang() === 'km'
                  ? 'បញ្ជាក់ការលុបគណនី'
                  : 'Confirm deletion'
            }}
          </button>
        </div>
      </ac-ui-dialog>
    }
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

      .danger-panel {
        border-color: var(--ac-color-red-border);
        background: var(--ac-color-surface);
      }

      .danger-icon {
        color: var(--ac-color-red-600);
        background: var(--ac-color-red-50);
      }

      .danger-action-row {
        margin-top: 16px;
      }

      .danger-btn,
      .delete-confirm-btn {
        min-height: 44px;
        padding: 0 20px;
        border-radius: 10px;
        border: 0;
        background: var(--ac-color-red-600);
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-bold);
        font-size: 14px;
        cursor: pointer;
        transition: background 120ms ease;
      }

      .danger-btn:hover,
      .delete-confirm-btn:hover {
        background: var(--ac-color-red-700);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;
      }

      .cancel-btn {
        min-height: 44px;
        padding: 0 18px;
        border-radius: 10px;
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-medium);
        font-size: 14px;
        cursor: pointer;
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

  readonly currentLang = computed(() => this.i18n?.currentLang?.() ?? 'en');
  readonly showDeleteDialog = signal(false);
  readonly deletingAccount = signal(false);

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
    const isKm = this.currentLang() === 'km';
    const configs = getRoleConfigs(isKm);
    return configs[role] ?? configs['PARENT'];
  });

  getRoleDisplay(role: string | undefined): string {
    if (this.currentLang() === 'km') {
      switch (role) {
        case 'ADMIN':
          return 'អ្នកគ្រប់គ្រងប្រព័ន្ធ';
        case 'SCHOOL':
          return 'បុគ្គលិកសាលា';
        case 'HOSPITAL':
          return 'អ្នកសម្របសម្រួលមន្ទីរពេទ្យ';
        case 'PARENT':
        default:
          return 'អាណាព្យាបាល';
      }
    }
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'SCHOOL':
        return 'School';
      case 'HOSPITAL':
        return 'Hospital';
      case 'PARENT':
      default:
        return 'Parent';
    }
  }

  readonly displayName = computed(() => {
    const parent = this.parent();
    if (!parent) return this.roleConfig().eyebrow;
    const name = `${parent.firstName} ${parent.lastName}`.trim();
    return name || this.roleConfig().eyebrow;
  });

  readonly activeSensoryStatus = computed(() => {
    const isKm = this.currentLang() === 'km';
    if (this.currentHighContrast()) return isKm ? 'កម្រិតពណ៌ខ្ពស់' : 'High Contrast';
    if (this.currentCalmingPalette()) return isKm ? 'ក្ដារពណ៌ស្រាលស្រទន់' : 'Calming Palette';
    if (this.currentReducedMotion()) return isKm ? 'កាត់បន្ថយចលនា' : 'Quiet Motion';
    return isKm ? 'ស្តង់ដារ' : 'Standard';
  });

  readonly contrastLabel = computed(() => {
    const isKm = this.currentLang() === 'km';
    return this.currentHighContrast()
      ? isKm
        ? 'បានបង្កើន'
        : 'Enhanced'
      : isKm
        ? 'ស្តង់ដារ'
        : 'Standard';
  });

  readonly motionLabel = computed(() => {
    const isKm = this.currentLang() === 'km';
    return this.currentReducedMotion()
      ? isKm
        ? 'បានកាត់បន្ថយ'
        : 'Reduced'
      : isKm
        ? 'រលូន'
        : 'Smooth';
  });

  readonly fontScaleLabel = computed(() => {
    const scale = this.currentFontSize();
    if (scale === 'large') return '18px';
    if (scale === 'xlarge') return '20px';
    return '16px';
  });

  readonly paletteLabel = computed(() => {
    const isKm = this.currentLang() === 'km';
    return this.currentCalmingPalette()
      ? isKm
        ? 'ស្រាលស្រទន់'
        : 'Calming'
      : isKm
        ? 'ធម្មជាតិ'
        : 'Natural';
  });

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
    const isKm = this.currentLang() === 'km';
    const ctrl = this.passwordForm.controls[field];
    if (field === 'currentPassword' && ctrl.hasError('required')) {
      return isKm ? 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current password is required.';
    }
    if (field === 'newPassword') {
      if (ctrl.hasError('required')) {
        return isKm ? 'សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី' : 'New password is required.';
      }
      if (ctrl.hasError('minlength')) {
        return isKm
          ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 12 តួអក្សរ'
          : 'New password must be at least 12 characters.';
      }
    }
    if (field === 'confirmPassword') {
      if (ctrl.hasError('required')) {
        return isKm
          ? 'សូមផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មីរបស់អ្នក'
          : 'Please confirm your new password.';
      }
      if (this.passwordForm.hasError('passwordMismatch')) {
        return isKm ? 'ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ' : 'Passwords do not match.';
      }
    }
    return null;
  }

  protected confirmDeleteAccount(): void {
    this.deletingAccount.set(true);
    this.auth.logout();
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
