import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiDialogComponent } from '../../../design-system/components/ui-dialog.component';
import { UiFieldComponent } from '../../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../../design-system/components/ui-message.component';
import { AccessibleFormDirective } from '../../../design-system/directives/accessible-form.directive';
import { ChildrenApi } from '../data-access/children.api';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { ChildResponse } from '@auticare/contracts';

@Component({
  standalone: true,
  selector: 'ac-add-child-modal',
  imports: [
    ReactiveFormsModule,
    UiDialogComponent,
    UiFieldComponent,
    UiMessageComponent,
    AccessibleFormDirective,
  ],
  template: `
    @if (isOpen()) {
      <ac-ui-dialog
        [heading]="currentLang() === 'km' ? 'បន្ថែមទិន្នន័យកុមារ' : 'Add Child Profile'"
        [showCloseButton]="true"
        size="md"
        (close)="onCancel()"
      >
        <form
          class="child-modal-form"
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          acAccessibleForm
          novalidate
        >
          <div class="fields-stack">
            <ac-ui-field
              [label]="currentLang() === 'km' ? 'នាមខ្លួន' : 'First Name'"
              [required]="true"
              [error]="
                form.controls.firstName.touched && form.controls.firstName.invalid
                  ? currentLang() === 'km'
                    ? 'សូមបញ្ចូលនាមខ្លួន។'
                    : 'First Name is required.'
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
                [placeholder]="currentLang() === 'km' ? 'គោត្តនាម (ជាជម្រើស)' : 'Optional surname'"
              />
            </ac-ui-field>

            <ac-ui-field
              [label]="currentLang() === 'km' ? 'ថ្ងៃខែឆ្នាំកំណើត' : 'Date of Birth'"
              [required]="true"
              [error]="
                form.controls.dateOfBirth.touched && form.controls.dateOfBirth.invalid
                  ? currentLang() === 'km'
                    ? 'សូមជ្រើសរើសថ្ងៃខែឆ្នាំកំណើត។'
                    : 'Date of Birth is required.'
                  : null
              "
            >
              <input type="date" formControlName="dateOfBirth" [max]="today" />
            </ac-ui-field>

            <ac-ui-field [label]="currentLang() === 'km' ? 'ភេទ' : 'Gender'" [optional]="true">
              <select formControlName="gender">
                <option value="">
                  {{
                    currentLang() === 'km' ? 'ជ្រើសរើសភេទ (ជាជម្រើស)' : 'Select Gender (Optional)'
                  }}
                </option>
                <option value="FEMALE">
                  {{ currentLang() === 'km' ? 'ស្រី' : 'Female' }}
                </option>
                <option value="MALE">
                  {{ currentLang() === 'km' ? 'ប្រុស' : 'Male' }}
                </option>
                <option value="OTHER">
                  {{ currentLang() === 'km' ? 'ផ្សេងទៀត' : 'Other' }}
                </option>
              </select>
            </ac-ui-field>

            <ac-ui-field
              [label]="currentLang() === 'km' ? 'កំណត់ត្រាវេជ្ជសាស្ត្រ' : 'Medical Notes'"
              [optional]="true"
            >
              <textarea
                rows="4"
                formControlName="notes"
                maxlength="2000"
                [placeholder]="
                  currentLang() === 'km'
                    ? 'ចំណូលចិត្តញាណដឹង វិធីសាស្ត្រទំនាក់ទំនង ឬកំណត់ត្រាវេជ្ជសាស្ត្រ…'
                    : 'Sensory preferences, communication notes, or medical history…'
                "
              ></textarea>
            </ac-ui-field>
          </div>

          @if (error()) {
            <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
          }

          <div dialogFooter class="modal-actions">
            <button
              type="button"
              class="secondary-button cancel-btn"
              (click)="onCancel()"
              [disabled]="saving()"
            >
              {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
            </button>
            <button type="submit" class="primary-button save-btn" [disabled]="saving()">
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
          </div>
        </form>
      </ac-ui-dialog>
    }
  `,
  styles: [
    `
      .child-modal-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .fields-stack {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      select,
      input,
      textarea {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        font-size: 14px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-family: inherit;
        box-sizing: border-box;
      }

      select:focus,
      input:focus,
      textarea:focus {
        outline: none;
        border-color: var(--ac-color-action-deep);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ac-color-focus) 15%, transparent);
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 18px;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-border-subtle);
      }

      .secondary-button {
        padding: 9px 18px;
        background: transparent;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        color: var(--ac-color-text-body);
      }

      .primary-button {
        padding: 9px 20px;
        background: var(--ac-color-action-deep);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: var(--ac-radius-md);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
      }

      .primary-button:disabled,
      .secondary-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddChildModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();
  readonly saved = output<ChildResponse>();

  private readonly api = inject(ChildrenApi);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;

  readonly today = new Date().toISOString().slice(0, 10);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', Validators.maxLength(80)],
    dateOfBirth: ['', Validators.required],
    gender: [''],
    notes: ['', Validators.maxLength(2000)],
  });

  onCancel(): void {
    this.form.reset();
    this.error.set(null);
    this.close.emit();
  }

  onSubmit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        this.currentLang() === 'km'
          ? 'សូមពិនិត្យ និងបំពេញព័ត៌មានដែលត្រូវការ។'
          : 'Please fill in all required fields.',
      );
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.api
      .createChild({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim() || undefined,
        dateOfBirth: value.dateOfBirth,
        notes: value.notes.trim() || undefined,
      })
      .subscribe({
        next: (created) => {
          this.saving.set(false);
          this.form.reset();
          this.saved.emit(created);
          this.close.emit();
        },
        error: () => {
          this.saving.set(false);
          this.error.set(
            this.currentLang() === 'km'
              ? 'មិនអាចរក្សាទុកទិន្នន័យកុមារបានទេ។ សូមព្យាយាមម្តងទៀត។'
              : 'Failed to create child profile. Please try again.',
          );
        },
      });
  }
}
