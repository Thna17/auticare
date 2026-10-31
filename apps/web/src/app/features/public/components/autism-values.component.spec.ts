import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AutismValuesComponent } from './autism-values.component';

const render = (lang: 'en' | 'km' = 'en') => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [AutismValuesComponent],
  });
  const fixture = TestBed.createComponent(AutismValuesComponent);
  fixture.componentRef.setInput('lang', lang);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
};

describe('AutismValuesComponent', () => {
  it('reads the heading as one phrase while animating it piece by piece', () => {
    const el = render();
    const h2 = el.querySelector('h2');
    expect(h2?.getAttribute('aria-label')).toBe('Understanding and compassionate care');
    const chars = Array.from(el.querySelectorAll('h2 .char'))
      .map((c) => c.textContent)
      .join('');
    expect(chars).toBe('Understandingandcompassionatecare');
  });

  it('shows three values that alternate sides, each with details and topics', () => {
    const el = render();
    const values = Array.from(el.querySelectorAll('.value'));
    expect(values).toHaveLength(3);
    expect(values.map((v) => v.classList.contains('reversed'))).toEqual([false, true, false]);
    expect(values.map((v) => v.querySelector('h3')?.textContent?.trim())).toEqual([
      'Every child is unique',
      'Screening is a starting point',
      'Progress works best as a team',
    ]);
    expect(el.querySelectorAll('.topics li')).toHaveLength(9);
    expect(el.textContent).toContain('It is not a diagnosis');
  });

  it('keeps Khmer characters whole in the animated heading', () => {
    const el = render('km');
    const pieces = Array.from(el.querySelectorAll('h2 .char')).map((c) => c.textContent ?? '');
    // A piece never starts with a combining mark or the Khmer subscript sign.
    expect(pieces.every((p) => !/^[ា-៓]/.test(p))).toBe(true);
    expect(el.querySelector('.kicker')?.textContent?.trim()).toBe('អំពីអូទីស្សឹម');
  });
});
