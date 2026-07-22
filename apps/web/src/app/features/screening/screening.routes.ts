import type { Routes } from '@angular/router';
export const SCREENING_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./screening.page').then((m) => m.ScreeningPage) },
  {
    path: 'new',
    loadComponent: () => import('./screening-new.page').then((m) => m.ScreeningNewPage),
  },
  {
    path: 'session/:sessionId',
    loadComponent: () => import('./screening-session.page').then((m) => m.ScreeningSessionPage),
  },
  {
    path: 'result/:sessionId',
    loadComponent: () => import('./screening-result.page').then((m) => m.ScreeningResultPage),
  },
  {
    path: 'history',
    loadComponent: () => import('./screening-history.page').then((m) => m.ScreeningHistoryPage),
  },
];
