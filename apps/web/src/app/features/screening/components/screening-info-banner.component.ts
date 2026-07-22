import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Soft informational banner (light teal). Content is projected so the banner is
 * reusable for any advisory copy.
 *
 * Promotion candidate: generic enough to live in the shared design-system once a
 * second feature needs it. Relies on the `--scr-*` custom properties defined by
 * the screening page host; give it standalone fallbacks/inputs before promoting.
 */
@Component({
  selector: 'ac-screening-info-banner',
  standalone: true,
  template: `
    <aside class="banner" role="note">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
        <line
          x1="12"
          y1="11"
          x2="12"
          y2="16"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <circle cx="12" cy="7.75" r="1.25" fill="currentColor" />
      </svg>
      <p class="text"><ng-content /></p>
    </aside>
  `,
  styles: [
    `
      .banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: var(--scr-banner-bg);
        border: 1px solid var(--scr-banner-border);
        border-radius: var(--scr-radius);
        padding: 16px 18px;
        color: var(--scr-teal);
      }
      .icon {
        width: 22px;
        height: 22px;
        flex: 0 0 auto;
        margin-top: 1px;
      }
      .text {
        margin: 0;
        color: var(--scr-text);
        font-size: 14px;
        line-height: 1.5;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningInfoBannerComponent {}
