import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ActivityReportListItem,
  ChildResponse,
  ObservationResponse,
  ScreeningSessionResultResponse,
} from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { ReportsPage } from './reports.page';

describe('ReportsPage', () => {
  let fixture: ComponentFixture<ReportsPage>;
  let component: ReportsPage;
  let httpTesting: HttpTestingController;

  const mockChildren: ChildResponse[] = [
    {
      id: 'child_1',
      firstName: 'Dara',
      lastName: 'Sok',
      dateOfBirth: '2020-01-01T00:00:00.000Z',
      notes: null,
      address: null,
      archivedAt: null,
      questionnaireStatus: 'COMPLETED',
    },
  ];

  const mockSchoolReports: ActivityReportListItem[] = [
    {
      id: 'rep_1',
      schoolId: 'sch_1',
      childId: 'child_1',
      reporterId: 'rep_staff_1',
      activityCategory: 'Communication',
      title: 'Speech & Communication Session',
      summary: 'Dara engaged actively with sensory materials.',
      activityDate: '2026-01-15T00:00:00.000Z',
      status: 'SUBMITTED',
      duration: 30,
      performanceMetrics: null,
      teacherObservation: 'Good progress',
      recommendations: 'Continue visual routines',
      photoUrls: [],
      childFirstName: 'Dara',
      childLastName: 'Sok',
      childPhotoUrl: null,
      createdAt: '2026-01-15T00:00:00.000Z',
      reporterFirstName: 'Sophea',
      reporterLastName: 'Keo',
    },
  ];

  const mockObservations: ObservationResponse[] = [
    {
      id: 'obs_1',
      childId: 'child_1',
      category: 'SENSORY',
      intensity: 3,
      occurredAt: '2026-01-10T10:00:00.000Z',
      note: 'Calmed with weighted blanket',
      trigger: 'Loud school bell',
      durationMinutes: 15,
      parentResponse: 'Offered sensory corner',
      outcome: 'Regained focus after resting',
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    },
  ];

  const mockScreeningResult: ScreeningSessionResultResponse = {
    id: 'sess_1',
    childId: 'child_1',
    status: 'SUBMITTED',
    ageBand: 'PRESCHOOL',
    formKind: 'SHORT',
    startedAt: '2026-01-05T00:00:00.000Z',
    submittedAt: '2026-01-05T00:00:00.000Z',
    answers: [],
    previousComparison: null,
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
    result: {
      id: 'res_1',
      score: 28,
      riskPercentage: 65,
      riskLevel: 'MODERATE',
      recommendation: 'Targeted educational support',
      disclaimer: 'Educational guidance only, not a medical diagnosis',
      analysisVersion: '1.0',
      analyzedAt: '2026-01-05T00:00:00.000Z',
      categoryBreakdown: [
        { category: 'Social Communication', riskPercentage: 70, riskLevel: 'MODERATE' },
      ],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads children and populates default child reports', () => {
    fixture.detectChanges();

    const childReq = httpTesting.expectOne('/api/v1/children');
    expect(childReq.request.method).toBe('GET');
    childReq.flush({ data: mockChildren });

    const schoolReq = httpTesting.expectOne((req) => req.url.includes('/api/v1/schools/reports'));
    expect(schoolReq.request.method).toBe('GET');
    schoolReq.flush({
      data: {
        reports: mockSchoolReports,
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    });

    const obsReq = httpTesting.expectOne((req) => req.url.includes('/api/v1/observations'));
    expect(obsReq.request.method).toBe('GET');
    obsReq.flush({ data: mockObservations });

    const screenReq = httpTesting.expectOne((req) =>
      req.url.includes('/api/v1/screening/children/child_1/latest'),
    );
    expect(screenReq.request.method).toBe('GET');
    screenReq.flush({ data: mockScreeningResult });

    expect(component.selectedChildId()).toBe('child_1');
    expect(component.schoolReports().length).toBe(1);
    expect(component.observations().length).toBe(1);
    expect(component.screeningResult()?.result?.riskLevel).toBe('MODERATE');
  });

  it('switches tabs and computes top category', () => {
    fixture.detectChanges();

    httpTesting.expectOne('/api/v1/children').flush({ data: mockChildren });
    httpTesting
      .expectOne((req) => req.url.includes('/api/v1/schools/reports'))
      .flush({
        data: {
          reports: mockSchoolReports,
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      });
    httpTesting
      .expectOne((req) => req.url.includes('/api/v1/observations'))
      .flush({ data: mockObservations });
    httpTesting
      .expectOne((req) => req.url.includes('/api/v1/screening/children/child_1/latest'))
      .flush({
        data: mockScreeningResult,
      });

    component.activeTab.set('behaviour');
    expect(component.activeTab()).toBe('behaviour');
    component.dateRange.set('all');
    expect(component.topCategory()).toBe('SENSORY');
    expect(component.uniqueTriggersCount()).toBe(1);

    component.activeTab.set('educational');
    expect(component.activeTab()).toBe('educational');
  });

  it('triggers window.print on print button click', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printReport();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
