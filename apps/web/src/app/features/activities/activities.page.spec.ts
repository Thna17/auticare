import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type {
  ActivityProgressResponse,
  ActivityResponse,
  ChildResponse,
  ScreeningSessionDetailResponse,
} from '@auticare/contracts';
import { ChildrenApi } from '../children/data-access/children.api';
import { ActivitiesApi } from './data-access/activities.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { I18nService } from '../../core/i18n/i18n.service';
import { ActivitiesPage } from './activities.page';
import { CAMBODIAN_HOME_ACTIVITIES, findCambodianActivity } from './cambodia-activities.data';

describe('ActivitiesPage', () => {
  let fixture: ComponentFixture<ActivitiesPage>;
  let component: ActivitiesPage;

  let mockChildrenApi: {
    listChildren: ReturnType<typeof vi.fn>;
  };

  let mockActivitiesApi: {
    listActivities: ReturnType<typeof vi.fn>;
    listProgress: ReturnType<typeof vi.fn>;
    startActivity: ReturnType<typeof vi.fn>;
    updateProgress: ReturnType<typeof vi.fn>;
  };

  let mockScreeningApi: {
    listSessions: ReturnType<typeof vi.fn>;
  };

  const sampleChildren: ChildResponse[] = [
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

  const sampleActivities: ActivityResponse[] = [
    {
      id: 'act_1',
      title: 'Sensory Bubble Play',
      category: 'Sensory',
      minAgeMonths: 24,
      maxAgeMonths: 48,
      summary: 'Gentle tactile exploration using textured soap bubbles.',
    },
    {
      id: 'act_2',
      title: 'Picture Exchange Card Matching',
      category: 'Communication',
      minAgeMonths: 30,
      maxAgeMonths: 60,
      summary: 'Visual matching routines supporting early functional communication.',
    },
    {
      id: 'act_3',
      title: 'Rhythm Clapping & Turn Taking',
      category: 'Social',
      minAgeMonths: 24,
      maxAgeMonths: 48,
      summary: 'Predictable musical turn-taking game.',
    },
  ];

  const sampleProgress: ActivityProgressResponse[] = [
    {
      id: 'prog_1',
      childId: 'child_1',
      activityId: 'act_1',
      activityTitle: 'Sensory Bubble Play',
      startedAt: '2026-10-01T00:00:00.000Z',
      completedAt: null, // In Progress
      parentObservation: 'Loved popping bubbles with fingers.',
    },
    {
      id: 'prog_2',
      childId: 'child_1',
      activityId: 'act_2',
      activityTitle: 'Picture Exchange Card Matching',
      startedAt: '2026-10-02T00:00:00.000Z',
      completedAt: '2026-10-03T00:00:00.000Z', // Completed
      parentObservation: 'Quickly picked up image cards.',
    },
  ];

  const sampleScreeningSessions: ScreeningSessionDetailResponse[] = [
    {
      id: 'sess_1',
      childId: 'child_1',
      ageBand: 'TODDLER',
      status: 'ANALYZED',
      startedAt: '2026-10-01T00:00:00.000Z',
      submittedAt: '2026-10-01T00:00:00.000Z',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      answers: [],
      result: {
        id: 'res_1',
        score: 18,
        riskPercentage: 60,
        riskLevel: 'HIGH',
        recommendation: 'Seek clinical evaluation.',
        disclaimer: 'Informational screening result.',
        analysisVersion: 'v3',
        analyzedAt: '2026-10-01T00:00:00.000Z',
        categoryBreakdown: [
          { category: 'Communication', riskPercentage: 75, riskLevel: 'HIGH' },
          { category: 'Social Interaction', riskPercentage: 40, riskLevel: 'MODERATE' },
          { category: 'Sensory', riskPercentage: 10, riskLevel: 'LOW' },
        ],
      },
    },
  ];

  beforeEach(async () => {
    mockChildrenApi = {
      listChildren: vi.fn().mockReturnValue(of(sampleChildren)),
    };

    mockActivitiesApi = {
      listActivities: vi.fn().mockReturnValue(of(sampleActivities)),
      listProgress: vi.fn().mockReturnValue(of(sampleProgress)),
      startActivity: vi.fn().mockReturnValue(
        of({
          id: 'prog_3',
          childId: 'child_1',
          activityId: 'act_3',
          activityTitle: 'Rhythm Clapping & Turn Taking',
          startedAt: '2026-10-11T00:00:00.000Z',
          completedAt: null,
          parentObservation: null,
        }),
      ),
      updateProgress: vi.fn().mockImplementation((id, data) =>
        of({
          ...sampleProgress.find((p) => p.id === id)!,
          ...data,
        }),
      ),
    };

    mockScreeningApi = {
      listSessions: vi.fn().mockReturnValue(of(sampleScreeningSessions)),
    };

    await TestBed.configureTestingModule({
      imports: [ActivitiesPage],
      providers: [
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ActivitiesApi, useValue: mockActivitiesApi },
        { provide: ScreeningApi, useValue: mockScreeningApi },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'childId' ? 'child_1' : null),
              },
            },
            queryParamMap: of(new Map([['childId', 'child_1']])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitiesPage);
    TestBed.inject(I18nService).setLanguage('en');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders activities summary metrics bar with total, in-progress, and completed counts', () => {
    const summary = component['summaryCounts']();
    expect(summary.total).toBe(3);
    expect(summary.inProgress).toBe(1);
    expect(summary.completed).toBe(1);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Total Available');
    expect(compiled.textContent).toContain('In Progress');
    expect(compiled.textContent).toContain('Completed');
  });

  it('filters activities by keyword search', () => {
    // Initial: all 3 rows visible
    expect(component['rows']().length).toBe(3);

    // Search by title keyword 'Bubble'
    component['searchQuery'].set('bubble');
    fixture.detectChanges();
    let rows = component['rows']();
    expect(rows.length).toBe(1);
    expect(rows[0].activity.title).toBe('Sensory Bubble Play');

    // Search by summary keyword 'musical'
    component['searchQuery'].set('musical');
    fixture.detectChanges();
    rows = component['rows']();
    expect(rows.length).toBe(1);
    expect(rows[0].activity.title).toBe('Rhythm Clapping & Turn Taking');

    // Search query with no match
    component['searchQuery'].set('xyznonexistent');
    fixture.detectChanges();
    expect(component['rows']().length).toBe(0);
  });

  it('filters activities by status pills', () => {
    // In Progress filter: only act_1
    component['statusFilter'].set('IN_PROGRESS');
    fixture.detectChanges();
    let rows = component['rows']();
    expect(rows.length).toBe(1);
    expect(rows[0].activity.id).toBe('act_1');

    // Completed filter: only act_2
    component['statusFilter'].set('COMPLETED');
    fixture.detectChanges();
    rows = component['rows']();
    expect(rows.length).toBe(1);
    expect(rows[0].activity.id).toBe('act_2');

    // Not Started filter: only act_3
    component['statusFilter'].set('NOT_STARTED');
    fixture.detectChanges();
    rows = component['rows']();
    expect(rows.length).toBe(1);
    expect(rows[0].activity.id).toBe('act_3');

    // All filter: all 3
    component['statusFilter'].set('ALL');
    fixture.detectChanges();
    expect(component['rows']().length).toBe(3);
  });

  it('saves activity note when parent edits and clicks save note', () => {
    const targetProgress = sampleProgress[0];
    component['setNoteDraft'](targetProgress.id, 'Updated note: great focus today.');
    expect(component['noteChanged'](targetProgress)).toBe(true);

    component['saveNote'](targetProgress);
    expect(mockActivitiesApi.updateProgress).toHaveBeenCalledWith(targetProgress.id, {
      parentObservation: 'Updated note: great focus today.',
    });
  });

  it('selects requested child from query param hand-off', () => {
    expect(component['selectedChildId']()).toBe('child_1');
  });

  it('displays Screening Priority badges on activities matching elevated screening risk domains', () => {
    // Child has elevated risk in Communication (HIGH) and Social Interaction (MODERATE).
    // act_2 is 'Communication' -> recommended.
    // act_3 is 'Social' -> recommended.
    // act_1 is 'Sensory' -> low risk, not recommended.
    const priorityBadges = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.priority-badge',
    );
    expect(priorityBadges.length).toBe(2);

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.activity');
    // act_1 has no badge
    expect(cards[0].textContent).not.toContain('Screening Priority');
    // act_2 and act_3 have badge
    expect(cards[1].textContent).toContain('Screening Priority');
    expect(cards[2].textContent).toContain('Screening Priority');
  });

  it('filters activities when Recommended for child filter toggle is clicked', () => {
    const recommendedBtn: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector(
      '.pill-btn--recommended',
    )!;
    expect(recommendedBtn).toBeTruthy();
    expect(recommendedBtn.textContent).toContain('Recommended for Bopha');

    // Click recommended filter button
    recommendedBtn.click();
    fixture.detectChanges();

    // Only 2 activities should remain visible (act_2 and act_3)
    let rows = component['rows']();
    expect(rows.length).toBe(2);
    expect(rows.map((r) => r.activity.id)).toEqual(['act_2', 'act_3']);

    // Toggle off
    recommendedBtn.click();
    fixture.detectChanges();
    rows = component['rows']();
    expect(rows.length).toBe(3);
  });

  it('renders difficulty rating and duration badges on activity cards', () => {
    const difficultyBadges = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.difficulty-badge',
    );
    expect(difficultyBadges.length).toBe(3);

    const durationBadges = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.duration-badge',
    );
    expect(durationBadges.length).toBe(3);

    expect(difficultyBadges[0].textContent).toContain('Gentle');
    expect(durationBadges[0].textContent).toContain('30m');
  });

  it('filters activities by playful category pill buttons', () => {
    const categoryPills = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.category-pill-btn',
    );
    expect(categoryPills.length).toBeGreaterThanOrEqual(4);

    // Click 'Sensory' pill
    const sensoryBtn = Array.from(categoryPills).find((el) =>
      el.textContent?.includes('Sensory'),
    ) as HTMLButtonElement;
    expect(sensoryBtn).toBeTruthy();

    sensoryBtn.click();
    fixture.detectChanges();

    expect(mockActivitiesApi.listActivities).toHaveBeenCalledWith({
      childId: 'child_1',
      category: 'Sensory',
    });
  });

  it('opens interactive activity modal guide with step-by-step instructions and materials checklist', () => {
    // Open guide for first activity (Sensory Bubble Play)
    const guideBtns = (fixture.nativeElement as HTMLElement).querySelectorAll('.guide-btn');
    expect(guideBtns.length).toBe(3);

    (guideBtns[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component['selectedActivityRow']()).toBeTruthy();
    expect(component['selectedActivityRow']()?.activity.title).toBe('Sensory Bubble Play');

    const modalBody = (fixture.nativeElement as HTMLElement).querySelector('.activity-modal-body');
    expect(modalBody).toBeTruthy();
    expect(modalBody?.textContent).toContain('Materials Checklist');
    expect(modalBody?.textContent).toContain('Step-by-Step Instructions');
    expect(modalBody?.textContent).toContain('Sensory Tip:');

    // Close modal
    component.closeActivityDrawer();
    fixture.detectChanges();
    expect(component['selectedActivityRow']()).toBeNull();
  });

  it('toggles materials checklist checkboxes in the activity guide', () => {
    const firstRow = component['rows']()[0];
    component.openActivityDrawer(firstRow);
    fixture.detectChanges();

    const materials = component.getMaterialsList(firstRow.activity);
    expect(materials.length).toBeGreaterThan(0);

    const firstItem = materials[0];
    expect(component.isMaterialChecked(firstRow.activity.id, firstItem)).toBe(false);

    // Toggle checked
    component.toggleMaterial(firstRow.activity.id, firstItem);
    expect(component.isMaterialChecked(firstRow.activity.id, firstItem)).toBe(true);

    // Toggle unchecked
    component.toggleMaterial(firstRow.activity.id, firstItem);
    expect(component.isMaterialChecked(firstRow.activity.id, firstItem)).toBe(false);
  });

  it('marks activity completed inside the interactive activity modal', () => {
    // Open modal for act_1 (which is currently In Progress)
    const inProgressRow = component['rows']().find((r) => r.activity.id === 'act_1')!;
    component.openActivityDrawer(inProgressRow);
    fixture.detectChanges();

    const completeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.complete-lg-btn',
    ) as HTMLButtonElement;
    expect(completeBtn).toBeTruthy();
    expect(completeBtn.textContent).toContain('Mark as Completed');

    completeBtn.click();
    fixture.detectChanges();

    expect(mockActivitiesApi.updateProgress).toHaveBeenCalledWith(inProgressRow.progress!.id, {
      completed: true,
    });
  });

  it('toggles step checklist items in the activity guide', () => {
    const firstRow = component['rows']()[0];
    component.openActivityDrawer(firstRow);
    fixture.detectChanges();

    const steps = component.getStepsList(firstRow.activity);
    expect(steps.length).toBeGreaterThan(0);

    expect(component.isStepChecked(firstRow.activity.id, 0)).toBe(false);

    // Toggle checked
    component.toggleStep(firstRow.activity.id, 0);
    expect(component.isStepChecked(firstRow.activity.id, 0)).toBe(true);

    // Toggle unchecked
    component.toggleStep(firstRow.activity.id, 0);
    expect(component.isStepChecked(firstRow.activity.id, 0)).toBe(false);
  });

  it('submits parent reflection note from inside the interactive activity modal', () => {
    const inProgressRow = component['rows']().find((r) => r.activity.id === 'act_1')!;
    component.openActivityDrawer(inProgressRow);
    fixture.detectChanges();

    const modalTextarea = (fixture.nativeElement as HTMLElement).querySelector(
      '.modal-textarea',
    ) as HTMLTextAreaElement;
    expect(modalTextarea).toBeTruthy();

    component['setNoteDraft'](
      inProgressRow.progress!.id,
      'Child showed calming response to tactile foam.',
    );
    fixture.detectChanges();

    const saveButtons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.note-submit-row button',
    );
    expect(saveButtons.length).toBe(1);

    (saveButtons[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(mockActivitiesApi.updateProgress).toHaveBeenCalledWith(inProgressRow.progress!.id, {
      parentObservation: 'Child showed calming response to tactile foam.',
    });
  });

  it('renders Fine Motor category pill and triggers category filter', () => {
    const categoryPills = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.category-pill-btn',
    );
    const fineMotorBtn = Array.from(categoryPills).find((el) =>
      el.textContent?.includes('Fine Motor'),
    ) as HTMLButtonElement;
    expect(fineMotorBtn).toBeTruthy();

    fineMotorBtn.click();
    fixture.detectChanges();

    expect(mockActivitiesApi.listActivities).toHaveBeenCalledWith({
      childId: 'child_1',
      category: 'Fine Motor',
    });
  });

  it('renders localized Khmer activity category options and triggers Khmer filter', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('km');
    fixture.detectChanges();

    const categoryPills = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.category-pill-btn',
    );
    const categoryTexts = Array.from(categoryPills).map((el) => el.textContent || '');

    // Verify presence of Khmer translations in category pills and zero English parentheticals
    expect(categoryTexts.some((txt) => txt.includes('ញាណដឹង'))).toBe(true);
    expect(categoryTexts.some((txt) => txt.includes('ចលករតូច'))).toBe(true);
    expect(categoryTexts.some((txt) => txt.includes('ការប្រាស្រ័យទាក់ទង'))).toBe(true);
    expect(categoryTexts.some((txt) => txt.includes('ទំនាក់ទំនងសង្គម'))).toBe(true);
    expect(categoryTexts.some((txt) => txt.includes('Sensory'))).toBe(false);

    i18n.setLanguage('en');
    fixture.detectChanges();
  });

  it('matches all 5 culturally adapted Cambodian home sensory play routines', () => {
    expect(CAMBODIAN_HOME_ACTIVITIES.length).toBe(5);

    // 1. Sensory Rice & Grain Bin
    const riceAct = CAMBODIAN_HOME_ACTIVITIES[0];
    expect(riceAct.title).toContain('Sensory Rice & Grain Bin');
    expect(riceAct.title).toContain('ការលេងអង្ករ និងគ្រាប់ធញ្ញជាតិចម្រុះពណ៌');
    expect(riceAct.category).toBe('Sensory');
    expect(findCambodianActivity(riceAct)).toBeDefined();

    // 2. Calming Coconut Water & Bubble Play
    const coconutAct = CAMBODIAN_HOME_ACTIVITIES[1];
    expect(coconutAct.title).toContain('Calming Coconut Water & Bubble Play');
    expect(coconutAct.title).toContain('ល្បែងពពុះទឹក និងសំបកដូងបន្ធូរអារម្មណ៍');
    expect(coconutAct.category).toBe('Sensory');
    expect(findCambodianActivity(coconutAct)).toBeDefined();

    // 3. Banana Leaf & Paper Folding
    const bananaAct = CAMBODIAN_HOME_ACTIVITIES[2];
    expect(bananaAct.title).toContain('Banana Leaf & Paper Folding');
    expect(bananaAct.title).toContain('ការបត់ស្លឹកចេក និងក្រដាស');
    expect(bananaAct.category).toBe('Fine Motor');
    expect(findCambodianActivity(bananaAct)).toBeDefined();

    // 4. Clay & Soft Dough Sculpting
    const clayAct = CAMBODIAN_HOME_ACTIVITIES[3];
    expect(clayAct.title).toContain('Clay & Soft Dough Sculpting');
    expect(clayAct.title).toContain('ការឆ្លាក់ដីឥដ្ឋទន់ និងម្សៅពណ៌');
    expect(clayAct.category).toBe('Sensory');
    expect(findCambodianActivity(clayAct)).toBeDefined();

    // 5. Rhythm & Clapping Games with Khmer Rhymes
    const rhymeAct = CAMBODIAN_HOME_ACTIVITIES[4];
    expect(rhymeAct.title).toContain('Rhythm & Clapping Games with Khmer Rhymes');
    expect(rhymeAct.title).toContain('ល្បែងទះដៃ និងចង្វាក់ភ្លេងខ្មែរ');
    expect(rhymeAct.category).toBe('Social');
    expect(findCambodianActivity(rhymeAct)).toBeDefined();
  });

  it('provides authentic Khmer step-by-step instructions and materials checklist for Cambodian activities', () => {
    const riceAct = CAMBODIAN_HOME_ACTIVITIES[0];

    // Khmer language extraction
    const materialsKm = component.getMaterialsList(riceAct, 'km');
    expect(materialsKm.length).toBe(4);
    expect(materialsKm.some((m) => m.includes('អង្ករផ្កាម្លិះ'))).toBe(true);
    expect(materialsKm.some((m) => m.includes('Large shallow'))).toBe(false);

    const stepsKm = component.getStepsList(riceAct, 'km');
    expect(stepsKm.length).toBe(4);
    expect(stepsKm[0].title).toContain('១. រៀបចំធុងអង្ករ');
    expect(stepsKm[0].title).not.toContain('Prepare Sensory Bin');

    // English language extraction
    const materialsEn = component.getMaterialsList(riceAct, 'en');
    expect(materialsEn.length).toBe(4);
    expect(materialsEn.some((m) => m.includes('Large shallow sensory bin'))).toBe(true);
    expect(materialsEn.some((m) => m.includes('អង្ករផ្កាម្លិះ'))).toBe(false);

    const stepsEn = component.getStepsList(riceAct, 'en');
    expect(stepsEn.length).toBe(4);
    expect(stepsEn[0].title).toContain('Prepare Sensory Bin');
    expect(stepsEn[0].title).not.toContain('១. រៀបចំធុងអង្ករ');
  });

  it('renders micro-celebration animation and supports submitting parent reflection notes in Khmer', () => {
    const inProgressRow = component['rows']().find((r) => r.activity.id === 'act_1')!;
    component.openActivityDrawer(inProgressRow);
    fixture.detectChanges();

    // Enter reflection note in Khmer
    const khmerNote = 'កូនចូលចិត្តស្ទាបអង្អែលគ្រាប់អង្ករខ្លាំងណាស់ មានការផ្តោតអារម្មណ៍បានយូរ។';
    component['setNoteDraft'](inProgressRow.progress!.id, khmerNote);
    fixture.detectChanges();

    expect(component['noteChanged'](inProgressRow.progress!)).toBe(true);

    // Save note
    component['saveNote'](inProgressRow.progress!);
    expect(mockActivitiesApi.updateProgress).toHaveBeenCalledWith(inProgressRow.progress!.id, {
      parentObservation: khmerNote,
    });

    // Check celebration banner styling for completed activity in English mode
    const completedRow = component['rows']().find((r) => r.activity.id === 'act_2')!;
    component.openActivityDrawer(completedRow);
    fixture.detectChanges();

    const celebrationBanner = (fixture.nativeElement as HTMLElement).querySelector(
      '.celebration-banner',
    );
    expect(celebrationBanner).toBeTruthy();
    expect(celebrationBanner?.textContent).toContain('Well Done! Completed');
    expect(celebrationBanner?.textContent).not.toContain('អបអរសាទរ! បានបញ្ចប់');

    // Toggle to Khmer mode and verify clean Khmer celebration banner
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('km');
    fixture.detectChanges();
    expect(celebrationBanner?.textContent).toContain('អបអរសាទរ! បានបញ្ចប់');
    expect(celebrationBanner?.textContent).not.toContain('Well Done! Completed');
    i18n.setLanguage('en');
    fixture.detectChanges();
  });

  it('falls back to CAMBODIAN_HOME_ACTIVITIES when API catalogue is empty or offline', () => {
    mockActivitiesApi.listActivities.mockReturnValueOnce(of([]));
    component['load']();
    fixture.detectChanges();

    expect(component['activities']().length).toBe(5);
    const titles = component['activities']().map((a) => a.title);
    expect(titles.some((t) => t.includes('Sensory Rice & Grain Bin'))).toBe(true);
    expect(titles.some((t) => t.includes('Banana Leaf & Paper Folding'))).toBe(true);
    expect(titles.some((t) => t.includes('Coconut Water & Bubble Play'))).toBe(true);
  });

  it('renders clean decoupled bilingual copy without mixed parentheticals', () => {
    const i18n = TestBed.inject(I18nService);
    const compiled = fixture.nativeElement as HTMLElement;

    // In English mode:
    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(compiled.querySelector('.eyebrow')?.textContent).toContain('Home & Sensory Support');
    expect(compiled.querySelector('h1')?.textContent).toContain('Activities & Play Library');
    expect(compiled.querySelector('.summary-bar')?.textContent).toContain('Total Available');
    expect(compiled.querySelector('.summary-bar')?.textContent).toContain('In Progress');
    expect(compiled.querySelector('.summary-bar')?.textContent).toContain('Completed');
    expect(compiled.textContent).not.toContain('ការគាំទ្រញាណដឹង');
    expect(compiled.textContent).not.toContain('បណ្ណាល័យសកម្មភាព');

    // In Khmer mode:
    i18n.setLanguage('km');
    fixture.detectChanges();
    expect(compiled.querySelector('.eyebrow')?.textContent).toContain(
      'ការគាំទ្រញាណដឹង និងល្បែងនៅផ្ទះ',
    );
    expect(compiled.querySelector('h1')?.textContent).toContain('បណ្ណាល័យសកម្មភាព និងការលេង');
    expect(compiled.querySelector('.summary-bar')?.textContent).toContain('សរុបទាំងអស់');
    expect(compiled.querySelector('.summary-bar')?.textContent).toContain('កំពុងអនុវត្ត');
    expect(compiled.querySelector('.summary-bar')?.textContent).toContain('បានបញ្ចប់');
    expect(compiled.textContent).not.toContain('Home & Sensory Support');
    expect(compiled.textContent).not.toContain('Activities & Play Library');

    // Reset back to English
    i18n.setLanguage('en');
    fixture.detectChanges();
  });
});
