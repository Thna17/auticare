import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Token to skip 401 refresh handling (e.g. for the refresh request itself, or login/register).
 */
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);

/**
 * State for synchronising concurrent 401s across the application.
 * Module-level state ensures that independent requests in flight share exactly
 * one refresh call and queue cleanly.
 */
let refreshInProgress$: Observable<boolean> | null = null;

/**
 * Resets the shared refresh state (useful for unit tests).
 */
export const _resetRefreshState = () => {
  refreshInProgress$ = null;
};

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router, { optional: true });

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // If the request opted out of refresh handling, or is already marked as a retry,
      // or is an auth endpoint where 401 is expected and cannot be refreshed (login, register, forgot-password, refresh)
      const url = req.url.toLowerCase();
      const isUnrefreshableEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password');

      if (req.context.get(SKIP_AUTH_REFRESH) || isUnrefreshableEndpoint) {
        return throwError(() => error);
      }

      if (!refreshInProgress$) {
        // Exactly one shared POST request to /api/v1/auth/refresh
        refreshInProgress$ = auth.refreshSession().pipe(
          map(() => true),
          catchError((refreshErr: unknown) => {
            const currentUrl = router?.url;
            auth.clearSessionAndRedirect(currentUrl && currentUrl !== '/' ? currentUrl : undefined);
            return throwError(() => refreshErr);
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
          finalize(() => {
            // Null out after all microtasks / current cycle complete
            queueMicrotask(() => {
              refreshInProgress$ = null;
            });
          }),
        );
      }

      return refreshInProgress$.pipe(
        take(1),
        switchMap(() => {
          const retried = req.clone({
            context: req.context.set(SKIP_AUTH_REFRESH, true),
          });
          return next(retried);
        }),
      );
    }),
  );
};
