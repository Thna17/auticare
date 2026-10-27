import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Announcement, AnnouncementAudience, AnnouncementStatus } from '@auticare/contracts';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage, formatDateTime } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  ALL: 'Everyone',
  PARENTS: 'Parents',
  SCHOOLS: 'School admins',
  TEACHERS: 'Teachers',
};

const STATUS_LABEL: Record<AnnouncementStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

/** `datetime-local` value ("2026-10-28T09:00") ↔ ISO string, in the admin's own time zone. */
const toLocalInput = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const fromLocalInput = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;

/**
 * Platform announcements: a short banner for parents, school admins, teachers
 * or everyone. A start time schedules it; an end time takes it down.
 */
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiFieldComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    AccessibleFormDirective,
  ],
  selector: 'ac-admin-announcements-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Announcements</h1>
        <p class="subtitle">
          Short messages from the AutiCare team, shown as a banner at the top of the app for the
          audience you choose.
        </p>
      </div>
      <button type="button" class="btn-primary" (click)="openNew()">
        {{ editingId() === null && showForm() ? 'Close' : 'New announcement' }}
      </button>
    </header>

    @if (showForm()) {
      <section class="card" aria-labelledby="form-title">
        <h2 id="form-title">{{ editingId() ? 'Edit announcement' : 'New announcement' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()" acAccessibleForm novalidate>
          <ac-ui-field
            label="Title"
            [required]="true"
            [error]="
              form.controls.title.touched && form.controls.title.invalid
                ? 'Use 3 to 120 characters.'
                : null
            "
          >
            <input type="text" formControlName="title" maxlength="120" />
          </ac-ui-field>
          <ac-ui-field
            label="Message"
            [required]="true"
            [error]="
              form.controls.body.touched && form.controls.body.invalid
                ? 'Use 3 to 2000 characters.'
                : null
            "
          >
            <textarea formControlName="body" rows="4" maxlength="2000"></textarea>
          </ac-ui-field>
          <div class="form-grid">
            <ac-ui-field label="Audience" [required]="true">
              <select formControlName="audience">
                @for (option of audiences; track option) {
                  <option [value]="option">{{ audienceLabel[option] }}</option>
                }
              </select>
            </ac-ui-field>
            <ac-ui-field label="Status" [required]="true">
              <select formControlName="status">
                @for (option of statuses; track option) {
                  <option [value]="option">{{ statusLabel[option] }}</option>
                }
              </select>
            </ac-ui-field>
            <ac-ui-field label="Show from" [optional]="true" hint="Empty: straight away.">
              <input type="datetime-local" formControlName="publishAt" />
            </ac-ui-field>
            <ac-ui-field label="Show until" [optional]="true" hint="Empty: until archived.">
              <input type="datetime-local" formControlName="expiresAt" />
            </ac-ui-field>
          </div>
          @if (formError(); as message) {
            <ac-ui-message tone="error">{{ message }}</ac-ui-message>
          }
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Saving…' : 'Save' }}
            </button>
            <button type="button" class="btn-ghost" (click)="closeForm()">Cancel</button>
          </div>
        </form>
      </section>
    }

    @if (loading()) {
      <ac-ui-spinner label="Loading announcements…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else {
      <section class="card" aria-label="Announcements">
        <ul class="rows">
          @for (item of items(); track item.id) {
            <li class="row">
              <div class="who">
                <strong>{{ item.title }}</strong>
                <span class="meta">{{ item.body }}</span>
                <span class="meta">
                  {{ audienceLabel[item.audience] }}
                  @if (item.publishAt) {
                    · from {{ formatDateTime(item.publishAt) }}
                  }
                  @if (item.expiresAt) {
                    · until {{ formatDateTime(item.expiresAt) }}
                  }
                </span>
              </div>
              @if (item.live) {
                <span class="chip">Showing now</span>
              } @else {
                <span
                  class="chip"
                  [attr.data-status]="item.status === 'ARCHIVED' ? 'ENDED' : 'INVITED'"
                  >{{
                    item.status === 'PUBLISHED' ? 'Scheduled or ended' : statusLabel[item.status]
                  }}</span
                >
              }
              <div class="actions">
                <button type="button" class="btn-small" (click)="edit(item)">Edit</button>
                @if (item.status !== 'ARCHIVED') {
                  <button type="button" class="btn-small danger" (click)="archive(item)">
                    Archive
                  </button>
                }
              </div>
            </li>
          } @empty {
            <li class="empty">No announcements yet.</li>
          }
        </ul>
      </section>
      @if (actionError(); as message) {
        <ac-ui-message tone="error">{{ message }}</ac-ui-message>
      }
    }
  `,
  styles: [
    PORTAL_PAGE_STYLES,
    `
      form {
        display: grid;
        gap: 14px;
      }

      textarea {
        width: 100%;
        font: inherit;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAnnouncementsPage implements OnInit {
  private readonly api = inject(AdminPortalApi);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<Announcement[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);

  protected readonly audiences = Object.keys(AUDIENCE_LABEL) as AnnouncementAudience[];
  protected readonly statuses = Object.keys(STATUS_LABEL) as AnnouncementStatus[];
  protected readonly audienceLabel = AUDIENCE_LABEL;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly formatDateTime = formatDateTime;

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    body: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(2000)]],
    audience: ['ALL' as AnnouncementAudience],
    status: ['DRAFT' as AnnouncementStatus],
    publishAt: [''],
    expiresAt: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  protected openNew(): void {
    if (this.showForm() && this.editingId() === null) {
      this.closeForm();
      return;
    }
    this.editingId.set(null);
    this.form.reset();
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected edit(item: Announcement): void {
    this.editingId.set(item.id);
    this.form.setValue({
      title: item.title,
      body: item.body,
      audience: item.audience,
      status: item.status,
      publishAt: toLocalInput(item.publishAt),
      expiresAt: toLocalInput(item.expiresAt),
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  protected save(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .saveAnnouncement(
        {
          title: value.title.trim(),
          body: value.body.trim(),
          audience: value.audience,
          status: value.status,
          publishAt: fromLocalInput(value.publishAt),
          expiresAt: fromLocalInput(value.expiresAt),
        },
        this.editingId() ?? undefined,
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.load();
        },
        error: (err: unknown) => {
          this.formError.set(errorMessage(err, 'The announcement could not be saved.'));
          this.saving.set(false);
        },
      });
  }

  protected archive(item: Announcement): void {
    if (!confirm(`Archive "${item.title}"? It stops showing straight away.`)) return;
    this.actionError.set(null);
    this.api
      .saveAnnouncement(
        {
          title: item.title,
          body: item.body,
          audience: item.audience,
          status: 'ARCHIVED',
          publishAt: item.publishAt,
          expiresAt: item.expiresAt,
        },
        item.id,
      )
      .subscribe({
        next: () => this.load(),
        error: (err: unknown) =>
          this.actionError.set(errorMessage(err, 'The announcement could not be archived.')),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.api.announcements().subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Announcements could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
