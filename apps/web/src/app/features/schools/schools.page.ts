import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { SchoolResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';

@Component({
  standalone: true,
  imports: [UiCardComponent],
  template: `
    <section class="page-header">
      <p class="eyebrow">School directory</p>
      <h1>Schools</h1>
      <p>Browse inclusive school support options available to families.</p>
    </section>

    @if (loading()) {
      <ac-ui-card><p>Loading schools...</p></ac-ui-card>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    } @else if (!schools().length) {
      <ac-ui-card><p>No schools are available yet.</p></ac-ui-card>
    } @else {
      <section class="grid" aria-label="School directory">
        @for (school of schools(); track school.id) {
          <ac-ui-card>
            <h2>{{ school.name }}</h2>
            <p class="meta">{{ school.city }}</p>
            <p>{{ school.address }}</p>
            @if (school.description) {
              <p>{{ school.description }}</p>
            }
          </ac-ui-card>
        }
      </section>
    }
  `,
  styles: [
    `
      .page-header {
        max-width: 760px;
        margin-bottom: 28px;
      }
      .eyebrow,
      .meta {
        color: #3d6375;
        font-weight: var(--ac-font-weight-bold);
      }
      h1 {
        margin: 0;
        font-size: var(--ac-type-page-title);
      }
      h2 {
        margin-top: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
      }
      .error {
        color: #a23434;
        font-weight: var(--ac-font-weight-semibold);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolsPage implements OnInit {
  private readonly api = inject(SchoolsApi);
  readonly schools = signal<readonly SchoolResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.api.listSchools().subscribe({
      next: (schools) => {
        this.schools.set(schools);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Schools could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
