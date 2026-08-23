import type { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./appointment-dashboard.page').then((m) => m.AppointmentDashboardPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./select-hospital.page').then((m) => m.SelectHospitalPage),
  },
  {
    path: 'hospitals/:hospitalId',
    loadComponent: () =>
      import('./specialist-discovery.page').then((m) => m.SpecialistDiscoveryPage),
  },
];
