import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { HospitalsApi } from '../hospitals/data-access/hospitals.api';
import { AppointmentsFacade } from './state/appointments.facade';
import { SpecialistDiscoveryPage } from './specialist-discovery.page';
import type { DoctorResponse, SpecialtyCategory } from './appointments.types';
import {
  CAMBODIAN_HOSPITALS_SEED,
  CAMBODIAN_SPECIALISTS_SEED,
} from '../hospitals/cambodia-hospitals.data';

describe('SpecialistDiscoveryPage', () => {
  let fixture: ComponentFixture<SpecialistDiscoveryPage>;
  let component: SpecialistDiscoveryPage;

  const mockDoctors: DoctorResponse[] = [
    {
      id: 'doc_1',
      hospitalId: 'hosp_1',
      fullName: 'Dr. Sarah Smith',
      specialty: 'Speech Therapy',
      bio: 'Specialist in early communication interventions and pediatric speech therapy.',
      availableDays: '1,2,3,4,5',
      startHour: 9,
      endHour: 17,
      slotDurationMinutes: 30,
    },
    {
      id: 'doc_2',
      hospitalId: 'hosp_1',
      fullName: 'Dr. John Davis',
      specialty: 'Occupational Therapy',
      bio: 'Dedicated to sensory integration and motor skills development.',
      availableDays: '1,3,5',
      startHour: 10,
      endHour: 16,
      slotDurationMinutes: 45,
    },
    {
      id: 'doc_3',
      hospitalId: 'hosp_1',
      fullName: 'Dr. Emily Chen',
      specialty: 'Pediatrician',
      bio: 'Board-certified developmental pediatrician focusing on ASD neurodevelopment.',
      availableDays: '2,4',
      startHour: 8,
      endHour: 14,
      slotDurationMinutes: 30,
    },
  ];

  let doctorsSignal: ReturnType<typeof signal<DoctorResponse[]>>;
  let categoryFilterSignal: ReturnType<typeof signal<SpecialtyCategory>>;
  let mockFacade: {
    activeHospital: ReturnType<typeof signal<{ id: string; name: string; city: string } | null>>;
    doctors: typeof doctorsSignal;
    doctorsLoading: ReturnType<typeof signal<boolean>>;
    categoryFilter: typeof categoryFilterSignal;
    filteredDoctors: ReturnType<typeof computed<DoctorResponse[]>>;
    booking: ReturnType<
      typeof signal<{ isOpen: boolean; step: string; doctor: DoctorResponse | null }>
    >;
    setCategory: ReturnType<typeof vi.fn>;
    enterHospital: ReturnType<typeof vi.fn>;
    openBooking: ReturnType<typeof vi.fn>;
  };

  let mockHospitalsApi: {
    listHospitals: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    doctorsSignal = signal<DoctorResponse[]>(mockDoctors);
    categoryFilterSignal = signal<SpecialtyCategory>('All');

    const filteredDoctors = computed(() => {
      const cat = categoryFilterSignal();
      if (cat === 'All') return doctorsSignal();
      return doctorsSignal().filter((d) => d.specialty === cat);
    });

    mockFacade = {
      activeHospital: signal({
        id: 'hosp_1',
        name: 'Children Memorial Hospital',
        city: 'Metro City',
      }),
      doctors: doctorsSignal,
      doctorsLoading: signal(false),
      categoryFilter: categoryFilterSignal,
      filteredDoctors,
      booking: signal({ isOpen: false, step: 'select', doctor: null }),
      setCategory: vi.fn((cat: SpecialtyCategory) => categoryFilterSignal.set(cat)),
      enterHospital: vi.fn(),
      openBooking: vi.fn(),
    };

    mockHospitalsApi = {
      listHospitals: vi.fn().mockReturnValue(
        of([
          {
            id: 'hosp_1',
            name: 'Children Memorial Hospital',
            city: 'Metro City',
            address: '123 Care Ave',
            services: 'Therapies',
          },
        ]),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [SpecialistDiscoveryPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: AppointmentsFacade, useValue: mockFacade },
        { provide: HospitalsApi, useValue: mockHospitalsApi },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'hospitalId' ? 'hosp_1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialistDiscoveryPage);
    component = fixture.componentInstance;
  });

  it('initializes and enters hospital from route parameter', () => {
    fixture.detectChanges();
    expect(mockHospitalsApi.listHospitals).toHaveBeenCalled();
    expect(mockFacade.enterHospital).toHaveBeenCalledWith({
      id: 'hosp_1',
      name: 'Children Memorial Hospital',
      city: 'Metro City',
    });
  });

  describe('Specialty category pill filters', () => {
    it('renders category pill buttons and displays all specialists by default', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const pills = compiled.querySelectorAll('.category-pills button');
      expect(pills.length).toBe(4);

      const doctorCards = compiled.querySelectorAll('.doctor-card');
      expect(doctorCards.length).toBe(3);
      expect(component.displayedDoctors().length).toBe(3);
    });

    it('filters specialists when clicking a specialty category pill', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const pills = Array.from(
        compiled.querySelectorAll('.category-pills button'),
      ) as HTMLButtonElement[];
      const speechPill = pills.find((p) => p.textContent?.trim() === 'Speech Therapy');
      expect(speechPill).toBeDefined();

      speechPill?.click();
      fixture.detectChanges();

      expect(mockFacade.setCategory).toHaveBeenCalledWith('Speech Therapy');
      expect(component.displayedDoctors().length).toBe(1);
      expect(component.displayedDoctors()[0].fullName).toBe('Dr. Sarah Smith');

      const cards = compiled.querySelectorAll('.doctor-card');
      expect(cards.length).toBe(1);
      expect(cards[0].textContent).toContain('Dr. Sarah Smith');
    });

    it('updates active class on the selected category pill', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const pills = Array.from(
        compiled.querySelectorAll('.category-pills button'),
      ) as HTMLButtonElement[];

      expect(pills[0].classList.contains('active')).toBe(true);

      pills[2].click(); // Occupational Therapy
      fixture.detectChanges();

      expect(pills[2].classList.contains('active')).toBe(true);
      expect(component.displayedDoctors().length).toBe(1);
      expect(component.displayedDoctors()[0].fullName).toBe('Dr. John Davis');
    });
  });

  describe('Doctor keyword search', () => {
    it('filters specialists by doctor full name', () => {
      fixture.detectChanges();
      component.searchQuery.set('Sarah');
      fixture.detectChanges();

      expect(component.displayedDoctors().length).toBe(1);
      expect(component.displayedDoctors()[0].fullName).toBe('Dr. Sarah Smith');

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('.doctor-card');
      expect(cards.length).toBe(1);
      expect(cards[0].textContent).toContain('Dr. Sarah Smith');
    });

    it('filters specialists by bio keywords case-insensitively', () => {
      fixture.detectChanges();
      component.searchQuery.set('SENSORY');
      fixture.detectChanges();

      expect(component.displayedDoctors().length).toBe(1);
      expect(component.displayedDoctors()[0].fullName).toBe('Dr. John Davis');
    });

    it('filters specialists by specialty keyword', () => {
      fixture.detectChanges();
      component.searchQuery.set('Pediatrician');
      fixture.detectChanges();

      expect(component.displayedDoctors().length).toBe(1);
      expect(component.displayedDoctors()[0].fullName).toBe('Dr. Emily Chen');
    });

    it('combines category filter and search query simultaneously', () => {
      fixture.detectChanges();
      categoryFilterSignal.set('Speech Therapy');
      fixture.detectChanges();

      // Search matching within Speech Therapy
      component.searchQuery.set('Sarah');
      fixture.detectChanges();
      expect(component.displayedDoctors().length).toBe(1);
      expect(component.displayedDoctors()[0].fullName).toBe('Dr. Sarah Smith');

      // Search non-matching within Speech Therapy
      component.searchQuery.set('motor skills');
      fixture.detectChanges();
      expect(component.displayedDoctors().length).toBe(0);
    });

    it('updates search query when input event is triggered on the search box', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector<HTMLInputElement>('.search-input');
      expect(input).not.toBeNull();

      if (input) {
        input.value = 'Emily';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.searchQuery()).toBe('Emily');
        expect(component.displayedDoctors().length).toBe(1);
        expect(component.displayedDoctors()[0].fullName).toBe('Dr. Emily Chen');
      }
    });
  });

  describe('Empty state and filter clearing', () => {
    it('renders empty state with Clear button when search returns no matches', () => {
      fixture.detectChanges();
      component.searchQuery.set('Nonexistent Doctor');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('ac-ui-empty-state');
      expect(emptyState).not.toBeNull();
      expect(emptyState?.textContent).toContain('No matching specialists');

      const clearBtn = compiled.querySelector<HTMLButtonElement>('.clear-filters-btn');
      expect(clearBtn).not.toBeNull();
      expect(clearBtn?.textContent).toContain('Clear search & filters');
    });

    it('clears search query and resets category filter when Clear button is clicked', () => {
      fixture.detectChanges();
      categoryFilterSignal.set('Occupational Therapy');
      component.searchQuery.set('Not found');
      fixture.detectChanges();

      expect(component.hasActiveFilters()).toBe(true);

      const compiled = fixture.nativeElement as HTMLElement;
      const clearBtn = compiled.querySelector<HTMLButtonElement>('.clear-filters-btn');
      expect(clearBtn).not.toBeNull();

      clearBtn?.click();
      fixture.detectChanges();

      expect(component.searchQuery()).toBe('');
      expect(mockFacade.setCategory).toHaveBeenCalledWith('All');
      expect(component.displayedDoctors().length).toBe(3);
    });

    it('renders empty state without clear button if hospital has no doctors initially', () => {
      doctorsSignal.set([]);
      categoryFilterSignal.set('All');
      component.searchQuery.set('');
      fixture.detectChanges();

      expect(component.hasActiveFilters()).toBe(false);

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('ac-ui-empty-state');
      expect(emptyState).not.toBeNull();
      expect(emptyState?.textContent).toContain('No specialists available');

      const clearBtn = compiled.querySelector('.clear-filters-btn');
      expect(clearBtn).toBeNull();
    });
  });

  describe('Request Appointment booking modal trigger', () => {
    it('invokes facade.openBooking when Request Appointment / Book Consultation button is clicked', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const bookButtons = compiled.querySelectorAll<HTMLButtonElement>('.book-button');
      expect(bookButtons.length).toBe(3);
      expect(bookButtons[0].textContent?.trim()).toBe('Book Consultation');

      bookButtons[0].click();
      expect(mockFacade.openBooking).toHaveBeenCalledWith(mockDoctors[0]);

      bookButtons[1].click();
      expect(mockFacade.openBooking).toHaveBeenCalledWith(mockDoctors[1]);
    });
  });

  describe('Filter toolbar dropdowns and specialist card metadata', () => {
    it('renders city and hospital dropdown filters in the filter toolbar', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const citySelect = compiled.querySelector<HTMLSelectElement>('.city-select');
      const hospitalSelect = compiled.querySelector<HTMLSelectElement>('.hospital-select');

      expect(citySelect).not.toBeNull();
      expect(hospitalSelect).not.toBeNull();
      expect(citySelect?.textContent).toContain('All Cities');
      expect(citySelect?.textContent).toContain('Metro City');
      expect(hospitalSelect?.textContent).toContain('All Hospitals');
      expect(hospitalSelect?.textContent).toContain('Children Memorial Hospital');
    });

    it('renders hospital name tag and available days chips on specialist cards', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const hospitalTags = compiled.querySelectorAll('.hospital-name-tag');
      expect(hospitalTags.length).toBe(3);
      expect(hospitalTags[0].textContent).toContain('Children Memorial Hospital');

      const dayChipsGroup = compiled.querySelectorAll('.available-days-group');
      expect(dayChipsGroup.length).toBe(3);
      expect(dayChipsGroup[0].textContent).toContain('Mon');
      expect(dayChipsGroup[0].textContent).toContain('Fri');
    });

    it('filters specialists when a hospital is selected in the dropdown', () => {
      fixture.detectChanges();
      component.onHospitalSelect('hosp_nonexistent');
      fixture.detectChanges();

      expect(component.displayedDoctors().length).toBe(0);

      component.onHospitalSelect('hosp_1');
      fixture.detectChanges();
      expect(component.displayedDoctors().length).toBe(3);
    });
  });

  describe('Cambodian hospitals, provinces and bilingual clinical specialties', () => {
    beforeEach(() => {
      mockHospitalsApi.listHospitals.mockReturnValue(of([...CAMBODIAN_HOSPITALS_SEED]));
      fixture.detectChanges();
      component.hospitals.set(CAMBODIAN_HOSPITALS_SEED);
      component.selectedHospitalId.set('ALL');
      component.selectedCity.set('ALL');
      component.searchQuery.set('');
      categoryFilterSignal.set('All');
      doctorsSignal.set([...CAMBODIAN_SPECIALISTS_SEED]);
      fixture.detectChanges();
    });

    it('renders Cambodian provinces in the city dropdown filter', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const citySelect = compiled.querySelector<HTMLSelectElement>('.city-select');
      expect(citySelect).not.toBeNull();

      const optionsText = citySelect?.textContent ?? '';
      expect(optionsText).toContain('Phnom Penh');
      expect(optionsText).toContain('Siem Reap');
      expect(optionsText).toContain('Battambang');
      expect(optionsText).toContain('Kandal');
      expect(optionsText).toContain('Sihanoukville');
    });

    it('renders Cambodian hospitals including NPH, Kantha Bopha, Sunrise Japan, Calmette, Khmer-Soviet, and Angkor Hospital for Children', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const hospitalSelect = compiled.querySelector<HTMLSelectElement>('.hospital-select');
      expect(hospitalSelect).not.toBeNull();

      const optionsText = hospitalSelect?.textContent ?? '';
      expect(optionsText).toContain('National Pediatric Hospital');
      expect(optionsText).toContain('Kantha Bopha');
      expect(optionsText).toContain('Sunrise Japan Hospital');
      expect(optionsText).toContain('Calmette Hospital');
      expect(optionsText).toContain('Khmer-Soviet Friendship Hospital');
      expect(optionsText).toContain('Angkor Hospital for Children');
    });

    it('renders bilingual specialty badges for all 4 key developmental clinical specialties', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const badges = Array.from(compiled.querySelectorAll('.specialty-badge'));
      expect(badges.length).toBe(6);

      const allBadgeTexts = badges.map((b) => b.textContent?.trim()).join(' | ');

      // Developmental Pediatrician (វេជ្ជបណ្ឌិតឯកទេសកុមារ)
      expect(allBadgeTexts).toContain('វេជ្ជបណ្ឌិតឯកទេសកុមារ');
      expect(allBadgeTexts).toContain('Developmental Pediatrician');

      // Speech-Language Pathologist (អ្នកព្យាបាលការនិយាយ និងភាសា)
      expect(allBadgeTexts).toContain('អ្នកព្យាបាលការនិយាយ និងភាសា');
      expect(allBadgeTexts).toContain('Speech-Language Pathologist');

      // Occupational Therapist (អ្នកព្យាបាលចលករ និងញាណដឹង)
      expect(allBadgeTexts).toContain('អ្នកព្យាបាលចលករ និងញាណដឹង');
      expect(allBadgeTexts).toContain('Occupational Therapist');

      // Child Neurologist (វេជ្ជបណ្ឌិតឯកទេសប្រព័ន្ធប្រសាទកុមារ)
      expect(allBadgeTexts).toContain('វេជ្ជបណ្ឌិតឯកទេសប្រព័ន្ធប្រសាទកុមារ');
      expect(allBadgeTexts).toContain('Child Neurologist');
    });

    it('filters doctors by Cambodian city / province selection', () => {
      // Filter by Siem Reap (Angkor Hospital for Children is in Siem Reap)
      component.onCitySelect('Siem Reap');
      fixture.detectChanges();

      expect(component.displayedDoctors().length).toBe(1);
      expect(component.displayedDoctors()[0].fullName).toBe('Dr. Rithy Sam');

      // Filter by Phnom Penh
      component.onCitySelect('Phnom Penh');
      fixture.detectChanges();

      expect(component.displayedDoctors().length).toBe(5);
      expect(component.displayedDoctors().map((d) => d.fullName)).toContain('Dr. Lina Sok');
    });

    it('filters doctors by specific Cambodian hospital', () => {
      // Filter by Sunrise Japan Hospital
      component.onHospitalSelect('demo-hospital-sunrise');
      fixture.detectChanges();

      expect(component.displayedDoctors().length).toBe(1);
      expect(component.displayedDoctors()[0].fullName).toBe('Dr. Sreymom Keo');
      expect(component.displayedDoctors()[0].specialty).toBe('Occupational Therapist');
    });
  });
});
