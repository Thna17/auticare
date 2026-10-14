import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, UiCardComponent, UiMessageComponent],
  template: `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <a routerLink="/schools/admin" class="back-link">{{
        currentLang() === 'km' ? '← ត្រឡប់ទៅបញ្ជីសាលា' : '← Back to Directory'
      }}</a>
    </nav>

    <section class="page-header">
      <p class="eyebrow">
        {{ currentLang() === 'km' ? 'ការគ្រប់គ្រងប្រព័ន្ធ' : 'Administration' }}
      </p>
      <h1>{{ currentLang() === 'km' ? 'បង្កើតគណនីសាលា' : 'Create school account' }}</h1>
      <p>
        {{
          currentLang() === 'km'
            ? 'បង្កើតប្រវត្តិរូបសាលារៀន និងគណនីបុគ្គលិកក្នុងសកម្មភាពប្រកបដោយសុវត្ថិភាពតែមួយ។'
            : 'Create the school profile and the staff login in one secure action.'
        }}
      </p>
    </section>

    <ac-ui-card>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <fieldset formGroupName="school">
          <legend>{{ currentLang() === 'km' ? 'ប្រវត្តិរូបសាលា' : 'School profile' }}</legend>
          <label>
            {{ currentLang() === 'km' ? 'ឈ្មោះសាលារៀន' : 'Name' }}
            <input type="text" formControlName="name" />
            @if (showError('school.name')) {
              <span class="field-error">{{
                currentLang() === 'km' ? 'សូមបញ្ចូលឈ្មោះសាលារៀន។' : 'School name is required.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'រាជធានី/ខេត្ត' : 'City' }}
            <input type="text" formControlName="city" />
            @if (showError('school.city')) {
              <span class="field-error">{{
                currentLang() === 'km' ? 'សូមបញ្ចូលរាជធានី ឬខេត្ត។' : 'City is required.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'អាសយដ្ឋាន' : 'Address' }}
            <input type="text" formControlName="address" />
            @if (showError('school.address')) {
              <span class="field-error">{{
                currentLang() === 'km' ? 'សូមបញ្ចូលអាសយដ្ឋាន។' : 'Address is required.'
              }}</span>
            }
          </label>
          <label>
            {{ currentLang() === 'km' ? 'ការពិពណ៌នា' : 'Description' }}
            <textarea rows="4" formControlName="description"></textarea>
            @if (showError('school.description')) {
              <span class="field-error">{{
                currentLang() === 'km'
                  ? 'ការពិពណ៌នាមិនត្រូវលើសពី 2,000 តួអក្សរឡើយ។'
                  : 'Description must be 2,000 characters or fewer.'
              }}</span>
            }
          </label>
        </fieldset>

        <fieldset formGroupName="account">
          <legend>{{ currentLang() === 'km' ? 'គណនីចូលប្រើប្រាស់' : 'Login account' }}</legend>
          <p class="invite-notice">
            {{
              currentLang() === 'km'
                ? 'អ្នកសម្របសម្រួលសាលានឹងទទួលបានអ៊ីមែលអញ្ជើញដែលមានសុវត្ថិភាព ដើម្បីកំណត់ពាក្យសម្ងាត់របស់ពួកគេ។'
                : 'The school coordinator will receive a secure single-use invitation email to set up their password.'
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
                  : 'Creating...'
                : currentLang() === 'km'
                  ? 'បង្កើតគណនីសាលា'
                  : 'Create school account'
            }}
          </button>
          <a routerLink="/schools/admin" class="cancel-btn">{{
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
        border: 1px solid var(--ac-color-border-info);
        border-radius: 8px;
        padding: 18px;
      }
      legend {
        font-weight: var(--ac-font-weight-bold);
        padding: 0 8px;
      }
      label {
        display: grid;
        gap: 8px;
        font-weight: var(--ac-font-weight-semibold);
      }
      input,
      textarea {
        border: 1px solid var(--ac-color-grey-pale);
        border-radius: 8px;
        padding: 12px;
        font: inherit;
      }
      .form-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
      }
      button {
        width: fit-content;
        border: 0;
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
      .error {
        color: var(--ac-color-alert-text);
        font-weight: var(--ac-font-weight-semibold);
      }
      .field-error {
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
      }
      .success {
        color: var(--ac-color-green-700);
        font-weight: var(--ac-font-weight-semibold);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSchoolAccountPage {
  private readonly api = inject(SchoolsApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    school: this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(160)]],
      city: ['', [Validators.required, Validators.maxLength(120)]],
      address: ['', [Validators.required, Validators.maxLength(300)]],
      description: ['', [Validators.maxLength(2000)]],
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
      .createSchoolAccount({
        school: {
          name: value.school.name.trim(),
          city: value.school.city.trim(),
          address: value.school.address.trim(),
          description: value.school.description.trim() || undefined,
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
              ? `ការអញ្ជើញត្រូវបានផ្ញើជូនសាលា ${created.school.name} ដោយជោគជ័យ។`
              : `Invitation sent for ${created.school.name}.`,
          );
          this.saving.set(false);
          void this.router.navigateByUrl('/schools/admin');
        },
        error: () => {
          this.error.set(
            this.currentLang() === 'km'
              ? 'មិនអាចបង្កើតគណនីសាលាបានទេ។ សូមពិនិត្យមើលអ៊ីមែល រួចព្យាយាមម្តងទៀត។'
              : 'School account could not be created. Check the email and try again.',
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
