import { inject, Injectable, signal } from '@angular/core';
import type { ChildResponse } from '@auticare/contracts';
import { ChildrenApi } from '../data-access/children.api';
@Injectable({ providedIn: 'root' })
export class ChildrenFacade {
  private readonly api = inject(ChildrenApi);
  readonly children = signal<readonly ChildResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Children could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
