import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return auth.loadCurrentUser().pipe(
    map((ok) => {
      if (ok) return true;
      const queryParams = state?.url && state.url !== '/' ? { returnUrl: state.url } : undefined;
      return router.createUrlTree(['/login'], queryParams ? { queryParams } : undefined);
    }),
  );
};
