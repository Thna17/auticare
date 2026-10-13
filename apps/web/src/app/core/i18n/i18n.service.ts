import { inject, Injectable, signal } from '@angular/core';
import { PreferencesService } from '../preferences/preferences.service';
import { DICTIONARY, type SupportedLanguage, type TranslationDictionary } from './i18n.dictionary';

export const LANG_STORAGE_KEY = 'auticare_lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly preferencesService = inject(PreferencesService, { optional: true });

  readonly currentLang = signal<SupportedLanguage>(this.getInitialLanguage());

  constructor() {
    this.syncRootLang(this.currentLang());
  }

  private getInitialLanguage(): SupportedLanguage {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(LANG_STORAGE_KEY);
        if (stored === 'km' || stored === 'en') {
          return stored;
        }
      } catch {
        // Ignore localStorage read errors in restricted environments
      }
    }
    // Default to Khmer ('km') for Cambodian platform
    return 'km';
  }

  setLanguage(lang: SupportedLanguage): void {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // Ignore localStorage write failures
      }
    }
    this.syncRootLang(lang);
    if (typeof this.preferencesService?.updatePreferredLanguage === 'function') {
      this.preferencesService.updatePreferredLanguage(lang);
    }
  }

  toggleLanguage(): void {
    const nextLang: SupportedLanguage = this.currentLang() === 'km' ? 'en' : 'km';
    this.setLanguage(nextLang);
  }

  private syncRootLang(lang: SupportedLanguage): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.classList.toggle('lang-km', lang === 'km');
      document.documentElement.classList.toggle('lang-en', lang === 'en');
    }
  }

  /**
   * Type-safe nested key translation accessor helper:
   * e.g., t('nav.home') or t('child.yearsOld')
   */
  t(path: string, params?: Record<string, string | number>): string {
    const lang = this.currentLang();
    const dict = DICTIONARY[lang] as unknown as Record<string, unknown>;
    const keys = path.split('.');
    let current: unknown = dict;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // Fallback to English if missing in current locale
        const fallbackDict = DICTIONARY.en as unknown as Record<string, unknown>;
        let fallbackVal: unknown = fallbackDict;
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbKey in fallbackVal) {
            fallbackVal = (fallbackVal as Record<string, unknown>)[fbKey];
          } else {
            fallbackVal = null;
            break;
          }
        }
        if (typeof fallbackVal === 'string') {
          current = fallbackVal;
          break;
        }
        return path;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replaceAll(`{{${pKey}}}`, String(pVal));
      }
    }
    return result;
  }

  get dictionary(): TranslationDictionary {
    return DICTIONARY[this.currentLang()];
  }
}
