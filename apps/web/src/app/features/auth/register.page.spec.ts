import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterPage } from './register.page';

/**
 * Driven through the component rather than by importing the validator.
 *
 * matchingPasswords is a module-local function; calling it directly would pass
 * whether or not it is attached to the form, which is the failure that actually
 * matters. Building the component proves the wiring as well as the rule.
 */
describe('RegisterPage password matching', () => {
  let form: RegisterPage['form'];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    form = TestBed.createComponent(RegisterPage).componentInstance.form;
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
    // Otherwise the error appears the moment someone starts typing the first
    // password, before they could possibly have confirmed it.
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
    // The server enforces the same floor, so a shorter one would be refused
    // after a round trip rather than at the keyboard.
    expect(form.valid).toBe(false);
  });
});
