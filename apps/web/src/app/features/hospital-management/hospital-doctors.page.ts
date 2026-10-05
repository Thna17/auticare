import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { DoctorResponse } from '@auticare/contracts';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { HospitalManagementApi } from './hospital-management.api';

@Component({
  standalone: true,
  imports: [UiEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <span>Hospital</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Doctors</span>
    </nav>

    <section class="page-header">
      <div>
        <h1>Doctors</h1>
        <p>Add the specialists available for families to book hospital appointments with.</p>
      </div>
    </section>

    <section class="list-section">
      <form class="add-form" (submit)="add($event)">
        <label class="field">
          <span>Full name</span>
          <input #name required placeholder="Dr. Jane Smith" />
        </label>
        <label class="field">
          <span>Specialty</span>
          <input #specialty required placeholder="Pediatrician" />
        </label>
        <button type="submit" class="add-button">Add doctor</button>
      </form>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="status" aria-live="polite">Loading doctors...</p>
      } @else if (doctors().length === 0) {
        <ac-ui-empty-state
          title="No doctors added yet"
          message="Add your first specialist so families can request appointments with them."
        />
      } @else {
        <ul class="doctor-list">
          @for (doctor of doctors(); track doctor.id) {
            <li class="doctor-row">
              <div>
                <p class="doctor-name">{{ doctor.fullName }}</p>
                <span class="specialty-badge">{{ doctor.specialty }}</span>
              </div>
              <button type="button" class="remove-button" (click)="remove(doctor.id)">
                Remove
              </button>
            </li>
          }
        </ul>
      }
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

      .list-section {
        border: 1px solid #dde5e4;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: var(--ac-shadow-sm);
        padding: var(--ac-space-6);
      }

      .add-form {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 12px;
        margin-bottom: 22px;
        padding-bottom: 22px;
        border-bottom: 1px solid #eef1f0;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1 1 200px;
      }

      .field span {
        color: #294a5a;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
      }

      .field input {
        min-height: 44px;
        border: 1.5px solid #dde5e4;
        border-radius: 10px;
        padding: 0 14px;
        font-size: var(--ac-type-meta);
        color: #001e2b;
      }

      .field input:focus-visible {
        outline: 2px solid #294a5a;
        outline-offset: 1px;
      }

      .add-button {
        min-height: 44px;
        border: 0;
        border-radius: 10px;
        background: #294a5a;
        color: #ffffff;
        padding: 0 20px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      .add-button:hover {
        background: #1c3644;
      }

      .status,
      .error {
        border-radius: 12px;
        padding: 16px;
        background: #e8f6ff;
        color: #163f52;
        margin-bottom: 16px;
      }

      .error {
        background: #ffdad6;
        color: #93000a;
      }

      .doctor-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .doctor-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        border: 1px solid #eef1f0;
        border-radius: 10px;
        padding: 14px 16px;
      }

      .doctor-name {
        margin: 0 0 6px;
        color: #001e2b;
        font-weight: var(--ac-font-weight-semibold);
      }

      .specialty-badge {
        display: inline-block;
        border-radius: 999px;
        background: var(--ac-color-sage-light);
        color: #546343;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
      }

      .remove-button {
        min-height: 38px;
        border: 1.5px solid #dde5e4;
        border-radius: 10px;
        background: #ffffff;
        color: #b91c1c;
        padding: 0 14px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      .remove-button:hover {
        border-color: #b91c1c;
        background: #fee2e2;
      }

      @media (max-width: 640px) {
        .add-form {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class HospitalDoctorsPage {
  private readonly api = inject(HospitalManagementApi);
  readonly doctors = signal<readonly DoctorResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api.doctors().subscribe({
      next: (v) => {
        this.doctors.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load doctors.');
        this.loading.set(false);
      },
    });
  }
  add(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const inputs = form.querySelectorAll('input');
    this.api.createDoctor({ fullName: inputs[0]!.value, specialty: inputs[1]!.value }).subscribe({
      next: () => {
        form.reset();
        this.load();
      },
      error: () => this.error.set('Could not add doctor.'),
    });
  }
  remove(id: string) {
    this.api.deleteDoctor(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Doctors with appointment history cannot be removed.'),
    });
  }
}
