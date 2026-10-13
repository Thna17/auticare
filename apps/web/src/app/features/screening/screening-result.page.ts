import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChildResponse, RiskLevel, ScreeningSessionResultResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from './data-access/screening.api';
import { ScreeningBadgeComponent } from './components/screening-badge.component';
import type { BadgeTone } from './components/screening-badge.component';
import { observationFor } from './screening-observations';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { I18nService } from '../../core/i18n/i18n.service';

const MAX_ANSWER_VALUE = 4;

const riskTones: Record<RiskLevel, BadgeTone> = {
  LOW: 'positive',
  MODERATE: 'caution',
  HIGH: 'alert',
};
const riskLabels: Record<RiskLevel, string> = {
  LOW: 'Low Risk',
  MODERATE: 'Moderate Risk',
  HIGH: 'High Risk',
};
const concernLabels: Record<RiskLevel, string> = {
  LOW: 'Low Concern',
  MODERATE: 'Moderate Concern',
  HIGH: 'Elevated Concern',
};
const riskShort: Record<RiskLevel, string> = { LOW: 'Low', MODERATE: 'Moderate', HIGH: 'High' };

type ActionCard = {
  readonly title: string;
  readonly subtitle: string;
  readonly path: string;
  readonly icon: 'calendar' | 'hospital' | 'activities';
  readonly queryParams?: Record<string, string> | null;
};

// Next-step copy varies by overall risk. HIGH lists "Book an appointment" first.
const nextStepsByRisk: Record<RiskLevel, { lead: string; cards: readonly ActionCard[] }> = {
  LOW: {
    lead: "Your child's responses look broadly on track for their age. There's no urgency — keep supporting their development.",
    cards: [
      {
        title: 'View activities',
        subtitle: 'Play ideas that support development',
        path: '/activities',
        icon: 'activities',
      },
      {
        title: 'Browse hospitals',
        subtitle: 'Good to know your options, just in case',
        path: '/hospitals',
        icon: 'hospital',
      },
    ],
  },
  MODERATE: {
    lead: "A few areas stood out. There's no need to worry, but it's worth raising these results at your child's next pediatrician visit.",
    cards: [
      {
        title: 'Discuss at next visit',
        subtitle: 'Share these results with your pediatrician',
        path: '/appointments',
        icon: 'calendar',
      },
      {
        title: 'Browse hospitals',
        subtitle: 'Find specialist clinics near you',
        path: '/hospitals',
        icon: 'hospital',
      },
      {
        title: 'View activities',
        subtitle: 'Supportive activities for your child',
        path: '/activities',
        icon: 'activities',
      },
    ],
  },
  HIGH: {
    lead: 'Several areas suggest it would help to seek a professional evaluation soon. A specialist can give you a clearer picture.',
    cards: [
      {
        title: 'Book an appointment',
        subtitle: 'We recommend a professional evaluation soon',
        path: '/appointments',
        icon: 'calendar',
      },
      {
        title: 'Browse hospitals',
        subtitle: 'Find specialist clinics near you',
        path: '/hospitals',
        icon: 'hospital',
      },
      {
        title: 'View activities',
        subtitle: 'Supportive activities in the meantime',
        path: '/activities',
        icon: 'activities',
      },
    ],
  },
};

const formatAge = (dateOfBirth: string): string => {
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  let months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birth.getUTCMonth());
  if (now.getUTCDate() < birth.getUTCDate()) months -= 1;
  months = Math.max(months, 0);
  const years = Math.floor(months / 12);
  if (years < 1) return `${months} month${months === 1 ? '' : 's'} old`;
  return `${years} year${years === 1 ? '' : 's'} old`;
};

@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiCardComponent,
    ScreeningBadgeComponent,
    UiMessageComponent,
    UiSpinnerComponent,
  ],
  template: `
    <section class="result">
      @if (loading()) {
        <div class="state-center">
          <ac-ui-spinner label="Loading screening result…" />
        </div>
      } @else if (fatalError()) {
        <div class="state-center fatal">
          <ac-ui-message tone="error">{{ fatalError() }}</ac-ui-message>
          <button type="button" class="link" (click)="goToScreeningHome()">
            Back to Screening
          </button>
        </div>
      } @else if (result(); as res) {
        <div class="result-actions-bar no-print">
          <button
            type="button"
            class="btn-lang-toggle"
            (click)="toggleLanguage()"
            [attr.aria-label]="isKm() ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'"
          >
            <span class="lang-flag" aria-hidden="true">{{ isKm() ? '🇬🇧' : '🇰🇭' }}</span>
            <span class="lang-text">{{ isKm() ? 'English' : 'ភាសាខ្មែរ' }}</span>
          </button>
          <button
            type="button"
            class="btn-print"
            (click)="printResult()"
            aria-label="Print or save screening report as PDF"
          >
            <svg
              class="print-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path
                d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
              />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print / Save PDF
          </button>
        </div>

        <div class="print-only-header">
          <h1 class="print-title">AutiCare Clinical Developmental Screening Summary</h1>
          <p class="print-meta">
            Confidential Clinical Summary · Generated for Pediatrician & Specialist Consultation
          </p>
        </div>

        <!-- 1. HEADER CARD WITH VISUAL RISK METER -->
        <article class="header-card">
          <div class="header-top">
            <div class="who">
              <p class="child-name">{{ childName() ?? 'Your child' }}</p>
              <p class="child-meta">
                @if (childAge()) {
                  <span>{{ childAge() }}</span> ·
                }
                Completed {{ completedDate() }}
              </p>
            </div>
            <div class="risk-badge-group">
              <ac-screening-badge [tone]="overallTone()">{{ overallLabel() }}</ac-screening-badge>
              <span class="concern-pill" [class]="res.riskLevel.toLowerCase()">{{
                concernLabel()
              }}</span>
            </div>
          </div>

          <!-- Empathetic, Reassuring Summary Explanation -->
          <div class="empathetic-summary-card" [class]="res.riskLevel.toLowerCase()">
            <span class="summary-card-icon" aria-hidden="true">
              @if (res.riskLevel === 'LOW') {
                🌿
              } @else if (res.riskLevel === 'MODERATE') {
                🌤️
              } @else {
                💙
              }
            </span>
            <div class="summary-card-content">
              <div class="empathetic-khmer-guidance" role="note">
                <span class="khmer-guidance-badge"
                  >🇰🇭 សារណែនាំលើកទឹកចិត្ត (Empathetic Guidance)</span
                >
                <p class="khmer-guidance-quote">
                  “លទ្ធផលនេះមិនមែនជាការធ្វើរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រទេ
                  ប៉ុន្តែជាការណែនាំដើម្បីជួយគាំទ្រដល់ការលូតលាស់របស់កុមារ”
                </p>
              </div>
              <strong>{{ summaryTitle() }}</strong>
              <p>{{ reassuringExplanation() }}</p>
            </div>
          </div>

          <!-- Calming Semicircular Visual Risk Meter -->
          <div class="visual-meter-container" aria-label="Visual developmental risk gauge">
            <div class="gauge-box">
              <svg class="gauge-svg" viewBox="0 0 220 125" aria-hidden="true">
                <!-- Background Meter Track -->
                <path
                  d="M 25 105 A 85 85 0 0 1 195 105"
                  fill="none"
                  stroke="var(--ac-color-slate-line-mist)"
                  stroke-width="18"
                  stroke-linecap="round"
                />
                <!-- Filled Score Arc with Dynamic Color -->
                <path
                  d="M 25 105 A 85 85 0 0 1 195 105"
                  fill="none"
                  [attr.stroke]="meterColor(res.riskLevel)"
                  stroke-width="18"
                  stroke-linecap="round"
                  stroke-dasharray="267"
                  [attr.stroke-dashoffset]="267 - (267 * (res.riskPercentage ?? 0)) / 100"
                  class="gauge-active-fill"
                />
              </svg>

              <div class="gauge-overlay-text">
                <span class="gauge-score-num">
                  {{ res.riskPercentage !== null ? res.riskPercentage : res.score
                  }}<span class="gauge-unit">{{ res.riskPercentage !== null ? '%' : '' }}</span>
                </span>
                <span class="gauge-status-tag" [class]="res.riskLevel.toLowerCase()">
                  {{ overallLabel() }}
                </span>
              </div>
            </div>

            <div class="spectrum-tiers" aria-label="Risk level guide">
              <span class="tier-pill" [class.active-tier]="res.riskLevel === 'LOW'">
                <span class="tier-dot low-dot"></span> Low Risk (0–33%)
              </span>
              <span class="tier-pill" [class.active-tier]="res.riskLevel === 'MODERATE'">
                <span class="tier-dot moderate-dot"></span> Moderate Risk (34–66%)
              </span>
              <span class="tier-pill" [class.active-tier]="res.riskLevel === 'HIGH'">
                <span class="tier-dot high-dot"></span> Elevated Risk (67–100%)
              </span>
            </div>
          </div>

          @if (trend(); as t) {
            @if (t.comparable) {
              <p class="trend" [class]="t.direction">
                <span class="trend-arrow" aria-hidden="true">{{ t.arrow }}</span>
                {{ t.text }}
              </p>
            } @else {
              <p class="trend-note">
                Your child moved to a new age group since their last screening, so results aren't
                directly comparable.
              </p>
            }
          }
        </article>

        <!-- 2. PROMINENT CLINICAL NEXT STEPS ACTION TOOLBAR -->
        <section class="prominent-action-toolbar no-print" aria-label="Quick clinical actions">
          <a
            class="toolbar-card primary-card"
            [routerLink]="'/appointments'"
            [queryParams]="child() ? { childId: child()!.id } : null"
            title="កក់ការពិគ្រោះយោបល់នៅមន្ទីរពេទ្យកុមារជាតិ ឬគន្ធបុប្ផា (Book Specialist Consultation)"
          >
            <span class="toolbar-icon" aria-hidden="true">🩺</span>
            <div class="toolbar-details">
              <strong class="action-title-primary">
                <span class="title-km">កក់ការពិគ្រោះយោបល់នៅមន្ទីរពេទ្យកុមារជាតិ ឬគន្ធបុប្ផា</span>
                <span class="title-en-sub">Book a Specialist Consultation</span>
              </strong>
              <span class="action-desc">
                ពិគ្រោះជាមួយវេជ្ជបណ្ឌិតឯកទេសកុមារ (Schedule pediatric evaluation)
              </span>
            </div>
          </a>

          <a
            class="toolbar-card"
            [routerLink]="'/activities'"
            [queryParams]="child() ? { childId: child()!.id } : null"
            title="ស្វែងរកសកម្មភាពលេងជំរុញការលូតលាស់ (Explore Recommended Activities)"
          >
            <span class="toolbar-icon" aria-hidden="true">🎯</span>
            <div class="toolbar-details">
              <strong class="action-title-primary">
                <span class="title-km">ស្វែងរកសកម្មភាពលេងជំរុញការលូតលាស់</span>
                <span class="title-en-sub">Explore Recommended Activities</span>
              </strong>
              <span class="action-desc">
                គំនិតលេងសម្របតាមការលូតលាស់ (Play ideas tailored to results)
              </span>
            </div>
          </a>

          <button
            type="button"
            class="toolbar-card btn-summary-report"
            (click)="printResult()"
            title="ទាញយកឯកសារសង្ខេបសម្រាប់គ្រូពេទ្យ (Download Summary Report)"
            aria-label="ទាញយកឯកសារសង្ខេបសម្រាប់គ្រូពេទ្យ"
          >
            <span class="toolbar-icon" aria-hidden="true">📄</span>
            <div class="toolbar-details">
              <strong class="action-title-primary">
                <span class="title-km">ទាញយកឯកសារសង្ខេបសម្រាប់គ្រូពេទ្យ</span>
                <span class="title-en-sub">Download Summary Report</span>
              </strong>
              <span class="action-desc">
                នាំចេញឯកសារ PDF សម្រាប់ពិគ្រោះយោបល់ (Export Clinical PDF Summary)
              </span>
            </div>
          </button>
        </section>

        <!-- 3. TRANSPARENT MEDICAL DISCLAIMER CALLOUT -->
        <aside
          class="prominent-disclaimer-callout"
          role="note"
          aria-label="Non-diagnostic medical reassurance"
        >
          <div class="disclaimer-icon-wrap" aria-hidden="true">
            <span class="disclaimer-shield">🛡️</span>
          </div>
          <div class="disclaimer-body">
            <h3 class="disclaimer-heading">
              Clinical Non-Diagnostic Reassurance (ការបញ្ជាក់មិនមែនរោគវិនិច្ឆ័យ)
            </h3>
            <p class="khmer-guidance-quote disclaimer-khmer-highlight">
              “លទ្ធផលនេះមិនមែនជាការធ្វើរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រទេ
              ប៉ុន្តែជាការណែនាំដើម្បីជួយគាំទ្រដល់ការលូតលាស់របស់កុមារ”
            </p>
            <p class="disclaimer-text">{{ res.disclaimer }}</p>
            <p class="heuristic-note">
              These assessment indicators and risk bands are designed solely as a compassionate,
              supportive guide to empower collaborative discussions with your pediatrician or
              clinical team. They do not constitute a medical diagnosis.
            </p>
          </div>
        </aside>

        <!-- 4. BREAKDOWN BY CATEGORY WITH CLINICAL EXPLANATIONS -->
        @if (res.categoryBreakdown.length) {
          <section class="breakdown" aria-label="Breakdown by category">
            <h2 class="section-label">Developmental Domain Breakdown (ការវិភាគតាមផ្នែកលូតលាស់)</h2>
            <div class="cat-list">
              @for (cat of res.categoryBreakdown; track cat.category) {
                <article class="cat-card">
                  <div class="cat-head">
                    <div class="cat-title-group">
                      <span class="domain-icon" aria-hidden="true">{{
                        categoryIcon(cat.category)
                      }}</span>
                      <span class="cat-name">
                        <span class="cat-name-km">{{ formatDomainKm(cat.category) }}</span>
                        <span class="cat-name-en"> ({{ cat.category }})</span>
                      </span>
                    </div>
                    <span class="cat-level" [class]="cat.riskLevel.toLowerCase()">
                      {{ shortLabel(cat.riskLevel) }}
                    </span>
                  </div>

                  <div
                    class="bar-track"
                    role="progressbar"
                    [attr.aria-valuenow]="cat.riskPercentage"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    [attr.aria-label]="cat.category + ' risk'"
                  >
                    <span
                      class="bar-fill"
                      [class]="cat.riskLevel.toLowerCase()"
                      [style.width.%]="cat.riskPercentage"
                    ></span>
                  </div>

                  <p class="domain-clinical-explanation">
                    {{ domainExplanation(cat.category) }}
                  </p>
                </article>
              }
            </div>
          </section>
        }

        <!-- 5. WHAT WE NOTICED -->
        @if (observations().length) {
          <section class="noticed" aria-label="What we noticed">
            <h2 class="section-label">Clinical Observations & Patterns</h2>
            <ul class="obs-list">
              @for (obs of observations(); track obs.category) {
                <li>{{ obs.sentence }}</li>
              }
            </ul>
          </section>
        }

        <!-- 6. RECOMMENDED NEXT STEPS CARDS -->
        <section class="next-steps" aria-label="Recommended next steps">
          <h2 class="section-label">Recommended next steps</h2>
          <p class="next-lead">{{ nextSteps().lead }}</p>
          <div class="cards">
            @for (card of nextSteps().cards; track card.path) {
              <a class="action" [routerLink]="card.path" [queryParams]="card.queryParams">
                <ac-ui-card>
                  <span class="action-icon" aria-hidden="true">
                    @switch (card.icon) {
                      @case ('calendar') {
                        <svg viewBox="0 0 24 24">
                          <rect
                            x="4"
                            y="5"
                            width="16"
                            height="16"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                          <line
                            x1="4"
                            y1="9"
                            x2="20"
                            y2="9"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                          <line
                            x1="8"
                            y1="3"
                            x2="8"
                            y2="7"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <line
                            x1="16"
                            y1="3"
                            x2="16"
                            y2="7"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                      }
                      @case ('hospital') {
                        <svg viewBox="0 0 24 24">
                          <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                          <line
                            x1="12"
                            y1="8"
                            x2="12"
                            y2="16"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                          <line
                            x1="8"
                            y1="12"
                            x2="16"
                            y2="12"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                      }
                      @case ('activities') {
                        <svg viewBox="0 0 24 24">
                          <path
                            d="M12 4l2.2 4.9L19.5 9.5l-3.8 3.6 1 5.3L12 15.9 7.3 18.4l1-5.3L4.5 9.5l5.3-.6z"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linejoin="round"
                          />
                        </svg>
                      }
                    }
                  </span>
                  <span class="action-title">{{ card.title }}</span>
                  <span class="action-subtitle">{{ card.subtitle }}</span>
                </ac-ui-card>
              </a>
            }
          </div>
        </section>

        <div class="print-only-footer">
          <p>
            This clinical screening summary was generated by AutiCare. It is intended to facilitate
            collaborative discussion with pediatricians and developmental specialists.
          </p>
        </div>

        <button type="button" class="link center" (click)="goToScreeningHome()">
          Back to Screening
        </button>
      }
    </section>
  `,
  styles: [
    `
      :host {
        --scr-teal: var(--ac-color-action);
        --scr-teal-ink: var(--ac-color-ink-f);
        --scr-text: var(--ac-color-text);
        --scr-text-muted: var(--ac-color-text-muted);
        --scr-surface: var(--ac-color-surface);
        --scr-banner-bg: var(--ac-color-surface-info);
        --scr-banner-border: var(--ac-color-border-info);
        --scr-avatar-bg: var(--ac-color-primary);
        --scr-divider: var(--ac-color-grey-pale);
        --scr-radius: 12px;
        --scr-shadow-card: var(--ac-shadow-sm);
        --scr-error: var(--ac-color-alert-text);
        --scr-low: var(--ac-color-success);
        --scr-moderate: var(--ac-color-warning);
        --scr-high: var(--ac-color-attention);
        display: block;
      }

      .result {
        max-width: 780px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      .state-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
      }

      .fatal {
        gap: 16px;
      }

      /* Header card */
      .header-card {
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--ac-radius-xl);
        box-shadow: var(--ac-shadow-sm);
        padding: 28px 32px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .header-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .risk-badge-group {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
      }

      .concern-pill {
        font-size: 12px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill);
        letter-spacing: 0.02em;
      }

      .concern-pill.low {
        background: var(--ac-color-green-tint-soft);
        color: var(--ac-color-success);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      .concern-pill.moderate {
        background: var(--ac-color-amber-tint-50);
        color: var(--ac-color-warning);
        border: 1px solid var(--ac-color-amber-tint-sand);
      }

      .concern-pill.high {
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
        border: 1px solid var(--ac-color-alert-surface);
      }

      .empathetic-summary-card {
        border-radius: var(--ac-radius-lg);
        padding: 16px 18px;
        display: flex;
        align-items: flex-start;
        gap: 14px;
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface-slate);
      }

      .empathetic-summary-card.low {
        background: var(--ac-color-green-tint-soft);
        border-color: var(--ac-color-green-border-soft);
      }

      .empathetic-summary-card.moderate {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-border-info);
      }

      .empathetic-summary-card.high {
        background: var(--ac-color-tint-blue-mist);
        border-color: var(--ac-color-border-info);
      }

      .empathetic-khmer-guidance {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-md);
        padding: 10px 14px;
        margin-bottom: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .khmer-guidance-badge {
        font-size: 11px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .khmer-guidance-quote {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.5;
        color: var(--ac-color-action-deep);
        font-style: italic;
      }

      .summary-card-icon {
        font-size: 22px;
        line-height: 1.2;
        flex: 0 0 auto;
      }

      .summary-card-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .summary-card-content strong {
        color: var(--ac-color-text-strong);
        font-size: 14px;
      }

      .summary-card-content p {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: 1.5;
      }

      .child-name {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 26px;
        font-weight: 800;
      }

      .child-meta {
        margin: 4px 0 0;
        color: var(--scr-text-muted);
        font-size: 14px;
        font-weight: 600;
      }

      /* Calming Visual Risk Meter */
      .visual-meter-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 0;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-subtle);
        border-radius: var(--ac-radius-lg);
      }

      .gauge-box {
        position: relative;
        width: 220px;
        height: 125px;
        display: flex;
        justify-content: center;
      }

      .gauge-svg {
        width: 100%;
        height: 100%;
      }

      .gauge-active-fill {
        transition: stroke-dashoffset 800ms var(--ac-ease-standard);
      }

      .gauge-overlay-text {
        position: absolute;
        bottom: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .gauge-score-num {
        font-size: 38px;
        font-weight: 800;
        line-height: 1;
        color: var(--ac-color-text-strong);
      }

      .gauge-unit {
        font-size: 20px;
        font-weight: 700;
        color: var(--scr-text-muted);
      }

      .gauge-status-tag {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 2px;
      }

      .gauge-status-tag.low {
        color: var(--scr-low);
      }

      .gauge-status-tag.moderate {
        color: var(--scr-moderate);
      }

      .gauge-status-tag.high {
        color: var(--scr-high);
      }

      .spectrum-tiers {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-top: 10px;
        flex-wrap: wrap;
      }

      .tier-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--scr-text-muted);
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid transparent;
        transition: all var(--ac-motion-fast);
      }

      .tier-pill.active-tier {
        background: var(--ac-color-surface);
        border-color: var(--ac-color-border);
        color: var(--ac-color-text-strong);
        font-weight: 700;
        box-shadow: var(--ac-shadow-xs);
      }

      .tier-dot {
        width: 8px;
        height: 8px;
        border-radius: var(--ac-radius-pill);
      }

      .low-dot {
        background: var(--scr-low);
      }

      .moderate-dot {
        background: var(--scr-moderate);
      }

      .high-dot {
        background: var(--scr-high);
      }

      /* Prominent Clinical Action Toolbar */
      .prominent-action-toolbar {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .toolbar-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 18px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-xs);
        text-decoration: none;
        color: var(--ac-color-text-strong);
        cursor: pointer;
        transition:
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
        text-align: left;
      }

      .toolbar-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-hover);
        border-color: var(--ac-color-action);
      }

      .toolbar-card.primary-card {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-border-info);
      }

      .toolbar-icon {
        font-size: 24px;
        line-height: 1;
        flex: 0 0 auto;
      }

      .toolbar-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .toolbar-details strong {
        font-size: 14px;
        color: var(--ac-color-text-strong);
      }

      .action-title-primary {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .title-km {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        line-height: 1.35;
      }

      .title-en-sub {
        font-size: 12px;
        font-weight: 600;
        color: var(--scr-text-muted);
      }

      .action-desc {
        font-size: 12px;
        color: var(--scr-text-muted);
        line-height: 1.4;
      }

      .toolbar-details span,
      .toolbar-details small {
        font-size: 12px;
        color: var(--scr-text-muted);
      }

      .btn-summary-report {
        font-family: inherit;
        border: 1px solid var(--ac-color-border);
      }

      .trend {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .trend-arrow {
        font-size: 15px;
      }

      .trend.up {
        color: var(--scr-high);
      }

      .trend.down {
        color: var(--scr-low);
      }

      .trend.flat {
        color: var(--scr-text-muted);
      }

      .trend-note {
        margin: 0;
        color: var(--scr-text-muted);
        font-size: 13px;
        font-style: italic;
      }

      .heuristic-note {
        margin: -6px 4px 0;
        color: var(--scr-text-muted);
        font-size: 12px;
        line-height: 1.5;
        text-align: center;
      }

      .prominent-disclaimer-callout {
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        padding: 18px 22px;
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin: 6px 0 12px;
      }

      .disclaimer-icon-wrap {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }

      .disclaimer-shield {
        font-size: 18px;
        line-height: 1;
      }

      .disclaimer-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .disclaimer-heading {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
      }

      .disclaimer-text {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
        font-weight: 600;
      }

      .prominent-disclaimer-callout .heuristic-note {
        margin: 4px 0 0;
        text-align: left;
        color: var(--ac-color-text-muted);
        font-size: 12px;
        line-height: 1.5;
      }

      .disclaimer-khmer-highlight {
        padding: 8px 12px;
        background: var(--ac-color-surface);
        border-radius: var(--ac-radius-sm);
        border-left: 3px solid var(--ac-color-action);
      }

      .section-label {
        margin: 0 0 12px;
        color: var(--ac-color-text-strong);
        font-size: 18px;
        font-weight: 700;
      }

      /* Category breakdown */
      .cat-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .cat-card {
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--ac-radius-lg);
        box-shadow: var(--ac-shadow-xs);
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .cat-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .cat-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .domain-icon {
        font-size: 18px;
      }

      .cat-name {
        color: var(--scr-text);
        font-weight: 700;
        font-size: 16px;
      }

      .cat-name-km {
        font-size: 15px;
        font-weight: 700;
        color: var(--scr-text);
      }

      .cat-name-en {
        font-size: 13px;
        font-weight: 600;
        color: var(--scr-text-muted);
      }

      .cat-level {
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
      }

      .cat-level.low {
        color: var(--scr-low);
        background: var(--ac-color-tint-green-soft);
      }

      .cat-level.moderate {
        color: var(--scr-moderate);
        background: var(--ac-color-tint-amber-wash);
      }

      .cat-level.high {
        color: var(--scr-high);
        background: var(--ac-color-alert-surface);
      }

      .bar-track {
        height: 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--scr-banner-bg);
        overflow: hidden;
      }

      .bar-fill {
        display: block;
        height: 100%;
        border-radius: var(--ac-radius-pill);
        transition: width 400ms var(--ac-ease-standard);
      }

      .bar-fill.low {
        background: var(--scr-low);
      }

      .bar-fill.moderate {
        background: var(--scr-moderate);
      }

      .bar-fill.high {
        background: var(--scr-high);
      }

      .domain-clinical-explanation {
        margin: 2px 0 0;
        font-size: 12px;
        line-height: 1.5;
        color: var(--scr-text-muted);
      }

      /* What we noticed */
      .obs-list {
        margin: 0;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--scr-text);
        font-size: 15px;
        line-height: 1.5;
      }

      /* Next steps */
      .next-lead {
        margin: 0 0 14px;
        color: var(--scr-text);
        font-size: 15px;
        line-height: 1.5;
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .action {
        text-decoration: none;
        color: inherit;
        display: block;
      }

      .action-icon {
        display: flex;
        width: 44px;
        height: 44px;
        border-radius: var(--ac-radius-pill);
        background: var(--scr-banner-bg);
        color: var(--scr-teal);
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }

      .action-icon svg {
        width: 22px;
        height: 22px;
      }

      .action-title {
        display: block;
        color: var(--scr-text);
        font-weight: 700;
        font-size: 16px;
      }

      .action-subtitle {
        display: block;
        margin-top: 4px;
        color: var(--scr-text-muted);
        font-size: 13px;
      }

      .link {
        border: 0;
        background: none;
        color: var(--scr-teal);
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }

      .result-actions-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
      }

      .btn-lang-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 160ms ease;
      }

      .btn-lang-toggle:hover {
        background: var(--ac-color-surface-hover);
        border-color: var(--ac-color-action);
      }

      .btn-print {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--scr-teal);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 160ms ease;
      }

      .btn-print:hover {
        background: var(--ac-color-surface-hover);
        border-color: var(--scr-teal);
      }

      .print-icon {
        width: 18px;
        height: 18px;
      }

      .print-only-header,
      .print-only-footer {
        display: none;
      }

      @media (max-width: 640px) {
        .prominent-action-toolbar {
          grid-template-columns: 1fr;
        }

        .header-top {
          flex-direction: column;
        }
      }

      @media print {
        :host {
          color: black;
          background: white;
        }
        .no-print,
        .link,
        .next-steps,
        .prominent-action-toolbar {
          display: none !important;
        }
        .print-only-header {
          display: block;
          margin-bottom: 20px;
          border-bottom: 2px solid var(--ac-color-tint-steel);
          padding-bottom: 12px;
        }
        .print-title {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 6px;
          color: black;
        }
        .print-meta {
          font-size: 13px;
          color: var(--ac-color-text-slate);
          margin: 0;
        }
        .print-only-footer {
          display: block;
          margin-top: 28px;
          padding-top: 12px;
          border-top: 1px solid var(--ac-color-tint-steel);
          font-size: 12px;
          color: var(--ac-color-text-slate);
        }
        .result {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .header-card,
        .cat-card,
        .breakdown,
        .noticed {
          page-break-inside: avoid;
          break-inside: avoid;
          box-shadow: none !important;
          border: 1px solid var(--ac-color-tint-steel) !important;
        }
        .bar-track {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .bar-fill {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningResultPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ScreeningApi);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly i18n = inject(I18nService);

  readonly currentLang = this.i18n.currentLang;
  readonly isKm = computed(() => this.currentLang() === 'km');

  private sessionId = '';

  readonly session = signal<ScreeningSessionResultResponse | null>(null);
  readonly child = signal<ChildResponse | null>(null);
  readonly loading = signal(true);
  readonly fatalError = signal<string | null>(null);

  readonly result = computed(() => this.session()?.result ?? null);
  readonly childName = computed(() => this.child()?.firstName ?? null);
  readonly childAge = computed(() => {
    const child = this.child();
    return child ? formatAge(child.dateOfBirth) : '';
  });
  readonly maxScore = computed(() => (this.session()?.answers.length ?? 0) * MAX_ANSWER_VALUE);
  readonly overallTone = computed<BadgeTone>(() => {
    const res = this.result();
    return res ? riskTones[res.riskLevel] : 'neutral';
  });
  readonly overallLabel = computed(() => {
    const res = this.result();
    return res ? riskLabels[res.riskLevel] : '';
  });
  readonly completedDate = computed(() => {
    const session = this.session();
    if (!session) return '';
    const iso = session.submittedAt ?? session.result?.analyzedAt ?? session.createdAt;
    return new Date(iso).toLocaleDateString();
  });
  readonly nextSteps = computed(() => {
    const res = this.result();
    const config = nextStepsByRisk[res ? res.riskLevel : 'LOW'];
    const currentChild = this.child();
    return {
      lead: config.lead,
      cards: config.cards.map((card) => ({
        ...card,
        queryParams:
          currentChild && (card.path === '/activities' || card.path === '/appointments')
            ? { childId: currentChild.id }
            : null,
      })),
    };
  });
  readonly observations = computed(() => {
    const session = this.session();
    const res = this.result();
    if (!session || !res) return [];
    return res.categoryBreakdown
      .filter((cat) => cat.riskLevel === 'MODERATE' || cat.riskLevel === 'HIGH')
      .map((cat) => ({
        category: cat.category,
        sentence: observationFor(session.ageBand, cat.category, cat.riskLevel),
      }))
      .filter((entry): entry is { category: string; sentence: string } => entry.sentence !== null);
  });
  readonly trend = computed(() => {
    const comparison = this.session()?.previousComparison;
    if (!comparison) return null;
    if (!comparison.comparable) return { comparable: false as const };
    const delta = comparison.delta ?? 0;
    const previousDate = comparison.previousCompletedAt
      ? new Date(comparison.previousCompletedAt).toLocaleDateString()
      : '';
    const magnitude = Math.abs(delta);
    const text =
      delta === 0
        ? `No change from your last screening (${previousDate})`
        : `${magnitude}% ${delta > 0 ? 'higher' : 'lower'} than your last screening (${previousDate})`;
    return {
      comparable: true as const,
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
      arrow: delta > 0 ? '▲' : delta < 0 ? '▼' : '■',
      text,
    };
  });

  readonly concernLabel = computed(() => {
    const res = this.result();
    return res ? concernLabels[res.riskLevel] : '';
  });
  readonly summaryTitle = computed(() => {
    const res = this.result();
    if (!res) return '';
    if (res.riskLevel === 'LOW') return 'Reassuring Milestone Trajectory';
    if (res.riskLevel === 'MODERATE') return 'Mild Developmental Nuances Observed';
    return 'Specialized Developmental Attention Recommended';
  });
  readonly reassuringExplanation = computed(() => {
    const res = this.result();
    if (!res) return '';
    if (res.riskLevel === 'LOW') {
      return "Your child's responses indicate consistent milestone progression across the assessed domains. Continued sensory exploration, responsive interaction, and positive play routines are recommended.";
    }
    if (res.riskLevel === 'MODERATE') {
      return "A few developmental responses suggest subtle variations that may benefit from gentle observation and support. Discussing these patterns at your child's next pediatric checkup can offer comforting reassurance and tailored play ideas.";
    }
    return "Several responses suggest developmental patterns that warrant a thorough evaluation with a developmental pediatrician or specialist. Early collaborative guidance provides the most supportive continuum for your child's growth.";
  });

  shortLabel(riskLevel: RiskLevel): string {
    return riskShort[riskLevel];
  }

  meterColor(riskLevel: RiskLevel): string {
    if (riskLevel === 'LOW') return 'var(--scr-low)';
    if (riskLevel === 'MODERATE') return 'var(--scr-moderate)';
    return 'var(--scr-high)';
  }

  categoryIcon(category?: string | null): string {
    if (!category) return '🧩';
    const lower = category.toLowerCase();
    if (lower.includes('communicat') || lower.includes('speech')) return '💬';
    if (lower.includes('social') || lower.includes('interact')) return '🤝';
    if (lower.includes('sensor') || lower.includes('sound') || lower.includes('touch')) return '🎨';
    if (
      lower.includes('routine') ||
      lower.includes('repetit') ||
      lower.includes('behavior') ||
      lower.includes('play')
    ) {
      return '🔄';
    }
    if (lower.includes('motor') || lower.includes('physic')) return '🏃';
    return '🧩';
  }

  domainExplanation(category: string): string {
    const lower = category.toLowerCase();
    if (lower.includes('social communication')) {
      return 'Observes shared engagement, verbal and non-verbal reciprocity, eye contact, and interactive communication.';
    }
    if (lower.includes('communicat') || lower.includes('speech')) {
      return 'Observes vocalization, word usage, gesture communication, and receptive language understanding.';
    }
    if (lower.includes('social') || lower.includes('interact')) {
      return 'Observes eye contact, shared attention, spontaneous smiling, and interactive reciprocity with caregivers.';
    }
    if (lower.includes('sensor') || lower.includes('sound') || lower.includes('touch')) {
      return 'Monitors tactile textures, acoustic sound sensitivities, and environmental sensory integration.';
    }
    if (
      lower.includes('routine') ||
      lower.includes('repetit') ||
      lower.includes('behavior') ||
      lower.includes('play')
    ) {
      return 'Evaluates comfort with daily schedules, transitions, predictability, and repetitive play patterns.';
    }
    if (lower.includes('motor') || lower.includes('physic')) {
      return 'Assesses coordination, fine and gross motor integration, physical imitation, and movement patterns.';
    }
    return 'Tracks foundational developmental milestones and age-normed behavioral patterns.';
  }

  toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  formatDomainKm(category: string): string {
    const lower = category.toLowerCase();
    if (lower.includes('social') && lower.includes('communicat')) {
      return 'ទំនាក់ទំនងសង្គម និងការប្រាស្រ័យទាក់ទង';
    }
    if (lower.includes('social') || lower.includes('interact')) {
      return 'ទំនាក់ទំនងសង្គម';
    }
    if (lower.includes('sensor') || lower.includes('sound') || lower.includes('touch')) {
      return 'ការឆ្លើយតបញាណដឹង';
    }
    if (lower.includes('communicat') || lower.includes('speech')) {
      return 'ការប្រាស្រ័យទាក់ទង';
    }
    if (
      lower.includes('routine') ||
      lower.includes('flexib') ||
      lower.includes('repetit') ||
      lower.includes('behavior') ||
      lower.includes('play')
    ) {
      return 'ទម្លាប់ប្រចាំថ្ងៃ';
    }
    if (lower.includes('motor') || lower.includes('physic')) {
      return 'ចលនាសាច់ដុំ';
    }
    return 'ការលូតលាស់';
  }

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    if (!this.sessionId) {
      this.loading.set(false);
      this.fatalError.set('This screening result could not be found.');
      return;
    }

    this.api.getSession(this.sessionId).subscribe({
      next: (session) => {
        if (!session.result) {
          this.router.navigate(['/screening/session', this.sessionId], { replaceUrl: true });
          return;
        }
        this.session.set(session);
        this.loading.set(false);
        this.childrenApi.getChild(session.childId).subscribe({
          next: (child) => this.child.set(child),
          error: () => this.child.set(null),
        });
      },
      error: () => {
        this.loading.set(false);
        this.fatalError.set('This screening result could not be loaded.');
      },
    });
  }

  goToScreeningHome() {
    this.router.navigate(['/screening']);
  }

  printResult(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
