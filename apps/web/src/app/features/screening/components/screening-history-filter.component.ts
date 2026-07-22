import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type RiskFilter = 'ALL' | 'LOW' | 'MODERATE' | 'HIGH';

type FilterOption = { readonly label: string; readonly value: RiskFilter };

const filterOptions: readonly FilterOption[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Moderate', value: 'MODERATE' },
  { label: 'High', value: 'HIGH' },
];

/**
 * Minimal risk-level filter panel (segmented pills). No reusable filter panel
 * existed in the app, so this is a new minimal, screening-specific version. It is
 * intentionally narrow (risk level only) rather than a generic filter framework.
 */
@Component({
  selector: 'ac-screening-history-filter',
  standalone: true,
  template: `
    <div class="filter" role="group" aria-label="Filter by risk level">
      @for (option of options; track option.value) {
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
        color: #ffffff;
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
  readonly options = filterOptions;
  readonly value = input<RiskFilter>('ALL');
  readonly valueChange = output<RiskFilter>();
}
