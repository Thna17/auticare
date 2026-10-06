import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiMessageTone = 'error' | 'success' | 'info' | 'warning';

/**
 * An inline message: a form error, a save confirmation, a warning banner.
 *
 * Replaces 45-odd hand-rolled copies of the same markup — `<p class="error"
 * role="alert">` appeared 19 times, `form-error` 9 more, with `success`,
 * `dialog-error`, `save-error`, `cancel-error` and others differing only in class
 * name. Each carried its own colours, so the same kind of message looked slightly
 * different depending on which page you were on.
 *
 * The ARIA role follows the tone rather than being passed in, because that is the
 * part most often got wrong by hand: a problem the user must notice is `alert`,
 * which interrupts a screen reader, while a confirmation is `status`, which waits
 * for a pause. Getting that backwards either talks over someone or silently drops
 * an error.
 */
@Component({
  selector: 'ac-ui-message',
  standalone: true,
  template: `
    <p class="message" [attr.data-tone]="tone()" [attr.role]="role()">
      <ng-content />
    </p>
  `,
  styles: [
    `
      .message {
        margin: 0;
        padding: var(--ac-space-3) var(--ac-space-4);
        border-radius: var(--ac-radius-md);
        border: 1px solid transparent;
        line-height: var(--ac-line-body);
      }

      /* Matches the treatment already most common in the app (alert-surface +
         alert-strong, 14 and 15 uses) rather than introducing a new one, so the
         majority of adopted sites look unchanged. */
      .message[data-tone='error'] {
        color: var(--ac-color-alert-strong);
        background: var(--ac-color-alert-surface);
        border-color: var(--ac-color-alert-surface);
      }

      .message[data-tone='success'] {
        color: var(--ac-color-green-600);
        background: var(--ac-color-green-50);
        border-color: var(--ac-color-green-100);
      }

      .message[data-tone='info'] {
        color: var(--ac-color-text-dark);
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-border-info);
      }

      .message[data-tone='warning'] {
        color: var(--ac-color-text-body);
        background: var(--ac-color-sage-light);
        border-color: var(--ac-color-sage);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiMessageComponent {
  readonly tone = input<UiMessageTone>('info');

  /**
   * error and warning interrupt; success and info wait for a pause. Derived from
   * the tone so a caller cannot pair "your changes were saved" with an
   * interrupting alert, or bury a failure in a polite one.
   */
  protected readonly role = computed(() =>
    this.tone() === 'error' || this.tone() === 'warning' ? 'alert' : 'status',
  );
}
