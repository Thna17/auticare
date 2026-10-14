import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  ChildResponse,
  ParentResponse,
  ScreeningSessionDetailResponse,
} from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { API_BASE_URL } from '../../core/config/api.config';
import { ChildrenListPage } from './children-list.page';

describe('ChildrenListPage', () => {
  let httpTesting: HttpTestingController;

  const mockChildren: ChildResponse[] = [
    {
      id: 'child_1',
      firstName: 'Bopha',
      lastName: 'Sok',
      dateOfBirth: '2021-05-15',
      notes: 'Active and curious',
      archivedAt: null,
    },
  ];

  const mockSessions: ScreeningSessionDetailResponse[] = [
    {
      id: 'session_1',
      childId: 'child_1',
      status: 'ANALYZED',
      ageBand: 'PRESCHOOL',
      startedAt: '2026-02-01T00:00:00.000Z',
      submittedAt: '2026-02-01T00:15:00.000Z',
      answers: [],
      result: {
        id: 'result_1',
        score: 2,
        riskPercentage: 15,
        riskLevel: 'LOW',
        recommendation: 'Continue monitoring development.',
        disclaimer: 'This is not a medical diagnosis.',
        analysisVersion: 'v3',
        analyzedAt: '2026-02-01T00:15:00.000Z',
        categoryBreakdown: [],
      },
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:15:00.000Z',
    },
  ];

  const mockAuthService = {
    parent: signal<ParentResponse | null>({
      id: 'parent_1',
      email: 'parent@example.com',
      firstName: 'Dara',
      lastName: 'Sok',
      role: 'PARENT',
      phoneNumber: null,
      socialMediaAccount: null,
    }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChildrenListPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('en');
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('renders child card with clinical screening status badge', () => {
    const fixture = TestBed.createComponent(ChildrenListPage);
    fixture.detectChanges();

    const childrenReq = httpTesting.expectOne('/api/v1/children');
    expect(childrenReq.request.method).toBe('GET');
    childrenReq.flush({ data: mockChildren });

    // Effect triggers session loading for child_1
    fixture.detectChanges();
    const sessionsReq = httpTesting.expectOne('/api/v1/screening/children/child_1/sessions');
    expect(sessionsReq.request.method).toBe('GET');
    sessionsReq.flush({ data: mockSessions });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Bopha Sok');
    expect(element.textContent).toContain('Screened: Low Risk');
  });

  it('renders registered child count badge in header', () => {
    const fixture = TestBed.createComponent(ChildrenListPage);
    fixture.detectChanges();

    const childrenReq = httpTesting.expectOne('/api/v1/children');
    childrenReq.flush({ data: mockChildren });
    fixture.detectChanges();

    const sessionsReq = httpTesting.expectOne('/api/v1/screening/children/child_1/sessions');
    sessionsReq.flush({ data: mockSessions });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const countBadge = element.querySelector('.child-count-pill');
    expect(countBadge?.textContent).toContain('1 registered');
  });

  it('renders quick clinical navigation chips for screening, progress, and activities', () => {
    const fixture = TestBed.createComponent(ChildrenListPage);
    fixture.detectChanges();

    const childrenReq = httpTesting.expectOne('/api/v1/children');
    childrenReq.flush({ data: mockChildren });
    fixture.detectChanges();

    const sessionsReq = httpTesting.expectOne('/api/v1/screening/children/child_1/sessions');
    sessionsReq.flush({ data: mockSessions });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const chips = element.querySelectorAll<HTMLAnchorElement>('.quick-shortcuts .shortcut-chip');
    expect(chips.length).toBe(3);

    const labels = Array.from(chips).map((c) => c.textContent?.trim());
    expect(labels.some((l) => l?.includes('Screening'))).toBe(true);
    expect(labels.some((l) => l?.includes('Progress'))).toBe(true);
    expect(labels.some((l) => l?.includes('Activities'))).toBe(true);
  });

  it('renders engaging empty state when parent has no registered children', () => {
    const fixture = TestBed.createComponent(ChildrenListPage);
    fixture.detectChanges();

    const childrenReq = httpTesting.expectOne('/api/v1/children');
    childrenReq.flush({ data: [] });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('No child profiles yet');
    const createBtn = element.querySelector('.empty-action-btn');
    expect(createBtn?.textContent).toContain('Create Child Profile');
    expect(createBtn?.getAttribute('href')).toBe('/children/new');
  });

  it('renders prominent dashed Add Another Child card when children exist', () => {
    const fixture = TestBed.createComponent(ChildrenListPage);
    fixture.detectChanges();

    const childrenReq = httpTesting.expectOne('/api/v1/children');
    childrenReq.flush({ data: mockChildren });
    fixture.detectChanges();

    const sessionsReq = httpTesting.expectOne('/api/v1/screening/children/child_1/sessions');
    sessionsReq.flush({ data: mockSessions });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const dashedCard = element.querySelector<HTMLAnchorElement>('.add-child-dashed-card');
    expect(dashedCard).toBeTruthy();
    expect(dashedCard?.textContent).toContain('Add Another Child');
    expect(dashedCard?.getAttribute('href')).toBe('/children/new');
  });
});
