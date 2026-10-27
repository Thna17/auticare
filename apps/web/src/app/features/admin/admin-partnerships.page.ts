import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Partnership, PartnershipStatus } from '@auticare/contracts';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage, formatDate } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

type OrgType = Partnership['organizationType'];

const STATUS_LABEL: Record<PartnershipStatus, string> = {
  PROSPECT: 'Prospect',
  CONTACTED: 'Contacted',
  IN_DISCUSSION: 'In discussion',
  ACTIVE: 'Active',
  ENDED: 'Ended',
};

const TYPE_LABEL: Record<OrgType, string> = {
  SCHOOL: 'School',
  HOSPITAL: 'Hospital / clinic',
  NGO: 'NGO',
  OTHER: 'Other',
};

/**
 * The admin team's partner pipeline: who we're talking to, where it stands and
 * when to follow up. Internal notes only; partners never see this page.
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
  selector: 'ac-admin-partnerships-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Partnerships</h1>
        <p class="subtitle">
          Schools and organizations AutiCare works with or is talking to. Follow-ups due soonest are
          listed first.
        </p>
      </div>
      <button type="button" class="btn-primary" (click)="openNew()">
        {{ showForm() && editingId() === null ? 'Close' : 'Add organization' }}
      </button>
    </header>

    @if (showForm()) {
      <section class="card" aria-labelledby="form-title">
        <h2 id="form-title">{{ editingId() ? 'Edit partnership' : 'Add organization' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()" acAccessibleForm novalidate>
          <div class="form-grid">
            <ac-ui-field
              label="Organization name"
              [required]="true"
              [error]="
                form.controls.organizationName.touched && form.controls.organizationName.invalid
                  ? 'Enter the organization name.'
                  : null
              "
            >
              <input type="text" formControlName="organizationName" maxlength="160" />
            </ac-ui-field>
            <ac-ui-field label="Type" [required]="true">
              <select formControlName="organizationType">
                @for (option of types; track option) {
                  <option [value]="option">{{ typeLabel[option] }}</option>
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
            <ac-ui-field label="Next follow-up" [optional]="true">
              <input type="date" formControlName="nextFollowUpAt" />
            </ac-ui-field>
            <ac-ui-field label="Contact name" [optional]="true">
              <input type="text" formControlName="contactName" maxlength="120" />
            </ac-ui-field>
            <ac-ui-field
              label="Contact email"
              [optional]="true"
              [error]="
                form.controls.contactEmail.touched && form.controls.contactEmail.invalid
                  ? 'Enter a valid email address.'
                  : null
              "
            >
              <input type="email" formControlName="contactEmail" />
            </ac-ui-field>
            <ac-ui-field label="Contact phone" [optional]="true">
              <input type="tel" formControlName="contactPhone" maxlength="40" />
            </ac-ui-field>
          </div>
          <ac-ui-field
            label="Notes"
            [optional]="true"
            hint="Meetings, agreements, promotional benefits."
          >
            <textarea formControlName="notes" rows="4" maxlength="4000"></textarea>
          </ac-ui-field>
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

    <div class="actions" role="group" aria-label="Filter by status">
      <button
        type="button"
        class="btn-small"
        [attr.aria-pressed]="filter() === undefined"
        (click)="setFilter(undefined)"
      >
        All
      </button>
      @for (option of statuses; track option) {
        <button
          type="button"
          class="btn-small"
          [attr.aria-pressed]="filter() === option"
          (click)="setFilter(option)"
        >
          {{ statusLabel[option] }}
        </button>
      }
    </div>

    @if (loading()) {
      <ac-ui-spinner label="Loading partnerships…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else {
      <section class="card" aria-label="Partnerships">
        <ul class="rows">
          @for (item of items(); track item.id) {
            <li class="row">
              <div class="who">
                <strong>{{ item.organizationName }}</strong>
                <span class="meta">
                  {{ typeLabel[item.organizationType] }}
                  @if (item.contactName) {
                    · {{ item.contactName }}
                  }
                  @if (item.contactEmail) {
                    · {{ item.contactEmail }}
                  }
                  @if (item.contactPhone) {
                    · {{ item.contactPhone }}
                  }
                </span>
                @if (item.notes) {
                  <span class="meta">{{ item.notes }}</span>
                }
              </div>
              <span
                class="chip"
                [class.warn]="item.status !== 'ACTIVE' && item.status !== 'ENDED'"
                [class.off]="item.status === 'ENDED'"
                >{{ statusLabel[item.status] }}</span
              >
              @if (item.nextFollowUpAt) {
                <span class="meta" [class.overdue]="isOverdue(item)">
                  Follow up {{ formatDate(item.nextFollowUpAt) }}
                </span>
              }
              <button type="button" class="btn-small" (click)="edit(item)">Edit</button>
            </li>
          } @empty {
            <li class="empty">No organizations yet.</li>
          }
        </ul>
      </section>
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

      .overdue {
        color: var(--ac-color-alert-text);
        font-weight: 700;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPartnershipsPage implements OnInit {
  private readonly api = inject(AdminPortalApi);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<Partnership[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly filter = signal<PartnershipStatus | undefined>(undefined);

  protected readonly statuses = Object.keys(STATUS_LABEL) as PartnershipStatus[];
  protected readonly types = Object.keys(TYPE_LABEL) as OrgType[];
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly formatDate = formatDate;

  protected readonly form = this.fb.nonNullable.group({
    organizationName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(160)],
    ],
    organizationType: ['SCHOOL' as OrgType],
    status: ['PROSPECT' as PartnershipStatus],
    nextFollowUpAt: [''],
    contactName: [''],
    contactEmail: ['', [Validators.email]],
    contactPhone: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  protected isOverdue(item: Partnership): boolean {
    return (
      !!item.nextFollowUpAt &&
      item.status !== 'ENDED' &&
      item.nextFollowUpAt < new Date().toISOString().slice(0, 10)
    );
  }

  protected setFilter(status: PartnershipStatus | undefined): void {
    this.filter.set(status);
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

  protected edit(item: Partnership): void {
    this.editingId.set(item.id);
    this.form.setValue({
      organizationName: item.organizationName,
      organizationType: item.organizationType,
      status: item.status,
      nextFollowUpAt: item.nextFollowUpAt ?? '',
      contactName: item.contactName ?? '',
      contactEmail: item.contactEmail ?? '',
      contactPhone: item.contactPhone ?? '',
      notes: item.notes ?? '',
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
    this.saving.set(true);
    this.api.savePartnership(this.form.getRawValue(), this.editingId() ?? undefined).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err: unknown) => {
        this.formError.set(errorMessage(err, 'The partnership could not be saved.'));
        this.saving.set(false);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.partnerships(this.filter()).subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Partnerships could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
