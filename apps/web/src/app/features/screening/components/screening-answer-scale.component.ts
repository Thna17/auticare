import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AnswerScaleOption = { readonly label: string; readonly value: number };

/**
 * The default 5-point Likert scale used by every screening question. Values map
 * left-to-right ascending (Never = 0 … Always = 4), matching the API's accepted
 * answerValue range (int 0–4).
 */
export const defaultAnswerScale: readonly AnswerScaleOption[] = [
  { label: 'Never', value: 0 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Always', value: 4 },
];

/**
 * Reusable single-select answer scale. It is fully parameterised — one instance
 * is reused for all questions; the page feeds it the current question's selected
 * `value` and reacts to `valueChange`. The `options` input defaults to the
 * 5-point scale but can be overridden.
 *
 * Promotion candidate: a generic "pill single-select / segmented control". Relies
 * on the `--scr-*` custom properties from the page host; parameterise colours
 * before moving to the shared design-system.
 */
@Component({
  selector: 'ac-screening-answer-scale',
  standalone: true,
  template: `
    <div class="scale" role="radiogroup" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="pill"
          role="radio"
          [class.selected]="option.value === value()"
          [attr.aria-checked]="option.value === value()"
          [disabled]="disabled()"
          (click)="valueChange.emit(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .scale {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
      }
      .pill {
        min-height: 44px;
        padding: 0 20px;
        border: 2px solid var(--scr-banner-border);
        border-radius: 999px;
        background: var(--scr-surface);
        color: var(--scr-text);
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        transition:
          border-color 140ms ease,
          background 140ms ease,
          color 140ms ease;
      }
      .pill:hover:not(:disabled) {
        border-color: var(--scr-avatar-bg);
      }
      .pill.selected {
        border-color: var(--scr-teal);
        background: var(--scr-teal);
        color: #ffffff;
      }
      .pill:focus-visible {
        outline: 3px solid var(--scr-teal);
        outline-offset: 2px;
      }
      .pill:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningAnswerScaleComponent {
  readonly options = input<readonly AnswerScaleOption[]>(defaultAnswerScale);
  readonly value = input<number | null>(null);
  readonly disabled = input(false);
  readonly ariaLabel = input('Answer');
  readonly valueChange = output<number>();
}
