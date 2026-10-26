import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { map, of, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { OnboardingState } from '../../features/assessment/onboarding-state';

/**
 * Sends a parent into the first-run flow until they have either answered the
 * short assessment or explicitly skipped it.
 *
 * Only PARENT is affected: school, hospital and administrator accounts are
 * created by invitation and have their own landing screens, so gating them here
 * would break the flows that already work.
 *
 * This runs on the shell route rather than on individual pages, so a bookmarked
 * deep link also lands in the flow instead of showing a half-empty page that
 * needs a child it does not have.
 */
export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const onboarding = inject(OnboardingState);

  const evaluate = (): Observable<boolean | ReturnType<Router['createUrlTree']>> => {
    if (auth.parent()?.role !== 'PARENT') return of(true);
    return onboarding
      .ensureState()
      .pipe(map((state) => (state === 'complete' ? true : router.createUrlTree(['/welcome']))));
  };

  // A hard reload has a token but no loaded profile yet. Without waiting for it,
  // the role would read as undefined and the guard would wave the parent through.
  if (!auth.parent()) {
    return auth.loadCurrentUser().pipe(switchMap(() => evaluate()));
  }
  return evaluate();
};
