import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { I18nService } from '../../core/i18n/i18n.service';
import { helpCenterCategories } from './help-center.data';
import { HelpCenterPage } from './help-center.page';

describe('HelpCenter', () => {
  describe('helpCenterCategories truthfulness', () => {
    it('accurately lists stored child fields as name, date of birth, and notes without gender or diagnosis fields', () => {
      const gettingStarted = helpCenterCategories.find((c) => c.id === 'getting-started');
      const addChildFaq = gettingStarted?.entries.find((e) =>
        e.question.includes('How do I add a child profile'),
      );
      expect(addChildFaq?.answer).toContain(
        'first name, date of birth, and optional support notes',
      );
      expect(addChildFaq?.answer).not.toContain('gender');

      const privacy = helpCenterCategories.find((c) => c.id === 'account-privacy');
      const storeFaq = privacy?.entries.find((e) =>
        e.question.includes('What information does AutiCare store about my child'),
      );
      expect(storeFaq?.answer).toContain('first name, date of birth, and optional care notes');
      expect(storeFaq?.answer).not.toContain('gender');
    });

    it('accurately describes settings editing boundaries and password recovery', () => {
      const gettingStarted = helpCenterCategories.find((c) => c.id === 'getting-started');
      const updateFaq = gettingStarted?.entries.find((e) =>
        e.question.includes('How do I update my account information'),
      );
      expect(updateFaq?.answer).toContain(
        'first name, last name, phone number, or social media handle',
      );
      expect(updateFaq?.answer).toContain(
        'email address serves as your sign-in identifier and cannot be edited in settings',
      );
      expect(updateFaq?.answer).toContain('forgot password');
    });

    it('accurately explains archiving vs contacting support for permanent account deletion', () => {
      const privacy = helpCenterCategories.find((c) => c.id === 'account-privacy');
      const deleteFaq = privacy?.entries.find((e) =>
        e.question.includes("delete or archive my child's profile or account"),
      );
      expect(deleteFaq?.answer).toContain(
        'archive a child profile at any time directly from the child profile page',
      );
      expect(deleteFaq?.answer).toContain(
        'Self-serve account deletion is not available in Settings',
      );
      expect(deleteFaq?.answer).toContain('support@auticare.local');
    });

    it('accurately reflects school search filters without non-existent saved schools feature', () => {
      const schools = helpCenterCategories.find((c) => c.id === 'schools-hospitals');
      const searchFaq = schools?.entries.find((e) =>
        e.question.includes('How do I search for schools'),
      );
      expect(searchFaq?.answer).toContain('Province/Region');
      expect(searchFaq?.answer).toContain('Availability status');
      expect(searchFaq?.answer).toContain('Specialization tags');
      expect(searchFaq?.answer).not.toContain('distance');

      const savedSchoolFaq = schools?.entries.find((e) =>
        e.question.toLowerCase().includes('save a school'),
      );
      expect(savedSchoolFaq).toBeUndefined();
    });

    it('accurately describes hospital appointment request and review model', () => {
      const schools = helpCenterCategories.find((c) => c.id === 'schools-hospitals');
      const appointmentFaq = schools?.entries.find((e) => e.question.includes('appointment'));
      expect(appointmentFaq?.answer).toContain(
        'submitted as a request for hospital staff to review and confirm or decline',
      );
    });

    it('accurately specifies contact method via email support', () => {
      const contact = helpCenterCategories.find((c) => c.id === 'contact');
      const contactFaq = contact?.entries.find((e) =>
        e.question.includes("question that isn't answered here"),
      );
      expect(contactFaq?.answer).toContain('support@auticare.local');
      expect(contactFaq?.answer).not.toContain('contact form below');
    });
  });

  describe('HelpCenterPage component', () => {
    it('renders Help Center and provides direct mailto link to support@auticare.local', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideRouter([])],
      });
      TestBed.inject(I18nService).setLanguage('en');
      const fixture = TestBed.createComponent(HelpCenterPage);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('h1')?.textContent).toContain('Help Center');
      const contactBtn = el.querySelector('.contact-btn') as HTMLAnchorElement;
      expect(contactBtn?.getAttribute('href')).toBe('mailto:support@auticare.local');
    });

    it('renders Emergency & Crisis banner and hotlines with deep link to full crisis hub', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideRouter([])],
      });
      TestBed.inject(I18nService).setLanguage('en');
      const fixture = TestBed.createComponent(HelpCenterPage);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const banner = el.querySelector('#emergency');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('Crisis & Mental Health Emergency Support');
      expect(banner?.textContent).toContain('988');
      expect(banner?.textContent).toContain('741741');

      const hubLink = banner?.querySelector('a[href*="/crisis"]');
      expect(hubLink).toBeTruthy();
    });
  });
});
