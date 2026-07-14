import type { Routes } from '@angular/router';
export const SUPPORT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./support.page').then((m) => m.SupportPage) },
];
