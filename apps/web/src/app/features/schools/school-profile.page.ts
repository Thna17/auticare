import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { SchoolStaffResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';

@Component({
  standalone: true,
  imports: [UiCardComponent],
  template: `
    <section class="page-header">
      <p class="eyebrow">School workspace</p>
      <h1>School profile</h1>
      <p>Your account is linked to this school staff profile.</p>
    </section>

    @if (loading()) {
      <ac-ui-card><p>Loading profile...</p></ac-ui-card>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    } @else if (profile()) {
      <ac-ui-card>
        <dl>
          <div>
            <dt>School ID</dt>
            <dd>{{ profile()!.schoolId }}</dd>
          </div>
          <div>
            <dt>Staff account ID</dt>
            <dd>{{ profile()!.parentId }}</dd>
          </div>
          <div>
            <dt>Title</dt>
            <dd>{{ profile()!.title || 'School staff' }}</dd>
          </div>
        </dl>
      </ac-ui-card>
    }
  `,
  styles: [
    `
      .page-header {
        max-width: 760px;
        margin-bottom: 28px;
      }
      .eyebrow,
      dt {
        color: #3d6375;
        font-weight: 800;
      }
      h1 {
        margin: 0;
        font-size: 40px;
      }
      dl {
        display: grid;
        gap: 16px;
        margin: 0;
      }
      dd {
        margin: 4px 0 0;
      }
      .error {
        color: #a23434;
        font-weight: 700;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolProfilePage implements OnInit {
  private readonly api = inject(SchoolsApi);
  readonly profile = signal<SchoolStaffResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.api.getMySchoolStaffProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('School profile could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
