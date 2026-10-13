import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ParentNotificationsApi } from './parent-notifications.api';

describe('ParentNotificationsApi', () => {
  let api: ParentNotificationsApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    api = TestBed.inject(ParentNotificationsApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('list queries notifications with page and optional isRead filter', () => {
    api.list(1, false).subscribe();

    const req = httpTesting.expectOne('/api/v1/parents/notifications?page=1&isRead=false');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { notifications: [], total: 0, unreadCount: 0, page: 1, totalPages: 0 } });
  });

  it('markRead patches specific notification as read', () => {
    api.markRead('notif_123').subscribe();

    const req = httpTesting.expectOne('/api/v1/parents/notifications/notif_123/read');
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: { id: 'notif_123', status: 'READ' } });
  });

  it('markAllRead patches all unread notifications to read', () => {
    api.markAllRead().subscribe();

    const req = httpTesting.expectOne('/api/v1/parents/notifications/read-all');
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: { updatedCount: 5 } });
  });
});
