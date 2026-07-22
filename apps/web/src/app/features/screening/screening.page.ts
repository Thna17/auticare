import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import type { ChildResponse, ScreeningSessionDetailResponse } from '@auticare/contracts';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from './data-access/screening.api';
import { ChildSelectCardComponent } from './components/child-select-card.component';
import { ScreeningInfoBannerComponent } from './components/screening-info-banner.component';

@Component({
  standalone: true,
  imports: [RouterLink, ChildSelectCardComponent, ScreeningInfoBannerComponent],
  template: `
    <section class="intro">
      <header class="head">
        <h1>Autism Screening</h1>
        <p class="subtitle">
          Informational support to help you understand your child's development.
        </p>
      </header>

      <ac-screening-info-banner>
        This screening tool is for informational purposes and does not constitute a medical
        diagnosis. Please consult with a healthcare professional for a formal evaluation.
      </ac-screening-info-banner>

      @if (loading()) {
        <p class="status">Loading…</p>
      } @else if (error()) {
        <p class="status error" role="alert">{{ error() }}</p>
      } @else {
        <section class="select-child" role="group" aria-labelledby="select-child-label">
          <p id="select-child-label" class="section-label">SELECT CHILD</p>
          <div class="child-row">
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
                  <line
                    x1="12"
                    y1="5"
                    x2="12"
                    y2="19"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <span class="add-label">Add Child</span>
            </a>
          </div>
        </section>

        <section class="action-card">
          @if (draftSession(); as draft) {
            <div class="last-activity">
              <div class="last-copy">
                <p class="section-label">LAST ACTIVITY</p>
                <p class="last-meta">Screening started {{ formatDate(draft.startedAt) }}</p>
              </div>
              <button type="button" class="btn-continue" (click)="continueSession(draft)">
                Continue
              </button>
            </div>
            <div class="divider"><span>OR</span></div>
          }

          <button
            type="button"
            class="btn-primary"
            [disabled]="!selectedChildId()"
            (click)="startNew()"
          >
            Start new screening
          </button>

          <button type="button" class="link-history" (click)="viewHistory()">
            View screening history
          </button>
        </section>

        <footer class="foot">
          <span class="foot-item">
            <svg class="foot-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
              <path
                d="M12 7.5V12l3 2"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Takes approx. 10-15 mins
          </span>
          <span class="foot-item">
            <svg class="foot-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="5"
                y="10.5"
                width="14"
                height="9"
                rx="2"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            Private and secure
          </span>
        </footer>
      }
    </section>
  `,
  styles: [
    `
      /* Named constants for this feature. Values mirror the app shell's existing
         hardcoded hex/px exactly (there is no token system). Child components in
         this feature inherit these custom properties. */
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

      .intro {
        max-width: 720px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 28px;
      }

      .head {
        text-align: center;
      }
      .head h1 {
        margin: 0 0 8px;
        color: var(--scr-teal);
        font-size: 34px;
        font-weight: 800;
      }
      .subtitle {
        margin: 0;
        color: var(--scr-text-muted);
        font-size: 16px;
      }

      .status {
        text-align: center;
        color: var(--scr-text-muted);
        font-weight: 600;
      }
      .status.error {
        color: var(--scr-error);
      }

      .section-label {
        margin: 0 0 12px;
        color: var(--scr-text-muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .child-row {
        display: flex;
        gap: 14px;
        overflow-x: auto;
        padding-bottom: 4px;
      }

      .add-child {
        width: 116px;
        min-height: 132px;
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: 2px dashed var(--scr-banner-border);
        border-radius: var(--scr-radius);
        background: var(--scr-surface);
        color: var(--scr-teal);
        text-decoration: none;
      }
      .add-child:hover {
        border-color: var(--scr-avatar-bg);
      }
      .add-plus {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        background: var(--scr-banner-bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .add-plus svg {
        width: 22px;
        height: 22px;
      }
      .add-label {
        color: var(--scr-text);
        font-weight: 700;
        font-size: 15px;
      }

      .action-card {
        background: var(--scr-surface);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--scr-radius);
        box-shadow: var(--scr-shadow-card);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .last-activity {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .last-copy {
        min-width: 0;
      }
      .last-meta {
        margin: 0;
        color: var(--scr-text);
        font-weight: 600;
      }
      .btn-continue {
        flex: 0 0 auto;
        min-height: 44px;
        padding: 0 22px;
        border: 2px solid var(--scr-teal);
        border-radius: var(--scr-radius);
        background: var(--scr-surface);
        color: var(--scr-teal);
        font-weight: 700;
        cursor: pointer;
      }
      .btn-continue:hover {
        background: var(--scr-banner-bg);
      }

      .divider {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--scr-text-muted);
        font-weight: 700;
        font-size: 12px;
      }
      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--scr-divider);
      }

      .btn-primary {
        min-height: 56px;
        border: 0;
        border-radius: var(--scr-radius);
        background: var(--scr-teal);
        color: #ffffff;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        box-shadow: var(--scr-shadow-btn);
      }
      .btn-primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
      }

      .link-history {
        align-self: center;
        border: 0;
        background: none;
        color: var(--scr-teal);
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }

      .foot {
        display: flex;
        justify-content: center;
        gap: 32px;
        flex-wrap: wrap;
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
      }

      @media (max-width: 560px) {
        .foot {
          gap: 16px;
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
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        this.loading.set(false);
        const first = children[0];
        if (first) this.onSelectChild(first.id);
      },
      error: () => {
        this.error.set('Screening could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
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
