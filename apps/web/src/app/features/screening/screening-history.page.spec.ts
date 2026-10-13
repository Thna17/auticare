import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChildResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { ScreeningHistoryPage } from './screening-history.page';

describe('ScreeningHistoryPage', () => {
  let httpTesting: HttpTestingController;

  const mockChildren: ChildResponse[] = [
    {
      id: 'child_1',
      firstName: 'Bopha',
      dateOfBirth: '2021-05-15',
      notes: null,
      archivedAt: null,
    },
    {
      id: 'child_2',
      firstName: 'Kosal',
      dateOfBirth: '2022-03-10',
      notes: null,
      archivedAt: null,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScreeningHistoryPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('selects first child by default when no childId query param is provided', () => {
    const fixture = TestBed.createComponent(ScreeningHistoryPage);
    fixture.detectChanges();

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    expect(reqChildren.request.method).toBe('GET');
    reqChildren.flush({ data: mockChildren });

    const reqSessions = httpTesting.expectOne('/api/v1/screening/children/child_1/sessions');
    expect(reqSessions.request.method).toBe('GET');
    reqSessions.flush({ data: [] });

    fixture.detectChanges();
    expect(fixture.componentInstance.selectedChildId()).toBe('child_1');
  });

  it('selects requested child when childId query param matches', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ScreeningHistoryPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'childId' ? 'child_2' : null),
              },
            },
            queryParamMap: {
              subscribe: () => ({ unsubscribe: () => undefined }),
            },
          },
        },
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);

    const fixture = TestBed.createComponent(ScreeningHistoryPage);
    fixture.detectChanges();

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: mockChildren });

    const reqSessions = httpTesting.expectOne('/api/v1/screening/children/child_2/sessions');
    reqSessions.flush({ data: [] });

    fixture.detectChanges();
    expect(fixture.componentInstance.selectedChildId()).toBe('child_2');
  });

  it('renders developmental risk progression timeline when completed sessions exist', () => {
    const fixture = TestBed.createComponent(ScreeningHistoryPage);
    fixture.detectChanges();

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: mockChildren });

    const mockCompletedSessions = [
      {
        id: 'session_old',
        childId: 'child_1',
        status: 'ANALYZED' as const,
        ageBand: 'TODDLER',
        startedAt: '2025-09-01T00:00:00.000Z',
        submittedAt: '2025-09-01T00:15:00.000Z',
        createdAt: '2025-09-01T00:00:00.000Z',
        updatedAt: '2025-09-01T00:15:00.000Z',
        answers: [],
        result: {
          id: 'result_old',
          score: 18,
          riskPercentage: 60,
          riskLevel: 'MODERATE' as const,
          recommendation: 'Initial evaluation.',
          disclaimer: 'Not a diagnosis.',
          analysisVersion: 'v3',
          analyzedAt: '2025-09-01T00:15:00.000Z',
          categoryBreakdown: [],
        },
      },
      {
        id: 'session_new',
        childId: 'child_1',
        status: 'ANALYZED' as const,
        ageBand: 'PRESCHOOL',
        startedAt: '2026-03-01T00:00:00.000Z',
        submittedAt: '2026-03-01T00:15:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:15:00.000Z',
        answers: [],
        result: {
          id: 'result_new',
          score: 8,
          riskPercentage: 25,
          riskLevel: 'LOW' as const,
          recommendation: 'Continue monitoring.',
          disclaimer: 'Not a diagnosis.',
          analysisVersion: 'v3',
          analyzedAt: '2026-03-01T00:15:00.000Z',
          categoryBreakdown: [],
        },
      },
    ];

    const reqSessions = httpTesting.expectOne('/api/v1/screening/children/child_1/sessions');
    reqSessions.flush({ data: mockCompletedSessions });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const timeline = element.querySelector('.timeline-section');
    expect(timeline).toBeTruthy();
    expect(timeline?.textContent).toContain('Developmental Risk Progression Timeline');
    expect(timeline?.textContent).toContain('2 assessments recorded');
    expect(timeline?.textContent).toContain('35% reduction in risk indicator');

    const nodes = element.querySelectorAll('.timeline-node');
    expect(nodes.length).toBe(2);
  });
});
