import type { Routes } from '@angular/router';
export const HOSPITAL_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./hospital-dashboard.page').then((m) => m.HospitalDashboardPage),
  },
  {
    path: 'appointments',
    loadComponent: () =>
      import('./hospital-appointments.page').then((m) => m.HospitalAppointmentsPage),
  },
  {
    path: 'doctors',
    loadComponent: () => import('./hospital-doctors.page').then((m) => m.HospitalDoctorsPage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./hospital-profile.page').then((m) => m.HospitalProfilePage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
