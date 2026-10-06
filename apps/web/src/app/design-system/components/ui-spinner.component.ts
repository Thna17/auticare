import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A loading indicator with its own label.
 *
 * Replaces the bare `<p>Loading…</p>` paragraphs scattered across the features,
 * which had drifted into three spellings of the same wait — "Loading…",
 * "Loading...", "Loading schools..." — and gave assistive technology nothing to
 * announce, because a paragraph appearing is not an event.
 *
 * `role="status"` with `aria-live="polite"` means the wait is announced once the
 * reader reaches a pause, rather than interrupting. The animation is suppressed
 * under prefers-reduced-motion, where a spinning element is an accessibility
 * problem rather than a nicety.
 */
@Component({
  selector: 'ac-ui-spinner',
  standalone: true,
  template: `
    <p class="spinner-row" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <span class="label">{{ label() }}</span>
    </p>
  `,
  styles: [
    `
      .spinner-row {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        margin: 0;
        color: var(--ac-color-text-muted);
      }

      .spinner {
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
        border: 2px solid var(--ac-color-border);
        border-top-color: var(--ac-color-action);
        border-radius: 50%;
        animation: ac-spin 0.8s linear infinite;
      }

      @keyframes ac-spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* A spinning element is a barrier for some vestibular conditions, so it
         becomes a static ring rather than disappearing — the wait is still shown. */
      @media (prefers-reduced-motion: reduce) {
        .spinner {
          animation: none;
          border-top-color: var(--ac-color-border);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSpinnerComponent {
  readonly label = input<string>('Loading…');
}
