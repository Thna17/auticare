import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { PrivacyPage } from './privacy.page';

describe('PrivacyPage', () => {
  const render = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(PrivacyPage);
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

  it('truthfully disclaims HIPAA compliance', () => {
    const fixture = render();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain(
      'does not claim compliance with the Health Insurance Portability and Accountability Act (HIPAA)',
    );
    expect(text).not.toContain('HIPAA-compliant support');
  });

  it('truthfully documents stored child profile fields and data sharing boundaries', () => {
    const fixture = render();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('first name, date of birth, and free-form support notes');
    expect(text).toContain('We do not sell, rent, or monetize your personal or family data');
  });
});
