import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HospitalManagementApi } from './hospital-management.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent, UiSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <span aria-current="page">Hospital</span>
    </nav>

    <section class="page-header">
      <div>
        <p class="eyebrow">Hospital workspace</p>
        <h1>{{ name() }}</h1>
        <p>Manage your care team and review incoming appointment requests.</p>
      </div>
    </section>

    @if (loading()) {
      <ac-ui-spinner label="Loading your appointment summary…" />
    } @else if (error(); as problem) {
      <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
      <button type="button" class="retry" (click)="load()">Try again</button>
    } @else {
      <section class="stats" aria-label="Appointment summary">
        <article class="stat-card">
          <p class="stat-label">Pending Review</p>
          <p class="stat-value">{{ requested() }}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Approved</p>
          <p class="stat-value">{{ confirmed() }}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Completed</p>
          <p class="stat-value">{{ completed() }}</p>
        </article>
      </section>
    }

    <section class="quick-links">
      <a class="link-card" routerLink="/hospital/appointments">
        <div>
          <h2>Review appointment requests</h2>
          <p>Approve or decline visits and check each child's reported symptoms.</p>
        </div>
        <span aria-hidden="true">&rsaquo;</span>
      </a>
      <a class="link-card" routerLink="/hospital/doctors">
        <div>
          <h2>Manage your doctors</h2>
          <p>Add or remove the specialists families can book with.</p>
        </div>
        <span aria-hidden="true">&rsaquo;</span>
      </a>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .breadcrumbs {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .breadcrumbs span[aria-current] {
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
      }

      .page-header {
        margin-bottom: 28px;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        font-size: var(--ac-type-meta);
      }

      h1 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
      }

      .page-header p {
        margin: 0;
        max-width: 640px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .stat-card {
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-6);
      }

      .stat-label {
        margin: 0 0 8px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
      }

      .stat-value {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 2rem;
        font-weight: var(--ac-font-weight-bold);
      }

      .quick-links {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }

      .link-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        border: 1px solid var(--ac-color-border);
        border-radius: 10px;
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 20px;
        text-decoration: none;
      }

      .link-card:hover {
        border-color: var(--ac-color-primary);
      }

      .link-card h2 {
        margin: 0 0 4px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-card-title);
      }

      .link-card p {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .link-card span {
        flex: 0 0 auto;
        color: var(--ac-color-primary);
        font-size: 1.5rem;
      }
    `,
  ],
})
export class HospitalDashboardPage {
  private readonly api = inject(HospitalManagementApi);
  readonly name = signal('Hospital dashboard');
  readonly requested = signal(0);
  readonly confirmed = signal(0);
  readonly completed = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  /**
   * The appointments request had no error handler, so a failure left every count
   * at its initial 0 — indistinguishable from a hospital with nothing to review,
   * which is the wrong thing to tell someone triaging requests.
   */
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.me().subscribe({ next: (v) => this.name.set(v.hospital.name) });
    this.api.appointments().subscribe({
      next: (v) => {
        this.requested.set(v.filter((a) => a.status === 'REQUESTED').length);
        this.confirmed.set(v.filter((a) => a.status === 'CONFIRMED').length);
        this.completed.set(v.filter((a) => a.status === 'COMPLETED').length);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Your appointment summary could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
