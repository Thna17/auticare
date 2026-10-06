import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** An ellipsis stands in for a run of skipped pages. */
type PageSlot = number | 'gap';

/**
 * Page control for every paginated list.
 *
 * Promoted out of the screening feature, whose own comment called it "a
 * reasonable shared/ promotion candidate". Three separate pagers had grown by
 * then — screening history, the enrollment table and the appointment list — each
 * with its own markup, styling and accessible naming. Paginating five more lists
 * would have made eight.
 *
 * The page numbers are windowed. The enrollment table rendered one button per
 * page from `[].constructor(totalPages())`, so a school with 600 students got 60
 * buttons in a row; this shows at most seven slots with ellipses for the gaps.
 */
@Component({
  selector: 'ac-ui-pagination',
  standalone: true,
  template: `
    <nav class="pager" [attr.aria-label]="label()">
      <p class="status" aria-live="polite">
        @if (showRange()) {
          Showing {{ firstRow() }}–{{ lastRow() }} of {{ total() }}{{ nounSuffix() }} · page
          {{ page() }} of {{ totalPages() }}
        } @else {
          Page {{ page() }} of {{ totalPages() }}
        }
      </p>

      @if (totalPages() > 1) {
        <div class="controls">
          <button
            type="button"
            class="step"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
          >
            Previous
          </button>

          @for (slot of slots(); track $index) {
            @if (slot === 'gap') {
              <span class="gap" aria-hidden="true">…</span>
            } @else {
              <button
                type="button"
                class="num"
                [class.current]="slot === page()"
                [attr.aria-label]="'Page ' + slot"
                [attr.aria-current]="slot === page() ? 'page' : null"
                (click)="pageChange.emit(slot)"
              >
                {{ slot }}
              </button>
            }
          }

          <button
            type="button"
            class="step"
            [disabled]="page() >= totalPages()"
            (click)="pageChange.emit(page() + 1)"
          >
            Next
          </button>
        </div>
      }
    </nav>
  `,
  styles: [
    `
      .pager {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ac-space-4);
        flex-wrap: wrap;
        margin-top: var(--ac-space-5);
      }

      .status {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .controls {
        display: flex;
        align-items: center;
        gap: var(--ac-space-2);
        flex-wrap: wrap;
      }

      .step,
      .num {
        min-height: 40px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        cursor: pointer;
        font-size: var(--ac-type-meta);
      }

      .step {
        padding: 0 var(--ac-space-4);
      }

      /* Square, and wide enough for three digits without reflowing the row. */
      .num {
        min-width: 40px;
        padding: 0 var(--ac-space-2);
      }

      .step:hover:not(:disabled),
      .num:hover:not(.current) {
        border-color: var(--ac-color-action);
      }

      .step:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .num.current {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-bold);
      }

      .gap {
        color: var(--ac-color-text-muted);
        padding: 0 var(--ac-space-1);
      }

      @media (max-width: 640px) {
        .pager {
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiPaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();

  /**
   * Row count across all pages, and rows per page. Supply both to get a
   * "Showing 21–25 of 25" range; omit them for a bare "Page X of Y".
   *
   * perPage is taken rather than derived: total/totalPages does not give it back
   * (25 rows over 2 pages is ceil(25/2) = 13, not the page size of 20), and the
   * API's pagination meta carries `limit` already.
   */
  readonly total = input<number | null>(null);
  readonly perPage = input<number | null>(null);

  /** Plural noun for the status line, e.g. "students". */
  readonly itemNoun = input<string | null>(null);

  /** Distinguishes this pager from others on the same page for screen readers. */
  readonly label = input<string>('Pagination');

  readonly pageChange = output<number>();

  protected readonly showRange = computed(() => {
    const total = this.total();
    const perPage = this.perPage();
    return total !== null && perPage !== null && perPage > 0;
  });

  protected readonly nounSuffix = computed(() => {
    const noun = this.itemNoun();
    return noun === null ? '' : ` ${noun}`;
  });

  // Derived from the page, so the range stays right on a partly-full last page.
  protected readonly firstRow = computed(() => {
    const total = this.total() ?? 0;
    if (total === 0) return 0;
    return (this.page() - 1) * (this.perPage() ?? 0) + 1;
  });

  protected readonly lastRow = computed(() =>
    Math.min(this.page() * (this.perPage() ?? 0), this.total() ?? 0),
  );

  protected readonly slots = computed<readonly PageSlot[]>(() => {
    const last = this.totalPages();
    const current = this.page();
    if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);

    const window = new Set<number>([1, last, current]);
    if (current - 1 > 1) window.add(current - 1);
    if (current + 1 < last) window.add(current + 1);
    // Keep the row a steady width near the ends, where the window is one-sided.
    if (current <= 3) [2, 3, 4].forEach((page) => window.add(page));
    if (current >= last - 2) [last - 3, last - 2, last - 1].forEach((page) => window.add(page));

    const pages = [...window].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b);
    const slots: PageSlot[] = [];
    pages.forEach((page, index) => {
      const previous = pages[index - 1];
      if (previous !== undefined && page - previous > 1) slots.push('gap');
      slots.push(page);
    });
    return slots;
  });
}
