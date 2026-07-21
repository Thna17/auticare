import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SchoolActivityReportResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';

@Component({
  standalone: true,
  imports: [RouterLink, UiCardComponent],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">School reports</p>
        <h1>Activity reports</h1>
        <p>Track shared observations between families, schools, and administrators.</p>
      </div>
      @if (canCreate()) {
        <a routerLink="/schools/reports/new">Create report</a>
      }
    </section>

    @if (loading()) {
      <ac-ui-card><p>Loading reports...</p></ac-ui-card>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    } @else if (!reports().length) {
      <ac-ui-card><p>No activity reports are available yet.</p></ac-ui-card>
    } @else {
      <section class="grid" aria-label="Activity reports">
        @for (report of reports(); track report.id) {
          <ac-ui-card>
            <h2>{{ report.title }}</h2>
            <p class="meta">{{ report.activityDate }} · Child {{ report.childId }}</p>
            <p>{{ report.summary }}</p>
          </ac-ui-card>
        }
      </section>
    }
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: start;
        margin-bottom: 28px;
      }
      .page-header a {
        border-radius: 8px;
        background: #3d6375;
        color: #ffffff;
        padding: 12px 16px;
        text-decoration: none;
        font-weight: 800;
      }
      .eyebrow,
      .meta {
        color: #3d6375;
        font-weight: 800;
      }
      h1 {
        margin: 0;
        font-size: 40px;
      }
      h2 {
        margin-top: 0;
      }
      .grid {
        display: grid;
        gap: 18px;
      }
      .error {
        color: #a23434;
        font-weight: 700;
      }
      @media (max-width: 720px) {
        .page-header {
          display: block;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolReportsPage implements OnInit {
  private readonly api = inject(SchoolsApi);
  private readonly auth = inject(AuthService);
  readonly canCreate = () => this.auth.parent()?.role === 'SCHOOL';
  readonly reports = signal<readonly SchoolActivityReportResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.api.listReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Reports could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
