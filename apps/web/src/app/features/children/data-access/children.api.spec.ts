import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ChildrenApi } from './children.api';

describe('ChildrenApi', () => {
  let api: ChildrenApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    api = TestBed.inject(ChildrenApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('listChildren queries /api/v1/children by default', () => {
    api.listChildren().subscribe();

    const req = httpTesting.expectOne('/api/v1/children');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('listChildren appends includeArchived=true when requested', () => {
    api.listChildren({ includeArchived: true }).subscribe();

    const req = httpTesting.expectOne('/api/v1/children?includeArchived=true');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('getChild fetches single child profile by ID', () => {
    api.getChild('c_1').subscribe();

    const req = httpTesting.expectOne('/api/v1/children/c_1');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        id: 'c_1',
        firstName: 'Leo',
        dateOfBirth: '2020-01-01',
        notes: null,
        archivedAt: null,
      },
    });
  });

  it('archiveChild sends DELETE request', () => {
    api.archiveChild('c_1').subscribe();

    const req = httpTesting.expectOne('/api/v1/children/c_1');
    expect(req.request.method).toBe('DELETE');
    req.flush({
      data: {
        id: 'c_1',
        firstName: 'Leo',
        dateOfBirth: '2020-01-01',
        notes: null,
        archivedAt: '2026-10-10T00:00:00.000Z',
      },
    });
  });

  it('restoreChild sends POST request to restore endpoint', () => {
    api.restoreChild('c_1').subscribe();

    const req = httpTesting.expectOne('/api/v1/children/c_1/restore');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({
      data: {
        id: 'c_1',
        firstName: 'Leo',
        dateOfBirth: '2020-01-01',
        notes: null,
        archivedAt: null,
      },
    });
  });
});
