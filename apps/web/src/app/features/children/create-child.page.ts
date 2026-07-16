import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChildrenApi } from './data-access/children.api';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a class="back-link" routerLink="/children">Back to children</a>

    <section class="page-header">
      <p class="eyebrow">Family profiles</p>
      <h1>Add a child</h1>
      <p>Create a profile with the details that help AutiCare keep support organised.</p>
    </section>

    <form class="child-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label class="field">
        <span>First name</span>
        <input type="text" formControlName="firstName" autocomplete="off" maxlength="80" />
      </label>
      @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
        <p class="field-error">Enter a first name.</p>
      }

      <label class="field">
        <span>Date of birth</span>
        <input type="date" formControlName="dateOfBirth" [max]="today" />
      </label>
      @if (form.controls.dateOfBirth.touched && form.controls.dateOfBirth.invalid) {
        <p class="field-error">Enter a date of birth.</p>
      }

      <label class="field">
        <span>Support notes <em>(optional)</em></span>
        <textarea
          rows="6"
          formControlName="notes"
          maxlength="2000"
          placeholder="Sensory preferences, communication needs, routines, or anything useful for support."
        ></textarea>
      </label>

      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }

      <div class="form-actions">
        <a routerLink="/children">Cancel</a>
        <button type="submit" [disabled]="saving()">
          {{ saving() ? 'Creating profile...' : 'Create child profile' }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 760px;
      }
      h1,
      p {
        margin: 0;
      }
      .back-link {
        color: #164f68;
        display: inline-flex;
        margin-bottom: 22px;
        font-weight: 800;
        text-decoration: none;
      }
      .back-link:hover,
      .form-actions a:hover {
        text-decoration: underline;
      }
      .page-header {
        display: grid;
        gap: 9px;
        margin-bottom: 28px;
      }
      .eyebrow {
        color: #546343;
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
      }
      h1 {
        color: #001e2b;
        font-size: 40px;
        line-height: 1.2;
      }
      .page-header p:last-child {
        color: #41484b;
        font-size: 17px;
        line-height: 1.55;
      }
      .child-form {
        border: 1px solid #dde5e4;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.06);
        display: grid;
        gap: 20px;
        padding: 26px;
      }
      .field {
        color: #001e2b;
        display: grid;
        font-weight: 800;
        gap: 10px;
      }
      em {
        color: #71787c;
        font-style: normal;
        font-weight: 600;
      }
      input,
      textarea {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid #b8c2c8;
        border-radius: 12px;
        background: #f8fcff;
        color: #001e2b;
        font: inherit;
        font-weight: 400;
        padding: 14px 16px;
      }
      input {
        min-height: 54px;
      }
      textarea {
        min-height: 144px;
        resize: vertical;
      }
      input:focus,
      textarea:focus {
        border-color: #3d6375;
        background: #ffffff;
        box-shadow: 0 0 0 4px rgb(61 99 117 / 0.12);
        outline: none;
      }
      .field-error,
      .form-error {
        border-radius: 8px;
        background: #ffdad6;
        color: #93000a;
        margin: -8px 0 0;
        padding: 12px 14px;
      }
      .form-actions {
        align-items: center;
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
      .form-actions a {
        color: #164f68;
        font-weight: 800;
        text-decoration: none;
      }
      button {
        min-height: 48px;
        border: 0;
        border-radius: 12px;
        background: #3d6375;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        padding: 0 20px;
      }
      button:hover:not(:disabled) {
        background: #244b5d;
      }
      button:disabled {
        cursor: progress;
        opacity: 0.72;
      }
      @media (max-width: 640px) {
        h1 {
          font-size: 32px;
        }
        .child-form {
          padding: 20px;
        }
        .form-actions {
          align-items: stretch;
          flex-direction: column-reverse;
        }
        .form-actions a,
        button {
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
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly today = new Date().toISOString().slice(0, 10);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    dateOfBirth: ['', Validators.required],
    notes: ['', Validators.maxLength(2000)],
  });

  submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api.createChild({ ...value, notes: value.notes.trim() || undefined }).subscribe({
      next: (child) => void this.router.navigate(['/children', child.id]),
      error: () => {
        this.error.set('Child profile could not be created. Please try again.');
        this.saving.set(false);
      },
    });
  }
}
