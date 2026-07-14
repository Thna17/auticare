import type { Routes } from '@angular/router';
export const ACTIVITIES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./activities.page').then((m) => m.ActivitiesPage) },
];
