import type { Routes } from '@angular/router';
export const APPOINTMENTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./appointments.page').then((m) => m.AppointmentsPage) },
];
