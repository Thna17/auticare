import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'positive' | 'caution' | 'alert' | 'neutral';

/**
 * Shared status badge. Promoted from the screening feature's
 * `screening-badge.component.ts` (which flagged itself as a promotion
 * candidate) so the whole app has one badge instead of three
 * disagreeing implementations (screening-badge hardcoded hex,
 * appointments.types.ts `statusPresentation` hardcoded hex, and the
 * unused tokens.scss semantic colors).
 *
 * Tones map to tokens.scss:
 *   positive -> --ac-color-sage        caution -> --ac-color-warning
 *   alert    -> --ac-color-attention   neutral -> --ac-color-primary
 *
 * Renders as a tint (light background, dark text) to match what
 * patients already see from `statusPresentation`, plus a small
 * leading glyph so status is never conveyed by color alone
 * (WCAG 1.4.1).
 */
@Component({
  selector: 'ac-ui-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="tone()">
      <span class="glyph" aria-hidden="true">{{ glyph() }}</span>
      <ng-content />
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border-radius: 999px;
        padding: 4px 12px;
        font-weight: var(--ac-font-weight-semibold);
        font-size: var(--ac-type-meta);
        line-height: 1.2;
        white-space: nowrap;
      }

      .glyph {
        font-size: 0.85em;
        line-height: 1;
      }

      .positive {
        background: var(--ac-color-sage-light);
        color: #1f3d22;
      }

      .caution {
        /* --ac-color-warning tinted, kept as a literal hex rather than
           color-mix() since the rest of the app targets browsers without
           relying on it (see appointments.types.ts statusPresentation). */
        background: #f6e6c8;
        color: #6b4a12;
      }

      .alert {
        background: #f3d9d5;
        color: #6e2e26;
      }

      .neutral {
        background: #dceaf0;
        color: #103443;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBadgeComponent {
  readonly tone = input<BadgeTone>('neutral');

  protected glyph(): string {
    switch (this.tone()) {
      case 'positive':
        return '\u2713'; // check
      case 'caution':
        return '\u25CF'; // pending dot
      case 'alert':
        return '\u2715'; // x
      default:
        return '\u25CF';
    }
  }
}
