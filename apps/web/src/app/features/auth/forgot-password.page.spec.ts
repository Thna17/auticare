import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { ForgotPasswordPage } from './forgot-password.page';

describe('ForgotPasswordPage', () => {
  let authServiceMock: { requestPasswordReset: ReturnType<typeof vi.fn> };

  const createComponent = () => {
    authServiceMock = {
      requestPasswordReset: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    const fixture = TestBed.createComponent(ForgotPasswordPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, component };
  };

  it('initializes with an empty form and no result', () => {
    const { component } = createComponent();
    expect(component.form.valid).toBe(false);
    expect(component.result()).toBeNull();
    expect(component.error()).toBeNull();
  });

  it('rejects submission with invalid email format', () => {
    const { component } = createComponent();

    component.form.controls.email.setValue('not-an-email');
    component.submit();

    expect(component.form.valid).toBe(false);
    expect(component.error()).toBe('Fix the highlighted field before requesting a reset link.');
    expect(authServiceMock.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('submits valid email and presents success state feedback', () => {
    const { component } = createComponent();

    authServiceMock.requestPasswordReset.mockReturnValue(
      of({
        message: 'Password reset link sent to parent@auticare.test',
        resetUrl: 'http://localhost/reset-password?token=mock123',
      }),
    );

    component.form.controls.email.setValue('parent@auticare.test');
    component.submit();

    expect(authServiceMock.requestPasswordReset).toHaveBeenCalledWith({
      email: 'parent@auticare.test',
    });
    expect(component.loading()).toBe(false);
    expect(component.result()?.message).toBe('Password reset link sent to parent@auticare.test');
  });

  it('handles backend error gracefully and displays error feedback', () => {
    const { component } = createComponent();

    authServiceMock.requestPasswordReset.mockReturnValue(
      throwError(() => new Error('Server error')),
    );

    component.form.controls.email.setValue('parent@auticare.test');
    component.submit();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Could not prepare a reset link. Please try again.');
  });

  it('resets form when calling resetForm()', () => {
    const { component } = createComponent();

    component.result.set({ message: 'Sent' });
    component.resetForm();

    expect(component.result()).toBeNull();
    expect(component.form.controls.email.value).toBe('');
  });
});
