import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ac-ui-button',
  standalone: true,
  template: `
    <button
      class="button"
      [class.secondary]="variant() === 'secondary'"
      [class.destructive]="variant() === 'destructive'"
      [class.ghost]="variant() === 'ghost'"
      [class.loading]="loading()"
      [class.btn-sm]="size() === 'sm'"
      [class.btn-md]="size() === 'md'"
      [class.btn-lg]="size() === 'lg'"
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
    >
      @if (loading()) {
        <span class="spinner" aria-hidden="true"></span>
      }
      <span class="btn-label" [class.dimmed]="loading()">
        <ng-content />
      </span>
    </button>
  `,
  styles: [
    `
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--ac-space-2);
        border: 0;
        font-family: inherit;
        font-weight: var(--ac-font-weight-semibold);
        line-height: 1;
        cursor: pointer;
        text-decoration: none;
        white-space: nowrap;
        background: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
        box-shadow: var(--ac-shadow-xs);
        transition:
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast),
          background var(--ac-motion-fast),
          opacity var(--ac-motion-fast);
      }

      /* Sizes */
      .btn-sm {
        min-height: 34px;
        padding: 0 12px;
        font-size: var(--ac-type-meta);
        border-radius: var(--ac-radius-sm);
      }

      .btn-md {
        min-height: 42px;
        padding: 0 18px;
        font-size: var(--ac-type-body);
        border-radius: var(--ac-radius-md);
      }

      .btn-lg {
        min-height: 48px;
        padding: 0 24px;
        font-size: 1.0625rem;
        border-radius: var(--ac-radius-md);
      }

      /* Hover & active states */
      .button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: var(--ac-shadow-sm);
        background: var(--ac-color-ink-charcoal);
      }

      .button:active:not(:disabled) {
        transform: translateY(0) scale(0.99);
        box-shadow: var(--ac-shadow-xs);
      }

      .button.secondary {
        background: var(--ac-color-sage-light);
        color: var(--ac-color-text);
        box-shadow: none;
      }

      .button.secondary:hover:not(:disabled) {
        background: var(--ac-color-sage);
        color: var(--ac-color-text-strong);
      }

      .button.destructive {
        background: var(--ac-color-red-700);
        color: var(--ac-color-text-on-action);
      }

      .button.destructive:hover:not(:disabled) {
        background: var(--ac-color-red-800);
      }

      .button.ghost {
        background: transparent;
        color: var(--ac-color-action-deep);
        box-shadow: none;
        border: 1px solid transparent;
      }

      .button.ghost:hover:not(:disabled) {
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action-darkest);
        box-shadow: none;
      }

      .button.ghost:active:not(:disabled) {
        background: var(--ac-color-tint-blue);
      }

      .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: ac-spin 0.75s linear infinite;
        flex-shrink: 0;
      }

      @keyframes ac-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .btn-label {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
      }

      .btn-label.dimmed {
        opacity: 0.85;
      }

      .button:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
        box-shadow: 0 0 0 3px var(--ac-color-tint-blue);
      }

      .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
}
