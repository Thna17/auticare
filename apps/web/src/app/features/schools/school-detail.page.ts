import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { SchoolDetailResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolProfileViewComponent } from './components/school-profile-view.component';

/**
 * Parent-facing, fully READ-ONLY school detail page (/schools/:id). It renders the
 * shared profile view with `editable = false`, so there are no edit affordances of
 * any kind for any role — editing only happens on the school's own /schools/profile
 * page.
 */
@Component({
  standalone: true,
  imports: [RouterLink, UiCardComponent, SchoolProfileViewComponent],
  template: `
    <a class="back" routerLink="/schools">← Back to schools</a>

    @if (loading()) {
      <ac-ui-card><p>Loading school…</p></ac-ui-card>
    } @else if (error()) {
      <ac-ui-card
        ><p class="error" role="alert">{{ error() }}</p></ac-ui-card
      >
    } @else if (school(); as s) {
      <ac-school-profile-view [school]="s" [editable]="false" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 760px;
        margin: 0 auto;
      }
      .back {
        display: inline-block;
        margin-bottom: 18px;
        color: #3d6375;
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }
      .error {
        color: #a23434;
        font-weight: var(--ac-font-weight-semibold);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolsApi);

  readonly school = signal<SchoolDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    const schoolId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!schoolId) {
      this.loading.set(false);
      this.error.set('This school could not be found.');
      return;
    }
    this.api.getSchoolById(schoolId).subscribe({
      next: (school) => {
        this.school.set(school);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This school profile could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
