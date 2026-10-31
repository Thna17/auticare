import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChildResponse, ScreeningSessionDetailResponse } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from './data-access/screening.api';
import { ChildSelectCardComponent } from './components/child-select-card.component';
import { ScreeningInfoBannerComponent } from './components/screening-info-banner.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    ChildSelectCardComponent,
    ScreeningInfoBannerComponent,
    UiMessageComponent,
    UiSpinnerComponent,
  ],
  template: `
    <section class="intro">
      <header class="head">
        <div class="head-text">
          <h1>{{ isKm() ? 'ការវាយតម្លៃអូទីស្សឹម' : 'Autism Screening' }}</h1>
          <p class="subtitle">
            {{
              isKm()
                ? 'ការគាំទ្រព័ត៌មានដើម្បីជួយអ្នកយល់ដឹងពីការលូតលាស់របស់កូនអ្នក។'
                : "Informational support to help you understand your child's development."
            }}
          </p>
        </div>

        @if (!loading() && !error() && children().length > 0) {
          <div class="head-actions">
            <button type="button" class="btn-ghost link-history" (click)="viewHistory()">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5M12 7v5l3 2" />
              </svg>
              {{ isKm() ? 'ប្រវត្តិ' : 'History' }}
            </button>
            @if (draftSession(); as draft) {
              <button
                type="button"
                class="btn-ghost btn-continue"
                (click)="continueSession(draft)"
                [title]="
                  isKm()
                    ? 'ការវាយតម្លៃបានចាប់ផ្តើម ' + formatDate(draft.startedAt)
                    : 'Screening started ' + formatDate(draft.startedAt)
                "
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                {{ isKm() ? 'បន្ត' : 'Continue' }}
              </button>
            }
            <button
              type="button"
              class="btn-start"
              [disabled]="!selectedChildId()"
              (click)="startNew()"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 4v16l13-8Z" />
              </svg>
              {{ isKm() ? 'ចាប់ផ្តើមការវាយតម្លៃ' : 'Start screening' }}
            </button>
          </div>
        }
      </header>

      <ac-screening-info-banner>
        {{
          isKm()
            ? 'ឧបករណ៍វាយតម្លៃនេះគឺសម្រាប់គោលបំណងផ្តល់ព័ត៌មានប៉ុណ្ណោះ និងមិនបង្កើតជាការធ្វើរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រឡើយ។ សូមពិគ្រោះជាមួយអ្នកជំនាញថែទាំសុខភាពសម្រាប់ការវាយតម្លៃជាផ្លូវការ។'
            : 'This screening tool is for informational purposes and does not constitute a medical diagnosis. Please consult with a healthcare professional for a formal evaluation.'
        }}
      </ac-screening-info-banner>

      @if (loading()) {
        <ac-ui-spinner [label]="isKm() ? 'កំពុងផ្ទុកការវាយតម្លៃ…' : 'Loading screening…'" />
      } @else if (error()) {
        <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
      } @else if (children().length === 0) {
        <section class="screening-onboarding-card">
          <div class="onboarding-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="44"
              height="44"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h2>
            {{
              isKm()
                ? 'សូមស្វាគមន៍មកកាន់ការវាយតម្លៃការលូតលាស់'
                : 'Welcome to Developmental Screening'
            }}
          </h2>
          <p class="onboarding-copy">
            {{
              isKm()
                ? 'បន្ថែមព័ត៌មានកុមាររបស់អ្នក ដើម្បីចាប់ផ្តើមការវាយតម្លៃការលូតលាស់ផ្ទាល់ខ្លួន។'
                : "Add your child's profile to begin a personalized developmental screening."
            }}
          </p>
          <a class="btn-primary" routerLink="/children/new">
            {{ isKm() ? 'បន្ថែមព័ត៌មានកុមារ' : 'Add Child Profile' }}
          </a>
        </section>
      } @else {
        <section class="select-child" role="group" aria-labelledby="select-child-label">
          <div class="select-head">
            <h2 id="select-child-label" class="section-label">
              {{ isKm() ? 'ជ្រើសរើសកុមារ' : 'Select child' }}
            </h2>
            @if (draftSession(); as draft) {
              <p class="draft-note">
                <span class="draft-dot" aria-hidden="true"></span>
                {{
                  isKm()
                    ? 'មានការវាយតម្លៃមិនទាន់បញ្ចប់ ចាប់ផ្តើម ' + formatDate(draft.startedAt)
                    : 'Screening in progress · started ' + formatDate(draft.startedAt)
                }}
              </p>
            }
          </div>

          <div class="child-grid">
            @for (child of children(); track child.id) {
              <ac-child-select-card
                [child]="child"
                [selected]="child.id === selectedChildId()"
                (select)="onSelectChild($event)"
              />
            }
            <a class="add-child" routerLink="/children/new">
              <span class="add-plus" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span class="add-label">{{ isKm() ? 'បន្ថែមកុមារ' : 'Add child' }}</span>
            </a>
          </div>
        </section>

        <footer class="foot">
          <span class="foot-item">
            <svg class="foot-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5V12l3 2" />
            </svg>
            {{ isKm() ? 'ចំណាយពេលប្រហែល ១០-១៥ នាទី' : 'Takes approx. 10-15 mins' }}
          </span>
          <span class="foot-item">
            <svg class="foot-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="10.5" width="14" height="9" rx="2" />
              <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
            </svg>
            {{ isKm() ? 'ឯកជនភាព និងសុវត្ថិភាព' : 'Private and secure' }}
          </span>
          <span class="foot-item">
            <svg class="foot-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 1 0 9 9" />
              <path d="M21 3 12 12M15 3h6v6" />
            </svg>
            {{ isKm() ? 'អាចបន្តពេលក្រោយបាន' : 'Save and continue later' }}
          </span>
        </footer>
      }
    </section>
  `,
  styles: [
    `
      /* Named constants for this feature. Child components in this feature
         inherit these custom properties. */
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
        --scr-shadow-btn: 0 10px 26px color-mix(in srgb, var(--ac-brand-500) 18%, transparent);
        --scr-shadow-card: 0 12px 30px color-mix(in srgb, var(--ac-brand-800) 8%, transparent);
        --scr-error: var(--ac-color-alert-text);

        /* The child cards are the main choice on this page, so they are large. */
        --scr-card-width: 100%;
        --scr-card-min-height: 188px;
        --scr-card-padding: 26px 16px 22px;
        --scr-card-avatar: 72px;
        --scr-card-name: 18px;
        display: block;
      }

      .intro {
        display: flex;
        flex-direction: column;
        gap: 28px;
      }

      /* ---- Header with the toolbar actions ---- */
      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px 24px;
        flex-wrap: wrap;
      }

      .head-text {
        min-width: 0;
        flex: 1 1 360px;
      }

      .head h1 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
        font-weight: var(--ac-font-weight-bold);
      }
      .subtitle {
        margin: 0;
        color: var(--scr-text-muted);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
        max-width: 62ch;
      }

      .head-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        padding-top: 4px;
      }

      .btn-ghost,
      .btn-start {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 40px;
        padding: 0 16px;
        border-radius: 10px;
        font: inherit;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          box-shadow 160ms ease;
      }

      .btn-ghost svg,
      .btn-start svg {
        width: 17px;
        height: 17px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .btn-ghost {
        border: 1px solid var(--scr-banner-border);
        background: var(--scr-surface);
        color: var(--scr-teal);
      }
      .btn-ghost:hover {
        background: var(--scr-banner-bg);
        border-color: var(--scr-avatar-bg);
      }

      .btn-start {
        border: 1px solid var(--scr-teal);
        background: var(--scr-teal);
        color: var(--ac-color-text-on-action);
        box-shadow: var(--ac-shadow-sm);
      }
      .btn-start svg {
        fill: currentColor;
        stroke-width: 1.5;
        width: 14px;
        height: 14px;
      }
      .btn-start:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
      }
      .btn-start:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
      }

      .btn-ghost:focus-visible,
      .btn-start:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .status {
        text-align: center;
        color: var(--scr-text-muted);
        font-weight: 600;
      }
      .status.error {
        color: var(--scr-error);
      }

      /* ---- Child selection ---- */
      .select-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px 16px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }

      .section-label {
        margin: 0;
        color: var(--scr-text-muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .draft-note {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--scr-text);
        font-size: 14px;
        font-weight: 600;
      }
      .draft-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ac-color-warning);
      }

      .child-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
        gap: 16px;
      }

      .add-child {
        min-height: var(--scr-card-min-height);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        border: 2px dashed var(--scr-banner-border);
        border-radius: var(--scr-radius);
        background: transparent;
        color: var(--scr-teal);
        text-decoration: none;
        transition:
          border-color 160ms ease,
          background 160ms ease;
      }
      .add-child:hover {
        border-color: var(--scr-avatar-bg);
        background: var(--scr-surface);
      }
      .add-child:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }
      .add-plus {
        width: 56px;
        height: 56px;
        border-radius: 999px;
        background: var(--scr-banner-bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .add-plus svg {
        width: 24px;
        height: 24px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
      }
      .add-label {
        color: var(--scr-text);
        font-weight: 700;
        font-size: 16px;
      }

      /* ---- Empty state ---- */
      .screening-onboarding-card {
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--scr-radius);
        box-shadow: var(--scr-shadow-card);
        padding: 48px 24px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      .onboarding-icon {
        color: var(--scr-teal);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--scr-banner-bg);
      }
      .screening-onboarding-card h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--scr-text);
      }
      .onboarding-copy {
        margin: 0;
        font-size: 15px;
        color: var(--scr-text-muted);
        max-width: 440px;
        line-height: 1.5;
      }

      .btn-primary {
        min-height: 48px;
        border: 0;
        border-radius: var(--scr-radius);
        background: var(--scr-teal);
        color: var(--ac-color-text-on-action);
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        box-shadow: var(--scr-shadow-btn);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        padding: 0 24px;
        box-sizing: border-box;
      }

      /* ---- What to expect ---- */
      .foot {
        display: flex;
        gap: 12px 28px;
        flex-wrap: wrap;
        padding-top: 18px;
        border-top: 1px solid var(--scr-divider);
        color: var(--scr-text-muted);
      }
      .foot-item {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
      }
      .foot-icon {
        width: 18px;
        height: 18px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      @media (max-width: 560px) {
        .head-actions {
          width: 100%;
        }
        .btn-start {
          flex: 1;
          justify-content: center;
        }
        .child-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningPage implements OnInit {
  private readonly childrenApi = inject(ChildrenApi);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly isKm = computed(() => this.i18n.currentLang() === 'km');

  readonly children = signal<readonly ChildResponse[]>([]);
  readonly selectedChildId = signal<string | null>(null);
  readonly sessions = signal<readonly ScreeningSessionDetailResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** The most recent still-in-progress (DRAFT) session for the selected child. */
  readonly draftSession = computed(
    () => this.sessions().find((session) => session.status === 'DRAFT') ?? null,
  );

  ngOnInit() {
    this.loading.set(true);
    const requestedChildId = this.route.snapshot.queryParamMap.get('childId');
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        this.loading.set(false);
        const match = requestedChildId
          ? children.find((c) => c.id === requestedChildId)
          : undefined;
        const target = match ?? children[0];
        if (target) this.onSelectChild(target.id);
      },
      error: () => {
        this.error.set('Screening could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });

    this.route.queryParamMap.subscribe((params) => {
      const childId = params.get('childId');
      if (childId && childId !== this.selectedChildId()) {
        const found = this.children().find((c) => c.id === childId);
        if (found) {
          this.onSelectChild(found.id);
        }
      }
    });
  }

  onSelectChild(childId: string) {
    this.selectedChildId.set(childId);
    this.sessions.set([]);
    this.screeningApi.listSessions(childId).subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: () => this.sessions.set([]),
    });
  }

  startNew() {
    const childId = this.selectedChildId();
    if (!childId) return;
    this.router.navigate(['/screening/new'], { queryParams: { childId } });
  }

  continueSession(session: ScreeningSessionDetailResponse) {
    this.router.navigate(['/screening/new'], {
      queryParams: { childId: session.childId, sessionId: session.id },
    });
  }

  viewHistory() {
    const childId = this.selectedChildId();
    this.router.navigate(['/screening/history'], childId ? { queryParams: { childId } } : {});
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
  }
}
