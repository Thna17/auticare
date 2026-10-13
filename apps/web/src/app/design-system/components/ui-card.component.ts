import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'outlined';

@Component({
  selector: 'ac-ui-card',
  standalone: true,
  template: `
    <section
      class="card"
      [class.interactive]="interactive()"
      [class.variant-elevated]="variant() === 'elevated'"
      [class.variant-outlined]="variant() === 'outlined'"
    >
      <ng-content />
    </section>
  `,
  styles: [
    `
      .card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-6);
        transition:
          border-color var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast),
          transform var(--ac-motion-fast);
      }

      .card.variant-elevated {
        border-color: var(--ac-color-border-slate);
        box-shadow: var(--ac-shadow-md);
      }

      .card.variant-outlined {
        box-shadow: none;
        border: 1px solid var(--ac-color-border);
      }

      .card.interactive {
        cursor: pointer;
      }

      .card.interactive:hover {
        border-color: var(--ac-color-action-alt);
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-2px);
      }

      .card.interactive:active {
        transform: translateY(0);
        box-shadow: var(--ac-shadow-sm);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCardComponent {
  readonly interactive = input(false);
  readonly variant = input<CardVariant>('default');
}
