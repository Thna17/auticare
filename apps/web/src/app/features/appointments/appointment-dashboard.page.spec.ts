import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { AppointmentsFacade } from './state/appointments.facade';
import { AppointmentDashboardPage } from './appointment-dashboard.page';
import { I18nService } from '../../core/i18n/i18n.service';

describe('AppointmentDashboardPage', () => {
  let fixture: ComponentFixture<AppointmentDashboardPage>;
  let component: AppointmentDashboardPage;
  let i18nService: I18nService;
  let mockAuthService: {
    parent: ReturnType<typeof signal>;
  };
  let mockFacade: {
    appointments: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    stats: ReturnType<typeof signal>;
    cancelError: ReturnType<typeof signal>;
    cancelling: ReturnType<typeof signal>;
    pagination: ReturnType<typeof signal>;
    reschedule: ReturnType<typeof signal>;
    loadAppointments: ReturnType<typeof vi.fn>;
    openReschedule: ReturnType<typeof vi.fn>;
    cancelAppointment: ReturnType<typeof vi.fn>;
    goToPage: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthService = {
      parent: signal({
        id: 'user_parent',
        role: 'PARENT',
        email: 'parent@auticare.org',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: null,
        socialMediaAccount: null,
      }),
    };

    mockFacade = {
      appointments: signal([
        {
          id: 'apt_1',
          parentId: 'user_parent',
          childId: 'ch_1',
          childName: 'Tommy',
          hospitalId: 'hosp_1',
          hospitalName: 'Children Hospital',
          doctorId: 'doc_1',
          doctorName: 'Dr. Jane Smith',
          scheduledAt: '2026-11-20T10:00:00.000Z',
          status: 'CONFIRMED',
          reason: 'Routine checkup',
          rejectionReason: null,
          parentName: 'Jane Doe',
          parentEmail: 'parent@auticare.org',
        },
      ]),
      loading: signal(false),
      error: signal(null),
      stats: signal({ total: 1, pendingReview: 0, upcoming: 1 }),
      cancelError: signal(null),
      cancelling: signal([]),
      pagination: signal({ page: 1, limit: 20, total: 1, totalPages: 1 }),
      reschedule: signal({ isOpen: false, appointment: null }),
      loadAppointments: vi.fn(),
      openReschedule: vi.fn(),
      cancelAppointment: vi.fn(),
      goToPage: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppointmentDashboardPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: AppointmentsFacade, useValue: mockFacade },
        I18nService,
      ],
    }).compileComponents();

    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('en');

    fixture = TestBed.createComponent(AppointmentDashboardPage);
    component = fixture.componentInstance;
  });

  it('renders parent scheduling CTA and hides admin oversight banner for parent user', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.schedule-cta')).not.toBeNull();
    expect(compiled.querySelector('.admin-oversight-banner')).toBeNull();
    expect(compiled.querySelector('.parent-meta')).toBeNull();
  });

  it('renders admin oversight banner and parent details, and hides scheduling CTA for admin user', () => {
    mockAuthService.parent.set({
      id: 'user_admin',
      role: 'ADMIN',
      email: 'admin@auticare.org',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: null,
      socialMediaAccount: null,
    });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.schedule-cta')).toBeNull();
    expect(compiled.querySelector('.admin-oversight-banner')).not.toBeNull();
    expect(compiled.textContent).toContain('Administrative Appointment Oversight');
    expect(compiled.querySelector('.parent-meta')?.textContent).toContain('Jane Doe');
  });

  it('filters visible appointments by search query in admin mode', () => {
    mockAuthService.parent.set({
      id: 'user_admin',
      role: 'ADMIN',
      email: 'admin@auticare.org',
      firstName: 'System',
      lastName: 'Admin',
      phoneNumber: null,
      socialMediaAccount: null,
    });

    fixture.detectChanges();
    expect(component['visibleAppointments']().length).toBe(1);

    component['adminSearchQuery'].set('Unknown Specialist');
    fixture.detectChanges();
    expect(component['visibleAppointments']().length).toBe(0);

    component['adminSearchQuery'].set('Jane Smith');
    fixture.detectChanges();
    expect(component['visibleAppointments']().length).toBe(1);
  });

  it('highlights the target appointment row when targetAppointmentId is set', () => {
    component['targetAppointmentId'].set('apt_1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const row = compiled.querySelector('#appointment-apt_1');
    expect(row).not.toBeNull();
    expect(row?.classList.contains('highlighted')).toBe(true);
  });

  it('renders header summary metrics for upcoming visits, pending approval, and past completed visits', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const statLabels = Array.from(compiled.querySelectorAll('.stat-label')).map((el) =>
      el.textContent?.trim(),
    );
    expect(statLabels).toContain('Upcoming Visits');
    expect(statLabels).toContain('Pending Approval');
    expect(statLabels).toContain('Past Completed Visits');
    expect(statLabels).toContain('Total Appointments');
  });

  it('renders elevated appointment status card details including specialist avatar, specialty badge, location, and date badges', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const avatar = compiled.querySelector('.doctor-avatar');
    expect(avatar?.textContent?.trim()).toBe('JS');

    const doctorName = compiled.querySelector('.doctor-name');
    expect(doctorName?.textContent?.trim()).toBe('Dr. Jane Smith');

    const specialtyBadge = compiled.querySelector('.specialty-badge');
    expect(specialtyBadge?.textContent?.trim()).toBe('Pediatric Specialist');

    const locationMeta = compiled.querySelector('.location-meta');
    expect(locationMeta?.textContent).toContain('Children Hospital');

    const childTag = compiled.querySelector('.child-tag');
    expect(childTag?.textContent).toContain('Tommy');

    const scheduleMeta = compiled.querySelector('.schedule-meta');
    expect(scheduleMeta?.textContent).toContain('Nov');

    const timeChip = compiled.querySelector('.appointment-time-chip');
    expect(timeChip).not.toBeNull();
  });

  it('opens reschedule modal when clicking reschedule button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const rescheduleBtn = compiled.querySelector<HTMLButtonElement>('.reschedule-btn');
    expect(rescheduleBtn).not.toBeNull();
    rescheduleBtn?.click();

    expect(mockFacade.openReschedule).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'apt_1' }),
    );
  });

  it('handles appointment cancellation confirmation flow', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const cancelBtn = compiled.querySelector<HTMLButtonElement>('.cancel-btn');
    expect(cancelBtn).not.toBeNull();
    cancelBtn?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.cancel-confirm')).not.toBeNull();
    expect(compiled.textContent).toContain('Cancel this appointment?');

    const yesBtn = compiled.querySelector<HTMLButtonElement>('.cancel-yes');
    yesBtn?.click();

    expect(mockFacade.cancelAppointment).toHaveBeenCalledWith('apt_1');
  });

  it('dismisses cancellation confirmation dialog when clicking keep it', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const cancelBtn = compiled.querySelector<HTMLButtonElement>('.cancel-btn');
    cancelBtn?.click();
    fixture.detectChanges();

    const noBtn = compiled.querySelector<HTMLButtonElement>('.cancel-no');
    noBtn?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.cancel-confirm')).toBeNull();
    expect(mockFacade.cancelAppointment).not.toHaveBeenCalled();
  });
});
