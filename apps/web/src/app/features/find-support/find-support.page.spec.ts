import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { HospitalResponse, SchoolResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { FindSupportPage } from './find-support.page';

describe('FindSupportPage', () => {
  let fixture: ComponentFixture<FindSupportPage>;
  let component: FindSupportPage;
  let httpTesting: HttpTestingController;

  const mockSchools: SchoolResponse[] = [
    {
      id: 'sch_1',
      name: 'Hope Bridge Academy',
      city: 'Phnom Penh',
      address: '77 Norodom Blvd',
      description: 'Inclusive school.',
      logoUrl: null,
      coverImageUrl: null,
      availabilityStatus: 'IMMEDIATE',
      waitlistEstimate: null,
      studentTeacherRatio: '4:1',
      specializations: ['Speech Therapy'],
      isVerified: true,
      rating: 4.8,
      reviewCount: 3,
      isFavorite: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockHospitals: HospitalResponse[] = [
    {
      id: 'hosp_1',
      name: 'Sunrise Children Clinic',
      city: 'Siem Reap',
      address: '12 River Road',
      services: 'Pediatric Care, Screening',
      description: null,
      phone: null,
      website: null,
      isFavorite: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindSupportPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FindSupportPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads and combines schools and hospitals directory', () => {
    fixture.detectChanges();

    const reqSchools = httpTesting.expectOne((r) => r.url === '/api/v1/schools');
    expect(reqSchools.request.method).toBe('GET');
    // The whole directory on one page, not the API's default of 20.
    expect(reqSchools.request.params.get('limit')).toBe('100');
    reqSchools.flush({
      data: { schools: mockSchools, pagination: { total: 1, page: 1, limit: 10, totalPages: 1 } },
    });

    const reqHospitals = httpTesting.expectOne('/api/v1/hospitals');
    expect(reqHospitals.request.method).toBe('GET');
    reqHospitals.flush({ data: mockHospitals });

    expect(component.loading()).toBe(false);
    expect(component.items().length).toBe(2);
    expect(component.filteredItems().length).toBe(2);
  });

  it('filters by type and favorites', () => {
    fixture.detectChanges();

    httpTesting
      .expectOne((r) => r.url === '/api/v1/schools')
      .flush({
        data: { schools: mockSchools, pagination: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      });
    httpTesting.expectOne('/api/v1/hospitals').flush({ data: mockHospitals });

    component.selectedType.set('HOSPITAL');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0]?.name).toBe('Sunrise Children Clinic');

    component.selectedType.set('ALL');
    component.favoritesOnly.set(true);
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0]?.isFavorite).toBe(true);
  });
});
