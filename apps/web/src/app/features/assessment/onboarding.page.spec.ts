import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { OnboardingState } from './onboarding-state';
import { OnboardingPage } from './onboarding.page';

const QUESTIONS = ['Does your child point at things?', 'Does your child copy waving?'].map(
  (questionText, i) => ({
    id: `q${i + 1}`,
    questionText,
    category: 'Social Interaction',
    displayOrder: i + 1,
    polarity: 'REVERSE' as const,
    formKind: 'SHORT' as const,
  }),
);

const setup = () => {
  TestBed.configureTestingModule({
    imports: [OnboardingPage],
    providers: [
      provideRouter([]),
      {
        provide: ChildrenApi,
        useValue: {
          listChildren: () =>
            of([
              {
                id: 'c1',
                firstName: 'Dara',
                dateOfBirth: '2023-01-01',
                notes: null,
                archivedAt: null,
              },
            ]),
        },
      },
      {
        provide: ScreeningApi,
        useValue: {
          createSession: () => of({ session: { id: 's1' }, questions: QUESTIONS }),
        },
      },
      { provide: OnboardingState, useValue: { markComplete() {}, invalidate() {}, skip() {} } },
    ],
  });
  TestBed.inject(I18nService).setLanguage('en');
  const fixture = TestBed.createComponent(OnboardingPage);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  // From the intro, start the questions.
  el.querySelector<HTMLButtonElement>('.actions .primary')!.click();
  fixture.detectChanges();
  return { fixture, el };
};

describe('OnboardingPage questions', () => {
  it('shows the photo beside the steps', () => {
    const { el } = setup();
    expect(el.querySelector('.photo img')?.getAttribute('src')).toBe(
      '/images/onboarding-family.jpg',
    );
  });

  it('lists the five answers as radio rows and waits for a choice', () => {
    const { el } = setup();
    expect(el.querySelector('#question-title')?.textContent?.trim()).toBe(
      'Does your child point at things?',
    );
    const radios = el.querySelectorAll<HTMLInputElement>('.option input[type="radio"]');
    expect(radios).toHaveLength(5);
    expect(el.querySelector<HTMLButtonElement>('.round.next')?.disabled).toBe(true);
    expect(el.querySelector('.step-label')?.textContent?.trim()).toBe('Question 1 of 2');
  });

  it('marks the chosen row and moves on with the next button', () => {
    const { fixture, el } = setup();
    const third = el.querySelectorAll<HTMLInputElement>('.option input')[2]!;
    third.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.option.selected')).toHaveLength(1);

    el.querySelector<HTMLButtonElement>('.round.next')!.click();
    fixture.detectChanges();
    expect(el.querySelector('#question-title')?.textContent?.trim()).toBe(
      'Does your child copy waving?',
    );
    // The last question offers "See result" instead of the round next button.
    expect(el.querySelector('.finish')?.textContent?.trim()).toBe('See result');
    expect(el.querySelector<HTMLButtonElement>('.round.back')?.disabled).toBe(false);
  });
});
