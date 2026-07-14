import type { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';
import { authGuard } from './core/guards/auth.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/landing.page').then((m) => m.LandingPage),
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'children',
        loadChildren: () =>
          import('./features/children/children.routes').then((m) => m.CHILDREN_ROUTES),
      },
      {
        path: 'screening',
        loadChildren: () =>
          import('./features/screening/screening.routes').then((m) => m.SCREENING_ROUTES),
      },
      {
        path: 'schools',
        loadChildren: () =>
          import('./features/schools/schools.routes').then((m) => m.SCHOOLS_ROUTES),
      },
      {
        path: 'hospitals',
        loadChildren: () =>
          import('./features/hospitals/hospitals.routes').then((m) => m.HOSPITALS_ROUTES),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
      },
      {
        path: 'activities',
        loadChildren: () =>
          import('./features/activities/activities.routes').then((m) => m.ACTIVITIES_ROUTES),
      },
      {
        path: 'progress',
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
        path: 'support',
        loadChildren: () =>
          import('./features/support/support.routes').then((m) => m.SUPPORT_ROUTES),
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
