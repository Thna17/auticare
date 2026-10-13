import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScreeningSessionResultResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { I18nService } from '../../core/i18n/i18n.service';
import { ScreeningResultPage } from './screening-result.page';

describe('ScreeningResultPage', () => {
  let httpTesting: HttpTestingController;

  const mockSession: ScreeningSessionResultResponse = {
    id: 'session_123',
    childId: 'child_456',
    status: 'ANALYZED',
    ageBand: 'TODDLER',
    startedAt: '2026-03-01T09:45:00.000Z',
    submittedAt: '2026-03-01T10:00:00.000Z',
    createdAt: '2026-03-01T09:45:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
    answers: [],
    result: {
      id: 'result_789',
      score: 12,
      riskLevel: 'MODERATE',
      riskPercentage: 45,
      recommendation: 'Seek evaluation with pediatrician.',
      disclaimer: 'This screening tool is not a medical diagnosis.',
      analysisVersion: 'v3',
      analyzedAt: '2026-03-01T10:00:00.000Z',
      categoryBreakdown: [
        {
          category: 'Social Communication',
          riskLevel: 'MODERATE',
          riskPercentage: 50,
        },
      ],
    },
    previousComparison: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScreeningResultPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'sessionId' ? 'session_123' : null),
              },
            },
          },
        },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('km');
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('renders screening result and print button', () => {
    const fixture = TestBed.createComponent(ScreeningResultPage);
    fixture.detectChanges();

    const reqSession = httpTesting.expectOne('/api/v1/screening/sessions/session_123');
    reqSession.flush({ data: mockSession });

    const reqChild = httpTesting.expectOne('/api/v1/children/child_456');
    reqChild.flush({
      data: {
        id: 'child_456',
        firstName: 'Dara',
        lastName: 'Sok',
        dateOfBirth: '2024-01-01',
      },
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dara');
    expect(compiled.textContent).toContain('ហានិភ័យមធ្យម');
    expect(compiled.textContent).toContain('ទំនាក់ទំនងសង្គម និងការប្រាស្រ័យទាក់ទង');

    // Visual risk meter
    const gauge = compiled.querySelector('.visual-meter-container');
    expect(gauge).toBeTruthy();
    expect(gauge?.textContent).toContain('45%');
    expect(gauge?.textContent).toContain('ហានិភ័យមធ្យម');

    // Prominent action toolbar
    const toolbar = compiled.querySelector('.prominent-action-toolbar');
    expect(toolbar).toBeTruthy();
    expect(toolbar?.textContent).toContain('កក់ការពិគ្រោះយោបល់ជាមួយវេជ្ជបណ្ឌិតកុមារ');
    expect(toolbar?.textContent).toContain('ស្វែងរកសកម្មភាពលេងជំរុញការលូតលាស់');
    expect(toolbar?.textContent).toContain('បោះពុម្ព ឬរក្សាទុកជារបាយការណ៍ PDF');

    // Domain explanation
    expect(compiled.textContent).toContain('សង្កេតមើលការចូលរួមរួមគ្នា');

    const printBtn = compiled.querySelector('.btn-print');
    expect(printBtn).toBeTruthy();
    expect(printBtn?.textContent).toContain('បោះពុម្ព / រក្សាទុកជា PDF');
  });

  it('invokes window.print when printResult is called', () => {
    const fixture = TestBed.createComponent(ScreeningResultPage);
    fixture.detectChanges();

    const reqSession = httpTesting.expectOne('/api/v1/screening/sessions/session_123');
    reqSession.flush({ data: mockSession });

    const reqChild = httpTesting.expectOne('/api/v1/children/child_456');
    reqChild.flush({
      data: {
        id: 'child_456',
        firstName: 'Dara',
        lastName: 'Sok',
        dateOfBirth: '2024-01-01',
      },
    });

    fixture.detectChanges();

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    const component = fixture.componentInstance;
    component.printResult();

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('appends childId queryParams to next steps action cards for activities and appointments', () => {
    const fixture = TestBed.createComponent(ScreeningResultPage);
    fixture.detectChanges();

    const reqSession = httpTesting.expectOne('/api/v1/screening/sessions/session_123');
    reqSession.flush({ data: mockSession });

    const reqChild = httpTesting.expectOne('/api/v1/children/child_456');
    reqChild.flush({
      data: {
        id: 'child_456',
        firstName: 'Dara',
        lastName: 'Sok',
        dateOfBirth: '2024-01-01',
      },
    });

    fixture.detectChanges();

    const component = fixture.componentInstance;
    const cards = component.nextSteps().cards;

    const activitiesCard = cards.find((c) => c.path === '/activities');
    expect(activitiesCard).toBeTruthy();
    expect(activitiesCard?.queryParams).toEqual({ childId: 'child_456' });

    const appointmentsCard = cards.find((c) => c.path === '/appointments');
    expect(appointmentsCard).toBeTruthy();
    expect(appointmentsCard?.queryParams).toEqual({ childId: 'child_456' });

    const hospitalsCard = cards.find((c) => c.path === '/hospitals');
    expect(hospitalsCard).toBeTruthy();
    expect(hospitalsCard?.queryParams).toBeNull();
  });

  it('renders empathetic summary explanation, concern badge, domain breakdown and disclaimer', () => {
    const fixture = TestBed.createComponent(ScreeningResultPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/v1/screening/sessions/session_123').flush({ data: mockSession });
    httpTesting.expectOne('/api/v1/children/child_456').flush({
      data: {
        id: 'child_456',
        firstName: 'Dara',
        lastName: 'Sok',
        dateOfBirth: '2024-01-01',
      },
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Concern pill
    const concernPill = compiled.querySelector('.concern-pill');
    expect(concernPill).toBeTruthy();
    expect(concernPill?.textContent).toContain('ការបារម្ភកម្រិតមធ្យម');

    // Empathetic summary card
    const summaryCard = compiled.querySelector('.empathetic-summary-card');
    expect(summaryCard).toBeTruthy();
    expect(summaryCard?.textContent).toContain(
      'សង្កេតឃើញចំណុចលូតលាស់ដែលគួរយកចិត្តទុកដាក់កម្រិតស្រាល',
    );
    expect(summaryCard?.textContent).toContain('ចម្លើយមួយចំនួនបង្ហាញពីភាពខុសប្លែកបន្តិចបន្តួច');
    expect(summaryCard?.textContent).toContain(
      'លទ្ធផលនេះមិនមែនជាការធ្វើរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រទេ ប៉ុន្តែជាការណែនាំដើម្បីជួយគាំទ្រដល់ការលូតលាស់របស់កុមារ',
    );

    // Developmental domain breakdown
    const breakdown = compiled.querySelector('.breakdown');
    expect(breakdown).toBeTruthy();
    expect(breakdown?.textContent).toContain('ការវិភាគតាមផ្នែកលូតលាស់');
    expect(breakdown?.textContent).toContain('ទំនាក់ទំនងសង្គម និងការប្រាស្រ័យទាក់ទង');
    const progressBar = breakdown?.querySelector('[role="progressbar"]');
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('50');

    // Transparent medical disclaimer
    const disclaimer = compiled.querySelector('.prominent-disclaimer-callout');
    expect(disclaimer).toBeTruthy();
    expect(disclaimer?.textContent).toContain('ការបញ្ជាក់មិនមែនរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រ');
    expect(disclaimer?.textContent).toContain(
      'ឧបករណ៍វាយតម្លៃនេះមិនមែនជាការធ្វើរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រឡើយ។',
    );
    expect(disclaimer?.textContent).toContain(
      'លទ្ធផលនេះមិនមែនជាការធ្វើរោគវិនិច្ឆ័យវេជ្ជសាស្ត្រទេ ប៉ុន្តែជាការណែនាំដើម្បីជួយគាំទ្រដល់ការលូតលាស់របស់កុមារ',
    );

    // Action plan buttons
    const toolbar = compiled.querySelector('.prominent-action-toolbar');
    expect(toolbar?.textContent).toContain('កក់ការពិគ្រោះយោបល់ជាមួយវេជ្ជបណ្ឌិតកុមារ');
    expect(toolbar?.textContent).toContain('ស្វែងរកសកម្មភាពលេងជំរុញការលូតលាស់');
    expect(toolbar?.textContent).toContain('បោះពុម្ព ឬរក្សាទុកជារបាយការណ៍ PDF');
  });

  it('renders screening result cleanly in English when language is en', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    const fixture = TestBed.createComponent(ScreeningResultPage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/v1/screening/sessions/session_123').flush({ data: mockSession });
    httpTesting.expectOne('/api/v1/children/child_456').flush({
      data: {
        id: 'child_456',
        firstName: 'Dara',
        lastName: 'Sok',
        dateOfBirth: '2024-01-01',
      },
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dara');
    expect(compiled.textContent).toContain('Moderate Risk');
    expect(compiled.textContent).toContain('Social Communication');

    const concernPill = compiled.querySelector('.concern-pill');
    expect(concernPill?.textContent).toContain('Moderate Concern');

    const summaryCard = compiled.querySelector('.empathetic-summary-card');
    expect(summaryCard?.textContent).toContain('Mild Developmental Nuances Observed');

    const breakdown = compiled.querySelector('.breakdown');
    expect(breakdown?.textContent).toContain('Developmental Domain Breakdown');

    const disclaimer = compiled.querySelector('.prominent-disclaimer-callout');
    expect(disclaimer?.textContent).toContain('Clinical Non-Diagnostic Reassurance');

    const toolbar = compiled.querySelector('.prominent-action-toolbar');
    expect(toolbar?.textContent).toContain('Book a Pediatrician Consultation');
    expect(toolbar?.textContent).toContain('Explore Recommended Activities');
    expect(toolbar?.textContent).toContain('Print / Save PDF');

    const printBtn = compiled.querySelector('.btn-print');
    expect(printBtn?.textContent).toContain('Print / Save PDF');
  });

  it('cleanly decouples risk and concern badges for LOW concern, and translates domain analysis for Communication, Social Interaction, and Sensory Flexibility', () => {
    const lowSession: ScreeningSessionResultResponse = {
      ...mockSession,
      result: {
        id: 'result_low',
        score: 4,
        riskLevel: 'LOW',
        riskPercentage: 10,
        recommendation: 'Continue supportive play.',
        disclaimer: 'This screening tool is not a medical diagnosis.',
        analysisVersion: 'v3',
        analyzedAt: '2026-03-01T10:00:00.000Z',
        categoryBreakdown: [
          { category: 'Communication', riskLevel: 'LOW', riskPercentage: 8 },
          { category: 'Social Interaction', riskLevel: 'LOW', riskPercentage: 12 },
          { category: 'Sensory Flexibility', riskLevel: 'LOW', riskPercentage: 10 },
        ],
      },
    };

    // Test in Khmer mode first
    const fixtureKm = TestBed.createComponent(ScreeningResultPage);
    fixtureKm.detectChanges();

    httpTesting.expectOne('/api/v1/screening/sessions/session_123').flush({ data: lowSession });
    httpTesting.expectOne('/api/v1/children/child_456').flush({
      data: { id: 'child_456', firstName: 'Bopha', lastName: 'Chan', dateOfBirth: '2024-01-01' },
    });
    fixtureKm.detectChanges();

    const compiledKm = fixtureKm.nativeElement as HTMLElement;
    expect(compiledKm.textContent).toContain('ហានិភ័យទាប');
    const concernPillKm = compiledKm.querySelector('.concern-pill');
    expect(concernPillKm?.textContent?.trim()).toBe('ការបារម្ភកម្រិតទាប');

    // Domain breakdown in Khmer
    expect(compiledKm.textContent).toContain('ការប្រាស្រ័យទាក់ទង');
    expect(compiledKm.textContent).toContain('ទំនាក់ទំនងសង្គម');
    expect(compiledKm.textContent).toContain('ភាពបត់បែននៃញាណដឹង');
    expect(compiledKm.textContent).toContain('សង្កេតមើលការបញ្ចេញសំឡេង');
    expect(compiledKm.textContent).toContain('សង្កេតមើលការសម្លឹងភ្នែក');
    expect(compiledKm.textContent).toContain('វាយតម្លៃការឆ្លើយតបញាណដឹង');

    // Switch to English
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    const fixtureEn = TestBed.createComponent(ScreeningResultPage);
    fixtureEn.detectChanges();

    httpTesting.expectOne('/api/v1/screening/sessions/session_123').flush({ data: lowSession });
    httpTesting.expectOne('/api/v1/children/child_456').flush({
      data: { id: 'child_456', firstName: 'Bopha', lastName: 'Chan', dateOfBirth: '2024-01-01' },
    });
    fixtureEn.detectChanges();

    const compiledEn = fixtureEn.nativeElement as HTMLElement;
    expect(compiledEn.textContent).toContain('Low Risk');
    const concernPillEn = compiledEn.querySelector('.concern-pill');
    expect(concernPillEn?.textContent?.trim()).toBe('Low Concern');

    // Domain breakdown in English
    expect(compiledEn.textContent).toContain('Communication');
    expect(compiledEn.textContent).toContain('Social Interaction');
    expect(compiledEn.textContent).toContain('Sensory Flexibility');
    expect(compiledEn.textContent).toContain('Observes vocalization');
    expect(compiledEn.textContent).toContain('Observes eye contact');
    expect(compiledEn.textContent).toContain('Evaluates sensory responsiveness');
  });
});
