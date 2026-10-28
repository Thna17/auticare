import { isDevMode } from '@angular/core';

/**
 * Preview mode: look at every role's dashboard without the API running.
 * Development builds only. The chosen role lives in sessionStorage, so it ends
 * when the tab closes, and nothing is ever sent to a server.
 */

export const PREVIEW_ROLES = ['parent', 'admin', 'school-admin', 'teacher', 'hospital'] as const;
export type PreviewRole = (typeof PREVIEW_ROLES)[number];

const KEY = 'auticare.previewRole';

export const previewRole = (): PreviewRole | null => {
  if (!isDevMode()) return null;
  try {
    const value = sessionStorage.getItem(KEY);
    return (PREVIEW_ROLES as readonly string[]).includes(value ?? '')
      ? (value as PreviewRole)
      : null;
  } catch {
    return null;
  }
};

export const setPreviewRole = (role: PreviewRole | null): void => {
  try {
    if (role) sessionStorage.setItem(KEY, role);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: preview mode simply stays off.
  }
};

/** Where each role lands after "signing in". */
export const PREVIEW_HOME: Record<PreviewRole, string> = {
  parent: '/dashboard',
  admin: '/dashboard',
  'school-admin': '/dashboard',
  teacher: '/dashboard',
  hospital: '/hospital/dashboard',
};
