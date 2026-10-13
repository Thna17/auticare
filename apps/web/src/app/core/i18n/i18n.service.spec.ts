import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PreferencesService } from '../preferences/preferences.service';
import { I18nService, LANG_STORAGE_KEY } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.removeItem(LANG_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [
        I18nService,
        {
          provide: PreferencesService,
          useValue: {
            updatePreferredLanguage: () => {},
          },
        },
      ],
    });
    service = TestBed.inject(I18nService);
  });

  afterEach(() => {
    localStorage.removeItem(LANG_STORAGE_KEY);
  });

  it('defaults to Khmer (km) for Cambodian platform and syncs HTML lang attribute', () => {
    expect(service.currentLang()).toBe('km');
    expect(document.documentElement.getAttribute('lang')).toBe('km');
    expect(document.documentElement.classList.contains('lang-km')).toBe(true);
  });

  it('switches language cleanly between Khmer and English', () => {
    service.setLanguage('en');
    expect(service.currentLang()).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.documentElement.classList.contains('lang-en')).toBe(true);
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');

    service.setLanguage('km');
    expect(service.currentLang()).toBe('km');
    expect(document.documentElement.getAttribute('lang')).toBe('km');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('km');
  });

  it('toggles language between km and en via toggleLanguage()', () => {
    expect(service.currentLang()).toBe('km');
    service.toggleLanguage();
    expect(service.currentLang()).toBe('en');
    service.toggleLanguage();
    expect(service.currentLang()).toBe('km');
  });

  it('resolves core dictionary translations in Khmer and English', () => {
    service.setLanguage('km');
    expect(service.t('nav.home')).toBe('ទំព័រដើម');
    expect(service.t('nav.screening')).toBe('ការវាយតម្លៃ');
    expect(service.t('child.viewingCareFor')).toBe('កំពុងមើលការថែទាំសម្រាប់៖');
    expect(service.t('risk.lowConcern')).toBe('ការបារម្ភកម្រិតទាប');

    service.setLanguage('en');
    expect(service.t('nav.home')).toBe('Home');
    expect(service.t('nav.screening')).toBe('Screening');
    expect(service.t('child.viewingCareFor')).toBe('Viewing care for:');
    expect(service.t('risk.lowConcern')).toBe('Low Concern');
  });

  it('interpolates parameters correctly with {{key}} format', () => {
    service.setLanguage('en');
    const interpolated = service.t('child.yearsOld');
    expect(interpolated).toBe('years old');
  });

  it('returns translation path as fallback for unknown keys', () => {
    expect(service.t('unknown.nonexistent.key')).toBe('unknown.nonexistent.key');
  });
});
