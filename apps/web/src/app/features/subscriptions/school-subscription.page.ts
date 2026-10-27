import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SchoolSubscriptionResponse } from '@auticare/contracts';
import { PLAN_PRICES_CENTS } from '@auticare/contracts/plans';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { SubscriptionsApi } from './data-access/subscriptions.api';
import {
  STATUS_LABEL,
  accessLine,
  errorMessage,
  formatDate,
  formatPrice,
} from './subscription-format';
import { SUBSCRIPTION_PAGE_STYLES } from './subscription-page.styles';

/** The school admin's Business plan: status, price, paid-through date and slot usage. */
@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent, UiSpinnerComponent],
  selector: 'ac-school-subscription-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Subscription &amp; Billing</h1>
        <p class="subtitle">
          Your school's Business plan. Teacher accounts are not limited by the plan; the plan adds
          five sponsored Pro accounts you can give to families.
        </p>
      </div>
    </header>

    @if (loading()) {
      <ac-ui-spinner label="Loading your plan…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      <section class="card" aria-labelledby="plan-title">
        <div class="plan-line">
          <span class="plan-name" id="plan-title">Business</span>
          @if (d.subscription; as sub) {
            <span class="chip" [attr.data-status]="sub.status">{{ statusLabel[sub.status] }}</span>
          } @else {
            <span class="chip off">Not active</span>
          }
        </div>

        @if (d.subscription; as sub) {
          <dl class="facts">
            <div>
              <dt>Price</dt>
              <dd>{{ price(sub.priceCents, sub.interval) }}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{{ formatDate(sub.startedAt) }}</dd>
            </div>
            <div>
              <dt>Paid through</dt>
              <dd>{{ formatDate(sub.currentPeriodEnd) }}</dd>
            </div>
            <div>
              <dt>Sponsored Pro accounts</dt>
              <dd>{{ d.slotsUsed }} of {{ d.slotsTotal }} in use</dd>
            </div>
          </dl>
          <p class="note">{{ accessLine(sub) }}</p>
        } @else {
          <p class="note">
            Business is {{ price(prices.MONTHLY, 'MONTHLY') }} or
            {{ price(prices.YEARLY, 'YEARLY') }} (save $120). Online payment isn't available yet;
            contact the AutiCare team from <a routerLink="/support">Help &amp; Support</a> to start
            it.
          </p>
        }

        <div class="actions">
          <a class="btn-ghost" routerLink="/schools/sponsorships">Manage sponsored Pro accounts</a>
        </div>
      </section>
    }
  `,
  styles: [SUBSCRIPTION_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolSubscriptionPage implements OnInit {
  private readonly api = inject(SubscriptionsApi);

  protected readonly data = signal<SchoolSubscriptionResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly prices = PLAN_PRICES_CENTS.BUSINESS;
  protected readonly price = formatPrice;
  protected readonly formatDate = formatDate;
  protected readonly accessLine = accessLine;

  ngOnInit(): void {
    this.api.schoolSubscription().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Your plan could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
