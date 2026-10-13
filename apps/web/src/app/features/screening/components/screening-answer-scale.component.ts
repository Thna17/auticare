import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AnswerScaleOption = {
  readonly label: string;
  readonly labelKm?: string;
  readonly labelEn?: string;
  readonly value: number;
  readonly shortcut?: string;
  readonly description?: string;
  readonly descriptionKm?: string;
};

/**
 * 5-point clinical Likert assessment scale with keyboard shortcuts.
 * Maps:
 * - មិនដែល (Never) = 0 -> Shortcut [1]
 * - កម្រ (Rarely) = 1 -> Shortcut [2]
 * - ជួនកាល (Sometimes) = 2 -> Shortcut [3]
 * - ញឹកញាប់ (Often) = 3 -> Shortcut [4]
 * - ជានិច្ច (Always) = 4 -> Shortcut [5]
 */
export const defaultAnswerScale: readonly AnswerScaleOption[] = [
  {
    label: 'មិនដែល (Never - 1)',
    labelKm: 'មិនដែល',
    labelEn: 'Never',
    value: 0,
    shortcut: '1',
    description: 'Rarely, inconsistently, or not observed',
    descriptionKm: 'កម្រកើតឡើង ឬមិនត្រូវបានសង្កេតឃើញទាល់តែសោះ',
  },
  {
    label: 'កម្រ (Rarely - 2)',
    labelKm: 'កម្រ',
    labelEn: 'Rarely',
    value: 1,
    shortcut: '2',
    description: 'Infrequently observed in isolated instances',
    descriptionKm: 'កើតឡើងម្តងម្កាល ក្នុងករណីដាច់ដោយឡែក',
  },
  {
    label: 'ជួនកាល (Sometimes - 3)',
    labelKm: 'ជួនកាល',
    labelEn: 'Sometimes',
    value: 2,
    shortcut: '3',
    description: 'Observed occasionally or with gentle prompting',
    descriptionKm: 'សង្កេតឃើញម្តងម្កាល ឬត្រូវការការរំលឹកស្រាលៗ',
  },
  {
    label: 'ញឹកញាប់ (Often - 4)',
    labelKm: 'ញឹកញាប់',
    labelEn: 'Often',
    value: 3,
    shortcut: '4',
    description: 'Regularly observed across multiple daily settings',
    descriptionKm: 'សង្កេតឃើញជាប្រចាំក្នុងបរិបទប្រចាំថ្ងៃផ្សេងៗ',
  },
  {
    label: 'ជានិច្ច (Always - 5)',
    labelKm: 'ជានិច្ច',
    labelEn: 'Always',
    value: 4,
    shortcut: '5',
    description: 'Consistently and spontaneously observed in daily routines',
    descriptionKm: 'សង្កេតឃើញជាប់លាប់ និងកើតឡើងដោយឯកឯងក្នុងទម្លាប់ប្រចាំថ្ងៃ',
  },
];

@Component({
  selector: 'ac-screening-answer-scale',
  standalone: true,
  template: `
    <div class="scale-grid" role="radiogroup" aria-required="true" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="answer-btn"
          role="radio"
          [class.selected]="isSelected(option.value)"
          [attr.aria-checked]="isSelected(option.value)"
          [disabled]="disabled()"
          (click)="valueChange.emit(option.value)"
        >
          <div class="answer-header">
            <span class="answer-label">
              <span class="label-km">{{ option.labelKm || option.label }}</span>
              @if (option.labelEn && option.labelKm) {
                <span class="label-en-sub"> ({{ option.labelEn }} - {{ option.shortcut }})</span>
              }
            </span>
            @if (option.shortcut) {
              <kbd class="shortcut-pill" aria-hidden="true">{{ option.shortcut }}</kbd>
            }
          </div>
          @if (option.description || option.descriptionKm) {
            <p class="answer-desc">
              {{ option.descriptionKm || option.description }}
              @if (option.descriptionKm && option.description) {
                <span class="desc-en-sub"> ({{ option.description }})</span>
              }
            </p>
          }
          <div class="selection-indicator" aria-hidden="true">
            <span class="radio-circle"></span>
          </div>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .scale-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
        width: 100%;
      }

      .answer-btn {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        min-height: 96px;
        padding: 16px 14px 34px;
        border: 2px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        cursor: pointer;
        transition:
          border-color var(--ac-motion-fast),
          background var(--ac-motion-fast),
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
        box-shadow: var(--ac-shadow-xs);
      }

      .answer-btn:hover:not(:disabled) {
        border-color: var(--ac-color-action);
        background: var(--ac-color-tint-blue-wash);
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-sm);
      }

      .answer-btn:active:not(:disabled) {
        transform: scale(0.99);
      }

      .answer-btn.selected {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
        box-shadow:
          0 0 0 1px var(--ac-color-action),
          var(--ac-shadow-sm);
      }

      .answer-btn:focus-visible {
        outline: 3px solid var(--ac-color-action);
        outline-offset: 2px;
      }

      .answer-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .answer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 6px;
      }

      .answer-label {
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .answer-btn.selected .answer-label {
        color: var(--ac-color-action-deep);
      }

      .label-en-sub {
        font-size: 13px;
        font-weight: 500;
        opacity: 0.85;
        margin-left: 4px;
      }

      .desc-en-sub {
        display: block;
        font-size: 10px;
        opacity: 0.8;
        margin-top: 2px;
      }

      .shortcut-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-grey);
        color: var(--ac-color-text-muted);
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        box-shadow: var(--ac-shadow-xs);
      }

      .answer-btn.selected .shortcut-pill {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .answer-desc {
        margin: 0;
        font-size: 11px;
        line-height: 1.4;
        color: var(--ac-color-text-muted);
      }

      .selection-indicator {
        position: absolute;
        bottom: 12px;
        right: 14px;
        display: flex;
        align-items: center;
      }

      .radio-circle {
        width: 16px;
        height: 16px;
        border-radius: var(--ac-radius-pill);
        border: 2px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        transition: all var(--ac-motion-fast);
      }

      .answer-btn.selected .radio-circle {
        border-color: var(--ac-color-action);
        background: var(--ac-color-action);
        box-shadow: inset 0 0 0 3px var(--ac-color-surface);
      }

      @media (max-width: 900px) {
        .scale-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .scale-grid {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .answer-btn {
          min-height: auto;
          padding: 14px 16px;
        }

        .selection-indicator {
          bottom: 14px;
          right: 16px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningAnswerScaleComponent {
  readonly options = input<readonly AnswerScaleOption[]>(defaultAnswerScale);
  readonly value = input<number | null>(null);
  readonly disabled = input(false);
  readonly ariaLabel = input('Screening Answer Scale');
  readonly valueChange = output<number>();

  isSelected(optVal: number): boolean {
    const current = this.value();
    if (current === null) return false;
    return current === optVal;
  }
}
