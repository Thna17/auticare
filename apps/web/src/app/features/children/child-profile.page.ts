import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChildResponse } from '@auticare/contracts';
import { ChildrenApi } from './data-access/children.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiMessageComponent, UiSpinnerComponent],
  template: `
    <a class="back-link" routerLink="/children">Back to children</a>

    @if (loading()) {
      <ac-ui-spinner label="Loading child profile…" />
    } @else if (error()) {
      <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
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
          <button type="button" class="secondary-button" (click)="resetForm()">
            Discard changes
          </button>
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
            <p>
              Keep the core information current for screening, school reports, and support plans.
            </p>
          </header>

          <label class="field">
            <span>First name</span>
            <input
              type="text"
              formControlName="firstName"
              autocomplete="off"
              [attr.aria-invalid]="
                form.controls.firstName.touched && form.controls.firstName.invalid
              "
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
            <ac-ui-message tone="success">{{ saveMessage() }}</ac-ui-message>
          }
          @if (saveError()) {
            <ac-ui-message tone="error">{{ saveError() }}</ac-ui-message>
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
        color: var(--ac-color-action-deep);
        display: inline-flex;
        margin-bottom: 22px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
      }

      .back-link:hover {
        text-decoration: underline;
      }

      .profile-hero {
        border-radius: 8px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
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
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-dark);
        display: grid;
        place-items: center;
        font-size: 28px;
        font-weight: var(--ac-font-weight-bold);
        flex: 0 0 auto;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .eyebrow {
        color: var(--ac-color-olive);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0;
        margin-bottom: 6px;
      }

      h1 {
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: 1.2;
        letter-spacing: 0;
      }

      .identity p:last-child {
        color: var(--ac-color-text-body);
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
        font-weight: var(--ac-font-weight-bold);
        padding: 0 18px;
      }

      .secondary-button {
        border: 1px solid var(--ac-color-primary);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
      }

      .danger-button {
        border: 1px solid var(--ac-color-red-600);
        background: var(--ac-color-surface);
        color: var(--ac-color-alert-strong);
      }

      .primary-button {
        width: 100%;
        border: 0;
        border-radius: 14px;
        background: var(--ac-color-primary);
        color: var(--ac-color-ink-d);
        box-shadow: 0 14px 28px rgb(61 99 117 / 0.12);
      }

      .primary-button:hover:not(:disabled) {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
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
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
        background: var(--ac-color-surface);
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.05);
      }

      .summary-grid article {
        padding: 18px;
        display: grid;
        gap: 8px;
      }

      .summary-grid span,
      .snapshot-row span {
        color: var(--ac-color-grey-c);
        font-size: var(--ac-type-label);
        line-height: 1.3;
      }

      .summary-grid strong,
      .snapshot-row strong {
        color: var(--ac-color-text-strong);
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
        color: var(--ac-color-text-strong);
        font-size: 24px;
        line-height: 1.3;
      }

      .profile-form header p,
      .note-box p {
        color: var(--ac-color-text-body);
        line-height: 1.55;
      }

      .field {
        display: grid;
        gap: 10px;
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-bold);
      }

      input,
      textarea {
        width: 100%;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 12px;
        background: var(--ac-color-tint-blue-pale);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-weight: var(--ac-font-weight-regular);
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
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface);
        box-shadow: 0 0 0 4px rgb(61 99 117 / 0.12);
        outline: none;
      }

      input[aria-invalid='true'] {
        border-color: var(--ac-color-red-600);
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
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
      }

      .success,
      .status {
        background: var(--ac-color-sage-light);
        color: var(--ac-color-olive-darkest);
      }

      .snapshot-row {
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: 16px;
        display: grid;
        gap: 6px;
      }

      .note-box {
        border-radius: 8px;
        background: var(--ac-color-surface-info);
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
