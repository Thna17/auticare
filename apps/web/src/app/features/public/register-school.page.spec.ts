import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../core/i18n/i18n.service';
import { SchoolRegistrationsService } from '../admin/data-access/school-registrations.service';
import { RegisterSchoolPage } from './register-school.page';

describe('RegisterSchoolPage', () => {
  const registrationsService = {
    submit: vi.fn(() => of({ received: true })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [RegisterSchoolPage],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: SchoolRegistrationsService, useValue: registrationsService },
      ],
    });
    TestBed.inject(I18nService).setLanguage('en');
  });

  const setupComponent = () => {
    const fixture = TestBed.createComponent(RegisterSchoolPage);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      el: fixture.nativeElement as HTMLElement,
    };
  };

  it('initializes with invalid empty form and does not submit', () => {
    const { component } = setupComponent();
    expect(component.form.valid).toBe(false);

    component.submit();
    expect(component.errorMessage()).toContain('correct the highlighted fields');
    expect(registrationsService.submit).not.toHaveBeenCalled();
    expect(component.submitted()).toBe(false);
  });

  it('submits valid registration request and shows success screen', () => {
    const { fixture, component, el } = setupComponent();

    component.form.setValue({
      schoolName: 'Sunrise Academy',
      city: 'Phnom Penh',
      address: 'Street 2004',
      contactFirstName: 'Sophea',
      contactLastName: 'Chan',
      contactTitle: 'Principal',
      email: 'Principal@Sunrise.edu.kh',
      phone: '+855 12 345 678',
      studentCount: 300,
      message: 'Looking to support autism inclusion.',
    });
    fixture.detectChanges();

    expect(component.form.valid).toBe(true);

    component.submit();
    fixture.detectChanges();

    expect(registrationsService.submit).toHaveBeenCalledWith({
      schoolName: 'Sunrise Academy',
      city: 'Phnom Penh',
      address: 'Street 2004',
      contactFirstName: 'Sophea',
      contactLastName: 'Chan',
      contactTitle: 'Principal',
      email: 'principal@sunrise.edu.kh',
      phone: '+855 12 345 678',
      studentCount: 300,
      message: 'Looking to support autism inclusion.',
    });

    expect(component.submitted()).toBe(true);
    expect(el.querySelector('.success-card')).toBeTruthy();
    expect(el.querySelector('.success-card')?.textContent).toContain(
      "We've received your registration request",
    );
  });

  it('displays API error message when submission fails', () => {
    registrationsService.submit.mockReturnValueOnce(
      throwError(() => ({
        error: { error: { message: 'Too many registration requests. Please try again later.' } },
      })),
    );

    const { fixture, component, el } = setupComponent();

    component.form.setValue({
      schoolName: 'Sunrise Academy',
      city: 'Phnom Penh',
      address: '',
      contactFirstName: 'Sophea',
      contactLastName: 'Chan',
      contactTitle: '',
      email: 'sophea@sunrise.edu.kh',
      phone: '012345678',
      studentCount: null,
      message: '',
    });
    fixture.detectChanges();

    component.submit();
    fixture.detectChanges();

    expect(component.submitted()).toBe(false);
    expect(component.errorMessage()).toBe(
      'Too many registration requests. Please try again later.',
    );
    expect(el.querySelector('ac-ui-message')?.textContent).toContain(
      'Too many registration requests',
    );
  });
});
