import type { Routes } from '@angular/router';
export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./login.page').then((m) => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./register.page').then((m) => m.RegisterPage) },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password.page').then((m) => m.ResetPasswordPage),
  },
];
