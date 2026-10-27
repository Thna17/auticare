import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OrganizationInquiryResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { SchoolInquiriesPage } from './school-inquiries.page';

describe('SchoolInquiriesPage', () => {
  let fixture: ComponentFixture<SchoolInquiriesPage>;
  let component: SchoolInquiriesPage;
  let httpTesting: HttpTestingController;

  const mockInquiries: OrganizationInquiryResponse[] = [
    {
      id: 'inq_1',
      parentId: 'parent_1',
      parentName: 'Sokha Chan',
      parent: { firstName: 'Sokha', lastName: 'Chan', email: 'sokha@example.com' },
      schoolId: 'sch_1',
      schoolName: 'Hope Bridge Academy',
      hospitalId: null,
      hospitalName: null,
      childFirstName: 'Dara',
      subject: 'Inquiry on sensory room',
      message: 'Hello, we would like to know if your sensory room is available for daily use.',
      status: 'NEW',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolInquiriesPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolInquiriesPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads inquiries and marks as read', () => {
    fixture.detectChanges();

    const listReq = httpTesting.expectOne('/api/v1/inquiries/school');
    expect(listReq.request.method).toBe('GET');
    listReq.flush({ data: mockInquiries });

    expect(component.loading()).toBe(false);
    expect(component.inquiries().length).toBe(1);

    component.markAsRead(component.inquiries()[0]!);

    const markReq = httpTesting.expectOne('/api/v1/inquiries/school/inq_1/read');
    expect(markReq.request.method).toBe('POST');
    markReq.flush({
      data: {
        ...mockInquiries[0],
        status: 'READ',
      },
    });

    expect(component.inquiries()[0]?.status).toBe('READ');
  });
});
