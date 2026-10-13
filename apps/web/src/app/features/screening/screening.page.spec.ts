import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChildResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { ScreeningPage } from './screening.page';

describe('ScreeningPage', () => {
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
      imports: [ScreeningPage],
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
    const fixture = TestBed.createComponent(ScreeningPage);
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
      imports: [ScreeningPage],
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

    const fixture = TestBed.createComponent(ScreeningPage);
    fixture.detectChanges();

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: mockChildren });

    const reqSessions = httpTesting.expectOne('/api/v1/screening/children/child_2/sessions');
    reqSessions.flush({ data: [] });

    fixture.detectChanges();
    expect(fixture.componentInstance.selectedChildId()).toBe('child_2');
  });

  it('renders onboarding empty state with CTA to add child when parent has no children', () => {
    const fixture = TestBed.createComponent(ScreeningPage);
    fixture.detectChanges();

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: [] });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome to Developmental Screening');
    expect(compiled.textContent).toContain(
      "Add your child's profile to begin a personalized developmental screening.",
    );

    const ctaBtn = compiled.querySelector('.screening-onboarding-card .btn-primary');
    expect(ctaBtn).toBeTruthy();
    expect(ctaBtn?.textContent).toContain('Add Child Profile');
  });
});
