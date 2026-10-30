// @vitest-environment jsdom
import '@angular/compiler';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScreeningSessionResultResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { I18nService } from '../../core/i18n/i18n.service';
import { responseScoreBand, ScreeningResultPage } from './screening-result.page';

try {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch {
  // Already initialized by test runner
}

describe('ScreeningResultPage', () => {
  let httpTesting: HttpTestingController;
  const makeSession = (answerCount = 10): ScreeningSessionResultResponse => ({
    id: 'session_123',
    childId: 'child_456',
    status: 'ANALYZED',
    ageBand: 'TODDLER',
    formKind: 'FULL',
    startedAt: '2026-03-01T09:45:00.000Z',
    submittedAt: '2026-03-01T10:00:00.000Z',
    createdAt: '2026-03-01T09:45:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
    answers: Array.from({ length: answerCount }, (_, index) => ({
      id: `answer_${index}`,
      sessionId: 'session_123',
      questionId: `question_${index}`,
      answerValue: index % 5,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    })),
    result: {
      id: 'result_789',
      score: 18,
      riskLevel: 'MODERATE',
      riskPercentage: 45,
      recommendation: 'Review with a qualified professional.',
      disclaimer: 'Not a medical diagnosis.',
      analysisVersion: 'deterministic-v3',
      analyzedAt: '2026-03-01T10:00:00.000Z',
      categoryBreakdown: [],
    },
    previousComparison: null,
  });
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScreeningResultPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => (key === 'sessionId' ? 'session_123' : null) },
            },
          },
        },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('en');
  });
  afterEach(() => {
    httpTesting?.verify();
    TestBed.resetTestingModule();
  });
  const load = (answerCount = 10) => {
    const fixture = TestBed.createComponent(ScreeningResultPage);
    fixture.detectChanges();
    httpTesting
      .expectOne('/api/v1/screening/sessions/session_123')
      .flush({ data: makeSession(answerCount) });
    httpTesting.expectOne('/api/v1/children/child_456').flush({
      data: { id: 'child_456', firstName: 'Dara', lastName: 'Sok', dateOfBirth: '2024-01-01' },
    });
    fixture.detectChanges();
    return fixture;
  };
  it('renders a compact response-score gauge, explanation, recommendation and actions', () => {
    const compiled = load().nativeElement as HTMLElement;
    expect(compiled.querySelector('.gauge')?.textContent).toContain('45%');
    expect(compiled.querySelector('.score-copy')?.textContent).toContain('Medium');
    expect(compiled.querySelector('.score-copy')?.textContent).toContain(
      'questionnaire response-score band',
    );
    expect(compiled.querySelector('.next-card')?.textContent).toContain(
      'If you have concerns, discuss your observations',
    );
    expect(compiled.textContent).toContain(
      'not an autism diagnosis, probability, or severity level',
    );
    expect(compiled.textContent).toContain('Download PDF');
    expect(compiled.textContent).toContain('Retake Questionnaire');
    expect(compiled.textContent).toContain('Find Support');
    expect(compiled.querySelector('.breakdown')).toBeNull();
    expect(compiled.querySelector('.empathetic-summary-card')).toBeNull();
  });
  it('does not show a percentage when there are no scored answers', () => {
    const compiled = load(0).nativeElement as HTMLElement;
    expect(compiled.querySelector('.gauge')).toBeNull();
    expect(compiled.textContent).toContain('A response score is unavailable');
    expect(compiled.textContent).toContain('Missing answers are not counted as concerns');
  });
  it('prints the compact result for PDF saving', () => {
    const fixture = load();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    fixture.componentInstance.printResult();
    expect(printSpy).toHaveBeenCalledOnce();
    printSpy.mockRestore();
  });
  it('retakes the questionnaire for the same child', () => {
    const fixture = load();
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.retake();
    expect(navigateSpy).toHaveBeenCalledWith(['/screening/new'], {
      queryParams: { childId: 'child_456' },
    });
  });
});

describe('questionnaire response score bands', () => {
  it.each([
    [0, 'none'],
    [1, 'low'],
    [30, 'low'],
    [31, 'medium'],
    [66, 'medium'],
    [67, 'elevated'],
    [100, 'elevated'],
  ] as const)('maps %i percent to the %s band', (score, expected) => {
    expect(responseScoreBand(score)).toBe(expected);
  });
});
