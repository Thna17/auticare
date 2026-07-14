import type { Routes } from '@angular/router';
export const CHILDREN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./children-list.page').then((m) => m.ChildrenListPage) },
  {
    path: ':childId',
    loadComponent: () => import('./child-profile.page').then((m) => m.ChildProfilePage),
  },
];
