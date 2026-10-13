import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ChildrenApi } from './data-access/children.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { I18nService } from '../../core/i18n/i18n.service';

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
    <a class="back-link" routerLink="/children">
      {{ currentLang() === 'km' ? '← ត្រឡប់ទៅបញ្ជីកុមារ' : '← Back to children' }}
    </a>

    <header class="page-header">
      <p class="eyebrow">
        {{ currentLang() === 'km' ? 'ការចុះឈ្មោះកុមារ' : 'Child Registration' }}
      </p>
      <h1>
        {{ currentLang() === 'km' ? 'បន្ថែមទិន្នន័យកុមារ' : 'Add a Child Profile' }}
      </h1>
      <p class="subtitle">
        {{
          currentLang() === 'km'
            ? 'បង្កើតប្រវត្តិរូបគ្លីនិករបស់កូនអ្នក សម្រាប់ការតាមដានការលូតលាស់ ការវាយតម្លៃ និងការថែទាំឯកទេស។'
            : "Set up your child's clinical profile for developmental milestone tracking, autism screenings, and specialized pediatric care."
        }}
      </p>
    </header>

    <form class="child-form" [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
      <!-- Step 1: Personal Identity -->
      <section class="step-card" aria-labelledby="step-1-title">
        <div class="step-header">
          <span class="step-badge">
            {{ currentLang() === 'km' ? 'ជំហាន ១ នៃ ៣' : 'Step 1 of 3' }}
          </span>
          <h2 id="step-1-title">
            {{ currentLang() === 'km' ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Identity' }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'ឈ្មោះ និងថ្ងៃខែឆ្នាំកំណើត សម្រាប់ការវាយតម្លៃតាមកម្រិតអាយុជាក់ស្តែង។'
                : 'Legal or everyday name and birth date for age-normed clinical screening questionnaires.'
            }}
          </p>
        </div>

        <div class="fields-stack">
          <ac-ui-field
            [label]="currentLang() === 'km' ? 'នាមខ្លួន' : 'First Name'"
            [required]="true"
            [error]="
              form.controls.firstName.touched && form.controls.firstName.invalid
                ? currentLang() === 'km'
                  ? 'សូមបញ្ចូលនាមខ្លួន។'
                  : 'Enter a first name.'
                : null
            "
          >
            <input
              type="text"
              formControlName="firstName"
              autocomplete="off"
              maxlength="80"
              [placeholder]="currentLang() === 'km' ? 'ឧ. បុប្ផា' : 'e.g. Maya'"
            />
          </ac-ui-field>

          <ac-ui-field
            [label]="currentLang() === 'km' ? 'គោត្តនាម' : 'Last Name'"
            [optional]="true"
          >
            <input
              type="text"
              formControlName="lastName"
              autocomplete="off"
              maxlength="80"
              [placeholder]="
                currentLang() === 'km'
                  ? 'គោត្តនាម ឬនាមត្រកូល (ជាជម្រើស)'
                  : 'Optional family or surname'
              "
            />
          </ac-ui-field>

          <ac-ui-field
            [label]="currentLang() === 'km' ? 'ថ្ងៃខែឆ្នាំកំណើត' : 'Date of Birth'"
            [required]="true"
            [error]="
              form.controls.dateOfBirth.touched && form.controls.dateOfBirth.invalid
                ? currentLang() === 'km'
                  ? 'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើត។'
                  : 'Enter a date of birth.'
                : null
            "
          >
            <input type="date" formControlName="dateOfBirth" [max]="today" />
          </ac-ui-field>
        </div>

        <div class="guidance-tip">
          <span class="tip-icon" aria-hidden="true">ℹ️</span>
          <p>
            <strong>{{
              currentLang() === 'km' ? 'ការវាយតម្លៃតាមកម្រិតអាយុ៖' : 'Age-normed screening:'
            }}</strong>
            {{
              currentLang() === 'km'
                ? ' កម្រងសំណួរវាយតម្លៃអាកប្បកិរិយា និងវិញ្ញាណ នឹងសម្របតាមអាយុគិតជាខែរបស់កុមារដោយស្វ័យប្រវត្តិ។'
                : " Behavioral and sensory screening questionnaires automatically adapt to your child's chronological age in months."
            }}
          </p>
        </div>
      </section>

      <!-- Step 2: Residential Context -->
      <section class="step-card" aria-labelledby="step-2-title">
        <div class="step-header">
          <span class="step-badge">
            {{ currentLang() === 'km' ? 'ជំហាន ២ នៃ ៣' : 'Step 2 of 3' }}
          </span>
          <h2 id="step-2-title">
            {{ currentLang() === 'km' ? 'ព័ត៌មានទីលំនៅ' : 'Residential Information' }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'ទីតាំងរស់នៅជួយណែនាំមន្ទីរពេទ្យកុមារ និងអ្នកឯកទេសនៅជិតអ្នក។'
                : 'Home location helps us discover and recommend nearby pediatric hospitals and developmental specialists.'
            }}
          </p>
        </div>

        <div class="fields-stack">
          <ac-ui-field
            [label]="currentLang() === 'km' ? 'អាសយដ្ឋានបច្ចុប្បន្ន' : 'Residential address'"
            [optional]="true"
          >
            <input
              type="text"
              formControlName="address"
              autocomplete="off"
              maxlength="500"
              [placeholder]="
                currentLang() === 'km' ? 'ឧ. រាជធានីភ្នំពេញ កម្ពុជា' : 'e.g. Phnom Penh, Cambodia'
              "
            />
          </ac-ui-field>
        </div>

        <div class="guidance-tip">
          <span class="tip-icon" aria-hidden="true">📍</span>
          <p>
            {{
              currentLang() === 'km'
                ? 'ទិន្នន័យទីតាំងត្រូវបានរក្សាការសម្ងាត់ និងប្រើសម្រាប់តែការណាត់ជួបអ្នកឯកទេសប៉ុណ្ណោះ។'
                : 'Location data is kept private and used only for matching specialist appointments and local center recommendations.'
            }}
          </p>
        </div>
      </section>

      <!-- Step 3: Support & Sensory Notes -->
      <section class="step-card" aria-labelledby="step-3-title">
        <div class="step-header">
          <span class="step-badge">
            {{ currentLang() === 'km' ? 'ជំហាន ៣ នៃ ៣' : 'Step 3 of 3' }}
          </span>
          <h2 id="step-3-title">
            {{
              currentLang() === 'km'
                ? 'កំណត់ត្រាវេជ្ជសាស្ត្រ និងការគាំទ្រ'
                : 'Support & Sensory Care Notes'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'កត់ត្រាការសង្កេតបឋម ភាពងាយរងរំញោចញាណដឹង វិធីសាស្ត្រទំនាក់ទំនង ឬទម្លាប់សម្រួលអារម្មណ៍។'
                : 'Record initial observations, sensory sensitivities, communication methods, or calming routines.'
            }}
          </p>
        </div>

        <div class="fields-stack">
          <ac-ui-field
            [label]="currentLang() === 'km' ? 'កំណត់ត្រាវេជ្ជសាស្ត្រ' : 'Medical Notes'"
            [optional]="true"
          >
            <textarea
              rows="5"
              formControlName="notes"
              maxlength="2000"
              [placeholder]="
                currentLang() === 'km'
                  ? 'ចំណូលចិត្តញាណដឹង វិធីសាស្ត្រទំនាក់ទំនង របស់លេងកម្សាន្តចិត្ត ឬកំណត់ត្រាវេជ្ជសាស្ត្រគ្លីនិក។'
                  : 'Sensory preferences (e.g. sound sensitivity), communication styles, favorite comfort items, or clinical background notes.'
              "
            ></textarea>
          </ac-ui-field>
        </div>

        <div class="guidance-tip">
          <span class="tip-icon" aria-hidden="true">💡</span>
          <p>
            <strong>{{
              currentLang() === 'km' ? 'ការសម្ងាត់គ្លីនិក៖' : 'Clinical privacy:'
            }}</strong>
            {{
              currentLang() === 'km'
                ? ' កំណត់ត្រាថែទាំត្រូវបានរក្សាការសម្ងាត់ជាលំនាំដើម។ អ្នកអាចមើលឡើងវិញបានគ្រប់ពេល។'
                : ' Care notes are private by default. You can reference them anytime during specialist consultations or export them in clinical progress summaries.'
            }}
          </p>
        </div>
      </section>

      @if (error()) {
        <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
      }

      <footer class="form-actions">
        <a class="cancel-link" routerLink="/children">{{
          currentLang() === 'km' ? 'បោះបង់' : 'Cancel'
        }}</a>
        <button type="submit" class="submit-button" [disabled]="saving()">
          {{
            saving()
              ? currentLang() === 'km'
                ? 'កំពុងរក្សាទុក...'
                : 'Saving...'
              : currentLang() === 'km'
                ? 'រក្សាទុកទិន្នន័យកុមារ'
                : 'Save Child'
          }}
        </button>
      </footer>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 780px;
        margin: 0 auto;
      }

      .back-link {
        color: var(--ac-color-action-deep);
        display: inline-flex;
        margin-bottom: 24px;
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
        transition: transform var(--ac-motion-fast);
      }

      .back-link:hover {
        text-decoration: underline;
        transform: translateX(-2px);
      }

      .page-header {
        margin-bottom: 30px;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: var(--ac-color-action-mid);
        font-size: var(--ac-type-meta);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      h1 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: 700;
      }

      .subtitle {
        margin: 10px 0 0;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      .child-form {
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      .step-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 24px 28px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        transition: box-shadow var(--ac-motion-fast);
      }

      .step-card:hover {
        box-shadow: var(--ac-shadow-md);
      }

      .step-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 8px;
      }

      .step-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 18px;
        font-weight: 700;
      }

      .step-header p {
        margin: 4px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: 1.45;
      }

      .fields-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .guidance-tip {
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-subtle);
        padding: 12px 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .tip-icon {
        font-size: 16px;
        line-height: 1.2;
        flex: 0 0 auto;
      }

      .guidance-tip p {
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      .guidance-tip p strong {
        color: var(--ac-color-text-strong);
      }

      .form-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-top: 8px;
        padding-top: 12px;
      }

      .cancel-link {
        color: var(--ac-color-action-deep);
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
        padding: 8px 12px;
        border-radius: var(--ac-radius-md);
        transition: background var(--ac-motion-fast);
      }

      .cancel-link:hover {
        background: var(--ac-color-surface-info);
        text-decoration: underline;
      }

      .submit-button {
        min-height: 48px;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font: inherit;
        font-size: 14px;
        font-weight: 700;
        padding: 0 26px;
        cursor: pointer;
        box-shadow: var(--ac-shadow-sm);
        transition: all var(--ac-motion-fast);
      }

      .submit-button:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-1px);
      }

      .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      @media (max-width: 640px) {
        .step-card {
          padding: 18px 20px;
        }

        .form-actions {
          flex-direction: column-reverse;
          align-items: stretch;
        }

        .cancel-link,
        .submit-button {
          text-align: center;
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateChildPage {
  private readonly api = inject(ChildrenApi);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;
  readonly today = new Date().toISOString().slice(0, 10);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', Validators.maxLength(80)],
    dateOfBirth: ['', Validators.required],
    address: ['', Validators.maxLength(500)],
    notes: ['', Validators.maxLength(2000)],
  });

  submit() {
    this.error.set(null);
    if (this.auth.parent()?.role !== 'PARENT') {
      this.error.set(
        'Only parent accounts can create child profiles. Log in with a parent account.',
      );
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fix the highlighted fields before creating the child profile.');
      return;
    }

    const value = this.form.getRawValue();
    const dateOfBirth = this.normalizeDateOfBirth(value.dateOfBirth);
    if (!dateOfBirth) {
      this.form.controls.dateOfBirth.markAsTouched();
      this.error.set('Use a valid date of birth.');
      return;
    }

    this.saving.set(true);
    this.api
      .createChild({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim() || undefined,
        dateOfBirth,
        address: value.address.trim() || undefined,
        notes: value.notes.trim() || undefined,
      })
      .subscribe({
        next: (child) => void this.router.navigate(['/children', child.id]),
        error: (error: unknown) => {
          this.error.set(this.errorMessage(error));
          this.saving.set(false);
        },
      });
  }

  private normalizeDateOfBirth(value: string): string | null {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const localDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (!localDate) return null;

    const [, day, month, year] = localDate;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Only parent accounts can create child profiles. Log in with a parent account.';
      }
      const message = (error.error as { error?: { message?: string } } | null)?.error?.message;
      if (message) return message;
    }
    return 'Child profile could not be created. Please try again.';
  }
}
