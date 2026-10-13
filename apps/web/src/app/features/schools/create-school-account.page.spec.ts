import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { CreateSchoolAccountPage } from './create-school-account.page';

describe('CreateSchoolAccountPage', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CreateSchoolAccountPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'schools/admin', component: class {} }]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting?.verify();
  });

  it('renders top back to directory breadcrumb and cancel button linking to /schools/admin', () => {
    const fixture = TestBed.createComponent(CreateSchoolAccountPage);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const backLink = el.querySelector('.back-link') as HTMLAnchorElement;
    expect(backLink).toBeTruthy();
    expect(backLink.textContent).toContain('← Back to Directory');
    expect(backLink.getAttribute('href') || backLink.getAttribute('routerlink')).toBeTruthy();

    const cancelBtn = el.querySelector('.cancel-btn') as HTMLAnchorElement;
    expect(cancelBtn).toBeTruthy();
    expect(cancelBtn.textContent).toContain('Cancel');
  });

  it('validates required fields before submitting', () => {
    const fixture = TestBed.createComponent(CreateSchoolAccountPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.submit();
    expect(component.error()).toBe('Fix the highlighted fields before creating the account.');
    expect(component.saving()).toBe(false);
  });

  it('submits valid school provisioning request without password and triggers invitation', () => {
    const fixture = TestBed.createComponent(CreateSchoolAccountPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      school: {
        name: 'Sensory Steps Inclusive School',
        city: 'Siem Reap',
        address: 'Charles de Gaulle Ave 42',
        description: 'Comprehensive early intervention & inclusive education.',
      },
      account: {
        email: 'coordinator@sensorysteps.test',
        firstName: 'Sophea',
        lastName: 'Manager',
        title: 'Lead Coordinator',
      },
    });

    component.submit();
    expect(component.saving()).toBe(true);

    const req = httpTesting.expectOne('/api/v1/schools/admin/accounts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      school: {
        name: 'Sensory Steps Inclusive School',
        city: 'Siem Reap',
        address: 'Charles de Gaulle Ave 42',
        description: 'Comprehensive early intervention & inclusive education.',
      },
      account: {
        email: 'coordinator@sensorysteps.test',
        firstName: 'Sophea',
        lastName: 'Manager',
        title: 'Lead Coordinator',
      },
    });

    req.flush({
      data: {
        school: {
          id: 'school-10',
          name: 'Sensory Steps Inclusive School',
          city: 'Siem Reap',
          address: 'Charles de Gaulle Ave 42',
          description: 'Comprehensive early intervention & inclusive education.',
          logoUrl: null,
          coverImageUrl: null,
          availabilityStatus: 'IMMEDIATE',
          waitlistEstimate: null,
          studentTeacherRatio: null,
          specializations: [],
          isVerified: false,
          rating: null,
          reviewCount: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        staff: {
          id: 'staff-10',
          schoolId: 'school-10',
          parentId: 'parent-10',
          title: 'Lead Coordinator',
        },
        account: {
          id: 'parent-10',
          email: 'coordinator@sensorysteps.test',
          firstName: 'Sophea',
          lastName: 'Manager',
          role: 'SCHOOL',
          phoneNumber: null,
          socialMediaAccount: null,
        },
        invitationSent: true,
      },
    });

    expect(component.saving()).toBe(false);
    expect(component.message()).toContain('Invitation sent for Sensory Steps Inclusive School.');
  });
});
