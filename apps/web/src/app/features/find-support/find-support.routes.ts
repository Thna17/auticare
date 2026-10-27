import type { Routes } from '@angular/router';

export const FIND_SUPPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./find-support.page').then((m) => m.FindSupportPage),
  },
  {
    path: ':type/:id',
    loadComponent: () => import('./support-detail.page').then((m) => m.SupportDetailPage),
  },
];
