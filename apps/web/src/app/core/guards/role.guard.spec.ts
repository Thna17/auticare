import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import type { ParentResponse, UserRole } from '@auticare/contracts';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { roleGuard } from './role.guard';

const asParent = (role: UserRole | undefined) =>
  role === undefined ? null : ({ role } as ParentResponse);

const runGuard = (options: {
  roles?: readonly UserRole[];
  role?: UserRole;
  authenticated?: boolean;
  roleAfterLoad?: UserRole;
}) => {
  const parent = signal(asParent(options.role));
  const loadCurrentUser = vi.fn(() => {
    if (options.roleAfterLoad !== undefined) parent.set(asParent(options.roleAfterLoad));
    return of(options.roleAfterLoad !== undefined);
  });
  const createUrlTree = vi.fn((commands: readonly string[]) => ({ commands }));

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: AuthService,
        useValue: {
          parent,
          isAuthenticated: signal(options.authenticated ?? options.role !== undefined),
          loadCurrentUser,
        },
      },
      { provide: Router, useValue: { createUrlTree } },
    ],
  });

  const route = { data: options.roles ? { roles: options.roles } : {} } as ActivatedRouteSnapshot;
  const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as RouterStateSnapshot));
  return { result, loadCurrentUser, createUrlTree };
};

const firstValue = (result: ReturnType<typeof roleGuard>) =>
  new Promise((resolve, reject) => {
    if (typeof result === 'boolean' || !('subscribe' in Object(result))) {
      reject(new Error(`expected an Observable, got ${String(result)}`));
      return;
    }
    (result as { subscribe: (o: unknown) => void }).subscribe({ next: resolve, error: reject });
  });

describe('roleGuard', () => {
  it('admits a caller whose role is listed', () => {
    const { result } = runGuard({ roles: ['SCHOOL'], role: 'SCHOOL' });
    expect(result).toBe(true);
  });

  it('admits anyone when the route lists no roles', () => {
    // A route with no `roles` in its data is open to any signed-in account. That
    // is easy to rely on by accident: adding a route and forgetting the data
    // leaves it ungated rather than locked, so the behaviour is pinned here.
    const { result } = runGuard({ role: 'PARENT' });
    expect(result).toBe(true);
  });

  it('sends a signed-in caller with the wrong role to /unauthorized, not /login', () => {
    // The distinction matters: /login would look like "your session expired" to
    // someone who is perfectly well signed in, and bouncing them to a sign-in
    // form they do not need is how a parent ends up stuck on a school page.
    const { result, createUrlTree, loadCurrentUser } = runGuard({
      roles: ['SCHOOL'],
      role: 'PARENT',
    });

    expect(result).toEqual({ commands: ['/unauthorized'] });
    expect(createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
    expect(loadCurrentUser).not.toHaveBeenCalled();
  });

  it('loads the session before deciding when nothing is known yet', async () => {
    // On a refresh straight onto a guarded URL there is no parent loaded, so the
    // role cannot be checked. Refusing here would make every reload of a school
    // page bounce to /unauthorized.
    const { result, loadCurrentUser } = runGuard({
      roles: ['SCHOOL'],
      authenticated: false,
      roleAfterLoad: 'SCHOOL',
    });

    expect(loadCurrentUser).toHaveBeenCalledTimes(1);
    await expect(firstValue(result)).resolves.toBe(true);
  });

  it('refuses after loading when the role still does not match', async () => {
    const { result } = runGuard({
      roles: ['SCHOOL'],
      authenticated: false,
      roleAfterLoad: 'PARENT',
    });

    await expect(firstValue(result)).resolves.toEqual({ commands: ['/unauthorized'] });
  });

  it('refuses when the session cannot be loaded at all', async () => {
    const { result } = runGuard({ roles: ['SCHOOL'], authenticated: false });
    await expect(firstValue(result)).resolves.toEqual({ commands: ['/unauthorized'] });
  });
});
