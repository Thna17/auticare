import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { AppointmentResponse } from './appointments.types';

@Component({
  standalone: true,
  selector: 'ac-appointment-confirmation',
  template: `
    <div class="confirmation">
      <span class="check-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M5 12.5l4.5 4.5L19 7"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <h2>Appointment confirmed</h2>
      <p class="lead">A confirmation has been sent to your account.</p>

      <dl class="summary">
        <div>
          <dt>Date</dt>
          <dd>{{ formattedDate() }}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{{ formattedTime() }}</dd>
        </div>
        <div>
          <dt>Hospital</dt>
          <dd>{{ appointment().hospitalName }}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{{ appointment().doctorName ?? 'To be assigned' }}</dd>
        </div>
      </dl>

      <button type="button" class="done-button" (click)="done.emit()">Done</button>
    </div>
  `,
  styles: [
    `
      .confirmation {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 8px 4px 4px;
      }

      .check-badge {
        width: 64px;
        height: 64px;
        border-radius: 999px;
        background: #dcfce7;
        color: #15803d;
        display: grid;
        place-items: center;
        margin-bottom: 18px;
      }

      .check-badge svg {
        width: 32px;
        height: 32px;
      }

      h2 {
        margin: 0 0 6px;
        color: #001e2b;
        font-size: var(--ac-type-card-title);
      }

      .lead {
        margin: 0 0 22px;
        color: #66747a;
        font-size: var(--ac-type-meta);
      }

      .summary {
        width: 100%;
        display: grid;
        gap: 12px;
        margin: 0 0 24px;
        border-radius: 12px;
        background: #f0f7fb;
        padding: 18px;
        text-align: left;
      }

      .summary div {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      dt {
        color: #66747a;
        font-size: var(--ac-type-meta);
      }

      dd {
        margin: 0;
        color: #001e2b;
        font-weight: var(--ac-font-weight-semibold);
        text-align: right;
      }

      .done-button {
        width: 100%;
        min-height: 46px;
        border: 0;
        border-radius: 10px;
        background: #294a5a;
        color: #ffffff;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentConfirmationComponent {
  readonly appointment = input.required<AppointmentResponse>();
  readonly done = output<void>();

  protected formattedDate(): string {
    return new Date(this.appointment().scheduledAt).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  protected formattedTime(): string {
    return new Date(this.appointment().scheduledAt).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
