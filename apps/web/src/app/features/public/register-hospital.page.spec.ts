import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../core/i18n/i18n.service';
import { HospitalRegistrationsService } from '../admin/data-access/hospital-registrations.service';
import { RegisterHospitalPage } from './register-hospital.page';

describe('RegisterHospitalPage', () => {
  const registrationsService = {
    submit: vi.fn(() => of({ received: true })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [RegisterHospitalPage],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: HospitalRegistrationsService, useValue: registrationsService },
      ],
    });
    TestBed.inject(I18nService).setLanguage('en');
  });

  const setupComponent = () => {
    const fixture = TestBed.createComponent(RegisterHospitalPage);
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
      hospitalName: 'National Children Hospital',
      city: 'Phnom Penh',
      address: 'Russian Blvd',
      contactFirstName: 'Sokha',
      contactLastName: 'Keo',
      contactTitle: 'Medical Director',
      email: 'Director@nch.gov.kh',
      phone: '+855 12 987 654',
      services: 'Pediatric care, Autism screening, Speech therapy',
      message: 'Looking to partner with AutiCare for referrals.',
    });
    fixture.detectChanges();

    expect(component.form.valid).toBe(true);

    component.submit();
    fixture.detectChanges();

    expect(registrationsService.submit).toHaveBeenCalledWith({
      hospitalName: 'National Children Hospital',
      city: 'Phnom Penh',
      address: 'Russian Blvd',
      contactFirstName: 'Sokha',
      contactLastName: 'Keo',
      contactTitle: 'Medical Director',
      email: 'director@nch.gov.kh',
      phone: '+855 12 987 654',
      services: 'Pediatric care, Autism screening, Speech therapy',
      message: 'Looking to partner with AutiCare for referrals.',
    });

    expect(component.submitted()).toBe(true);
    expect(el.querySelector('.success-card')).toBeTruthy();
    expect(el.querySelector('.success-card')?.textContent).toContain("We've received your request");
  });

  it('displays API error message when submission fails', () => {
    registrationsService.submit.mockReturnValueOnce(
      throwError(() => ({
        error: { error: { message: 'Too many registration requests. Please try again later.' } },
      })),
    );

    const { fixture, component, el } = setupComponent();

    component.form.setValue({
      hospitalName: 'National Children Hospital',
      city: 'Phnom Penh',
      address: '',
      contactFirstName: 'Sokha',
      contactLastName: 'Keo',
      contactTitle: '',
      email: 'director@nch.gov.kh',
      phone: '012987654',
      services: '',
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
