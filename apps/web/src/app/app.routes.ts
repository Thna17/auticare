import { isDevMode } from '@angular/core';
import type { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';
import { authGuard } from './core/guards/auth.guard';
import { onboardingGuard } from './core/guards/onboarding.guard';
import { roleGuard } from './core/guards/role.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'landing',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'privacy',
    loadComponent: () => import('./features/public/privacy.page').then((m) => m.PrivacyPage),
  },
  {
    path: 'register-school',
    loadComponent: () =>
      import('./features/public/register-school.page').then((m) => m.RegisterSchoolPage),
  },
  {
    path: 'register-hospital',
    loadComponent: () =>
      import('./features/public/register-hospital.page').then((m) => m.RegisterHospitalPage),
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/public/terms.page').then((m) => m.TermsPage),
  },
  {
    path: 'crisis',
    loadComponent: () =>
      import('./features/public/crisis-resources.page').then((m) => m.CrisisResourcesPage),
  },
  {
    path: 'emergency',
    redirectTo: 'crisis',
    pathMatch: 'full',
  },
  // Development only: the first-run questionnaire with sample data, no login and
  // no API needed. Not registered in production builds.
  ...(isDevMode()
    ? [
        {
          path: 'preview',
          loadComponent: () =>
            import('./core/preview/preview-launcher.page').then((m) => m.PreviewLauncherPage),
        },
        {
          path: 'preview/welcome',
          loadChildren: () =>
            import('./features/assessment/preview/onboarding-preview.routes').then(
              (m) => m.ONBOARDING_PREVIEW_ROUTES,
            ),
        },
      ]
    : []),
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    // First run: add a child, answer the short assessment, see the concern band.
    // Signed-in only, but deliberately outside the shell.
    path: 'welcome',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/assessment/assessment.routes').then((m) => m.ONBOARDING_ROUTES),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard, onboardingGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        // The five parent-facing areas. Everything below keeps its existing
        // route; these are the new top-level doors.
        path: 'ai',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadComponent: () => import('./features/ai/ai.page').then((m) => m.AiPage),
      },
      {
        path: 'documents',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadComponent: () =>
          import('./features/documents/documents.page').then((m) => m.DocumentsPage),
      },
      {
        path: 'observations',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadComponent: () =>
          import('./features/observations/observations.page').then((m) => m.ObservationsPage),
      },
      {
        path: 'profile',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        // A parent connects a child to a school with the school's code.
        path: 'connections',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadComponent: () =>
          import('./features/connections/connections.page').then((m) => m.ConnectionsPage),
      },
      {
        path: 'children',
        canActivate: [roleGuard],
        data: { roles: ['PARENT', 'ADMIN'] },
        loadChildren: () =>
          import('./features/children/children.routes').then((m) => m.CHILDREN_ROUTES),
      },
      {
        path: 'screening',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadChildren: () =>
          import('./features/screening/screening.routes').then((m) => m.SCREENING_ROUTES),
      },
      {
        path: 'find-support',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadChildren: () =>
          import('./features/find-support/find-support.routes').then((m) => m.FIND_SUPPORT_ROUTES),
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'schools',
        loadChildren: () =>
          import('./features/schools/schools.routes').then((m) => m.SCHOOLS_ROUTES),
      },
      {
        path: 'admin/school-registrations',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/school-registrations.page').then(
            (m) => m.SchoolRegistrationsPage,
          ),
      },
      {
        path: 'admin/parents',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-parents.page').then((m) => m.AdminParentsPage),
      },
      {
        path: 'admin/schools',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-schools.page').then((m) => m.AdminSchoolsPage),
      },
      {
        path: 'admin/staff',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-staff.page').then((m) => m.AdminStaffPage),
      },
      {
        path: 'admin/sponsorships',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-sponsorships.page').then((m) => m.AdminSponsorshipsPage),
      },
      {
        path: 'admin/audit',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-audit.page').then((m) => m.AdminAuditPage),
      },
      {
        path: 'admin/announcements',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-announcements.page').then((m) => m.AdminAnnouncementsPage),
      },
      {
        path: 'admin/partnerships',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-partnerships.page').then((m) => m.AdminPartnershipsPage),
      },
      {
        path: 'admin/analytics',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-analytics.page').then((m) => m.AdminAnalyticsPage),
      },
      {
        path: 'admin/activities',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-activities.page').then((m) => m.AdminActivitiesPage),
      },
      {
        path: 'admin/questionnaire',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-questionnaire.page').then((m) => m.AdminQuestionnairePage),
      },
      {
        path: 'admin/ai',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/admin/admin-ai.page').then((m) => m.AdminAiPage),
      },
      {
        path: 'admin/help',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-help.page').then((m) => m.AdminHelpPage),
      },
      {
        path: 'admin/subscriptions',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/subscriptions/admin-subscriptions.page').then(
            (m) => m.AdminSubscriptionsPage,
          ),
      },
      {
        path: 'subscription',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadComponent: () =>
          import('./features/subscriptions/parent-subscription.page').then(
            (m) => m.ParentSubscriptionPage,
          ),
      },
      {
        path: 'admin/hospital-registrations',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/hospital-registrations.page').then(
            (m) => m.HospitalRegistrationsPage,
          ),
      },
      {
        path: 'hospitals',
        canActivate: [roleGuard],
        data: { roles: ['PARENT', 'ADMIN'] },
        loadChildren: () =>
          import('./features/hospitals/hospitals.routes').then((m) => m.HOSPITALS_ROUTES),
      },
      {
        path: 'appointments',
        canActivate: [roleGuard],
        data: { roles: ['PARENT', 'ADMIN'] },
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
      },
      {
        path: 'hospital',
        canActivate: [roleGuard],
        data: { roles: ['HOSPITAL'] },
        loadChildren: () =>
          import('./features/hospital-management/hospital-management.routes').then(
            (m) => m.HOSPITAL_MANAGEMENT_ROUTES,
          ),
      },
      {
        path: 'activities',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadChildren: () =>
          import('./features/activities/activities.routes').then((m) => m.ACTIVITIES_ROUTES),
      },
      {
        path: 'progress',
        canActivate: [roleGuard],
        data: { roles: ['PARENT'] },
        loadChildren: () =>
          import('./features/progress/progress.routes').then((m) => m.PROGRESS_ROUTES),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then(
            (m) => m.NOTIFICATIONS_ROUTES,
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        // Sidebar "Help Center" (and "Messages") point at /support; serve the
        // Help Center here without modifying the shell or the support feature.
        path: 'support',
        loadChildren: () =>
          import('./features/help-center/help-center.routes').then((m) => m.HELP_CENTER_ROUTES),
      },
    ],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/errors/unauthorized.page').then((m) => m.UnauthorizedPage),
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./features/errors/generic-error.page').then((m) => m.GenericErrorPage),
  },
  {
    path: '**',
    loadComponent: () => import('./features/errors/not-found.page').then((m) => m.NotFoundPage),
  },
];
