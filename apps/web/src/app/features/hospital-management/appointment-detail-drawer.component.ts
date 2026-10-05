import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { AppointmentResponse } from '@auticare/contracts';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { UiButtonComponent } from '../../design-system/components/ui-button.component';
import { statusPresentation, statusTone } from '../appointments/appointments.types';

/**
 * Right-side drawer for "view details" on an appointment request.
 *
 * NOTE on scope: the brief asks for patient medical notes and contact
 * info here. `AppointmentResponse` / `ChildResponse` (see
 * @auticare/contracts) do not currently expose a phone, email, or
 * structured medical/allergy record for the child on this endpoint —
 * only `reason` (the visit reason submitted at booking). Rather than
 * fabricate fields the API doesn't return, this drawer shows what is
 * genuinely available today and clearly labels the rest as pending a
 * backend addition, so nobody mistakes an empty state for "no allergies
 * on file" when it actually means "not wired up yet".
 */
@Component({
  standalone: true,
  selector: 'ac-appointment-detail-drawer',
  imports: [UiBadgeComponent, UiButtonComponent],
  template: `
    <div class="backdrop" (click)="close.emit()">
      <aside
        class="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-drawer-title"
        (click)="$event.stopPropagation()"
      >
        <header class="drawer-header">
          <div>
            <p class="eyebrow">Appointment request</p>
            <h2 id="detail-drawer-title">{{ appointment().childName ?? 'Patient TBD' }}</h2>
          </div>
          <button type="button" class="close-button" aria-label="Close" (click)="close.emit()">
            &times;
          </button>
        </header>

        <ac-ui-badge [tone]="statusTone[appointment().status]">
          {{ statusPresentation[appointment().status].label }}
        </ac-ui-badge>

        <section class="drawer-section">
          <h3>Visit details</h3>
          <dl class="detail-list">
            <div>
              <dt>Hospital</dt>
              <dd>{{ appointment().hospitalName }}</dd>
            </div>
            <div>
              <dt>Doctor</dt>
              <dd>{{ appointment().doctorName ?? 'Unassigned' }}</dd>
            </div>
            <div>
              <dt>Date &amp; time</dt>
              <dd>{{ formattedDate() }}</dd>
            </div>
          </dl>
        </section>

        <section class="drawer-section">
          <h3>Reason for visit</h3>
          <p class="body-text">{{ appointment().reason ?? 'No reason provided at booking.' }}</p>
        </section>

        <section class="drawer-section">
          <h3>Contact &amp; medical notes</h3>
          <p class="body-text muted">
            Not available from this view yet — the appointments API does not currently return the
            patient's contact details or medical record here. This section is reserved so it can be
            wired up once that endpoint exists, rather than showing placeholder data.
          </p>
        </section>

        <section class="drawer-section">
          <h3>History with this hospital</h3>
          @if (history().length === 0) {
            <p class="body-text muted">No other appointments on file.</p>
          } @else {
            <ul class="history-list">
              @for (item of history(); track item.id) {
                <li>
                  <span>{{ formattedShortDate(item.scheduledAt) }}</span>
                  <ac-ui-badge [tone]="statusTone[item.status]">
                    {{ statusPresentation[item.status].label }}
                  </ac-ui-badge>
                </li>
              }
            </ul>
          }
        </section>

        @if (appointment().status === 'REQUESTED') {
          <footer class="drawer-footer">
            <ac-ui-button variant="destructive" (click)="reject.emit()">Reject</ac-ui-button>
            <ac-ui-button variant="primary" (click)="approve.emit()">Approve</ac-ui-button>
          </footer>
        }
      </aside>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 55;
        background: rgb(0 30 43 / 0.35);
        display: flex;
        justify-content: flex-end;
      }

      .drawer {
        width: 100%;
        max-width: 480px;
        height: 100%;
        overflow-y: auto;
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .eyebrow {
        margin: 0 0 4px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      h2 {
        margin: 0;
        font-size: var(--ac-type-card-title);
        color: #001e2b;
      }

      .close-button {
        border: 0;
        background: none;
        font-size: 22px;
        line-height: 1;
        color: var(--ac-color-text-muted);
        cursor: pointer;
      }

      .drawer-section h3 {
        margin: 0 0 10px;
        font-size: var(--ac-type-label);
        color: #001e2b;
      }

      .detail-list {
        display: grid;
        gap: 8px;
        margin: 0;
      }

      .detail-list div {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      dt {
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      dd {
        margin: 0;
        font-weight: var(--ac-font-weight-medium);
        text-align: right;
      }

      .body-text {
        margin: 0;
        color: var(--ac-color-text);
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
      }

      .body-text.muted {
        color: var(--ac-color-text-muted);
        font-style: italic;
      }

      .history-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }

      .history-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--ac-type-meta);
      }

      .drawer-footer {
        margin-top: auto;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 16px;
        border-top: var(--ac-border-subtle);
      }

      @media (max-width: 640px) {
        .drawer {
          max-width: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetailDrawerComponent {
  readonly appointment = input.required<AppointmentResponse>();
  readonly allAppointments = input<readonly AppointmentResponse[]>([]);
  readonly close = output<void>();
  readonly approve = output<void>();
  readonly reject = output<void>();

  protected readonly statusPresentation = statusPresentation;
  protected readonly statusTone = statusTone;

  protected readonly history = computed(() =>
    this.allAppointments()
      .filter((a) => a.childId === this.appointment().childId && a.id !== this.appointment().id)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
  );

  protected formattedDate(): string {
    return new Date(this.appointment().scheduledAt).toLocaleString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  protected formattedShortDate(scheduledAt: string): string {
    return new Date(scheduledAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
