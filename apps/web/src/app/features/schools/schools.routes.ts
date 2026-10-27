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
    path: 'students/add',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () => import('./add-student.page').then((m) => m.AddStudentPage),
  },
  {
    path: 'reports',
    canActivate: [roleGuard],
    data: { roles: ['PARENT', 'ADMIN', 'SCHOOL'] },
    loadComponent: () => import('./school-reports.page').then((m) => m.SchoolReportsPage),
  },
  {
    path: 'reports/:id/edit',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () =>
      import('./create-school-report.page').then((m) => m.CreateSchoolReportPage),
  },
  {
    path: 'reports/new',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () =>
      import('./create-school-report.page').then((m) => m.CreateSchoolReportPage),
  },
  {
    // The school admin's team: teacher accounts and assignment.
    path: 'staff',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () => import('./school-team.page').then((m) => m.SchoolTeamPage),
  },
  {
    // Single-use codes families use to connect a child to the school.
    path: 'connect',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () => import('./school-connect.page').then((m) => m.SchoolConnectPage),
  },
  {
    // The Business plan; school admin only (the server enforces it too).
    path: 'subscription',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () =>
      import('../subscriptions/school-subscription.page').then((m) => m.SchoolSubscriptionPage),
  },
  {
    // The five sponsored Pro family accounts. Not teacher seats.
    path: 'sponsorships',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () =>
      import('../subscriptions/school-sponsorships.page').then((m) => m.SchoolSponsorshipsPage),
  },
  {
    path: 'profile',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () => import('./school-profile.page').then((m) => m.SchoolProfilePage),
  },
  {
    path: 'inquiries',
    canActivate: [roleGuard],
    data: { roles: ['SCHOOL'] },
    loadComponent: () => import('./school-inquiries.page').then((m) => m.SchoolInquiriesPage),
  },
  // Read-only public detail. Registered last so it never shadows the fixed
  // paths above. Any authenticated role may VIEW (read-only, no edit controls);
  // matches the API (GET /schools/:id).
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { roles: ['PARENT', 'ADMIN', 'SCHOOL'] },
    loadComponent: () => import('./school-detail.page').then((m) => m.SchoolDetailPage),
  },
];
