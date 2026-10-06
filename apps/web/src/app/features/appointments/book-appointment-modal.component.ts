import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChildrenFacade } from '../children/state/children.facade';
import { AppointmentsFacade, visitReasons } from './state/appointments.facade';
import { AppointmentConfirmationComponent } from './appointment-confirmation.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';

type CalendarDay = {
  readonly iso: string;
  readonly label: number;
  readonly isCurrentMonth: boolean;
  readonly isPast: boolean;
};

const timeSlots = ['09:00 AM', '10:30 AM', '01:30 PM', '03:00 PM'] as const;

@Component({
  standalone: true,
  imports: [RouterLink, AppointmentConfirmationComponent, UiMessageComponent, UiFieldComponent],
  selector: 'ac-book-appointment-modal',
  template: `
    <div class="backdrop" (click)="close()">
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="dialogLabel()"
        (click)="$event.stopPropagation()"
      >
        @if (facade.booking().step === 'confirmed' && facade.booking().confirmed) {
          <ac-appointment-confirmation
            [appointment]="facade.booking().confirmed!"
            (done)="close()"
          />
        } @else {
          <header class="modal-header">
            <h2>Book Appointment</h2>
            <button type="button" class="close-button" aria-label="Close" (click)="close()">
              ×
            </button>
          </header>

          <section class="section">
            <p id="booking-patient-label" class="section-title">
              Who is this visit for? <span aria-hidden="true">*</span>
            </p>
            <div
              class="patient-grid"
              role="radiogroup"
              aria-labelledby="booking-patient-label"
              aria-required="true"
              data-booking-required="child"
            >
              @for (child of children.children(); track child.id) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="facade.booking().childId === child.id"
                  class="patient-card"
                  [class.selected]="facade.booking().childId === child.id"
                  (click)="facade.selectChild(child.id)"
                >
                  <span class="avatar" aria-hidden="true">{{ initials(child.firstName) }}</span>
                  <span class="patient-copy">
                    <strong>{{ child.firstName }}</strong>
                    <span>{{ ageLabel(child.dateOfBirth) }}</span>
                  </span>
                </button>
              }
              <a class="patient-card add-new" routerLink="/children/new">
                <span class="avatar plus" aria-hidden="true">+</span>
                <span class="patient-copy"><strong>Add New</strong></span>
              </a>
            </div>
          </section>

          <section class="section">
            <p class="section-title">Specialist</p>
            <div class="doctor-summary">
              <strong>{{ facade.booking().doctor?.fullName }}</strong>
              <span>{{ facade.booking().doctor?.specialty }}</span>
            </div>
          </section>

          <section class="section">
            <p id="booking-date-label" class="section-title">
              Choose a date <span aria-hidden="true">*</span>
            </p>
            <div class="calendar">
              <div class="calendar-header">
                <button type="button" (click)="shiftMonth(-1)" aria-label="Previous month">
                  ‹
                </button>
                <span>{{ monthLabel() }}</span>
                <button type="button" (click)="shiftMonth(1)" aria-label="Next month">›</button>
              </div>
              <div class="weekday-row">
                @for (day of weekdayLabels; track day) {
                  <span>{{ day }}</span>
                }
              </div>
              <div
                class="day-grid"
                role="radiogroup"
                aria-labelledby="booking-date-label"
                aria-required="true"
                data-booking-required="date"
              >
                @for (day of calendarDays(); track day.iso) {
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="facade.booking().date === day.iso"
                    class="day-cell"
                    [class.muted]="!day.isCurrentMonth"
                    [class.selected]="facade.booking().date === day.iso"
                    [disabled]="day.isPast"
                    (click)="facade.selectDate(day.iso)"
                  >
                    {{ day.label }}
                  </button>
                }
              </div>
            </div>
          </section>

          @if (facade.booking().date) {
            <section class="section">
              <p id="booking-time-label" class="section-title">
                Available slots <span aria-hidden="true">*</span>
              </p>
              <div
                class="slot-row"
                role="radiogroup"
                aria-labelledby="booking-time-label"
                aria-required="true"
                data-booking-required="time"
              >
                @for (slot of timeSlots; track slot) {
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="facade.booking().time === slot"
                    class="slot"
                    [class.selected]="facade.booking().time === slot"
                    (click)="facade.selectTime(slot)"
                  >
                    {{ slot }}
                  </button>
                }
              </div>
            </section>
          }

          @if (facade.booking().time) {
            <section class="section">
              <p class="section-title">Reason for visit</p>
              <div class="reason-row">
                @for (reason of visitReasons; track reason) {
                  <button
                    type="button"
                    class="reason-chip"
                    [class.selected]="facade.booking().visitReason === reason"
                    (click)="facade.selectVisitReason(reason)"
                  >
                    {{ reason }}
                  </button>
                }
              </div>
              <ac-ui-field label="Notes" [optional]="true">
                <textarea
                  class="notes-input"
                  rows="3"
                  maxlength="2000"
                  placeholder="Anything the specialist should know ahead of the visit"
                  [value]="facade.booking().notes"
                  (input)="facade.setNotes($any($event.target).value)"
                ></textarea>
              </ac-ui-field>
            </section>
          }

          @if (facade.booking().error) {
            <ac-ui-message tone="error">{{ facade.booking().error }}</ac-ui-message>
          }

          <footer class="modal-footer">
            <button type="button" class="secondary" (click)="close()">Cancel</button>
            <button
              type="button"
              class="primary"
              [disabled]="facade.booking().step === 'submitting'"
              (click)="confirmBooking()"
            >
              {{ facade.booking().step === 'submitting' ? 'Booking...' : 'Confirm Booking' }}
            </button>
          </footer>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgb(0 30 43 / 0.45);
        display: grid;
        place-items: center;
        padding: 20px;
      }

      .modal {
        width: 100%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 16px;
        background: var(--ac-color-surface);
        padding: 24px;
        box-shadow: 0 24px 60px rgb(0 30 43 / 0.25);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
      }

      .modal-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-card-title);
      }

      .close-button {
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 999px;
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-text-body);
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
      }

      .section {
        margin-bottom: 20px;
      }

      .section-title {
        margin: 0 0 10px;
        color: var(--ac-color-text-dark);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
      }

      .patient-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
      }

      .patient-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: 12px;
        background: var(--ac-color-surface);
        padding: 12px;
        cursor: pointer;
        text-decoration: none;
        text-align: left;
        font: inherit;
      }

      .patient-card.selected {
        border-color: var(--ac-color-text-dark);
        background: var(--ac-color-tint-blue-soft);
      }

      .patient-card .avatar {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-dark);
        display: grid;
        place-items: center;
        font-weight: var(--ac-font-weight-bold);
        font-size: 13px;
      }

      .patient-card .avatar.plus {
        background: #e5f6ff;
        color: var(--ac-color-text-dark);
        font-size: 18px;
      }

      .patient-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
        color: var(--ac-color-text-dark);
        font-size: var(--ac-type-meta);
      }

      .patient-copy strong {
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-body);
      }

      .doctor-summary {
        display: flex;
        flex-direction: column;
        gap: 2px;
        border-radius: 10px;
        background: var(--ac-color-tint-blue-soft);
        padding: 12px 14px;
      }

      .doctor-summary strong {
        color: var(--ac-color-text-strong);
      }

      .doctor-summary span {
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
      }

      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-semibold);
      }

      .calendar-header button {
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 999px;
        background: var(--ac-color-tint-blue-soft);
        cursor: pointer;
        font-size: 1rem;
      }

      .weekday-row,
      .day-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }

      .weekday-row span {
        text-align: center;
        color: var(--ac-color-text-muted);
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
      }

      .day-cell {
        aspect-ratio: 1;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--ac-color-text-dark);
        font-size: var(--ac-type-meta);
        cursor: pointer;
      }

      .day-cell.muted {
        color: #c3ccce;
      }

      .day-cell:disabled {
        color: #c3ccce;
        cursor: not-allowed;
      }

      .day-cell.selected {
        background: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-bold);
      }

      .slot-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .slot {
        min-height: 40px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
        padding: 0 16px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .slot.selected {
        border-color: var(--ac-color-text-dark);
        background: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
      }

      .reason-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
      }

      .reason-chip {
        min-height: 36px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
        padding: 0 14px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .reason-chip.selected {
        border-color: var(--ac-color-sage);
        background: var(--ac-color-sage-light);
        color: var(--ac-color-text-dark);
      }

      .notes-label {
        display: block;
        margin-bottom: 6px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
      }

      .notes-input {
        width: 100%;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: 10px 12px;
        font-family: inherit;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text);
        resize: vertical;
      }

      .notes-input:focus-visible {
        outline: 3px solid var(--ac-color-warning);
        outline-offset: 1px;
      }

      .error {
        margin: 0 0 16px;
        border-radius: 10px;
        background: #fee2e2;
        color: var(--ac-color-alert-slate);
        padding: 10px 14px;
        font-size: var(--ac-type-meta);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .modal-footer button {
        min-height: 44px;
        border-radius: 10px;
        padding: 0 20px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      .secondary {
        border: 1.5px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
      }

      .primary {
        border: 0;
        background: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
      }

      .primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookAppointmentModalComponent implements OnInit {
  protected readonly facade = inject(AppointmentsFacade);
  protected readonly children = inject(ChildrenFacade);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly timeSlots = timeSlots;
  protected readonly visitReasons = visitReasons;
  protected readonly weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  private readonly viewMonth = signal(startOfMonth(new Date()));

  protected readonly monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );

  protected readonly calendarDays = computed<readonly CalendarDay[]>(() => {
    const month = this.viewMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstOfMonth = new Date(year, monthIndex, 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());
    const today = startOfDay(new Date());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return {
        iso: toIsoDate(date),
        label: date.getDate(),
        isCurrentMonth: date.getMonth() === monthIndex,
        isPast: startOfDay(date).getTime() < today.getTime(),
      };
    });
  });

  protected readonly dialogLabel = computed(
    () => `Book appointment with ${this.facade.booking().doctor?.fullName ?? 'specialist'}`,
  );

  ngOnInit() {
    this.children.load();
  }

  protected shiftMonth(delta: number) {
    const next = new Date(this.viewMonth());
    next.setMonth(next.getMonth() + delta);
    this.viewMonth.set(startOfMonth(next));
  }

  protected close() {
    this.facade.closeBooking();
  }

  protected confirmBooking() {
    this.facade.confirmBooking();
    queueMicrotask(() => {
      const booking = this.facade.booking();
      const missing = !booking.childId
        ? 'child'
        : !booking.date
          ? 'date'
          : !booking.time
            ? 'time'
            : null;
      if (!missing || !booking.error) return;
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-booking-required="${missing}"] button:not(:disabled)`)
        ?.focus();
    });
  }

  protected initials(firstName: string): string {
    return firstName.slice(0, 2).toUpperCase();
  }

  protected ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
      years -= 1;
    }
    return `Age ${Math.max(years, 0)}`;
  }
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
