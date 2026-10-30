import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { LoginPage, describeLoginError } from './login.page';

describe('LoginPage', () => {
  let authServiceMock: { login: ReturnType<typeof vi.fn> };
  let router: Router;

  const createComponent = (returnUrl: string | null = null) => {
    authServiceMock = {
      login: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'returnUrl' ? returnUrl : null),
              },
            },
          },
        },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(LoginPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, component };
  };

  it('initializes with hidden password', () => {
    const { component } = createComponent();
    expect(component.showPassword()).toBe(false);
  });

  it('toggles password visibility state', () => {
    const { component } = createComponent();

    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);

    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });

  it('rejects submission with empty fields and sets validation error', () => {
    const { component } = createComponent();

    component.submit();

    expect(component.form.valid).toBe(false);
    expect(component.error()).toBe('Fix the highlighted fields before logging in.');
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('submits valid credentials and routes PARENT user to /dashboard', () => {
    const { component } = createComponent();

    authServiceMock.login.mockReturnValue(
      of({
        id: 'p-1',
        email: 'parent@auticare.test',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'PARENT',
        mustResetPassword: false,
        phoneNumber: null,
        socialMediaAccount: null,
      }),
    );

    component.form.setValue({
      email: 'parent@auticare.test',
      password: 'SecurePassword123',
    });

    component.submit();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'parent@auticare.test',
      password: 'SecurePassword123',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('routes HOSPITAL coordinator to /hospital/dashboard', () => {
    const { component } = createComponent();

    authServiceMock.login.mockReturnValue(
      of({
        id: 'h-1',
        email: 'hospital@auticare.test',
        firstName: 'Dr.',
        lastName: 'Specialist',
        role: 'HOSPITAL',
        mustResetPassword: false,
        phoneNumber: null,
        socialMediaAccount: null,
      }),
    );

    component.form.setValue({
      email: 'hospital@auticare.test',
      password: 'HospitalPassword123',
    });

    component.submit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/hospital/dashboard');
  });

  it('routes SCHOOL staff to /schools/enrollments', () => {
    const { component } = createComponent();

    authServiceMock.login.mockReturnValue(
      of({
        id: 's-1',
        email: 'teacher@school.test',
        firstName: 'Sarah',
        lastName: 'Educator',
        role: 'SCHOOL',
        mustResetPassword: false,
        phoneNumber: null,
        socialMediaAccount: null,
      }),
    );

    component.form.setValue({
      email: 'teacher@school.test',
      password: 'TeacherPassword123',
    });

    component.submit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/schools/enrollments');
  });

  it('routes ADMIN user to /dashboard', () => {
    const { component } = createComponent();

    authServiceMock.login.mockReturnValue(
      of({
        id: 'a-1',
        email: 'admin@auticare.local',
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        mustResetPassword: false,
        phoneNumber: null,
        socialMediaAccount: null,
      }),
    );

    component.form.setValue({
      email: 'admin@auticare.local',
      password: 'AutiCareAdminPassword123',
    });

    component.submit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('honors valid returnUrl parameter', () => {
    const { component } = createComponent('/appointments/book');

    authServiceMock.login.mockReturnValue(
      of({
        id: 'p-1',
        email: 'parent@auticare.test',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'PARENT',
        mustResetPassword: false,
        phoneNumber: null,
        socialMediaAccount: null,
      }),
    );

    component.form.setValue({
      email: 'parent@auticare.test',
      password: 'SecurePassword123',
    });

    component.submit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/appointments/book');
  });

  it('handles login failure and surfaces user-friendly error message', () => {
    const { component } = createComponent();

    authServiceMock.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          }),
      ),
    );

    component.form.setValue({
      email: 'parent@auticare.test',
      password: 'WrongPassword',
    });

    component.submit();
    expect(component.error()).toBe('Log in failed. Check your email and password.');
    expect(component.loading()).toBe(false);
  });
});

describe('describeLoginError', () => {
  it('returns specific message for 401 unauthorized', () => {
    const err = new HttpErrorResponse({ status: 401 });
    expect(describeLoginError(err)).toBe('Log in failed. Check your email and password.');
  });

  it('returns connection guidance for status 0 network error', () => {
    const err = new HttpErrorResponse({ status: 0 });
    expect(describeLoginError(err)).toBe(
      'Cannot reach the AutiCare server. Check that the API is running and try again.',
    );
  });

  it('returns server error message for 500 status', () => {
    const err = new HttpErrorResponse({ status: 500 });
    expect(describeLoginError(err)).toBe('Server error (500). Please try again in a moment.');
  });

  it('returns generic message for non-http errors', () => {
    expect(describeLoginError(new Error('Random'))).toBe('Log in failed. Please try again.');
  });
});
