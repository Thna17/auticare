import { HttpErrorResponse, HttpResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { previewResponse } from './preview-fixtures';
import { previewRole, setPreviewRole } from './preview-mode';

/**
 * In preview mode, answers API requests from sample data instead of the
 * network. Requests the samples do not cover fail with a plain 503 and a
 * message, so pages show their usual error state rather than half-empty data.
 * Does nothing outside preview mode (and preview mode is development-only).
 */
export const previewBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const role = previewRole();
  const base = inject(API_BASE_URL);
  if (!role || !req.url.startsWith(base)) return next(req);

  const path = req.url.slice(base.length).replace(/^\/+/, '').split('?')[0] ?? '';
  if (path === 'auth/logout') setPreviewRole(null);

  const answer = previewResponse(req.method, path, role);
  if (answer) {
    return of(new HttpResponse({ status: 200, body: { data: answer.body, meta: {} } })).pipe(
      delay(150),
    );
  }
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 503,
        statusText: 'Preview mode',
        url: req.url,
        error: {
          error: {
            code: 'PREVIEW_MODE',
            message: 'Preview mode shows sample data only. This part needs the backend.',
          },
        },
      }),
  ).pipe(delay(150));
};
