import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SchoolDetailResponse } from '@auticare/contracts';
import { API_BASE_URL } from '../../core/config/api.config';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolProfilePage } from './school-profile.page';

describe('SchoolProfilePage', () => {
  let fixture: ComponentFixture<SchoolProfilePage>;
  let component: SchoolProfilePage;
  let mockSchoolsApi: {
    getMySchool: ReturnType<typeof vi.fn>;
    getEnrollmentStats: ReturnType<typeof vi.fn>;
    updateMySchool: ReturnType<typeof vi.fn>;
    listNotifications: ReturnType<typeof vi.fn>;
  };

  const mockSchool: SchoolDetailResponse = {
    id: 'sch_1',
    name: 'Horizon Autism Center',
    city: 'Jakarta Selatan',
    address: 'Jl. Kemang Raya No. 12',
    phone: null,
    description: 'Comprehensive developmental programs and sensory integration.',
    logoUrl: null,
    coverImageUrl: null,
    email: 'admissions@horizon.org',
    website: 'https://horizon.org',
    studentTeacherRatio: '4:1',
    availabilityStatus: 'IMMEDIATE',
    waitlistEstimate: null,
    admissionRequirements: 'Diagnostic screening report required.',
    operatingHours: 'Mon-Fri 08:00 - 16:00',
    facilities: ['Sensory Room', 'Adaptive Playground'],
    specializations: ['ABA Therapy', 'Speech & Language Therapy'],
    isVerified: true,
    rating: 4.9,
    reviewCount: 15,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockSchoolsApi = {
      getMySchool: vi.fn().mockReturnValue(of(mockSchool)),
      getEnrollmentStats: vi.fn().mockReturnValue(
        of({
          totalStudents: 22,
          newStudentsThisMonth: 3,
          activePrograms: 5,
          participationRate: 85,
          averageProgress: 78,
          needsAttention: 2,
        }),
      ),
      updateMySchool: vi
        .fn()
        .mockReturnValue(of({ ...mockSchool, name: 'Updated Horizon Center' })),
      listNotifications: vi
        .fn()
        .mockReturnValue(
          of({ notifications: [], pagination: { total: 0, page: 1, totalPages: 0, limit: 10 } }),
        ),
    };

    await TestBed.configureTestingModule({
      imports: [SchoolProfilePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: SchoolsApi, useValue: mockSchoolsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads school profile and starts in view mode when profile content exists', () => {
    expect(mockSchoolsApi.getMySchool).toHaveBeenCalled();
    expect(mockSchoolsApi.getEnrollmentStats).toHaveBeenCalled();
    expect(component.school()?.name).toBe('Horizon Autism Center');
    expect(component.mode()).toBe('view');
    expect(component.enrollmentStats()?.totalStudents).toBe(22);
  });

  it('toggles edit and view modes cleanly', () => {
    component.startEditing();
    expect(component.mode()).toBe('edit');
    expect(component.form.controls.name.value).toBe('Horizon Autism Center');

    component.cancelEditing();
    expect(component.mode()).toBe('view');
  });

  it('manages programs and specialized therapies selection', () => {
    component.startEditing();
    expect(component.isSpecializationSelected('ABA Therapy')).toBe(true);

    component.toggleSpecialization('Occupational Therapy');
    expect(component.isSpecializationSelected('Occupational Therapy')).toBe(true);

    // Custom program
    component.customProgramInput.set('Hydro-Sensory Play');
    component.addCustomProgram();
    expect(component.isSpecializationSelected('Hydro-Sensory Play')).toBe(true);
  });

  it('manages facilities tags addition and removal', () => {
    component.startEditing();
    expect(component.activeFacilities()).toEqual(['Sensory Room', 'Adaptive Playground']);

    component.addFacility('Music Therapy Studio');
    expect(component.activeFacilities()).toContain('Music Therapy Studio');

    // Remove first facility
    component.removeFacility(0);
    expect(component.activeFacilities()).not.toContain('Sensory Room');
  });

  it('submits updated profile payload to updateMySchool', () => {
    component.startEditing();
    component.form.controls.name.setValue('Updated Horizon Center');
    component.submit();

    expect(mockSchoolsApi.updateMySchool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Horizon Center',
        facilities: expect.any(Array),
        specializations: expect.any(Array),
      }),
    );
    expect(component.mode()).toBe('view');
    expect(component.savedFlash()).toBe(true);
  });

  it('displays institutional overview card with student capacity and student-teacher ratio', () => {
    expect(component.mode()).toBe('view');
    expect(component.enrollmentStats()?.totalStudents).toBe(22);
    expect(component.school()?.studentTeacherRatio).toBe('4:1');

    const card = fixture.nativeElement.querySelector('.institutional-overview-card');
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('22 Students');
    expect(card.textContent).toContain('4:1');
  });

  it('interactively adds and removes facility tags in view mode via quick tag manager', () => {
    expect(component.mode()).toBe('view');
    component.quickAddFacility('Hydrotherapy Pool');
    expect(mockSchoolsApi.updateMySchool).toHaveBeenCalledWith(
      expect.objectContaining({
        facilities: expect.arrayContaining(['Hydrotherapy Pool']),
      }),
    );

    // Quick add custom facility
    component.customFacilityInput.set('Calming Pod');
    component.quickAddCustomFacility();
    expect(mockSchoolsApi.updateMySchool).toHaveBeenCalledWith(
      expect.objectContaining({
        facilities: expect.arrayContaining(['Calming Pod']),
      }),
    );
    expect(component.customFacilityInput()).toBe('');

    // Quick remove facility
    component.quickRemoveFacility(0);
    expect(mockSchoolsApi.updateMySchool).toHaveBeenCalledWith(
      expect.objectContaining({
        facilities: expect.not.arrayContaining(['Sensory Room']),
      }),
    );
  });
});
