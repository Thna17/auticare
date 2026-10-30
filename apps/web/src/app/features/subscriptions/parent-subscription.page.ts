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
    <div class="sub-container">
      <header class="page-head">
        <div class="head-text">
          <div class="category-pill">
            <svg
              class="pill-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>Plan &amp; Billing</span>
          </div>
          <h1>Subscription</h1>
          <p class="subtitle">
            Your plan and what it includes. AutiCare's tools are educational and never a medical
            diagnosis.
          </p>
        </div>

        @if (plan(); as p) {
          <div class="tier-badge" [class.pro]="p.plan === 'PRO'">
            <span class="status-indicator"></span>
            <span class="tier-label">
              @if (p.plan === 'PRO') {
                {{ p.source === 'SPONSORED' ? 'Pro (Sponsored)' : 'Pro Active' }}
              } @else {
                Free Tier
              }
            </span>
          </div>
        }
      </header>

      @if (loading()) {
        <ac-ui-spinner label="Loading your plan…" />
      } @else if (error(); as message) {
        <ac-ui-message tone="error">{{ message }}</ac-ui-message>
      } @else if (plan(); as p) {
        @for (offer of p.offers; track offer.id) {
          <section class="card highlight offer-card" aria-label="Sponsored Pro offer">
            <div class="offer-header">
              <div class="offer-icon-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
              </div>
              <div class="offer-info">
                <span class="offer-tag">Sponsored Membership Offer</span>
                <h2>{{ offer.schoolName }} is offering you AutiCare Pro</h2>
              </div>
            </div>

            <div class="privacy-callout">
              <svg
                class="shield-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p class="note">
                The school pays for Pro on your own account. Accepting does
                <strong>not</strong> share any of your children's information with the school — you
                decide separately, child by child, what to share.
              </p>
            </div>

            <div class="actions">
              <button
                type="button"
                class="btn-primary"
                [disabled]="busy()"
                (click)="accept(offer.id)"
              >
                <svg
                  class="btn-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Accept Pro
              </button>
              <button
                type="button"
                class="btn-ghost"
                [disabled]="busy()"
                (click)="decline(offer.id)"
              >
                Decline
              </button>
            </div>
          </section>
        }

        <section class="card plan-overview-card" aria-labelledby="plan-title">
          <div class="card-topbar">
            <div class="plan-line">
              <span class="plan-badge-type">CURRENT PLAN</span>
              <span class="plan-name" id="plan-title">{{ p.plan === 'PRO' ? 'Pro' : 'Free' }}</span>
              @if (p.source === 'SPONSORED' && p.sponsorship) {
                <span class="chip">Sponsored by {{ p.sponsorship.schoolName }}</span>
              } @else if (p.source === 'PERSONAL' && p.subscription) {
                <span class="chip" [attr.data-status]="p.subscription.status">{{
                  statusLabel[p.subscription.status]
                }}</span>
              } @else {
                <span class="chip off">Standard Access</span>
              }
            </div>
            <div class="plan-sub-tag">
              {{
                p.plan === 'PRO'
                  ? 'Full Developmental Suite & AI Assistant'
                  : 'Basic Early Observation & Screening'
              }}
            </div>
          </div>

          <dl class="facts metrics-grid">
            <div class="metric-box">
              <div class="metric-top">
                <dt>Child profiles</dt>
                <svg
                  class="metric-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <dd class="metric-value">
                {{ p.activeChildren }}
                @if (p.maxChildren !== null) {
                  of {{ p.maxChildren }}
                }
              </dd>
              <div
                class="capacity-meter"
                role="progressbar"
                [attr.aria-valuenow]="p.activeChildren"
                [attr.aria-valuemax]="p.maxChildren ?? 2"
              >
                <span [style.width.%]="childCapacityPercentage(p)"></span>
              </div>
              <span class="metric-subtext">
                @if (p.maxChildren !== null) {
                  {{
                    p.activeChildren >= p.maxChildren
                      ? 'Profile limit reached'
                      : p.maxChildren - p.activeChildren + ' profile slot(s) available'
                  }}
                } @else {
                  Active developmental records
                }
              </span>
            </div>

            @if (p.source === 'PERSONAL' && p.subscription; as sub) {
              <div class="metric-box">
                <div class="metric-top">
                  <dt>Price</dt>
                  <svg
                    class="metric-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <dd class="metric-value">{{ price(sub.priceCents, sub.interval) }}</dd>
                <span class="metric-subtext">{{
                  sub.interval === 'YEARLY' ? 'Annual billing' : 'Monthly recurring'
                }}</span>
              </div>

              <div class="metric-box">
                <div class="metric-top">
                  <dt>Paid through</dt>
                  <svg
                    class="metric-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <dd class="metric-value">{{ formatDate(sub.currentPeriodEnd) }}</dd>
                <span class="metric-subtext">{{
                  sub.grantsAccess ? 'Active access window' : 'Cycle expired'
                }}</span>
              </div>
            } @else if (p.source === 'SPONSORED' && p.sponsorship; as sp) {
              <div class="metric-box">
                <div class="metric-top">
                  <dt>Sponsor</dt>
                  <svg
                    class="metric-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <dd class="metric-value">{{ sp.schoolName }}</dd>
                <span class="metric-subtext">School sponsored tier ($0 to family)</span>
              </div>

              <div class="metric-box">
                <div class="metric-top">
                  <dt>Sponsored since</dt>
                  <svg
                    class="metric-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <dd class="metric-value">{{ formatDate(sp.acceptedAt) }}</dd>
                <span class="metric-subtext">Active partnership slot</span>
              </div>
            } @else {
              <div class="metric-box">
                <div class="metric-top">
                  <dt>Cost</dt>
                  <svg
                    class="metric-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-6 0c0 4 6 2 6 6a3.5 3.5 0 0 1-6 0" />
                  </svg>
                </div>
                <dd class="metric-value">$0 / month</dd>
                <span class="metric-subtext">Always free for basic screenings</span>
              </div>

              <div class="metric-box">
                <div class="metric-top">
                  <dt>Next Step</dt>
                  <svg
                    class="metric-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <polygon
                      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    />
                  </svg>
                </div>
                <dd class="metric-value">Upgrade to Pro</dd>
                <span class="metric-subtext">Multi-child &amp; AI assistant access</span>
              </div>
            }
          </dl>

          @if (p.source === 'PERSONAL' && p.subscription; as sub) {
            <p class="note info-bar">{{ accessLine(sub) }}</p>
          }
          @if (p.maxChildren !== null && p.activeChildren > p.maxChildren) {
            <ac-ui-message tone="info">
              You have more child profiles than your plan includes. Nothing has been removed; you
              just can't add or restore another until you're under the limit.
            </ac-ui-message>
          }
          @if (p.plan === 'FREE' && p.subscription && !p.subscription.grantsAccess) {
            <p class="note ended-bar">
              Your Pro plan has ended. All your children's profiles and notes are still here.
            </p>
          }
        </section>

        @if (p.sponsorship; as sp) {
          <section class="card sponsorship-card" aria-label="Sponsored account">
            <div class="sponsorship-header">
              <div class="sponsorship-badge-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div>
                <h2>Sponsored by {{ sp.schoolName }}</h2>
                <span class="sponsorship-status">Active School Partnership</span>
              </div>
            </div>

            @if (sp.grantsAccess) {
              <p class="note">
                Since {{ formatDate(sp.acceptedAt) }}. The school sees only that this sponsored slot
                is in use — not your children or their information.
              </p>
            } @else {
              <p class="note">
                The school's Business plan isn't active right now, so this sponsorship is paused.
                Your data is unchanged.
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
          <section class="card pro-showcase-card" aria-labelledby="pro-title">
            <div class="pro-header">
              <div>
                <div class="pro-tag">RECOMMENDED FOR FAMILIES</div>
                <h2 id="pro-title">AutiCare Pro</h2>
                <p class="pro-tagline">
                  Unlock the complete toolkit for comprehensive developmental tracking and AI
                  guidance.
                </p>
              </div>
              <div class="pro-pricing-box">
                <p class="plan-line">
                  <strong>{{ price(proPrices.MONTHLY, 'MONTHLY') }}</strong>
                  <span class="meta">or {{ price(proPrices.YEARLY, 'YEARLY') }} (save $40)</span>
                </p>
                <span class="billing-note">Billed monthly or annually in USD</span>
              </div>
            </div>

            <div class="pro-features-grid">
              <div class="pro-feature-item">
                <div class="feature-icon-wrapper" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>Up to {{ proMaxChildren }} child profiles</strong>
                  <span
                    >Each child with their own questionnaire, history, and development
                    tracking.</span
                  >
                </div>
              </div>

              <div class="pro-feature-item">
                <div class="feature-icon-wrapper" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>Personalized child dashboards</strong>
                  <span
                    >A personalized dashboard for each child once their questionnaire is done.</span
                  >
                </div>
              </div>

              <div class="pro-feature-item">
                <div class="feature-icon-wrapper" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>AI Parent Assistant</strong>
                  <span
                    >The AI Parent Assistant in Khmer and English to guide daily strategies.</span
                  >
                </div>
              </div>

              <div class="pro-feature-item">
                <div class="feature-icon-wrapper" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>Behavior trends &amp; reports</strong>
                  <span
                    >Daily behaviour tracking, trends and downloadable reports for
                    specialists.</span
                  >
                </div>
              </div>
            </div>

            <ul class="note sr-only">
              <li>Up to {{ proMaxChildren }} child profiles, each with their own questionnaire</li>
              <li>A personalized dashboard for each child once their questionnaire is done</li>
              <li>The AI Parent Assistant in Khmer and English</li>
              <li>Daily behaviour tracking, trends and downloadable reports</li>
            </ul>

            <div class="pro-cta-banner">
              <div class="cta-text">
                <h3>Ready to get started?</h3>
                <p class="note">
                  Online payment isn't available yet. To start Pro, contact the AutiCare team from
                  <a routerLink="/support">Help &amp; Support</a>. If your child's school has a
                  Business plan, it can also sponsor Pro for you.
                </p>
              </div>
              <div class="cta-actions">
                <a routerLink="/support" class="btn-primary cta-btn">
                  <svg
                    class="btn-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Contact Support to Upgrade
                </a>
              </div>
            </div>
          </section>
        }

        <section class="trust-grid" aria-label="Privacy and security guarantees">
          <div class="trust-card">
            <div class="trust-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h4>Strict Privacy Control</h4>
            <p>
              Sponsoring schools never see your child's screening results or clinical notes. Only
              you choose what to share.
            </p>
          </div>

          <div class="trust-card">
            <div class="trust-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path
                  d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
                />
              </svg>
            </div>
            <h4>Preserved Records</h4>
            <p>
              Moving between plans never removes data. All child profiles and historical logs remain
              permanently saved.
            </p>
          </div>

          <div class="trust-card">
            <div class="trust-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h4>Educational Support</h4>
            <p>
              Tools are designed to assist parent observations and early development, complementing
              certified clinician care.
            </p>
          </div>
        </section>

        @if (actionError(); as message) {
          <ac-ui-message tone="error">{{ message }}</ac-ui-message>
        }
      }
    </div>
  `,
  styles: [
    PORTAL_PAGE_STYLES,
    `
      :host {
        display: block;
        width: 100%;
        padding-bottom: 48px;
      }

      .sub-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
        width: 100%;
      }

      .page-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .head-text {
        flex: 1 1 320px;
        min-width: 0;
      }

      .category-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-brand-50);
        color: var(--ac-brand-700);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin-bottom: 8px;
        border: 1px solid var(--ac-brand-100);
      }

      .pill-icon {
        width: 14px;
        height: 14px;
      }

      .tier-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-slate-100);
        border: 1px solid var(--ac-color-border-slate);
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        align-self: flex-start;
      }

      .tier-badge.pro {
        background: var(--ac-brand-50);
        border-color: var(--ac-brand-200);
        color: var(--ac-brand-800);
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-slate-400);
      }

      .tier-badge.pro .status-indicator {
        background: var(--ac-color-green-500);
        box-shadow: 0 0 0 2px var(--ac-brand-100);
      }

      /* Offer Banner Card */
      .offer-card {
        background: var(--ac-brand-50);
        border: 1.5px solid var(--ac-brand-300);
        border-radius: var(--ac-radius-lg);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: var(--ac-shadow-sm);
      }

      .offer-header {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .offer-icon-badge {
        width: 44px;
        height: 44px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-brand-100);
        color: var(--ac-brand-700);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .offer-icon-badge svg {
        width: 22px;
        height: 22px;
      }

      .offer-tag {
        display: block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ac-brand-700);
        margin-bottom: 2px;
      }

      .offer-info h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .privacy-callout {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-brand-200);
        border-radius: var(--ac-radius-md);
        padding: 14px 16px;
      }

      .shield-icon {
        width: 20px;
        height: 20px;
        color: var(--ac-brand-600);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .privacy-callout .note {
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
        margin: 0;
      }

      /* Plan Overview Card */
      .plan-overview-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg);
        padding: 28px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        box-shadow: var(--ac-shadow-sm);
      }

      .card-topbar {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .plan-badge-type {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ac-brand-600);
      }

      .plan-sub-tag {
        font-size: 14px;
        color: var(--ac-color-text-muted);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin: 0;
      }

      .metric-box {
        background: var(--ac-brand-50);
        border: 1px solid var(--ac-brand-100);
        border-radius: var(--ac-radius-md);
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .metric-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .metric-top dt {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--ac-brand-800);
        margin: 0;
      }

      .metric-icon {
        width: 18px;
        height: 18px;
        color: var(--ac-brand-500);
      }

      .metric-value {
        font-size: 22px;
        font-weight: 800;
        color: var(--ac-color-text-strong);
        margin: 2px 0 0;
      }

      .metric-subtext {
        font-size: 12px;
        color: var(--ac-color-text-muted);
        margin-top: 2px;
      }

      .capacity-meter {
        height: 6px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-brand-200);
        overflow: hidden;
        margin: 6px 0 2px;
      }

      .capacity-meter span {
        display: block;
        height: 100%;
        background: var(--ac-brand-600);
        border-radius: var(--ac-radius-pill);
        transition: width var(--ac-motion-normal);
      }

      .info-bar {
        padding: 12px 14px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-slate-100);
        font-size: 13.5px;
        color: var(--ac-color-text-body);
        border-left: 3px solid var(--ac-brand-500);
      }

      .ended-bar {
        padding: 12px 14px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-text);
        font-size: 13.5px;
      }

      /* Active Sponsorship Card */
      .sponsorship-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: var(--ac-shadow-sm);
      }

      .sponsorship-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .sponsorship-badge-icon {
        width: 38px;
        height: 38px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-brand-100);
        color: var(--ac-brand-700);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .sponsorship-badge-icon svg {
        width: 20px;
        height: 20px;
      }

      .sponsorship-header h2 {
        margin: 0;
        font-size: 17px;
        color: var(--ac-color-text-strong);
      }

      .sponsorship-status {
        font-size: 12px;
        color: var(--ac-brand-700);
        font-weight: 600;
      }

      /* Pro Plan Feature Showcase Card */
      .pro-showcase-card {
        background: var(--ac-color-surface);
        border: 1.5px solid var(--ac-brand-200);
        border-radius: var(--ac-radius-lg);
        padding: 28px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        box-shadow: var(--ac-shadow-md);
        position: relative;
        overflow: hidden;
      }

      .pro-showcase-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--ac-brand-400), var(--ac-brand-600));
      }

      .pro-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
      }

      .pro-tag {
        display: inline-block;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ac-brand-600);
        margin-bottom: 4px;
      }

      .pro-header h2 {
        font-size: 24px;
        font-weight: 800;
        color: var(--ac-color-text-strong);
        margin: 0 0 4px;
      }

      .pro-tagline {
        margin: 0;
        font-size: 14px;
        color: var(--ac-color-text-muted);
        max-width: 66ch;
      }

      .pro-pricing-box {
        text-align: right;
      }

      .pro-pricing-box .plan-line {
        justify-content: flex-end;
      }

      .pro-pricing-box strong {
        font-size: 24px;
        color: var(--ac-color-text-strong);
      }

      .billing-note {
        display: block;
        font-size: 12px;
        color: var(--ac-color-text-muted);
        margin-top: 2px;
      }

      .pro-features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
      }

      .pro-feature-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-brand-50);
        border: 1px solid var(--ac-brand-100);
      }

      .feature-icon-wrapper {
        width: 24px;
        height: 24px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-brand-500);
        color: var(--ac-color-text-on-action);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .feature-icon-wrapper svg {
        width: 14px;
        height: 14px;
      }

      .feature-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .feature-content strong {
        font-size: 14px;
        color: var(--ac-color-text-strong);
      }

      .feature-content span {
        font-size: 13px;
        color: var(--ac-color-text-muted);
        line-height: 1.4;
      }

      .pro-cta-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
        background: var(--ac-color-slate-100);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        padding: 18px 20px;
      }

      .cta-text {
        flex: 1 1 300px;
      }

      .cta-text h3 {
        margin: 0 0 4px;
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .cta-text .note {
        font-size: 13.5px;
        color: var(--ac-color-text-body);
        margin: 0;
      }

      .cta-actions {
        flex-shrink: 0;
      }

      .cta-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      }

      .btn-icon {
        width: 16px;
        height: 16px;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Trust & Guarantees Grid */
      .trust-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-top: 4px;
      }

      .trust-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        padding: 20px 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .trust-icon {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-brand-50);
        color: var(--ac-brand-700);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 4px;
      }

      .trust-icon svg {
        width: 18px;
        height: 18px;
      }

      .trust-card h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .trust-card p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--ac-color-text-muted);
      }

      @media (max-width: 640px) {
        .pro-header {
          flex-direction: column;
        }
        .pro-pricing-box {
          text-align: left;
        }
        .pro-pricing-box .plan-line {
          justify-content: flex-start;
        }
        .pro-cta-banner {
          flex-direction: column;
          align-items: stretch;
        }
        .cta-btn {
          width: 100%;
        }
      }
    `,
  ],
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

  protected childCapacityPercentage(p: ParentPlanResponse): number {
    if (!p.maxChildren || p.maxChildren <= 0) return 50;
    return Math.min(100, Math.round((p.activeChildren / p.maxChildren) * 100));
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
