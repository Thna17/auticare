import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolEnrollmentsPage } from './school-enrollments.page';

describe('SchoolEnrollmentsPage', () => {
  let fixture: ComponentFixture<SchoolEnrollmentsPage>;
  let component: SchoolEnrollmentsPage;
  let mockSchoolsApi: {
    getEnrollmentStats: ReturnType<typeof vi.fn>;
    getEnrollmentSpecialists: ReturnType<typeof vi.fn>;
    getEnrolledStudentsList: ReturnType<typeof vi.fn>;
    updateStudent: ReturnType<typeof vi.fn>;
    deleteStudent: ReturnType<typeof vi.fn>;
    updateEnrollment: ReturnType<typeof vi.fn>;
    deleteEnrollment: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockSchoolsApi = {
      getEnrollmentStats: vi.fn().mockReturnValue(
        of({
          totalStudents: 18,
          newStudentsThisMonth: 2,
          activePrograms: 6,
          participationRate: 72,
          averageProgress: 85,
          needsAttention: 1,
        }),
      ),
      getEnrollmentSpecialists: vi
        .fn()
        .mockReturnValue(
          of([{ id: 'spec_1', firstName: 'Dr. Evans', lastName: 'MD', title: 'Therapist' }]),
        ),
      getEnrolledStudentsList: vi.fn().mockReturnValue(
        of({
          students: [
            {
              id: 'enr_1',
              childId: 'ch_1',
              firstName: 'Sarah',
              lastName: 'Connor',
              photoUrl: null,
              status: 'ACTIVE',
              leadSpecialistName: 'Dr. Evans',
              leadSpecialistId: 'spec_1',
              communicationProgress: 85,
              startDate: '2026-09-01',
              notes: 'Excellent verbal improvement',
              age: 5,
              dateOfBirth: '2021-04-12',
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }),
      ),
      updateStudent: vi.fn().mockReturnValue(of({ childFirstName: 'Sarah' })),
      deleteStudent: vi.fn().mockReturnValue(of({ childFirstName: 'Sarah' })),
      updateEnrollment: vi.fn().mockReturnValue(of({ success: true })),
      deleteEnrollment: vi.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [SchoolEnrollmentsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: SchoolsApi, useValue: mockSchoolsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolEnrollmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads stats, specialists, and student enrollments on initialization', () => {
    expect(mockSchoolsApi.getEnrollmentStats).toHaveBeenCalled();
    expect(mockSchoolsApi.getEnrollmentSpecialists).toHaveBeenCalled();
    expect(mockSchoolsApi.getEnrolledStudentsList).toHaveBeenCalled();
    expect(component.enrollments().length).toBe(1);
    expect(component.enrollments()[0]?.childName).toBe('Sarah Connor');
    expect(component.loading()).toBe(false);
  });

  it('displays child age and parent guardian contact details', () => {
    const student = component.enrollments()[0];
    expect(student).toBeDefined();
    expect(student?.age).toBe('5 yrs old');
    expect(student?.parentContact.name).toContain('Guardian of Sarah');
    expect(student?.parentContact.email).toContain('parent.sarah@auticare.org');
    expect(student?.parentContact.phone).toBeDefined();
  });

  it('supports admissions review actions: accepts or declines enrollment', () => {
    const pendingStudent = {
      ...component.enrollments()[0],
      rawStatus: 'PENDING' as const,
      status: 'Pending' as const,
    };

    component.acceptEnrollment(pendingStudent);
    expect(mockSchoolsApi.updateStudent).toHaveBeenCalledWith('ch_1', { status: 'ACTIVE' });

    component.declineEnrollment(pendingStudent);
    expect(mockSchoolsApi.updateStudent).toHaveBeenCalledWith('ch_1', { status: 'REJECTED' });
  });

  it('toggles between table and cards view modes', () => {
    expect(component.viewMode()).toBe('table');
    component.viewMode.set('cards');
    expect(component.viewMode()).toBe('cards');
    component.viewMode.set('table');
    expect(component.viewMode()).toBe('table');
  });

  it('handles zero enrollment data state', () => {
    mockSchoolsApi.getEnrolledStudentsList.mockReturnValueOnce(
      of({
        students: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      }),
    );

    component.loadStudents();

    expect(component.enrollments().length).toBe(0);
    expect(component.loading()).toBe(false);
  });

  it('displays error state when students loading fails', () => {
    mockSchoolsApi.getEnrolledStudentsList.mockReturnValueOnce(
      throwError(() => new Error('Server error')),
    );

    component.loadStudents();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Failed to load enrolled students.');
  });

  it('filters students by search query and updates results', () => {
    component.onSearchInput({ target: { value: 'Sarah' } } as unknown as Event);
    expect(component.searchQuery()).toBe('Sarah');
    expect(mockSchoolsApi.getEnrolledStudentsList).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Sarah' }),
    );
  });

  it('opens Admission Review Drawer with parent note excerpt and accepts with feedback note', () => {
    const student = component.enrollments()[0];
    expect(student).toBeDefined();

    component.openAdmissionReview(student);
    expect(component.reviewingEnrollment()).toBe(student);

    component.admissionFeedbackNote.set('Welcome! Classroom schedule assigned.');
    component.acceptFromReviewDrawer();

    expect(mockSchoolsApi.updateStudent).toHaveBeenCalledWith('ch_1', {
      status: 'ACTIVE',
      notes: 'Welcome! Classroom schedule assigned.',
    });
    expect(component.reviewingEnrollment()).toBeNull();
  });

  it('declines admission from review drawer with feedback note', () => {
    const student = component.enrollments()[0];
    component.openAdmissionReview(student);
    component.admissionFeedbackNote.set('Currently at full capacity.');
    component.declineFromReviewDrawer();

    expect(mockSchoolsApi.updateStudent).toHaveBeenCalledWith('ch_1', {
      status: 'REJECTED',
      notes: 'Currently at full capacity.',
    });
    expect(component.reviewingEnrollment()).toBeNull();
  });

  it('renders bilingual status badges in table and cards views', () => {
    // 1. Table view
    const root = fixture.nativeElement as HTMLElement;
    const tableBadge = root.querySelector('.status-badge');
    expect(tableBadge).toBeTruthy();
    expect(tableBadge?.textContent).toContain('សកម្ម / Active');

    // Test bilingualStatus mapping helper
    expect(component.bilingualStatus('Active')).toBe('សកម្ម / Active');
    expect(component.bilingualStatus('Pending')).toBe('កំពុងរង់ចាំ / Pending');
    expect(component.bilingualStatus('Graduated')).toBe('បានបញ្ចប់ / Graduated');
    expect(component.bilingualStatus('Rejected')).toBe('បដិសេធ / Declined');

    // 2. Switch to cards view
    component.viewMode.set('cards');
    fixture.detectChanges();

    const cardBadge = root.querySelector('.roster-card .status-badge');
    expect(cardBadge).toBeTruthy();
    expect(cardBadge?.textContent).toContain('សកម្ម / Active');
  });
});
