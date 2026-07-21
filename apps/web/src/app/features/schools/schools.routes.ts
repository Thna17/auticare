import type { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export const SCHOOLS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['PARENT'] },
    loadComponent: () => import('./schools.page').then((m) => m.SchoolsPage),
  },
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./admin-schools.page').then((m) => m.AdminSchoolsPage),
  },
  {
    path: 'admin/new',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./create-school-account.page').then((m) => m.CreateSchoolAccountPage),
  },
  {
    path: 'enrollments',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () => import('./school-enrollments.page').then((m) => m.SchoolEnrollmentsPage),
  },
  {
    path: 'reports',
    canActivate: [roleGuard],
    data: { roles: ['PARENT', 'ADMIN', 'SCHOOL'] },
    loadComponent: () => import('./school-reports.page').then((m) => m.SchoolReportsPage),
  },
  {
    path: 'reports/new',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () =>
      import('./create-school-report.page').then((m) => m.CreateSchoolReportPage),
  },
  {
    path: 'profile',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () => import('./school-profile.page').then((m) => m.SchoolProfilePage),
  },
];
