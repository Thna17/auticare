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
      <p class="eyebrow">School workspace</p>
      <h1>Create activity report</h1>
      <p>Share classroom observations with the child’s family.</p>
    </section>

    <ac-ui-card>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Child ID <input type="text" formControlName="childId" /></label>
        <label>Title <input type="text" formControlName="title" /></label>
        <label>Activity date <input type="date" formControlName="activityDate" /></label>
        <label>Summary <textarea rows="6" formControlName="summary"></textarea></label>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        @if (message()) {
          <p class="success" role="status">{{ message() }}</p>
        }

        <button type="submit" [disabled]="saving()">
          {{ saving() ? 'Creating...' : 'Create report' }}
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
        font-weight: var(--ac-font-weight-bold);
      }
      h1 {
        margin: 0;
        font-size: var(--ac-type-page-title);
      }
      form {
        display: grid;
        gap: 16px;
      }
      label {
        display: grid;
        gap: 8px;
        font-weight: var(--ac-font-weight-semibold);
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
        font-weight: var(--ac-font-weight-bold);
      }
      .error {
        color: #a23434;
        font-weight: var(--ac-font-weight-semibold);
      }
      .success {
        color: #236b43;
        font-weight: var(--ac-font-weight-semibold);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSchoolReportPage {
  private readonly api = inject(SchoolsApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    childId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    activityDate: [new Date().toISOString().slice(0, 10), [Validators.required]],
    summary: ['', [Validators.required, Validators.maxLength(4000)]],
  });

  submit() {
    this.error.set(null);
    this.message.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Complete all report fields before submitting.');
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createReport({
        childId: value.childId.trim(),
        title: value.title.trim(),
        activityDate: value.activityDate,
        summary: value.summary.trim(),
      })
      .subscribe({
        next: () => {
          this.message.set('Activity report has been created.');
          this.saving.set(false);
          void this.router.navigateByUrl('/schools/reports');
        },
        error: () => {
          this.error.set('Report could not be created. Confirm the child is actively enrolled.');
          this.saving.set(false);
        },
      });
  }
}
