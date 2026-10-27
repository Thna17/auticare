import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import type {
  AdminSubscription,
  BillingInterval,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@auticare/contracts';
import { PLAN_PRICES_CENTS } from '@auticare/contracts/plans';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { SubscriptionsApi } from './data-access/subscriptions.api';
import { STATUS_LABEL, errorMessage, formatDate, formatPrice } from './subscription-format';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';

/** The status changes the server accepts from each status. EXPIRED is final. */
const NEXT_STATUSES: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  ACTIVE: ['PAST_DUE', 'CANCELED', 'EXPIRED'],
  PAST_DUE: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  CANCELED: ['ACTIVE', 'EXPIRED'],
  EXPIRED: [],
};

type SchoolOption = { id: string; name: string; city: string };

/**
 * The platform admin's plan register. Until a payment provider is chosen, the
 * admin records Pro (for a parent) and Business (for a school) here by hand,
 * after payment has been arranged outside AutiCare.
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
  selector: 'ac-admin-subscriptions-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Subscription Plans</h1>
        <p class="subtitle">
          Online payment isn't connected yet. Record a plan here once payment has been arranged.
          Ending a plan only stops access — no child profile or record is ever deleted.
        </p>
      </div>
      <button type="button" class="btn-primary" (click)="showForm.set(!showForm())">
        {{ showForm() ? 'Close' : 'Record a plan' }}
      </button>
    </header>

    @if (showForm()) {
      <section class="card" aria-labelledby="new-title">
        <h2 id="new-title">Record a plan</h2>
        <form [formGroup]="form" (ngSubmit)="create()" acAccessibleForm novalidate>
          <div class="form-grid">
            <ac-ui-field label="Plan" [required]="true">
              <select formControlName="plan">
                <option value="PRO">Pro — for a parent</option>
                <option value="BUSINESS">Business — for a school</option>
              </select>
            </ac-ui-field>
            <ac-ui-field label="Billing" [required]="true" [hint]="priceHint()">
              <select formControlName="interval">
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </ac-ui-field>
            @if (form.controls.plan.value === 'PRO') {
              <ac-ui-field label="Parent's account email" [required]="true">
                <input type="email" formControlName="parentEmail" autocomplete="off" />
              </ac-ui-field>
            } @else {
              <ac-ui-field label="School" [required]="true">
                <select formControlName="schoolId">
                  <option value="">Choose a school…</option>
                  @for (school of schools(); track school.id) {
                    <option [value]="school.id">{{ school.name }} · {{ school.city }}</option>
                  }
                </select>
              </ac-ui-field>
            }
            <ac-ui-field label="Paid through" [optional]="true" hint="Leave empty for no end date.">
              <input type="date" formControlName="currentPeriodEnd" />
            </ac-ui-field>
            <ac-ui-field label="Note" [optional]="true" hint="For example a receipt number.">
              <input type="text" formControlName="note" maxlength="500" />
            </ac-ui-field>
          </div>
          @if (formError(); as message) {
            <ac-ui-message tone="error">{{ message }}</ac-ui-message>
          }
          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Saving…' : 'Save plan' }}
            </button>
          </div>
        </form>
      </section>
    }

    <div class="actions" role="group" aria-label="Filter by plan">
      @for (option of filters; track option.label) {
        <button
          type="button"
          class="btn-small"
          [attr.aria-pressed]="filter() === option.value"
          (click)="setFilter(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>

    @if (loading()) {
      <ac-ui-spinner label="Loading plans…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else {
      <section class="card" aria-label="Plans">
        <ul class="rows">
          @for (sub of subscriptions(); track sub.id) {
            <li class="row">
              <div class="who">
                <strong>{{ sub.owner.name }}</strong>
                <span class="meta">
                  {{ sub.plan === 'PRO' ? 'Pro' : 'Business' }} ·
                  {{ price(sub.priceCents, sub.interval) }}
                  @if (sub.owner.email) {
                    · {{ sub.owner.email }}
                  }
                </span>
                <span class="meta">
                  Started {{ formatDate(sub.startedAt) }} · paid through
                  {{ formatDate(sub.currentPeriodEnd) }}
                  @if (sub.note) {
                    · {{ sub.note }}
                  }
                </span>
              </div>
              <span class="chip" [attr.data-status]="sub.status">{{
                statusLabel[sub.status]
              }}</span>
              @if (!sub.grantsAccess && sub.status !== 'EXPIRED') {
                <span class="chip off">No access</span>
              }
              <div class="actions">
                @for (next of nextStatuses[sub.status]; track next) {
                  <button type="button" class="btn-small" (click)="changeStatus(sub, next)">
                    {{ actionLabel[next] }}
                  </button>
                }
              </div>
            </li>
          } @empty {
            <li class="empty">No plans recorded yet.</li>
          }
        </ul>
      </section>
      @if (actionError(); as message) {
        <ac-ui-message tone="error">{{ message }}</ac-ui-message>
      }
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSubscriptionsPage implements OnInit {
  private readonly api = inject(SubscriptionsApi);
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly fb = inject(FormBuilder);

  protected readonly subscriptions = signal<AdminSubscription[]>([]);
  protected readonly schools = signal<SchoolOption[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly filter = signal<SubscriptionPlan | undefined>(undefined);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly nextStatuses = NEXT_STATUSES;
  protected readonly price = formatPrice;
  protected readonly formatDate = formatDate;
  protected readonly filters: { label: string; value: SubscriptionPlan | undefined }[] = [
    { label: 'All', value: undefined },
    { label: 'Pro', value: 'PRO' },
    { label: 'Business', value: 'BUSINESS' },
  ];
  protected readonly actionLabel: Record<SubscriptionStatus, string> = {
    ACTIVE: 'Reactivate',
    PAST_DUE: 'Mark overdue',
    CANCELED: 'Cancel',
    EXPIRED: 'End now',
  };

  protected readonly form = this.fb.nonNullable.group({
    plan: ['PRO' as SubscriptionPlan],
    interval: ['MONTHLY' as BillingInterval],
    parentEmail: [''],
    schoolId: [''],
    currentPeriodEnd: [''],
    note: [''],
  });

  ngOnInit(): void {
    this.load();
    this.schoolsApi.listAdminSchoolAccounts().subscribe({
      next: (accounts) => {
        const byId = new Map<string, SchoolOption>();
        for (const { school } of accounts) {
          byId.set(school.id, { id: school.id, name: school.name, city: school.city });
        }
        this.schools.set([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
      },
      error: () => this.schools.set([]),
    });
  }

  protected priceHint(): string {
    const { plan, interval } = this.form.getRawValue();
    return formatPrice(PLAN_PRICES_CENTS[plan][interval], interval);
  }

  protected setFilter(plan: SubscriptionPlan | undefined): void {
    this.filter.set(plan);
    this.load();
  }

  protected create(): void {
    this.formError.set(null);
    const value = this.form.getRawValue();
    const parentEmail = value.parentEmail.trim().toLowerCase();
    if (value.plan === 'PRO' && !parentEmail) {
      this.formError.set("Enter the parent's account email.");
      return;
    }
    if (value.plan === 'BUSINESS' && !value.schoolId) {
      this.formError.set('Choose a school.');
      return;
    }
    this.saving.set(true);
    this.api
      .adminCreate({
        plan: value.plan,
        interval: value.interval,
        ...(value.plan === 'PRO' ? { parentEmail } : { schoolId: value.schoolId }),
        ...(value.currentPeriodEnd ? { currentPeriodEnd: value.currentPeriodEnd } : {}),
        ...(value.note.trim() ? { note: value.note.trim() } : {}),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.form.reset();
          this.load();
        },
        error: (err: unknown) => {
          this.formError.set(errorMessage(err, 'The plan could not be saved.'));
          this.saving.set(false);
        },
      });
  }

  protected changeStatus(sub: AdminSubscription, status: SubscriptionStatus): void {
    this.actionError.set(null);
    let currentPeriodEnd: string | undefined;
    if (status === 'CANCELED') {
      // A canceled plan keeps access until its paid-through date, so it needs one.
      const suggested = sub.currentPeriodEnd?.slice(0, 10) ?? '';
      const answer = prompt('Access continues until (YYYY-MM-DD):', suggested);
      if (answer === null) return;
      currentPeriodEnd = answer.trim();
    } else if (
      !confirm(
        `${this.actionLabel[status]} the ${sub.plan === 'PRO' ? 'Pro' : 'Business'} plan for ${sub.owner.name}?`,
      )
    ) {
      return;
    }
    this.api
      .adminUpdate(sub.id, { status, ...(currentPeriodEnd ? { currentPeriodEnd } : {}) })
      .subscribe({
        next: (updated) =>
          this.subscriptions.update((rows) =>
            rows.map((row) => (row.id === updated.id ? updated : row)),
          ),
        error: (err: unknown) =>
          this.actionError.set(errorMessage(err, 'The plan could not be changed.')),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.adminList(this.filter()).subscribe({
      next: (rows) => {
        this.subscriptions.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Plans could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
