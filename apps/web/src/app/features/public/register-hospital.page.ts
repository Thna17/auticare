import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { HospitalRegistrationRequest } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { DICTIONARY } from '../../core/i18n/i18n.dictionary';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { HospitalRegistrationsService } from '../admin/data-access/hospital-registrations.service';

@Component({
  standalone: true,
  selector: 'ac-register-hospital-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiFieldComponent,
    UiMessageComponent,
    AccessibleFormDirective,
  ],
  template: `
    <div class="public-page">
      <header class="public-header">
        <a class="brand" routerLink="/" aria-label="AutiCare home">
          <img src="/images/auticare-logo.png" alt="" aria-hidden="true" width="36" height="36" />
          <span>AutiCare</span>
        </a>
        <div class="header-actions">
          <button
            type="button"
            class="lang-toggle-btn"
            (click)="toggleLanguage()"
            [attr.aria-label]="currentLang() === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'"
          >
            <span>{{ currentLang() === 'km' ? 'English' : 'ភាសាខ្មែរ' }}</span>
          </button>
          <a routerLink="/" class="back-link"> ← {{ texts().backHome }} </a>
        </div>
      </header>

      <main class="page-body" id="main">
        <div class="form-container">
          @if (submitted()) {
            <section class="success-card" role="status">
              <div class="success-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    d="m5 12 4.2 4.2L19 6.8"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.6"
                  />
                </svg>
              </div>
              <h1>{{ texts().successTitle }}</h1>
              <p class="success-text">{{ texts().successMessage }}</p>
              <a routerLink="/" class="primary-btn">
                {{ texts().backHome }}
              </a>
            </section>
          } @else {
            <section class="form-card">
              <header class="form-header">
                <span class="category-pill">
                  {{ currentLang() === 'km' ? 'ដៃគូសុខាភិបាល' : 'Healthcare Partner' }}
                </span>
                <h1>{{ texts().title }}</h1>
                <p class="subtitle">{{ texts().subtitle }}</p>
              </header>

              @if (errorMessage()) {
                <ac-ui-message tone="error">{{ errorMessage() }}</ac-ui-message>
              }

              <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
                <div class="form-grid">
                  <div class="grid-col-2">
                    <ac-ui-field
                      [label]="texts().hospitalName"
                      [required]="true"
                      [error]="
                        form.controls.hospitalName.touched && form.controls.hospitalName.invalid
                          ? currentLang() === 'km'
                            ? 'សូមបញ្ចូលឈ្មោះមន្ទីរពេទ្យ'
                            : 'Enter the hospital or clinic name'
                          : null
                      "
                    >
                      <input
                        type="text"
                        formControlName="hospitalName"
                        placeholder="e.g. National Pediatric Hospital"
                      />
                    </ac-ui-field>
                  </div>

                  <div>
                    <ac-ui-field
                      [label]="texts().city"
                      [required]="true"
                      [error]="
                        form.controls.city.touched && form.controls.city.invalid
                          ? currentLang() === 'km'
                            ? 'សូមបញ្ចូលរាជធានី ឬខេត្ត'
                            : 'Enter the city or province'
                          : null
                      "
                    >
                      <input type="text" formControlName="city" placeholder="e.g. Phnom Penh" />
                    </ac-ui-field>
                  </div>

                  <div>
                    <ac-ui-field [label]="texts().address" hint="(Optional)">
                      <input
                        type="text"
                        formControlName="address"
                        placeholder="Street, Sangkat, Khan"
                      />
                    </ac-ui-field>
                  </div>

                  <div>
                    <ac-ui-field
                      [label]="texts().contactFirstName"
                      [required]="true"
                      [error]="
                        form.controls.contactFirstName.touched &&
                        form.controls.contactFirstName.invalid
                          ? currentLang() === 'km'
                            ? 'សូមបញ្ចូលនាមខ្លួន'
                            : 'Enter contact first name'
                          : null
                      "
                    >
                      <input
                        type="text"
                        formControlName="contactFirstName"
                        placeholder="First name"
                      />
                    </ac-ui-field>
                  </div>

                  <div>
                    <ac-ui-field
                      [label]="texts().contactLastName"
                      [required]="true"
                      [error]="
                        form.controls.contactLastName.touched &&
                        form.controls.contactLastName.invalid
                          ? currentLang() === 'km'
                            ? 'សូមបញ្ចូលគោត្តនាម'
                            : 'Enter contact last name'
                          : null
                      "
                    >
                      <input
                        type="text"
                        formControlName="contactLastName"
                        placeholder="Last name"
                      />
                    </ac-ui-field>
                  </div>

                  <div>
                    <ac-ui-field [label]="texts().contactTitle" hint="(Optional)">
                      <input
                        type="text"
                        formControlName="contactTitle"
                        placeholder="e.g. Medical Director, Head of Pediatrics"
                      />
                    </ac-ui-field>
                  </div>

                  <div>
                    <ac-ui-field [label]="texts().services" hint="(Optional)">
                      <input
                        type="text"
                        formControlName="services"
                        placeholder="e.g. Pediatric Assessment, Occupational Therapy"
                      />
                    </ac-ui-field>
                  </div>

                  <div>
                    <ac-ui-field
                      [label]="texts().email"
                      [required]="true"
                      [error]="
                        form.controls.email.touched && form.controls.email.invalid
                          ? currentLang() === 'km'
                            ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ'
                            : 'Enter a valid email address'
                          : null
                      "
                    >
                      <input
                        type="email"
                        formControlName="email"
                        placeholder="director@hospital.gov.kh"
                        autocomplete="email"
                      />
                    </ac-ui-field>
                  </div>

                  <div>
                    <ac-ui-field
                      [label]="texts().phone"
                      [required]="true"
                      [error]="
                        form.controls.phone.touched && form.controls.phone.invalid
                          ? currentLang() === 'km'
                            ? 'សូមបញ្ចូលលេខទូរស័ព្ទ'
                            : 'Enter phone number'
                          : null
                      "
                    >
                      <input
                        type="tel"
                        formControlName="phone"
                        placeholder="+855 12 345 678"
                        autocomplete="tel"
                      />
                    </ac-ui-field>
                  </div>

                  <div class="grid-col-2">
                    <ac-ui-field [label]="texts().message" hint="(Optional, max 1000 characters)">
                      <textarea
                        rows="3"
                        formControlName="message"
                        placeholder="Tell us about your clinical specialties, pediatric neurology, or questions..."
                      ></textarea>
                    </ac-ui-field>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="primary-btn" [disabled]="submitting()">
                    <span>{{ submitting() ? texts().submitting : texts().submit }}</span>
                  </button>
                </div>
              </form>
            </section>
          }
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100svh;
        background: var(--ac-color-background);
        color: var(--ac-color-text-strong);
      }

      .public-page {
        min-height: 100svh;
        display: flex;
        flex-direction: column;
      }

      .public-header {
        max-width: 1100px;
        width: 100%;
        margin: 0 auto;
        padding: 24px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .brand {
        color: var(--ac-color-action-mid);
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: var(--ac-type-page-title);
        line-height: 1;
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }

      .brand img {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-pill);
        object-fit: cover;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .lang-toggle-btn {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        padding: 6px 14px;
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-body);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .lang-toggle-btn:hover {
        background: var(--ac-color-surface-hover);
        border-color: var(--ac-color-action-mid);
        color: var(--ac-color-action-mid);
      }

      .back-link {
        color: var(--ac-color-text-muted);
        text-decoration: none;
        font-size: 14px;
        font-weight: var(--ac-font-weight-medium);
        transition: color 0.2s;
      }

      .back-link:hover {
        color: var(--ac-color-action-mid);
      }

      .page-body {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px 20px 48px;
      }

      .form-container {
        width: 100%;
        max-width: 720px;
      }

      .form-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: 24px;
        padding: 40px 36px;
        box-shadow: 0 16px 40px -12px color-mix(in srgb, var(--ac-brand-950) 8%, transparent);
        display: flex;
        flex-direction: column;
        gap: 28px;
      }

      .form-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .category-pill {
        align-self: flex-start;
        background: color-mix(in srgb, var(--ac-brand-500) 12%, transparent);
        color: var(--ac-color-action-mid);
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
      }

      .form-header h1 {
        margin: 0;
        font-size: 26px;
        line-height: 1.25;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .grid-col-2 {
        grid-column: 1 / -1;
      }

      .form-grid input,
      .form-grid textarea {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid var(--ac-color-border);
        border-radius: 10px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }

      .form-grid input:focus,
      .form-grid textarea:focus {
        outline: none;
        border-color: var(--ac-color-action-mid);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ac-brand-500) 18%, transparent);
      }

      .form-grid textarea {
        resize: vertical;
        min-height: 80px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 8px;
      }

      .primary-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 28px;
        border-radius: 12px;
        background: var(--ac-color-action-mid);
        color: var(--ac-color-surface);
        border: none;
        font-size: 15px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        text-decoration: none;
        transition:
          background-color 0.2s,
          transform 0.1s;
      }

      .primary-btn:hover:not(:disabled) {
        background: var(--ac-color-action);
      }

      .primary-btn:active:not(:disabled) {
        transform: scale(0.98);
      }

      .primary-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .success-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: 24px;
        padding: 48px 36px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        box-shadow: 0 16px 40px -12px color-mix(in srgb, var(--ac-brand-950) 8%, transparent);
      }

      .success-icon {
        width: 64px;
        height: 64px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-success);
        display: grid;
        place-items: center;
      }

      .success-icon svg {
        width: 32px;
        height: 32px;
      }

      .success-text {
        max-width: 480px;
        margin: 0;
        font-size: 15px;
        color: var(--ac-color-text-body);
        line-height: 1.55;
      }

      @media (max-width: 640px) {
        .form-grid {
          grid-template-columns: 1fr;
        }

        .grid-col-2 {
          grid-column: auto;
        }

        .form-card {
          padding: 24px 20px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterHospitalPage {
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService, { optional: true });
  private readonly registrationsService = inject(HospitalRegistrationsService);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly currentLang = computed(() => this.i18n?.currentLang() ?? 'km');

  readonly texts = computed(() => {
    return this.i18n
      ? this.i18n.dictionary.hospitalRegistrations
      : DICTIONARY[this.currentLang()].hospitalRegistrations;
  });

  readonly form = this.fb.group({
    hospitalName: ['', [Validators.required, Validators.maxLength(150)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.maxLength(255)]],
    contactFirstName: ['', [Validators.required, Validators.maxLength(100)]],
    contactLastName: ['', [Validators.required, Validators.maxLength(100)]],
    contactTitle: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    phone: ['', [Validators.required, Validators.maxLength(32)]],
    services: ['', [Validators.maxLength(500)]],
    message: ['', [Validators.maxLength(1000)]],
  });

  toggleLanguage(): void {
    this.i18n?.toggleLanguage();
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(
        this.currentLang() === 'km'
          ? 'សូមពិនិត្យ និងបំពេញព័ត៌មានដែលត្រូវការឱ្យបានត្រឹមត្រូវ។'
          : 'Please correct the highlighted fields before submitting.',
      );
      return;
    }

    const val = this.form.getRawValue();
    const payload: HospitalRegistrationRequest = {
      hospitalName: val.hospitalName?.trim() ?? '',
      city: val.city?.trim() ?? '',
      address: val.address?.trim() || undefined,
      contactFirstName: val.contactFirstName?.trim() ?? '',
      contactLastName: val.contactLastName?.trim() ?? '',
      contactTitle: val.contactTitle?.trim() || undefined,
      email: (val.email?.trim() ?? '').toLowerCase(),
      phone: val.phone?.trim() ?? '',
      services: val.services?.trim() || undefined,
      message: val.message?.trim() || undefined,
    };

    this.submitting.set(true);
    this.registrationsService.submit(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg =
          err?.error?.error?.message ||
          (this.currentLang() === 'km'
            ? 'មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។'
            : 'Failed to submit registration request. Please try again.');
        this.errorMessage.set(msg);
      },
    });
  }
}
