import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import type {
  AdminDashboardResponse,
  ParentDashboardResponse,
  ParentResponse,
} from '@auticare/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { API_BASE_URL } from '../../core/config/api.config';
import { DashboardPage } from './dashboard.page';
import { ParentAnalysisComponent } from './analysis/parent-analysis.component';

/**
 * The analysis block has its own spec, including its two requests. Stubbing it
 * here keeps these tests about the dashboard itself rather than about whether
 * every dashboard test remembered to flush two unrelated endpoints.
 */
@Component({
  selector: 'ac-parent-analysis',
  standalone: true,
  template: '',
  inputs: ['childId', 'childName'],
})
class ParentAnalysisStubComponent {}

describe('DashboardPage', () => {
  let httpTesting: HttpTestingController;
  let authService: AuthService;

  const mockParentUser: ParentResponse = {
    id: 'parent-123',
    email: 'parent@auticare.test',
    firstName: 'Alice',
    lastName: 'Walker',
    role: 'PARENT',
    phoneNumber: '+1-555-0100',
    socialMediaAccount: null,
  };

  const mockAdminUser: ParentResponse = {
    id: 'admin-123',
    email: 'admin@auticare.test',
    firstName: 'Charlie',
    lastName: 'Admin',
    role: 'ADMIN',
    phoneNumber: '+1-555-0101',
    socialMediaAccount: null,
  };

  const mockHospitalUser: ParentResponse = {
    id: 'hospital-123',
    email: 'hospital@auticare.test',
    firstName: 'Hope',
    lastName: 'Hospital',
    role: 'HOSPITAL',
    phoneNumber: '+1-555-0102',
    socialMediaAccount: null,
  };

  const zeroParentDashboard: ParentDashboardResponse = {
    selectedChild: null,
    totalChildren: 0,
    screeningSummary: {
      hasScreening: false,
      sessionId: null,
      status: null,
      riskLevel: null,
      riskPercentage: null,
      score: null,
      completedDate: null,
      recommendation: null,
    },
    weeklyProgress: {
      days: [
        { day: 'Mon', count: 0, percentage: 0 },
        { day: 'Tue', count: 0, percentage: 0 },
        { day: 'Wed', count: 0, percentage: 0 },
        { day: 'Thu', count: 0, percentage: 0 },
        { day: 'Fri', count: 0, percentage: 0 },
        { day: 'Sat', count: 0, percentage: 0 },
        { day: 'Sun', count: 0, percentage: 0 },
      ],
      totalCompletedThisWeek: 0,
    },
    upcomingAppointment: null,
    recommendedAction: {
      title: 'Add a child profile',
      description: 'Create a child profile to track personalized screenings and activities.',
      actionPath: '/children/new',
      actionLabel: 'Add Child Profile',
      source: 'NO_CHILD',
    },
  };

  const populatedParentDashboard: ParentDashboardResponse = {
    selectedChild: {
      id: 'child-2',
      firstName: 'Maya',
      lastName: 'Walker',
      dateOfBirth: '2020-02-15',
      photoUrl: null,
    },
    totalChildren: 1,
    screeningSummary: {
      hasScreening: true,
      sessionId: 'session-maya-1',
      status: 'SUBMITTED',
      riskLevel: 'MODERATE',
      riskPercentage: 58,
      score: 12,
      completedDate: '2026-03-01',
      recommendation: 'Targeted visual and speech exercises recommended.',
    },
    weeklyProgress: {
      days: [
        { day: 'Mon', count: 1, percentage: 50 },
        { day: 'Tue', count: 2, percentage: 100 },
        { day: 'Wed', count: 0, percentage: 0 },
        { day: 'Thu', count: 1, percentage: 50 },
        { day: 'Fri', count: 0, percentage: 0 },
        { day: 'Sat', count: 0, percentage: 0 },
        { day: 'Sun', count: 0, percentage: 0 },
      ],
      totalCompletedThisWeek: 4,
    },
    upcomingAppointment: {
      id: 'appt-1',
      hospitalName: 'Phnom Penh Children Center',
      doctorName: 'Dr. Johnathan Vance',
      specialty: 'Developmental Pediatrics',
      scheduledAt: '2026-04-10T10:00:00.000Z',
      status: 'CONFIRMED',
      reason: 'Routine quarterly check-up',
      childFirstName: 'Maya',
    },
    recommendedAction: {
      title: 'Screening Recommendation',
      description: 'Targeted visual and speech exercises recommended.',
      actionPath: '/screening/result/session-maya-1',
      actionLabel: 'View Screening Result',
      source: 'SCREENING_RESULT',
    },
  };

  const multiChildParentDashboard: ParentDashboardResponse = {
    selectedChild: {
      id: 'child-1',
      firstName: 'Maya',
      lastName: 'Walker',
      dateOfBirth: '2020-06-15',
      photoUrl: null,
    },
    totalChildren: 2,
    children: [
      {
        id: 'child-1',
        firstName: 'Maya',
        lastName: 'Walker',
        dateOfBirth: '2020-06-15',
        photoUrl: null,
      },
      {
        id: 'child-2',
        firstName: 'Leo',
        lastName: 'Walker',
        dateOfBirth: '2022-03-10',
        photoUrl: null,
      },
    ],
    screeningSummary: {
      hasScreening: true,
      sessionId: 'scr-1',
      status: 'ANALYZED',
      riskLevel: 'MODERATE',
      riskPercentage: 58,
      score: 12,
      completedDate: '2026-03-25',
      recommendation: 'Targeted visual and speech exercises recommended.',
    },
    weeklyProgress: {
      days: [
        { day: 'Mon', count: 1, percentage: 50 },
        { day: 'Tue', count: 2, percentage: 100 },
        { day: 'Wed', count: 0, percentage: 0 },
        { day: 'Thu', count: 1, percentage: 50 },
        { day: 'Fri', count: 0, percentage: 0 },
        { day: 'Sat', count: 0, percentage: 0 },
        { day: 'Sun', count: 0, percentage: 0 },
      ],
      totalCompletedThisWeek: 4,
    },
    upcomingAppointment: {
      id: 'appt-1',
      hospitalName: 'Phnom Penh Children Center',
      doctorName: 'Dr. Johnathan Vance',
      specialty: 'Developmental Pediatrics',
      scheduledAt: '2026-05-10T09:00:00.000Z',
      status: 'CONFIRMED',
      reason: 'Follow-up assessment',
      childFirstName: 'Maya',
    },
    recommendedAction: {
      title: 'Screening Recommendation',
      description: 'Targeted visual and speech exercises recommended.',
      actionPath: '/screening/result/scr-1',
      actionLabel: 'View Screening Result',
      source: 'SCREENING_RESULT',
    },
  };

  const leoParentDashboard: ParentDashboardResponse = {
    selectedChild: {
      id: 'child-2',
      firstName: 'Leo',
      lastName: 'Walker',
      dateOfBirth: '2022-03-10',
      photoUrl: null,
    },
    totalChildren: 2,
    children: [
      {
        id: 'child-1',
        firstName: 'Maya',
        lastName: 'Walker',
        dateOfBirth: '2020-06-15',
        photoUrl: null,
      },
      {
        id: 'child-2',
        firstName: 'Leo',
        lastName: 'Walker',
        dateOfBirth: '2022-03-10',
        photoUrl: null,
      },
    ],
    screeningSummary: {
      hasScreening: false,
      sessionId: null,
      status: null,
      riskLevel: null,
      riskPercentage: null,
      score: null,
      completedDate: null,
      recommendation: null,
    },
    weeklyProgress: {
      days: [
        { day: 'Mon', count: 0, percentage: 0 },
        { day: 'Tue', count: 0, percentage: 0 },
        { day: 'Wed', count: 0, percentage: 0 },
        { day: 'Thu', count: 0, percentage: 0 },
        { day: 'Fri', count: 0, percentage: 0 },
        { day: 'Sat', count: 0, percentage: 0 },
        { day: 'Sun', count: 0, percentage: 0 },
      ],
      totalCompletedThisWeek: 0,
    },
    upcomingAppointment: null,
    recommendedAction: {
      title: 'Start screening for Leo',
      description:
        'Complete an initial developmental screening questionnaire to identify support areas.',
      actionPath: '/screening',
      actionLabel: 'Start Screening',
      source: 'NO_SCREENING',
    },
  };

  const mockAdminDashboard: AdminDashboardResponse = {
    stats: {
      totalFamilies: 142,
      activeChildren: 189,
      totalHospitals: 8,
      totalSchools: 14,
      totalAppointments: 67,
      pendingAppointments: 5,
    },
    recentAppointments: [
      {
        id: 'appt-adm-1',
        parentName: 'Alice Walker',
        childName: 'Maya',
        hospitalName: 'Phnom Penh Children Center',
        scheduledAt: '2026-04-10T10:00:00.000Z',
        status: 'CONFIRMED',
      },
    ],
    recentAuditEvents: [
      {
        id: 'audit-1',
        action: 'HOSPITAL_ACCOUNT_CREATED',
        actorEmail: 'admin@auticare.test',
        targetEmail: 'director@hospital.test',
        createdAt: '2026-04-01T09:30:00.000Z',
      },
    ],
  };

  const setAuthState = (parent: ParentResponse) => {
    (
      authService as unknown as {
        state: { set: (s: { status: 'authenticated'; parent: ParentResponse }) => void };
      }
    ).state.set({ status: 'authenticated', parent });
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    TestBed.overrideComponent(DashboardPage, {
      remove: { imports: [ParentAnalysisComponent] },
      add: { imports: [ParentAnalysisStubComponent] },
    });

    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting?.verify();
  });

  describe('Parent role dashboard rendering', () => {
    beforeEach(() => {
      TestBed.inject(I18nService).setLanguage('en');
    });

    it('renders active child context pill and toggles child switcher dropdown with Escape key support', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const initialReq = httpTesting.expectOne('/api/v1/dashboard/parent');
      initialReq.flush({ data: multiChildParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const contextPill = element.querySelector('.care-context-pill') as HTMLButtonElement;
      expect(contextPill).toBeTruthy();
      expect(contextPill.textContent).toContain('Viewing care for:');
      expect(contextPill.textContent).toContain('Maya');

      // Dropdown menu is initially closed
      expect(element.querySelector('.care-dropdown-menu')).toBeNull();

      // Click pill to open dropdown
      contextPill.click();
      fixture.detectChanges();
      const dropdown = element.querySelector('.care-dropdown-menu');
      expect(dropdown).toBeTruthy();

      const options = dropdown?.querySelectorAll('.care-dropdown-item');
      expect(options?.length).toBe(2);
      expect(options?.[0].textContent).toContain('Maya');
      expect(options?.[1].textContent).toContain('Leo');

      // Press Escape to dismiss
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(element.querySelector('.care-dropdown-menu')).toBeNull();

      // Open again and click Leo to switch child
      contextPill.click();
      fixture.detectChanges();
      const leoOption = element.querySelectorAll('.care-dropdown-item')[1] as HTMLButtonElement;
      leoOption.click();
      fixture.detectChanges();

      const switchReq = httpTesting.expectOne('/api/v1/dashboard/parent?childId=child-2');
      switchReq.flush({ data: leoParentDashboard });
      fixture.detectChanges();

      expect(element.querySelector('.care-dropdown-menu')).toBeNull();
      expect(element.querySelector('.care-context-pill')?.textContent).toContain('Leo');
    });

    it('renders only the analysis panel, with the retired dashboard blocks gone', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      expect(element.querySelector('ac-parent-analysis')).toBeTruthy();
      // The bento overview, quick-action cards and alert ticker were replaced by
      // the analysis panel; none of their containers may come back.
      expect(element.querySelector('.bento-grid')).toBeNull();
      expect(element.querySelector('.bento-quick-actions')).toBeNull();
      expect(element.querySelector('.priority-alert-card')).toBeNull();
      expect(element.querySelector('.screening-card')).toBeNull();
    });

    it('shows the personalize prompt instead of cards when the family has no child', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: zeroParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toContain('Personalize your dashboard');
      expect(element.textContent).toContain('Open child profiles');
      expect(element.querySelector('.empty-state a')?.getAttribute('href')).toBe('/children');
      expect(element.querySelector('.bento-grid')).toBeNull();
    });

    it('displays hero active date badge formatted', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const dateBadge = element.querySelector('.hero-date-badge');
      expect(dateBadge).toBeTruthy();
      expect(dateBadge?.textContent?.length).toBeGreaterThan(5);
    });
  });

  describe('Administrator role dashboard rendering', () => {
    beforeEach(() => {
      TestBed.inject(I18nService).setLanguage('en');
    });

    it('loads and renders real admin statistics, recent appointments, and audit events', () => {
      setAuthState(mockAdminUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      // Expect dashboard admin call AND children list call
      const adminReq = httpTesting.expectOne('/api/v1/dashboard/admin');
      expect(adminReq.request.method).toBe('GET');
      adminReq.flush({ data: mockAdminDashboard });

      const childrenReq = httpTesting.expectOne('/api/v1/children');
      expect(childrenReq.request.method).toBe('GET');
      childrenReq.flush([]);

      fixture.detectChanges();
      // The overview panel at the top of the admin dashboard loads on its own.
      httpTesting.match('/api/v1/admin/overview');

      const element: HTMLElement = fixture.nativeElement;

      // Stats
      expect(element.textContent).toContain('142'); // total families
      expect(element.textContent).toContain('189'); // active children
      expect(element.textContent).toContain('8'); // hospitals
      expect(element.textContent).toContain('14'); // schools
      expect(element.textContent).toContain('67'); // appointments
      expect(element.textContent).toContain('5'); // pending

      // Recent appointment
      expect(element.textContent).toContain('Alice Walker');
      expect(element.textContent).toContain('Phnom Penh Children Center');

      // Recent audit event
      expect(element.textContent).toContain('HOSPITAL_ACCOUNT_CREATED');
      expect(element.textContent).toContain('director@hospital.test');
    });

    it('renders error state when admin dashboard request fails', () => {
      setAuthState(mockAdminUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const adminReq = httpTesting.expectOne('/api/v1/dashboard/admin');
      adminReq.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      const childrenReq = httpTesting.expectOne('/api/v1/children');
      childrenReq.flush([]);

      fixture.detectChanges();
      // The overview panel at the top of the admin dashboard loads on its own.
      httpTesting.match('/api/v1/admin/overview');

      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toContain('Administrator dashboard could not be loaded.');
    });
  });

  describe('Hospital User', () => {
    it('redirects to /hospital/dashboard when authenticated user is HOSPITAL', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');
      setAuthState(mockHospitalUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith('/hospital/dashboard');
    });
  });

  describe('Bilingual Parent Dashboard & Child Context Switcher (PROMPT 64)', () => {
    beforeEach(() => {
      TestBed.inject(I18nService).setLanguage('km');
    });

    it('renders a short Khmer greeting by default and toggles to English', () => {
      setAuthState(mockParentUser);
      const fixture = TestBed.createComponent(DashboardPage);
      const i18n = TestBed.inject(I18nService);
      i18n.setLanguage('km');
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      // Khmer greeting present
      expect(element.textContent).toContain('សួស្តី Alice');
      expect(element.textContent).toContain('Alice');
      expect(element.textContent).not.toContain('(Good');

      // Switch language to English
      i18n.setLanguage('en');
      fixture.detectChanges();

      expect(element.textContent).toMatch(/Good (morning|afternoon|evening), Alice/);
    });

    it('renders active child context pill with Khmer label and switches child context', () => {
      setAuthState(mockParentUser);
      const fixture = TestBed.createComponent(DashboardPage);
      const i18n = TestBed.inject(I18nService);
      i18n.setLanguage('km');
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: multiChildParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const contextPill = element.querySelector('.care-context-pill') as HTMLButtonElement;
      expect(contextPill).toBeTruthy();
      expect(contextPill.textContent).toContain('កំពុងមើលការថែទាំសម្រាប់៖');
      expect(contextPill.textContent).toContain('Maya');
      expect(contextPill.textContent).not.toContain('(Viewing care for:');

      // Adding a child lives inside the switcher now, not as a second hero button.
      expect(element.querySelector('.hero-add-child-btn')).toBeNull();
      contextPill.click();
      fixture.detectChanges();
      const addLink = element.querySelector('.care-dropdown-menu a[href="/children/new"]');
      expect(addLink?.textContent).toContain('បន្ថែមទិន្នន័យកុមារ');
    });

    it('ensures zero English parentheticals in Khmer mode and zero Khmer in English mode', () => {
      setAuthState(mockParentUser);
      const fixture = TestBed.createComponent(DashboardPage);
      const i18n = TestBed.inject(I18nService);
      i18n.setLanguage('km');
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      // In Khmer mode, verify clean Khmer and no parenthetical English
      expect(element.textContent).toContain('សួស្តី Alice');
      expect(element.textContent).not.toContain('(Good');
      expect(element.textContent).not.toContain('(Viewing care for:');
      expect(element.textContent).not.toContain('(Add Child)');
      expect(element.textContent).not.toContain('(Streak: Completed)');
      expect(element.textContent).not.toContain('(Moderate Concern)');

      // Toggle to English
      i18n.setLanguage('en');
      fixture.detectChanges();

      // In English mode, verify clean English and no Khmer
      expect(element.textContent).toMatch(/Good (morning|afternoon|evening), Alice/);
      expect(element.textContent).toContain('Viewing care for:');
      expect(element.textContent).not.toContain('សួស្តី');
      expect(element.textContent).not.toContain('ការបារម្ភកម្រិតមធ្យម');
    });
  });
});
