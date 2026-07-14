import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChildResponse } from '@auticare/contracts';
import { ChildrenApi } from './data-access/children.api';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a class="back-link" routerLink="/children">Back to children</a>

    @if (loading()) {
      <p class="status" aria-live="polite">Loading child profile...</p>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    } @else if (child()) {
      <section class="profile-hero">
        <div class="identity">
          <div class="avatar" aria-hidden="true">{{ initials(child()!) }}</div>
          <div>
            <p class="eyebrow">Child profile</p>
            <h1>{{ child()!.firstName }}</h1>
            <p>{{ ageLabel(child()!.dateOfBirth) }} · Born {{ child()!.dateOfBirth }}</p>
          </div>
        </div>
        <div class="hero-actions">
          <button type="button" class="secondary-button" (click)="resetForm()">Discard changes</button>
          <button type="button" class="danger-button" (click)="archive()">Archive profile</button>
        </div>
      </section>

      <section class="summary-grid" aria-label="Child profile summary">
        <article>
          <span>Profile status</span>
          <strong>{{ child()!.archivedAt ? 'Archived' : 'Active' }}</strong>
        </article>
        <article>
          <span>Age</span>
          <strong>{{ ageLabel(child()!.dateOfBirth) }}</strong>
        </article>
        <article>
          <span>Care notes</span>
          <strong>{{ child()!.notes ? 'Added' : 'Not added' }}</strong>
        </article>
      </section>

      <section class="content-grid">
        <form class="profile-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <header>
            <h2>Profile details</h2>
            <p>Keep the core information current for screening, school reports, and support plans.</p>
          </header>

          <label class="field">
            <span>First name</span>
            <input
              type="text"
              formControlName="firstName"
              autocomplete="off"
              [attr.aria-invalid]="form.controls.firstName.touched && form.controls.firstName.invalid"
            />
          </label>
          @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
            <p class="field-error">Enter a first name.</p>
          }

          <label class="field">
            <span>Date of birth</span>
            <input
              type="date"
              formControlName="dateOfBirth"
              [attr.aria-invalid]="
                form.controls.dateOfBirth.touched && form.controls.dateOfBirth.invalid
              "
            />
          </label>
          @if (form.controls.dateOfBirth.touched && form.controls.dateOfBirth.invalid) {
            <p class="field-error">Use a valid date of birth.</p>
          }

          <label class="field">
            <span>Support notes</span>
            <textarea
              rows="7"
              formControlName="notes"
              placeholder="Sensory preferences, calming strategies, communication notes, or care context."
            ></textarea>
          </label>

          @if (saveMessage()) {
            <p class="success" role="status">{{ saveMessage() }}</p>
          }
          @if (saveError()) {
            <p class="form-error" role="alert">{{ saveError() }}</p>
          }

          <button class="primary-button" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving...' : 'Save profile' }}
          </button>
        </form>

        <aside class="profile-panel" aria-label="Support context">
          <h2>Support snapshot</h2>
          <div class="snapshot-row">
            <span>Preferred next step</span>
            <strong>Review screening plan</strong>
          </div>
          <div class="snapshot-row">
            <span>School reporting</span>
            <strong>Ready for activity updates</strong>
          </div>
          <div class="note-box">
            <h3>Care note</h3>
            <p>
              Use child notes for practical support information: sensory triggers, routines,
              preferred communication, or calming strategies.
            </p>
          </div>
        </aside>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .back-link {
        color: #164f68;
        display: inline-flex;
        margin-bottom: 22px;
        text-decoration: none;
        font-weight: 800;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      .profile-hero {
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #dde5e4;
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.06);
        padding: 26px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 18px;
      }

      .identity {
        display: flex;
        align-items: center;
        gap: 18px;
        min-width: 0;
      }

      .avatar {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        background: #d7e9c0;
        color: #3d4b2d;
        display: grid;
        place-items: center;
        font-size: 28px;
        font-weight: 900;
        flex: 0 0 auto;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .eyebrow {
        color: #546343;
        font-size: 13px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0;
        margin-bottom: 6px;
      }

      h1 {
        color: #001e2b;
        font-size: 40px;
        line-height: 1.2;
        letter-spacing: 0;
      }

      .identity p:last-child {
        color: #41484b;
        margin-top: 8px;
      }

      .hero-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      button {
        min-height: 46px;
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        padding: 0 18px;
      }

      .secondary-button {
        border: 1px solid #8db4c8;
        background: #ffffff;
        color: #164f68;
      }

      .danger-button {
        border: 1px solid #ba1a1a;
        background: #ffffff;
        color: #93000a;
      }

      .primary-button {
        width: 100%;
        border: 0;
        border-radius: 14px;
        background: #8db4c8;
        color: #123f52;
        box-shadow: 0 14px 28px rgb(61 99 117 / 0.12);
      }

      .primary-button:hover:not(:disabled) {
        background: #3d6375;
        color: #ffffff;
      }

      button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      .summary-grid article,
      .profile-form,
      .profile-panel {
        border: 1px solid #dde5e4;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.05);
      }

      .summary-grid article {
        padding: 18px;
        display: grid;
        gap: 8px;
      }

      .summary-grid span,
      .snapshot-row span {
        color: #71787c;
        font-size: 14px;
        line-height: 1.3;
      }

      .summary-grid strong,
      .snapshot-row strong {
        color: #001e2b;
        font-size: 18px;
      }

      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
        gap: 18px;
        align-items: start;
      }

      .profile-form,
      .profile-panel {
        padding: 24px;
        display: grid;
        gap: 20px;
      }

      .profile-form header,
      .profile-panel {
        gap: 10px;
      }

      h2 {
        color: #001e2b;
        font-size: 24px;
        line-height: 1.3;
      }

      .profile-form header p,
      .note-box p {
        color: #41484b;
        line-height: 1.55;
      }

      .field {
        display: grid;
        gap: 10px;
        color: #001e2b;
        font-weight: 800;
      }

      input,
      textarea {
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
        resize: vertical;
        min-height: 150px;
      }

      input:focus,
      textarea:focus {
        border-color: #3d6375;
        background: #ffffff;
        box-shadow: 0 0 0 4px rgb(61 99 117 / 0.12);
        outline: none;
      }

      input[aria-invalid='true'] {
        border-color: #ba1a1a;
      }

      .field-error,
      .form-error,
      .success,
      .status,
      .error {
        border-radius: 12px;
        padding: 14px 16px;
        line-height: 1.45;
      }

      .field-error,
      .form-error,
      .error {
        background: #ffdad6;
        color: #93000a;
      }

      .success,
      .status {
        background: #e7eedf;
        color: #244b2d;
      }

      .snapshot-row {
        border-bottom: 1px solid #dde5e4;
        padding-bottom: 16px;
        display: grid;
        gap: 6px;
      }

      .note-box {
        border-radius: 8px;
        background: #e8f6ff;
        padding: 18px;
        display: grid;
        gap: 8px;
      }

      h3 {
        font-size: 18px;
        line-height: 1.3;
      }

      @media (max-width: 860px) {
        .profile-hero,
        .identity {
          align-items: flex-start;
        }

        .profile-hero {
          flex-direction: column;
        }

        .summary-grid,
        .content-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        h1 {
          font-size: 32px;
        }

        .identity {
          flex-direction: column;
        }

        .hero-actions,
        .hero-actions button {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildProfilePage implements OnInit {
  private readonly api = inject(ChildrenApi);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly child = signal<ChildResponse | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    dateOfBirth: ['', Validators.required],
    notes: ['', Validators.maxLength(2000)],
  });

  ngOnInit() {
    this.load();
  }

  load() {
    const childId = this.route.snapshot.paramMap.get('childId');
    if (!childId) {
      this.error.set('Child profile was not found.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.api.getChild(childId).subscribe({
      next: (child) => {
        this.child.set(child);
        this.patchForm(child);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Child profile could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  save() {
    const child = this.child();
    if (!child) return;

    this.saveError.set(null);
    this.saveMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .updateChild(child.id, {
        firstName: value.firstName,
        dateOfBirth: value.dateOfBirth,
        notes: value.notes.trim(),
      })
      .subscribe({
        next: (updated) => {
          this.child.set(updated);
          this.patchForm(updated);
          this.saveMessage.set('Child profile saved.');
          this.saving.set(false);
        },
        error: () => {
          this.saveError.set('Child profile could not be saved.');
          this.saving.set(false);
        },
      });
  }

  resetForm() {
    const child = this.child();
    if (child) this.patchForm(child);
    this.saveError.set(null);
    this.saveMessage.set(null);
  }

  archive() {
    const child = this.child();
    if (!child) return;
    this.api.archiveChild(child.id).subscribe({
      next: () => void this.router.navigateByUrl('/children'),
      error: () => this.saveError.set('Child profile could not be archived.'),
    });
  }

  initials(child: ChildResponse): string {
    return child.firstName.slice(0, 2).toUpperCase();
  }

  ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) years -= 1;
    return years === 1 ? '1 year old' : `${Math.max(years, 0)} years old`;
  }

  private patchForm(child: ChildResponse) {
    this.form.setValue({
      firstName: child.firstName,
      dateOfBirth: child.dateOfBirth,
      notes: child.notes ?? '',
    });
    this.form.markAsPristine();
  }
}
