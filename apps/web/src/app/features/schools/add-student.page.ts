import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiCardComponent, RouterLink, UiMessageComponent],
  selector: 'ac-add-student-page',
  template: `
    <section class="page-header">
      <div class="header-text">
        <h1>Add New Student</h1>
        <p>Create a student enrollment with guardian information.</p>
      </div>
    </section>

    <ac-ui-card>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <!-- Student Information -->
        <fieldset formGroupName="student">
          <legend>Student Information</legend>

          <label>
            First Name *
            <input type="text" formControlName="firstName" placeholder="e.g. Leo" />
            @if (showError('student.firstName')) {
              <span class="field-error">First name is required.</span>
            }
          </label>

          <label>
            Date of Birth *
            <input type="date" formControlName="dateOfBirth" />
            @if (showError('student.dateOfBirth')) {
              <span class="field-error">Date of birth is required.</span>
            }
          </label>

          @if (ageDisplay()) {
            <div class="computed-field">
              <span class="computed-label">Age</span>
              <span class="computed-value">{{ ageDisplay() }}</span>
            </div>
          }

          <label>
            Photo URL
            <input type="url" formControlName="photoUrl" placeholder="https://..." />
            @if (showError('student.photoUrl')) {
              <span class="field-error">Enter a valid URL.</span>
            }
          </label>

          <label>
            Address
            <textarea rows="2" formControlName="address" placeholder="Home address..."></textarea>
          </label>
        </fieldset>

        <!-- Guardian Information -->
        <fieldset formGroupName="guardian">
          <legend>Guardian Information</legend>

          <div class="form-row">
            <label>
              First Name *
              <input type="text" formControlName="guardianFirstName" placeholder="e.g. Sarah" />
              @if (showError('guardian.guardianFirstName')) {
                <span class="field-error">Required.</span>
              }
            </label>

            <label>
              Last Name *
              <input type="text" formControlName="guardianLastName" placeholder="e.g. Bennett" />
              @if (showError('guardian.guardianLastName')) {
                <span class="field-error">Required.</span>
              }
            </label>
          </div>

          <label>
            Email *
            <input
              type="email"
              formControlName="guardianEmail"
              placeholder="guardian@example.com"
            />
            @if (showError('guardian.guardianEmail')) {
              <span class="field-error">Enter a valid email address.</span>
            }
          </label>

          <label>
            Phone Number
            <input type="tel" formControlName="guardianPhone" placeholder="+1 (555) 123-4567" />
          </label>

          <label>
            Social Media
            <input
              type="text"
              formControlName="guardianSocialMedia"
              placeholder="@username or profile URL"
            />
          </label>
        </fieldset>

        @if (error()) {
          <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
        }
        @if (success()) {
          <ac-ui-message tone="success">{{ success() }}</ac-ui-message>
        }

        <div class="form-actions">
          <a routerLink="/schools/enrollments" class="btn-secondary">Cancel</a>
          <button type="submit" [disabled]="saving()" class="btn-primary">
            {{ saving() ? 'Creating...' : 'Add Student' }}
          </button>
        </div>
      </form>
    </ac-ui-card>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .header-text h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .header-text p {
        margin: 0;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }

      form {
        display: grid;
        gap: 24px;
      }

      fieldset {
        display: grid;
        gap: 16px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        padding: 20px;
        background: white;
      }

      legend {
        font-weight: 700;
        font-size: 16px;
        color: var(--ac-color-text-slate-strong);
        padding: 0 8px;
      }

      label {
        display: grid;
        gap: 6px;
        font-weight: 600;
        font-size: 14px;
        color: var(--ac-color-slate-700);
      }

      input,
      textarea {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        padding: 10px 14px;
        font: inherit;
        font-size: 14px;
        transition: border-color 0.2s;
      }

      input:focus,
      textarea:focus {
        outline: none;
        border-color: var(--ac-color-action-alt);
        box-shadow: 0 0 0 3px rgba(45, 106, 122, 0.1);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .computed-field {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
      }

      .computed-label {
        font-weight: 600;
        font-size: 14px;
        color: var(--ac-color-text-slate);
      }

      .computed-value {
        font-weight: 700;
        font-size: 14px;
        color: var(--ac-color-text-slate-strong);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 8px;
      }

      .btn-primary {
        border: 0;
        border-radius: 10px;
        background: var(--ac-color-action-alt);
        color: white;
        padding: 12px 24px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .btn-primary:hover {
        background: var(--ac-color-ink-a);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-secondary {
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        background: white;
        color: var(--ac-color-text-slate);
        padding: 12px 24px;
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary:hover {
        border-color: var(--ac-color-slate-300);
        background: var(--ac-color-surface-slate);
      }

      .error {
        color: var(--ac-color-alert-text);
        font-weight: 600;
        font-size: 14px;
      }

      .field-error {
        color: var(--ac-color-alert-text);
        font-size: 12px;
        font-weight: 600;
      }

      .success {
        color: var(--ac-color-green-700);
        font-weight: 600;
        font-size: 14px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStudentPage {
  private readonly api = inject(SchoolsApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    student: this.fb.nonNullable.group({
      firstName: ['', [Validators.required, Validators.maxLength(80)]],
      dateOfBirth: ['', [Validators.required]],
      photoUrl: ['', [Validators.maxLength(1000)]],
      address: ['', [Validators.maxLength(500)]],
    }),
    guardian: this.fb.nonNullable.group({
      guardianFirstName: ['', [Validators.required, Validators.maxLength(80)]],
      guardianLastName: ['', [Validators.required, Validators.maxLength(80)]],
      guardianEmail: ['', [Validators.required, Validators.email]],
      guardianPhone: ['', [Validators.maxLength(40)]],
      guardianSocialMedia: ['', [Validators.maxLength(300)]],
    }),
  });

  ageDisplay(): string | null {
    const dob = this.form.get('student.dateOfBirth')?.value;
    if (!dob) return null;
    const birthDate = new Date(`${dob}T00:00:00.000Z`);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    if (years < 0) return null;
    return years === 1 ? '1 year old' : `${years} years old`;
  }

  submit() {
    this.error.set(null);
    this.success.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fix the highlighted fields before submitting.');
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.api
      .createStudent({
        firstName: value.student.firstName.trim(),
        dateOfBirth: value.student.dateOfBirth,
        photoUrl: value.student.photoUrl.trim() || undefined,
        address: value.student.address.trim() || undefined,
        guardianFirstName: value.guardian.guardianFirstName.trim(),
        guardianLastName: value.guardian.guardianLastName.trim(),
        guardianEmail: value.guardian.guardianEmail.trim(),
        guardianPhone: value.guardian.guardianPhone.trim() || undefined,
        guardianSocialMedia: value.guardian.guardianSocialMedia.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.success.set('Student enrolled successfully!');
          this.saving.set(false);
          setTimeout(() => void this.router.navigateByUrl('/schools/enrollments'), 1200);
        },
        error: (err) => {
          const msg =
            err?.error?.error?.message ||
            'Failed to create student. The guardian email may already be in use.';
          this.error.set(msg);
          this.saving.set(false);
        },
      });
  }

  protected showError(path: string) {
    const control = this.form.get(path);
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }
}
