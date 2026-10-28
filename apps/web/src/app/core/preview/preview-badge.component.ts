import { ChangeDetectionStrategy, Component } from '@angular/core';
import { previewRole, setPreviewRole } from './preview-mode';

/** A small corner badge while preview mode is on, so sample data is never mistaken for real. */
@Component({
  selector: 'ac-preview-badge',
  standalone: true,
  template: `
    @if (role) {
      <aside class="badge" role="status">
        <span>Preview mode · {{ role }}</span>
        <a href="/preview">Switch</a>
        <button type="button" (click)="exit()">Exit</button>
      </aside>
    }
  `,
  styles: [
    `
      .badge {
        position: fixed;
        left: 16px;
        bottom: 16px;
        z-index: 9998;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 10px 8px 14px;
        border-radius: 999px;
        background: var(--ac-color-text-strong);
        color: var(--ac-color-surface);
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 10px 30px -10px
          color-mix(in srgb, var(--ac-color-text-strong) 60%, transparent);
      }

      a,
      button {
        color: inherit;
        font: inherit;
      }

      button {
        padding: 4px 12px;
        border: 0;
        border-radius: 999px;
        background: color-mix(in srgb, var(--ac-color-surface) 20%, transparent);
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewBadgeComponent {
  protected readonly role = previewRole();

  protected exit(): void {
    setPreviewRole(null);
    window.location.assign('/preview');
  }
}
