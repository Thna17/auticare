import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { ParentResponse } from '@auticare/contracts';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { authRefreshInterceptor, _resetRefreshState } from './auth-refresh.interceptor';

describe('authRefreshInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authServiceMock: {
    refreshSession: ReturnType<typeof vi.fn>;
    clearSessionAndRedirect: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    url: string;
    navigate: ReturnType<typeof vi.fn>;
  };

  const dummyParent: ParentResponse = {
    id: 'parent_123',
    email: 'test@auticare.test',
    firstName: 'Test',
    lastName: 'Parent',
    phoneNumber: null,
    socialMediaAccount: null,
    role: 'PARENT',
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    _resetRefreshState();
    authServiceMock = {
      refreshSession: vi.fn(),
      clearSessionAndRedirect: vi.fn(),
    };
    routerMock = {
      url: '/appointments',
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authRefreshInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    _resetRefreshState();
  });

  it('passes successful requests through untouched', () => {
    let result: unknown;
    http.get('/api/v1/appointments').subscribe((res) => {
      result = res;
    });

    const req = httpTesting.expectOne('/api/v1/appointments');
    req.flush({ data: [{ id: 'app_1' }] });

    expect(result).toEqual({ data: [{ id: 'app_1' }] });
    expect(authServiceMock.refreshSession).not.toHaveBeenCalled();
  });

  it('retries request once on 401 when refresh succeeds', () => {
    authServiceMock.refreshSession.mockReturnValue(of(dummyParent));

    let finalResponse: unknown;
    http.get('/api/v1/children').subscribe((res) => {
      finalResponse = res;
    });

    // 1. Initial request fails with 401
    const req1 = httpTesting.expectOne('/api/v1/children');
    req1.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Exactly one refresh call triggered
    expect(authServiceMock.refreshSession).toHaveBeenCalledTimes(1);

    // 2. The retried request
    const req2 = httpTesting.expectOne('/api/v1/children');
    req2.flush({ data: [{ id: 'child_1', firstName: 'Timmy' }] });

    expect(finalResponse).toEqual({ data: [{ id: 'child_1', firstName: 'Timmy' }] });
    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('redirects to login and clears state when refresh fails', () => {
    const refreshError = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/v1/auth/refresh',
    });
    authServiceMock.refreshSession.mockReturnValue(throwError(() => refreshError));

    let errorResult: unknown;
    http.get('/api/v1/screening/sessions').subscribe({
      next: () => {},
      error: (err) => {
        errorResult = err;
      },
    });

    const req = httpTesting.expectOne('/api/v1/screening/sessions');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refreshSession).toHaveBeenCalledTimes(1);
    expect(authServiceMock.clearSessionAndRedirect).toHaveBeenCalledWith('/appointments');
    expect(errorResult).toBeDefined();
  });

  it('handles concurrent 401s by firing exactly one shared refresh and retrying all queued requests', () => {
    authServiceMock.refreshSession.mockReturnValue(of(dummyParent));

    const responses: unknown[] = [];

    // Trigger three concurrent requests
    http.get('/api/v1/schools').subscribe((res) => responses.push(res));
    http.get('/api/v1/hospitals').subscribe((res) => responses.push(res));
    http.get('/api/v1/notifications').subscribe((res) => responses.push(res));

    const req1 = httpTesting.expectOne('/api/v1/schools');
    const req2 = httpTesting.expectOne('/api/v1/hospitals');
    const req3 = httpTesting.expectOne('/api/v1/notifications');

    // Both fail with 401 around the same time
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });
    req2.flush({}, { status: 401, statusText: 'Unauthorized' });
    req3.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Exactly ONE refresh request is dispatched
    expect(authServiceMock.refreshSession).toHaveBeenCalledTimes(1);

    // All three requests are retried
    const retry1 = httpTesting.expectOne('/api/v1/schools');
    const retry2 = httpTesting.expectOne('/api/v1/hospitals');
    const retry3 = httpTesting.expectOne('/api/v1/notifications');

    retry1.flush({ schools: [] });
    retry2.flush({ hospitals: [] });
    retry3.flush({ notifications: [] });

    expect(responses.length).toBe(3);
    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('does not retry or refresh if the retried request returns 401 again (prevents infinite refresh loop)', () => {
    authServiceMock.refreshSession.mockReturnValue(of(dummyParent));

    let errorEncountered: unknown;
    http.get('/api/v1/progress').subscribe({
      error: (err) => {
        errorEncountered = err;
      },
    });

    const req1 = httpTesting.expectOne('/api/v1/progress');
    req1.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refreshSession).toHaveBeenCalledTimes(1);

    // The retry request also fails with 401
    const req2 = httpTesting.expectOne('/api/v1/progress');
    req2.flush({}, { status: 401, statusText: 'Unauthorized' });

    // MUST NOT trigger a second refresh (no loop)
    expect(authServiceMock.refreshSession).toHaveBeenCalledTimes(1);
    expect(errorEncountered).toBeDefined();
  });

  it('does not intercept 401 on auth endpoints like login', () => {
    let error: unknown;
    http.post('/api/v1/auth/login', { email: 'a', password: 'b' }).subscribe({
      error: (err) => {
        error = err;
      },
    });

    const req = httpTesting.expectOne('/api/v1/auth/login');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.refreshSession).not.toHaveBeenCalled();
    expect(authServiceMock.clearSessionAndRedirect).not.toHaveBeenCalled();
    expect(error).toBeDefined();
  });
});
