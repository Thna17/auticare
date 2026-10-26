import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ChildInsightResponse, ScreeningSessionResultResponse } from '@auticare/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nService } from '../../../core/i18n/i18n.service';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ParentAnalysisComponent } from './parent-analysis.component';

const insight = (overrides: Partial<ChildInsightResponse> = {}): ChildInsightResponse => ({
  childId: 'child-1',
  windowStart: '2026-10-01T00:00:00.000Z',
  windowEnd: '2026-10-25T00:00:00.000Z',
  observationCount: 6,
  distinctDays: 4,
  patterns: [
    {
      category: 'SLEEP',
      count: 6,
      share: 0.75,
      averageIntensity: 3.2,
      trend: 'INCREASED',
      weekdayCount: 5,
      weekendCount: 1,
      timeOfDay: 'NIGHT',
    },
  ],
  summary: 'Audit string.',
  analysisVersion: 'patterns-v1',
  generatedAt: '2026-10-25T10:00:00.000Z',
  ...overrides,
});

const assessment = (): ScreeningSessionResultResponse =>
  ({
    id: 'session-1',
    childId: 'child-1',
    status: 'ANALYZED',
    ageBand: 'TODDLER',
    formKind: 'SHORT',
    startedAt: '2026-10-01T00:00:00.000Z',
    submittedAt: '2026-10-01T00:10:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:10:00.000Z',
    answers: [],
    result: {
      id: 'result-1',
      score: 20,
      riskPercentage: 50,
      riskLevel: 'MODERATE',
      recommendation: 'Watch a few areas.',
      disclaimer: 'Not a diagnosis.',
      analysisVersion: 'deterministic-v3',
      analyzedAt: '2026-10-01T00:10:00.000Z',
      categoryBreakdown: [
        { category: 'Communication', riskPercentage: 75, riskLevel: 'HIGH' },
        { category: 'Social Interaction', riskPercentage: 25, riskLevel: 'LOW' },
      ],
    },
    previousComparison: null,
  }) as ScreeningSessionResultResponse;

describe('ParentAnalysisComponent', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ParentAnalysisComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    TestBed.inject(I18nService).setLanguage('en');
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  const render = (childId: string | null) => {
    const fixture = TestBed.createComponent(ParentAnalysisComponent);
    fixture.componentRef.setInput('childId', childId);
    fixture.detectChanges();
    return fixture;
  };

  it('shows the concern band and the areas from the most recent short assessment', () => {
    const fixture = render('child-1');

    httpTesting
      .expectOne((request) => request.url.startsWith('/api/v1/insights/children/child-1'))
      .flush({ data: insight({ observationCount: 0, patterns: [] }) });
    httpTesting
      .expectOne('/api/v1/screening/children/child-1/latest?formKind=SHORT')
      .flush({ data: assessment() });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Moderate');
    expect(text).toContain('A few areas are worth watching');
    expect(text).toContain('Communication');
    expect(text).toContain('See the full result');
  });

  it('turns recorded counts into a pattern sentence, not a verdict', () => {
    const fixture = render('child-1');

    httpTesting
      .expectOne((request) => request.url.startsWith('/api/v1/insights/children/child-1'))
      .flush({ data: insight() });
    httpTesting
      .expectOne('/api/v1/screening/children/child-1/latest?formKind=SHORT')
      .flush({ data: null });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('mostly happens on school days (5 of 6)');
    expect(text).toContain('most often recorded at night');
    expect(text).toContain('has increased');
    expect(text).toContain('Not a diagnosis');
    // No child assessment yet: the card offers the check-in instead.
    expect(text).toContain('You have not done the short check-in yet');
  });

  it('offers the check-in when nothing has been recorded', () => {
    const fixture = render('child-1');

    httpTesting
      .expectOne((request) => request.url.startsWith('/api/v1/insights/children/child-1'))
      .flush({ data: insight({ observationCount: 0, distinctDays: 0, patterns: [] }) });
    httpTesting
      .expectOne('/api/v1/screening/children/child-1/latest?formKind=SHORT')
      .flush({ data: null });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Nothing recorded yet');
  });

  it('makes no request until a child is selected', () => {
    const fixture = render(null);
    fixture.detectChanges();
    // afterEach's verify() is the assertion: no outstanding requests.
    expect(fixture.componentInstance).toBeTruthy();
  });
});
