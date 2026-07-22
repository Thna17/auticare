import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { RiskLevel, ScreeningSessionDetailResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from './data-access/screening.api';
import { ScreeningBadgeComponent } from './components/screening-badge.component';
import type { BadgeTone } from './components/screening-badge.component';
import { ScreeningInfoBannerComponent } from './components/screening-info-banner.component';

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

type ActionCard = {
  readonly title: string;
  readonly subtitle: string;
  readonly path: string;
  readonly icon: 'calendar' | 'hospital' | 'activities';
};

const nextStepCards: readonly ActionCard[] = [
  {
    title: 'Book an appointment',
    subtitle: 'Arrange a professional evaluation',
    path: '/appointments',
    icon: 'calendar',
  },
  {
    title: 'Browse hospitals',
    subtitle: 'Find nearby specialist clinics',
    path: '/hospitals',
    icon: 'hospital',
  },
  {
    title: 'View activities',
    subtitle: 'Supportive activities for your child',
    path: '/activities',
    icon: 'activities',
  },
];

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
        <header class="head">
          <p class="eyebrow">Screening result</p>
          <h1>Here's what we found</h1>
        </header>

        <article class="result-card">
          <div class="score-block">
            @if (res.riskPercentage !== null) {
              <span class="score">{{ res.riskPercentage }}<span class="score-max">%</span></span>
            } @else {
              <span class="score"
                >{{ res.score }}<span class="score-max">/{{ maxScore() }}</span></span
              >
            }
            <ac-screening-badge [tone]="tone()">{{ label() }}</ac-screening-badge>
          </div>
          <p class="recommendation">{{ res.recommendation }}</p>
          <p class="meta">Completed {{ completedDate() }} · {{ childName() ?? 'Your child' }}</p>
        </article>

        <ac-screening-info-banner>{{ res.disclaimer }}</ac-screening-info-banner>
        <!-- Original, heuristic instrument disclosure (not clinically validated). -->
        <p class="heuristic-note">
          These questions and risk bands are original and heuristic — a supportive indicator to help
          you decide whether to seek a professional evaluation, not a clinically validated screening
          instrument.
        </p>

        <section class="next-steps" aria-label="Next steps">
          <p class="section-label">Next steps</p>
          <div class="cards">
            @for (card of nextSteps; track card.path) {
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
      /* Named constants for this feature. Values mirror the app shell's existing
         hardcoded hex/px exactly (no token system). NOTE: duplicated across
         screening pages — candidate for extraction into a shared theme file. */
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
        --scr-shadow-btn: 0 10px 26px rgb(61 99 117 / 0.18);
        --scr-shadow-card: 0 12px 30px rgb(41 74 90 / 0.08);
        --scr-error: #a23434;
        display: block;
      }

      .result {
        max-width: 720px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
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

      .head {
        text-align: center;
      }
      .eyebrow {
        margin: 0 0 6px;
        color: var(--scr-text-muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .head h1 {
        margin: 0;
        color: var(--scr-teal);
        font-size: 30px;
        font-weight: 800;
      }

      .result-card {
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--scr-radius);
        box-shadow: var(--scr-shadow-card);
        padding: 28px;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 14px;
        align-items: center;
      }
      .score-block {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .score {
        color: var(--scr-teal);
        font-size: 44px;
        font-weight: 800;
        line-height: 1;
      }
      .score-max {
        color: var(--scr-text-muted);
        font-size: 24px;
        font-weight: 700;
      }
      .recommendation {
        margin: 0;
        color: var(--scr-text);
        font-size: 16px;
        line-height: 1.5;
        max-width: 520px;
      }
      .meta {
        margin: 0;
        color: var(--scr-text-muted);
        font-size: 13px;
        font-weight: 600;
      }

      .heuristic-note {
        margin: -8px 4px 0;
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

  readonly nextSteps = nextStepCards;
  readonly session = signal<ScreeningSessionDetailResponse | null>(null);
  readonly childName = signal<string | null>(null);
  readonly loading = signal(true);
  readonly fatalError = signal<string | null>(null);

  readonly result = computed(() => this.session()?.result ?? null);
  readonly maxScore = computed(() => (this.session()?.answers.length ?? 0) * MAX_ANSWER_VALUE);
  readonly tone = computed<BadgeTone>(() => {
    const res = this.result();
    return res ? riskTones[res.riskLevel] : 'neutral';
  });
  readonly label = computed(() => {
    const res = this.result();
    return res ? riskLabels[res.riskLevel] : '';
  });
  readonly completedDate = computed(() => {
    const session = this.session();
    if (!session) return '';
    const iso = session.submittedAt ?? session.result?.analyzedAt ?? session.createdAt;
    return new Date(iso).toLocaleDateString();
  });

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
          next: (child) => this.childName.set(child.firstName),
          error: () => this.childName.set(null),
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
