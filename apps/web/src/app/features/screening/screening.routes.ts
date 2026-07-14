import type { Routes } from '@angular/router';
export const SCREENING_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./screening.page').then((m) => m.ScreeningPage) },
];
