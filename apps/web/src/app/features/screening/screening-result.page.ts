import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChildResponse, ScreeningSessionResultResponse } from '@auticare/contracts';
import { ChildrenApi } from '../children/data-access/children.api';
import { I18nService } from '../../core/i18n/i18n.service';
import { ScreeningApi } from './data-access/screening.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

export type ResponseScoreBand = 'none' | 'low' | 'medium' | 'elevated';

/** Bands describe only this questionnaire's response score, never clinical risk. */
export function responseScoreBand(score: number): ResponseScoreBand {
  if (score === 0) return 'none';
  if (score <= 30) return 'low';
  if (score <= 66) return 'medium';
  return 'elevated';
}

const formatAge = (dateOfBirth: string, isKm = false): string => {
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  let months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + now.getUTCMonth() - birth.getUTCMonth();
  if (now.getUTCDate() < birth.getUTCDate()) months -= 1;
  months = Math.max(months, 0);
  const years = Math.floor(months / 12);
  if (years < 1) return isKm ? `${months} ខែ` : `${months} month${months === 1 ? '' : 's'} old`;
  return isKm ? `${years} ឆ្នាំ` : `${years} year${years === 1 ? '' : 's'} old`;
};

@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent, UiSpinnerComponent],
  template: `
    <section class="result-page">
      @if (loading()) {
        <div class="state"><ac-ui-spinner label="Loading result…" /></div>
      } @else if (fatalError()) {
        <div class="state error">
          <ac-ui-message tone="error">{{ fatalError() }}</ac-ui-message
          ><button class="button secondary" type="button" (click)="goToScreeningHome()">
            {{ isKm() ? 'ត្រឡប់ទៅការវាយតម្លៃ' : 'Back to questionnaires' }}
          </button>
        </div>
      } @else if (session(); as current) {
        @if (current.result) {
          <header class="topbar">
            <a routerLink="/screening" class="back-link">{{
              isKm() ? '← ការវាយតម្លៃ' : '← Questionnaires'
            }}</a>
            <button class="language" type="button" (click)="toggleLanguage()">
              {{ isKm() ? 'English' : 'ខ្មែរ' }}
            </button>
          </header>
          <main class="dashboard">
            <section class="score-card" aria-labelledby="result-title">
              <div class="identity">
                <div>
                  <p class="eyebrow">
                    {{ isKm() ? 'សេចក្តីសង្ខេបការឆ្លើយតប' : 'QUESTIONNAIRE RESPONSE SUMMARY' }}
                  </p>
                  <h1 id="result-title">{{ isKm() ? 'លទ្ធផលរបស់អ្នក' : 'Your results' }}</h1>
                  <p class="meta">
                    {{ childName() || (isKm() ? 'កូនរបស់អ្នក' : 'Your child') }}
                    @if (childAge()) {
                      · {{ childAge() }}
                    }
                    · {{ completedDate() }}
                  </p>
                </div>
              </div>
              @if (responseScore() !== null) {
                <div class="score-layout">
                  <div
                    class="gauge"
                    role="img"
                    [attr.aria-label]="
                      (isKm() ? 'ពិន្ទុចម្លើយសំណួរ ' : 'Questionnaire response score ') +
                      responseScore() +
                      '%'
                    "
                  >
                    <svg viewBox="0 0 220 130" aria-hidden="true">
                      <path class="gauge-track" d="M 24 112 A 86 86 0 0 1 196 112" />
                      <path
                        class="gauge-value"
                        d="M 24 112 A 86 86 0 0 1 196 112"
                        [attr.stroke-dasharray]="270"
                        [attr.stroke-dashoffset]="270 - (270 * responseScore()!) / 100"
                      />
                    </svg>
                    <div class="gauge-copy">
                      <strong>{{ responseScore() }}<span>%</span></strong
                      ><span>{{ scoreBandLabel() }}</span>
                    </div>
                  </div>
                  <div class="score-copy">
                    <h2>{{ scoreBandLabel() }}</h2>
                    <p>{{ scoreSentence() }}</p>
                    <p class="band-caption">
                      {{
                        isKm()
                          ? 'ជាក្រុមពិន្ទុចម្លើយសំណួរប៉ុណ្ណោះ មិនមែនជាក្រុមហានិភ័យគ្លីនិកទេ។'
                          : 'Questionnaire response-score bands only · not clinical categories.'
                      }}
                    </p>
                    <p class="band-legend">
                      {{
                        isKm()
                          ? '០%៖ គ្មានកង្វល់តាមចម្លើយ · ទាប ១–៣០% · មធ្យម ៣១–៦៦% · កើនឡើង ៦៧–១០០%'
                          : '0%: No concerns indicated by scored responses · Low 1–30% · Medium 31–66% · Elevated 67–100%'
                      }}
                    </p>
                  </div>
                </div>
              } @else {
                <div class="no-score">
                  <h2>
                    {{ isKm() ? 'មិនមានពិន្ទុសម្រាប់បង្ហាញទេ' : 'A response score is unavailable' }}
                  </h2>
                  <p>
                    {{
                      isKm()
                        ? 'មិនមានចម្លើយដែលអាចដាក់ពិន្ទុបានក្នុងសម័យនេះទេ។ ចម្លើយដែលខកខានមិនត្រូវបានរាប់ជាការព្រួយបារម្ភឡើយ។'
                        : 'There are no scored responses in this session. Missing answers are not counted as concerns.'
                    }}
                  </p>
                </div>
              }
              <p class="answer-count">
                {{
                  isKm()
                    ? 'ចម្លើយដែលបានដាក់ពិន្ទុ៖ ' + current.answers.length
                    : 'Scored responses: ' + current.answers.length
                }}
              </p>
            </section>
            <section class="next-card" aria-label="Parent recommendation">
              <span class="recommendation-icon" aria-hidden="true">♡</span>
              <p>
                {{
                  isKm()
                    ? 'ប្រសិនបើអ្នកមានកង្វល់ សូមចែករំលែកឧទាហរណ៍ដែលអ្នកបានសង្កេតជាមួយគ្រូពេទ្យកុមារ ឬអ្នកជំនាញការលូតលាស់។'
                    : "If you have concerns, discuss your observations with your child's pediatrician or a qualified developmental professional."
                }}
              </p>
            </section>
            <nav class="actions" aria-label="Result actions">
              <button type="button" class="button primary" (click)="printResult()">
                {{ isKm() ? 'ទាញយក PDF' : 'Download PDF' }}
              </button>
              <button type="button" class="button secondary" (click)="retake()">
                {{ isKm() ? 'ធ្វើសំណួរម្តងទៀត' : 'Retake Questionnaire' }}
              </button>
              <a class="button secondary" routerLink="/find-support">{{
                isKm() ? 'ស្វែងរកជំនួយ' : 'Find Support'
              }}</a>
            </nav>
            <aside class="disclaimer" role="note">
              <strong>{{ isKm() ? 'ចំណាំ' : 'Please note' }}</strong
              ><span>{{
                isKm()
                  ? 'សំណួរនេះមិនមែនជាឧបករណ៍ពិនិត្យដែលបានផ្ទៀងផ្ទាត់ទេ។ លទ្ធផលមិនមែនជារោគវិនិច្ឆ័យ ប្រូបាប៊ីលីតេ ឬកម្រិតធ្ងន់ធ្ងរនៃអូទីស្សឹមទេ។'
                  : 'This questionnaire is not a validated autism screening tool. Its response score is not an autism diagnosis, probability, or severity level. The score bands are illustrative only and are not clinically validated.'
              }}</span>
            </aside>
            <details class="method">
              <summary>
                {{ isKm() ? 'របៀបគណនាពិន្ទុ' : 'How this response score is calculated' }}
              </summary>
              <p>
                {{
                  isKm()
                    ? 'ពិន្ទុគឺជាចំនួនពិន្ទុដែលបានកែតម្រូវតាមទិសសំណួរ ចែកនឹងពិន្ទុអតិបរមាសម្រាប់ចម្លើយដែលបានដាក់ពិន្ទុ ហើយគុណនឹង ១០០ បង្គត់ទៅចំនួនគត់។ ពិន្ទុមិនមានការបកស្រាយផ្នែកវេជ្ជសាស្ត្រទេ។'
                    : 'The displayed percentage follows the deterministic questionnaire formula: sum polarity-adjusted response points, divide by the maximum points for scored responses (4 per response), multiply by 100, and round to a whole number. It describes this questionnaire’s response pattern only.'
                }}
              </p>
              <p>
                {{
                  isKm()
                    ? 'សំណួរទាំងអស់ត្រូវឆ្លើយមុនបញ្ជូន ហើយទម្រង់នេះមិនមានជម្រើស “មិនប្រាកដ” ទេ។ ចម្លើយដែលខកខានក្នុងទិន្នន័យចាស់មិនត្រូវបានបកស្រាយជាកង្វល់ទេ។'
                    : 'This questionnaire requires answers before submission and does not offer a “Not sure” option. If a legacy session has no scored answers, no percentage is shown; unanswered items are not treated as concerns.'
                }}
              </p>
            </details>
          </main>
        }
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        --teal: var(--ac-color-action);
        --ink: var(--ac-color-text-strong);
        --muted: var(--ac-color-text-muted);
        --line: var(--ac-color-border-slate);
        --surface: var(--ac-color-surface);
      }
      .result-page {
        max-width: 960px;
        margin: 0 auto;
        padding: clamp(16px, 3vw, 32px);
        color: var(--ink);
      }
      .state {
        min-height: 40vh;
        display: grid;
        place-items: center;
        text-align: center;
        gap: 16px;
      }
      .error {
        align-content: center;
      }
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
      }
      .back-link,
      .language {
        color: var(--ac-color-action-deep);
        font: inherit;
        font-weight: 650;
        text-decoration: none;
        background: none;
        border: 0;
        cursor: pointer;
      }
      .dashboard {
        display: grid;
        gap: 14px;
      }
      .score-card,
      .next-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: var(--ac-shadow-sm);
      }
      .score-card {
        padding: clamp(20px, 4vw, 36px);
      }
      .eyebrow {
        margin: 0 0 6px;
        color: var(--ac-color-action-deep);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.1em;
      }
      h1 {
        margin: 0;
        font-size: clamp(28px, 4vw, 38px);
        line-height: 1.12;
      }
      .meta {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
      }
      .score-layout {
        display: grid;
        grid-template-columns: minmax(210px, 300px) 1fr;
        gap: clamp(16px, 4vw, 46px);
        align-items: center;
        margin: 24px auto 8px;
        max-width: 720px;
      }
      .gauge {
        position: relative;
        width: min(100%, 300px);
        justify-self: center;
      }
      .gauge svg {
        width: 100%;
        display: block;
        overflow: visible;
      }
      .gauge-track,
      .gauge-value {
        fill: none;
        stroke-width: 17;
        stroke-linecap: round;
      }
      .gauge-track {
        stroke: var(--ac-color-surface-info);
      }
      .gauge-value {
        stroke: var(--teal);
        transition: stroke-dashoffset 0.5s ease;
      }
      .gauge-copy {
        position: absolute;
        inset: 27% 0 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .gauge-copy strong {
        font-size: clamp(36px, 6vw, 52px);
        line-height: 1;
        color: var(--ac-color-action-deep);
      }
      .gauge-copy strong span {
        font-size: 0.55em;
      }
      .gauge-copy > span {
        margin-top: 8px;
        font-weight: 750;
        color: var(--ac-color-action-deep);
      }
      .score-copy h2,
      .no-score h2 {
        margin: 0 0 8px;
        font-size: clamp(22px, 3vw, 28px);
      }
      .score-copy p,
      .no-score p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }
      .score-copy .band-caption {
        margin-top: 12px;
        font-size: 13px;
      }
      .score-copy .band-legend {
        margin-top: 8px;
        font-size: 12px;
      }
      .no-score {
        max-width: 680px;
        margin: 28px auto 20px;
        padding: 20px;
        background: var(--ac-color-surface-info);
        border-radius: 14px;
      }
      .answer-count {
        border-top: 1px solid var(--line);
        margin: 10px 0 0;
        padding-top: 12px;
        color: var(--muted);
        font-size: 13px;
        text-align: center;
      }
      .next-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        background: var(--ac-color-surface-info);
      }
      .recommendation-icon {
        color: var(--teal);
        font-size: 28px;
      }
      .next-card p {
        margin: 0;
        line-height: 1.5;
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .button {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        min-height: 44px;
        border-radius: 999px;
        padding: 10px 18px;
        border: 1px solid transparent;
        font: inherit;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
      }
      .primary {
        background: var(--teal);
        color: var(--ac-color-text-on-action);
      }
      .secondary {
        color: var(--ac-color-action-deep);
        border-color: var(--line);
        background: var(--surface);
      }
      .button:focus-visible,
      .back-link:focus-visible,
      .language:focus-visible,
      summary:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 3px;
      }
      .disclaimer {
        display: flex;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 12px;
        color: var(--muted);
        background: var(--ac-color-surface-slate);
        font-size: 13px;
        line-height: 1.5;
      }
      .disclaimer strong {
        color: var(--ink);
        white-space: nowrap;
      }
      .method {
        color: var(--muted);
        font-size: 13px;
      }
      .method summary {
        color: var(--ac-color-action-deep);
        cursor: pointer;
        font-weight: 650;
      }
      .method p {
        max-width: 760px;
        line-height: 1.55;
      }
      @media (max-width: 620px) {
        .result-page {
          padding: 14px;
        }
        .score-layout {
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 12px;
        }
        .gauge {
          width: min(75vw, 260px);
        }
        .score-copy {
          text-align: center;
        }
        .actions .button {
          flex: 1 1 100%;
        }
      }
      @media print {
        .result-page {
          max-width: none;
          padding: 0;
        }
        .topbar,
        .actions,
        .method {
          display: none !important;
        }
        .score-card,
        .next-card {
          box-shadow: none;
          break-inside: avoid;
        }
        .dashboard {
          gap: 10px;
        }
        .disclaimer {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
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
  readonly childName = computed(() => this.child()?.firstName ?? null);
  readonly childAge = computed(() => {
    const child = this.child();
    return child ? formatAge(child.dateOfBirth, this.isKm()) : '';
  });
  readonly responseScore = computed(() => {
    const session = this.session();
    const percentage = session?.result?.riskPercentage;
    return session && session.answers.length > 0 && percentage !== null && percentage !== undefined
      ? Math.max(0, Math.min(100, Math.round(percentage)))
      : null;
  });
  readonly scoreBandLabel = computed(() => {
    const score = this.responseScore();
    if (score === null) return '';
    const band = responseScoreBand(score);
    if (this.isKm())
      return (
        {
          none: 'គ្មានកង្វល់តាមចម្លើយដែលបានដាក់ពិន្ទុ',
          low: 'ទាប',
          medium: 'មធ្យម',
          elevated: 'កើនឡើង',
        } as const
      )[band];
    return (
      {
        none: 'No concerns indicated by scored responses',
        low: 'Low',
        medium: 'Medium',
        elevated: 'Elevated',
      } as const
    )[band];
  });
  readonly scoreSentence = computed(() => {
    const score = this.responseScore();
    if (score === null) return '';
    if (this.isKm()) return `ពិន្ទុចម្លើយរបស់អ្នកគឺ ${score}% នៅក្នុងក្រុមពិន្ទុសំណួរបែបពិពណ៌នា។`;
    if (score === 0)
      return 'None of the scored responses contributed points to this questionnaire response score.';
    return `Your scored responses fall in the ${this.scoreBandLabel().toLowerCase()} questionnaire response-score band.`;
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
        if (!session.result) {
          this.router.navigate(['/screening/session', this.sessionId], { replaceUrl: true });
          return;
        }
        this.session.set(session);
        this.loading.set(false);
        this.childrenApi
          .getChild(session.childId)
          .subscribe({ next: (child) => this.child.set(child), error: () => this.child.set(null) });
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
  retake() {
    const childId = this.session()?.childId;
    this.router.navigate(['/screening/new'], { queryParams: childId ? { childId } : undefined });
  }
  toggleLanguage() {
    this.i18n.toggleLanguage();
  }
  printResult() {
    if (typeof window !== 'undefined') window.print();
  }
}
