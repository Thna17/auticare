import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'ac-ui-button',
  standalone: true,
  template:
    '<button class="button" [class.secondary]="variant() === \'secondary\'" [class.destructive]="variant() === \'destructive\'" [type]="type()" [disabled]="disabled()"><ng-content /></button>',
  styles: [
    '.button{min-height:44px;border:0;border-radius:var(--ac-radius-md);padding:0 var(--ac-space-4);background:var(--ac-color-text-dark);color:white;font-weight:var(--ac-font-weight-semibold);cursor:pointer}.button.secondary{background:var(--ac-color-sage-light);color:var(--ac-color-text)}.button.destructive{background:var(--ac-color-attention);color:white}.button:focus-visible{outline:3px solid var(--ac-color-warning);outline-offset:2px}.button:disabled{opacity:.6;cursor:not-allowed}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'destructive'>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
}
