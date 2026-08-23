import type { Routes } from '@angular/router';
export const HELP_CENTER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./help-center.page').then((m) => m.HelpCenterPage) },
];
