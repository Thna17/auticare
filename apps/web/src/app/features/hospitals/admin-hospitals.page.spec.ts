import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { AdminHospitalAccountResponse } from '@auticare/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { AdminHospitalsPage } from './admin-hospitals.page';

describe('AdminHospitalsPage', () => {
  let httpTesting: HttpTestingController;

  const dummyHospitalAccounts: AdminHospitalAccountResponse[] = [
    {
      hospital: {
        id: 'hosp_1',
        name: 'Royal Phnom Penh Care',
        city: 'Phnom Penh',
        address: 'No 888 Russian Blvd',
        services: 'Pediatrics, Developmental Therapy',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      staff: {
        id: 'staff_1',
        hospitalId: 'hosp_1',
        parentId: 'parent_mgr_1',
        title: 'Lead Clinic Director',
      },
      account: {
        id: 'parent_mgr_1',
        email: 'director@royalcare.test',
        firstName: 'Dina',
        lastName: 'Director',
        role: 'HOSPITAL',
        phoneNumber: null,
        socialMediaAccount: null,
      },
    },
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminHospitalsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting?.verify();
  });

  it('loads and renders hospital accounts on initialization', () => {
    const fixture = TestBed.createComponent(AdminHospitalsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const req = httpTesting.expectOne('/api/v1/hospitals/admin/accounts');
    expect(req.request.method).toBe('GET');
    req.flush({ data: dummyHospitalAccounts });

    expect(component.loading()).toBe(false);
    expect(component.accounts().length).toBe(1);
    expect(component.accounts()[0].hospital.name).toBe('Royal Phnom Penh Care');
  });

  it('resends invitation for a hospital manager account', () => {
    const fixture = TestBed.createComponent(AdminHospitalsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const listReq = httpTesting.expectOne('/api/v1/hospitals/admin/accounts');
    listReq.flush({ data: dummyHospitalAccounts });

    component.resendInvitation('director@royalcare.test');
    expect(component.resendingEmail()).toBe('director@royalcare.test');

    const resendReq = httpTesting.expectOne('/api/v1/auth/invitations/resend');
    expect(resendReq.request.method).toBe('POST');
    expect(resendReq.request.body).toEqual({ email: 'director@royalcare.test' });
    resendReq.flush({ data: { message: 'Invitation resent successfully.' } });

    expect(component.resendingEmail()).toBeNull();
    expect(component.message()).toBe('Invitation resent successfully.');
  });
});
