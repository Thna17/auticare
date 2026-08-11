import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { DoctorResponse } from '@auticare/contracts';
import { HospitalManagementApi } from './hospital-management.api';
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section>
    <h1>Doctors</h1>
    <p>Add specialists available for appointment booking.</p>
    <form (submit)="add($event)">
      <input #name required placeholder="Full name" /><input
        #specialty
        required
        placeholder="Specialty"
      /><button>Add doctor</button>
    </form>
    <p class="error">{{ error() }}</p>
    <ul>
      @for (doctor of doctors(); track doctor.id) {
        <li>
          <span
            ><strong>{{ doctor.fullName }}</strong> · {{ doctor.specialty }}</span
          ><button (click)="remove(doctor.id)">Remove</button>
        </li>
      } @empty {
        <li>No doctors added yet.</li>
      }
    </ul>
  </section>`,
  styles: [
    `
      form {
        display: flex;
        gap: 10px;
        margin: 20px 0;
      }
      input {
        padding: 10px;
        border: 1px solid #b8c9ce;
        border-radius: 8px;
      }
      button {
        border: 0;
        border-radius: 8px;
        padding: 9px 12px;
        background: #3d6375;
        color: #fff;
      }
      li {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #dbe5e8;
        padding: 13px 0;
      }
      .error {
        color: #b42318;
      }
    `,
  ],
})
export class HospitalDoctorsPage {
  private readonly api = inject(HospitalManagementApi);
  readonly doctors = signal<readonly DoctorResponse[]>([]);
  readonly error = signal('');
  constructor() {
    this.load();
  }
  load() {
    this.api
      .doctors()
      .subscribe({
        next: (v) => this.doctors.set(v),
        error: () => this.error.set('Could not load doctors.'),
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
    this.api
      .deleteDoctor(id)
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('Doctors with appointment history cannot be removed.'),
      });
  }
}
