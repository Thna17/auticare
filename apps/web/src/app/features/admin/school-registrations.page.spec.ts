import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { SchoolRegistration } from '@auticare/contracts';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../core/i18n/i18n.service';
import { SchoolRegistrationsService } from './data-access/school-registrations.service';
import { SchoolRegistrationsPage } from './school-registrations.page';

describe('SchoolRegistrationsPage', () => {
  const pendingCountSignal = signal(1);

  const samplePending: SchoolRegistration = {
    id: 'reg-1',
    schoolName: 'Sunrise Learning Academy',
    city: 'Phnom Penh',
    address: '123 Norodom Blvd',
    contactFirstName: 'Sophea',
    contactLastName: 'Chan',
    contactTitle: 'Principal',
    email: 'sophea@sunrise.edu.kh',
    phone: '+855 12 345 678',
    studentCount: 250,
    message: 'We wish to partner with AutiCare.',
    status: 'PENDING',
    rejectionReason: null,
    reviewedById: null,
    reviewedAt: null,
    schoolId: null,
    createdAt: '2026-10-27T08:00:00.000Z',
    updatedAt: '2026-10-27T08:00:00.000Z',
  };

  const sampleApproved: SchoolRegistration = {
    ...samplePending,
    id: 'reg-2',
    schoolName: 'Future Hope School',
    status: 'APPROVED',
    schoolId: 'school-99',
    reviewedById: 'admin-1',
    reviewedAt: '2026-10-27T09:00:00.000Z',
  };

  const sampleRejected: SchoolRegistration = {
    ...samplePending,
    id: 'reg-3',
    schoolName: 'Invalid School Entry',
    status: 'REJECTED',
    rejectionReason: 'Unable to verify school institution.',
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
      imports: [SchoolRegistrationsPage],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: SchoolRegistrationsService, useValue: mockService },
      ],
    });
    TestBed.inject(I18nService).setLanguage('en');
  });

  const setupComponent = () => {
    const fixture = TestBed.createComponent(SchoolRegistrationsPage);
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
    expect(el.querySelector('.school-identity h2')?.textContent).toContain(
      'Sunrise Learning Academy',
    );
    expect(el.querySelector('.approve-btn')).toBeTruthy();
    expect(el.querySelector('.reject-btn')).toBeTruthy();
  });

  it('switches tabs and loads approved/rejected requests', () => {
    const { fixture, component, el } = setupComponent();

    component.setTab('APPROVED');
    fixture.detectChanges();
    expect(mockService.list).toHaveBeenCalledWith('APPROVED');
    expect(component.requests()[0]?.schoolName).toBe('Future Hope School');
    expect(el.querySelector('.review-meta.approved')).toBeTruthy();

    component.setTab('REJECTED');
    fixture.detectChanges();
    expect(mockService.list).toHaveBeenCalledWith('REJECTED');
    expect(component.requests()[0]?.schoolName).toBe('Invalid School Entry');
    expect(el.querySelector('.review-meta.rejected')).toBeTruthy();
  });

  it('approves request after confirmation dialog', () => {
    const { fixture, component, el } = setupComponent();

    component.openApproveDialog(samplePending);
    fixture.detectChanges();

    expect(component.approvingRequest()).toEqual(samplePending);
    expect(el.querySelector('.modal-dialog')).toBeTruthy();

    component.confirmApprove(samplePending);
    fixture.detectChanges();

    expect(mockService.approve).toHaveBeenCalledWith('reg-1');
    expect(component.actionSuccess()).toContain('Successfully approved Sunrise Learning Academy');
    expect(component.approvingRequest()).toBeNull();
  });

  it('rejects request with valid reason', () => {
    const { fixture, component, el } = setupComponent();

    component.openRejectDialog(samplePending);
    fixture.detectChanges();

    expect(component.rejectingRequest()).toEqual(samplePending);
    expect(el.querySelector('.modal-dialog')).toBeTruthy();

    component.rejectReason = 'Duplicate application submitted.';
    component.confirmReject(samplePending);
    fixture.detectChanges();

    expect(mockService.reject).toHaveBeenCalledWith('reg-1', 'Duplicate application submitted.');
    expect(component.actionSuccess()).toContain('Rejected registration request');
    expect(component.rejectingRequest()).toBeNull();
  });

  it('handles approve conflict error gracefully', () => {
    mockService.approve.mockReturnValueOnce(
      throwError(() => ({
        error: { error: { message: 'This registration request has already been reviewed.' } },
      })),
    );

    const { fixture, component } = setupComponent();

    component.openApproveDialog(samplePending);
    component.confirmApprove(samplePending);
    fixture.detectChanges();

    expect(component.actionError()).toBe('This registration request has already been reviewed.');
    expect(component.approvingRequest()).toBeNull();
  });
});
