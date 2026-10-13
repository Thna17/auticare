import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { catchError, map, of, tap } from 'rxjs';
import type {
  ParentPreferencesResponse,
  UpdateParentPreferencesRequest,
} from '@auticare/contracts';
import { API_BASE_URL } from '../config/api.config';

const STORAGE_KEY = 'auticare_accessibility_preferences';

export type FontSizeScale = 'normal' | 'large' | 'xlarge';

export type LocalPreferences = {
  reducedMotion: boolean;
  highContrast: boolean;
  preferredLanguage: string;
  fontSize?: FontSizeScale;
  calmingPalette?: boolean;
  appointmentAlerts?: boolean;
  schoolReports?: boolean;
  systemAnnouncements?: boolean;
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly reducedMotion = signal<boolean>(false);
  readonly highContrast = signal<boolean>(false);
  readonly preferredLanguage = signal<string>('en');
  readonly fontSize = signal<FontSizeScale>('normal');
  readonly calmingPalette = signal<boolean>(false);
  readonly appointmentAlerts = signal<boolean>(true);
  readonly schoolReports = signal<boolean>(true);
  readonly systemAnnouncements = signal<boolean>(true);

  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  constructor() {
    this.restoreLocalPreferences();
  }

  private restoreLocalPreferences(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: LocalPreferences = JSON.parse(stored);
        if (typeof parsed.reducedMotion === 'boolean') this.reducedMotion.set(parsed.reducedMotion);
        if (typeof parsed.highContrast === 'boolean') this.highContrast.set(parsed.highContrast);
        if (typeof parsed.preferredLanguage === 'string')
          this.preferredLanguage.set(parsed.preferredLanguage);
        if (
          parsed.fontSize === 'normal' ||
          parsed.fontSize === 'large' ||
          parsed.fontSize === 'xlarge'
        ) {
          this.fontSize.set(parsed.fontSize);
        }
        if (typeof parsed.calmingPalette === 'boolean') {
          this.calmingPalette.set(parsed.calmingPalette);
        }
        if (typeof parsed.appointmentAlerts === 'boolean') {
          this.appointmentAlerts.set(parsed.appointmentAlerts);
        }
        if (typeof parsed.schoolReports === 'boolean') {
          this.schoolReports.set(parsed.schoolReports);
        }
        if (typeof parsed.systemAnnouncements === 'boolean') {
          this.systemAnnouncements.set(parsed.systemAnnouncements);
        }
      } else {
        const prefersReducedMotion =
          window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
        if (prefersReducedMotion) this.reducedMotion.set(true);
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }

    this.applyToRoot(this.reducedMotion(), this.highContrast(), this.preferredLanguage());
    this.applySensorySuite(this.fontSize(), this.calmingPalette());
  }

  applyToRoot(reducedMotion: boolean, highContrast: boolean, lang?: string): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('reduced-motion', reducedMotion);
    root.classList.toggle('high-contrast', highContrast);
    if (lang) {
      root.setAttribute('lang', lang);
    }
  }

  applySensorySuite(fontSize: FontSizeScale = 'normal', calmingPalette: boolean = false): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('calming-palette', calmingPalette);

    root.classList.remove('font-scale-normal', 'font-scale-large', 'font-scale-xlarge');
    root.classList.add(`font-scale-${fontSize}`);

    if (fontSize === 'large') {
      root.style.fontSize = '18px';
    } else if (fontSize === 'xlarge') {
      root.style.fontSize = '20px';
    } else {
      root.style.fontSize = '16px';
    }
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: LocalPreferences = {
        reducedMotion: this.reducedMotion(),
        highContrast: this.highContrast(),
        preferredLanguage: this.preferredLanguage(),
        fontSize: this.fontSize(),
        calmingPalette: this.calmingPalette(),
        appointmentAlerts: this.appointmentAlerts(),
        schoolReports: this.schoolReports(),
        systemAnnouncements: this.systemAnnouncements(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore localStorage write failures
    }
  }

  updatePreferredLanguage(lang: string): void {
    this.preferredLanguage.set(lang);
    this.applyToRoot(this.reducedMotion(), this.highContrast(), lang);
    this.saveToLocalStorage();
  }

  updateSensoryPreferences(fontSize: FontSizeScale, calmingPalette: boolean): void {
    this.fontSize.set(fontSize);
    this.calmingPalette.set(calmingPalette);
    this.applySensorySuite(fontSize, calmingPalette);
    this.saveToLocalStorage();
  }

  updateNotificationPreferences(prefs: {
    appointmentAlerts: boolean;
    schoolReports: boolean;
    systemAnnouncements: boolean;
  }): void {
    this.appointmentAlerts.set(prefs.appointmentAlerts);
    this.schoolReports.set(prefs.schoolReports);
    this.systemAnnouncements.set(prefs.systemAnnouncements);
    this.saveToLocalStorage();
  }

  loadPreferences(): Observable<ParentPreferencesResponse> {
    this.loading.set(true);
    return this.http
      .get<{ data: ParentPreferencesResponse }>(`${this.apiBaseUrl}/parents/preferences`)
      .pipe(
        map((response) => response.data),
        tap((data) => {
          this.loading.set(false);
          if (data.preference) {
            this.reducedMotion.set(data.preference.reducedMotion);
            this.highContrast.set(data.preference.highContrast);
            this.preferredLanguage.set(data.preference.preferredLanguage);
            this.applyToRoot(
              data.preference.reducedMotion,
              data.preference.highContrast,
              data.preference.preferredLanguage,
            );
            this.saveToLocalStorage();
          }
        }),
        catchError(() => {
          this.loading.set(false);
          return of({
            preference: {
              reducedMotion: this.reducedMotion(),
              highContrast: this.highContrast(),
              preferredLanguage: this.preferredLanguage(),
            },
          });
        }),
      );
  }

  updatePreferences(input: UpdateParentPreferencesRequest): Observable<ParentPreferencesResponse> {
    this.saving.set(true);
    return this.http
      .patch<{ data: ParentPreferencesResponse }>(`${this.apiBaseUrl}/parents/preferences`, input)
      .pipe(
        map((response) => response.data),
        tap((data) => {
          this.saving.set(false);
          if (data.preference) {
            this.reducedMotion.set(data.preference.reducedMotion);
            this.highContrast.set(data.preference.highContrast);
            this.preferredLanguage.set(data.preference.preferredLanguage);
            this.applyToRoot(
              data.preference.reducedMotion,
              data.preference.highContrast,
              data.preference.preferredLanguage,
            );
            this.saveToLocalStorage();
          }
        }),
        catchError((err) => {
          this.saving.set(false);
          throw err;
        }),
      );
  }
}
