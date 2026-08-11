import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HospitalManagementApi } from './hospital-management.api';
import type { AppointmentResponse } from '@auticare/contracts';
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section>
    <h1>Appointments</h1>
    <p>Review requests for your hospital.</p>
    <p class="error">{{ error() }}</p>
    <div class="list">
      @for (item of appointments(); track item.id) {
        <article>
          <div>
            <strong>{{ item.childName ?? 'Child' }}</strong
            ><span>{{ item.doctorName }} · {{ item.scheduledAt | date: 'medium' }}</span
            ><span>{{ item.status }}</span>
          </div>
          @if (item.status === 'REQUESTED') {
            <button (click)="setStatus(item, 'CONFIRMED')">Confirm</button
            ><button class="plain" (click)="setStatus(item, 'CANCELLED')">Cancel</button>
          }
          @if (item.status === 'CONFIRMED') {
            <button (click)="setStatus(item, 'COMPLETED')">Complete</button
            ><button class="plain" (click)="setStatus(item, 'CANCELLED')">Cancel</button>
          }
        </article>
      } @empty {
        <p>No appointments found.</p>
      }
    </div>
  </section>`,
  styles: [
    `
      article {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border: 1px solid #dbe5e8;
        border-radius: 12px;
        margin: 10px 0;
      }
      span {
        display: block;
        color: #567;
        font-size: 0.9rem;
      }
      button {
        margin-left: 8px;
        border: 0;
        border-radius: 8px;
        padding: 8px 12px;
        background: #3d6375;
        color: #fff;
      }
      .plain {
        background: #8b3d3d;
      }
      .error {
        color: #b42318;
      }
    `,
  ],
  imports: [DatePipe],
})
export class HospitalAppointmentsPage {
  private readonly api = inject(HospitalManagementApi);
  readonly appointments = signal<readonly AppointmentResponse[]>([]);
  readonly error = signal('');
  constructor() {
    this.load();
  }
  load() {
    this.api
      .appointments()
      .subscribe({
        next: (v) => this.appointments.set(v),
        error: () => this.error.set('Could not load appointments.'),
      });
  }
  setStatus(item: AppointmentResponse, status: string) {
    this.api
      .changeStatus(item.id, status)
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('This status change is not allowed.'),
      });
  }
}
