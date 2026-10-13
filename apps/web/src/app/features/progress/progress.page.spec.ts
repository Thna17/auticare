import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { ChildrenApi } from '../children/data-access/children.api';
import { ParentActivityApi } from './data-access/parent-activity.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { ActivitiesApi } from '../activities/data-access/activities.api';
import { I18nService, LANG_STORAGE_KEY } from '../../core/i18n/i18n.service';
import { ProgressPage } from './progress.page';

describe('ProgressPage', () => {
  let fixture: ComponentFixture<ProgressPage>;
  let component: ProgressPage;
  let mockChildrenApi: {
    listChildren: ReturnType<typeof vi.fn>;
  };
  let mockActivityApi: {
    listActivityReports: ReturnType<typeof vi.fn>;
  };
  let mockScreeningApi: {
    listSessions: ReturnType<typeof vi.fn>;
  };
  let mockActivitiesApi: {
    listProgress: ReturnType<typeof vi.fn>;
  };

  const sampleReport1 = {
    id: 'rep_1',
    childId: 'ch_1',
    schoolId: 'sch_1',
    schoolName: 'AutiCare Academy',
    reporterId: 'staff_1',
    title: 'Morning Sensory Session',
    summary: 'Great engagement and communication today.',
    teacherObservation: 'Progressing nicely.',
    recommendations: 'Practice turn-taking at home.',
    performanceMetrics: {
      participation: 8,
      communication: 7,
      socialInteraction: 9,
      attention: 8,
      emotionalRegulation: 7,
      taskCompletion: 8,
    },
    activityCategory: 'Sensory',
    activityDate: '2026-10-08',
    duration: 45,
    status: 'SUBMITTED' as const,
    photoUrls: [],
    reporter: { firstName: 'Sarah', lastName: 'Williams' },
    createdAt: '2026-10-08T10:00:00.000Z',
    updatedAt: '2026-10-08T10:00:00.000Z',
  };

  const sampleReport2 = {
    id: 'rep_2',
    childId: 'ch_2',
    schoolId: 'sch_1',
    schoolName: 'AutiCare Academy',
    reporterId: 'staff_1',
    title: 'Speech and Play Therapy',
    summary: 'Practiced two-word phrases.',
    teacherObservation: 'Good response to visual cards.',
    recommendations: 'Read story books before bedtime.',
    performanceMetrics: {
      participation: 9,
      communication: 8,
      socialInteraction: 8,
      attention: 7,
      emotionalRegulation: 8,
      taskCompletion: 9,
    },
    activityCategory: 'Communication',
    activityDate: '2026-10-09',
    duration: 30,
    status: 'SUBMITTED' as const,
    photoUrls: [],
    reporter: { firstName: 'David', lastName: 'Miller' },
    createdAt: '2026-10-09T10:00:00.000Z',
    updatedAt: '2026-10-09T10:00:00.000Z',
  };

  const sampleSession1 = {
    id: 'sess_1',
    childId: 'ch_1',
    status: 'COMPLETED' as const,
    ageBand: 'TODDLER_18_24' as const,
    startedAt: '2026-10-07T09:00:00.000Z',
    submittedAt: '2026-10-07T09:30:00.000Z',
    createdAt: '2026-10-07T09:00:00.000Z',
    updatedAt: '2026-10-07T09:30:00.000Z',
    answers: [],
    result: {
      id: 'res_1',
      sessionId: 'sess_1',
      totalScore: 12,
      riskPercentage: 25,
      riskLevel: 'LOW' as const,
      recommendation: 'Continue regular milestone monitoring.',
      disclaimer: 'Clinical evaluation recommended for comprehensive diagnosis.',
      analysisVersion: 'v3',
      analyzedAt: '2026-10-07T09:30:00.000Z',
      categoryBreakdown: [],
    },
  };

  const sampleActivityProg1 = {
    id: 'act_prog_1',
    childId: 'ch_1',
    activityId: 'act_1',
    activityTitle: 'Sensory Bubble Play',
    startedAt: '2026-10-05T10:00:00.000Z',
    completedAt: '2026-10-05T10:30:00.000Z',
    parentObservation: 'Loves popping bubbles with index finger.',
  };

  beforeEach(() => {
    localStorage.setItem(LANG_STORAGE_KEY, 'en');

    mockChildrenApi = {
      listChildren: vi.fn().mockReturnValue(
        of([
          { id: 'ch_1', firstName: 'Tommy' },
          { id: 'ch_2', firstName: 'Lily' },
        ]),
      ),
    };

    mockActivityApi = {
      listActivityReports: vi.fn().mockImplementation((childId: string) => {
        if (childId === 'ch_1') {
          return of({
            reports: [sampleReport1],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          });
        }
        if (childId === 'ch_2') {
          return of({
            reports: [sampleReport2],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          });
        }
        return of({
          reports: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }),
    };

    mockScreeningApi = {
      listSessions: vi.fn().mockImplementation((childId: string) => {
        if (childId === 'ch_1') {
          return of([sampleSession1]);
        }
        return of([]);
      }),
    };

    mockActivitiesApi = {
      listProgress: vi.fn().mockImplementation((childId: string) => {
        if (childId === 'ch_1') {
          return of([sampleActivityProg1]);
        }
        return of([]);
      }),
    };
  });

  it('selects first child and its report by default when no reportId query param is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectedChildId()).toBe('ch_1');
    expect(component.selectedReportId()).toBe('rep_1');
    expect(component.report()?.title).toBe('Morning Sensory Session');
    expect(component.activeTab()).toBe('reports');
  });

  it('deep links to the correct child and report when reportId query param is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({ reportId: 'rep_2' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Must find and switch to ch_2 (Lily) because rep_2 belongs to ch_2
    expect(component.selectedChildId()).toBe('ch_2');
    expect(component.selectedReportId()).toBe('rep_2');
    expect(component.report()?.title).toBe('Speech and Play Therapy');
    expect(component.activeTab()).toBe('reports');
  });

  it('switches between School Reports and Developmental Trajectory tabs and renders trajectory metrics', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.activeTab()).toBe('reports');

    component.setTab('trajectory');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('trajectory');
    expect(component.screeningSessions().length).toBe(1);
    expect(component.latestRiskLevel()).toBe('LOW');
    expect(component.completedScreenings().length).toBe(1);
    expect(component.completedActivities().length).toBe(1);
    expect(component.completedActivities()[0].activityTitle).toBe('Sensory Bubble Play');
  });

  it('deep links to trajectory tab and child when tab=trajectory and childId query params are provided', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ tab: 'trajectory', childId: 'ch_2' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.activeTab()).toBe('trajectory');
    expect(component.selectedChildId()).toBe('ch_2');
    expect(mockScreeningApi.listSessions).toHaveBeenCalledWith('ch_2');
    expect(mockActivitiesApi.listProgress).toHaveBeenCalledWith('ch_2');
  });

  it('renders print trajectory report button on trajectory tab and invokes window.print when clicked', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ tab: 'trajectory' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const printBtn = fixture.nativeElement.querySelector('.print-btn') as HTMLButtonElement;
    expect(printBtn).toBeTruthy();
    expect(printBtn.textContent).toContain('Print Trajectory Report');

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    printBtn.click();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();

    const printHeader = fixture.nativeElement.querySelector('.print-header') as HTMLElement;
    expect(printHeader).toBeTruthy();
    expect(printHeader.textContent).toContain('AutiCare');
    expect(printHeader.textContent).toContain('Clinical Notice:');
    expect(printHeader.textContent).toContain('Tommy');
  });

  it('switches to Milestones tab and renders completed activity feed with domain tags and observation quotes', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.setTab('milestones');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('milestones');
    expect(component.completedActivities().length).toBe(1);
    expect(component.displayedMilestones().length).toBe(1);

    const milestoneCard = fixture.nativeElement.querySelector('.milestone-card') as HTMLElement;
    expect(milestoneCard).toBeTruthy();
    expect(milestoneCard.textContent).toContain('Sensory Bubble Play');
    expect(milestoneCard.textContent).toContain('Sensory');
    expect(milestoneCard.textContent).toContain('Loves popping bubbles with index finger.');
    expect(milestoneCard.textContent).toContain('Practice Again ↻');
  });

  it('filters milestones by domain category pills and resets filter', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.setTab('milestones');
    fixture.detectChanges();

    // Matching domain
    component.setMilestoneDomain('Sensory');
    expect(component.displayedMilestones().length).toBe(1);

    // Non-matching domain
    component.setMilestoneDomain('Communication');
    expect(component.displayedMilestones().length).toBe(0);
    fixture.detectChanges();

    const emptyBox = fixture.nativeElement.querySelector('.empty-box') as HTMLElement;
    expect(emptyBox).toBeTruthy();
    expect(emptyBox.textContent).toContain('No completed milestones match the selected domain');

    // Reset filters
    component.resetMilestoneFilters();
    expect(component.selectedMilestoneDomain()).toBe('ALL');
    expect(component.displayedMilestones().length).toBe(1);
  });

  it('filters milestones by keyword search query and clears search', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.setTab('milestones');
    fixture.detectChanges();

    // Search matching title
    component.milestoneSearchQuery.set('bubble');
    expect(component.displayedMilestones().length).toBe(1);

    // Search matching observation note
    component.milestoneSearchQuery.set('index finger');
    expect(component.displayedMilestones().length).toBe(1);

    // Search non-matching
    component.milestoneSearchQuery.set('alphabet blocks');
    expect(component.displayedMilestones().length).toBe(0);

    // Clear search
    component.clearMilestoneSearch();
    expect(component.milestoneSearchQuery()).toBe('');
    expect(component.displayedMilestones().length).toBe(1);
  });

  it('deep links to milestones tab when tab=milestones query param is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ tab: 'milestones', childId: 'ch_1' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.activeTab()).toBe('milestones');
    expect(component.selectedChildId()).toBe('ch_1');
  });

  it('renders longitudinal risk trajectory visualizer SVG chart on trajectory tab', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ tab: 'trajectory' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const chartSvg = fixture.nativeElement.querySelector('.trajectory-chart-svg') as SVGElement;
    expect(chartSvg).toBeTruthy();

    const chartData = component.trajectoryChartData();
    expect(chartData).toBeTruthy();
    expect(chartData?.points.length).toBe(1);
    expect(chartData?.points[0].riskPercentage).toBe(25);
    expect(component.overallTrajectoryTrend()).toBe('Baseline Assessment Established');
  });

  it('calculates risk reduction delta and improving trend when multiple screening sessions exist', async () => {
    const olderSession = {
      id: 'sess_old',
      childId: 'ch_1',
      status: 'COMPLETED' as const,
      ageBand: 'TODDLER_18_24' as const,
      startedAt: '2026-08-01T09:00:00.000Z',
      submittedAt: '2026-08-01T09:30:00.000Z',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-01T09:30:00.000Z',
      answers: [],
      result: {
        id: 'res_old',
        sessionId: 'sess_old',
        score: 28,
        riskPercentage: 60,
        riskLevel: 'MODERATE' as const,
        recommendation: 'Targeted sensory stimulation recommended.',
        disclaimer: 'Clinical evaluation recommended.',
        analysisVersion: 'v3',
        analyzedAt: '2026-08-01T09:30:00.000Z',
        categoryBreakdown: [],
      },
    };

    mockScreeningApi.listSessions.mockReturnValue(of([sampleSession1, olderSession]));

    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ tab: 'trajectory' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const chartData = component.trajectoryChartData();
    expect(chartData).toBeTruthy();
    expect(chartData?.points.length).toBe(2);

    // Oldest first: sess_old (60%) -> sampleSession1 (25%)
    expect(chartData?.points[0].riskPercentage).toBe(60);
    expect(chartData?.points[1].riskPercentage).toBe(25);
    expect(chartData?.points[1].deltaText).toBe('35% reduction');
    expect(chartData?.points[1].isImprovement).toBe(true);

    expect(component.overallTrajectoryTrend()).toContain('Risk Reduced by 35%');
  });

  it('renders home activity milestones counter by domain (Sensory, Motor, Social) on trajectory tab', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ tab: 'trajectory' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Verify domainMilestoneCounts computation
    const counts = component.domainMilestoneCounts();
    expect(counts.sensory).toBe(1); // 'Sensory Bubble Play'
    expect(counts.motor).toBe(0);
    expect(counts.social).toBe(0);
    expect(counts.total).toBe(1);

    // Verify DOM rendering of domain counter section
    const domainGrid = fixture.nativeElement.querySelector(
      '.domain-milestones-grid',
    ) as HTMLElement;
    expect(domainGrid).toBeTruthy();
    expect(domainGrid.textContent).toContain('Sensory');
    expect(domainGrid.textContent).toContain('Motor');
    expect(domainGrid.textContent).toContain('Social');
    expect(domainGrid.textContent).toContain('Communication');

    const sensoryCard = fixture.nativeElement.querySelector(
      '.domain-counter-card[data-domain="Sensory"]',
    );
    expect(sensoryCard?.textContent).toContain('1');
  });

  it('renders teacher author avatar, observation notes, and classroom accommodation tags on school observations tab', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.activeTab()).toBe('reports');

    // Author avatar initials
    const authorAvatar = fixture.nativeElement.querySelector('.author-avatar') as HTMLElement;
    expect(authorAvatar).toBeTruthy();
    expect(authorAvatar.textContent?.trim()).toBe('SW'); // Sarah Williams -> SW

    // Teacher observation notes
    const obsText = fixture.nativeElement.querySelector('.observation-text') as HTMLElement;
    expect(obsText).toBeTruthy();
    expect(obsText.textContent).toContain('Progressing nicely.');

    // Teacher accommodation tags
    const accTags = fixture.nativeElement.querySelectorAll(
      '.accommodation-tag',
    ) as NodeListOf<HTMLElement>;
    expect(accTags.length).toBeGreaterThan(0);
    const tagsText = Array.from(accTags)
      .map((el) => el.textContent)
      .join(' ');
    expect(tagsText).toContain('Sensory Break Provided');
  });

  it('renders Download Clinical Report button and exports clinical summary for pediatricians', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ tab: 'trajectory' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const downloadBtn = fixture.nativeElement.querySelector(
      '.btn-download-clinical',
    ) as HTMLButtonElement;
    expect(downloadBtn).toBeTruthy();
    expect(downloadBtn.textContent).toContain('Download Clinical Report');

    // Mock URL methods and click to test download execution
    const createObjectUrlMock = vi.fn().mockReturnValue('blob:dummy-url');
    const revokeObjectUrlMock = vi.fn();
    (URL as unknown as { createObjectURL: unknown; revokeObjectURL: unknown }).createObjectURL =
      createObjectUrlMock;
    (URL as unknown as { createObjectURL: unknown; revokeObjectURL: unknown }).revokeObjectURL =
      revokeObjectUrlMock;

    downloadBtn.click();

    expect(createObjectUrlMock).toHaveBeenCalled();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:dummy-url');
  });

  it('switches between Developmental Trajectory and School Observation Reports view tabs via navigation buttons', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const tabButtons = fixture.nativeElement.querySelectorAll(
      '.tab-btn',
    ) as NodeListOf<HTMLButtonElement>;
    expect(tabButtons.length).toBe(3);

    // Initial tab: reports
    expect(component.activeTab()).toBe('reports');

    // Click 'Developmental Trajectory' tab
    const trajectoryBtn = Array.from(tabButtons).find((b) =>
      b.textContent?.includes('Developmental Trajectory'),
    )!;
    trajectoryBtn.click();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('trajectory');

    // Click 'School Observation Reports' tab
    const reportsBtn = Array.from(tabButtons).find((b) =>
      b.textContent?.includes('School Observation Reports'),
    )!;
    reportsBtn.click();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('reports');
  });

  it('renders clean decoupled bilingual copy across all tabs without mixed parentheticals', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    const i18n = TestBed.inject(I18nService);
    component = fixture.componentInstance;

    // --- 1. TEST KHMER MODE ('km') ---
    i18n.setLanguage('km');
    fixture.detectChanges();

    // Topbar
    const topbar = fixture.nativeElement.querySelector('.topbar') as HTMLElement;
    expect(topbar.textContent).toContain('កុមារ៖');
    expect(topbar.textContent).toContain('← ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង');

    // Navigation Tabs in Khmer
    const tabTexts = Array.from(
      fixture.nativeElement.querySelectorAll('.tab-btn') as NodeListOf<HTMLElement>,
    ).map((b) => b.textContent?.trim());
    expect(tabTexts.some((t) => t?.includes('គន្លងនៃការលូតលាស់'))).toBe(true);
    expect(tabTexts.some((t) => t?.includes('របាយការណ៍សង្កេតពីសាលា'))).toBe(true);
    expect(tabTexts.some((t) => t?.includes('សមិទ្ធផលនៅផ្ទះ'))).toBe(true);

    // School Reports Tab in Khmer
    expect(component.activeTab()).toBe('reports');
    const reportHeader = fixture.nativeElement.querySelector('.report-header') as HTMLElement;
    expect(reportHeader.textContent).toContain('របាយការណ៍សកម្មភាព៖');
    expect(reportHeader.textContent).toContain('ទាញយកសេចក្តីសង្ខេបគ្លីនិក');
    expect(reportHeader.textContent).toContain('បោះពុម្ពរបាយការណ៍');

    const mainContent = fixture.nativeElement.querySelector('.main-content') as HTMLElement;
    expect(mainContent.textContent).toContain('ការសង្កេតរបស់គ្រូ');
    expect(mainContent.textContent).toContain('ការសម្រួល និងការសម្របសម្រួលក្នុងថ្នាក់រៀន');
    expect(mainContent.textContent).toContain('រង្វាស់ការអនុវត្ត');
    expect(mainContent.textContent).toContain('សេចក្តីសង្ខេបសកម្មភាព');
    expect(mainContent.textContent).toContain('អនុសាសន៍សម្រាប់អនុវត្តនៅផ្ទះ');

    // Khmer accommodation tag without English
    const accTag = fixture.nativeElement.querySelector('.accommodation-tag') as HTMLElement;
    expect(accTag.textContent).toContain('ផ្តល់ពេលសម្រាកសម្រួលវិញ្ញាណ');

    // Performance metrics labels in pure Khmer
    const metricLabels = component.engagementMetrics().map((m) => m.label);
    expect(metricLabels).toEqual([
      'ការចូលរួម',
      'ការប្រាស្រ័យទាក់ទង',
      'ទំនាក់ទំនងសង្គម',
      'ការយកចិត្តទុកដាក់',
      'ការគ្រប់គ្រងអារម្មណ៍',
      'ការបំពេញកិច្ចការ',
    ]);

    // --- 2. TEST TRAJECTORY TAB IN KHMER ---
    component.setTab('trajectory');
    fixture.detectChanges();

    const trajectoryContainer = fixture.nativeElement.querySelector(
      '.trajectory-container',
    ) as HTMLElement;
    expect(trajectoryContainer.textContent).toContain('គន្លងនៃការលូតលាស់ និងប្រវត្តិគ្លីនិក');
    expect(trajectoryContainer.textContent).toContain('+ ការវាយតម្លៃគ្លីនិកថ្មី');
    expect(trajectoryContainer.textContent).toContain('ទាញយករបាយការណ៍គ្លីនិក');
    expect(trajectoryContainer.textContent).toContain('បោះពុម្ពរបាយការណ៍គន្លងលូតលាស់');
    expect(trajectoryContainer.textContent).toContain('កម្រិតហានិភ័យគ្លីនិក');
    expect(trajectoryContainer.textContent).toContain('ប្រវត្តិនៃការវាយតម្លៃ');
    expect(trajectoryContainer.textContent).toContain('និន្នាការគន្លងលូតលាស់');
    expect(trajectoryContainer.textContent).toContain('សមិទ្ធផលសកម្មភាពនៅផ្ទះតាមដែន');
    expect(trajectoryContainer.textContent).toContain('ញាណដឹង');
    expect(trajectoryContainer.textContent).toContain('ចលករ');
    expect(trajectoryContainer.textContent).toContain('ទំនាក់ទំនងសង្គម');
    expect(trajectoryContainer.textContent).toContain('ការប្រាស្រ័យទាក់ទង');
    expect(component.riskLabel('LOW')).toBe('ហានិភ័យទាប');
    expect(component.overallTrajectoryTrend()).toBe('បានកំណត់កម្រិតគោលដំបូង');

    // --- 3. TEST MILESTONES TAB IN KHMER ---
    component.setTab('milestones');
    fixture.detectChanges();

    const milestonesContainer = fixture.nativeElement.querySelector(
      '.milestones-container',
    ) as HTMLElement;
    expect(milestonesContainer.textContent).toContain('សមិទ្ធផលលូតលាស់ និងការអនុវត្តប្រចាំថ្ងៃ');
    expect(milestonesContainer.textContent).toContain('ស្វែងរកកាតាឡុកសកម្មភាព →');
    expect(milestonesContainer.textContent).toContain('បោះពុម្ពសេចក្តីសង្ខេប');
    expect(milestonesContainer.textContent).toContain('សរុបបានបញ្ចប់');
    expect(milestonesContainer.textContent).toContain('ដែនសកម្មភាពសកម្ម');
    expect(milestonesContainer.textContent).toContain('សកម្មភាពចុងក្រោយ');
    expect(milestonesContainer.textContent).toContain('អនុវត្តម្តងទៀត ↻');

    // Khmer domain filter pills
    const domainLabels = component.milestoneDomains().map((d) => d.label);
    expect(domainLabels).toEqual([
      'គ្រប់ដែនទាំងអស់',
      'ញាណដឹង',
      'ការប្រាស្រ័យទាក់ទង',
      'ទំនាក់ទំនងសង្គម',
      'ចលករ',
      'ទម្លាប់ប្រចាំថ្ងៃ',
    ]);

    // --- 4. SWITCH BACK TO ENGLISH ('en') ---
    i18n.setLanguage('en');
    fixture.detectChanges();

    expect(topbar.textContent).toContain('Child:');
    expect(topbar.textContent).toContain('← Back to Dashboard');
    expect(milestonesContainer.textContent).toContain('Developmental Milestones & Daily Practice');
    expect(milestonesContainer.textContent).toContain('Explore Activities Catalogue →');
    expect(milestonesContainer.textContent).toContain('Practice Again ↻');
    expect(component.riskLabel('LOW')).toBe('Low Risk');
    expect(component.overallTrajectoryTrend()).toBe('Baseline Assessment Established');

    const enDomainLabels = component.milestoneDomains().map((d) => d.label);
    expect(enDomainLabels).toEqual([
      'All Domains',
      'Sensory',
      'Communication',
      'Social Skills',
      'Motor Skills',
      'Daily Living',
    ]);
  });

  it('translates developmental domain chart labels (Communication, Fine Motor, Gross Motor, Cognitive, Social), milestone achievement badges, and teacher observations', async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ParentActivityApi, useValue: mockActivityApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressPage);
    const i18n = TestBed.inject(I18nService);
    component = fixture.componentInstance;

    // --- 1. ENGLISH MODE ('en') ---
    i18n.setLanguage('en');
    fixture.detectChanges();

    // Domain labels in English
    expect(component.getDomainLabel('Communication')).toBe('Communication');
    expect(component.getDomainLabel('Fine Motor')).toBe('Fine Motor');
    expect(component.getDomainLabel('Gross Motor')).toBe('Gross Motor');
    expect(component.getDomainLabel('Cognitive')).toBe('Cognitive');
    expect(component.getDomainLabel('Social')).toBe('Social');

    // Milestones Tab: Milestone achievement badge in English
    component.setTab('milestones');
    fixture.detectChanges();
    const achievementBadge = fixture.nativeElement.querySelector('.achievement-badge');
    expect(achievementBadge?.textContent).toContain('Milestone Achieved');

    // Reports Tab: Teacher observations in English
    component.setTab('reports');
    fixture.detectChanges();
    const reportCard = fixture.nativeElement.querySelector('.report-card');
    expect(reportCard?.textContent).toContain('Teacher Observations');
    expect(reportCard?.textContent).toContain('Progressing nicely.');

    // --- 2. KHMER MODE ('km') ---
    i18n.setLanguage('km');
    fixture.detectChanges();

    // Domain labels in Khmer
    expect(component.getDomainLabel('Communication')).toBe('ការប្រាស្រ័យទាក់ទង');
    expect(component.getDomainLabel('Fine Motor')).toBe('ចលនាសាច់ដុំតូច');
    expect(component.getDomainLabel('Gross Motor')).toBe('ចលនាសាច់ដុំធំ');
    expect(component.getDomainLabel('Cognitive')).toBe('ការយល់ដឹង និងការគិត');
    expect(component.getDomainLabel('Social')).toBe('ទំនាក់ទំនងសង្គម');

    // Milestones Tab: Milestone achievement badge in Khmer
    component.setTab('milestones');
    fixture.detectChanges();
    const kmAchievementBadge = fixture.nativeElement.querySelector('.achievement-badge');
    expect(kmAchievementBadge?.textContent).toContain('សមិទ្ធផលបានសម្រេច');
    expect(kmAchievementBadge?.textContent).not.toContain('(Milestone Achieved)');

    // Reports Tab: Teacher observations in Khmer
    component.setTab('reports');
    fixture.detectChanges();
    const kmReportCard = fixture.nativeElement.querySelector('.report-card');
    expect(kmReportCard?.textContent).toContain('ការសង្កេតរបស់គ្រូ');
    expect(kmReportCard?.textContent).not.toContain('(Teacher Observations)');
  });
});
