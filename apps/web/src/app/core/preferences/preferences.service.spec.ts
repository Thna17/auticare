import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { PreferencesService } from './preferences.service';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PreferencesService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    service = TestBed.inject(PreferencesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('initializes with default signal values', () => {
    expect(service.reducedMotion()).toBe(false);
    expect(service.highContrast()).toBe(false);
    expect(service.preferredLanguage()).toBe('en');
  });

  it('loads preferences and applies to document root', () => {
    service.loadPreferences().subscribe((res) => {
      expect(res.preference.reducedMotion).toBe(true);
      expect(res.preference.highContrast).toBe(true);
      expect(res.preference.preferredLanguage).toBe('vi');
    });

    const req = httpTesting.expectOne('/api/v1/parents/preferences');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        preference: {
          reducedMotion: true,
          highContrast: true,
          preferredLanguage: 'vi',
        },
      },
    });

    expect(service.reducedMotion()).toBe(true);
    expect(service.highContrast()).toBe(true);
    expect(service.preferredLanguage()).toBe('vi');
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(document.documentElement.getAttribute('lang')).toBe('vi');
  });

  it('updates preferences via PATCH and refreshes root classes', () => {
    service
      .updatePreferences({
        reducedMotion: false,
        highContrast: false,
        preferredLanguage: 'fr',
      })
      .subscribe((res) => {
        expect(res.preference.preferredLanguage).toBe('fr');
      });

    const req = httpTesting.expectOne('/api/v1/parents/preferences');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      reducedMotion: false,
      highContrast: false,
      preferredLanguage: 'fr',
    });

    req.flush({
      data: {
        preference: {
          reducedMotion: false,
          highContrast: false,
          preferredLanguage: 'fr',
        },
      },
    });

    expect(service.reducedMotion()).toBe(false);
    expect(service.highContrast()).toBe(false);
    expect(service.preferredLanguage()).toBe('fr');
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(false);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
  });

  it('manages sensory suite (font scaling and calming palette)', () => {
    service.applySensorySuite('large', true);
    expect(document.documentElement.classList.contains('calming-palette')).toBe(true);
    expect(document.documentElement.classList.contains('font-scale-large')).toBe(true);
    expect(document.documentElement.style.fontSize).toBe('18px');

    service.updateSensoryPreferences('xlarge', false);
    expect(service.fontSize()).toBe('xlarge');
    expect(service.calmingPalette()).toBe(false);
    expect(document.documentElement.classList.contains('calming-palette')).toBe(false);
    expect(document.documentElement.classList.contains('font-scale-xlarge')).toBe(true);
    expect(document.documentElement.style.fontSize).toBe('20px');

    // Reset back to normal
    service.applySensorySuite('normal', false);
    expect(document.documentElement.style.fontSize).toBe('16px');
  });

  it('manages notification preferences in local storage and signals', () => {
    service.updateNotificationPreferences({
      appointmentAlerts: false,
      schoolReports: true,
      systemAnnouncements: false,
    });

    expect(service.appointmentAlerts()).toBe(false);
    expect(service.schoolReports()).toBe(true);
    expect(service.systemAnnouncements()).toBe(false);
  });
});
