import type { Routes } from '@angular/router';
export const HOSPITALS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./hospitals.page').then((m) => m.HospitalsPage) },
];
