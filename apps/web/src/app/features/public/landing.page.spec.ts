import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ParentResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  let fixture: ComponentFixture<LandingPage>;
  let i18nService: I18nService;
  let mockAuth: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    parent: ReturnType<typeof signal<ParentResponse | null>>;
  };

  const sampleParent: ParentResponse = {
    id: 'parent_1',
    email: 'parent@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'PARENT',
    phoneNumber: '+855 12 345 678',
    socialMediaAccount: null,
  };

  const sampleHospitalStaff: ParentResponse = {
    id: 'staff_1',
    email: 'coordinator@hospital.org',
    firstName: 'David',
    lastName: 'Miller',
    role: 'HOSPITAL',
    phoneNumber: '+855 99 888 777',
    socialMediaAccount: null,
  };

  beforeEach(async () => {
    mockAuth = {
      isAuthenticated: signal(false),
      parent: signal<ParentResponse | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuth }, I18nService],
    }).compileComponents();

    i18nService = TestBed.inject(I18nService);
    // Ensure test starts in Khmer
    i18nService.setLanguage('km');
  });

  it('renders Khmer content by default for unauthenticated visitors', () => {
    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerActions = compiled.querySelector('.header-actions');
    expect(headerActions?.textContent).toContain('ចូលប្រើ');
    expect(headerActions?.textContent).toContain('ចុះឈ្មោះ');
    expect(headerActions?.textContent).toContain('ភាសាខ្មែរ');

    const heroPrimary = compiled.querySelector('.hero-actions .primary-action');
    expect(heroPrimary?.textContent?.trim()).toBe('ចាប់ផ្តើមប្រើប្រាស់');
    expect(heroPrimary?.getAttribute('href')).toBe('/register');

    const ctaLink = compiled.querySelector('.cta-section a');
    expect(ctaLink?.textContent?.trim()).toBe('បង្កើតគណនី');
    expect(ctaLink?.getAttribute('href')).toBe('/register');

    const kicker = compiled.querySelector('#features .section-kicker');
    expect(kicker?.textContent?.trim()).toBe('អ្វីដែលអ្នកទទួលបាន');
  });

  it('switches to clean English when toggleLanguage() is triggered', () => {
    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    // Toggle language
    const langBtn = fixture.nativeElement.querySelector('.topbar-lang-toggle') as HTMLButtonElement;
    langBtn.click();
    fixture.detectChanges();

    expect(i18nService.currentLang()).toBe('en');

    const compiled = fixture.nativeElement as HTMLElement;
    const headerActions = compiled.querySelector('.header-actions');
    expect(headerActions?.textContent).toContain('Login');
    expect(headerActions?.textContent).toContain('Signup');
    expect(headerActions?.textContent).toContain('English');

    const heroPrimary = compiled.querySelector('.hero-actions .primary-action');
    expect(heroPrimary?.textContent?.trim()).toBe('Get started');

    const ctaLink = compiled.querySelector('.cta-section a');
    expect(ctaLink?.textContent?.trim()).toBe('Create account');

    const kicker = compiled.querySelector('#features .section-kicker');
    expect(kicker?.textContent?.trim()).toBe('What you get');

    const featureTitles = Array.from(compiled.querySelectorAll('#features .tool-card h3')).map(
      (node) => node.textContent?.trim(),
    );
    expect(featureTitles).toEqual([
      'A three-minute check-in',
      'Ask AutiCare',
      'Daily notes and patterns',
      'Guidance you can trust',
    ]);
    expect(compiled.querySelector('.hero-trust')?.textContent).toContain(
      'Screening support, not a diagnosis',
    );
  });

  it('renders Go to Dashboard and user avatar when user is authenticated as PARENT', () => {
    mockAuth.isAuthenticated.set(true);
    mockAuth.parent.set(sampleParent);

    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerActions = compiled.querySelector('.header-actions');
    expect(headerActions?.textContent).toContain('ទៅកាន់ផ្ទាំងគ្រប់គ្រង');

    const avatar = compiled.querySelector('.user-avatar');
    expect(avatar).not.toBeNull();
    expect(avatar?.textContent?.trim()).toBe('JD');

    const heroPrimary = compiled.querySelector('.hero-actions .primary-action');
    expect(heroPrimary?.textContent?.trim()).toBe('ទៅកាន់ផ្ទាំងគ្រប់គ្រង');
    expect(heroPrimary?.getAttribute('href')).toBe('/dashboard');

    const ctaLink = compiled.querySelector('.cta-section a');
    expect(ctaLink?.textContent?.trim()).toBe('ទៅកាន់ផ្ទាំងគ្រប់គ្រង');
    expect(ctaLink?.getAttribute('href')).toBe('/dashboard');
  });

  it('routes to hospital dashboard when user is authenticated as HOSPITAL coordinator', () => {
    mockAuth.isAuthenticated.set(true);
    mockAuth.parent.set(sampleHospitalStaff);

    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dashboardLink = compiled.querySelector('.dashboard-link');
    expect(dashboardLink?.getAttribute('href')).toBe('/hospital/dashboard');

    const avatar = compiled.querySelector('.user-avatar');
    expect(avatar?.textContent?.trim()).toBe('DM');

    const heroPrimary = compiled.querySelector('.hero-actions .primary-action');
    expect(heroPrimary?.getAttribute('href')).toBe('/hospital/dashboard');
  });

  it('keeps a short page, and the menu only links to sections that exist', () => {
    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const sectionIds = Array.from(compiled.querySelectorAll('main > section')).map((el) => el.id);
    expect(sectionIds).toEqual([
      'home',
      'features',
      'how-it-works',
      'about-autism',
      'pricing',
      'start',
    ]);

    // No invented testimonials or unbacked accreditation claims.
    expect(compiled.querySelector('#testimonials')).toBeNull();
    expect(compiled.querySelector('.trust-badges-section')).toBeNull();

    const navTargets = Array.from(compiled.querySelectorAll('.desktop-nav a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(navTargets).toEqual([
      '#home',
      '#features',
      '#how-it-works',
      '#about-autism',
      '#pricing',
    ]);
    for (const target of navTargets) {
      expect(compiled.querySelector(target as string)).toBeTruthy();
    }
  });

  it('prices three plans, keeps families free, and switches to yearly with a discount badge', () => {
    i18nService.setLanguage('en');
    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = Array.from(compiled.querySelectorAll('#pricing .plan-card'));
    expect(cards.map((card) => card.querySelector('h3')?.textContent?.trim())).toEqual([
      'School',
      'Family',
      'Hospital',
    ]);

    const family = cards[1];
    expect(family.classList.contains('highlighted')).toBe(true);
    expect(family.querySelector('.plan-amount')?.textContent).toContain('Free');
    expect(family.querySelector('.plan-cta')?.getAttribute('href')).toBe('/register');
    expect(compiled.querySelector('#pricing .discount')).toBeNull();

    const [, yearly] = Array.from(
      compiled.querySelectorAll<HTMLButtonElement>('.billing-toggle button'),
    );
    yearly.click();
    fixture.detectChanges();

    expect(yearly.getAttribute('aria-checked')).toBe('true');
    // Discounts only on paid plans; the free family plan never shows one.
    expect(compiled.querySelectorAll('#pricing .discount').length).toBe(2);
    expect(family.querySelector('.discount')).toBeNull();
    expect(cards[0].querySelector('.plan-billed')?.textContent).toContain('Billed yearly');
  });

  it('lights up the preview panel for the step a visitor picks', () => {
    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const lit = () =>
      Array.from(compiled.querySelectorAll('.pv-card.lit')).map((el) => el.classList[1]);
    expect(lit()).toEqual(['pv-child']);

    const steps = compiled.querySelectorAll<HTMLButtonElement>('.step-btn');
    expect(steps.length).toBe(4);
    steps[2].click();
    fixture.detectChanges();

    expect(lit()).toEqual(['pv-notes']);
    expect(compiled.querySelector('.pv-chat')?.classList.contains('lit')).toBe(true);
    expect(steps[2].getAttribute('aria-pressed')).toBe('true');
  });
});
