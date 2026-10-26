import type { Routes } from '@angular/router';

/**
 * The first-run flow lives outside the app shell on purpose: a parent who has not
 * finished it should not be looking at a navigation rail full of screens that
 * need data they do not have yet.
 */
export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./onboarding.page').then((m) => m.OnboardingPage),
  },
];
