import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { SchoolSponsorship, SchoolSubscriptionResponse } from '@auticare/contracts';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { SubscriptionsApi } from './data-access/subscriptions.api';
import { errorMessage, formatDate } from './subscription-format';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';

const SPONSORSHIP_LABEL: Record<SchoolSponsorship['status'], string> = {
  INVITED: 'Waiting for the parent',
  ACTIVE: 'In use',
  ENDED: 'Ended',
};

const ENDED_REASON: Record<string, string> = {
  DECLINED: 'declined by the parent',
  LEFT: 'the parent left',
  WITHDRAWN: 'withdrawn by your school',
};

/**
 * The five sponsored Pro family accounts a Business plan includes. The school
 * sees only who was invited and whether the slot is in use — never children.
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
  selector: 'ac-school-sponsorships-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Sponsored Pro Accounts</h1>
        <p class="subtitle">
          Your Business plan pays for AutiCare Pro for up to five families. These are family
          accounts, not teacher accounts: each parent signs in with their own login, and sponsoring
          them does not show you their children's information.
        </p>
      </div>
    </header>

    @if (loading()) {
      <ac-ui-spinner label="Loading sponsored accounts…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      <section class="card" aria-labelledby="slots-title">
        <div class="plan-line">
          <h2 id="slots-title">{{ d.slotsUsed }} of {{ d.slotsTotal }} in use</h2>
          @if (!d.businessActive) {
            <span class="chip off">Business plan not active</span>
          }
        </div>
        <div
          class="meter"
          role="meter"
          [attr.aria-valuenow]="d.slotsUsed"
          aria-valuemin="0"
          [attr.aria-valuemax]="d.slotsTotal"
          aria-label="Sponsored accounts in use"
        >
          <span [style.width.%]="(d.slotsUsed / d.slotsTotal) * 100"></span>
        </div>

        @if (!d.businessActive) {
          <p class="note">
            Sponsored accounts need an active Business plan. See
            <a routerLink="/schools/subscription">Subscription &amp; Billing</a>. Families you
            sponsored keep all their data while the plan is inactive.
          </p>
        } @else if (d.slotsUsed < d.slotsTotal) {
          <form class="inline" [formGroup]="form" (ngSubmit)="invite()" acAccessibleForm novalidate>
            <ac-ui-field
              label="Parent's email"
              [required]="true"
              hint="The parent accepts on their own AutiCare account with this email."
              [error]="
                form.controls.email.touched && form.controls.email.invalid
                  ? 'Enter a valid email address.'
                  : null
              "
            >
              <input type="email" formControlName="email" autocomplete="off" />
            </ac-ui-field>
            <button type="submit" class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Sending…' : 'Offer Pro' }}
            </button>
          </form>
        } @else {
          <p class="note">All five are in use. Withdraw one to offer it to another family.</p>
        }

        @if (sent()) {
          <ac-ui-message tone="success">
            Offer sent. If the parent already has an AutiCare account they'll see it right away;
            otherwise it waits until they sign up with that email.
          </ac-ui-message>
        }
        @if (actionError(); as message) {
          <ac-ui-message tone="error">{{ message }}</ac-ui-message>
        }
      </section>

      <section class="card" aria-label="Sponsored accounts">
        <ul class="rows">
          @for (item of open(); track item.id) {
            <li class="row">
              <div class="who">
                <strong>{{ item.email }}</strong>
                <span class="meta">
                  Offered {{ formatDate(item.invitedAt) }}
                  @if (item.acceptedAt) {
                    · accepted {{ formatDate(item.acceptedAt) }}
                  }
                </span>
              </div>
              <span class="chip" [attr.data-status]="item.status">{{ label[item.status] }}</span>
              <button type="button" class="btn-small danger" (click)="withdraw(item)">
                {{ item.status === 'INVITED' ? 'Withdraw offer' : 'End sponsorship' }}
              </button>
            </li>
          } @empty {
            <li class="empty">No sponsored accounts yet.</li>
          }
        </ul>
      </section>

      @if (ended().length > 0) {
        <section class="card" aria-label="Past sponsored accounts">
          <h2>Past offers</h2>
          <ul class="rows">
            @for (item of ended(); track item.id) {
              <li class="row">
                <div class="who">
                  <strong>{{ item.email }}</strong>
                  <span class="meta">
                    Ended {{ formatDate(item.endedAt) }}
                    @if (item.endedReason && reason[item.endedReason]) {
                      · {{ reason[item.endedReason] }}
                    }
                  </span>
                </div>
                <span class="chip" data-status="ENDED">Ended</span>
              </li>
            }
          </ul>
        </section>
      }
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolSponsorshipsPage implements OnInit {
  private readonly api = inject(SubscriptionsApi);
  private readonly fb = inject(FormBuilder);

  protected readonly data = signal<SchoolSubscriptionResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly sent = signal(false);

  protected readonly open = computed(() =>
    (this.data()?.sponsorships ?? []).filter((item) => item.status !== 'ENDED'),
  );
  protected readonly ended = computed(() =>
    (this.data()?.sponsorships ?? []).filter((item) => item.status === 'ENDED'),
  );

  protected readonly label = SPONSORSHIP_LABEL;
  protected readonly reason = ENDED_REASON;
  protected readonly formatDate = formatDate;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(191)]],
  });

  ngOnInit(): void {
    this.api.schoolSubscription().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Sponsored accounts could not be loaded.'));
        this.loading.set(false);
      },
    });
  }

  protected invite(): void {
    this.actionError.set(null);
    this.sent.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api.inviteSponsorship(this.form.getRawValue().email.trim()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.saving.set(false);
        this.sent.set(true);
        this.form.reset();
      },
      error: (err: unknown) => {
        this.actionError.set(errorMessage(err, 'The offer could not be sent.'));
        this.saving.set(false);
      },
    });
  }

  protected withdraw(item: SchoolSponsorship): void {
    const question =
      item.status === 'INVITED'
        ? `Withdraw the offer to ${item.email}?`
        : `End the sponsored Pro account for ${item.email}? Their data stays; their plan returns to Free.`;
    if (!confirm(question)) return;
    this.actionError.set(null);
    this.sent.set(false);
    this.api.withdrawSponsorship(item.id).subscribe({
      next: (data) => this.data.set(data),
      error: (err: unknown) =>
        this.actionError.set(errorMessage(err, 'The sponsored account could not be ended.')),
    });
  }
}
