import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { ParentResponse } from '@auticare/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const dummyParent: ParentResponse = {
    id: 'parent_456',
    email: 'user@auticare.test',
    firstName: 'User',
    lastName: 'One',
    phoneNumber: null,
    socialMediaAccount: null,
    role: 'PARENT',
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('refreshSession posts to /api/v1/auth/refresh and updates state to authenticated', () => {
    let result: ParentResponse | undefined;
    service.refreshSession().subscribe((parent) => {
      result = parent;
    });

    const req = httpTesting.expectOne('/api/v1/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush({ data: { parent: dummyParent } });

    expect(result).toEqual(dummyParent);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.parent()).toEqual(dummyParent);
  });

  it('clearClientSession sets status to anonymous and parent to null', () => {
    // First set authenticated
    service.refreshSession().subscribe();
    const req = httpTesting.expectOne('/api/v1/auth/refresh');
    req.flush({ data: { parent: dummyParent } });
    expect(service.isAuthenticated()).toBe(true);

    // Now clear
    service.clearClientSession();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.parent()).toBeNull();
  });

  it('clearSessionAndRedirect clears state and navigates to /login with returnUrl', () => {
    service.clearSessionAndRedirect('/appointments/123');

    expect(service.isAuthenticated()).toBe(false);
    expect(service.parent()).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/appointments/123' },
    });
  });

  it('logout posts to /api/v1/auth/logout and clears client session', () => {
    let loggedOut = false;
    service.logout().subscribe(() => {
      loggedOut = true;
    });

    const req = httpTesting.expectOne('/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({ data: { loggedOut: true } });

    expect(loggedOut).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.parent()).toBeNull();
  });
});
