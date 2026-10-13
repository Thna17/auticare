import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AdminSchoolAccountResponse, SchoolResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { AdminSchoolsPage } from './admin-schools.page';

describe('AdminSchoolsPage', () => {
  let httpTesting: HttpTestingController;

  const mockAccounts: AdminSchoolAccountResponse[] = [
    {
      school: {
        id: 'school-1',
        name: 'Siem Reap Inclusive Academy',
        city: 'Siem Reap',
        address: 'Angkor Wat Blvd 10',
        description: 'Comprehensive autism support program.',
        logoUrl: null,
        coverImageUrl: null,
        availabilityStatus: 'IMMEDIATE',
        waitlistEstimate: null,
        studentTeacherRatio: '3:1',
        specializations: ['Early Intervention', 'Speech Therapy'],
        isVerified: false,
        rating: null,
        reviewCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      staff: {
        id: 'staff-1',
        parentId: 'parent-1',
        schoolId: 'school-1',
        title: 'Lead Coordinator',
      },
      account: {
        id: 'parent-1',
        email: 'coordinator@siemreap.edu.kh',
        firstName: 'Sophea',
        lastName: 'Chan',
        role: 'SCHOOL',
        phoneNumber: null,
        socialMediaAccount: null,
      },
      invitationSent: true,
    },
    {
      school: {
        id: 'school-2',
        name: 'Phnom Penh Hope School',
        city: 'Phnom Penh',
        address: 'Norodom Blvd 45',
        description: 'Specialized education and sensory rooms.',
        logoUrl: null,
        coverImageUrl: null,
        availabilityStatus: 'IMMEDIATE',
        waitlistEstimate: null,
        studentTeacherRatio: '2:1',
        specializations: ['Sensory Integration'],
        isVerified: true,
        rating: 4.8,
        reviewCount: 12,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      staff: {
        id: 'staff-2',
        parentId: 'parent-2',
        schoolId: 'school-2',
        title: 'Director',
      },
      account: {
        id: 'parent-2',
        email: 'director@hopeschool.edu.kh',
        firstName: 'Dara',
        lastName: 'Sok',
        role: 'SCHOOL',
        phoneNumber: null,
        socialMediaAccount: null,
      },
      invitationSent: true,
    },
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminSchoolsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'schools/admin/new', component: class {} }]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads and displays admin school accounts with verification status badges', () => {
    const fixture = TestBed.createComponent(AdminSchoolsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const req = httpTesting.expectOne('/api/v1/schools/admin/accounts');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockAccounts });

    fixture.detectChanges();

    expect(component.accounts().length).toBe(2);
    expect(component.accounts()[0].school.isVerified).toBe(false);
    expect(component.accounts()[1].school.isVerified).toBe(true);

    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('ac-ui-card');
    expect(cards.length).toBe(2);

    expect(el.textContent).toContain('Siem Reap Inclusive Academy');
    expect(el.textContent).toContain('Phnom Penh Hope School');
    expect(el.textContent).toContain('Unverified');
    expect(el.textContent).toContain('Verified');
  });

  it('toggles school verification from unverified to verified and displays toast', () => {
    const fixture = TestBed.createComponent(AdminSchoolsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const listReq = httpTesting.expectOne('/api/v1/schools/admin/accounts');
    listReq.flush({ data: mockAccounts });
    fixture.detectChanges();

    const target = component.accounts()[0];
    expect(target.school.isVerified).toBe(false);

    // Click toggle verification
    component.toggleVerification(target);
    expect(component.togglingSchoolId()).toBe('school-1');

    const patchReq = httpTesting.expectOne('/api/v1/schools/school-1');
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body).toEqual({ isVerified: true });

    const updatedSchool: SchoolResponse = {
      ...target.school,
      isVerified: true,
    };
    patchReq.flush({ data: updatedSchool });
    fixture.detectChanges();

    expect(component.togglingSchoolId()).toBeNull();
    expect(component.accounts()[0].school.isVerified).toBe(true);
    expect(component.toastMessage()).toContain('Siem Reap Inclusive Academy is now verified');

    const el: HTMLElement = fixture.nativeElement;
    const toast = el.querySelector('.toast');
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain('Siem Reap Inclusive Academy is now verified');
  });

  it('revokes verification from verified school and displays revocation toast', () => {
    const fixture = TestBed.createComponent(AdminSchoolsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const listReq = httpTesting.expectOne('/api/v1/schools/admin/accounts');
    listReq.flush({ data: mockAccounts });
    fixture.detectChanges();

    const target = component.accounts()[1];
    expect(target.school.isVerified).toBe(true);

    component.toggleVerification(target);

    const patchReq = httpTesting.expectOne('/api/v1/schools/school-2');
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body).toEqual({ isVerified: false });

    const updatedSchool: SchoolResponse = {
      ...target.school,
      isVerified: false,
    };
    patchReq.flush({ data: updatedSchool });
    fixture.detectChanges();

    expect(component.accounts()[1].school.isVerified).toBe(false);
    expect(component.toastMessage()).toContain('Verification revoked for Phnom Penh Hope School');
  });

  it('handles verification update failure gracefully', () => {
    const fixture = TestBed.createComponent(AdminSchoolsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const listReq = httpTesting.expectOne('/api/v1/schools/admin/accounts');
    listReq.flush({ data: mockAccounts });
    fixture.detectChanges();

    const target = component.accounts()[0];
    component.toggleVerification(target);

    const patchReq = httpTesting.expectOne('/api/v1/schools/school-1');
    patchReq.flush(
      { error: { message: 'Database connection failed' } },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(component.togglingSchoolId()).toBeNull();
    expect(component.accounts()[0].school.isVerified).toBe(false);
    expect(component.error()).toBe('Database connection failed');
  });
});
