import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SchoolDetailResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { SupportDetailPage } from './support-detail.page';

describe('SupportDetailPage', () => {
  let fixture: ComponentFixture<SupportDetailPage>;
  let component: SupportDetailPage;
  let httpTesting: HttpTestingController;

  const mockSchoolDetail: SchoolDetailResponse = {
    id: 'sch_1',
    name: 'Hope Bridge Academy',
    city: 'Phnom Penh',
    address: '77 Norodom Blvd',
    phone: null,
    description: 'Inclusive education center.',
    logoUrl: null,
    coverImageUrl: null,
    availabilityStatus: 'IMMEDIATE',
    waitlistEstimate: '2 weeks',
    studentTeacherRatio: '4:1',
    specializations: ['Speech Therapy'],
    isVerified: true,
    rating: 4.8,
    reviewCount: 3,
    email: 'info@hopebridge.edu.kh',
    website: 'https://hopebridge.edu.kh',
    admissionRequirements: null,
    operatingHours: '8:00 - 16:00',
    facilities: ['Sensory Room'],
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'type' ? 'school' : 'sch_1'),
              },
            },
          },
        },
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportDetailPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads school detail and children list', () => {
    fixture.detectChanges();

    const schoolReq = httpTesting.expectOne('/api/v1/schools/sch_1');
    expect(schoolReq.request.method).toBe('GET');
    schoolReq.flush({ data: mockSchoolDetail });

    const childrenReq = httpTesting.expectOne('/api/v1/children');
    expect(childrenReq.request.method).toBe('GET');
    childrenReq.flush({ data: [] });

    expect(component.loading()).toBe(false);
    expect(component.detail()?.name).toBe('Hope Bridge Academy');
    expect(component.detail()?.isVerified).toBe(true);
    expect(component.googleMapsUrl()).toContain('google.com/maps/search');
  });

  it('submits inquiry successfully', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/v1/schools/sch_1').flush({ data: mockSchoolDetail });
    httpTesting.expectOne('/api/v1/children').flush({ data: [] });

    component.openInquiryModal();
    component.inquirySubject.set('Program Inquiry');
    component.inquiryMessage.set('Interested in enrollment for next term.');
    component.submitInquiry();

    const inqReq = httpTesting.expectOne('/api/v1/inquiries');
    expect(inqReq.request.method).toBe('POST');
    expect(inqReq.request.body).toEqual({
      schoolId: 'sch_1',
      childFirstName: null,
      subject: 'Program Inquiry',
      message: 'Interested in enrollment for next term.',
    });
    inqReq.flush({
      data: {
        id: 'inq_1',
        schoolId: 'sch_1',
        hospitalId: null,
        childFirstName: null,
        subject: 'Program Inquiry',
        message: 'Interested in enrollment for next term.',
        status: 'NEW',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(component.showInquiryModal()).toBe(false);
    expect(component.inquirySuccess()).toBe(true);
  });
});
