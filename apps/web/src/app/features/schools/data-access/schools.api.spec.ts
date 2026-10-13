import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { SchoolsApi } from './schools.api';

describe('SchoolsApi', () => {
  let api: SchoolsApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    api = TestBed.inject(SchoolsApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('listSchools queries /api/v1/schools with query parameters including isFavorite', () => {
    api
      .listSchools({ search: 'Oak', province: 'Phnom Penh', isFavorite: true, page: 2 })
      .subscribe();

    const req = httpTesting.expectOne((r) => r.url === '/api/v1/schools');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('Oak');
    expect(req.request.params.get('province')).toBe('Phnom Penh');
    expect(req.request.params.get('isFavorite')).toBe('true');
    expect(req.request.params.get('page')).toBe('2');

    req.flush({
      data: {
        schools: [],
        total: 0,
        page: 2,
        totalPages: 0,
      },
    });
  });

  it('getSchoolById fetches single school by ID', () => {
    api.getSchoolById('sch_123').subscribe();

    const req = httpTesting.expectOne('/api/v1/schools/sch_123');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { id: 'sch_123', name: 'Sunny School' } });
  });

  it('getDashboard retrieves school dashboard telemetry', () => {
    api.getDashboard().subscribe();

    const req = httpTesting.expectOne('/api/v1/schools/me/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { schoolName: 'Oak Academy', totalStudents: 15, activeEnrollments: 12 } });
  });

  it('listReportsWithChild fetches reports with pagination and childId', () => {
    api.listReportsWithChild({ page: 1, childId: 'ch_456' }).subscribe();

    const req = httpTesting.expectOne((r) => r.url === '/api/v1/schools/reports');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('childId')).toBe('ch_456');
    req.flush({ data: { reports: [], total: 0, page: 1, limit: 10, totalPages: 0 } });
  });

  it('getEnrollmentStats fetches aggregated enrollment statistics', () => {
    api.getEnrollmentStats().subscribe();

    const req = httpTesting.expectOne('/api/v1/schools/enrollments/stats');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { totalEnrolled: 25, pendingReview: 3, capacity: 30 } });
  });

  it('addFavorite sends POST to /api/v1/schools/:id/favorites', () => {
    api.addFavorite('sch_1').subscribe((res) => {
      expect(res.favorited).toBe(true);
    });

    const req = httpTesting.expectOne('/api/v1/schools/sch_1/favorites');
    expect(req.request.method).toBe('POST');
    req.flush({ data: { schoolId: 'sch_1', parentId: 'p_1', favorited: true } });
  });

  it('removeFavorite sends DELETE to /api/v1/schools/:id/favorites', () => {
    api.removeFavorite('sch_1').subscribe((res) => {
      expect(res.favorited).toBe(false);
    });

    const req = httpTesting.expectOne('/api/v1/schools/sch_1/favorites');
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: { schoolId: 'sch_1', parentId: 'p_1', favorited: false } });
  });

  it('listReviews sends GET to /api/v1/schools/:id/reviews', () => {
    api.listReviews('sch_1').subscribe((res) => {
      expect(res.reviews.length).toBe(1);
      expect(res.averageRating).toBe(4.5);
    });

    const req = httpTesting.expectOne('/api/v1/schools/sch_1/reviews');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        reviews: [
          {
            id: 'rev_1',
            schoolId: 'sch_1',
            parentId: 'p_1',
            parentName: 'Alice',
            rating: 5,
            comment: 'Great school!',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        averageRating: 4.5,
        totalReviews: 1,
      },
    });
  });

  it('createReview sends POST to /api/v1/schools/:id/reviews', () => {
    api.createReview('sch_1', { rating: 5, comment: 'Exceptional staff' }).subscribe((res) => {
      expect(res.rating).toBe(5);
    });

    const req = httpTesting.expectOne('/api/v1/schools/sch_1/reviews');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rating: 5, comment: 'Exceptional staff' });
    req.flush({
      data: {
        id: 'rev_1',
        schoolId: 'sch_1',
        parentId: 'p_1',
        parentName: 'Alice',
        rating: 5,
        comment: 'Exceptional staff',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });
});
