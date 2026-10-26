import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ScreeningQuestionResponse,
  ScreeningSessionDetailResponse,
} from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { I18nService } from '../../core/i18n/i18n.service';
import { ScreeningSessionPage } from './screening-session.page';

describe('ScreeningSessionPage', () => {
  let httpTesting: HttpTestingController;

  const mockQuestions: ScreeningQuestionResponse[] = [
    {
      id: 'q_1',
      questionText: 'Does your child make consistent eye contact when interacting?',
      category: 'Social Interaction',
      polarity: 'DIRECT',
      displayOrder: 1,
      formKind: 'FULL',
    },
    {
      id: 'q_2',
      questionText: 'Does your child respond when their name is called across the room?',
      category: 'Communication',
      polarity: 'DIRECT',
      displayOrder: 2,
      formKind: 'FULL',
    },
  ];

  const mockSession: ScreeningSessionDetailResponse = {
    id: 'session_1',
    childId: 'child_1',
    status: 'DRAFT',
    ageBand: 'PRESCHOOL',
    formKind: 'FULL',
    startedAt: '2026-03-01T00:00:00.000Z',
    submittedAt: null,
    answers: [],
    result: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScreeningSessionPage],
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
                get: (key: string) => (key === 'sessionId' ? 'session_1' : null),
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

  it('renders sticky progress bar, category name, question text, guidance callout, and answer options', () => {
    const fixture = TestBed.createComponent(ScreeningSessionPage);
    fixture.detectChanges();

    const sessionReq = httpTesting.expectOne('/api/v1/screening/sessions/session_1');
    sessionReq.flush({ data: mockSession });

    const questionsReq = httpTesting.expectOne('/api/v1/screening/questions?ageBand=PRESCHOOL');
    questionsReq.flush({ data: mockQuestions });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('ត្រឡប់ទៅទំព័រវាយតម្លៃ');
    expect(element.textContent).toContain('សំណួរទី 1 ក្នុងចំណោម 2');
    expect(element.textContent).toContain('បញ្ចប់បាន 50%');
    expect(element.textContent).toContain('ទំនាក់ទំនងសង្គម');
    expect(element.textContent).toContain('តើកូនរបស់អ្នករក្សាការសម្លឹងមើលភ្នែកជាប់លាប់');
    expect(element.textContent).toContain('ការណែនាំសង្កេត៖');
    expect(element.textContent).toContain('សំណួរមុន');
    expect(element.textContent).toContain('សំណួរបន្ទាប់');

    const answerButtons = element.querySelectorAll<HTMLButtonElement>('.answer-btn');
    expect(answerButtons.length).toBe(5);
    const labels = Array.from(answerButtons).map((btn) => btn.textContent?.trim());
    expect(labels.some((l) => l?.includes('មិនដែល'))).toBe(true);
    expect(labels.some((l) => l?.includes('កម្រ'))).toBe(true);
    expect(labels.some((l) => l?.includes('ម្តងម្កាល'))).toBe(true);
    expect(labels.some((l) => l?.includes('ញឹកញាប់'))).toBe(true);
    expect(labels.some((l) => l?.includes('ជានិច្ច'))).toBe(true);
    expect(element.textContent).toContain('រក្សាទុក និងបន្តពេលក្រោយ');
  });

  it('renders sticky progress bar and question in English when language is en', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    const fixture = TestBed.createComponent(ScreeningSessionPage);
    fixture.detectChanges();

    const sessionReq = httpTesting.expectOne('/api/v1/screening/sessions/session_1');
    sessionReq.flush({ data: mockSession });

    const questionsReq = httpTesting.expectOne('/api/v1/screening/questions?ageBand=PRESCHOOL');
    questionsReq.flush({ data: mockQuestions });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Back to Screening');
    expect(element.textContent).toContain('Question 1 of 2');
    expect(element.textContent).toContain('50% Completed');
    expect(element.textContent).toContain('Social Interaction');
    expect(element.textContent).toContain('Does your child make consistent eye contact');
    expect(element.textContent).toContain('Observational guidance:');
    expect(element.textContent).toContain('Previous Question');
    expect(element.textContent).toContain('Next Question');

    const answerButtons = element.querySelectorAll<HTMLButtonElement>('.answer-btn');
    expect(answerButtons.length).toBe(5);
    const labels = Array.from(answerButtons).map((btn) => btn.textContent?.trim());
    expect(labels.some((l) => l?.includes('Never'))).toBe(true);
    expect(labels.some((l) => l?.includes('Rarely'))).toBe(true);
    expect(labels.some((l) => l?.includes('Sometimes'))).toBe(true);
    expect(labels.some((l) => l?.includes('Often'))).toBe(true);
    expect(labels.some((l) => l?.includes('Always'))).toBe(true);
    expect(element.textContent).toContain('Save & Finish Later');
  });

  it('selects answer and auto-advances to next question', () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(ScreeningSessionPage);
      fixture.detectChanges();

      const sessionReq = httpTesting.expectOne('/api/v1/screening/sessions/session_1');
      sessionReq.flush({ data: mockSession });

      const questionsReq = httpTesting.expectOne('/api/v1/screening/questions?ageBand=PRESCHOOL');
      questionsReq.flush({ data: mockQuestions });

      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.currentIndex()).toBe(0);

      // Select "Always" (4)
      component.selectAnswer(4);
      fixture.detectChanges();

      const answerReq = httpTesting.expectOne('/api/v1/screening/sessions/session_1/answers');
      expect(answerReq.request.method).toBe('PATCH');
      expect(answerReq.request.body).toEqual({ questionId: 'q_1', answerValue: 4 });
      answerReq.flush({ data: { questionId: 'q_1', answerValue: 4 } });

      // Advance auto-advance delay (320ms + 120ms transition)
      vi.advanceTimersByTime(500);
      fixture.detectChanges();

      expect(component.currentIndex()).toBe(1);
      expect(fixture.nativeElement.textContent).toContain('សំណួរទី 2 ក្នុងចំណោម 2');
      expect(fixture.nativeElement.textContent).toContain('ការប្រាស្រ័យទាក់ទង');
      expect(fixture.nativeElement.textContent).toContain('បញ្ចប់ការវាយតម្លៃ');
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles keyboard shortcuts 1 through 5 for 5-point answering', () => {
    const fixture = TestBed.createComponent(ScreeningSessionPage);
    fixture.detectChanges();

    const sessionReq = httpTesting.expectOne('/api/v1/screening/sessions/session_1');
    sessionReq.flush({ data: mockSession });

    const questionsReq = httpTesting.expectOne('/api/v1/screening/questions?ageBand=PRESCHOOL');
    questionsReq.flush({ data: mockQuestions });

    fixture.detectChanges();

    const component = fixture.componentInstance;
    const selectSpy = vi.spyOn(component, 'selectAnswer').mockImplementation(() => {});

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(selectSpy).toHaveBeenCalledWith(0);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
    expect(selectSpy).toHaveBeenCalledWith(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }));
    expect(selectSpy).toHaveBeenCalledWith(2);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '4' }));
    expect(selectSpy).toHaveBeenCalledWith(3);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }));
    expect(selectSpy).toHaveBeenCalledWith(4);
  });

  it('opens and closes save & finish later modal dialog', () => {
    const fixture = TestBed.createComponent(ScreeningSessionPage);
    fixture.detectChanges();

    const sessionReq = httpTesting.expectOne('/api/v1/screening/sessions/session_1');
    sessionReq.flush({ data: mockSession });

    const questionsReq = httpTesting.expectOne('/api/v1/screening/questions?ageBand=PRESCHOOL');
    questionsReq.flush({ data: mockQuestions });

    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.showExitModal()).toBe(false);

    component.openExit();
    fixture.detectChanges();
    expect(component.showExitModal()).toBe(true);

    component.cancelExit();
    fixture.detectChanges();
    expect(component.showExitModal()).toBe(false);
  });
});
