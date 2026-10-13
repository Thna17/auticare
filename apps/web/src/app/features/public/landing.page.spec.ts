import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import type { ParentResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  let fixture: ComponentFixture<LandingPage>;
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
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuth }],
    }).compileComponents();
  });

  it('renders login and signup links when user is unauthenticated', () => {
    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerActions = compiled.querySelector('.header-actions');
    expect(headerActions?.textContent).toContain('Login');
    expect(headerActions?.textContent).toContain('Signup');
    expect(headerActions?.textContent).not.toContain('Go to Dashboard');

    const heroPrimary = compiled.querySelector('.hero-actions .primary-action');
    expect(heroPrimary?.textContent?.trim()).toBe('Get started');
    expect(heroPrimary?.getAttribute('href')).toBe('/register');

    const ctaLink = compiled.querySelector('.cta-section a');
    expect(ctaLink?.textContent?.trim()).toBe('Create account');
    expect(ctaLink?.getAttribute('href')).toBe('/register');
  });

  it('renders Go to Dashboard and user avatar when user is authenticated as PARENT', () => {
    mockAuth.isAuthenticated.set(true);
    mockAuth.parent.set(sampleParent);

    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerActions = compiled.querySelector('.header-actions');
    expect(headerActions?.textContent).toContain('Go to Dashboard');
    expect(headerActions?.textContent).not.toContain('Login');
    expect(headerActions?.textContent).not.toContain('Signup');

    const avatar = compiled.querySelector('.user-avatar');
    expect(avatar).not.toBeNull();
    expect(avatar?.textContent?.trim()).toBe('JD');

    const heroPrimary = compiled.querySelector('.hero-actions .primary-action');
    expect(heroPrimary?.textContent?.trim()).toBe('Go to Dashboard');
    expect(heroPrimary?.getAttribute('href')).toBe('/dashboard');

    const ctaLink = compiled.querySelector('.cta-section a');
    expect(ctaLink?.textContent?.trim()).toBe('Go to Dashboard');
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
});
