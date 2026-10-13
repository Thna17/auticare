import type { ParentActivityReportListResponse } from '@auticare/contracts';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ParentActivityApi } from './parent-activity.api';

describe('ParentActivityApi', () => {
  let api: ParentActivityApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    api = TestBed.inject(ParentActivityApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('listActivityReports queries /api/v1/parents/activity-reports/:childId with page', () => {
    let result: ParentActivityReportListResponse | undefined;
    api.listActivityReports('child_99', 2).subscribe((data) => {
      result = data;
    });

    const req = httpTesting.expectOne('/api/v1/parents/activity-reports/child_99?page=2');
    expect(req.request.method).toBe('GET');

    const mockResponse = { reports: [], total: 0, page: 2, totalPages: 0 };
    req.flush({ data: mockResponse });

    expect(result).toEqual(mockResponse);
  });
});
