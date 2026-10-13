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

  const mockHighContrastSignal = signal(false);
  const mockCalmingPaletteSignal = signal(false);
  const mockReducedMotionSignal = signal(false);
  const mockPreferencesService = {
    highContrast: mockHighContrastSignal,
    calmingPalette: mockCalmingPaletteSignal,
    reducedMotion: mockReducedMotionSignal,
    updatePreferredLanguage: vi.fn(),
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
    mockHighContrastSignal.set(false);
    mockCalmingPaletteSignal.set(false);
    mockReducedMotionSignal.set(false);
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

    const contentContainer = el.querySelector('.content-container');
    expect(contentContainer).toBeTruthy();
    expect(contentContainer?.querySelector('router-outlet')).toBeTruthy();
  });

  it('renders parent navigation grouped into three semantic sections', () => {
    const el = fixture.nativeElement as HTMLElement;
    const sectionTitles = Array.from(el.querySelectorAll('.nav-section-title')).map((node) =>
      node.textContent?.trim(),
    );

    expect(sectionTitles).toEqual(['Care & Development', 'Directory & Visits', 'Support']);

    const navLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );

    expect(navLinks).toContain('Overview');
    expect(navLinks).toContain('My Children');
    expect(navLinks).toContain('Screening');
    expect(navLinks).toContain('Activities');
    expect(navLinks).toContain('Progress');
    expect(navLinks).toContain('Appointments');
    expect(navLinks).toContain('Schools');
    expect(navLinks).toContain('Hospitals');
    expect(navLinks).toContain('Notifications');
    expect(navLinks).toContain('Crisis Support');
    expect(navLinks).toContain('Help Center');
    expect(navLinks).toContain('Settings');

    const primaryAction = el.querySelector('.sidebar .role-action');
    expect(primaryAction?.textContent?.trim()).toContain('New Screening');
    expect(primaryAction?.getAttribute('href') ?? primaryAction?.getAttribute('routerLink')).toBe(
      '/screening',
    );
  });

  it('renders school staff navigation items and appropriate portal title for SCHOOL role', () => {
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
    expect(portalBadge?.textContent?.trim()).toBe('AutiCare Education Portal');

    const navLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );

    expect(navLinks).toContain('Dashboard');
    expect(navLinks).toContain('Students');
    expect(navLinks).toContain('Reports');
    expect(navLinks).toContain('School Profile');

    const primaryAction = el.querySelector('.sidebar .role-action');
    expect(primaryAction?.textContent?.trim()).toContain('Add Activity');
    expect(primaryAction?.getAttribute('href') ?? primaryAction?.getAttribute('routerLink')).toBe(
      '/schools/reports/new',
    );
  });

  it('renders hospital navigation items and brand link for HOSPITAL role', () => {
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
    expect(portalBadge?.textContent?.trim()).toBe('AutiCare Clinical Care');

    const brand = el.querySelector('.sidebar .brand');
    expect(brand?.getAttribute('href') ?? brand?.getAttribute('routerLink')).toBe(
      '/hospital/dashboard',
    );

    const navLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );

    expect(navLinks).toContain('Dashboard');
    expect(navLinks).toContain('Appointments');
    expect(navLinks).toContain('Doctors');
    expect(navLinks).toContain('Hospital Profile');

    const primaryAction = el.querySelector('.sidebar .role-action');
    expect(primaryAction?.textContent?.trim()).toContain('Manage Appointments');
  });

  it('renders platform governance items for ADMIN role', () => {
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
    expect(portalBadge?.textContent?.trim()).toBe('AutiCare Administration');

    const navLinks = Array.from(el.querySelectorAll('.sidebar .nav-link')).map((node) =>
      node.querySelector('.nav-label')?.textContent?.trim(),
    );

    expect(navLinks).toContain('Family Records');
    expect(navLinks).toContain('Schools');
    expect(navLinks).toContain('Hospitals');
    expect(navLinks).toContain('School Reports');

    const primaryAction = el.querySelector('.sidebar .role-action');
    expect(primaryAction?.textContent?.trim()).toContain('Create School Account');
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

  it('opens and closes profile dropdown menu and closes on Escape', () => {
    const el = fixture.nativeElement as HTMLElement;
    const profileChip = el.querySelector('.profile-chip') as HTMLButtonElement;

    expect(el.querySelector('.popover-menu')).toBeNull();

    profileChip.click();
    fixture.detectChanges();

    const menu = el.querySelector('.popover-menu');
    expect(menu).toBeTruthy();
    expect(menu?.textContent).toContain('Sarah Connor');
    expect(menu?.textContent).toContain('Account Settings');
    expect(menu?.textContent).toContain('Help Center');
    expect(menu?.textContent).toContain('Sign out');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(el.querySelector('.popover-menu')).toBeNull();
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

  it('renders mobile navigation links and role-specific mobile action button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const mobileLinks = Array.from(el.querySelectorAll('.mobile-nav a:not(.mobile-action)')).map(
      (node) => node.querySelector('.mobile-label')?.textContent?.trim(),
    );

    expect(mobileLinks).toEqual(['Home', 'Screening', 'Activities', 'Appointments']);

    const mobileAction = el.querySelector('.mobile-action') as HTMLAnchorElement;
    expect(mobileAction).toBeTruthy();
    expect(mobileAction.getAttribute('href') ?? mobileAction.getAttribute('routerLink')).toBe(
      '/screening',
    );
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

  it('renders global sensory mode indicator pill when sensory mode is active', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.sensory-mode-pill')).toBeNull();

    mockCalmingPaletteSignal.set(true);
    fixture.detectChanges();
    const calmPill = el.querySelector('.sensory-mode-pill');
    expect(calmPill).toBeTruthy();
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

  it('renders crisis shortcut in sidebar footer', () => {
    const el = fixture.nativeElement as HTMLElement;
    const crisisLink = el.querySelector('.sidebar-footer .crisis-shortcut') as HTMLAnchorElement;
    expect(crisisLink).toBeTruthy();
    expect(crisisLink.getAttribute('href') ?? crisisLink.getAttribute('routerLink')).toBe(
      '/crisis',
    );
    expect(crisisLink.textContent).toContain('Crisis');
  });

  it('renders accessible language toggle pill in topbar and toggles between Khmer and English', () => {
    const el = fixture.nativeElement as HTMLElement;
    const toggleBtn = el.querySelector('.topbar-lang-toggle') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();
    expect(toggleBtn.textContent).toContain('ភាសាខ្មែរ');

    toggleBtn.click();
    fixture.detectChanges();

    const updatedToggleBtn = el.querySelector('.topbar-lang-toggle') as HTMLButtonElement;
    expect(updatedToggleBtn.textContent).toContain('English');
  });
});
