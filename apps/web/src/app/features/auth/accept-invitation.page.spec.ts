import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import type { AcceptInvitationResponse, VerifyInvitationResponse } from '@auticare/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
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
    message: 'Account password configured successfully. You may now sign in.',
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
    const fixture = TestBed.createComponent(AcceptInvitationPage);
    const component = fixture.componentInstance;
    return { fixture, component };
  };

  it('verifies token from URL on init and populates invitation details', () => {
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

  it('handles verification error gracefully when token is invalid or expired', () => {
    const { fixture, component } = setupComponent('expired-token-xyz');
    fixture.detectChanges();

    const verifyReq = httpTesting.expectOne(
      '/api/v1/auth/invitations/verify?token=expired-token-xyz',
    );
    verifyReq.flush(
      { error: { message: 'This invitation has expired. Please request a new one.' } },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(component.verifying()).toBe(false);
    expect(component.verificationError()).toBe(
      'This invitation has expired. Please request a new one.',
    );
  });

  it('submits valid password setup and displays success message', () => {
    const { fixture, component } = setupComponent('valid-token-abc');
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
    expect(component.success()).toBe(dummyAcceptResponse.message);
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
