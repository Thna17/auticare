import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import type { UserRole } from '@auticare/contracts';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const canUseRoute = (roles: readonly UserRole[] | undefined, role: UserRole | undefined) =>
  !roles?.length || (role ? roles.includes(role) : false);

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as readonly UserRole[] | undefined;

  if (canUseRoute(roles, auth.parent()?.role)) return true;

  if (auth.isAuthenticated()) return router.createUrlTree(['/unauthorized']);

  return auth
    .loadCurrentUser()
    .pipe(
      map(() =>
        canUseRoute(roles, auth.parent()?.role) ? true : router.createUrlTree(['/unauthorized']),
      ),
    );
};
