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

  const partialParentDashboard: ParentDashboardResponse = {
    selectedChild: {
      id: 'child-1',
      firstName: 'Leo',
      lastName: 'Walker',
      dateOfBirth: '2021-04-12',
      photoUrl: null,
    },
    totalChildren: 1,
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

    it('handles zero-data state honestly (no child added)', () => {
      // Simulate parent user
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      expect(req.request.method).toBe('GET');
      req.flush({ data: zeroParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;

      // Greeting
      expect(element.textContent).toContain('Good');
      expect(element.textContent).toContain('Alice');

      // Empty child switcher
      expect(element.textContent).toContain('No child selected');
      expect(element.textContent).toContain('Add child profile');

      // Screening empty state
      expect(element.textContent).toContain('No screening completed yet');

      // Weekly empty state
      expect(element.textContent).toContain('No activities completed yet this week');

      // Recommended action
      expect(element.textContent).toContain('Add a child profile');

      // Upcoming appointment empty state
      expect(element.textContent).toContain('No upcoming appointments');

      // Personalize dashboard banner
      expect(element.textContent).toContain('Personalize your dashboard');
    });

    it('handles partial-data state honestly (child exists, no screening completed)', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: partialParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;

      // Selected child displayed
      expect(element.textContent).toContain('Leo');

      // Screening empty state mentions child
      expect(element.textContent).toContain('Complete an initial screening questionnaire for Leo');

      // Recommended action prompts screening
      expect(element.textContent).toContain('Start screening for Leo');

      // No upcoming appointment
      expect(element.textContent).toContain('No upcoming appointments');
    });

    it('renders real backend-derived populated metrics correctly without hardcoded values', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;

      // Real child
      expect(element.textContent).toContain('Maya');

      // Real screening percentage and recommendation
      expect(element.textContent).toContain('58%');
      expect(element.textContent).toContain('MODERATE Support Identified');
      expect(element.textContent).toContain('Targeted visual and speech exercises recommended.');

      // Real weekly activities completed count
      expect(element.textContent).toContain('4 activities');

      // Real upcoming appointment
      expect(element.textContent).toContain('Phnom Penh Children Center');
      expect(element.textContent).toContain('Dr. Johnathan Vance');
      expect(element.textContent).toContain('Developmental Pediatrics');
      expect(element.textContent).toContain('CONFIRMED');

      // Ensures hardcoded old dummy values are NOT present
      expect(element.textContent).not.toContain('Dr. Somat');
      expect(element.textContent).not.toContain("Angkor Children's Hospital");
      expect(element.textContent).not.toContain('January 15, 2024');
    });

    it('renders error state when parent dashboard request fails', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toContain('Parent dashboard could not be loaded.');
    });

    it('renders child selector pills when parent has multiple children and switches child on click', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const initialReq = httpTesting.expectOne('/api/v1/dashboard/parent');
      initialReq.flush({ data: multiChildParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const pills = element.querySelectorAll<HTMLButtonElement>('.child-pill');
      expect(pills.length).toBe(2);
      expect(pills[0].textContent).toContain('Maya');
      expect(pills[1].textContent).toContain('Leo');
      expect(pills[0].classList.contains('active')).toBe(true);
      expect(pills[1].classList.contains('active')).toBe(false);

      // Click on Leo pill
      pills[1].click();
      fixture.detectChanges();

      const switchReq = httpTesting.expectOne('/api/v1/dashboard/parent?childId=child-2');
      expect(switchReq.request.method).toBe('GET');
      switchReq.flush({ data: leoParentDashboard });
      fixture.detectChanges();

      // Now Leo is active and metrics are updated
      expect(element.textContent).toContain("Here's what's happening with Leo today.");
      expect(element.textContent).toContain('Start screening for Leo');
      expect(element.textContent).toContain('No upcoming appointments');
      expect(pills[1].classList.contains('active')).toBe(true);
      expect(pills[0].classList.contains('active')).toBe(false);
    });

    it('renders bento quick action cards with links to screening, activities, hospitals, and progress trajectory', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const quickCards = element.querySelectorAll<HTMLAnchorElement>(
        '.bento-quick-actions .quick-card',
      );
      expect(quickCards.length).toBe(4);

      expect(quickCards[0].textContent).toContain('Start Screening');
      expect(quickCards[0].getAttribute('href')).toBe('/screening');

      expect(quickCards[1].textContent).toContain('Sensory Activities');
      expect(quickCards[1].getAttribute('href')).toBe('/activities');

      expect(quickCards[2].textContent).toContain('Book Specialist');
      expect(quickCards[2].getAttribute('href')).toBe('/hospitals');

      expect(quickCards[3].textContent).toContain('Crisis Help');
      expect(quickCards[3].getAttribute('href')).toBe('/crisis-resources');
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

    it('renders priority action alerts for pending tasks and confirmed appointments', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: partialParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const alerts = element.querySelectorAll('.priority-alert-card');
      expect(alerts.length).toBeGreaterThanOrEqual(1);

      // Leo has no screening yet -> smart alert rendered
      expect(element.textContent).toContain('Screening due for Leo');

      // Re-test with populated dashboard (confirmed appointment)
      const fixture2 = TestBed.createComponent(DashboardPage);
      fixture2.detectChanges();
      const req2 = httpTesting.expectOne('/api/v1/dashboard/parent');
      req2.flush({ data: populatedParentDashboard });
      fixture2.detectChanges();

      const element2: HTMLElement = fixture2.nativeElement;
      expect(element2.textContent).toContain('Appointment confirmed for Dr. Johnathan Vance');
      expect(element2.textContent).toContain('Screening Recommendation');
    });

    it('renders children roster card in bento layout and switches child on roster card click', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const initialReq = httpTesting.expectOne('/api/v1/dashboard/parent');
      initialReq.flush({ data: multiChildParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const rosterCard = element.querySelector('.bento-tile-children');
      expect(rosterCard).toBeTruthy();
      expect(rosterCard?.textContent).toContain('Family Children Roster');
      expect(rosterCard?.textContent).toContain('2 registered');

      const childCards = rosterCard?.querySelectorAll('.roster-child-card');
      expect(childCards?.length).toBe(2);
      expect(childCards?.[0].textContent).toContain('Maya');
      expect(childCards?.[1].textContent).toContain('Leo');

      // Clicking on the second child in the roster switches active child
      (childCards?.[1] as HTMLElement).click();
      fixture.detectChanges();

      const switchReq = httpTesting.expectOne('/api/v1/dashboard/parent?childId=child-2');
      switchReq.flush({ data: leoParentDashboard });
      fixture.detectChanges();

      expect(element.textContent).toContain("Here's what's happening with Leo today.");
    });

    it('computes appointment countdown relative badges correctly', () => {
      setAuthState(mockParentUser);

      const fixture = TestBed.createComponent(DashboardPage);
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const comp = fixture.componentInstance as unknown as {
        getAppointmentCountdown: (scheduledAt: string) => string;
      };
      const now = new Date();

      const todayIso = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        14,
        0,
      ).toISOString();
      expect(comp.getAppointmentCountdown(todayIso)).toBe('Today');

      const tomorrowIso = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        10,
        0,
      ).toISOString();
      expect(comp.getAppointmentCountdown(tomorrowIso)).toBe('Tomorrow');

      const inThreeDaysIso = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 3,
        10,
        0,
      ).toISOString();
      expect(comp.getAppointmentCountdown(inThreeDaysIso)).toBe('In 3 days');

      const inTwoWeeksIso = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 14,
        10,
        0,
      ).toISOString();
      expect(comp.getAppointmentCountdown(inTwoWeeksIso)).toBe('In 2 weeks');
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

    it('renders welcoming Khmer greeting by default and toggles to English', () => {
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
      expect(element.textContent).toContain('សូមស្វាគមន៍មកកាន់ AutiCare');
      expect(element.textContent).toContain('Alice');
      expect(element.textContent).not.toContain('(Good');

      // Switch language to English
      i18n.setLanguage('en');
      fixture.detectChanges();

      expect(element.textContent).toContain('Welcome to AutiCare');
      expect(element.textContent).toContain('Good');
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

      // Add child button in hero
      const addBtn = element.querySelector('.hero-add-child-btn');
      expect(addBtn?.textContent).toContain('បន្ថែមទិន្នន័យកុមារ');
      expect(addBtn?.textContent).not.toContain('(Add Child)');
    });

    it('renders bilingual priority action ticker alerts for screening due, confirmed appointment, and school report', () => {
      setAuthState(mockParentUser);
      const fixture = TestBed.createComponent(DashboardPage);
      const i18n = TestBed.inject(I18nService);
      i18n.setLanguage('km');
      fixture.detectChanges();

      // Test with screening due (partial parent dashboard)
      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: partialParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toContain('ដល់ពេលវាយតម្លៃការលូតលាស់របស់ Leo');
      expect(element.textContent).not.toContain('(Screening due for');

      // Test with populated dashboard (upcoming appointment + school report)
      const fixture2 = TestBed.createComponent(DashboardPage);
      fixture2.detectChanges();
      const req2 = httpTesting.expectOne('/api/v1/dashboard/parent');
      req2.flush({ data: populatedParentDashboard });
      fixture2.detectChanges();

      const element2: HTMLElement = fixture2.nativeElement;
      expect(element2.textContent).toContain('ការណាត់ជួបត្រូវបានបញ្ជាក់ជាមួយ Dr. Johnathan Vance');
      expect(element2.textContent).not.toContain('(Appointment confirmed');
      expect(element2.textContent).toContain('មានរបាយការណ៍សង្កេតថ្មីពីសាលារៀន');
      expect(element2.textContent).not.toContain('(1 new school report)');
    });

    it('renders 4 quick action cards with Khmer titles and 5-minute screening estimate', () => {
      setAuthState(mockParentUser);
      const fixture = TestBed.createComponent(DashboardPage);
      const i18n = TestBed.inject(I18nService);
      i18n.setLanguage('km');
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;
      const quickCards = element.querySelectorAll<HTMLAnchorElement>(
        '.bento-quick-actions .quick-card',
      );
      expect(quickCards.length).toBe(4);

      // Card 1: Screening
      expect(quickCards[0].textContent).toContain('ចាប់ផ្តើមការវាយតម្លៃ');
      expect(quickCards[0].textContent).not.toContain('Start Screening');
      expect(quickCards[0].textContent).toContain('5 នាទី');
      expect(quickCards[0].getAttribute('href')).toBe('/screening');

      // Card 2: Sensory Play
      expect(quickCards[1].textContent).toContain('សកម្មភាពញាណដឹង');
      expect(quickCards[1].textContent).not.toContain('Sensory Activities');
      expect(quickCards[1].getAttribute('href')).toBe('/activities');

      // Card 3: Book Specialist
      expect(quickCards[2].textContent).toContain('កក់ការពិគ្រោះយោបល់');
      expect(quickCards[2].getAttribute('href')).toBe('/hospitals');

      // Card 4: Crisis Help
      expect(quickCards[3].textContent).toContain('ជំនួយបន្ទាន់');
      expect(quickCards[3].getAttribute('href')).toBe('/crisis-resources');
    });

    it('renders bilingual screening risk badges and Khmer activity streak indicator', () => {
      setAuthState(mockParentUser);
      const fixture = TestBed.createComponent(DashboardPage);
      const comp = fixture.componentInstance as unknown as {
        formatRiskLevel: (level: string | null) => string;
      };
      const i18n = TestBed.inject(I18nService);
      i18n.setLanguage('km');
      fixture.detectChanges();

      const req = httpTesting.expectOne('/api/v1/dashboard/parent');
      req.flush({ data: populatedParentDashboard });
      fixture.detectChanges();

      const element: HTMLElement = fixture.nativeElement;

      // Risk badge in screening card
      expect(element.textContent).toContain('ការបារម្ភកម្រិតមធ្យម');
      expect(element.textContent).not.toContain('(Moderate Concern)');

      // Risk helper formatting for LOW and ELEVATED in km
      expect(comp.formatRiskLevel('LOW')).toBe('ការបារម្ភកម្រិតទាប');
      expect(comp.formatRiskLevel('MODERATE')).toBe('ការបារម្ភកម្រិតមធ្យម');
      expect(comp.formatRiskLevel('HIGH')).toBe('ការបារម្ភកម្រិតខ្ពស់');
      expect(comp.formatRiskLevel('ELEVATED')).toBe('ការបារម្ភកម្រិតខ្ពស់');

      // Switch to en and verify formatRiskLevel
      i18n.setLanguage('en');
      expect(comp.formatRiskLevel('LOW')).toBe('Low Concern');
      expect(comp.formatRiskLevel('MODERATE')).toBe('Moderate Concern');
      expect(comp.formatRiskLevel('HIGH')).toBe('Elevated Concern');
      expect(comp.formatRiskLevel('ELEVATED')).toBe('Elevated Concern');

      // Streak badge indicator in km
      i18n.setLanguage('km');
      fixture.detectChanges();
      const streakBadge = element.querySelector('.streak-badge');
      expect(streakBadge).toBeTruthy();
      expect(streakBadge?.textContent).toContain('សកម្មភាពបន្តបន្ទាប់');
      expect(streakBadge?.textContent).not.toContain('Streak: Completed');
      expect(streakBadge?.textContent).toContain('4');
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
      expect(element.textContent).toContain('សូមស្វាគមន៍មកកាន់ AutiCare');
      expect(element.textContent).not.toContain('(Good');
      expect(element.textContent).not.toContain('(Viewing care for:');
      expect(element.textContent).not.toContain('(Add Child)');
      expect(element.textContent).not.toContain('(Streak: Completed)');
      expect(element.textContent).not.toContain('(Moderate Concern)');

      // Toggle to English
      i18n.setLanguage('en');
      fixture.detectChanges();

      // In English mode, verify clean English and no Khmer
      expect(element.textContent).toContain('Welcome to AutiCare');
      expect(element.textContent).toContain('Viewing care for:');
      expect(element.textContent).toContain('Moderate Concern');
      expect(element.textContent).toContain('Day Activity Streak');
      expect(element.textContent).not.toContain('សូមស្វាគមន៍');
      expect(element.textContent).not.toContain('ការបារម្ភកម្រិតមធ្យម');
    });
  });
});
