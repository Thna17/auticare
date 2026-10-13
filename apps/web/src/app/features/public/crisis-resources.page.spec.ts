import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import type { ParentResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService, LANG_STORAGE_KEY } from '../../core/i18n/i18n.service';
import { CrisisResourcesPage } from './crisis-resources.page';

describe('CrisisResourcesPage', () => {
  const render = (
    isAuthenticated = false,
    role: 'PARENT' | 'HOSPITAL' = 'PARENT',
    initialLang = 'km',
  ) => {
    TestBed.resetTestingModule();
    localStorage.setItem(LANG_STORAGE_KEY, initialLang);

    const mockAuth = {
      isAuthenticated: signal(isAuthenticated),
      parent: signal<ParentResponse | null>(
        isAuthenticated
          ? {
              id: 'p_1',
              email: 'test@auticare.org',
              firstName: 'Sarah',
              lastName: 'Connor',
              role,
              phoneNumber: null,
              socialMediaAccount: null,
            }
          : null,
      ),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), I18nService, { provide: AuthService, useValue: mockAuth }],
    });
    const fixture = TestBed.createComponent(CrisisResourcesPage);
    fixture.detectChanges();
    return fixture;
  };

  it('renders urgent 119 Cambodian emergency warning banner and verified local crisis hotlines', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;

    const urgentBanner = el.querySelector('.urgent-banner');
    expect(urgentBanner).toBeTruthy();
    expect(urgentBanner?.textContent).toContain('119');
    expect(urgentBanner?.querySelector('a[href="tel:119"]')).toBeTruthy();
    expect(urgentBanner?.querySelector('a[href="tel:117"]')).toBeTruthy();

    const text = el.textContent ?? '';
    expect(text).toContain('TPO Cambodia');
    expect(text).toContain('Child Helpline');
    expect(text).toContain('1280');
    expect(text).toContain('មន្ទីរពេទ្យកុមារជាតិ');
    expect(text).toContain('គន្ធបុប្ផា');
    expect(text).toContain('សាលាទន្សាយ');
    expect(text).toContain('សហគមន៍ដៃនៃក្តីសង្ឃឹម');

    // Verify verified Cambodian dialer links
    expect(el.querySelector('a[href="tel:0236366991"]')).toBeTruthy();
    expect(el.querySelector('a[href="tel:1280"]')).toBeTruthy();
    expect(el.querySelector('a[href="tel:023880475"]')).toBeTruthy();
    expect(el.querySelector('a[href="tel:023722724"]')).toBeTruthy();
    expect(el.querySelector('a[href="tel:023214747"]')).toBeTruthy();
  });

  it('renders accessible language toggle and switches bilingually between Khmer and English', () => {
    const fixture = render(false, 'PARENT', 'km');
    const el = fixture.nativeElement as HTMLElement;

    const langToggleBtn = el.querySelector('.topbar-lang-toggle') as HTMLButtonElement;
    expect(langToggleBtn).toBeTruthy();
    expect(langToggleBtn.textContent).toContain('ភាសាខ្មែរ');
    expect(el.textContent).toContain('មជ្ឈមណ្ឌលជំនួយបន្ទាន់');

    // Switch language to English
    langToggleBtn.click();
    fixture.detectChanges();

    expect(langToggleBtn.textContent).toContain('English');
    expect(el.textContent).toContain('Crisis & Emergency Support Hub');
    expect(el.querySelector('.urgent-banner')?.textContent).toContain(
      'Immediate Medical or Safety Emergency',
    );
    expect(el.textContent).toContain('TPO Cambodia (Mental Health Crisis Support)');
    expect(el.textContent).toContain('Child Helpline Cambodia');
    expect(el.textContent).toContain('National Pediatric Hospital');
    expect(el.textContent).toContain('Kantha Bopha Children’s Hospital');
    expect(el.textContent).toContain('Rabbit School Organization');
    expect(el.textContent).toContain('Hands of Hope Community');
  });

  it('renders autism sensory meltdown de-escalation protocol steps bilingually', () => {
    const fixture = render(false, 'PARENT', 'km');
    const el = fixture.nativeElement as HTMLElement;
    let text = el.textContent ?? '';

    expect(text).toContain('កាត់បន្ថយការរំញោចញាណដឹងខ្លាំង');
    expect(text).toContain('កាត់បន្ថយការនិយាយ');
    expect(text).toContain('ផ្តល់ឧបករណ៍ជួយសម្រួលអារម្មណ៍');
    expect(text).toContain('អនុញ្ញាតឱ្យធ្វើចលនាបន្ធូរអារម្មណ៍');

    // Switch to English
    const langToggleBtn = el.querySelector('.topbar-lang-toggle') as HTMLButtonElement;
    langToggleBtn.click();
    fixture.detectChanges();

    text = el.textContent ?? '';
    expect(text).toContain('Autism Sensory Meltdown De-escalation Protocol');
    expect(text).toContain('Eliminate Sensory Overload');
    expect(text).toContain('Minimize Verbal Communication');
    expect(text).toContain('Provide Regulating Tools');
    expect(text).toContain('Allow Safe Stimming & Recovery Time');
  });

  it('renders pediatric emergency room guidance and AutiCare navigation links', () => {
    const fixture = render(true);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('ស្វែងរកមន្ទីរពេទ្យឯកទេស');
    expect(el.querySelector('a[href*="/hospitals"]')).toBeTruthy();
    expect(el.querySelector('a[href*="/children"]')).toBeTruthy();

    const dashboardLink = el.querySelector('.nav-btn.primary');
    expect(dashboardLink).toBeTruthy();
    expect(dashboardLink?.textContent).toContain('ផ្ទាំងគ្រប់គ្រង');
  });

  it('manages calming breathing exercise state and cycles phases', () => {
    const fixture = render();
    const component = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    expect(component.breathingActive()).toBe(false);
    expect(component.breathPhaseText()).toBe('ដកដង្ហើមចូលយឺតៗ');

    const breathingBtn = el.querySelector('.breathing-toggle-btn') as HTMLButtonElement;
    expect(breathingBtn).toBeTruthy();
    expect(breathingBtn.textContent).toContain('ចាប់ផ្តើមលំហាត់');

    // Start breathing exercise
    breathingBtn.click();
    fixture.detectChanges();

    expect(component.breathingActive()).toBe(true);
    expect(breathingBtn.textContent).toContain('ផ្អាកលំហាត់');

    // Pause breathing exercise
    breathingBtn.click();
    fixture.detectChanges();

    expect(component.breathingActive()).toBe(false);
    expect(breathingBtn.textContent).toContain('ចាប់ផ្តើមលំហាត់');

    // Destroy cleans up cleanly
    fixture.destroy();
  });
});
