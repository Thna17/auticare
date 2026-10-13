import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { SchoolsApi } from './data-access/schools.api';
import { CreateSchoolReportPage } from './create-school-report.page';

describe('CreateSchoolReportPage', () => {
  let fixture: ComponentFixture<CreateSchoolReportPage>;
  let component: CreateSchoolReportPage;
  let mockSchoolsApi: {
    getEnrolledStudents: ReturnType<typeof vi.fn>;
    createActivityReport: ReturnType<typeof vi.fn>;
    getActivityReportById: ReturnType<typeof vi.fn>;
    uploadActivityFiles: ReturnType<typeof vi.fn>;
    listNotifications: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockSchoolsApi = {
      getEnrolledStudents: vi.fn().mockReturnValue(
        of([
          {
            id: 'ch_1',
            childId: 'ch_1',
            firstName: 'Sarah',
            lastName: 'Connor',
            dateOfBirth: '2021-04-12',
            age: 5,
            startDate: '2026-09-01',
            enrollmentStatus: 'ACTIVE',
            photoUrl: null,
          },
        ]),
      ),
      createActivityReport: vi.fn().mockReturnValue(of({ id: 'rep_new', title: 'Sensory Play' })),
      getActivityReportById: vi.fn().mockReturnValue(of({})),
      uploadActivityFiles: vi.fn().mockReturnValue(of({ urls: [] })),
      listNotifications: vi
        .fn()
        .mockReturnValue(
          of({ notifications: [], pagination: { total: 0, page: 1, totalPages: 0, limit: 10 } }),
        ),
    };

    await TestBed.configureTestingModule({
      imports: [CreateSchoolReportPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        provideRouter([]),
        { provide: SchoolsApi, useValue: mockSchoolsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSchoolReportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads enrolled students and displays active child profile when selected', () => {
    expect(mockSchoolsApi.getEnrolledStudents).toHaveBeenCalled();
    expect(component.students().length).toBe(1);

    component.form.controls.childId.setValue('ch_1');
    expect(component.selectedChild()?.firstName).toBe('Sarah');
  });

  it('toggles developmental domain checkboxes and syncs category', () => {
    expect(component.isDomainSelected('social')).toBe(true);

    const sensoryDomain = component.domainList.find((d) => d.id === 'sensory')!;
    component.toggleDomain(sensoryDomain);
    expect(component.isDomainSelected('sensory')).toBe(true);
    expect(component.form.controls.category.value).toBe('Sensory/Motor');

    // Toggle off social
    const socialDomain = component.domainList.find((d) => d.id === 'social')!;
    component.toggleDomain(socialDomain);
    expect(component.isDomainSelected('social')).toBe(false);
  });

  it('inserts guidance prompt chips into observations textarea', () => {
    expect(component.form.controls.teacherObservations.value).toBe('');
    component.insertPrompt(
      'teacherObservations',
      '• Sensory accommodation used: Noise cancelling headphones',
    );
    expect(component.form.controls.teacherObservations.value).toContain(
      'Noise cancelling headphones',
    );

    component.insertPrompt(
      'teacherObservations',
      '• Academic focus & milestone: Letter phonics mastery',
    );
    expect(component.form.controls.teacherObservations.value).toContain('Letter phonics mastery');

    const cogDomain = component.domainList.find((d) => d.id === 'cognitive')!;
    expect(cogDomain.name).toBe('Cognitive & Academic Focus');
  });

  it('submits report with DRAFT status when saveDraft is invoked', () => {
    component.form.patchValue({
      childId: 'ch_1',
      category: 'Sensory/Motor',
      duration: 30,
      activityName: 'Sensory Exploration',
      teacherObservations: 'Calm engagement with textures.',
      parentRecommendations: 'Encourage sand play at home.',
      participation: 8,
    });

    component.saveDraft();

    expect(mockSchoolsApi.createActivityReport).toHaveBeenCalledWith(
      expect.objectContaining({
        childId: 'ch_1',
        activityName: 'Sensory Exploration',
        status: 'DRAFT',
      }),
    );
  });

  it('submits report with SUBMITTED status when submit is called', () => {
    component.form.patchValue({
      childId: 'ch_1',
      category: 'Social/Emotional',
      duration: 45,
      activityName: 'Group Circle Time',
      teacherObservations: 'Participated actively with peers.',
      parentRecommendations: 'Practice turn taking games.',
      participation: 9,
    });

    component.targetStatus.set('SUBMITTED');
    component.submit();

    expect(mockSchoolsApi.createActivityReport).toHaveBeenCalledWith(
      expect.objectContaining({
        childId: 'ch_1',
        status: 'SUBMITTED',
      }),
    );
  });

  it('manages Activity Date Picker in form and passes activityDate in payload', () => {
    component.form.patchValue({
      childId: 'ch_1',
      activityDate: '2026-10-15',
      category: 'Sensory/Motor',
      duration: 30,
      activityName: 'Sensory Sand Play',
      teacherObservations: 'Regulated well.',
      parentRecommendations: 'Continue tactile routines.',
      participation: 8,
    });

    component.submit();

    expect(mockSchoolsApi.createActivityReport).toHaveBeenCalledWith(
      expect.objectContaining({
        activityDate: '2026-10-15',
      }),
    );
  });

  it('inserts communication win prompt chip into observations textarea', () => {
    component.insertPrompt('teacherObservations', '• Communication win & gestures: Used PECS card');
    expect(component.form.controls.teacherObservations.value).toContain('Used PECS card');
  });

  it('toggles between Draft and Publish modes with appropriate targetStatus', () => {
    expect(component.targetStatus()).toBe('SUBMITTED');
    component.targetStatus.set('DRAFT');
    expect(component.targetStatus()).toBe('DRAFT');
    component.targetStatus.set('SUBMITTED');
    expect(component.targetStatus()).toBe('SUBMITTED');
  });

  it('renders bilingual observation prompt chips in template and inserts notes', () => {
    const root = fixture.nativeElement as HTMLElement;
    const chips = root.querySelectorAll('.prompt-chip');
    expect(chips.length).toBeGreaterThanOrEqual(4);

    const sensoryChip = Array.from(chips).find((c) =>
      c.textContent?.includes('ការសម្របសម្រួលញាណដឹង'),
    );
    expect(sensoryChip).toBeDefined();
    expect(sensoryChip?.textContent).toContain('Sensory accommodation');

    const socialChip = Array.from(chips).find((c) =>
      c.textContent?.includes('ភាពរីកចម្រើនក្នុងទំនាក់ទំនងសង្គម'),
    );
    expect(socialChip).toBeDefined();
    expect(socialChip?.textContent).toContain('Social breakthrough');

    const commChip = Array.from(chips).find((c) =>
      c.textContent?.includes('ភាពជោគជ័យក្នុងការប្រាស្រ័យទាក់ទង'),
    );
    expect(commChip).toBeDefined();
    expect(commChip?.textContent).toContain('Communication win');

    (sensoryChip as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.form.controls.teacherObservations.value).toContain('ការសម្របសម្រួលញាណដឹង');
    expect(component.form.controls.teacherObservations.value).toContain('Sensory accommodation');
  });
});
