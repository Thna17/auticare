import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChildResponse, RiskLevel, ScreeningSessionResultResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from './data-access/screening.api';
import { ScreeningBadgeComponent } from './components/screening-badge.component';
import type { BadgeTone } from './components/screening-badge.component';
import { ScreeningInfoBannerComponent } from './components/screening-info-banner.component';
import { observationFor } from './screening-observations';

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
const riskShort: Record<RiskLevel, string> = { LOW: 'Low', MODERATE: 'Moderate', HIGH: 'High' };

type ActionCard = {
  readonly title: string;
  readonly subtitle: string;
  readonly path: string;
  readonly icon: 'calendar' | 'hospital' | 'activities';
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
  imports: [RouterLink, UiCardComponent, ScreeningBadgeComponent, ScreeningInfoBannerComponent],
  template: `
    <section class="result">
      @if (loading()) {
        <p class="status">Loading…</p>
      } @else if (fatalError()) {
        <div class="fatal">
          <p class="status error" role="alert">{{ fatalError() }}</p>
          <button type="button" class="link" (click)="goToScreeningHome()">
            Back to Screening
          </button>
        </div>
      } @else if (result(); as res) {
        <!-- 1. HEADER CARD -->
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
            <ac-screening-badge [tone]="overallTone()">{{ overallLabel() }}</ac-screening-badge>
          </div>

          <div class="score-block">
            @if (res.riskPercentage !== null) {
              <span class="score">{{ res.riskPercentage }}<span class="score-unit">%</span></span>
            } @else {
              <span class="score"
                >{{ res.score }}<span class="score-unit">/{{ maxScore() }}</span></span
              >
            }
            <span class="score-caption">overall indicator</span>
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

        <!-- 2. DISCLAIMER -->
        <ac-screening-info-banner>{{ res.disclaimer }}</ac-screening-info-banner>
        <!-- Heuristic + age-band disclosure (not clinically validated). -->
        <p class="heuristic-note">
          These questions and risk bands are original and heuristic — a supportive indicator, not a
          clinically validated screening instrument. The age-band split (toddler vs. preschool
          question sets) follows general screening-tool conventions but has not been clinically
          validated for this app specifically.
        </p>

        <!-- 3. BREAKDOWN BY CATEGORY -->
        @if (res.categoryBreakdown.length) {
          <section class="breakdown" aria-label="Breakdown by category">
            <p class="section-label">Breakdown by category</p>
            <div class="cat-list">
              @for (cat of res.categoryBreakdown; track cat.category) {
                <article class="cat-card">
                  <div class="cat-head">
                    <span class="cat-name">{{ cat.category }}</span>
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
                </article>
              }
            </div>
          </section>
        }

        <!-- 4. WHAT WE NOTICED -->
        @if (observations().length) {
          <section class="noticed" aria-label="What we noticed">
            <p class="section-label">What we noticed</p>
            <ul class="obs-list">
              @for (obs of observations(); track obs.category) {
                <li>{{ obs.sentence }}</li>
              }
            </ul>
          </section>
        }

        <!-- 5. RECOMMENDED NEXT STEPS -->
        <section class="next-steps" aria-label="Recommended next steps">
          <p class="section-label">Recommended next steps</p>
          <p class="next-lead">{{ nextSteps().lead }}</p>
          <div class="cards">
            @for (card of nextSteps().cards; track card.path) {
              <a class="action" [routerLink]="card.path">
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

        <button type="button" class="link center" (click)="goToScreeningHome()">
          Back to Screening
        </button>
      }
    </section>
  `,
  styles: [
    `
      /* Named constants mirroring the shell's hardcoded hex/px (no token system). */
      :host {
        --scr-teal: #3d6375;
        --scr-teal-ink: #103443;
        --scr-text: #263238;
        --scr-text-muted: #66747a;
        --scr-surface: #ffffff;
        --scr-banner-bg: #e8f6ff;
        --scr-banner-border: #d4e6ef;
        --scr-avatar-bg: #8db4c8;
        --scr-divider: #c1d3dc;
        --scr-radius: 12px;
        --scr-shadow-card: 0 12px 30px rgb(41 74 90 / 0.08);
        --scr-error: #a23434;
        --scr-low: #72a675;
        --scr-moderate: #d9a441;
        --scr-high: #c96e62;
        display: block;
      }

      .result {
        max-width: 720px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }
      .status {
        text-align: center;
        color: var(--scr-text-muted);
        font-weight: 600;
      }
      .status.error {
        color: var(--scr-error);
      }
      .fatal {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
      }

      /* Header card */
      .header-card {
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--scr-radius);
        box-shadow: var(--scr-shadow-card);
        padding: 26px 28px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .header-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .child-name {
        margin: 0;
        color: var(--scr-teal);
        font-size: 24px;
        font-weight: 800;
      }
      .child-meta {
        margin: 4px 0 0;
        color: var(--scr-text-muted);
        font-size: 14px;
        font-weight: 600;
      }
      .score-block {
        display: flex;
        align-items: baseline;
        gap: 12px;
      }
      .score {
        color: var(--scr-teal);
        font-size: 52px;
        font-weight: 800;
        line-height: 1;
      }
      .score-unit {
        font-size: 26px;
        color: var(--scr-text-muted);
        font-weight: 700;
      }
      .score-caption {
        color: var(--scr-text-muted);
        font-size: 13px;
        font-weight: 600;
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
      .section-label {
        margin: 0 0 12px;
        color: var(--scr-text-muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      /* Category breakdown */
      .cat-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .cat-card {
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--scr-radius);
        box-shadow: var(--scr-shadow-card);
        padding: 16px 18px;
      }
      .cat-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .cat-name {
        color: var(--scr-text);
        font-weight: 700;
        font-size: 15px;
      }
      .cat-level {
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .cat-level.low {
        color: var(--scr-low);
      }
      .cat-level.moderate {
        color: var(--scr-moderate);
      }
      .cat-level.high {
        color: var(--scr-high);
      }
      .bar-track {
        height: 10px;
        border-radius: 999px;
        background: var(--scr-banner-bg);
        overflow: hidden;
      }
      .bar-fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        transition: width 240ms ease;
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
        border-radius: 999px;
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
      .link.center {
        align-self: center;
      }

      @media (max-width: 560px) {
        .header-top {
          flex-direction: column;
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
    return nextStepsByRisk[res ? res.riskLevel : 'LOW'];
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

  shortLabel(riskLevel: RiskLevel): string {
    return riskShort[riskLevel];
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
        // No result yet means the questionnaire isn't finished — send them to finish it.
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
}
