import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Moves keyboard and screen-reader users to the first field that blocked a submit.
 * Field components update their ARIA state during the same change-detection pass,
 * so the lookup runs in a microtask after the submit handler has marked controls.
 */
@Directive({
  selector: 'form[acAccessibleForm]',
  standalone: true,
})
export class AccessibleFormDirective {
  private readonly host = inject<ElementRef<HTMLFormElement>>(ElementRef);

  @HostListener('submit')
  handleSubmit() {
    queueMicrotask(() => {
      const firstInvalid = this.host.nativeElement.querySelector<HTMLElement>(
        '[aria-invalid="true"], input:invalid, select:invalid, textarea:invalid',
      );
      firstInvalid?.focus();
    });
  }
}
