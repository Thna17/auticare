import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'positive' | 'caution' | 'alert' | 'neutral';

/**
 * Small color-coded status badge. Content-projected; the colour is driven by
 * `tone`. Self-contained (no dependency on the feature's `--scr-*` variables), so
 * it is a clean shared/ promotion candidate — no reusable badge existed elsewhere
 * (dashboard/hospitals each hardcode a one-off pill). Colours reuse the app's
 * semantic palette values (success/warning/attention from tokens.scss) as
 * hardcoded hex, since there is no active token system.
 */
@Component({
  selector: 'ac-screening-badge',
  standalone: true,
  template: `<span class="badge" [class]="tone()"><ng-content /></span>`,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 5px 14px;
        font-weight: 800;
        font-size: 13px;
        letter-spacing: 0.02em;
        color: #ffffff;
      }
      .positive {
        background: #72a675;
      }
      .caution {
        background: #d9a441;
      }
      .alert {
        background: #c96e62;
      }
      .neutral {
        background: #8db4c8;
        color: #103443;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningBadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
