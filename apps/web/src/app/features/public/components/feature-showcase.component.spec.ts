import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FeatureShowcaseComponent } from './feature-showcase.component';

const FEATURES = [
  { title: 'A three-minute check-in', description: 'Ten questions.', icon: 'checklist' },
  { title: 'Ask AutiCare', description: 'Ask anything.', icon: 'ai' },
  { title: 'Daily notes and patterns', description: 'Record moments.', icon: 'trend' },
  { title: 'Guidance you can trust', description: 'Reviewed resources.', icon: 'shield' },
];

const render = (lang: 'en' | 'km' = 'en') => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [FeatureShowcaseComponent] });
  const fixture = TestBed.createComponent(FeatureShowcaseComponent);
  // The component renders onto a <section>; in a test it gets a plain host.
  fixture.componentRef.setInput('features', FEATURES);
  fixture.componentRef.setInput('lang', lang);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
};

describe('FeatureShowcaseComponent', () => {
  it('renders the heading word by word, one block and one window per tool', () => {
    const { el } = render();
    const words = Array.from(el.querySelectorAll('h2 .word')).map((w) => w.textContent);
    expect(words.join(' ')).toBe('Help for the weeks between noticing and being seen');
    expect(el.querySelectorAll('.showcase-item')).toHaveLength(4);
    expect(el.querySelectorAll('.window')).toHaveLength(4);
    expect(el.querySelectorAll('.bars .bar')).toHaveLength(14);
    expect(el.querySelectorAll('.stack-art .layer')).toHaveLength(4);
    expect(el.textContent).toContain('Not a diagnosis');
  });

  it('has a menu with one button per tool, the first one active', () => {
    const { el } = render();
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.rail-item'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual([
      'Check-in',
      'Ask AutiCare',
      'Daily notes',
      'Guidance',
    ]);
    expect(buttons[0]?.getAttribute('aria-current')).toBe('true');
    expect(buttons[1]?.getAttribute('aria-current')).toBeNull();
  });

  it('shows the Khmer copy when the language is km', () => {
    const { el } = render('km');
    expect(el.querySelector('.section-kicker')?.textContent?.trim()).toBe('អ្វីដែលអ្នកទទួលបាន');
    expect(el.textContent).toContain('មិនមែនការធ្វើរោគវិនិច្ឆ័យ');
  });

  it('keeps the app windows away from screen readers; the text says it all', () => {
    const { el } = render();
    expect(
      Array.from(el.querySelectorAll('.window')).every(
        (w) => w.getAttribute('aria-hidden') === 'true',
      ),
    ).toBe(true);
  });
});
