import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { HospitalsApi } from '../hospitals/data-access/hospitals.api';
import { SelectHospitalPage } from './select-hospital.page';
import { I18nService } from '../../core/i18n/i18n.service';
import type { HospitalResponse } from '@auticare/contracts';

describe('SelectHospitalPage', () => {
  let fixture: ComponentFixture<SelectHospitalPage>;
  let component: SelectHospitalPage;

  const mockHospitals: HospitalResponse[] = [
    {
      id: 'hosp_1',
      name: 'Children Memorial Hospital',
      city: 'New York',
      address: '123 Care Ave',
      services: 'Pediatric care, Speech therapy',
      description: null,
      phone: null,
      website: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'hosp_2',
      name: 'St. Jude Developmental Center',
      city: 'Boston',
      address: '456 Beacon St',
      services: 'Occupational therapy, Sensory integration',
      description: null,
      phone: null,
      website: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'hosp_3',
      name: 'Metro Autism Care Clinic',
      city: 'Chicago',
      address: '789 Michigan Ave',
      services: 'Diagnostic evaluations, Behavioral therapy',
      description: null,
      phone: null,
      website: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  let mockHospitalsApi: {
    listHospitals: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockHospitalsApi = {
      listHospitals: vi.fn().mockReturnValue(of(mockHospitals)),
    };

    await TestBed.configureTestingModule({
      imports: [SelectHospitalPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: HospitalsApi, useValue: mockHospitalsApi },
        I18nService,
      ],
    }).compileComponents();

    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    fixture = TestBed.createComponent(SelectHospitalPage);
    component = fixture.componentInstance;
  });

  it('renders initial list of hospitals from HospitalsApi', () => {
    fixture.detectChanges();
    expect(mockHospitalsApi.listHospitals).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.hospital-card');
    expect(cards.length).toBe(3);

    const countTag = compiled.querySelector('.count-tag');
    expect(countTag?.textContent).toContain('Showing all 3 hospitals');

    expect(cards[0].textContent).toContain('Children Memorial Hospital');
    expect(cards[0].textContent).toContain('New York');
    expect(cards[0].textContent).toContain('123 Care Ave');
  });

  describe('Keyword search filtering', () => {
    it('filters hospitals by hospital name', () => {
      fixture.detectChanges();
      component.searchQuery.set('Memorial');
      fixture.detectChanges();

      expect(component.displayedHospitals().length).toBe(1);
      expect(component.displayedHospitals()[0].name).toBe('Children Memorial Hospital');

      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('.hospital-card');
      expect(cards.length).toBe(1);

      const countTag = compiled.querySelector('.count-tag');
      expect(countTag?.textContent).toContain('Showing 1 of 3 hospitals');
    });

    it('filters hospitals by city case-insensitively', () => {
      fixture.detectChanges();
      component.searchQuery.set('boston');
      fixture.detectChanges();

      expect(component.displayedHospitals().length).toBe(1);
      expect(component.displayedHospitals()[0].name).toBe('St. Jude Developmental Center');
    });

    it('filters hospitals by address', () => {
      fixture.detectChanges();
      component.searchQuery.set('Michigan Ave');
      fixture.detectChanges();

      expect(component.displayedHospitals().length).toBe(1);
      expect(component.displayedHospitals()[0].name).toBe('Metro Autism Care Clinic');
    });

    it('filters hospitals by service offering', () => {
      fixture.detectChanges();
      component.searchQuery.set('Sensory integration');
      fixture.detectChanges();

      expect(component.displayedHospitals().length).toBe(1);
      expect(component.displayedHospitals()[0].name).toBe('St. Jude Developmental Center');
    });

    it('updates search query when input event is dispatched from search input', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector<HTMLInputElement>('.search-input');
      expect(input).not.toBeNull();

      if (input) {
        input.value = 'Chicago';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.searchQuery()).toBe('Chicago');
        expect(component.displayedHospitals().length).toBe(1);
        expect(component.displayedHospitals()[0].name).toBe('Metro Autism Care Clinic');
      }
    });
  });

  describe('Empty states and clear search', () => {
    it('renders empty state with Clear Search button when query has no matches', () => {
      fixture.detectChanges();
      component.searchQuery.set('Unknown Hospital 999');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('ac-ui-empty-state');
      expect(emptyState).not.toBeNull();
      expect(emptyState?.textContent).toContain('No hospitals found');

      const clearBtn = compiled.querySelector<HTMLButtonElement>('.clear-search-btn');
      expect(clearBtn).not.toBeNull();
      expect(clearBtn?.textContent).toContain('Clear search');
    });

    it('resets search query and restores full list when Clear search button is clicked', () => {
      fixture.detectChanges();
      component.searchQuery.set('Unknown');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const clearBtn = compiled.querySelector<HTMLButtonElement>('.clear-search-btn');
      expect(clearBtn).not.toBeNull();

      clearBtn?.click();
      fixture.detectChanges();

      expect(component.searchQuery()).toBe('');
      expect(component.displayedHospitals().length).toBe(3);
    });

    it('renders empty state without clear button if hospital list is empty from API', () => {
      mockHospitalsApi.listHospitals.mockReturnValue(of([]));
      fixture = TestBed.createComponent(SelectHospitalPage);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const emptyState = compiled.querySelector('ac-ui-empty-state');
      expect(emptyState).not.toBeNull();
      expect(emptyState?.textContent).toContain('No hospitals available yet');

      const clearBtn = compiled.querySelector('.clear-search-btn');
      expect(clearBtn).toBeNull();
    });
  });

  describe('Navigation links', () => {
    it('links hospital cards to /appointments/hospitals/:hospitalId', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const cards = Array.from(compiled.querySelectorAll<HTMLAnchorElement>('.hospital-card'));

      expect(cards.length).toBe(3);
      expect(cards[0].getAttribute('href')).toBe('/appointments/hospitals/hosp_1');
      expect(cards[1].getAttribute('href')).toBe('/appointments/hospitals/hosp_2');
      expect(cards[2].getAttribute('href')).toBe('/appointments/hospitals/hosp_3');
    });
  });

  describe('Error handling', () => {
    it('displays error message and retry button on load failure', () => {
      mockHospitalsApi.listHospitals.mockReturnValue(throwError(() => new Error('Network error')));
      fixture = TestBed.createComponent(SelectHospitalPage);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorMsg = compiled.querySelector('ac-ui-message');
      expect(errorMsg).not.toBeNull();
      expect(errorMsg?.textContent).toContain('Hospitals could not be loaded.');

      const retryBtn = compiled.querySelector<HTMLButtonElement>('.retry');
      expect(retryBtn).not.toBeNull();
    });
  });
});
