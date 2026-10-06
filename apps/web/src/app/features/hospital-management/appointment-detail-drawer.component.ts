import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { AppointmentResponse } from '@auticare/contracts';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { UiButtonComponent } from '../../design-system/components/ui-button.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
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
  imports: [UiBadgeComponent, UiButtonComponent, UiDialogComponent],
  template: `
    <ac-ui-dialog
      [heading]="appointment().childName ?? 'Patient TBD'"
      variant="drawer"
      (close)="close.emit()"
    >
      <div dialogHeader>
        <p class="eyebrow">Appointment request</p>
      </div>

      <div class="badge-wrapper">
        <ac-ui-badge [tone]="statusTone[appointment().status]">
          {{ statusPresentation[appointment().status].label }}
        </ac-ui-badge>
      </div>

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
        <div dialogFooter class="drawer-footer">
          <ac-ui-button variant="destructive" (click)="reject.emit()">Reject</ac-ui-button>
          <ac-ui-button variant="primary" (click)="approve.emit()">Approve</ac-ui-button>
        </div>
      }
    </ac-ui-dialog>
  `,
  styles: [
    `
      .eyebrow {
        margin: 0 0 var(--ac-space-1);
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: var(--ac-font-weight-medium);
      }

      .badge-wrapper {
        margin-bottom: var(--ac-space-4);
      }

      .drawer-section {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-2);
        margin-bottom: var(--ac-space-5);
      }

      .drawer-section h3 {
        margin: 0;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .body-text {
        margin: 0;
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-strong);
      }

      .body-text.muted {
        color: var(--ac-color-text-muted);
      }

      .detail-list {
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: var(--ac-space-3);
      }

      .detail-list dt {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .detail-list dd {
        margin: var(--ac-space-1) 0 0;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-strong);
      }

      .history-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-2);
      }

      .history-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--ac-space-2) 0;
        border-bottom: 1px solid var(--ac-color-border-slate);
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--ac-space-3);
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

  protected readonly statusTone = statusTone;
  protected readonly statusPresentation = statusPresentation;

  protected readonly history = computed(() =>
    this.allAppointments()
      .filter(
        (item) => item.childId === this.appointment().childId && item.id !== this.appointment().id,
      )
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
  );

  protected readonly formattedDate = computed(() => {
    return new Date(this.appointment().scheduledAt).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  });

  protected formattedShortDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
