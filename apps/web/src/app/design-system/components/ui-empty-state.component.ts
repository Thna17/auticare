import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'ac-ui-empty-state',
  standalone: true,
  template: '<div class="empty"><h2>{{ title() }}</h2><p>{{ message() }}</p></div>',
  styles: [
    '.empty{border:var(--ac-border-subtle);border-radius:var(--ac-radius-md);padding:var(--ac-space-6);background:var(--ac-color-sage-light)}h2{font-size:1.1rem;margin:0 0 var(--ac-space-2)}p{margin:0;color:var(--ac-color-text-muted)}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiEmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
