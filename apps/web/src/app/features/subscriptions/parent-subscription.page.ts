import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ParentPlanResponse } from '@auticare/contracts';
import { PLAN_PRICES_CENTS, PRO_MAX_CHILDREN } from '@auticare/contracts/plans';
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
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';

/**
 * The parent's plan: Free or Pro (personal or sponsored by a school), the
 * child-profile limit, and any school offers waiting for an answer. Payments are
 * not online yet, so upgrading is arranged with the AutiCare team.
 */
@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent, UiSpinnerComponent],
  selector: 'ac-parent-subscription-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Subscription</h1>
        <p class="subtitle">
          Your plan and what it includes. AutiCare's tools are educational and never a medical
          diagnosis.
        </p>
      </div>
    </header>

    @if (loading()) {
      <ac-ui-spinner label="Loading your plan…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (plan(); as p) {
      @for (offer of p.offers; track offer.id) {
        <section class="card highlight" aria-label="Sponsored Pro offer">
          <h2>{{ offer.schoolName }} is offering you AutiCare Pro</h2>
          <p class="note">
            The school pays for Pro on your own account. Accepting does
            <strong>not</strong> share any of your children's information with the school — you
            decide separately, child by child, what to share.
          </p>
          <div class="actions">
            <button
              type="button"
              class="btn-primary"
              [disabled]="busy()"
              (click)="accept(offer.id)"
            >
              Accept Pro
            </button>
            <button type="button" class="btn-ghost" [disabled]="busy()" (click)="decline(offer.id)">
              Decline
            </button>
          </div>
        </section>
      }

      <section class="card" aria-labelledby="plan-title">
        <div class="plan-line">
          <span class="plan-name" id="plan-title">{{ p.plan === 'PRO' ? 'Pro' : 'Free' }}</span>
          @if (p.source === 'SPONSORED' && p.sponsorship) {
            <span class="chip">Sponsored by {{ p.sponsorship.schoolName }}</span>
          } @else if (p.source === 'PERSONAL' && p.subscription) {
            <span class="chip" [attr.data-status]="p.subscription.status">{{
              statusLabel[p.subscription.status]
            }}</span>
          }
        </div>

        <dl class="facts">
          <div>
            <dt>Child profiles</dt>
            <dd>
              {{ p.activeChildren }}
              @if (p.maxChildren !== null) {
                of {{ p.maxChildren }}
              }
            </dd>
          </div>
          @if (p.source === 'PERSONAL' && p.subscription; as sub) {
            <div>
              <dt>Price</dt>
              <dd>{{ price(sub.priceCents, sub.interval) }}</dd>
            </div>
            <div>
              <dt>Paid through</dt>
              <dd>{{ formatDate(sub.currentPeriodEnd) }}</dd>
            </div>
          }
        </dl>

        @if (p.source === 'PERSONAL' && p.subscription; as sub) {
          <p class="note">{{ accessLine(sub) }}</p>
        }
        @if (p.maxChildren !== null && p.activeChildren > p.maxChildren) {
          <ac-ui-message tone="info">
            You have more child profiles than your plan includes. Nothing has been removed; you just
            can't add or restore another until you're under the limit.
          </ac-ui-message>
        }
        @if (p.plan === 'FREE' && p.subscription && !p.subscription.grantsAccess) {
          <p class="note">
            Your Pro plan has ended. All your children's profiles and notes are still here.
          </p>
        }
      </section>

      @if (p.sponsorship; as sp) {
        <section class="card" aria-label="Sponsored account">
          <h2>Sponsored by {{ sp.schoolName }}</h2>
          @if (sp.grantsAccess) {
            <p class="note">
              Since {{ formatDate(sp.acceptedAt) }}. The school sees only that this sponsored slot
              is in use — not your children or their information.
            </p>
          } @else {
            <p class="note">
              The school's Business plan isn't active right now, so this sponsorship is paused. Your
              data is unchanged.
            </p>
          }
          <div class="actions">
            <button type="button" class="btn-small danger" [disabled]="busy()" (click)="leave()">
              Leave sponsorship
            </button>
          </div>
        </section>
      }

      @if (p.plan === 'FREE') {
        <section class="card" aria-labelledby="pro-title">
          <h2 id="pro-title">AutiCare Pro</h2>
          <p class="plan-line">
            <strong>{{ price(proPrices.MONTHLY, 'MONTHLY') }}</strong>
            <span class="meta">or {{ price(proPrices.YEARLY, 'YEARLY') }} (save $40)</span>
          </p>
          <ul class="note">
            <li>Up to {{ proMaxChildren }} child profiles, each with their own questionnaire</li>
            <li>A personalized dashboard for each child once their questionnaire is done</li>
            <li>The AI Parent Assistant in Khmer and English</li>
            <li>Daily behaviour tracking, trends and downloadable reports</li>
          </ul>
          <p class="note">
            Online payment isn't available yet. To start Pro, contact the AutiCare team from
            <a routerLink="/support">Help &amp; Support</a>. If your child's school has a Business
            plan, it can also sponsor Pro for you.
          </p>
        </section>
      }

      @if (actionError(); as message) {
        <ac-ui-message tone="error">{{ message }}</ac-ui-message>
      }
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentSubscriptionPage implements OnInit {
  private readonly api = inject(SubscriptionsApi);

  protected readonly plan = signal<ParentPlanResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly proPrices = PLAN_PRICES_CENTS.PRO;
  protected readonly proMaxChildren = PRO_MAX_CHILDREN;
  protected readonly price = formatPrice;
  protected readonly formatDate = formatDate;
  protected readonly accessLine = accessLine;

  ngOnInit(): void {
    this.api.myPlan().subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Your plan could not be loaded.'));
        this.loading.set(false);
      },
    });
  }

  protected accept(id: string): void {
    this.run(this.api.acceptOffer(id), 'The offer could not be accepted.');
  }

  protected decline(id: string): void {
    this.run(this.api.declineOffer(id), 'The offer could not be declined.');
  }

  protected leave(): void {
    if (!confirm('Leave this sponsored Pro account? Your data stays; your plan returns to Free.')) {
      return;
    }
    this.run(this.api.leaveSponsorship(), 'The sponsorship could not be ended.');
  }

  private run(request: ReturnType<SubscriptionsApi['myPlan']>, fallback: string): void {
    this.busy.set(true);
    this.actionError.set(null);
    request.subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.busy.set(false);
      },
      error: (err: unknown) => {
        this.actionError.set(errorMessage(err, fallback));
        this.busy.set(false);
      },
    });
  }
}
