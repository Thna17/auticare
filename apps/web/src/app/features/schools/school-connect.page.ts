import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type {
  ConnectionCode,
  CreatedConnectionCodeResponse,
  SchoolStaffMember,
} from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { SchoolStaffState } from './data-access/school-staff.state';
import { SchoolTeamApi } from './data-access/school-team.api';
import { printSlip } from './print-slip';

const STATUS_LABEL: Record<ConnectionCode['status'], string> = {
  ACTIVE: 'Waiting',
  USED: 'Connected',
  EXPIRED: 'Expired',
  REVOKED: 'Cancelled',
};

const PARENT_STEPS = [
  'Open AutiCare and sign in (or create a free family account).',
  'Go to “My schools” and enter this code.',
  'Choose your child and agree to connect.',
];

const errorMessage = (err: unknown, fallback: string): string =>
  (err as { error?: { error?: { message?: string } } })?.error?.error?.message ?? fallback;

/**
 * Family connection codes. At the enrollment meeting the school admin creates
 * a code and gives it to the family; the parent enters it in AutiCare, chooses
 * their child and consents. Only then does the child appear in the roster,
 * with the teachers chosen here already assigned.
 */
@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent, UiSpinnerComponent],
  selector: 'ac-school-connect-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Family codes</h1>
        <p class="subtitle">
          Give a family a one-time code when they enrol. The parent enters it in AutiCare, chooses
          their child and agrees — then the child joins your roster and their teachers can share
          reports with the family.
        </p>
      </div>
      <a class="btn-ghost" routerLink="/schools/staff">Team</a>
    </header>

    @if (!isSchoolAdmin() && !loading()) {
      <ac-ui-message tone="info">Only your school admin can create family codes.</ac-ui-message>
    }

    @if (isSchoolAdmin()) {
      <section class="card create" aria-labelledby="new-title">
        <h2 id="new-title">New code</h2>
        <label class="field">
          <span class="label">Family or child (optional, for your records)</span>
          <input
            type="text"
            maxlength="80"
            placeholder="e.g. Dara's family"
            [value]="label()"
            (input)="label.set($any($event.target).value)"
          />
        </label>

        @if (teachers().length > 0) {
          <fieldset class="field">
            <legend class="label">Assign teachers now (optional)</legend>
            <div class="checks">
              @for (member of teachers(); track member.id) {
                <label class="check">
                  <input
                    type="checkbox"
                    [checked]="selected().includes(member.id)"
                    (change)="toggle(member.id, $any($event.target).checked)"
                  />
                  <span>{{ member.firstName }} {{ member.lastName }}</span>
                </label>
              }
            </div>
          </fieldset>
        }

        @if (createError(); as message) {
          <ac-ui-message tone="error">{{ message }}</ac-ui-message>
        }
        <button type="button" class="btn-primary" [disabled]="creating()" (click)="create()">
          {{ creating() ? 'Creating…' : 'Create code' }}
        </button>
      </section>
    }

    @if (fresh(); as code) {
      <section class="slip" aria-labelledby="fresh-title">
        <div class="slip-head">
          <h2 id="fresh-title">Give this code to {{ code.label || 'the family' }}</h2>
          <button type="button" class="link-btn" (click)="fresh.set(null)">Done</button>
        </div>
        <code class="big-code">{{ code.code }}</code>
        <p class="slip-meta">
          Works once · expires {{ formatDate(code.expiresAt) }}
          @if (code.teachers.length) {
            · teachers: {{ teacherNames(code) }}
          }
        </p>
        <ol class="steps">
          @for (step of parentSteps; track step) {
            <li>{{ step }}</li>
          }
        </ol>
        <p class="slip-note">Shown only now. Print it or write it down for the family.</p>
        <div class="actions">
          <button type="button" class="btn-primary" (click)="print(code)">
            Print for the family
          </button>
          <button type="button" class="btn-ghost" (click)="copy(code)">
            {{ copied() ? 'Copied' : 'Copy code' }}
          </button>
        </div>
      </section>
    }

    @if (loading()) {
      <ac-ui-spinner label="Loading codes…" />
    } @else if (isSchoolAdmin()) {
      <section class="card" aria-labelledby="list-title">
        <h2 id="list-title">Recent codes</h2>
        <ul class="code-list">
          @for (code of codes(); track code.id) {
            <li class="code-row">
              <div class="who">
                <strong>{{ code.label || 'Unlabelled code' }}</strong>
                <span class="meta">
                  Created {{ formatDate(code.createdAt) }}
                  @if (code.status === 'USED' && code.childFirstName) {
                    · {{ code.childFirstName }} connected {{ formatDate(code.usedAt!) }}
                  } @else if (code.status === 'ACTIVE') {
                    · expires {{ formatDate(code.expiresAt) }}
                  }
                  @if (code.teachers.length) {
                    · {{ teacherNames(code) }}
                  }
                </span>
              </div>
              <span class="chip" [attr.data-status]="code.status">{{
                statusLabel[code.status]
              }}</span>
              @if (code.status === 'ACTIVE') {
                <button type="button" class="btn-small" (click)="revoke(code)">Cancel</button>
              } @else {
                <span></span>
              }
            </li>
          } @empty {
            <li class="empty">No codes in the last 30 days.</li>
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
        max-width: 64ch;
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-muted);
      }

      h2 {
        margin: 0;
        font-size: 17px;
        color: var(--ac-color-text-strong);
      }

      .card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        padding: 20px 22px;
        display: grid;
        gap: 14px;
      }

      .create .btn-primary {
        justify-self: start;
      }

      .field {
        display: grid;
        gap: 6px;
        margin: 0;
        padding: 0;
        border: 0;
      }

      .label {
        font-size: 14px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .field input[type='text'] {
        height: 44px;
        padding: 0 12px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 10px;
        font: inherit;
        max-width: 420px;
      }

      .checks {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .check {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        font-size: 14px;
        cursor: pointer;
      }

      .slip {
        border: 2px dashed var(--ac-color-border-info);
        border-radius: 16px;
        background: var(--ac-color-surface-info);
        padding: 22px;
        display: grid;
        gap: 12px;
      }

      .slip-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .big-code {
        font-size: clamp(32px, 6vw, 44px);
        font-weight: 800;
        letter-spacing: 0.16em;
        color: var(--ac-color-text-strong);
      }

      .slip-meta,
      .slip-note {
        margin: 0;
        font-size: 14px;
        color: var(--ac-color-text-body);
      }

      .slip-note {
        color: var(--ac-color-text-muted);
      }

      .steps {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 4px;
        font-size: 14px;
        color: var(--ac-color-text-body);
      }

      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .code-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .code-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 12px;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .code-row:last-child {
        border-bottom: 0;
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
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-dark);
      }

      .chip[data-status='USED'] {
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
      }

      .chip[data-status='EXPIRED'],
      .chip[data-status='REVOKED'] {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-muted);
      }

      .empty {
        padding: 12px 0;
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
        color: var(--ac-color-alert-text);
        font-size: 13px;
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
      a:focus-visible,
      input:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolConnectPage implements OnInit {
  private readonly api = inject(SchoolTeamApi);

  protected readonly isSchoolAdmin = inject(SchoolStaffState).isSchoolAdmin;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly parentSteps = PARENT_STEPS;

  protected readonly codes = signal<ConnectionCode[]>([]);
  protected readonly teachers = signal<SchoolStaffMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly label = signal('');
  protected readonly selected = signal<string[]>([]);
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly fresh = signal<CreatedConnectionCodeResponse | null>(null);
  protected readonly copied = signal(false);

  ngOnInit(): void {
    this.api.listStaff().subscribe({
      next: (staff) =>
        this.teachers.set(
          staff.filter((member) => member.role === 'TEACHER' && member.status !== 'DEACTIVATED'),
        ),
      error: () => this.teachers.set([]),
    });
    this.loadCodes();
  }

  protected toggle(staffId: string, checked: boolean): void {
    this.selected.update((ids) =>
      checked ? [...new Set([...ids, staffId])] : ids.filter((id) => id !== staffId),
    );
  }

  protected create(): void {
    this.createError.set(null);
    this.creating.set(true);
    const label = this.label().trim();
    this.api
      .createConnectionCode({
        ...(label ? { label } : {}),
        teacherStaffIds: this.selected(),
      })
      .subscribe({
        next: (code) => {
          this.creating.set(false);
          this.copied.set(false);
          this.fresh.set(code);
          this.label.set('');
          this.selected.set([]);
          this.loadCodes();
        },
        error: (err) => {
          this.creating.set(false);
          this.createError.set(errorMessage(err, 'Could not create a code. Please try again.'));
        },
      });
  }

  protected revoke(code: ConnectionCode): void {
    if (!window.confirm('Cancel this code? The family will not be able to use it.')) return;
    this.actionError.set(null);
    this.api.revokeConnectionCode(code.id).subscribe({
      next: () => this.loadCodes(),
      error: (err) => this.actionError.set(errorMessage(err, 'Could not cancel the code.')),
    });
  }

  protected print(code: CreatedConnectionCodeResponse): void {
    printSlip({
      heading: 'Connect with your child’s school',
      lines: [
        ...(code.label ? [{ label: 'For', value: code.label }] : []),
        { label: 'Connection code', value: code.code, large: true },
      ],
      steps: PARENT_STEPS,
      footer: `This code works once and expires ${this.formatDate(code.expiresAt)}. Your screenings, notes and conversations stay private; the school sees only what its teachers write.`,
    });
  }

  protected copy(code: CreatedConnectionCodeResponse): void {
    navigator.clipboard?.writeText(code.code).then(
      () => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      },
      () => undefined,
    );
  }

  protected teacherNames(code: ConnectionCode): string {
    return code.teachers.map((t) => `${t.firstName} ${t.lastName}`.trim()).join(', ');
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  }

  private loadCodes(): void {
    this.api.listConnectionCodes().subscribe({
      next: (codes) => {
        this.codes.set(codes);
        this.loading.set(false);
      },
      error: () => {
        // A teacher is refused; the page then shows the info message only.
        this.codes.set([]);
        this.loading.set(false);
      },
    });
  }
}
