import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'ac-ui-button',
  standalone: true,
  template:
    '<button class="button" [class.secondary]="variant() === \'secondary\'" [type]="type()" [disabled]="disabled()"><ng-content /></button>',
  styles: [
    '.button{min-height:44px;border:0;border-radius:var(--ac-radius-md);padding:0 var(--ac-space-4);background:var(--ac-color-text-dark);color:white;font-weight:700;cursor:pointer}.button.secondary{background:var(--ac-color-sage-light);color:var(--ac-color-text)}.button:focus-visible{outline:3px solid var(--ac-color-warning);outline-offset:2px}.button:disabled{opacity:.6;cursor:not-allowed}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
}
