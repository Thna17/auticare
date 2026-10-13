import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterPage, describeRegisterError } from './register.page';

describe('RegisterPage password matching and validation', () => {
  let page: RegisterPage;
  let form: RegisterPage['form'];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(RegisterPage);
    page = fixture.componentInstance;
    form = page.form;
  });

  const fill = (password: string, confirmPassword: string) => {
    form.patchValue({
      fullName: 'Journey Parent',
      email: 'parent@example.com',
      password,
      confirmPassword,
      terms: true,
    });
  };

  it('initializes with PARENT role and hidden passwords', () => {
    expect(page.selectedRole()).toBe('PARENT');
    expect(page.showPassword()).toBe(false);
    expect(page.showConfirmPassword()).toBe(false);
  });

  it('updates selected role when switching to SCHOOL or HOSPITAL', () => {
    page.selectRole('SCHOOL');
    expect(page.selectedRole()).toBe('SCHOOL');

    page.selectRole('HOSPITAL');
    expect(page.selectedRole()).toBe('HOSPITAL');

    page.selectRole('PARENT');
    expect(page.selectedRole()).toBe('PARENT');
  });

  it('toggles password and confirm password visibility', () => {
    page.togglePasswordVisibility();
    expect(page.showPassword()).toBe(true);
    page.togglePasswordVisibility();
    expect(page.showPassword()).toBe(false);

    page.toggleConfirmPasswordVisibility();
    expect(page.showConfirmPassword()).toBe(true);
    page.toggleConfirmPasswordVisibility();
    expect(page.showConfirmPassword()).toBe(false);
  });

  it('rejects the form when the two passwords differ', () => {
    fill('AutiCarePassword123', 'AutiCarePassword124');

    expect(form.errors?.['passwordMismatch']).toBe(true);
    expect(form.valid).toBe(false);
  });

  it('accepts the form when they match', () => {
    fill('AutiCarePassword123', 'AutiCarePassword123');

    expect(form.errors).toBeNull();
    expect(form.valid).toBe(true);
  });

  it('does not report a mismatch while the second field is still empty', () => {
    fill('AutiCarePassword123', '');

    expect(form.errors).toBeNull();
    expect(form.controls.confirmPassword.hasError('required')).toBe(true);
  });

  it('keeps the form invalid until the terms box is ticked', () => {
    fill('AutiCarePassword123', 'AutiCarePassword123');
    form.controls.terms.setValue(false);

    expect(form.valid).toBe(false);
    expect(form.controls.terms.hasError('required')).toBe(true);
  });

  it('requires a password of at least 12 characters', () => {
    fill('Short123', 'Short123');

    expect(form.controls.password.hasError('minlength')).toBe(true);
    expect(form.valid).toBe(false);
  });
});

describe('describeRegisterError', () => {
  it('surfaces backend 409 conflict message when available', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        error: {
          code: 'CONFLICT',
          message: 'An account with this email address already exists.',
        },
      },
    });

    expect(describeRegisterError(error)).toBe('An account with this email address already exists.');
  });

  it('falls back to default conflict message if 409 lacks custom message', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: null,
    });

    expect(describeRegisterError(error)).toBe('An account with this email address already exists.');
  });

  it('handles network failure (status 0)', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
    });

    expect(describeRegisterError(error)).toBe(
      'Cannot reach the AutiCare server. Check that the API is running and try again.',
    );
  });

  it('handles server errors (500+)', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });

    expect(describeRegisterError(error)).toBe('Server error (500). Please try again in a moment.');
  });

  it('handles non-HttpErrorResponse fallback', () => {
    expect(describeRegisterError(new Error('Unknown issue'))).toBe(
      'Registration failed. Please review the form and try again.',
    );
  });
});
