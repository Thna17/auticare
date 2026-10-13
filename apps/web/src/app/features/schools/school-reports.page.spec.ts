import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolReportsPage } from './school-reports.page';

describe('SchoolReportsPage', () => {
  let fixture: ComponentFixture<SchoolReportsPage>;
  let component: SchoolReportsPage;
  let mockSchoolsApi: {
    listReportsWithChild: ReturnType<typeof vi.fn>;
    getEnrolledStudents: ReturnType<typeof vi.fn>;
    deleteReport: ReturnType<typeof vi.fn>;
    listNotifications: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    parent: ReturnType<typeof signal>;
  };

  beforeEach(async () => {
    mockSchoolsApi = {
      listReportsWithChild: vi.fn().mockReturnValue(
        of({
          reports: [
            {
              id: 'rep_1',
              childId: 'ch_1',
              childFirstName: 'Tommy',
              childLastName: 'Jones',
              childPhotoUrl: null,
              reporterFirstName: 'Teacher',
              reporterLastName: 'Smith',
              schoolId: 'sch_1',
              reporterId: 'rep_1',
              activityCategory: 'Group',
              title: 'Sensory Play',
              summary: 'Engaged well in morning group activity.',
              status: 'SUBMITTED',
              activityDate: '2026-10-01',
              duration: 45,
              participation: 8,
              communication: 7,
              socialInteraction: 8,
              attention: 7,
              emotionalRegulation: 8,
              taskCompletion: 7,
              teacherObservation: 'Great progress.',
              recommendations: 'Continue sensory exercises.',
              photoUrls: [],
              documentUrls: [],
              createdAt: '2026-10-01T00:00:00.000Z',
              updatedAt: '2026-10-01T00:00:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      ),
      getEnrolledStudents: vi.fn().mockReturnValue(of([{ id: 'ch_1', name: 'Tommy Jones' }])),
      deleteReport: vi.fn().mockReturnValue(of(undefined)),
      listNotifications: vi.fn().mockReturnValue(
        of({
          notifications: [],
          pagination: { total: 0, page: 1, totalPages: 0, limit: 10 },
        }),
      ),
    };

    mockAuthService = {
      parent: signal({
        id: 'user_school',
        role: 'SCHOOL',
        email: 'staff@school.org',
        firstName: 'Staff',
        lastName: 'Member',
        phoneNumber: null,
        socialMediaAccount: null,
      }),
    };

    await TestBed.configureTestingModule({
      imports: [SchoolReportsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: SchoolsApi, useValue: mockSchoolsApi },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolReportsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads reports and enrolled students on initialization', () => {
    expect(mockSchoolsApi.listReportsWithChild).toHaveBeenCalled();
    expect(mockSchoolsApi.getEnrolledStudents).toHaveBeenCalled();
    expect(component.reports().length).toBe(1);
    expect(component.reports()[0]?.childFirstName).toBe('Tommy');
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('displays error state when report loading fails', () => {
    mockSchoolsApi.listReportsWithChild.mockReturnValueOnce(
      throwError(() => new Error('Network error')),
    );

    component.loadReports();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Could not load reports. Check your connection and try again.');
  });

  it('handles zero-data empty state', () => {
    mockSchoolsApi.listReportsWithChild.mockReturnValueOnce(
      of({
        reports: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }),
    );

    component.loadReports();

    expect(component.reports().length).toBe(0);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('toggles card expansion when chevron is clicked', () => {
    expect(component.expandedId()).toBeNull();
    component.toggleExpanded('rep_1');
    expect(component.expandedId()).toBe('rep_1');
    component.toggleExpanded('rep_1');
    expect(component.expandedId()).toBeNull();
  });

  it('passes search parameter to listReportsWithChild and renders search tag', () => {
    component.searchQuery.set('Sensory');
    component.loadReports();

    expect(mockSchoolsApi.listReportsWithChild).toHaveBeenCalledWith({
      search: 'Sensory',
      page: 1,
    });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Filtering by: "Sensory"');

    // Clearing search resets searchQuery
    component.clearSearch();
    expect(component.searchQuery()).toBe('');
  });

  it('renders New Report button and school topbar only when user is school staff', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.btn-new-report')).not.toBeNull();
    expect(compiled.querySelector('ac-school-topbar')).not.toBeNull();
    expect(compiled.querySelector('h1')?.textContent).toContain('Activity Reports');

    // Change role to PARENT
    mockAuthService.parent.set({
      id: 'user_parent',
      role: 'PARENT',
      email: 'parent@home.org',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: null,
      socialMediaAccount: null,
    });
    fixture.detectChanges();
    expect(compiled.querySelector('.btn-new-report')).toBeNull();
    expect(compiled.querySelector('ac-school-topbar')).toBeNull();
  });

  it('renders admin header and omits school topbar and new report button for ADMIN role', () => {
    mockAuthService.parent.set({
      id: 'user_admin',
      role: 'ADMIN',
      email: 'admin@auticare.org',
      firstName: 'System',
      lastName: 'Admin',
      phoneNumber: null,
      socialMediaAccount: null,
    });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Administrative School Reports Oversight',
    );
    expect(compiled.querySelector('ac-school-topbar')).toBeNull();
    expect(compiled.querySelector('.btn-new-report')).toBeNull();
  });

  it('redirects PARENT role to /progress on initialization', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    mockAuthService.parent.set({
      id: 'user_parent',
      role: 'PARENT',
      email: 'parent@home.org',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: null,
      socialMediaAccount: null,
    });

    component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith('/progress');
  });

  it('filters observation reports by developmental domain', () => {
    expect(component.selectedDomain()).toBe('ALL');
    expect(component.filteredReports().length).toBe(1);

    component.selectDomain('Sensory');
    expect(component.selectedDomain()).toBe('Sensory');
    expect(component.filteredReports().length).toBe(1);

    component.selectDomain('Adaptive');
    expect(component.filteredReports().length).toBe(0);

    component.selectDomain('ALL');
    expect(component.filteredReports().length).toBe(1);
  });
});
