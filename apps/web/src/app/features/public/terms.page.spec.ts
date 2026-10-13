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

  it('truthfully specifies medical and diagnostic disclaimer', () => {
    const fixture = render();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('AutiCare is not a medical provider and does not give medical advice');
    expect(text).toContain(
      'original heuristic indicators provided for educational and organizational purposes only',
    );
    expect(text).toContain('They do not constitute clinical diagnoses');
  });

  it('clarifies appointment and enrollment request expectations', () => {
    const fixture = render();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Appointments and School Enrollments');
    expect(text).toContain(
      'does not guarantee immediate acceptance, admission, or scheduled confirmation',
    );
  });
});
