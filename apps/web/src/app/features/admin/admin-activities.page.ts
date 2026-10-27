import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { ActivityStatus, AdminActivity } from '@auticare/contracts';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

const STATUS_LABEL: Record<ActivityStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const ages = (min: number, max: number) => {
  const label = (months: number) =>
    months < 24 ? `${months} mo` : `${Math.floor(months / 12)} yr`;
  return `${label(min)} – ${label(max)}`;
};

/**
 * The activity library families see under Resources & Activities. Only
 * PUBLISHED activities reach families; drafts are for preparing and review.
 * Images, videos and guides are linked by URL.
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
  selector: 'ac-admin-activities-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Resources &amp; Activities</h1>
        <p class="subtitle">
          The activities families see. Drafts and archived activities are never shown to them.
          Activities are educational ideas, not therapy or treatment.
        </p>
      </div>
      <button type="button" class="btn-primary" (click)="openNew()">
        {{ showForm() && editingId() === null ? 'Close' : 'New activity' }}
      </button>
    </header>

    @if (showForm()) {
      <section class="card" aria-labelledby="form-title">
        <h2 id="form-title">{{ editingId() ? 'Edit activity' : 'New activity' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()" acAccessibleForm novalidate>
          <div class="form-grid">
            <ac-ui-field
              label="Title"
              [required]="true"
              [error]="invalid('title') ? 'Use 3 to 160 characters.' : null"
            >
              <input type="text" formControlName="title" maxlength="160" />
            </ac-ui-field>
            <ac-ui-field
              label="Category"
              [required]="true"
              hint="For example: Sensory, Communication, Social"
              [error]="invalid('category') ? 'Enter a category.' : null"
            >
              <input type="text" formControlName="category" list="activity-categories" />
              <datalist id="activity-categories">
                @for (category of categories(); track category) {
                  <option [value]="category"></option>
                }
              </datalist>
            </ac-ui-field>
            <ac-ui-field label="Youngest age (months)" [required]="true">
              <input type="number" formControlName="minAgeMonths" min="0" max="216" />
            </ac-ui-field>
            <ac-ui-field label="Oldest age (months)" [required]="true">
              <input type="number" formControlName="maxAgeMonths" min="0" max="216" />
            </ac-ui-field>
            <ac-ui-field label="Status" [required]="true">
              <select formControlName="status">
                @for (option of statuses; track option) {
                  <option [value]="option">{{ statusLabel[option] }}</option>
                }
              </select>
            </ac-ui-field>
          </div>
          <ac-ui-field
            label="Summary"
            [required]="true"
            [error]="invalid('summary') ? 'Use 10 to 2000 characters.' : null"
          >
            <textarea formControlName="summary" rows="3" maxlength="2000"></textarea>
          </ac-ui-field>
          <ac-ui-field
            label="Step-by-step instructions"
            [optional]="true"
            hint="One step per line."
          >
            <textarea formControlName="steps" rows="5" maxlength="6000"></textarea>
          </ac-ui-field>
          <div class="form-grid">
            <ac-ui-field label="Image link" [optional]="true">
              <input type="url" formControlName="imageUrl" placeholder="https://" />
            </ac-ui-field>
            <ac-ui-field label="Video link" [optional]="true">
              <input type="url" formControlName="videoUrl" placeholder="https://" />
            </ac-ui-field>
            <ac-ui-field label="Guide or PDF link" [optional]="true">
              <input type="url" formControlName="resourceUrl" placeholder="https://" />
            </ac-ui-field>
          </div>
          <label class="check">
            <input type="checkbox" formControlName="professionallyReviewed" />
            Reviewed by a qualified professional
          </label>
          @if (form.controls.professionallyReviewed.value) {
            <ac-ui-field label="Reviewed by" [optional]="true" hint="Name and role">
              <input type="text" formControlName="reviewedBy" maxlength="120" />
            </ac-ui-field>
          }
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

    <div class="toolbar">
      <input
        type="search"
        placeholder="Search by title or category"
        aria-label="Search activities"
        (input)="query.set($any($event.target).value)"
      />
      <div class="actions" role="group" aria-label="Filter by status">
        <button
          type="button"
          class="btn-small"
          [attr.aria-pressed]="filter() === null"
          (click)="filter.set(null)"
        >
          All
        </button>
        @for (option of statuses; track option) {
          <button
            type="button"
            class="btn-small"
            [attr.aria-pressed]="filter() === option"
            (click)="filter.set(option)"
          >
            {{ statusLabel[option] }}
          </button>
        }
      </div>
    </div>

    @if (loading()) {
      <ac-ui-spinner label="Loading activities…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else {
      <section class="card" aria-label="Activities">
        <ul class="rows">
          @for (item of shown(); track item.id) {
            <li class="row">
              <div class="who">
                <strong>{{ item.title }}</strong>
                <span class="meta">
                  {{ item.category }} · {{ ages(item.minAgeMonths, item.maxAgeMonths) }} ·
                  {{ item.completions }} completed
                </span>
                @if (item.professionallyReviewed) {
                  <span class="meta">
                    Reviewed{{ item.reviewedBy ? ' by ' + item.reviewedBy : '' }}
                  </span>
                }
              </div>
              <span
                class="chip"
                [class.warn]="item.status === 'DRAFT'"
                [class.off]="item.status === 'ARCHIVED'"
                >{{ statusLabel[item.status] }}</span
              >
              <button type="button" class="btn-small" (click)="edit(item)">Edit</button>
            </li>
          } @empty {
            <li class="empty">No activities match.</li>
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

      .check {
        display: flex;
        gap: 8px;
        align-items: center;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActivitiesPage implements OnInit {
  private readonly api = inject(AdminPortalApi);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<AdminActivity[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly filter = signal<ActivityStatus | null>(null);
  protected readonly query = signal('');

  protected readonly statuses = Object.keys(STATUS_LABEL) as ActivityStatus[];
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly ages = ages;

  protected readonly categories = computed(() =>
    [...new Set(this.items().map((item) => item.category))].sort(),
  );
  protected readonly shown = computed(() => {
    const term = this.query().trim().toLowerCase();
    return this.items().filter(
      (item) =>
        (this.filter() === null || item.status === this.filter()) &&
        (!term ||
          item.title.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term)),
    );
  });

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    category: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    minAgeMonths: [12, [Validators.required, Validators.min(0), Validators.max(216)]],
    maxAgeMonths: [72, [Validators.required, Validators.min(0), Validators.max(216)]],
    status: ['DRAFT' as ActivityStatus],
    summary: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    steps: [''],
    imageUrl: [''],
    videoUrl: [''],
    resourceUrl: [''],
    professionallyReviewed: [false],
    reviewedBy: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  protected invalid(name: 'title' | 'category' | 'summary'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
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

  protected edit(item: AdminActivity): void {
    this.editingId.set(item.id);
    this.form.setValue({
      title: item.title,
      category: item.category,
      minAgeMonths: item.minAgeMonths,
      maxAgeMonths: item.maxAgeMonths,
      status: item.status,
      summary: item.summary,
      steps: item.steps ?? '',
      imageUrl: item.imageUrl ?? '',
      videoUrl: item.videoUrl ?? '',
      resourceUrl: item.resourceUrl ?? '',
      professionallyReviewed: item.professionallyReviewed,
      reviewedBy: item.reviewedBy ?? '',
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
    if (Number(value.maxAgeMonths) < Number(value.minAgeMonths)) {
      this.formError.set('The oldest age must not be below the youngest.');
      return;
    }
    this.saving.set(true);
    this.api.saveActivity(value, this.editingId() ?? undefined).subscribe({
      next: (saved) => {
        this.items.update((rows) =>
          this.editingId()
            ? rows.map((row) => (row.id === saved.id ? saved : row))
            : [saved, ...rows],
        );
        this.saving.set(false);
        this.closeForm();
      },
      error: (err: unknown) => {
        this.formError.set(errorMessage(err, 'The activity could not be saved.'));
        this.saving.set(false);
      },
    });
  }

  private load(): void {
    this.api.activities().subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Activities could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
