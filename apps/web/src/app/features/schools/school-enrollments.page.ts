import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import type { SchoolChildEnrollmentResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';

@Component({
  standalone: true,
  imports: [SlicePipe, UiCardComponent],
  template: `
    <section class="page-header">
      <p class="eyebrow">School workspace</p>
      <h1>Enrolled children</h1>
      <p>Review children currently connected to your school.</p>
    </section>

    @if (loading()) {
      <ac-ui-card><p>Loading enrollments...</p></ac-ui-card>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    } @else if (!enrollments().length) {
      <ac-ui-card><p>No active child enrollments are available.</p></ac-ui-card>
    } @else {
      <section class="grid" aria-label="Enrolled children">
        @for (enrollment of enrollments(); track enrollment.id) {
          <ac-ui-card>
            <h2>Child {{ enrollment.childId }}</h2>
            <p class="meta">{{ enrollment.status }}</p>
            <p>Started {{ enrollment.startedAt | slice: 0 : 10 }}</p>
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
export class SchoolEnrollmentsPage implements OnInit {
  private readonly api = inject(SchoolsApi);
  readonly enrollments = signal<readonly SchoolChildEnrollmentResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.api.listEnrollments().subscribe({
      next: (enrollments) => {
        this.enrollments.set(enrollments);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Enrollments could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
