import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ScreeningApi } from './data-access/screening.api';

/**
 * Transient hand-off page. Creates a screening session for the given child
 * (POST /screening/sessions), then redirects to the session questionnaire.
 * If a `sessionId` query param is present (the "Continue" path), it resumes that
 * session instead of creating a new one.
 */
@Component({
  standalone: true,
  template: `
    <section class="wait">
      @if (error()) {
        <p class="status error" role="alert">{{ error() }}</p>
        <button type="button" class="link" (click)="goHome()">Back to Screening</button>
      } @else {
        <p class="status">Preparing your screening…</p>
      }
    </section>
  `,
  styles: [
    `
      :host {
        --scr-teal: #3d6375;
        --scr-text-muted: #66747a;
        --scr-error: #a23434;
        display: block;
      }
      .wait {
        max-width: 720px;
        margin: 0 auto;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 40px;
      }
      .status {
        color: var(--scr-text-muted);
        font-weight: 600;
      }
      .status.error {
        color: var(--scr-error);
      }
      .link {
        border: 0;
        background: none;
        color: var(--scr-teal);
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningNewPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ScreeningApi);

  readonly error = signal<string | null>(null);

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const sessionId = params.get('sessionId');
    if (sessionId) {
      // Resume an existing session (the "Continue" path) — no new session created.
      this.router.navigate(['/screening/session', sessionId], { replaceUrl: true });
      return;
    }

    const childId = params.get('childId');
    if (!childId) {
      this.error.set('No child was selected for this screening.');
      return;
    }

    this.api.createSession(childId).subscribe({
      next: (created) => {
        this.router.navigate(['/screening/session', created.session.id], {
          replaceUrl: true,
          state: { questions: created.questions },
        });
      },
      error: () => this.error.set('The screening could not be started. Please try again.'),
    });
  }

  goHome() {
    this.router.navigate(['/screening']);
  }
}
