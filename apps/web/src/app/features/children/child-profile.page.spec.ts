import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChildResponse, ScreeningSessionDetailResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { I18nService, LANG_STORAGE_KEY } from '../../core/i18n/i18n.service';
import { ChildProfilePage } from './child-profile.page';

describe('ChildProfilePage', () => {
  let httpTesting: HttpTestingController;

  const mockChild: ChildResponse = {
    id: 'child_1',
    firstName: 'Bopha',
    lastName: 'Sok',
    dateOfBirth: '2021-05-15',
    address: 'Phnom Penh',
    notes: 'Loves soft textures.',
    archivedAt: null,
  };

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

  beforeEach(() => {
    localStorage.setItem(LANG_STORAGE_KEY, 'en');
    TestBed.configureTestingModule({
      imports: [ChildProfilePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'childId' ? 'child_1' : null),
              },
            },
          },
        },
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads child profile, derives screening risk badge, and provides clinical action links', () => {
    const fixture = TestBed.createComponent(ChildProfilePage);
    fixture.detectChanges();

    const childReq = httpTesting.expectOne('/api/v1/children/child_1');
    expect(childReq.request.method).toBe('GET');
    childReq.flush({ data: mockChild });

    const sessionReq = httpTesting.expectOne('/api/v1/screening/children/child_1/sessions');
    expect(sessionReq.request.method).toBe('GET');
    sessionReq.flush({ data: mockSessions });

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Bopha Sok');
    expect(element.textContent).toContain('Low Risk');

    const lastNameInput = element.querySelector('input[formControlName="lastName"]');
    expect(lastNameInput).toBeTruthy();
    const addressInput = element.querySelector('input[formControlName="address"]');
    expect(addressInput).toBeTruthy();

    const links = element.querySelectorAll<HTMLAnchorElement>('.clinical-action-btn');
    expect(links.length).toBe(3);
    const linkTexts = Array.from(links).map((l) => l.textContent?.trim());
    expect(linkTexts).toContain('Start Screening');
    expect(linkTexts).toContain('View Progress');
    expect(linkTexts).toContain('Browse Activities');

    expect(element.textContent).toContain('Clinical Care & Development Snapshot');
    expect(element.textContent).toContain('Chronological Age');
    expect(element.textContent).toContain('Active');

    const avatar = element.querySelector<HTMLElement>('.avatar');
    expect(avatar).toBeTruthy();
    expect(avatar?.textContent?.trim()).toBe('BS');
    expect(avatar?.getAttribute('style')).toContain('background');
  });

  it('renders support snapshot cards for school, clinical team, and latest assessment', () => {
    const fixture = TestBed.createComponent(ChildProfilePage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/v1/children/child_1').flush({ data: mockChild });
    httpTesting
      .expectOne('/api/v1/screening/children/child_1/sessions')
      .flush({ data: mockSessions });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const snapshotSection = element.querySelector('.support-snapshot-section');
    expect(snapshotSection).toBeTruthy();
    expect(snapshotSection?.textContent).toContain('Support Snapshot');
    expect(snapshotSection?.textContent).toContain('Inclusive Education Partner');
    expect(snapshotSection?.textContent).toContain('Developmental Pediatrics Specialist');
    expect(snapshotSection?.textContent).toContain('Low Risk');

    const schoolLink = snapshotSection?.querySelector('.school-card .snapshot-card-link');
    expect(schoolLink).toBeTruthy();
  });

  it('renders prominent action toolbar with child-specific screening and booking actions', () => {
    const fixture = TestBed.createComponent(ChildProfilePage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/v1/children/child_1').flush({ data: mockChild });
    httpTesting
      .expectOne('/api/v1/screening/children/child_1/sessions')
      .flush({ data: mockSessions });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const toolbar = element.querySelector('.child-action-toolbar');
    expect(toolbar).toBeTruthy();
    expect(toolbar?.textContent).toContain('Care Actions for Bopha');
    expect(toolbar?.textContent).toContain('Start Screening for Bopha');
    expect(toolbar?.textContent).toContain('Book Specialist');
  });

  it('renders developmental milestones timeline with chronological items', () => {
    const fixture = TestBed.createComponent(ChildProfilePage);
    fixture.detectChanges();

    httpTesting.expectOne('/api/v1/children/child_1').flush({ data: mockChild });
    httpTesting
      .expectOne('/api/v1/screening/children/child_1/sessions')
      .flush({ data: mockSessions });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const timeline = element.querySelector('.milestones-timeline-section');
    expect(timeline).toBeTruthy();
    expect(timeline?.textContent).toContain('Developmental Milestones Timeline');
    expect(timeline?.textContent).toContain('Autism Screening Assessment');
    expect(timeline?.textContent).toContain('Low Risk');
    expect(timeline?.textContent).toContain('School Collaboration');
    expect(timeline?.textContent).toContain('Home Sensory Integration & Play Routine');

    const items = element.querySelectorAll('.milestone-item');
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it('formats chronological age accurately in years and months', () => {
    const fixture = TestBed.createComponent(ChildProfilePage);
    const component = fixture.componentInstance;
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    const now = new Date();

    // Newborn: today
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    expect(component.ageLabel(todayStr)).toBe('Newborn');

    // 5 months ago
    const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, now.getDate());
    const fiveMonthsStr = `${fiveMonthsAgo.getFullYear()}-${pad(fiveMonthsAgo.getMonth() + 1)}-${pad(fiveMonthsAgo.getDate())}`;
    expect(component.ageLabel(fiveMonthsStr)).toContain('5 months old');

    // 2 years ago exact
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    const twoYearsStr = `${twoYearsAgo.getFullYear()}-${pad(twoYearsAgo.getMonth() + 1)}-${pad(twoYearsAgo.getDate())}`;
    expect(component.ageLabel(twoYearsStr)).toBe('2 years old');

    // 3 years 4 months ago
    const threeYearsFourMonthsAgo = new Date(
      now.getFullYear() - 3,
      now.getMonth() - 4,
      now.getDate(),
    );
    const threeYFourMStr = `${threeYearsFourMonthsAgo.getFullYear()}-${pad(threeYearsFourMonthsAgo.getMonth() + 1)}-${pad(threeYearsFourMonthsAgo.getDate())}`;
    expect(component.ageLabel(threeYFourMStr)).toBe('3 years 4 months');

    // Khmer mode
    i18n.setLanguage('km');
    expect(component.ageLabel(todayStr)).toBe('ទារកទើបកើត');
    expect(component.ageLabel(threeYFourMStr)).toBe('3 ឆ្នាំ 4 ខែ');
  });
});
