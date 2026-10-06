import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { authGuard } from './auth.guard';

/**
 * The guard reads AuthService through signals and may return a boolean or an
 * Observable, so each case states which it expects rather than unwrapping both.
 */
const runGuard = (options: { authenticated: boolean; loadResolvesTo?: boolean }) => {
  const loadCurrentUser = vi.fn(() => of(options.loadResolvesTo ?? false));
  const createUrlTree = vi.fn((commands: readonly string[]) => ({ commands }));

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: AuthService,
        useValue: { isAuthenticated: signal(options.authenticated), loadCurrentUser },
      },
      { provide: Router, useValue: { createUrlTree } },
    ],
  });

  const result = TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
  return { result, loadCurrentUser, createUrlTree };
};

describe('authGuard', () => {
  it('lets an already-authenticated caller through without asking the server', () => {
    const { result, loadCurrentUser } = runGuard({ authenticated: true });

    expect(result).toBe(true);
    // The guard runs on every navigation, so a request here would mean one
    // request per route change for the whole session.
    expect(loadCurrentUser).not.toHaveBeenCalled();
  });

  it('asks the server once when the session is not yet known', async () => {
    const { result, loadCurrentUser } = runGuard({
      authenticated: false,
      loadResolvesTo: true,
    });

    // A refresh lands here: the signal is false because nothing has loaded yet,
    // not because the caller is signed out. Redirecting without asking would
    // sign people out on every reload.
    expect(loadCurrentUser).toHaveBeenCalledTimes(1);
    await expect(firstValue(result)).resolves.toBe(true);
  });

  it('redirects to login when the server says the session is gone', async () => {
    const { result, createUrlTree } = runGuard({
      authenticated: false,
      loadResolvesTo: false,
    });

    await expect(firstValue(result)).resolves.toEqual({ commands: ['/login'] });
    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});

/** Unwraps the Observable branch; fails loudly if the guard returned a boolean. */
function firstValue(result: ReturnType<typeof authGuard>) {
  if (typeof result === 'boolean' || !('subscribe' in Object(result))) {
    return Promise.reject(new Error(`expected an Observable, got ${String(result)}`));
  }
  return new Promise((resolve, reject) => {
    (result as { subscribe: (o: unknown) => void }).subscribe({
      next: resolve,
      error: reject,
    });
  });
}
