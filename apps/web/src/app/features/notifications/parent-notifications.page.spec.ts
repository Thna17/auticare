import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { NotificationResponse } from '@auticare/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { NotificationsStateService } from '../../core/notifications/notifications-state.service';
import { ParentNotificationsPage } from './parent-notifications.page';

describe('ParentNotificationsPage', () => {
  let httpTesting: HttpTestingController;
  let notificationsState: NotificationsStateService;

  const mockNotifications: NotificationResponse[] = [
    {
      id: 'notif-1',
      type: 'APPOINTMENT',
      status: 'UNREAD',
      title: 'Appointment requested',
      body: 'Your appointment with Dr Smith on 12/10/2026 has been requested.',
      enrollmentId: null,
      reportId: null,
      appointmentId: 'apt-123',
      createdAt: '2026-10-08T10:00:00.000Z',
    },
    {
      id: 'notif-2',
      type: 'SCHOOL_REPORT',
      status: 'UNREAD',
      title: 'New progress report',
      body: 'A new sensory report has been submitted.',
      enrollmentId: null,
      reportId: 'rep-456',
      appointmentId: null,
      createdAt: '2026-10-07T10:00:00.000Z',
    },
    {
      id: 'notif-3',
      type: 'ADMISSION',
      status: 'READ',
      title: 'Admission approved',
      body: 'Your enrollment application was approved.',
      enrollmentId: 'adm-789',
      reportId: null,
      appointmentId: null,
      createdAt: '2026-10-06T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentNotificationsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    notificationsState = TestBed.inject(NotificationsStateService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads notifications and displays them with deep links and unread indicator', async () => {
    const fixture = TestBed.createComponent(ParentNotificationsPage);
    fixture.detectChanges();

    // Initial page load makes two requests: list page and unread count query
    const listReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1');
    expect(listReq.request.method).toBe('GET');
    listReq.flush({
      data: {
        notifications: mockNotifications,
        pagination: { total: 3, page: 1, limit: 20, totalPages: 1 },
      },
    });

    const countReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1&isRead=false');
    expect(countReq.request.method).toBe('GET');
    countReq.flush({
      data: {
        notifications: [mockNotifications[0], mockNotifications[1]],
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
      },
    });

    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Your notifications');
    expect(root.textContent).toContain('2 unread');
    expect(root.textContent).toContain('Appointment requested');
    expect(root.textContent).toContain('New progress report');

    // Deep links
    const aptLink = root.querySelector('a[href*="/appointments"]');
    expect(aptLink).toBeTruthy();
    expect(aptLink?.textContent).toContain('View appointment');

    const repLink = root.querySelector('a[href*="/progress"]');
    expect(repLink).toBeTruthy();
    expect(repLink?.textContent).toContain('View report');

    const enrollLink = root.querySelector('a[href*="/schools"]');
    expect(enrollLink).toBeTruthy();
    expect(enrollLink?.textContent).toContain('View enrollment');

    expect(notificationsState.unreadCount()).toBe(2);
  });

  it('marks an individual notification as read and updates badge immediately', async () => {
    const fixture = TestBed.createComponent(ParentNotificationsPage);
    fixture.detectChanges();

    const listReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1');
    listReq.flush({
      data: {
        notifications: mockNotifications,
        pagination: { total: 3, page: 1, limit: 20, totalPages: 1 },
      },
    });

    const countReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1&isRead=false');
    countReq.flush({
      data: {
        notifications: [mockNotifications[0], mockNotifications[1]],
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
      },
    });

    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const markButtons = root.querySelectorAll<HTMLButtonElement>('.mark-read-btn');
    expect(markButtons.length).toBe(2);

    markButtons[0].click();
    fixture.detectChanges();

    const patchReq = httpTesting.expectOne('/api/v1/parents/notifications/notif-1/read');
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({
      data: {
        ...mockNotifications[0],
        status: 'READ',
      },
    });

    fixture.detectChanges();

    // Now unread pill should be 1 unread
    expect(root.textContent).toContain('1 unread');
    expect(notificationsState.unreadCount()).toBe(1);

    // First item now has no mark-read-btn
    const remainingButtons = root.querySelectorAll<HTMLButtonElement>('.mark-read-btn');
    expect(remainingButtons.length).toBe(1);
  });

  it('marks all notifications as read and clears unread badge', async () => {
    const fixture = TestBed.createComponent(ParentNotificationsPage);
    fixture.detectChanges();

    const listReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1');
    listReq.flush({
      data: {
        notifications: mockNotifications,
        pagination: { total: 3, page: 1, limit: 20, totalPages: 1 },
      },
    });

    const countReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1&isRead=false');
    countReq.flush({
      data: {
        notifications: [mockNotifications[0], mockNotifications[1]],
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
      },
    });

    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const markAllBtn = root.querySelector<HTMLButtonElement>('.mark-all-btn');
    expect(markAllBtn).toBeTruthy();

    markAllBtn!.click();
    fixture.detectChanges();

    const patchAllReq = httpTesting.expectOne('/api/v1/parents/notifications/read-all');
    expect(patchAllReq.request.method).toBe('PATCH');
    patchAllReq.flush({ data: { updatedCount: 2 } });

    fixture.detectChanges();

    expect(notificationsState.unreadCount()).toBe(0);
    expect(root.querySelector('.unread-pill')).toBeNull();
    const markButtons = root.querySelectorAll<HTMLButtonElement>('.mark-read-btn');
    expect(markButtons.length).toBe(0);
  });

  it('renders deep links for ACTIVITY, SCREENING, and crisis support notifications', async () => {
    const fixture = TestBed.createComponent(ParentNotificationsPage);
    fixture.detectChanges();

    const specialNotifications: NotificationResponse[] = [
      {
        id: 'notif-act',
        type: 'ACTIVITY',
        status: 'UNREAD',
        title: 'New home exercise',
        body: 'Sensory Bubble Play was recommended.',
        enrollmentId: null,
        reportId: null,
        appointmentId: null,
        createdAt: '2026-10-09T10:00:00.000Z',
      },
      {
        id: 'notif-scr',
        type: 'SCREENING',
        status: 'UNREAD',
        title: 'Screening reminder',
        body: 'Time for periodic milestone evaluation.',
        enrollmentId: null,
        reportId: null,
        appointmentId: null,
        createdAt: '2026-10-09T11:00:00.000Z',
      },
      {
        id: 'notif-crisis',
        type: 'SYSTEM',
        status: 'READ',
        title: 'Urgent Helpline Advisory',
        body: 'Immediate emergency crisis hotlines and guidance are available.',
        enrollmentId: null,
        reportId: null,
        appointmentId: null,
        createdAt: '2026-10-09T12:00:00.000Z',
      },
    ];

    const listReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1');
    listReq.flush({
      data: {
        notifications: specialNotifications,
        pagination: { total: 3, page: 1, limit: 20, totalPages: 1 },
      },
    });

    const countReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1&isRead=false');
    countReq.flush({
      data: {
        notifications: [specialNotifications[0], specialNotifications[1]],
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
      },
    });

    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const actLink = root.querySelector('a[href*="/activities"]');
    expect(actLink).toBeTruthy();
    expect(actLink?.textContent).toContain('View activities');

    const scrLink = root.querySelector('a[href*="/screening"]');
    expect(scrLink).toBeTruthy();
    expect(scrLink?.textContent).toContain('View screenings');

    const crisisLink = root.querySelector('a[href*="/crisis"]');
    expect(crisisLink).toBeTruthy();
    expect(crisisLink?.textContent).toContain('Crisis resources');
  });

  it('renders deep link to /screening/result/:reportId for completed SCREENING notification', async () => {
    const fixture = TestBed.createComponent(ParentNotificationsPage);
    fixture.detectChanges();

    const screeningCompletionNotif: NotificationResponse[] = [
      {
        id: 'notif-scr-completed',
        type: 'SCREENING',
        status: 'UNREAD',
        title: 'Screening Completed for Tod',
        body: 'Developmental screening finalized with LOW risk identified. Tap to view summary and clinical recommendations.',
        enrollmentId: null,
        reportId: 'sess-789',
        appointmentId: null,
        createdAt: '2026-10-10T08:00:00.000Z',
      },
    ];

    const listReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1');
    listReq.flush({
      data: {
        notifications: screeningCompletionNotif,
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    });

    const countReq = httpTesting.expectOne('/api/v1/parents/notifications?page=1&isRead=false');
    countReq.flush({
      data: {
        notifications: screeningCompletionNotif,
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    });

    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const resultLink = root.querySelector<HTMLAnchorElement>(
      'a[href*="/screening/result/sess-789"]',
    );
    expect(resultLink).toBeTruthy();
    expect(resultLink?.textContent).toContain('View screening result');
  });
});
