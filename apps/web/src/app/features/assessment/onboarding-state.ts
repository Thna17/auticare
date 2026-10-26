import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from '../screening/data-access/screening.api';

/**
 * Where a parent is in the first-run flow:
 * - `needs-child`     — no child profile yet, so nothing else in the app can work
 * - `needs-assessment`— a child exists but the short assessment has not been answered
 * - `complete`        — answered, or deliberately skipped on this device
 */
export type OnboardingStateValue = 'needs-child' | 'needs-assessment' | 'complete';

const SKIP_KEY_PREFIX = 'auticare_onboarding_skipped';

/**
 * Caches the first-run decision so the guard costs nothing after the first
 * navigation.
 *
 * Two deliberate choices:
 * 1. A skip is remembered per device and per account rather than being written
 *    to the server. Skipping is a UI preference about being asked, not family
 *    data, and it must not become a field that later reads like a clinical fact.
 * 2. A failure to load is treated as `complete`. Blocking the whole app behind a
 *    failed request would lock a parent out of the parts that still work; the
 *    dashboard offers the assessment again instead.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingState {
  private readonly auth = inject(AuthService);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly screeningApi = inject(ScreeningApi);

  private cached: OnboardingStateValue | null = null;

  /** Bumped whenever the answer could have changed, so callers can re-read it. */
  ensureState(force = false): Observable<OnboardingStateValue> {
    if (!force && this.cached) return of(this.cached);
    if (this.isSkipped()) {
      this.cached = 'complete';
      return of('complete');
    }

    return this.childrenApi.listChildren().pipe(
      switchMap((children) => {
        const child = children[0];
        if (!child) return of<OnboardingStateValue>('needs-child');
        return this.screeningApi
          .getLatest(child.id, 'SHORT')
          .pipe(map((latest): OnboardingStateValue => (latest ? 'complete' : 'needs-assessment')));
      }),
      tap((state) => {
        this.cached = state;
      }),
    );
  }

  /** Called once the short assessment has been submitted. */
  markComplete(): void {
    this.cached = 'complete';
  }

  /** Called when a child profile is created, so the next read re-queries. */
  invalidate(): void {
    this.cached = null;
  }

  /** Remember that this parent asked not to be shown the assessment again. */
  skip(): void {
    this.cached = 'complete';
    const key = this.skipKey();
    if (!key || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, new Date().toISOString());
    } catch {
      // Storage can be unavailable (private mode, restricted webview). Skipping
      // still works for this session; it just will not be remembered.
    }
  }

  /** Clears a previous skip so the assessment is offered again. */
  clearSkip(): void {
    const key = this.skipKey();
    if (!key || typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
    this.cached = null;
  }

  isSkipped(): boolean {
    const key = this.skipKey();
    if (!key || typeof localStorage === 'undefined') return false;
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  private skipKey(): string | null {
    const parentId = this.auth.parent()?.id;
    return parentId ? `${SKIP_KEY_PREFIX}:${parentId}` : null;
  }
}
