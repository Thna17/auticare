import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { CreateHospitalAccountPage } from './create-hospital-account.page';

describe('CreateHospitalAccountPage', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CreateHospitalAccountPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'hospitals/admin', component: class {} }]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting?.verify();
  });

  it('renders top back to directory breadcrumb and cancel button linking to /hospitals/admin', () => {
    const fixture = TestBed.createComponent(CreateHospitalAccountPage);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const backLink = el.querySelector('.back-link') as HTMLAnchorElement;
    expect(backLink).toBeTruthy();
    expect(backLink.textContent).toContain('← Back to Directory');

    const cancelBtn = el.querySelector('.cancel-btn') as HTMLAnchorElement;
    expect(cancelBtn).toBeTruthy();
    expect(cancelBtn.textContent).toContain('Cancel');
  });

  it('validates required fields before submitting', () => {
    const fixture = TestBed.createComponent(CreateHospitalAccountPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.submit();
    expect(component.error()).toBe('Fix the highlighted fields before creating the account.');
    expect(component.saving()).toBe(false);
  });

  it('submits valid hospital provisioning request without password and triggers invitation', () => {
    const fixture = TestBed.createComponent(CreateHospitalAccountPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      hospital: {
        name: 'Sensory Steps Pediatric Clinic',
        city: 'Siem Reap',
        address: 'Charles de Gaulle Ave 42',
        services: 'Occupational Therapy, Speech Therapy',
      },
      account: {
        email: 'manager@sensorysteps.test',
        firstName: 'Sophea',
        lastName: 'Manager',
        title: 'Clinic Manager',
      },
    });

    component.submit();
    expect(component.saving()).toBe(true);

    const req = httpTesting.expectOne('/api/v1/hospitals/admin/accounts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      hospital: {
        name: 'Sensory Steps Pediatric Clinic',
        city: 'Siem Reap',
        address: 'Charles de Gaulle Ave 42',
        services: 'Occupational Therapy, Speech Therapy',
      },
      account: {
        email: 'manager@sensorysteps.test',
        firstName: 'Sophea',
        lastName: 'Manager',
        title: 'Clinic Manager',
      },
    });

    req.flush({
      data: {
        hospital: { id: 'hosp_ss', name: 'Sensory Steps Pediatric Clinic' },
        account: { email: 'manager@sensorysteps.test', role: 'HOSPITAL' },
        invitationSent: true,
      },
    });

    expect(component.saving()).toBe(false);
    expect(component.message()).toBe('Invitation sent for Sensory Steps Pediatric Clinic.');
  });
});
