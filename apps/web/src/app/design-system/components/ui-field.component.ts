import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
} from '@angular/core';

/**
 * A labelled form field: label, the control itself, an optional hint, and an
 * optional error.
 *
 * Replaces 35 hand-rolled `<label class="field">` / `<label class="dialog-field">`
 * wrappers. Each repeated the same structure with its own spacing and colours, and
 * almost none had anywhere to put an error — `<small class="field-error">` existed
 * in exactly two places across the whole app, which is why validation feedback is
 * so uneven.
 *
 * The control stays WRAPPED by the label rather than linked with for/id. That is a
 * valid implicit association, it is what the app already does, and it cannot drift
 * out of sync the way a hand-written for/id pair can when a field is copied.
 *
 * Prompt 10 builds on this: aria-invalid and aria-describedby wiring belongs here,
 * once every form is using it, so the behaviour is defined in one place instead of
 * being added field by field.
 */
@Component({
  selector: 'ac-ui-field',
  standalone: true,
  template: `
    <label class="field" [class.field--full]="full()">
      <span class="label">
        {{ label() }}
        @if (optional()) {
          <em class="optional">(optional)</em>
        }
      </span>

      <ng-content />

      @if (hint() && !error()) {
        <small class="hint" [id]="hintId">{{ hint() }}</small>
      }
      @if (error()) {
        <small class="error" [id]="errorId" role="alert">{{ error() }}</small>
      }
    </label>
  `,
  styles: [
    `
      .field {
        display: grid;
        gap: var(--ac-space-2);
      }

      .field--full {
        grid-column: 1 / -1;
      }

      .label {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .optional {
        font-style: normal;
        font-weight: var(--ac-font-weight-regular);
        color: var(--ac-color-text-muted);
      }

      .hint {
        font-weight: var(--ac-font-weight-regular);
        color: var(--ac-color-text-muted);
      }

      .error {
        font-weight: var(--ac-font-weight-regular);
        color: var(--ac-color-red-700);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFieldComponent {
  /**
   * Ids for the hint and error so the projected control can point at them with
   * aria-describedby. Instance-unique, because a page holds many fields and a
   * duplicate id would make a screen reader announce the wrong message.
   */
  private static nextId = 0;
  private readonly uid = `ac-field-${UiFieldComponent.nextId++}`;
  protected readonly hintId = `${this.uid}-hint`;
  protected readonly errorId = `${this.uid}-error`;

  readonly label = input.required<string>();
  readonly hint = input<string | null>(null);
  /** Shown instead of the hint when present, so the two never compete for space. */
  readonly error = input<string | null>(null);
  readonly optional = input(false);
  /** Span the full width of a grid-based field layout. */
  readonly full = input(false);

  /**
   * Wire the projected control to this field's state.
   *
   * Angular cannot add attributes to projected content, so the control is found
   * and annotated directly: aria-invalid so the control itself reports the
   * error, and aria-describedby pointing at whichever of the hint or error is
   * showing. Without this the error is visible but unannounced — the control
   * reads as valid and the message is just loose text beside it.
   *
   * Any aria-describedby the caller set is preserved, so a field can still point
   * at context of its own.
   */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect(() => {
      const error = this.error();
      const hint = this.hint();
      const control = this.host.nativeElement.querySelector<HTMLElement>('input, select, textarea');
      if (!control) return;

      if (error) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');

      const theirs = (control.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter((id) => id !== '' && id !== this.hintId && id !== this.errorId);
      const ours = error ? [this.errorId] : hint ? [this.hintId] : [];
      const all = [...theirs, ...ours];

      if (all.length > 0) control.setAttribute('aria-describedby', all.join(' '));
      else control.removeAttribute('aria-describedby');
    });
  }
}
