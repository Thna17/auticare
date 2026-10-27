import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../core/config/api.config';
import { AuthService } from '../../core/auth/auth.service';
import type { FontSizeScale } from '../../core/preferences/preferences.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let component: SettingsPage;
  let i18nService: I18nService;
  let mockAuthService: {
    parent: ReturnType<typeof signal>;
    loadCurrentUser: ReturnType<typeof vi.fn>;
    updateMyProfile: ReturnType<typeof vi.fn>;
    changePassword: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let mockPreferencesService: {
    reducedMotion: ReturnType<typeof signal<boolean>>;
    highContrast: ReturnType<typeof signal<boolean>>;
    preferredLanguage: ReturnType<typeof signal<string>>;
    fontSize: ReturnType<typeof signal<FontSizeScale>>;
    calmingPalette: ReturnType<typeof signal<boolean>>;
    appointmentAlerts: ReturnType<typeof signal<boolean>>;
    schoolReports: ReturnType<typeof signal<boolean>>;
    systemAnnouncements: ReturnType<typeof signal<boolean>>;
    loadPreferences: ReturnType<typeof vi.fn>;
    updatePreferences: ReturnType<typeof vi.fn>;
    applyToRoot: ReturnType<typeof vi.fn>;
    applySensorySuite: ReturnType<typeof vi.fn>;
    updateSensoryPreferences: ReturnType<typeof vi.fn>;
    updateNotificationPreferences: ReturnType<typeof vi.fn>;
  };

  const sampleParent = {
    id: 'parent_1',
    email: 'parent@auticare.test',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'PARENT' as const,
    mustResetPassword: false,
    phoneNumber: '+1 555 123 4567',
    socialMediaAccount: '@janedoe',
  };

  beforeEach(async () => {
    mockAuthService = {
      parent: signal(sampleParent),
      loadCurrentUser: vi.fn().mockReturnValue(of(true)),
      updateMyProfile: vi.fn().mockReturnValue(of(sampleParent)),
      changePassword: vi.fn().mockReturnValue(of({ message: 'Password changed successfully.' })),
      logout: vi.fn(),
    };

    mockPreferencesService = {
      reducedMotion: signal(false),
      highContrast: signal(false),
      preferredLanguage: signal('en'),
      fontSize: signal<FontSizeScale>('normal'),
      calmingPalette: signal(false),
      appointmentAlerts: signal(true),
      schoolReports: signal(true),
      systemAnnouncements: signal(true),
      loadPreferences: vi.fn().mockReturnValue(
        of({
          preference: {
            reducedMotion: false,
            highContrast: false,
            preferredLanguage: 'en',
          },
        }),
      ),
      updatePreferences: vi.fn().mockReturnValue(
        of({
          preference: {
            reducedMotion: true,
            highContrast: true,
            preferredLanguage: 'vi',
          },
        }),
      ),
      applyToRoot: vi.fn(),
      applySensorySuite: vi.fn(),
      updateSensoryPreferences: vi.fn(),
      updateNotificationPreferences: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PreferencesService, useValue: mockPreferencesService },
      ],
    }).compileComponents();

    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('en');

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders initial account details and displayName', () => {
    expect(component.displayName()).toBe('Jane Doe');
    expect(component.initials()).toBe('JD');
  });

  describe('Role-adaptive profile rendering', () => {
    it('renders PARENT profile eyebrow, CTA, and sidebar', () => {
      mockAuthService.parent.set(sampleParent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.eyebrow')?.textContent?.trim()).toBe('Parent profile');

      const heroCta = el.querySelector('.profile-hero .primary-link');
      expect(heroCta?.textContent?.trim()).toBe('Manage child profiles');
      expect(heroCta?.getAttribute('href') || heroCta?.getAttribute('ng-reflect-router-link')).toBe(
        '/children',
      );

      expect(el.querySelector('.side-panel h2')?.textContent?.trim()).toBe('Care workspace');
      expect(el.querySelector('.side-panel .support-row strong')?.textContent?.trim()).toBe(
        'Review child profiles',
      );
      expect(el.querySelector('.calm-note h3')?.textContent?.trim()).toBe('Child support tip');
    });

    it('renders SCHOOL staff profile eyebrow, CTA, and sidebar', () => {
      mockAuthService.parent.set({ ...sampleParent, role: 'SCHOOL' as const });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.eyebrow')?.textContent?.trim()).toBe('School staff profile');

      const heroCta = el.querySelector('.profile-hero .primary-link');
      expect(heroCta?.textContent?.trim()).toBe('Manage school profile');
      expect(heroCta?.getAttribute('href') || heroCta?.getAttribute('ng-reflect-router-link')).toBe(
        '/schools/profile',
      );

      expect(el.querySelector('.side-panel h2')?.textContent?.trim()).toBe('School workspace');
      expect(el.querySelector('.side-panel .support-row strong')?.textContent?.trim()).toBe(
        'Student enrollments',
      );
      expect(el.querySelector('.calm-note h3')?.textContent?.trim()).toBe(
        'Classroom observation tip',
      );
    });

    it('renders HOSPITAL coordinator profile eyebrow, CTA, and sidebar', () => {
      mockAuthService.parent.set({ ...sampleParent, role: 'HOSPITAL' as const });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.eyebrow')?.textContent?.trim()).toBe(
        'Hospital coordinator profile',
      );

      const heroCta = el.querySelector('.profile-hero .primary-link');
      expect(heroCta?.textContent?.trim()).toBe('Manage hospital profile');
      expect(heroCta?.getAttribute('href') || heroCta?.getAttribute('ng-reflect-router-link')).toBe(
        '/hospital/profile',
      );

      expect(el.querySelector('.side-panel h2')?.textContent?.trim()).toBe('Hospital workspace');
      expect(el.querySelector('.side-panel .support-row strong')?.textContent?.trim()).toBe(
        'Specialist team',
      );
      expect(el.querySelector('.calm-note h3')?.textContent?.trim()).toBe(
        'Specialist coordination tip',
      );
    });

    it('renders ADMIN system administrator profile eyebrow, CTA, and sidebar', () => {
      mockAuthService.parent.set({ ...sampleParent, role: 'ADMIN' as const });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.eyebrow')?.textContent?.trim()).toBe(
        'System administrator profile',
      );

      const heroCta = el.querySelector('.profile-hero .primary-link');
      expect(heroCta?.textContent?.trim()).toBe('Manage institutions');
      expect(heroCta?.getAttribute('href') || heroCta?.getAttribute('ng-reflect-router-link')).toBe(
        '/schools/admin',
      );

      expect(el.querySelector('.side-panel h2')?.textContent?.trim()).toBe(
        'Platform administration',
      );
      expect(el.querySelector('.side-panel .support-row strong')?.textContent?.trim()).toBe(
        'Hospital network',
      );
      expect(el.querySelector('.calm-note h3')?.textContent?.trim()).toBe(
        'Platform governance note',
      );
    });
  });

  describe('Change password panel', () => {
    it('validates password fields and rejects mismatched confirmation', () => {
      component['passwordForm'].controls.currentPassword.setValue('OldPassword123!');
      component['passwordForm'].controls.newPassword.setValue('NewPassword123!');
      component['passwordForm'].controls.confirmPassword.setValue('DifferentPassword123!');
      component['passwordForm'].controls.confirmPassword.markAsTouched();

      expect(component['passwordForm'].valid).toBe(false);
      expect(component['showPasswordError']('confirmPassword')).toBe(true);
      expect(component['getPasswordError']('confirmPassword')).toBe('Passwords do not match.');
    });

    it('requires at least 12 characters for new password', () => {
      component['passwordForm'].controls.currentPassword.setValue('OldPassword123!');
      component['passwordForm'].controls.newPassword.setValue('short');
      component['passwordForm'].controls.confirmPassword.setValue('short');
      component['passwordForm'].controls.newPassword.markAsTouched();

      expect(component['passwordForm'].valid).toBe(false);
      expect(component['showPasswordError']('newPassword')).toBe(true);
      expect(component['getPasswordError']('newPassword')).toBe(
        'New password must be at least 12 characters.',
      );
    });

    it('toggles password visibility states', () => {
      expect(component['showCurrentPass']()).toBe(false);
      expect(component['showNewPass']()).toBe(false);
      expect(component['showConfirmPass']()).toBe(false);

      component['showCurrentPass'].set(true);
      component['showNewPass'].set(true);
      component['showConfirmPass'].set(true);

      expect(component['showCurrentPass']()).toBe(true);
      expect(component['showNewPass']()).toBe(true);
      expect(component['showConfirmPass']()).toBe(true);
    });

    it('submits valid password change and clears form on success', () => {
      component['passwordForm'].controls.currentPassword.setValue('OldValidPassword123!');
      component['passwordForm'].controls.newPassword.setValue('BrandNewValidPass123!');
      component['passwordForm'].controls.confirmPassword.setValue('BrandNewValidPass123!');

      expect(component['passwordForm'].valid).toBe(true);
      component['savePassword']();

      expect(mockAuthService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldValidPassword123!',
        newPassword: 'BrandNewValidPass123!',
      });
      expect(component['passwordSaved']()).toBe(true);
      expect(component['passwordError']()).toBeNull();
    });

    it('surfaces backend error message on password change failure', () => {
      mockAuthService.changePassword.mockReturnValue(
        throwError(() => ({ error: { error: { message: 'Current password does not match.' } } })),
      );

      component['passwordForm'].controls.currentPassword.setValue('WrongPassword123!');
      component['passwordForm'].controls.newPassword.setValue('BrandNewValidPass123!');
      component['passwordForm'].controls.confirmPassword.setValue('BrandNewValidPass123!');

      component['savePassword']();

      expect(component['passwordSaved']()).toBe(false);
      expect(component['passwordError']()).toBe('Current password does not match.');
    });

    it('returns Khmer validation error messages when language is km', () => {
      i18nService.setLanguage('km');
      component['passwordForm'].controls.currentPassword.setValue('');
      component['passwordForm'].controls.currentPassword.markAsTouched();
      expect(component['getPasswordError']('currentPassword')).toBe(
        'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន',
      );

      component['passwordForm'].controls.newPassword.setValue('short');
      component['passwordForm'].controls.newPassword.markAsTouched();
      expect(component['getPasswordError']('newPassword')).toBe(
        'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 12 តួអក្សរ',
      );

      component['passwordForm'].controls.newPassword.setValue('ValidPass123456!');
      component['passwordForm'].controls.confirmPassword.setValue('MismatchPass123!');
      component['passwordForm'].controls.confirmPassword.markAsTouched();
      expect(component['getPasswordError']('confirmPassword')).toBe('ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ');
    });
  });

  describe('Notification preferences panel', () => {
    it('initializes every notification switch on by default', () => {
      const value = component['notificationForm'].getRawValue();
      expect(Object.values(value).every(Boolean)).toBe(true);
      expect(Object.keys(value)).toEqual([
        'notifyQuestionnaire',
        'notifyActivities',
        'notifyReports',
        'notifySchool',
        'notifyAnnouncements',
      ]);
    });

    it('saves notification preferences to the server, not only this browser', () => {
      mockPreferencesService.updatePreferences.mockClear();
      component['notificationForm'].controls.notifyActivities.setValue(false);
      component['notificationForm'].controls.notifyAnnouncements.setValue(false);

      component['saveNotifications']();

      expect(mockPreferencesService.updatePreferences).toHaveBeenCalledWith({
        notifyQuestionnaire: true,
        notifyActivities: false,
        notifyReports: true,
        notifySchool: true,
        notifyAnnouncements: false,
      });
      expect(component['notificationSaved']()).toBe(true);
    });
  });

  describe('Accessibility preferences panel', () => {
    it('loads preferences on init and populates form', () => {
      expect(mockPreferencesService.loadPreferences).toHaveBeenCalled();
      expect(component['preferencesForm'].controls.reducedMotion.value).toBe(false);
      expect(component['preferencesForm'].controls.highContrast.value).toBe(false);
      expect(component['preferencesForm'].controls.preferredLanguage.value).toBe('en');
      expect(component['preferencesForm'].controls.fontSize.value).toBe('normal');
      expect(component['preferencesForm'].controls.calmingPalette.value).toBe(false);
    });

    it('applies live changes to root when preferences form changes', () => {
      component['preferencesForm'].controls.reducedMotion.setValue(true);
      expect(mockPreferencesService.applyToRoot).toHaveBeenCalledWith(true, false, 'en');

      component['preferencesForm'].controls.highContrast.setValue(true);
      expect(mockPreferencesService.applyToRoot).toHaveBeenCalledWith(true, true, 'en');
    });

    it('switches font size scaling and calming palette mode', () => {
      component.setFontSize('large');
      expect(component['preferencesForm'].controls.fontSize.value).toBe('large');
      expect(component.fontScaleLabel()).toBe('18px');

      component.setFontSize('xlarge');
      expect(component['preferencesForm'].controls.fontSize.value).toBe('xlarge');
      expect(component.fontScaleLabel()).toBe('20px');

      component['preferencesForm'].controls.calmingPalette.setValue(true);
      expect(component.paletteLabel()).toBe('Calming');
      expect(component.activeSensoryStatus()).toBe('Calming Palette');
    });

    it('submits updated accessibility preferences on save', () => {
      component['preferencesForm'].controls.reducedMotion.setValue(true);
      component['preferencesForm'].controls.highContrast.setValue(true);
      component['preferencesForm'].controls.preferredLanguage.setValue('vi');
      component.setFontSize('large');
      component['preferencesForm'].controls.calmingPalette.setValue(true);

      component['savePreferences']();

      expect(mockPreferencesService.updateSensoryPreferences).toHaveBeenCalledWith('large', true);
      expect(mockPreferencesService.updatePreferences).toHaveBeenCalledWith({
        reducedMotion: true,
        highContrast: true,
        preferredLanguage: 'vi',
      });
      expect(component['preferencesSaved']()).toBe(true);
      expect(component['preferencesError']()).toBeNull();
    });

    it('provides Khmer (km) as a primary language option', () => {
      const el = fixture.nativeElement as HTMLElement;
      const select = el.querySelector('.language-select') as HTMLSelectElement;
      expect(select).toBeTruthy();
      const options = Array.from(select.options).map((opt) => opt.value);
      expect(options).toContain('km');
      expect(options).toContain('en');
    });

    it('renders preferred language label and notification cards in Khmer mode', () => {
      i18nService.setLanguage('km');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('ភាសាដែលពេញចិត្ត');
      expect(el.textContent).toContain('ការរំលឹកកម្រងសំណួរ');
      expect(el.textContent).toContain('របាយការណ៍ និងសេចក្តីសង្ខេបថ្មី');
      expect(el.textContent).toContain('សេចក្តីប្រកាសពី AutiCare');
    });
  });

  describe('Danger zone and account deletion dialog', () => {
    it('opens account deletion dialog and confirms deletion via logout', () => {
      expect(component.showDeleteDialog()).toBe(false);
      component.showDeleteDialog.set(true);
      fixture.detectChanges();

      expect(component.showDeleteDialog()).toBe(true);
      component['confirmDeleteAccount']();
      expect(component.deletingAccount()).toBe(true);
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('translates account deletion dialog in Khmer mode', () => {
      i18nService.setLanguage('km');
      component.showDeleteDialog.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('លុបគណនីរបស់អ្នក?');
      expect(el.textContent).toContain('បោះបង់');
      expect(el.textContent).toContain('បញ្ជាក់ការលុបគណនី');
    });
  });
});
