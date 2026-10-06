import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
} from '@angular/core';
import type { AfterContentInit } from '@angular/core';

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
 * The component generates the label/control association and the ARIA links, so a
 * copied field cannot silently lose its accessible name or point at another
 * field's validation message.
 */
@Component({
  selector: 'ac-ui-field',
  standalone: true,
  template: `
    <div class="field" [class.field--full]="full()">
      <div class="label-row">
        <label class="label" [for]="controlId">
          {{ label() }}
          @if (required()) {
            <span class="required-indicator" aria-hidden="true">*</span>
            <span class="visually-hidden">(required)</span>
          }
          @if (optional()) {
            <em class="optional">(optional)</em>
          }
        </label>
        <ng-content select="[fieldAction]" />
      </div>

      <ng-content />

      @if (hint() && !error()) {
        <small class="hint" [id]="hintId">{{ hint() }}</small>
      }
      @if (error()) {
        <small class="error" [id]="errorId" role="alert">{{ error() }}</small>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .field {
        display: grid;
        gap: var(--ac-space-2);
      }

      .label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ac-space-3);
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

      .required-indicator {
        color: var(--ac-color-alert-strong);
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
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
export class UiFieldComponent implements AfterContentInit {
  /**
   * Ids for the hint and error so the projected control can point at them with
   * aria-describedby. Instance-unique, because a page holds many fields and a
   * duplicate id would make a screen reader announce the wrong message.
   */
  private static nextId = 0;
  private readonly uid = `ac-field-${UiFieldComponent.nextId++}`;
  protected readonly controlId = `${this.uid}-control`;
  protected readonly hintId = `${this.uid}-hint`;
  protected readonly errorId = `${this.uid}-error`;

  readonly label = input.required<string>();
  readonly hint = input<string | null>(null);
  /** Shown instead of the hint when present, so the two never compete for space. */
  readonly error = input<string | null>(null);
  /** Adds the native required state and a visible, announced indicator. */
  readonly required = input(false);
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
  private control: HTMLElement | null = null;

  constructor() {
    effect(() => {
      this.error();
      this.hint();
      this.required();
      this.syncControl();
    });
  }

  ngAfterContentInit() {
    this.control = this.host.nativeElement.querySelector<HTMLElement>('input, select, textarea');
    this.syncControl();
  }

  private syncControl() {
    const control = this.control;
    if (!control) return;

    control.id = this.controlId;

    if (this.required()) control.setAttribute('required', '');

    const error = this.error();
    const hint = this.hint();
    if (error) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');

    const theirs = (control.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter((id) => id !== '' && id !== this.hintId && id !== this.errorId);
    const ours = error ? [this.errorId] : hint ? [this.hintId] : [];
    const all = [...theirs, ...ours];

    if (all.length > 0) control.setAttribute('aria-describedby', all.join(' '));
    else control.removeAttribute('aria-describedby');
  }
}
