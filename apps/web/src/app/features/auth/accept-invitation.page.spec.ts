import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import type { AcceptInvitationResponse, VerifyInvitationResponse } from '@auticare/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { AcceptInvitationPage } from './accept-invitation.page';

describe('AcceptInvitationPage', () => {
  let httpTesting: HttpTestingController;

  const dummyVerified: VerifyInvitationResponse = {
    valid: true,
    email: 'new-staff@auticare.test',
    role: 'SCHOOL',
    firstName: 'Alice',
    lastName: 'Specialist',
    organizationName: 'AutiCare Academy',
  };

  const dummyAcceptResponse: AcceptInvitationResponse = {
    parent: {
      id: 'parent_new',
      email: 'new-staff@auticare.test',
      firstName: 'Alice',
      lastName: 'Specialist',
      role: 'SCHOOL',
      mustResetPassword: false,
      phoneNumber: null,
      socialMediaAccount: null,
    },
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    httpTesting?.verify();
  });

  const setupComponent = (token: string | null = 'test-token-123') => {
    TestBed.configureTestingModule({
      imports: [AcceptInvitationPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? token : null),
              },
            },
          },
        },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const auth = TestBed.inject(AuthService);
    const fixture = TestBed.createComponent(AcceptInvitationPage);
    const component = fixture.componentInstance;
    return { fixture, component, router, auth };
  };

  it('reads token into signal and strips it from the address bar on load', () => {
    TestBed.configureTestingModule({
      imports: [AcceptInvitationPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? 'secret-token-123' : null),
              },
            },
          },
        },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(AcceptInvitationPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.token()).toBe('secret-token-123');
    expect(navigateSpy).toHaveBeenCalledWith([], { queryParams: {}, replaceUrl: true });

    const verifyReq = httpTesting.expectOne(
      '/api/v1/auth/invitations/verify?token=secret-token-123',
    );
    verifyReq.flush({ data: dummyVerified });
  });

  it('verifies token on init and populates invitation details', () => {
    const { fixture, component } = setupComponent('valid-token-abc');
    fixture.detectChanges();

    const verifyReq = httpTesting.expectOne(
      '/api/v1/auth/invitations/verify?token=valid-token-abc',
    );
    expect(verifyReq.request.method).toBe('GET');
    verifyReq.flush({ data: dummyVerified });

    expect(component.verifying()).toBe(false);
    expect(component.invitationDetails()).toEqual(dummyVerified);
    expect(component.verificationError()).toBeNull();
  });

  it('does not have 6-digit code UI or form controls', () => {
    const { fixture, component } = setupComponent('valid-token-abc');
    fixture.detectChanges();

    const verifyReq = httpTesting.expectOne(
      '/api/v1/auth/invitations/verify?token=valid-token-abc',
    );
    verifyReq.flush({ data: dummyVerified });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.send-code-btn')).toBeNull();
    expect(el.querySelector('input[formControlName="code"]')).toBeNull();
    expect(el.textContent).not.toContain('6-digit verification code');
    expect(el.textContent).not.toContain('Send code');
    expect(component.form.contains('code' as never)).toBe(false);
  });

  it('auto signs in after setting password and navigates to the role home', () => {
    const { fixture, component, router, auth } = setupComponent('valid-token-abc');
    const navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();

    const verifyReq = httpTesting.expectOne(
      '/api/v1/auth/invitations/verify?token=valid-token-abc',
    );
    verifyReq.flush({ data: dummyVerified });

    component.form.controls.password.setValue('SuperSecretPassword123!');
    component.form.controls.confirmPassword.setValue('SuperSecretPassword123!');

    component.submit();
    expect(component.submitting()).toBe(true);

    const acceptReq = httpTesting.expectOne('/api/v1/auth/invitations/accept');
    expect(acceptReq.request.method).toBe('POST');
    expect(acceptReq.request.body).toEqual({
      token: 'valid-token-abc',
      password: 'SuperSecretPassword123!',
    });
    acceptReq.flush({ data: dummyAcceptResponse });

    expect(component.submitting()).toBe(false);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.parent()).toEqual(dummyAcceptResponse.parent);
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/schools/enrollments', { replaceUrl: true });
  });

  it('rejects form if passwords do not match or are too short', () => {
    const { fixture, component } = setupComponent(null);
    fixture.detectChanges();

    component.form.controls.token.setValue('any-token');
    component.form.controls.password.setValue('short');
    component.form.controls.confirmPassword.setValue('short');

    component.submit();
    expect(component.error()).toBe('Fix the highlighted fields before activating your account.');

    component.form.controls.password.setValue('LongEnoughPassword123');
    component.form.controls.confirmPassword.setValue('MismatchPassword123');
    component.submit();
    expect(component.error()).toBe('Fix the highlighted fields before activating your account.');
  });
});
