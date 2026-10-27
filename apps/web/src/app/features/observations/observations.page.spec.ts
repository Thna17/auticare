/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ObservationsPage } from './observations.page';
import { ChildrenApi } from '../children/data-access/children.api';
import { ObservationsApi } from './data-access/observations.api';
import { I18nService } from '../../core/i18n/i18n.service';
import type { ChildResponse, ObservationResponse } from '@auticare/contracts';

describe('ObservationsPage', () => {
  let fixture: ComponentFixture<ObservationsPage>;
  let component: ObservationsPage;
  let i18n: I18nService;

  const mockChild: ChildResponse = {
    id: 'child-1',
    firstName: 'Sophea',
    lastName: 'Chan',
    dateOfBirth: '2020-05-15',
    notes: null,
    archivedAt: null,
    questionnaireStatus: 'COMPLETED',
  };

  const todayIso = new Date().toISOString();

  const mockObservation: ObservationResponse = {
    id: 'obs-1',
    childId: 'child-1',
    category: 'COMMUNICATION',
    intensity: 3,
    occurredAt: todayIso,
    note: 'Pointed to cup and said water',
    trigger: 'Thirsty after playing outside',
    durationMinutes: 5,
    parentResponse: 'Poured water and praised',
    outcome: 'Drank happily',
    createdAt: todayIso,
    updatedAt: todayIso,
  };

  const mockChildrenApi = {
    listChildren: vi.fn().mockReturnValue(of([mockChild])),
  };

  const mockObservationsApi = {
    list: vi.fn().mockReturnValue(of([mockObservation])),
    create: vi.fn().mockReturnValue(of(mockObservation)),
    remove: vi.fn().mockReturnValue(of({ id: 'obs-1' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservationsPage],
      providers: [
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: ObservationsApi, useValue: mockObservationsApi },
        I18nService,
      ],
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    fixture = TestBed.createComponent(ObservationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders loaded observations and displays details in English', () => {
    expect(mockChildrenApi.listChildren).toHaveBeenCalled();
    expect(mockObservationsApi.list).toHaveBeenCalledWith({ childId: 'child-1' });

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Pointed to cup and said water');
    expect(text).toContain('Communication');
  });

  it('filters by category', () => {
    (component as any).setFilter('SENSORY');
    fixture.detectChanges();

    expect((component as any).visible().length).toBe(0);

    (component as any).setFilter(null);
    fixture.detectChanges();
    expect((component as any).visible().length).toBe(1);
  });

  it('toggles history view modes', () => {
    (component as any).setViewMode('weekly');
    expect((component as any).viewMode()).toBe('weekly');

    (component as any).setViewMode('monthly');
    expect((component as any).viewMode()).toBe('monthly');
  });

  it('opens recording sheet and saves observation with new fields', () => {
    (component as any).openForm();
    fixture.detectChanges();

    expect((component as any).formOpen()).toBe(true);

    (component as any).draftCategory.set('EMOTIONAL');
    (component as any).draftNote.set('Cried at bedtime');
    (component as any).draftTrigger.set('Tired after travel');
    (component as any).draftDurationMinutes.set(10);
    (component as any).draftParentResponse.set('Read a story');
    (component as any).draftOutcome.set('Fell asleep peacefully');

    (component as any).save();

    expect(mockObservationsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        childId: 'child-1',
        category: 'EMOTIONAL',
        note: 'Cried at bedtime',
        trigger: 'Tired after travel',
        durationMinutes: 10,
        parentResponse: 'Read a story',
        outcome: 'Fell asleep peacefully',
      }),
    );
  });
});
