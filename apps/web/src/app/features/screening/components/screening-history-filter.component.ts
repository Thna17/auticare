import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';

export type RiskFilter = 'ALL' | 'LOW' | 'MODERATE' | 'HIGH';

type FilterOption = { readonly label: string; readonly value: RiskFilter };

const EN_OPTIONS: readonly FilterOption[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Moderate', value: 'MODERATE' },
  { label: 'High', value: 'HIGH' },
];

const KM_OPTIONS: readonly FilterOption[] = [
  { label: 'ទាំងអស់', value: 'ALL' },
  { label: 'ហានិភ័យទាប', value: 'LOW' },
  { label: 'ហានិភ័យមធ្យម', value: 'MODERATE' },
  { label: 'ហានិភ័យខ្ពស់', value: 'HIGH' },
];

/**
 * Minimal risk-level filter panel (segmented pills).
 */
@Component({
  selector: 'ac-screening-history-filter',
  standalone: true,
  template: `
    <div
      class="filter"
      role="group"
      [attr.aria-label]="isKm() ? 'ត្រងតាមកម្រិតហានិភ័យ' : 'Filter by risk level'"
    >
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="chip"
          [class.selected]="option.value === value()"
          [attr.aria-pressed]="option.value === value()"
          (click)="valueChange.emit(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .filter {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        min-height: 38px;
        padding: 0 16px;
        border-radius: 999px;
        border: 2px solid var(--scr-banner-border);
        background: var(--scr-surface);
        color: var(--scr-text);
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      .chip:hover:not(.selected) {
        border-color: var(--scr-avatar-bg);
      }
      .chip.selected {
        border-color: var(--scr-teal);
        background: var(--scr-teal);
        color: var(--ac-color-text-on-action);
      }
      .chip:focus-visible {
        outline: 3px solid var(--scr-teal);
        outline-offset: 2px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningHistoryFilterComponent {
  private readonly i18n = inject(I18nService);

  readonly isKm = computed(() => this.i18n.currentLang() === 'km');
  readonly options = computed(() => (this.isKm() ? KM_OPTIONS : EN_OPTIONS));
  readonly value = input<RiskFilter>('ALL');
  readonly valueChange = output<RiskFilter>();
}
