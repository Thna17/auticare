import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone =
  'positive' | 'caution' | 'alert' | 'neutral' | 'success' | 'warning' | 'error' | 'info';

/**
 * Shared status badge.
 *
 * Tones map to tokens.scss:
 *   positive / success -> --ac-color-sage        caution / warning -> --ac-color-warning
 *   alert / error      -> --ac-color-attention   info              -> --ac-color-surface-info
 *   neutral            -> --ac-color-primary
 *
 * Renders as a tint (light background, dark text) plus a leading glyph so status
 * is never conveyed by color alone (WCAG 1.4.1).
 */
@Component({
  selector: 'ac-ui-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="normalizedTone()">
      <span class="glyph" aria-hidden="true">{{ glyph() }}</span>
      <ng-content />
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        gap: 6px;
        border-radius: var(--ac-radius-pill);
        padding: 4px 10px;
        font-weight: var(--ac-font-weight-semibold);
        font-size: var(--ac-type-meta);
        line-height: 1.25;
        white-space: nowrap;
        letter-spacing: 0.01em;
        transition:
          background-color var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .glyph {
        font-size: 0.85em;
        line-height: 1;
      }

      .positive {
        background: var(--ac-color-sage-light);
        color: var(--ac-color-green-dark);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      .caution {
        background: var(--ac-color-amber-tint-sand);
        color: var(--ac-color-amber-dark);
        border: 1px solid var(--ac-color-amber-tint-cream);
      }

      .alert {
        background: var(--ac-color-red-tint-muted);
        color: var(--ac-color-red-terracotta);
        border: 1px solid var(--ac-color-red-border);
      }

      .info {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-border-info);
      }

      .neutral {
        background: var(--ac-color-ice-blue-faint);
        color: var(--ac-color-ink-f);
        border: 1px solid var(--ac-color-border-info);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBadgeComponent {
  readonly tone = input<BadgeTone>('neutral');

  readonly normalizedTone = computed(() => {
    const t = this.tone();
    if (t === 'success') return 'positive';
    if (t === 'warning') return 'caution';
    if (t === 'error') return 'alert';
    return t;
  });

  protected glyph(): string {
    switch (this.normalizedTone()) {
      case 'positive':
        return '\u2713'; // check
      case 'caution':
        return '\u25CF'; // pending dot
      case 'alert':
        return '\u2715'; // x
      case 'info':
        return '\u2139'; // info
      default:
        return '\u25CF';
    }
  }
}
