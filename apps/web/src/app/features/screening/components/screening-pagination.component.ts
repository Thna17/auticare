import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Minimal prev/next pager. No reusable pagination component existed in the app
 * (the schools listing has none), so this is a new minimal version. Generic and
 * self-contained aside from the `--scr-*` custom properties it inherits from the
 * page host — a reasonable shared/ promotion candidate.
 */
@Component({
  selector: 'ac-screening-pagination',
  standalone: true,
  template: `
    <nav class="pager" aria-label="Pagination">
      <button
        type="button"
        class="pg-btn"
        [disabled]="page() <= 1"
        (click)="pageChange.emit(page() - 1)"
        aria-label="Previous page"
      >
        ‹
      </button>
      <span class="pg-status">Page {{ page() }} of {{ totalPages() }}</span>
      <button
        type="button"
        class="pg-btn"
        [disabled]="page() >= totalPages()"
        (click)="pageChange.emit(page() + 1)"
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  `,
  styles: [
    `
      .pager {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
      }
      .pg-btn {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        border: 2px solid var(--scr-banner-border);
        background: var(--scr-surface);
        color: var(--scr-teal);
        font-size: 20px;
        font-weight: 800;
        cursor: pointer;
        line-height: 1;
      }
      .pg-btn:hover:not(:disabled) {
        border-color: var(--scr-avatar-bg);
      }
      .pg-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .pg-status {
        color: var(--scr-text-muted);
        font-weight: 700;
        font-size: 14px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreeningPaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
}
