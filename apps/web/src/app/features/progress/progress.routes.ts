import type { Routes } from '@angular/router';
export const PROGRESS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./progress.page').then((m) => m.ProgressPage) },
];
