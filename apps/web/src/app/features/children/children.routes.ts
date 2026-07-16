import type { Routes } from '@angular/router';
export const CHILDREN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./children-list.page').then((m) => m.ChildrenListPage) },
  {
    path: 'new',
    loadComponent: () => import('./create-child.page').then((m) => m.CreateChildPage),
  },
  {
    path: ':childId',
    loadComponent: () => import('./child-profile.page').then((m) => m.ChildProfilePage),
  },
];
