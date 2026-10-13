import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClientErrorService } from './core/errors/global-error-handler';
import { I18nService } from './core/i18n/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (errorService.errorMessage(); as errorMsg) {
      <aside class="global-error-toast" role="alert" aria-live="assertive">
        <div class="toast-body">
          <span class="toast-icon" aria-hidden="true">⚠️</span>
          <span class="toast-text">{{ errorMsg }}</span>
        </div>
        <div class="toast-actions">
          <button type="button" class="toast-action-btn" (click)="reload()">
            {{ isKhmer() ? 'ផ្ទុកទំព័រឡើងវិញ' : 'Reload' }}
          </button>
          <button
            type="button"
            class="toast-dismiss-btn"
            (click)="errorService.clearError()"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      </aside>
    }
    <router-outlet />
  `,
  styles: [
    `
      .global-error-toast {
        position: fixed;
        top: var(--ac-space-4);
        right: var(--ac-space-4);
        left: var(--ac-space-4);
        max-width: 600px;
        margin: 0 auto;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ac-space-3);
        padding: var(--ac-space-3) var(--ac-space-4);
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
        border: 1px solid var(--ac-color-alert-surface);
        border-radius: var(--ac-radius-lg);
        box-shadow: var(--ac-shadow-md);
        font-family: var(--ac-font-family);
        font-size: var(--ac-font-size-sm);
        line-height: var(--ac-line-body);
      }

      .toast-body {
        display: flex;
        align-items: center;
        gap: var(--ac-space-2);
      }

      .toast-actions {
        display: flex;
        align-items: center;
        gap: var(--ac-space-2);
        flex-shrink: 0;
      }

      .toast-action-btn {
        padding: var(--ac-space-1) var(--ac-space-3);
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-surface);
        border: none;
        border-radius: var(--ac-radius-sm);
        cursor: pointer;
        font-weight: 500;
        font-size: var(--ac-font-size-xs);
        transition: opacity var(--ac-transition-fast);

        &:hover {
          opacity: 0.9;
        }
      }

      .toast-dismiss-btn {
        background: transparent;
        border: none;
        color: var(--ac-color-alert-strong);
        cursor: pointer;
        font-size: var(--ac-font-size-base);
        padding: var(--ac-space-1);
        line-height: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly errorService = inject(ClientErrorService);
  private readonly i18n = inject(I18nService, { optional: true });

  isKhmer(): boolean {
    return (this.i18n?.currentLang?.() ?? 'km') === 'km';
  }

  reload(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
