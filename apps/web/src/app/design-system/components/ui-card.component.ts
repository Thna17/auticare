import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'ac-ui-card',
  standalone: true,
  template: '<section class="card"><ng-content /></section>',
  styles: [
    '.card{background:var(--ac-color-surface);border:var(--ac-border-subtle);border-radius:var(--ac-radius-md);box-shadow:var(--ac-shadow-sm);padding:var(--ac-space-6)}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCardComponent {}
