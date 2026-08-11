import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SchoolResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';
import { availabilityLabel, availabilityTone } from './school-display.util';

@Component({
  standalone: true,
  imports: [RouterLink, UiCardComponent],
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
          <a class="card-link" [routerLink]="['/schools', school.id]">
            <ac-ui-card>
              <div class="card-head">
                <h2>{{ school.name }}</h2>
                @if (school.isVerified) {
                  <span class="verified" title="Verified by AutiCare">✓ Verified</span>
                }
              </div>
              <p class="meta">{{ school.city }}</p>

              <div class="badges">
                @if (school.rating !== null) {
                  <span class="rating">★ {{ school.rating }}</span>
                }
                <span class="avail" [class]="tone(school)">{{ availability(school) }}</span>
                @if (school.studentTeacherRatio) {
                  <span class="ratio">{{ school.studentTeacherRatio }} ratio</span>
                }
              </div>

              @if (school.specializations.length) {
                <div class="pills">
                  @for (item of school.specializations.slice(0, 4); track item) {
                    <span class="pill">{{ item }}</span>
                  }
                  @if (school.specializations.length > 4) {
                    <span class="pill more">+{{ school.specializations.length - 4 }}</span>
                  }
                </div>
              }
            </ac-ui-card>
          </a>
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
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .card-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }
      .card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .meta {
        margin: 0 0 12px;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .rating {
        color: #263238;
        font-weight: var(--ac-font-weight-bold);
        font-size: var(--ac-type-label);
      }
      .ratio {
        color: #66747a;
        font-weight: var(--ac-font-weight-semibold);
        font-size: var(--ac-type-label);
      }
      .verified {
        display: inline-block;
        border-radius: 999px;
        padding: 3px 10px;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        background: #72a675;
        color: #ffffff;
        white-space: nowrap;
      }
      .avail {
        display: inline-block;
        border-radius: 999px;
        padding: 3px 10px;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
      }
      .avail.open {
        background: #e2efe3;
        color: #236b43;
      }
      .avail.wait {
        background: #f6ecd4;
        color: #8a6414;
      }
      .avail.closed {
        background: #eef1f2;
        color: #66747a;
      }
      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;
      }
      .pill {
        border-radius: 999px;
        padding: 4px 10px;
        background: #e8f6ff;
        border: 1px solid #d4e6ef;
        color: #3d6375;
        font-weight: var(--ac-font-weight-bold);
        font-size: var(--ac-type-label);
      }
      .pill.more {
        background: #ffffff;
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

  availability(school: SchoolResponse): string {
    return availabilityLabel(school.availabilityStatus);
  }

  tone(school: SchoolResponse): string {
    return availabilityTone(school.availabilityStatus);
  }

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
