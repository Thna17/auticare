import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { UserRole } from '@auticare/contracts';
import { AuthService } from '../auth/auth.service';
import { NotificationsStateService } from '../notifications/notifications-state.service';
import { PreferencesService } from '../preferences/preferences.service';
import { I18nService, LANG_STORAGE_KEY } from '../i18n/i18n.service';
import { AppShellComponent } from './app-shell.component';
import { SchoolStaffState } from '../../features/schools/data-access/school-staff.state';
import { SchoolRegistrationsService } from '../../features/admin/data-access/school-registrations.service';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let router: Router;

  const mockParentSignal = signal<{
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    email: string;
    phoneNumber: string | null;
    socialMediaAccount: string | null;
  } | null>({
    id: 'user_1',
    firstName: 'Sarah',
    lastName: 'Connor',
    role: 'PARENT',
    email: 'sarah@example.com',
    phoneNumber: null,
    socialMediaAccount: null,
  });

  const mockAuthService = {
    parent: mockParentSignal,
    logout: vi.fn(() => of(undefined)),
  };

  const mockUnreadSignal = signal(0);
  const mockNotificationsState = {
    unreadCount: mockUnreadSignal,
  };

  // Whether the signed-in school account is the school's admin.
  const mockSchoolAdminSignal = signal(false);
  const mockSchoolStaffState = { isSchoolAdmin: mockSchoolAdminSignal };

  const mockHighContrastSignal = signal(false);
  const mockCalmingPaletteSignal = signal(false);
  const mockReducedMotionSignal = signal(false);
  const mockPreferencesService = {
    highContrast: mockHighContrastSignal,
    calmingPalette: mockCalmingPaletteSignal,
    reducedMotion: mockReducedMotionSignal,
    updatePreferredLanguage: vi.fn(),
  };

  const mockPendingCountSignal = signal(0);
  const mockSchoolRegistrationsService = {
    pendingCount: mockPendingCountSignal,
    fetchPendingCount: vi.fn(() => of(mockPendingCountSignal())),
  };

  beforeEach(async () => {
    mockParentSignal.set({
      id: 'user_1',
      firstName: 'Sarah',
      lastName: 'Connor',
      role: 'PARENT',
      email: 'sarah@example.com',
      phoneNumber: null,
      socialMediaAccount: null,
    });
    mockUnreadSignal.set(0);
    mockSchoolAdminSignal.set(false);
    mockHighContrastSignal.set(false);
    mockCalmingPaletteSignal.set(false);
    mockReducedMotionSignal.set(false);
    mockPendingCountSignal.set(0);
    localStorage.removeItem(LANG_STORAGE_KEY);
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        I18nService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationsStateService, useValue: mockNotificationsState },
        { provide: PreferencesService, useValue: mockPreferencesService },
        { provide: SchoolStaffState, useValue: mockSchoolStaffState },
        { provide: SchoolRegistrationsService, useValue: mockSchoolRegistrationsService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
  });

  it('renders skip link and main content container with router outlet', () => {
    const el = fixture.nativeElement as HTMLElement;
    const skipLink = el.querySelector('.skip');
    expect(skipLink).toBeTruthy();
    expect(skipLink?.getAttribute('href')).toBe('#main');
    expect(skipLink?.textContent?.trim()).toBe('រំលងទៅមាតិកាចម្បង');

    const contentContainer = el.querySelector('.content-container');
    expect(contentContainer).toBeTruthy();
    expect(contentContainer?.querySelector('router-outlet')).toBeTruthy();
  });

  it('renders parent navigation in Khmer by default and switches cleanly to English upon toggle', () => {
    const el = fixture.nativeElement as HTMLElement;
    const i18n = TestBed.inject(I18nService);

    // Default: Khmer mode ('km')
    const kmSectionTitles = Array.from(el.querySelectorAll('.nav-section-title')).map((node) =>
      node.textContent?.trim(),
    );
    // The parent app is organised by intent after the update: five areas, the
    // existing screens regrouped underneath them.
    expect(kmSectionTitles).toEqual([
      'ផ្ទាំងគ្រប់គ្រង',
      'ជំនួយការ AI',
      'ឯកសារ',
      'ព័ត៌មានផ្ទាល់ខ្លួន',
      'ការកំណត់',
    ]);

    const kmNavLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(kmNavLinks).toContain('ទំព័រដើម');
    expect(kmNavLinks).toContain('ការសង្កេត');
    expect(kmNavLinks).toContain('ជំនួយការ AI');
    expect(kmNavLinks).toContain('កុមាររបស់ខ្ញុំ');
    expect(kmNavLinks).toContain('ការវាយតម្លៃ');
    expect(kmNavLinks).toContain('សកម្មភាពលេង');
    expect(kmNavLinks).toContain('ការវិវត្ត');
    expect(kmNavLinks).toContain('ការណាត់ជួប');
    expect(kmNavLinks).toContain('សាលារៀន');
    expect(kmNavLinks).toContain('មន្ទីរពេទ្យ');
    expect(kmNavLinks).toContain('ការជូនដំណឹង');
    expect(kmNavLinks).toContain('ការកំណត់');
    expect(kmNavLinks).not.toContain('ជំនួយបន្ទាន់');
    expect(kmNavLinks).not.toContain('មជ្ឈមណ្ឌលជំនួយ');

    const kmPrimaryAction = el.querySelector('.sidebar .role-action');
    expect(kmPrimaryAction?.textContent?.trim()).toContain('សួរ AutiCare');
    expect(
      kmPrimaryAction?.getAttribute('href') ?? kmPrimaryAction?.getAttribute('routerLink'),
    ).toBe('/ai');

    // Switch to English ('en')
    i18n.toggleLanguage();
    fixture.detectChanges();

    const enSectionTitles = Array.from(el.querySelectorAll('.nav-section-title')).map((node) =>
      node.textContent?.trim(),
    );
    expect(enSectionTitles).toEqual([
      'Dashboard',
      'AI Assistant',
      'Documents',
      'Profile',
      'Settings',
    ]);

    const enNavLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(enNavLinks).toContain('Overview');
    expect(enNavLinks).toContain('Observations');
    expect(enNavLinks).toContain('AI Assistant');
    expect(enNavLinks).toContain('My Children');
    expect(enNavLinks).toContain('My schools');
    expect(enNavLinks).toContain('Screening');
    expect(enNavLinks).toContain('Activities');
    expect(enNavLinks).toContain('Progress');
    expect(enNavLinks).toContain('Appointments');
    expect(enNavLinks).toContain('Schools');
    expect(enNavLinks).toContain('Hospitals');
    expect(enNavLinks).toContain('Notifications');
    // Settings is a single entry; Help Center and crisis support live in the
    // account menu and the sidebar footer instead.
    expect(enNavLinks).toContain('Settings');
    expect(enNavLinks).not.toContain('Help Center');
    expect(enNavLinks).not.toContain('Crisis Support');

    const enPrimaryAction = el.querySelector('.sidebar .role-action');
    expect(enPrimaryAction?.textContent?.trim()).toContain('Ask AutiCare');
  });

  it('renders school staff navigation items and appropriate portal title for SCHOOL role in both languages', () => {
    mockParentSignal.set({
      id: 'staff_1',
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'SCHOOL',
      email: 'emily@school.org',
      phoneNumber: null,
      socialMediaAccount: null,
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const portalBadge = el.querySelector('.topbar-portal-badge');
    expect(portalBadge?.textContent?.trim()).toBe('AutiCare - ផតថលអប់រំ');

    const kmNavLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(kmNavLinks).toContain('ទំព័រដើម');
    expect(kmNavLinks).toContain('សិស្សានុសិស្ស');
    expect(kmNavLinks).toContain('របាយការណ៍');
    expect(kmNavLinks).toContain('ព័ត៌មានសាលារៀន');

    const kmPrimaryAction = el.querySelector('.sidebar .role-action');
    expect(kmPrimaryAction?.textContent?.trim()).toContain('បន្ថែមសកម្មភាព');

    // Toggle to English
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture.detectChanges();

    expect(portalBadge?.textContent?.trim()).toBe('AutiCare Education Portal');
    const enNavLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(enNavLinks).toContain('Overview');
    expect(enNavLinks).toContain('Students');
    expect(enNavLinks).toContain('Reports');
    expect(enNavLinks).toContain('School Profile');
    expect(kmPrimaryAction?.textContent?.trim()).toContain('Add Activity');

    // A teacher does not see the admin's team and family-code links…
    expect(enNavLinks).not.toContain('Team');
    expect(enNavLinks).not.toContain('Family codes');

    // …the school admin does.
    mockSchoolAdminSignal.set(true);
    fixture.detectChanges();
    const adminLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(adminLinks).toContain('Team');
    expect(adminLinks).toContain('Family codes');
  });

  it('renders hospital navigation items and brand link for HOSPITAL role in both languages', () => {
    mockParentSignal.set({
      id: 'doc_1',
      firstName: 'Robert',
      lastName: 'Chen',
      role: 'HOSPITAL',
      email: 'robert@hospital.org',
      phoneNumber: null,
      socialMediaAccount: null,
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const portalBadge = el.querySelector('.topbar-portal-badge');
    expect(portalBadge?.textContent?.trim()).toBe('AutiCare - ការថែទាំព្យាបាល');

    const brand = el.querySelector('.sidebar .brand');
    expect(brand?.getAttribute('href') ?? brand?.getAttribute('routerLink')).toBe(
      '/hospital/dashboard',
    );

    const kmNavLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(kmNavLinks).toContain('ទំព័រដើម');
    expect(kmNavLinks).toContain('ការណាត់ជួប');
    expect(kmNavLinks).toContain('វេជ្ជបណ្ឌិត');
    expect(kmNavLinks).toContain('ព័ត៌មានមន្ទីរពេទ្យ');

    const kmPrimaryAction = el.querySelector('.sidebar .role-action');
    expect(kmPrimaryAction?.textContent?.trim()).toContain('គ្រប់គ្រងការណាត់ជួប');

    // Toggle to English
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture.detectChanges();

    expect(portalBadge?.textContent?.trim()).toBe('AutiCare Clinical Care');
    const enNavLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(enNavLinks).toContain('Overview');
    expect(enNavLinks).toContain('Appointments');
    expect(enNavLinks).toContain('Doctors');
    expect(enNavLinks).toContain('Hospital Profile');
    expect(kmPrimaryAction?.textContent?.trim()).toContain('Manage Appointments');
  });

  it('renders platform governance items for ADMIN role in both languages', () => {
    mockParentSignal.set({
      id: 'admin_1',
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      email: 'admin@auticare.org',
      phoneNumber: null,
      socialMediaAccount: null,
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const portalBadge = el.querySelector('.topbar-portal-badge');
    expect(portalBadge?.textContent?.trim()).toBe('AutiCare - ការគ្រប់គ្រងប្រព័ន្ធ');

    const kmNavLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(kmNavLinks).toContain('កំណត់ត្រាគ្រួសារ');
    expect(kmNavLinks).toContain('សាលារៀន');
    expect(kmNavLinks).toContain('មន្ទីរពេទ្យ');
    expect(kmNavLinks).toContain('របាយការណ៍សាលា');

    const kmPrimaryAction = el.querySelector('.sidebar .role-action');
    expect(kmPrimaryAction?.textContent?.trim()).toContain('បង្កើតគណនីសាលា');

    // Toggle to English
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture.detectChanges();

    expect(portalBadge?.textContent?.trim()).toBe('AutiCare Administration');
    const enNavLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );
    expect(enNavLinks).toContain('Family Records');
    expect(enNavLinks).toContain('Schools');
    expect(enNavLinks).toContain('Hospitals');
    expect(enNavLinks).toContain('School Reports');
    expect(kmPrimaryAction?.textContent?.trim()).toContain('Create School Account');
  });

  it('toggles sidebar collapsed state when clicking the collapse button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const sidebar = el.querySelector('.sidebar');
    const shell = el.querySelector('.shell');
    const collapseBtn = el.querySelector('.collapse-btn') as HTMLButtonElement;

    expect(sidebar?.classList.contains('collapsed')).toBe(false);
    expect(shell?.classList.contains('sidebar-collapsed')).toBe(false);

    collapseBtn.click();
    fixture.detectChanges();

    expect(sidebar?.classList.contains('collapsed')).toBe(true);
    expect(shell?.classList.contains('sidebar-collapsed')).toBe(true);

    collapseBtn.click();
    fixture.detectChanges();

    expect(sidebar?.classList.contains('collapsed')).toBe(false);
    expect(shell?.classList.contains('sidebar-collapsed')).toBe(false);
  });

  it('toggles sidebar on Ctrl+B / Cmd+B keyboard shortcut', () => {
    const el = fixture.nativeElement as HTMLElement;
    const sidebar = el.querySelector('.sidebar');

    expect(sidebar?.classList.contains('collapsed')).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
    fixture.detectChanges();

    expect(sidebar?.classList.contains('collapsed')).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true }));
    fixture.detectChanges();

    expect(sidebar?.classList.contains('collapsed')).toBe(false);
  });

  it('opens and closes profile dropdown menu and closes on Escape in both languages', () => {
    const el = fixture.nativeElement as HTMLElement;
    const profileChip = el.querySelector('.profile-chip') as HTMLButtonElement;

    expect(el.querySelector('.popover-menu')).toBeNull();

    profileChip.click();
    fixture.detectChanges();

    let menu = el.querySelector('.popover-menu');
    expect(menu).toBeTruthy();
    expect(menu?.textContent).toContain('Sarah Connor');
    expect(menu?.textContent).toContain('ការកំណត់គណនី');
    expect(menu?.textContent).toContain('មជ្ឈមណ្ឌលជំនួយ');
    expect(menu?.textContent).toContain('ចាកចេញ');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(el.querySelector('.popover-menu')).toBeNull();

    // Toggle to English and open
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture.detectChanges();

    profileChip.click();
    fixture.detectChanges();
    menu = el.querySelector('.popover-menu');
    expect(menu).toBeTruthy();
    expect(menu?.textContent).toContain('Account Settings');
    expect(menu?.textContent).toContain('Help Center');
    expect(menu?.textContent).toContain('Sign out');
  });

  it('handles logout from popover and sidebar', () => {
    const el = fixture.nativeElement as HTMLElement;
    const sidebarLogout = el.querySelector('.sidebar .logout-button') as HTMLButtonElement;

    sidebarLogout.click();
    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('renders unread notification ping indicator badge when unreadCount > 0', () => {
    mockUnreadSignal.set(3);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const topbarPing = el.querySelector('.topbar-ping');
    expect(topbarPing).toBeTruthy();
    expect(topbarPing?.textContent).toContain('3');

    const sidebarBadge = el.querySelector('.sidebar .badge');
    expect(sidebarBadge).toBeTruthy();
    expect(sidebarBadge?.textContent?.trim()).toBe('3');
  });

  it('omits ping badge when unreadCount is 0', () => {
    mockUnreadSignal.set(0);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.topbar-ping')).toBeNull();
  });

  it('renders mobile navigation links and role-specific mobile action button in both languages', () => {
    const el = fixture.nativeElement as HTMLElement;
    const kmMobileLinks = Array.from(el.querySelectorAll('.mobile-nav a:not(.mobile-action)')).map(
      (node) => node.querySelector('.mobile-label')?.textContent?.trim(),
    );

    expect(kmMobileLinks).toEqual(['ទំព័រដើម', 'ជំនួយការ AI', 'ឯកសារ', 'ព័ត៌មានផ្ទាល់ខ្លួន']);

    const mobileAction = el.querySelector('.mobile-action') as HTMLAnchorElement;
    expect(mobileAction).toBeTruthy();
    expect(mobileAction.getAttribute('href') ?? mobileAction.getAttribute('routerLink')).toBe(
      '/screening',
    );

    // English mode
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture.detectChanges();

    const enMobileLinks = Array.from(el.querySelectorAll('.mobile-nav a:not(.mobile-action)')).map(
      (node) => node.querySelector('.mobile-label')?.textContent?.trim(),
    );
    expect(enMobileLinks).toEqual(['Overview', 'AI Assistant', 'Documents', 'Profile']);
  });

  it('opens and closes mobile navigation drawer via toggle, close button, scrim, and Escape', () => {
    const component = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.mobile-drawer')).toBeNull();

    component.openMobileDrawer();
    fixture.detectChanges();
    expect(el.querySelector('.mobile-drawer')).toBeTruthy();
    expect(el.querySelector('.mobile-drawer-scrim')).toBeTruthy();

    const closeBtn = el.querySelector('.drawer-close-btn') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();
    expect(el.querySelector('.mobile-drawer')).toBeNull();

    component.toggleMobileDrawer();
    fixture.detectChanges();
    expect(el.querySelector('.mobile-drawer')).toBeTruthy();

    const scrim = el.querySelector('.mobile-drawer-scrim') as HTMLElement;
    scrim.click();
    fixture.detectChanges();
    expect(el.querySelector('.mobile-drawer')).toBeNull();

    component.openMobileDrawer();
    fixture.detectChanges();
    expect(el.querySelector('.mobile-drawer')).toBeTruthy();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('.mobile-drawer')).toBeNull();
  });

  it('renders global sensory mode indicator pill when sensory mode is active in both languages', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.sensory-mode-pill')).toBeNull();

    mockCalmingPaletteSignal.set(true);
    fixture.detectChanges();
    let calmPill = el.querySelector('.sensory-mode-pill');
    expect(calmPill).toBeTruthy();
    expect(calmPill?.textContent).toContain('កាត់បន្ថយការភ្ញោច');

    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture.detectChanges();
    calmPill = el.querySelector('.sensory-mode-pill');
    expect(calmPill?.textContent).toContain('Calm Sensory');

    mockCalmingPaletteSignal.set(false);
    mockHighContrastSignal.set(true);
    fixture.detectChanges();
    const hcPill = el.querySelector('.sensory-mode-pill');
    expect(hcPill).toBeTruthy();
    expect(hcPill?.textContent).toContain('High Contrast');

    mockHighContrastSignal.set(false);
    mockReducedMotionSignal.set(true);
    fixture.detectChanges();
    const rmPill = el.querySelector('.sensory-mode-pill');
    expect(rmPill).toBeTruthy();
    expect(rmPill?.textContent).toContain('Reduced Motion');
  });

  it('renders crisis shortcut in sidebar footer in both languages', () => {
    const el = fixture.nativeElement as HTMLElement;
    const crisisLink = el.querySelector('.sidebar-footer .crisis-shortcut') as HTMLAnchorElement;
    expect(crisisLink).toBeTruthy();
    expect(crisisLink.getAttribute('href') ?? crisisLink.getAttribute('routerLink')).toBe(
      '/crisis',
    );
    expect(crisisLink.textContent).toContain('ជំនួយបន្ទាន់ និងការថែទាំ');

    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(crisisLink.textContent).toContain('Crisis & Urgent Care');
  });

  it('renders accessible language toggle pill in topbar and toggles between Khmer and English', () => {
    const el = fixture.nativeElement as HTMLElement;
    const toggleBtn = el.querySelector('.topbar-lang-toggle') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();
    expect(toggleBtn.textContent).toContain('ភាសាខ្មែរ');
    expect(toggleBtn.getAttribute('aria-label')).toBe('ប្តូរទៅភាសាអង់គ្លេស');

    toggleBtn.click();
    fixture.detectChanges();

    const updatedToggleBtn = el.querySelector('.topbar-lang-toggle') as HTMLButtonElement;
    expect(updatedToggleBtn.textContent).toContain('English');
    expect(updatedToggleBtn.getAttribute('aria-label')).toBe('Switch language to Khmer');
  });

  it('renders School requests nav item with badge for ADMIN role', () => {
    mockParentSignal.set({
      id: 'admin_1',
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      email: 'admin@auticare.test',
      phoneNumber: null,
      socialMediaAccount: null,
    });
    mockPendingCountSignal.set(3);
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('.sidebar .nav-link'));
    const schoolReqLink = links.find(
      (l) =>
        (l.getAttribute('href') ?? l.getAttribute('routerLink')) === '/admin/school-registrations',
    );
    expect(schoolReqLink).toBeTruthy();
    expect(schoolReqLink?.textContent).toContain('School requests');
    expect(schoolReqLink?.querySelector('.badge')?.textContent?.trim()).toBe('3');
  });
});
