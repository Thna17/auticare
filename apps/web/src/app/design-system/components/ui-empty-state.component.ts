import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'ac-ui-empty-state',
  standalone: true,
  // Projected content is optional, so every existing usage is unaffected. It
  // exists so an empty state can offer a next action rather than only explaining
  // the absence — an empty state with nothing to do in it is a dead end.
  template:
    '<div class="empty"><h2>{{ title() }}</h2><p>{{ message() }}</p><div class="actions"><ng-content /></div></div>',
  styles: [
    '.empty{border:var(--ac-border-subtle);border-radius:var(--ac-radius-md);padding:var(--ac-space-6);background:var(--ac-color-sage-light)}h2{font-size:var(--ac-type-card-title);margin:0 0 var(--ac-space-2);font-weight:var(--ac-font-weight-bold)}p{margin:0;color:var(--ac-color-text-muted);line-height:var(--ac-line-body)}.actions:empty{display:none}.actions{margin-top:var(--ac-space-4)}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiEmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
