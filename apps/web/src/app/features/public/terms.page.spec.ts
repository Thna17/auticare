import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { TermsPage } from './terms.page';

describe('TermsPage', () => {
  const render = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(TermsPage);
    fixture.detectChanges();
    return fixture;
  };

  it('renders dynamic current year in effective date and copyright footer', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    const yearStr = new Date().getFullYear().toString();

    expect(el.querySelector('.effective-date')?.textContent).toContain(yearStr);
    expect(el.querySelector('.legal-footer')?.textContent).toContain(yearStr);
  });

  it('states that AutiCare does not diagnose or replace medical advice', () => {
    const text = render().nativeElement.textContent;
    expect(text).toContain(
      'AutiCare does not diagnose autism or replace professional medical advice.',
    );
    expect(text).toContain('should not be treated as medical diagnoses');
  });

  it('lists every section in the table of contents', () => {
    const el = render().nativeElement as HTMLElement;
    const links = el.querySelectorAll('.toc-link');
    expect(links.length).toBe(el.querySelectorAll('.legal-section').length);
    expect(links[0]?.getAttribute('href')).toBe('#about');
    expect(el.textContent).toContain('Teachers: Join through invitations from their School Admin.');
  });
});
