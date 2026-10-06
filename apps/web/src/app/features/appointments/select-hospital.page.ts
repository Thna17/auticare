import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { HospitalResponse } from '@auticare/contracts';
import { HospitalsApi } from '../hospitals/data-access/hospitals.api';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

@Component({
  standalone: true,
  imports: [RouterLink, UiEmptyStateComponent, UiSpinnerComponent],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a routerLink="/appointments">Hospital Appointments</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Choose a hospital</span>
    </nav>

    <h1>Which hospital would you like to visit?</h1>
    <p>Pick a hospital to see its available specialists and request an appointment.</p>

    @if (loading()) {
      <ac-ui-spinner label="Loading hospitals…" />
    } @else if (hospitals().length === 0) {
      <ac-ui-empty-state
        title="No hospitals available yet"
        message="Check back soon, or contact support to add your care provider."
      />
    } @else {
      <ul class="hospital-list">
        @for (hospital of hospitals(); track hospital.id) {
          <li>
            <a class="hospital-card" [routerLink]="['/appointments/hospitals', hospital.id]">
              <div>
                <h2>{{ hospital.name }}</h2>
                <p>{{ hospital.city }} · {{ hospital.address }}</p>
              </div>
              <span aria-hidden="true">›</span>
            </a>
          </li>
        }
      </ul>
    }
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

      .breadcrumbs a {
        color: var(--ac-color-text-muted);
        text-decoration: none;
      }

      .breadcrumbs span[aria-current] {
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
      }

      h1 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
      }

      p {
        margin: 0 0 24px;
        color: var(--ac-color-text-body);
      }

      .status {
        border-radius: 12px;
        padding: 16px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-ink-c);
      }

      .hospital-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .hospital-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        border: 1px solid var(--ac-color-border);
        border-radius: 10px;
        background: var(--ac-color-surface);
        padding: 18px;
        text-decoration: none;
        box-shadow: var(--ac-shadow-sm);
      }

      .hospital-card:hover {
        border-color: var(--ac-color-primary);
      }

      .hospital-card h2 {
        margin: 0 0 4px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-card-title);
      }

      .hospital-card p {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .hospital-card span {
        color: var(--ac-color-primary);
        font-size: 1.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectHospitalPage implements OnInit {
  private readonly hospitalsApi = inject(HospitalsApi);
  protected readonly hospitals = signal<readonly HospitalResponse[]>([]);
  protected readonly loading = signal(true);

  ngOnInit() {
    this.hospitalsApi.listHospitals().subscribe({
      next: (hospitals) => {
        this.hospitals.set(hospitals);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
