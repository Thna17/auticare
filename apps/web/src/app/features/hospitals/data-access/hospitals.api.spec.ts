import type { HospitalResponse } from '@auticare/contracts';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { HospitalsApi } from './hospitals.api';

describe('HospitalsApi', () => {
  let api: HospitalsApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    api = TestBed.inject(HospitalsApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('listHospitals fetches hospital list', () => {
    let result: HospitalResponse[] | undefined;
    api.listHospitals().subscribe((data) => {
      result = data;
    });

    const req = httpTesting.expectOne('/api/v1/hospitals');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [{ id: 'hosp_1', name: 'Children Hospital' }] });

    expect(result).toEqual([{ id: 'hosp_1', name: 'Children Hospital' }]);
  });

  it('createHospital posts new hospital data', () => {
    const input = {
      name: 'Sunrise Clinic',
      city: 'Siem Reap',
      address: 'Street 5',
      services: 'Diagnosis',
    };
    api.createHospital(input).subscribe();

    const req = httpTesting.expectOne('/api/v1/hospitals');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ data: { id: 'hosp_2', ...input } });
  });

  it('createHospitalAccount posts new account creation request', () => {
    const input = {
      hospital: {
        name: 'Sunrise Clinic',
        city: 'Siem Reap',
        address: 'Street 5',
        services: 'Diagnosis',
      },
      account: {
        email: 'staff@sunrise.test',
        firstName: 'Anna',
        lastName: 'Smith',
        title: 'Pediatrician',
      },
    };
    api.createHospitalAccount(input).subscribe();

    const req = httpTesting.expectOne('/api/v1/hospitals/admin/accounts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ data: { account: { id: 'user_1', email: input.account.email } } });
  });

  it('resendInvitation posts invitation resend request', () => {
    api.resendInvitation({ email: 'staff@sunrise.test' }).subscribe();

    const req = httpTesting.expectOne('/api/v1/auth/invitations/resend');
    expect(req.request.method).toBe('POST');
    req.flush({ data: { success: true } });
  });
});
