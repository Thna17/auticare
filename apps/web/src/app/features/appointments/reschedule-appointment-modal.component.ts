import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AppointmentsFacade } from './state/appointments.facade';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';

type CalendarDay = {
  readonly iso: string;
  readonly label: number;
  readonly isCurrentMonth: boolean;
  readonly isPast: boolean;
};

const defaultTimeSlots = ['09:00 AM', '10:30 AM', '01:30 PM', '03:00 PM'] as const;

@Component({
  standalone: true,
  selector: 'ac-reschedule-appointment-modal',
  imports: [UiDialogComponent, UiFieldComponent, UiMessageComponent],
  template: `
    <ac-ui-dialog
      heading="Reschedule Appointment"
      [ariaLabel]="dialogLabel()"
      [showCloseButton]="true"
      size="md"
      (close)="close()"
    >
      <!-- Current Appointment Snapshot Card -->
      <section class="section" aria-label="Current appointment details">
        <span class="section-title">Current Appointment</span>
        <div class="current-summary-card">
          <div class="doctor-avatar" aria-hidden="true">
            {{ initials(facade.reschedule().appointment?.doctorName) }}
          </div>
          <div class="current-details">
            <strong class="current-doctor">{{
              facade.reschedule().appointment?.doctorName ?? 'Specialist'
            }}</strong>
            <span class="current-hospital">
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {{ facade.reschedule().appointment?.hospitalName }}
            </span>
            <span class="scheduled-time">
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Original: {{ formatCurrentTime() }}
            </span>
          </div>
        </div>
      </section>

      <!-- Calendar Selection -->
      <section class="section" aria-labelledby="reschedule-date-label">
        <div class="section-header-row">
          <h3 id="reschedule-date-label" class="section-title">
            Choose a New Date <span aria-hidden="true">*</span>
          </h3>
          <span class="step-hint">Select your preferred consultation date</span>
        </div>

        <div class="calendar-wrapper">
          <div class="calendar-header">
            <button
              type="button"
              class="month-nav-btn"
              (click)="shiftMonth(-1)"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span class="month-label">{{ monthLabel() }}</span>
            <button
              type="button"
              class="month-nav-btn"
              (click)="shiftMonth(1)"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <div class="weekday-row">
            @for (day of weekdayLabels; track day) {
              <span>{{ day }}</span>
            }
          </div>
          <div
            class="day-grid"
            role="radiogroup"
            aria-labelledby="reschedule-date-label"
            aria-required="true"
          >
            @for (day of calendarDays(); track day.iso) {
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="facade.reschedule().date === day.iso"
                class="day-cell"
                [class.muted]="!day.isCurrentMonth"
                [class.selected]="facade.reschedule().date === day.iso"
                [disabled]="day.isPast"
                (click)="facade.selectRescheduleDate(day.iso)"
              >
                {{ day.label }}
              </button>
            }
          </div>
          <div class="calendar-legend">
            <span class="legend-item"><span class="legend-dot available"></span> Available</span>
            <span class="legend-item"><span class="legend-dot selected"></span> Selected</span>
            <span class="legend-item"><span class="legend-dot past"></span> Past dates</span>
          </div>
        </div>
      </section>

      <!-- Time Slot Selection with Morning/Afternoon Grouping -->
      @if (facade.reschedule().date) {
        <section class="section" aria-labelledby="reschedule-time-label">
          <div class="section-header-row">
            <h3 id="reschedule-time-label" class="section-title">
              Available Slots for {{ formatSelectedDate(facade.reschedule().date!) }}
              <span aria-hidden="true">*</span>
            </h3>
          </div>

          @if (facade.reschedule().slotsLoading) {
            <p class="loading-slots">
              <span class="loading-spinner" aria-hidden="true"></span>
              Checking doctor availability…
            </p>
          }

          <div
            class="slot-groups"
            role="radiogroup"
            aria-labelledby="reschedule-time-label"
            aria-required="true"
          >
            @if (morningSlots().length > 0) {
              <div class="slot-group">
                <span class="slot-group-heading">
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                  </svg>
                  Morning Sessions
                </span>
                <div class="slot-row">
                  @for (slot of morningSlots(); track slot.iso) {
                    <button
                      type="button"
                      role="radio"
                      [attr.aria-checked]="facade.reschedule().time === slot.time"
                      class="slot"
                      [class.selected]="facade.reschedule().time === slot.time"
                      [disabled]="!slot.available"
                      (click)="facade.selectRescheduleTime(slot.time)"
                    >
                      {{ slot.time }}
                    </button>
                  }
                </div>
              </div>
            }

            @if (afternoonSlots().length > 0) {
              <div class="slot-group">
                <span class="slot-group-heading">
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                    ></path>
                  </svg>
                  Afternoon Sessions
                </span>
                <div class="slot-row">
                  @for (slot of afternoonSlots(); track slot.iso) {
                    <button
                      type="button"
                      role="radio"
                      [attr.aria-checked]="facade.reschedule().time === slot.time"
                      class="slot"
                      [class.selected]="facade.reschedule().time === slot.time"
                      [disabled]="!slot.available"
                      (click)="facade.selectRescheduleTime(slot.time)"
                    >
                      {{ slot.time }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Reschedule Reason Field -->
      <section class="section">
        <ac-ui-field label="Reason for rescheduling" [optional]="true">
          <textarea
            class="notes-input"
            rows="2"
            maxlength="2000"
            placeholder="Let the hospital team know why you need to move this appointment…"
            [value]="facade.reschedule().reason"
            (input)="facade.setRescheduleReason($any($event.target).value)"
          ></textarea>
        </ac-ui-field>
      </section>

      <!-- Clear Error State Alert -->
      @if (facade.reschedule().error) {
        <ac-ui-message tone="error">{{ facade.reschedule().error }}</ac-ui-message>
      }

      <div dialogFooter class="modal-footer">
        <button type="button" class="secondary" (click)="close()">Cancel</button>
        <button
          type="button"
          class="primary"
          [disabled]="
            facade.reschedule().submitting || !facade.reschedule().date || !facade.reschedule().time
          "
          (click)="confirm()"
        >
          {{ facade.reschedule().submitting ? 'Rescheduling…' : 'Confirm Reschedule' }}
        </button>
      </div>
    </ac-ui-dialog>
  `,
  styles: [
    `
      .section {
        margin-bottom: 20px;
      }

      .section-header-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 10px;
      }

      .section-title {
        margin: 0;
        color: var(--ac-color-text-dark);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .step-hint {
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .current-summary-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--ac-color-tint-blue-soft);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-md);
        margin-top: 8px;
      }

      .doctor-avatar {
        width: 44px;
        height: 44px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        border: 1.5px solid var(--ac-color-border-info);
        display: grid;
        place-items: center;
        font-weight: var(--ac-font-weight-bold);
        font-size: 15px;
        flex-shrink: 0;
      }

      .current-details {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: var(--ac-type-meta);
      }

      .current-doctor {
        color: var(--ac-color-text-strong);
        font-size: 15px;
      }

      .current-hospital,
      .scheduled-time {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ac-color-text-body);
      }

      .scheduled-time {
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-medium);
      }

      .calendar-wrapper {
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: 16px;
        background: var(--ac-color-surface);
      }

      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .month-label {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-label);
      }

      .month-nav-btn {
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action-deep);
        cursor: pointer;
        font-size: 1.1rem;
        display: grid;
        place-items: center;
        transition: background-color 0.2s ease;
      }

      .month-nav-btn:hover {
        background: var(--ac-color-border-info);
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
        padding: 4px 0;
      }

      .day-cell {
        aspect-ratio: 1;
        border: 0;
        border-radius: var(--ac-radius-sm);
        background: transparent;
        color: var(--ac-color-text-dark);
        font-size: var(--ac-type-meta);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .day-cell:hover:not(:disabled) {
        background: var(--ac-color-tint-blue-soft);
      }

      .day-cell.muted {
        color: var(--ac-color-slate-tint-soft);
      }

      .day-cell:disabled {
        color: var(--ac-color-slate-tint-soft);
        cursor: not-allowed;
      }

      .day-cell.selected {
        background: var(--ac-color-action) !important;
        color: var(--ac-color-text-on-action) !important;
        font-weight: var(--ac-font-weight-bold);
        box-shadow: var(--ac-shadow-xs);
      }

      .calendar-legend {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid var(--ac-color-border-slate);
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: var(--ac-radius-pill);
      }

      .legend-dot.available {
        background: var(--ac-color-success);
      }

      .legend-dot.selected {
        background: var(--ac-color-action);
      }

      .legend-dot.past {
        background: var(--ac-color-slate-tint-soft);
      }

      .slot-groups {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: var(--ac-color-surface-slate);
        border: 1.5px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
      }

      .slot-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .slot-group-heading {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ac-color-text-dark);
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .slot-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .slot {
        min-height: 40px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
        padding: 0 16px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .slot:hover:not(:disabled) {
        border-color: var(--ac-color-action);
        background: var(--ac-color-tint-blue-soft);
      }

      .slot.selected {
        border-color: var(--ac-color-action);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        box-shadow: var(--ac-shadow-xs);
      }

      .slot:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        background: var(--ac-color-surface-slate);
        text-decoration: line-through;
      }

      .loading-slots {
        margin: 0 0 10px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-style: italic;
      }

      .notes-input {
        width: 100%;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: 12px 14px;
        font: inherit;
        font-size: var(--ac-type-meta);
        resize: vertical;
        box-sizing: border-box;
        transition: border-color 0.2s ease;
      }

      .notes-input:focus-visible {
        outline: none;
        border-color: var(--ac-color-action);
        box-shadow: 0 0 0 3px var(--ac-color-tint-blue);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 16px;
      }

      .modal-footer button {
        min-height: 44px;
        border-radius: var(--ac-radius-md);
        padding: 0 20px;
        font-weight: var(--ac-font-weight-semibold);
        font-size: var(--ac-type-meta);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .secondary {
        border: 1.5px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
      }

      .secondary:hover {
        background: var(--ac-color-surface-slate);
      }

      .primary {
        border: 0;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        box-shadow: var(--ac-shadow-sm);
      }

      .primary:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-md);
      }

      .primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescheduleAppointmentModalComponent implements OnInit {
  protected readonly facade = inject(AppointmentsFacade);
  protected readonly defaultSlots = defaultTimeSlots;
  protected readonly weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  private readonly viewMonth = signal(startOfMonth(new Date()));

  protected readonly monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );

  protected readonly allAvailableSlots = computed<
    readonly { time: string; iso: string; available: boolean }[]
  >(() => {
    const slots = this.facade.reschedule().slots;
    if (slots.length > 0) return slots;
    return this.defaultSlots.map((time) => ({ time, iso: '', available: true }));
  });

  protected readonly morningSlots = computed(() =>
    this.allAvailableSlots().filter((slot) => isMorningSlot(slot.time)),
  );

  protected readonly afternoonSlots = computed(() =>
    this.allAvailableSlots().filter((slot) => !isMorningSlot(slot.time)),
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
    () =>
      `Reschedule appointment with ${this.facade.reschedule().appointment?.doctorName ?? 'specialist'}`,
  );

  ngOnInit() {
    const current = this.facade.reschedule().appointment;
    if (current?.scheduledAt) {
      const d = new Date(current.scheduledAt);
      if (!Number.isNaN(d.getTime())) {
        this.viewMonth.set(startOfMonth(d));
      }
    }
  }

  protected formatCurrentTime(): string {
    const appt = this.facade.reschedule().appointment;
    if (!appt) return '';
    return new Date(appt.scheduledAt).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  protected formatSelectedDate(isoDate: string): string {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  protected shiftMonth(delta: number) {
    const next = new Date(this.viewMonth());
    next.setMonth(next.getMonth() + delta);
    this.viewMonth.set(startOfMonth(next));
  }

  protected close() {
    this.facade.closeReschedule();
  }

  protected confirm() {
    this.facade.confirmReschedule();
  }

  protected initials(name?: string | null): string {
    if (!name) return 'SP';
    const clean = name.replace(/^Dr\.?\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'SP';
  }
}

function isMorningSlot(time: string): boolean {
  const t = time.trim().toUpperCase();
  if (t.includes('AM')) return true;
  if (t.includes('PM')) return false;
  const hour = Number.parseInt(t.split(':')[0], 10);
  return !Number.isNaN(hour) && hour < 12;
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
