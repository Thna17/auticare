import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';

/**
 * "← Back to home" at the top of every sign-in page. The logo already links
 * home, but nothing says so; this makes the way out obvious.
 */
@Component({
  standalone: true,
  selector: 'ac-back-home-link',
  imports: [RouterLink],
  template: `
    <a routerLink="/" class="back-home">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M19 12H6M11 6l-6 6 6 6"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.2"
        />
      </svg>
      <span>{{ currentLang() === 'km' ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to home' }}</span>
    </a>
  `,
  styles: [
    `
      :host {
        display: block;
        width: fit-content;
        justify-self: start;
        margin-bottom: 12px;
      }

      .back-home {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 40px;
        padding: 6px 12px 6px 8px;
        border-radius: var(--ac-radius-pill);
        color: var(--ac-color-text-body);
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition:
          background 140ms ease,
          color 140ms ease;
      }

      .back-home svg {
        width: 18px;
        height: 18px;
        flex: none;
      }

      .back-home:hover {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
      }

      .back-home:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .back-home {
          transition: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackHomeLinkComponent {
  protected readonly currentLang = inject(I18nService).currentLang;
}
