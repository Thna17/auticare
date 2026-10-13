import type { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const HOSPITALS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./hospitals.page').then((m) => m.HospitalsPage) },
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./admin-hospitals.page').then((m) => m.AdminHospitalsPage),
  },
  {
    path: 'admin/new',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./create-hospital-account.page').then((m) => m.CreateHospitalAccountPage),
  },
];
