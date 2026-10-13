import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ac-ui-empty-state',
  standalone: true,
  template: `
    <div class="empty" role="status">
      <div class="illustration-slot">
        <ng-content select="[illustration]" />
        <div class="empty-icon" aria-hidden="true">{{ icon() || '📂' }}</div>
      </div>
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
      <div class="actions">
        @if (actionText()) {
          <button type="button" class="empty-primary-btn" (click)="action.emit()">
            @if (actionIcon()) {
              <span class="btn-icon" aria-hidden="true">{{ actionIcon() }}</span>
            }
            <span>{{ actionText() }}</span>
          </button>
        }
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        border: 1.5px dashed var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: var(--ac-space-8) var(--ac-space-6);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
      }

      .illustration-slot {
        display: flex;
        justify-content: center;
        margin-bottom: var(--ac-space-3);
      }

      .illustration-slot:has([illustration]) .empty-icon {
        display: none;
      }

      .empty-icon {
        width: 56px;
        height: 56px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-tint-blue-soft);
        border: 1px solid var(--ac-color-border-info);
        display: grid;
        place-items: center;
        font-size: 24px;
      }

      h2 {
        font-size: var(--ac-type-card-title);
        margin: 0 0 var(--ac-space-2);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      p {
        max-width: 480px;
        margin: 0;
        color: var(--ac-color-text-muted);
        line-height: var(--ac-line-body);
        font-size: var(--ac-type-body);
      }

      .actions:empty {
        display: none;
      }

      .actions {
        margin-top: var(--ac-space-5);
        display: flex;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
        justify-content: center;
      }

      .empty-primary-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--ac-space-2);
        min-height: 42px;
        padding: 0 var(--ac-space-4);
        background: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: var(--ac-radius-md);
        font-family: inherit;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        box-shadow: var(--ac-shadow-xs);
        transition:
          transform var(--ac-motion-fast),
          background var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
      }

      .empty-primary-btn:hover {
        transform: translateY(-1px);
        background: var(--ac-color-ink-charcoal);
        box-shadow: var(--ac-shadow-sm);
      }

      .empty-primary-btn:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
        box-shadow: 0 0 0 3px var(--ac-color-tint-blue);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiEmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly icon = input<string | null>(null);
  readonly actionText = input<string | null>(null);
  readonly actionIcon = input<string | null>(null);
  readonly action = output<void>();
}
