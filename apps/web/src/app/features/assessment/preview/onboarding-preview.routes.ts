import type { Routes } from '@angular/router';
import { ONBOARDING_PREVIEW_PROVIDERS } from './onboarding-preview.providers';

/** /preview/welcome: the real first-run page, fed sample data instead of the API. */
export const ONBOARDING_PREVIEW_ROUTES: Routes = [
  {
    path: '',
    providers: ONBOARDING_PREVIEW_PROVIDERS,
    loadComponent: () => import('../onboarding.page').then((m) => m.OnboardingPage),
  },
];
