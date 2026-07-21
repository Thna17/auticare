import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiCardComponent],
  template: `
    <section class="page-header">
      <p class="eyebrow">Administration</p>
      <h1>Create school account</h1>
      <p>Create the school profile and the staff login in one secure action.</p>
    </section>

    <ac-ui-card>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <fieldset formGroupName="school">
          <legend>School profile</legend>
          <label>
            Name
            <input type="text" formControlName="name" />
            @if (showError('school.name')) {
              <span class="field-error">School name is required.</span>
            }
          </label>
          <label>
            City
            <input type="text" formControlName="city" />
            @if (showError('school.city')) {
              <span class="field-error">City is required.</span>
            }
          </label>
          <label>
            Address
            <input type="text" formControlName="address" />
            @if (showError('school.address')) {
              <span class="field-error">Address is required.</span>
            }
          </label>
          <label>
            Description
            <textarea rows="4" formControlName="description"></textarea>
            @if (showError('school.description')) {
              <span class="field-error">Description must be 2,000 characters or fewer.</span>
            }
          </label>
        </fieldset>

        <fieldset formGroupName="account">
          <legend>Login account</legend>
          <label>
            Email
            <input type="email" formControlName="email" />
            @if (showError('account.email')) {
              <span class="field-error">Enter a valid email address.</span>
            }
          </label>
          <label>
            Password
            <input type="password" formControlName="password" />
            @if (showError('account.password')) {
              <span class="field-error">Password must be at least 12 characters.</span>
            }
          </label>
          <label>
            First name
            <input type="text" formControlName="firstName" />
            @if (showError('account.firstName')) {
              <span class="field-error">First name is required.</span>
            }
          </label>
          <label>
            Last name
            <input type="text" formControlName="lastName" />
            @if (showError('account.lastName')) {
              <span class="field-error">Last name is required.</span>
            }
          </label>
          <label>
            Title
            <input type="text" formControlName="title" />
            @if (showError('account.title')) {
              <span class="field-error">Title must be 120 characters or fewer.</span>
            }
          </label>
        </fieldset>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        @if (message()) {
          <p class="success" role="status">{{ message() }}</p>
        }

        <button type="submit" [disabled]="saving()">
          {{ saving() ? 'Creating...' : 'Create school account' }}
        </button>
      </form>
    </ac-ui-card>
  `,
  styles: [
    `
      .page-header {
        max-width: 760px;
        margin-bottom: 28px;
      }
      .eyebrow {
        color: #3d6375;
        font-weight: 800;
      }
      h1 {
        margin: 0;
        font-size: 40px;
      }
      form,
      fieldset {
        display: grid;
        gap: 16px;
      }
      fieldset {
        border: 1px solid #d4e6ef;
        border-radius: 8px;
        padding: 18px;
      }
      legend {
        font-weight: 800;
        padding: 0 8px;
      }
      label {
        display: grid;
        gap: 8px;
        font-weight: 700;
      }
      input,
      textarea {
        border: 1px solid #c1d3dc;
        border-radius: 8px;
        padding: 12px;
        font: inherit;
      }
      button {
        width: fit-content;
        border: 0;
        border-radius: 8px;
        background: #3d6375;
        color: #ffffff;
        padding: 12px 18px;
        font-weight: 800;
      }
      .error {
        color: #a23434;
        font-weight: 700;
      }
      .field-error {
        color: #a23434;
        font-size: 14px;
        font-weight: 700;
      }
      .success {
        color: #236b43;
        font-weight: 700;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSchoolAccountPage {
  private readonly api = inject(SchoolsApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
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
      password: ['', [Validators.required, Validators.minLength(12)]],
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
      this.error.set('Fix the highlighted fields before creating the account.');
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
          password: value.account.password,
          firstName: value.account.firstName.trim(),
          lastName: value.account.lastName.trim(),
          title: value.account.title.trim() || undefined,
        },
      })
      .subscribe({
        next: (created) => {
          this.message.set(`${created.school.name} can now sign in.`);
          this.saving.set(false);
          void this.router.navigateByUrl('/schools/admin');
        },
        error: () => {
          this.error.set('School account could not be created. Check the email and try again.');
          this.saving.set(false);
        },
      });
  }

  protected showError(path: string) {
    const control = this.form.get(path);
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }
}
