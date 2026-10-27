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

  it('states that the platform gives no medical advice', () => {
    const text = render().nativeElement.textContent;
    expect(text).toContain('AutiCare is not a healthcare provider');
    expect(text).toContain('ambulance 119, police 117');
  });

  it('shows the role access table and lists every article', () => {
    const el = render().nativeElement as HTMLElement;
    const roles = Array.from(el.querySelectorAll('#access .legal-table tbody tr')).map((row) =>
      row.querySelector('td')?.textContent?.trim(),
    );
    expect(roles).toEqual([
      'Parent',
      'School staff',
      'Hospital or clinic staff',
      'AutiCare administrators',
    ]);
    expect(el.querySelectorAll('.toc-link').length).toBe(11);
    expect(el.textContent).toContain('AutiCare shall not:');
  });
});
