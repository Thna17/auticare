import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { HospitalRegistration } from '@auticare/contracts';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../core/i18n/i18n.service';
import { HospitalRegistrationsService } from './data-access/hospital-registrations.service';
import { HospitalRegistrationsPage } from './hospital-registrations.page';

describe('HospitalRegistrationsPage', () => {
  const pendingCountSignal = signal(1);

  const samplePending: HospitalRegistration = {
    id: 'hosp-reg-1',
    hospitalName: 'Phnom Penh Pediatric Center',
    city: 'Phnom Penh',
    address: '123 Monivong Blvd',
    contactFirstName: 'Sophea',
    contactLastName: 'Chan',
    contactTitle: 'Medical Director',
    email: 'sophea@pediatric.gov.kh',
    phone: '+855 12 345 678',
    services: 'Autism evaluation, Pediatric neurology',
    message: 'We wish to partner with AutiCare.',
    status: 'PENDING',
    rejectionReason: null,
    reviewedById: null,
    reviewedAt: null,
    hospitalId: null,
    createdAt: '2026-10-27T08:00:00.000Z',
    updatedAt: '2026-10-27T08:00:00.000Z',
  };

  const sampleApproved: HospitalRegistration = {
    ...samplePending,
    id: 'hosp-reg-2',
    hospitalName: 'National Children Hospital',
    status: 'APPROVED',
    hospitalId: 'hosp-99',
    reviewedById: 'admin-1',
    reviewedAt: '2026-10-27T09:00:00.000Z',
  };

  const sampleRejected: HospitalRegistration = {
    ...samplePending,
    id: 'hosp-reg-3',
    hospitalName: 'Invalid Clinic Entry',
    status: 'REJECTED',
    rejectionReason: 'Unable to verify medical licence.',
    reviewedById: 'admin-1',
    reviewedAt: '2026-10-27T09:30:00.000Z',
  };

  const mockService = {
    pendingCount: pendingCountSignal,
    fetchPendingCount: vi.fn(() => of(1)),
    list: vi.fn((status?: string) => {
      if (status === 'APPROVED') return of([sampleApproved]);
      if (status === 'REJECTED') return of([sampleRejected]);
      return of([samplePending]);
    }),
    approve: vi.fn(() => of(sampleApproved)),
    reject: vi.fn(() => of(sampleRejected)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pendingCountSignal.set(1);
    TestBed.configureTestingModule({
      imports: [HospitalRegistrationsPage],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: HospitalRegistrationsService, useValue: mockService },
      ],
    });
    TestBed.inject(I18nService).setLanguage('en');
  });

  const setupComponent = () => {
    const fixture = TestBed.createComponent(HospitalRegistrationsPage);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      el: fixture.nativeElement as HTMLElement,
    };
  };

  it('loads and displays pending registrations on init', () => {
    const { component, el } = setupComponent();

    expect(mockService.list).toHaveBeenCalledWith('PENDING');
    expect(component.requests().length).toBe(1);
    expect(el.querySelector('.hospital-identity h2')?.textContent).toContain(
      'Phnom Penh Pediatric Center',
    );
    expect(el.querySelector('.approve-btn')).toBeTruthy();
    expect(el.querySelector('.reject-btn')).toBeTruthy();
  });

  it('switches tabs and loads corresponding status data', () => {
    const { component, fixture, el } = setupComponent();

    const approvedTab = el.querySelectorAll('.tab-btn')[1] as HTMLButtonElement;
    approvedTab.click();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('APPROVED');
    expect(mockService.list).toHaveBeenCalledWith('APPROVED');
    expect(el.querySelector('.hospital-identity h2')?.textContent).toContain(
      'National Children Hospital',
    );
    expect(el.querySelector('.hospital-id-tag')?.textContent).toContain('hosp-99');
  });

  it('approves a request through confirm modal', () => {
    const { fixture, el } = setupComponent();

    const approveBtn = el.querySelector('.approve-btn') as HTMLButtonElement;
    approveBtn.click();
    fixture.detectChanges();

    const modalApproveBtn = el.querySelector('.dialog-btn.primary-approve') as HTMLButtonElement;
    expect(modalApproveBtn).toBeTruthy();

    modalApproveBtn.click();
    fixture.detectChanges();

    expect(mockService.approve).toHaveBeenCalledWith('hosp-reg-1');
  });

  it('rejects a request with reason through modal', () => {
    const { component, fixture, el } = setupComponent();

    component.openRejectDialog(samplePending);
    fixture.detectChanges();
    expect(component.rejectingRequest()).toEqual(samplePending);
    expect(el.querySelector('.modal-dialog')).toBeTruthy();

    component.rejectReason = 'Unverifiable clinic registration documents.';
    component.confirmReject(samplePending);
    fixture.detectChanges();

    expect(mockService.reject).toHaveBeenCalledWith(
      'hosp-reg-1',
      'Unverifiable clinic registration documents.',
    );
    expect(component.actionSuccess()).toContain('Rejected registration request');
    expect(component.rejectingRequest()).toBeNull();
  });
});
