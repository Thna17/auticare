import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HospitalManagementApi } from './hospital-management.api';

@Component({
  standalone: true,
  imports: [RouterLink],
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
        color: #66747a;
        font-size: var(--ac-type-meta);
      }

      .breadcrumbs span[aria-current] {
        color: #294a5a;
        font-weight: var(--ac-font-weight-semibold);
      }

      .page-header {
        margin-bottom: 28px;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: #3d6375;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        font-size: var(--ac-type-meta);
      }

      h1 {
        margin: 0 0 8px;
        color: #001e2b;
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
      }

      .page-header p {
        margin: 0;
        max-width: 640px;
        color: #41484b;
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
        border: 1px solid #dde5e4;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-6);
      }

      .stat-label {
        margin: 0 0 8px;
        color: #66747a;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
      }

      .stat-value {
        margin: 0;
        color: #001e2b;
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
        border: 1px solid #dde5e4;
        border-radius: 10px;
        background: #ffffff;
        box-shadow: var(--ac-shadow-sm);
        padding: 20px;
        text-decoration: none;
      }

      .link-card:hover {
        border-color: #8db4c8;
      }

      .link-card h2 {
        margin: 0 0 4px;
        color: #001e2b;
        font-size: var(--ac-type-card-title);
      }

      .link-card p {
        margin: 0;
        color: #66747a;
        font-size: var(--ac-type-meta);
      }

      .link-card span {
        flex: 0 0 auto;
        color: #8db4c8;
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
  constructor() {
    this.api.me().subscribe({ next: (v) => this.name.set(v.hospital.name) });
    this.api.appointments().subscribe({
      next: (v) => {
        this.requested.set(v.filter((a) => a.status === 'REQUESTED').length);
        this.confirmed.set(v.filter((a) => a.status === 'CONFIRMED').length);
        this.completed.set(v.filter((a) => a.status === 'COMPLETED').length);
      },
    });
  }
}
