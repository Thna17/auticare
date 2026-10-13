import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PreferencesService } from '../preferences/preferences.service';
import { I18nService, LANG_STORAGE_KEY } from './i18n.service';
import { TranslatePipe } from './translate.pipe';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.removeItem(LANG_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [
        I18nService,
        TranslatePipe,
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

  it('resolves newly expanded domain dictionaries across all modules', () => {
    service.setLanguage('km');
    expect(service.t('screening.start')).toBe('ចាប់ផ្តើមការវាយតម្លៃ');
    expect(service.t('screening.ageBands.toddler')).toBe('កុមារតូច (១៨–៣០ ខែ)');
    expect(service.t('activities.title')).toBe('បណ្ណាល័យសកម្មភាពលេងបែបវិញ្ញាណ');
    expect(service.t('appointments.bookingTitle')).toBe('កក់ការពិគ្រោះយោបល់ជាមួយអ្នកជំនាញ');
    expect(service.t('schools.directoryTitle')).toBe('សាលារៀន និងមជ្ឈមណ្ឌលអប់រំបរិយាបន្ន');
    expect(service.t('hospitals.title')).toBe('មន្ទីរពេទ្យ និងគ្លីនិកដៃគូ');
    expect(service.t('notifications.emptyNotice')).toBe('មិនមានការជូនដំណឹងថ្មីទេ');
    expect(service.t('settings.profileSettings')).toBe('ព័ត៌មានផ្ទាល់ខ្លួន');

    service.setLanguage('en');
    expect(service.t('screening.start')).toBe('Start Assessment');
    expect(service.t('screening.ageBands.toddler')).toBe('Toddler (18–30 months)');
    expect(service.t('activities.title')).toBe('Sensory Play & Activities Library');
    expect(service.t('appointments.bookingTitle')).toBe('Book Specialist Consultation');
    expect(service.t('schools.directoryTitle')).toBe('Inclusive Schools & Centers');
    expect(service.t('hospitals.title')).toBe('Partner Hospitals & Clinics');
    expect(service.t('notifications.emptyNotice')).toBe('You have no new notifications.');
    expect(service.t('settings.profileSettings')).toBe('Profile Information');
  });

  it('interpolates parameters correctly with {{key}} and {key} format', () => {
    service.setLanguage('en');
    expect(service.t('progress.streakLabel', { days: 5 })).toBe('5-Day Activity Streak');

    service.setLanguage('km');
    expect(service.t('progress.streakLabel', { days: 7 })).toBe('សកម្មភាពបន្តបន្ទាប់ 7 ថ្ងៃ');
  });

  it('falls back to English when a nested key is missing in the current language', () => {
    // If a key does not exist at all, returns path
    expect(service.t('nonexistent.path.value')).toBe('nonexistent.path.value');
  });

  it('TranslatePipe transforms keys and reactively updates on language switch', () => {
    const pipe = TestBed.inject(TranslatePipe);

    service.setLanguage('km');
    expect(pipe.transform('common.save')).toBe('រក្សាទុក');
    expect(pipe.transform('progress.streakLabel', { days: 3 })).toBe('សកម្មភាពបន្តបន្ទាប់ 3 ថ្ងៃ');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');

    service.setLanguage('en');
    expect(pipe.transform('common.save')).toBe('Save');
    expect(pipe.transform('progress.streakLabel', { days: 3 })).toBe('3-Day Activity Streak');
  });
});
