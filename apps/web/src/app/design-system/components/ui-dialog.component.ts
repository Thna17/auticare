import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  booleanAttribute,
  inject,
  input,
  output,
  viewChild,
  type AfterViewInit,
  type OnDestroy,
} from '@angular/core';

let dialogUidCounter = 0;
const openDialogs: UiDialogComponent[] = [];

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog and drawer primitive meeting WCAG 2.1 AA requirements:
 * - 2.1.2 No Keyboard Trap: Traps Tab / Shift+Tab within the dialog while active.
 * - 2.4.3 Focus Order: Sets initial focus inside the dialog and restores focus to
 *   the triggering element upon dismissal.
 * - 4.1.2 Name, Role, Value: role="dialog" or "alertdialog", aria-modal="true",
 *   aria-labelledby pointing to title, and aria-describedby pointing to description.
 *
 * Supports centered modals and slide-out drawers.
 */
@Component({
  selector: 'ac-ui-dialog',
  standalone: true,
  template: `
    <div
      class="dialog-backdrop"
      [class.dialog-backdrop--drawer]="variant() === 'drawer'"
      (click)="onBackdropClick($event)"
    >
      <div
        #panel
        class="dialog-panel"
        [class.dialog-panel--drawer]="variant() === 'drawer'"
        [class.dialog-panel--sm]="size() === 'sm'"
        [class.dialog-panel--md]="size() === 'md'"
        [class.dialog-panel--lg]="size() === 'lg'"
        [class.dialog-panel--full]="size() === 'full'"
        [attr.role]="dialogRole()"
        [attr.aria-modal]="true"
        [attr.aria-labelledby]="heading() ? titleId : null"
        [attr.aria-label]="!heading() && ariaLabel() ? ariaLabel() : null"
        [attr.aria-describedby]="description() ? descriptionId : null"
        tabindex="-1"
        (click)="$event.stopPropagation()"
      >
        <header class="dialog-header">
          <div class="header-titles">
            @if (heading()) {
              <h2 [id]="titleId" class="dialog-title">{{ heading() }}</h2>
            }
            @if (description()) {
              <p [id]="descriptionId" class="dialog-description">{{ description() }}</p>
            }
            <ng-content select="[dialogHeader]" />
          </div>

          @if (showCloseButton()) {
            <button
              type="button"
              class="dialog-close-btn"
              aria-label="Close dialog"
              (click)="dismiss()"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          }
        </header>

        <div class="dialog-content">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .dialog-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: var(--ac-color-overlay);
        display: grid;
        place-items: center;
        padding: var(--ac-space-4);
        overflow-y: auto;
      }

      .dialog-backdrop--drawer {
        place-items: stretch end;
        padding: 0;
      }

      .dialog-panel {
        width: 100%;
        max-width: 520px;
        background: var(--ac-color-surface);
        border-radius: var(--ac-radius-lg);
        box-shadow: var(--ac-shadow-md);
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - var(--ac-space-8));
        overflow: hidden;
        outline: none;
        animation: ac-dialog-pop var(--ac-motion-dialog);
      }

      .dialog-panel--sm {
        max-width: 400px;
      }

      .dialog-panel--md {
        max-width: 540px;
      }

      .dialog-panel--lg {
        max-width: 680px;
      }

      .dialog-panel--full {
        max-width: 960px;
      }

      .dialog-panel--drawer {
        max-width: 480px;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        box-shadow: var(--ac-shadow-lg);
        animation: ac-drawer-slide var(--ac-motion-dialog);
      }

      @keyframes ac-dialog-pop {
        from {
          opacity: 0;
          transform: scale(0.96);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes ac-drawer-slide {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .dialog-panel,
        .dialog-panel--drawer {
          animation: none;
        }
      }

      .dialog-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--ac-space-3);
        padding: var(--ac-space-5) var(--ac-space-6) var(--ac-space-3);
      }

      .header-titles {
        flex: 1;
        min-width: 0;
      }

      .dialog-title {
        margin: 0;
        font-size: var(--ac-type-card-title);
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-bold);
        line-height: var(--ac-line-tight);
      }

      .dialog-description {
        margin: var(--ac-space-1) 0 0;
        font-size: var(--ac-type-label);
        color: var(--ac-color-text-muted);
        line-height: var(--ac-line-body);
      }

      .dialog-close-btn {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: var(--ac-radius-sm);
        border: none;
        background: transparent;
        color: var(--ac-color-text-muted);
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .dialog-close-btn:hover {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
      }

      .dialog-close-btn:focus-visible {
        outline: 2px solid var(--ac-color-action);
        outline-offset: 2px;
      }

      .dialog-content {
        padding: var(--ac-space-3) var(--ac-space-6) var(--ac-space-5);
        overflow-y: auto;
        flex: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDialogComponent implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly uid = `ac-dialog-${dialogUidCounter++}`;
  protected readonly titleId = `${this.uid}-title`;
  protected readonly descriptionId = `${this.uid}-desc`;

  /**
   * Named `heading`, not `title`. An input called `title` shadows the global HTML
   * attribute: Angular binds the input AND leaves `title="…"` on the host, which
   * renders as a native tooltip and leaks in as the dialog's accessible
   * description. Likewise `role` below — a `role` input left role="alertdialog"
   * on the host as well as the panel, so two nested elements both claimed to be
   * the dialog. Both were caught by the Playwright strict-mode check resolving
   * two elements for one role.
   */
  readonly heading = input<string>('');
  readonly description = input<string | null>(null);
  readonly dialogRole = input<'dialog' | 'alertdialog'>('dialog');
  readonly variant = input<'modal' | 'drawer'>('modal');
  readonly size = input<'sm' | 'md' | 'lg' | 'full'>('md');
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  readonly showCloseButton = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);

  readonly close = output<void>();

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private previousActiveElement: HTMLElement | null = null;
  private previousBodyOverflow: string | null = null;
  private readonly inertedElements: HTMLElement[] = [];

  ngAfterViewInit() {
    this.previousActiveElement = document.activeElement as HTMLElement | null;

    // Lock body scrolling while open
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.inertBackground();
    openDialogs.push(this);

    // Move initial focus into the dialog
    queueMicrotask(() => {
      this.trapInitialFocus();
    });
  }

  ngOnDestroy() {
    const stackIndex = openDialogs.lastIndexOf(this);
    if (stackIndex >= 0) openDialogs.splice(stackIndex, 1);

    // Restore body scrolling
    if (this.previousBodyOverflow !== null) {
      document.body.style.overflow = this.previousBodyOverflow;
    } else {
      document.body.style.removeProperty('overflow');
    }

    for (const element of this.inertedElements) element.removeAttribute('inert');

    // Restore focus to trigger
    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      this.previousActiveElement.focus();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (openDialogs.at(-1) !== this) return;

    if (event.key === 'Escape' && this.closeOnEscape()) {
      event.preventDefault();
      event.stopPropagation();
      this.dismiss();
      return;
    }

    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
  }

  protected onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && this.closeOnBackdrop()) {
      this.dismiss();
    }
  }

  protected dismiss() {
    this.close.emit();
  }

  private trapInitialFocus() {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;

    // Look for explicit autofocus element first
    const autoFocusEl = panel.querySelector<HTMLElement>('[autofocus], [acAutofocus]');
    if (autoFocusEl) {
      autoFocusEl.focus();
      return;
    }

    // Otherwise find first interactive control
    const focusable = this.getFocusableElements(panel);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      panel.focus();
    }
  }

  private handleTabKey(event: KeyboardEvent) {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;

    const focusable = this.getFocusableElements(panel);
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey) {
      if (current === first || !panel.contains(current)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (current === last || !panel.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    return elements.filter((el) => {
      // Must be visible and not disabled
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  }

  private inertBackground() {
    let activeBranch: HTMLElement = this.elementRef.nativeElement;
    let parent = activeBranch.parentElement;

    while (parent && parent !== document.body) {
      for (const sibling of Array.from(parent.children)) {
        if (!(sibling instanceof HTMLElement) || sibling === activeBranch) continue;
        if (!sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          this.inertedElements.push(sibling);
        }
      }
      activeBranch = parent;
      parent = parent.parentElement;
    }
  }
}
