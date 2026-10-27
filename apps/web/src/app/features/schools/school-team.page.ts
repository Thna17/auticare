import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { SchoolStaffMember, TeacherCredentialsResponse } from '@auticare/contracts';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { SchoolStaffState } from './data-access/school-staff.state';
import { SchoolTeamApi } from './data-access/school-team.api';
import { printSlip } from './print-slip';

const STATUS_LABEL: Record<SchoolStaffMember['status'], string> = {
  ACTIVE: 'Active',
  SETUP_PENDING: 'Waiting for setup',
  DEACTIVATED: 'Deactivated',
};

const errorMessage = (err: unknown, fallback: string): string =>
  (err as { error?: { error?: { message?: string } } })?.error?.error?.message ?? fallback;

/**
 * The school admin's team page. Teachers get an AutiCare username and a
 * one-time setup code to hand over in person; no email address is needed.
 */
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiFieldComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    AccessibleFormDirective,
  ],
  selector: 'ac-school-team-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Team</h1>
        <p class="subtitle">
          Teachers sign in with a username and a one-time setup code you give them in person — no
          email address needed. Each teacher sees only the children you assign to them.
        </p>
      </div>
      @if (isSchoolAdmin()) {
        <div class="head-actions">
          <a class="btn-ghost" routerLink="/schools/connect">Family codes</a>
          <button type="button" class="btn-primary" (click)="toggleForm()">
            {{ showForm() ? 'Close' : 'Add teacher' }}
          </button>
        </div>
      }
    </header>

    @if (!isSchoolAdmin() && !loading()) {
      <ac-ui-message tone="info">
        Only your school admin can add teachers or change who works with which child.
      </ac-ui-message>
    }

    @if (credentials(); as cred) {
      <section class="credentials" aria-labelledby="cred-title">
        <div class="cred-head">
          <h2 id="cred-title">Give these to {{ cred.staff.firstName }} in person</h2>
          <button type="button" class="link-btn" (click)="credentials.set(null)">Done</button>
        </div>
        <div class="cred-grid">
          <div>
            <span class="cred-label">Username</span>
            <code class="cred-value">{{ cred.username }}</code>
          </div>
          <div>
            <span class="cred-label">Setup code</span>
            <code class="cred-value code">{{ cred.setupCode }}</code>
          </div>
        </div>
        <p class="cred-note">
          They open <strong>AutiCare → Sign in → “Set up your account”</strong>, enter both and
          choose a password. The code works once and expires
          {{ formatDate(cred.setupCodeExpiresAt) }}. It is shown only now — print it or write it
          down.
        </p>
        <div class="cred-actions">
          <button type="button" class="btn-primary" (click)="print(cred)">Print slip</button>
          <button type="button" class="btn-ghost" (click)="copy(cred)">
            {{ copied() ? 'Copied' : 'Copy' }}
          </button>
        </div>
      </section>
    }

    @if (showForm()) {
      <section class="card form-card" aria-labelledby="add-title">
        <h2 id="add-title">Add a teacher</h2>
        <form [formGroup]="form" (ngSubmit)="create()" acAccessibleForm novalidate>
          <div class="form-grid">
            <ac-ui-field
              label="First name"
              [required]="true"
              [error]="
                form.controls.firstName.touched && form.controls.firstName.invalid
                  ? 'Enter a first name.'
                  : null
              "
            >
              <input type="text" formControlName="firstName" autocomplete="off" />
            </ac-ui-field>
            <ac-ui-field
              label="Last name"
              [required]="true"
              [error]="
                form.controls.lastName.touched && form.controls.lastName.invalid
                  ? 'Enter a last name.'
                  : null
              "
            >
              <input type="text" formControlName="lastName" autocomplete="off" />
            </ac-ui-field>
            <ac-ui-field label="Title" [optional]="true" hint="For example: Speech therapist">
              <input type="text" formControlName="title" autocomplete="off" />
            </ac-ui-field>
          </div>
          @if (formError(); as message) {
            <ac-ui-message tone="error">{{ message }}</ac-ui-message>
          }
          <button type="submit" class="btn-primary" [disabled]="saving()">
            {{ saving() ? 'Creating…' : 'Create account' }}
          </button>
        </form>
      </section>
    }

    @if (loading()) {
      <ac-ui-spinner label="Loading team…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else {
      <section class="card" aria-label="Staff">
        <ul class="staff-list">
          @for (member of staff(); track member.id) {
            <li class="staff-row" [class.inactive]="member.status === 'DEACTIVATED'">
              <span class="avatar" aria-hidden="true">{{ initials(member) }}</span>
              <div class="who">
                <strong>{{ member.firstName }} {{ member.lastName }}</strong>
                <span class="meta">
                  {{ member.role === 'ADMIN' ? 'School admin' : member.title || 'Teacher' }}
                  @if (member.username) {
                    · <code>{{ member.username }}</code>
                  }
                </span>
              </div>
              <span class="chip" [attr.data-status]="member.status">{{
                statusLabel[member.status]
              }}</span>
              <span class="count">
                @if (member.role === 'TEACHER') {
                  {{ member.assignedStudents }}
                  {{ member.assignedStudents === 1 ? 'child' : 'children' }}
                }
              </span>
              <div class="row-actions">
                @if (isSchoolAdmin() && member.role === 'TEACHER') {
                  @if (member.status === 'DEACTIVATED') {
                    <button type="button" class="btn-small" (click)="reactivate(member)">
                      Reactivate
                    </button>
                  } @else {
                    @if (member.username) {
                      <button type="button" class="btn-small" (click)="newCode(member)">
                        New setup code
                      </button>
                    }
                    <button type="button" class="btn-small danger" (click)="deactivate(member)">
                      Deactivate
                    </button>
                  }
                }
              </div>
            </li>
          } @empty {
            <li class="empty">No staff yet.</li>
          }
        </ul>
      </section>
      @if (actionError(); as message) {
        <ac-ui-message tone="error">{{ message }}</ac-ui-message>
      }
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 20px;
        padding-bottom: 48px;
      }

      .page-head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      h1 {
        margin: 0 0 6px;
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 0;
        max-width: 62ch;
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-muted);
      }

      .head-actions,
      .cred-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .card,
      .credentials {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        padding: 20px 22px;
      }

      .credentials {
        border: 2px dashed var(--ac-color-border-info);
        background: var(--ac-color-surface-info);
        display: grid;
        gap: 14px;
      }

      h2 {
        margin: 0;
        font-size: 17px;
        color: var(--ac-color-text-strong);
      }

      .cred-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .cred-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }

      .cred-label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ac-color-text-muted);
        margin-bottom: 4px;
      }

      .cred-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .cred-value.code {
        font-size: 28px;
        letter-spacing: 0.14em;
      }

      .cred-note {
        margin: 0;
        font-size: 14px;
        line-height: 1.55;
        color: var(--ac-color-text-body);
      }

      .form-card form {
        display: grid;
        gap: 14px;
        margin-top: 14px;
      }

      .form-card form > .btn-primary {
        justify-self: start;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 14px;
      }

      .staff-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .staff-row {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr) auto auto auto;
        align-items: center;
        gap: 14px;
        padding: 14px 4px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .staff-row:last-child {
        border-bottom: 0;
      }

      .staff-row.inactive {
        opacity: 0.6;
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--ac-color-primary);
        color: var(--ac-color-ink-f);
        font-weight: 800;
        font-size: 14px;
      }

      .who {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .who strong {
        color: var(--ac-color-text-strong);
      }

      .meta {
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .chip {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
        white-space: nowrap;
      }

      .chip[data-status='SETUP_PENDING'] {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-dark);
      }

      .chip[data-status='DEACTIVATED'] {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-muted);
      }

      .count {
        font-size: 13px;
        color: var(--ac-color-text-body);
        white-space: nowrap;
      }

      .row-actions {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
      }

      .empty {
        padding: 16px 4px;
        color: var(--ac-color-text-muted);
      }

      .btn-primary,
      .btn-ghost,
      .btn-small {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font: inherit;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
      }

      .btn-primary {
        height: 42px;
        padding: 0 18px;
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 14px;
      }

      .btn-primary:disabled {
        opacity: 0.6;
      }

      .btn-ghost {
        height: 42px;
        padding: 0 16px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        font-size: 14px;
      }

      .btn-small {
        height: 34px;
        padding: 0 12px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-size: 13px;
      }

      .btn-small.danger {
        color: var(--ac-color-alert-text);
      }

      .link-btn {
        border: 0;
        background: none;
        color: var(--ac-color-action-deep);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      button:focus-visible,
      a:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      @media (max-width: 720px) {
        .staff-row {
          grid-template-columns: 40px minmax(0, 1fr) auto;
        }

        .count {
          display: none;
        }

        .row-actions {
          grid-column: 2 / -1;
          justify-content: flex-start;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolTeamPage implements OnInit {
  private readonly api = inject(SchoolTeamApi);
  private readonly fb = inject(FormBuilder);

  protected readonly isSchoolAdmin = inject(SchoolStaffState).isSchoolAdmin;
  protected readonly statusLabel = STATUS_LABEL;

  protected readonly staff = signal<SchoolStaffMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly credentials = signal<TeacherCredentialsResponse | null>(null);
  protected readonly copied = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    title: ['', [Validators.maxLength(80)]],
  });

  ngOnInit(): void {
    this.load();
  }

  protected toggleForm(): void {
    this.showForm.update((open) => !open);
    this.formError.set(null);
  }

  protected create(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, lastName, title } = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createTeacher({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(title.trim() ? { title: title.trim() } : {}),
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.form.reset();
          this.showForm.set(false);
          this.showCredentials(result);
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(errorMessage(err, 'Could not create the account. Please try again.'));
        },
      });
  }

  protected newCode(member: SchoolStaffMember): void {
    this.actionError.set(null);
    this.api.issueSetupCode(member.id).subscribe({
      next: (result) => {
        this.showCredentials(result);
        this.load();
      },
      error: (err) => this.actionError.set(errorMessage(err, 'Could not issue a new code.')),
    });
  }

  protected deactivate(member: SchoolStaffMember): void {
    const ok = window.confirm(
      `Deactivate ${member.firstName} ${member.lastName}? They will be signed out and lose access to every child at once.`,
    );
    if (!ok) return;
    this.actionError.set(null);
    this.api.deactivate(member.id).subscribe({
      next: () => this.load(),
      error: (err) => this.actionError.set(errorMessage(err, 'Could not deactivate.')),
    });
  }

  protected reactivate(member: SchoolStaffMember): void {
    this.actionError.set(null);
    this.api.reactivate(member.id).subscribe({
      next: () => this.load(),
      error: (err) => this.actionError.set(errorMessage(err, 'Could not reactivate.')),
    });
  }

  protected print(cred: TeacherCredentialsResponse): void {
    printSlip({
      heading: 'Teacher account',
      lines: [
        { label: 'Teacher', value: `${cred.staff.firstName} ${cred.staff.lastName}` },
        { label: 'Username', value: cred.username },
        { label: 'Setup code', value: cred.setupCode, large: true },
      ],
      steps: [
        'Open AutiCare and choose Sign in.',
        'Choose “Set up your account”.',
        'Enter the username and setup code, then choose your own password.',
      ],
      footer: `The code works once and expires ${this.formatDate(cred.setupCodeExpiresAt)}.`,
    });
  }

  protected copy(cred: TeacherCredentialsResponse): void {
    const text = `AutiCare username: ${cred.username}\nSetup code: ${cred.setupCode}`;
    navigator.clipboard?.writeText(text).then(
      () => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      },
      () => undefined,
    );
  }

  protected initials(member: SchoolStaffMember): string {
    return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  private showCredentials(result: TeacherCredentialsResponse): void {
    this.copied.set(false);
    this.credentials.set(result);
  }

  private load(): void {
    this.api.listStaff().subscribe({
      next: (staff) => {
        this.staff.set(staff);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('The team could not be loaded. Please refresh the page.');
      },
    });
  }
}
