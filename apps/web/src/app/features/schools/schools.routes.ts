import type { Routes } from '@angular/router';
export const SCHOOLS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./schools.page').then((m) => m.SchoolsPage) },
];
