import type { AdminDashboardResponse, ParentDashboardResponse } from '@auticare/contracts';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { DashboardApi } from './dashboard.api';

describe('DashboardApi', () => {
  let api: DashboardApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    api = TestBed.inject(DashboardApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('getParentDashboard queries /api/v1/dashboard/parent', () => {
    let result: ParentDashboardResponse | undefined;
    api.getParentDashboard().subscribe((data) => {
      result = data;
    });

    const req = httpTesting.expectOne('/api/v1/dashboard/parent');
    expect(req.request.method).toBe('GET');

    const mockResponse = {
      childrenCount: 1,
      selectedChild: null,
      upcomingAppointments: [],
      recentScreenings: [],
      activityProgress: null,
    };
    req.flush({ data: mockResponse });

    expect(result).toEqual(mockResponse);
  });

  it('getParentDashboard passes childId query param when provided', () => {
    let result: ParentDashboardResponse | undefined;
    api.getParentDashboard('child-123').subscribe((data) => {
      result = data;
    });

    const req = httpTesting.expectOne('/api/v1/dashboard/parent?childId=child-123');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('childId')).toBe('child-123');

    const mockResponse = {
      childrenCount: 1,
      selectedChild: null,
      upcomingAppointments: [],
      recentScreenings: [],
      activityProgress: null,
    };
    req.flush({ data: mockResponse });

    expect(result).toEqual(mockResponse);
  });

  it('getAdminDashboard queries /api/v1/dashboard/admin', () => {
    let result: AdminDashboardResponse | undefined;
    api.getAdminDashboard().subscribe((data) => {
      result = data;
    });

    const req = httpTesting.expectOne('/api/v1/dashboard/admin');
    expect(req.request.method).toBe('GET');

    const mockResponse = {
      stats: { totalUsers: 50, totalChildren: 40, totalAppointments: 15 },
    };
    req.flush({ data: mockResponse });

    expect(result).toEqual(mockResponse);
  });
});
