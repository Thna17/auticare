import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HospitalManagementApi } from './hospital-management.api';
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section>
    <p class="eyebrow">Hospital workspace</p>
    <h1>{{ name() }}</h1>
    <p>Manage your team and appointment requests.</p>
    <div class="cards">
      <article>
        <strong>{{ requested() }}</strong
        ><span>Requested</span>
      </article>
      <article>
        <strong>{{ confirmed() }}</strong
        ><span>Confirmed</span>
      </article>
      <article>
        <strong>{{ completed() }}</strong
        ><span>Completed</span>
      </article>
    </div>
  </section>`,
  styles: [
    `
      :host {
        display: block;
      }
      .eyebrow {
        color: #3d6375;
        font-weight: 700;
        text-transform: uppercase;
      }
      .cards {
        display: flex;
        gap: 16px;
        margin-top: 24px;
      }
      .cards article {
        background: #fff;
        border: 1px solid #dbe5e8;
        border-radius: 14px;
        padding: 24px;
        min-width: 140px;
      }
      .cards strong {
        display: block;
        font-size: 2rem;
      }
      .cards span {
        color: #567;
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
