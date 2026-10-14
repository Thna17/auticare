import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { HospitalsApi } from './data-access/hospitals.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, UiCardComponent, UiMessageComponent],
  template: `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <a routerLink="/hospitals/admin" class="back-link">{{
        currentLang() === 'km' ? '← ត្រឡប់ទៅបញ្ជីមន្ទីរពេទ្យ' : '← Back to Directory'
      }}</a>
    </nav>

    <section class="page-header">
      <p class="eyebrow">
        {{ currentLang() === 'km' ? 'ការគ្រប់គ្រងប្រព័ន្ធ' : 'Administration' }}
      </p>
      <h1>{{ currentLang() === 'km' ? 'បង្កើតគណនីមន្ទីរពេទ្យ' : 'Create hospital account' }}</h1>
      <p>
        {{
          currentLang() === 'km'
            ? 'បង្កើតប្រវត្តិរូបមន្ទីរពេទ្យ និងអញ្ជើញអ្នកគ្រប់គ្រងក្នុងសកម្មភាពតែមួយ។'
            : 'Provision the hospital profile and invite a manager in one action.'
        }}
      </p>
    </section>

    <ac-ui-card>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <fieldset formGroupName="hospital">
          <legend>
            {{ currentLang() === 'km' ? 'ប្រវត្តិរូបមន្ទីរពេទ្យ' : 'Hospital profile' }}
          </legend>
          <label>
            {{ currentLang() === 'km' ? 'ឈ្មោះមន្ទីរពេទ្យ' : 'Name' }}
            <input type="text" formControlName="name" />
            @if (showError('hospital.name')) {
              <span class="field-error">{{
                currentLang() === 'km' ? 'សូមបញ្ចូលឈ្មោះមន្ទីរពេទ្យ។' : 'Hospital name is required.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'រាជធានី/ខេត្ត' : 'City' }}
            <input type="text" formControlName="city" />
            @if (showError('hospital.city')) {
              <span class="field-error">{{
                currentLang() === 'km' ? 'សូមបញ្ចូលរាជធានី ឬខេត្ត។' : 'City is required.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'អាសយដ្ឋាន' : 'Address' }}
            <input type="text" formControlName="address" />
            @if (showError('hospital.address')) {
              <span class="field-error">{{
                currentLang() === 'km' ? 'សូមបញ្ចូលអាសយដ្ឋាន។' : 'Address is required.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'សេវាកម្ម / ជំនាញឯកទេស' : 'Services / Specializations' }}
            <textarea rows="3" formControlName="services"></textarea>
            @if (showError('hospital.services')) {
              <span class="field-error">{{
                currentLang() === 'km'
                  ? 'សូមបញ្ចូលព័ត៌មានលម្អិតអំពីសេវាកម្ម។'
                  : 'Services description is required.'
              }}</span>
            }
          </label>
        </fieldset>

        <fieldset formGroupName="account">
          <legend>{{ currentLang() === 'km' ? 'គណនីអ្នកគ្រប់គ្រង' : 'Manager account' }}</legend>
          <p class="invite-notice">
            {{
              currentLang() === 'km'
                ? 'អ្នកគ្រប់គ្រងមន្ទីរពេទ្យនឹងទទួលបានអ៊ីមែលអញ្ជើញដែលមានសុវត្ថិភាព ដើម្បីកំណត់ពាក្យសម្ងាត់របស់ពួកគេ។'
                : 'The hospital manager will receive a secure single-use invitation email to set up their password.'
            }}
          </p>
          <label>
            {{ currentLang() === 'km' ? 'អ៊ីមែល' : 'Email' }}
            <input type="email" formControlName="email" />
            @if (showError('account.email')) {
              <span class="field-error">{{
                currentLang() === 'km'
                  ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលដែលត្រឹមត្រូវ។'
                  : 'Enter a valid email address.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'នាមខ្លួន' : 'First name' }}
            <input type="text" formControlName="firstName" />
            @if (showError('account.firstName')) {
              <span class="field-error">{{
                currentLang() === 'km' ? 'សូមបញ្ចូលនាមខ្លួន។' : 'First name is required.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'គោត្តនាម' : 'Last name' }}
            <input type="text" formControlName="lastName" />
            @if (showError('account.lastName')) {
              <span class="field-error">{{
                currentLang() === 'km' ? 'សូមបញ្ចូលគោត្តនាម។' : 'Last name is required.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'តួនាទី / មុខតំណែង' : 'Title' }}
            <input type="text" formControlName="title" />
            @if (showError('account.title')) {
              <span class="field-error">{{
                currentLang() === 'km'
                  ? 'តួនាទីមិនត្រូវលើសពី 120 តួអក្សរឡើយ។'
                  : 'Title must be 120 characters or fewer.'
              }}</span>
            }
          </label>
        </fieldset>

        @if (error()) {
          <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
        }
        @if (message()) {
          <ac-ui-message tone="success">{{ message() }}</ac-ui-message>
        }

        <div class="form-actions">
          <button type="submit" [disabled]="saving()">
            {{
              saving()
                ? currentLang() === 'km'
                  ? 'កំពុងបង្កើត…'
                  : 'Creating…'
                : currentLang() === 'km'
                  ? 'បង្កើតគណនីមន្ទីរពេទ្យ'
                  : 'Create hospital account'
            }}
          </button>
          <a routerLink="/hospitals/admin" class="cancel-btn">{{
            currentLang() === 'km' ? 'បោះបង់' : 'Cancel'
          }}</a>
        </div>
      </form>
    </ac-ui-card>
  `,
  styles: [
    `
      .breadcrumb-nav {
        margin-bottom: 16px;
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ac-color-action);
        text-decoration: none;
        font-weight: var(--ac-font-weight-semibold);
        font-size: 14px;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      .page-header {
        max-width: 760px;
        margin-bottom: 28px;
      }
      .eyebrow {
        color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
      }
      h1 {
        margin: 0;
        font-size: var(--ac-type-page-title);
      }
      form,
      fieldset {
        display: grid;
        gap: 16px;
      }
      fieldset {
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 8px;
        padding: 16px;
      }
      legend {
        padding: 0 6px;
        font-weight: var(--ac-font-weight-bold);
      }
      .invite-notice {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: var(--ac-color-text-body);
      }
      label {
        display: grid;
        gap: 6px;
        font-weight: var(--ac-font-weight-semibold);
      }
      input,
      textarea {
        border-radius: 6px;
        border: 1px solid var(--ac-color-border-grey);
        padding: 10px 12px;
        font: inherit;
      }
      .form-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
      }
      button {
        justify-self: start;
        border: none;
        border-radius: 8px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        padding: 12px 18px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }
      .cancel-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        padding: 12px 18px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .cancel-btn:hover {
        background: var(--ac-color-surface-slate);
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .field-error {
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateHospitalAccountPage {
  private readonly api = inject(HospitalsApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    hospital: this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(160)]],
      city: ['', [Validators.required, Validators.maxLength(120)]],
      address: ['', [Validators.required, Validators.maxLength(300)]],
      services: ['', [Validators.required, Validators.maxLength(4000)]],
    }),
    account: this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.maxLength(80)]],
      lastName: ['', [Validators.required, Validators.maxLength(80)]],
      title: ['', [Validators.maxLength(120)]],
    }),
  });

  submit() {
    this.error.set(null);
    this.message.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        this.currentLang() === 'km'
          ? 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់មុននឹងបង្កើតគណនី។'
          : 'Fix the highlighted fields before creating the account.',
      );
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.api
      .createHospitalAccount({
        hospital: {
          name: value.hospital.name.trim(),
          city: value.hospital.city.trim(),
          address: value.hospital.address.trim(),
          services: value.hospital.services.trim(),
        },
        account: {
          email: value.account.email.trim(),
          firstName: value.account.firstName.trim(),
          lastName: value.account.lastName.trim(),
          title: value.account.title.trim() || undefined,
        },
      })
      .subscribe({
        next: (created) => {
          this.message.set(
            this.currentLang() === 'km'
              ? `ការអញ្ជើញត្រូវបានផ្ញើជូនមន្ទីរពេទ្យ ${created.hospital.name} ដោយជោគជ័យ។`
              : `Invitation sent for ${created.hospital.name}.`,
          );
          this.saving.set(false);
          void this.router.navigateByUrl('/hospitals/admin');
        },
        error: () => {
          this.error.set(
            this.currentLang() === 'km'
              ? 'មិនអាចបង្កើតគណនីមន្ទីរពេទ្យបានទេ។ សូមពិនិត្យមើលអ៊ីមែល រួចព្យាយាមម្តងទៀត។'
              : 'Hospital account could not be created. Check the email and try again.',
          );
          this.saving.set(false);
        },
      });
  }

  protected showError(path: string) {
    const control = this.form.get(path);
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }
}
