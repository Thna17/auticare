import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { ResetPasswordPage } from './reset-password.page';

describe('ResetPasswordPage', () => {
  let authServiceMock: { resetPassword: ReturnType<typeof vi.fn> };

  const createComponent = (token: string | null = 'sample-token-abc') => {
    authServiceMock = {
      resetPassword: vi.fn(),
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
                get: (key: string) => (key === 'token' ? token : null),
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ResetPasswordPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, component };
  };

  it('pre-populates token when present in query params', () => {
    const { component } = createComponent('url-token-123');
    expect(component.tokenFromUrl()).toBe(true);
    expect(component.form.controls.token.value).toBe('url-token-123');
    expect(component.showPassword()).toBe(false);
    expect(component.showConfirmPassword()).toBe(false);
  });

  it('toggles password and confirm password visibility', () => {
    const { component } = createComponent();

    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);

    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword()).toBe(true);
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword()).toBe(false);
  });

  it('rejects form when passwords do not match or are shorter than 12 chars', () => {
    const { component } = createComponent();

    component.form.controls.password.setValue('short');
    component.form.controls.confirmPassword.setValue('short');
    component.submit();

    expect(component.form.valid).toBe(false);
    expect(component.error()).toBe('Fix the highlighted fields before resetting your password.');

    component.form.controls.password.setValue('ValidPassword123');
    component.form.controls.confirmPassword.setValue('DifferentPassword123');
    component.submit();

    expect(component.form.hasError('passwordMismatch')).toBe(true);
  });

  it('submits valid new password and surfaces success message', () => {
    const { component } = createComponent('url-token-123');

    authServiceMock.resetPassword.mockReturnValue(
      of({
        message: 'Your password has been reset successfully.',
      }),
    );

    component.form.controls.password.setValue('SafeStrongPassword123!');
    component.form.controls.confirmPassword.setValue('SafeStrongPassword123!');
    component.submit();

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith({
      token: 'url-token-123',
      password: 'SafeStrongPassword123!',
    });
    expect(component.success()).toBe('Your password has been reset successfully.');
    expect(component.loading()).toBe(false);
  });

  it('handles reset error when token is invalid or expired', () => {
    const { component } = createComponent('expired-token');

    authServiceMock.resetPassword.mockReturnValue(throwError(() => new Error('Expired')));

    component.form.controls.password.setValue('SafeStrongPassword123!');
    component.form.controls.confirmPassword.setValue('SafeStrongPassword123!');
    component.submit();

    expect(component.error()).toBe(
      'This reset link is invalid or expired. Request a new link and try again.',
    );
    expect(component.loading()).toBe(false);
  });
});
