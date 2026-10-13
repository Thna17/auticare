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
import { AppointmentsFacade, visitReasons, type VisitReason } from './state/appointments.facade';
import { AppointmentConfirmationComponent } from './appointment-confirmation.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { I18nService } from '../../core/i18n/i18n.service';

type CalendarDay = {
  readonly iso: string;
  readonly label: number;
  readonly isCurrentMonth: boolean;
  readonly isPast: boolean;
  readonly isOffDay: boolean;
};

export type WizardStep = 1 | 2 | 3;

@Component({
  standalone: true,
  imports: [
    RouterLink,
    AppointmentConfirmationComponent,
    UiMessageComponent,
    UiFieldComponent,
    UiDialogComponent,
  ],
  selector: 'ac-book-appointment-modal',
  template: `
    <ac-ui-dialog
      [heading]="
        facade.booking().step === 'confirmed'
          ? ''
          : currentLang() === 'km'
            ? 'កក់ការណាត់ជួបពិគ្រោះ'
            : 'Book Appointment'
      "
      [ariaLabel]="dialogLabel()"
      [showCloseButton]="true"
      size="md"
      (close)="close()"
    >
      @if (facade.booking().step === 'confirmed' && facade.booking().confirmed) {
        <ac-appointment-confirmation [appointment]="facade.booking().confirmed!" (done)="close()" />
      } @else {
        <!-- Multi-step Wizard Navigation Header -->
        <nav class="wizard-stepper" aria-label="Booking steps" role="tablist">
          <button
            type="button"
            role="tab"
            class="wizard-step"
            [class.active]="step() === 1"
            [class.completed]="step() > 1"
            [attr.aria-selected]="step() === 1"
            (click)="setStep(1)"
          >
            <span class="step-badge">1</span>
            <span class="step-label">{{
              currentLang() === 'km' ? 'កុមារ និងមូលហេតុ' : 'Child & Reason'
            }}</span>
          </button>
          <div class="step-divider" [class.filled]="step() > 1" aria-hidden="true"></div>

          <button
            type="button"
            role="tab"
            class="wizard-step"
            [class.active]="step() === 2"
            [class.completed]="step() > 2"
            [attr.aria-selected]="step() === 2"
            [disabled]="!facade.booking().childId"
            (click)="setStep(2)"
          >
            <span class="step-badge">2</span>
            <span class="step-label">{{
              currentLang() === 'km' ? 'កាលបរិច្ឆេទ និងម៉ោង' : 'Date & Slot'
            }}</span>
          </button>
          <div class="step-divider" [class.filled]="step() > 2" aria-hidden="true"></div>

          <button
            type="button"
            role="tab"
            class="wizard-step"
            [class.active]="step() === 3"
            [attr.aria-selected]="step() === 3"
            [disabled]="
              !facade.booking().childId || !facade.booking().date || !facade.booking().time
            "
            (click)="setStep(3)"
          >
            <span class="step-badge">3</span>
            <span class="step-label">{{
              currentLang() === 'km' ? 'កំណត់សម្គាល់' : 'Care Notes & Confirm'
            }}</span>
          </button>
        </nav>

        <!-- Specialist Banner Summary (always visible for context) -->
        <div class="specialist-context-card">
          <div class="doctor-avatar" aria-hidden="true">
            {{ initials(facade.booking().doctor?.fullName ?? 'DR') }}
          </div>
          <div class="doctor-context-details">
            <strong class="doctor-name">{{
              facade.booking().doctor?.fullName ??
                (currentLang() === 'km' ? 'វេជ្ជបណ្ឌិតឯកទេស' : 'Clinical Specialist')
            }}</strong>
            <span class="doctor-specialty">{{
              facade.booking().doctor?.specialty ??
                (currentLang() === 'km' ? 'វេជ្ជបណ្ឌិតកុមារឯកទេស' : 'Developmental Pediatrics')
            }}</span>
            <small class="doctor-schedule">
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {{ formatSchedule(facade.booking().doctor) }}
            </small>
          </div>
        </div>

        <!-- ── STEP 1: CHOOSE CHILD & VISIT REASON ──────────────────── -->
        @if (step() === 1) {
          <section class="section" aria-labelledby="booking-patient-label">
            <div class="section-header-row">
              <h3 id="booking-patient-label" class="section-title">
                {{
                  currentLang() === 'km'
                    ? '១. ជ្រើសរើសអ្នកជំងឺ និងមូលហេតុ'
                    : '1. Select Patient & Visit Reason'
                }}
                <span aria-hidden="true">*</span>
              </h3>
              <span class="step-hint">{{
                currentLang() === 'km'
                  ? 'តើកុមាររូបណាដែលត្រូវមកពិនិត្យ និងអ្វីជាការផ្តោតសំខាន់?'
                  : 'Who will attend and what is the primary focus?'
              }}</span>
            </div>

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
                <span class="patient-copy"
                  ><strong>{{
                    currentLang() === 'km' ? '+ បន្ថែមកុមារថ្មី' : 'Add New Child'
                  }}</strong></span
                >
              </a>
            </div>

            <!-- Visit Reason & Common Symptoms -->
            <div class="reason-section-group">
              <div class="section-header-row sub-header">
                <h4 id="booking-reason-label" class="sub-section-title">
                  {{
                    currentLang() === 'km'
                      ? 'មូលហេតុចម្បងនៃការពិគ្រោះ'
                      : 'Primary Consultation Reason'
                  }}
                  <span aria-hidden="true">*</span>
                </h4>
                <span class="step-hint">{{
                  currentLang() === 'km'
                    ? 'ជួយវេជ្ជបណ្ឌិតត្រៀមរៀបចំជាមុន'
                    : 'Helps the specialist prepare'
                }}</span>
              </div>

              <div class="reason-row" role="radiogroup" aria-labelledby="booking-reason-label">
                @for (reason of visitReasons; track reason) {
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="facade.booking().visitReason === reason"
                    class="reason-chip"
                    [class.selected]="facade.booking().visitReason === reason"
                    (click)="facade.selectVisitReason(reason)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {{ formatVisitReason(reason) }}
                  </button>
                }
              </div>

              <div class="symptom-chips-container">
                <span class="symptoms-label">{{
                  currentLang() === 'km'
                    ? 'ចំណុចផ្តោតសំខាន់នៃការលូតលាស់ទូទៅ:'
                    : 'Common Developmental Focus Areas:'
                }}</span>
                <div class="symptom-chips-row">
                  @for (symptom of commonSymptoms; track symptom) {
                    <button
                      type="button"
                      class="symptom-chip"
                      [class.selected]="isSymptomSelected(symptom)"
                      (click)="toggleSymptom(symptom)"
                    >
                      {{ isSymptomSelected(symptom) ? '✓ ' : '+ '
                      }}{{ formatSymptomLabel(symptom) }}
                    </button>
                  }
                </div>
              </div>
            </div>
          </section>
        }

        <!-- ── STEP 2: SELECT DATE & SLOT ───────────────────────────── -->
        @if (step() === 2) {
          <section class="section" aria-labelledby="booking-date-label">
            <div class="section-header-row">
              <h3 id="booking-date-label" class="section-title">
                {{
                  currentLang() === 'km'
                    ? '២. ជ្រើសរើសថ្ងៃ និងម៉ោងពិនិត្យ'
                    : '2. Choose Date & Time Slot'
                }}
                <span aria-hidden="true">*</span>
              </h3>
              <span class="step-hint">{{
                currentLang() === 'km'
                  ? 'ជ្រើសរើសថ្ងៃធ្វើការដែលមានវេជ្ជបណ្ឌិត'
                  : 'Select an available working day'
              }}</span>
            </div>

            <!-- Calendar Container -->
            <div class="calendar-wrapper">
              <div class="calendar-header">
                <button
                  type="button"
                  class="month-nav-btn"
                  (click)="shiftMonth(-1)"
                  [attr.aria-label]="currentLang() === 'km' ? 'ខែមុន' : 'Previous month'"
                >
                  ‹
                </button>
                <span class="month-label">{{ monthLabel() }}</span>
                <button
                  type="button"
                  class="month-nav-btn"
                  (click)="shiftMonth(1)"
                  [attr.aria-label]="currentLang() === 'km' ? 'ខែបន្ទាប់' : 'Next month'"
                >
                  ›
                </button>
              </div>

              <div class="weekday-row">
                @for (day of weekdayLabels(); track day) {
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
                    [class.off-day]="day.isOffDay"
                    [class.selected]="facade.booking().date === day.iso"
                    [disabled]="day.isPast || day.isOffDay"
                    [attr.aria-disabled]="day.isPast || day.isOffDay ? 'true' : null"
                    [title]="
                      day.isOffDay
                        ? currentLang() === 'km'
                          ? 'វេជ្ជបណ្ឌិតឈប់សម្រាក'
                          : 'Specialist off duty'
                        : day.iso
                    "
                    (click)="facade.selectDate(day.iso)"
                  >
                    {{ day.label }}
                  </button>
                }
              </div>

              <div class="calendar-legend">
                <span class="legend-item"
                  ><span class="legend-dot available"></span>
                  {{ currentLang() === 'km' ? 'អាចកក់បាន' : 'Available' }}</span
                >
                <span class="legend-item"
                  ><span class="legend-dot off-duty"></span>
                  {{ currentLang() === 'km' ? 'ថ្ងៃឈប់សម្រាក' : 'Off duty' }}</span
                >
                <span class="legend-item"
                  ><span class="legend-dot selected"></span>
                  {{ currentLang() === 'km' ? 'បានជ្រើសរើស' : 'Selected' }}</span
                >
              </div>
            </div>

            <!-- Slots Section -->
            @if (facade.booking().date) {
              <div class="slots-container" aria-labelledby="booking-time-label">
                <div class="section-header-row">
                  <h4 id="booking-time-label" class="sub-section-title">
                    {{
                      currentLang() === 'km'
                        ? 'ម៉ោងទំនេរសម្រាប់ ' + formatSelectedDate(facade.booking().date!)
                        : 'Available Slots for ' + formatSelectedDate(facade.booking().date!)
                    }}
                    <span aria-hidden="true">*</span>
                  </h4>
                </div>

                @if (facade.booking().slotsLoading) {
                  <p class="loading-slots">
                    <span class="loading-spinner" aria-hidden="true"></span>
                    {{
                      currentLang() === 'km'
                        ? 'កំពុងពិនិត្យកាលវិភាគផ្ទាល់របស់វេជ្ជបណ្ឌិត…'
                        : 'Checking specialist live schedule…'
                    }}
                  </p>
                } @else if (facade.booking().slots.length > 0) {
                  <div
                    class="slot-groups"
                    role="radiogroup"
                    aria-labelledby="booking-time-label"
                    aria-required="true"
                    data-booking-required="time"
                  >
                    <!-- Morning Slots Group -->
                    @if (morningSlots().length > 0) {
                      <div class="slot-group">
                        <span class="slot-group-heading">
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
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
                          {{ currentLang() === 'km' ? 'វគ្គពេលព្រឹក' : 'Morning Sessions' }}
                        </span>
                        <div class="slot-row">
                          @for (slot of morningSlots(); track slot.iso) {
                            <button
                              type="button"
                              role="radio"
                              [attr.aria-checked]="facade.booking().time === slot.time"
                              class="slot"
                              [class.selected]="facade.booking().time === slot.time"
                              [disabled]="!slot.available"
                              (click)="facade.selectTime(slot.time)"
                            >
                              {{ slot.time }}
                            </button>
                          }
                        </div>
                      </div>
                    }

                    <!-- Afternoon Slots Group -->
                    @if (afternoonSlots().length > 0) {
                      <div class="slot-group">
                        <span class="slot-group-heading">
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                            ></path>
                          </svg>
                          {{ currentLang() === 'km' ? 'វគ្គពេលរសៀល' : 'Afternoon Sessions' }}
                        </span>
                        <div class="slot-row">
                          @for (slot of afternoonSlots(); track slot.iso) {
                            <button
                              type="button"
                              role="radio"
                              [attr.aria-checked]="facade.booking().time === slot.time"
                              class="slot"
                              [class.selected]="facade.booking().time === slot.time"
                              [disabled]="!slot.available"
                              (click)="facade.selectTime(slot.time)"
                            >
                              {{ slot.time }}
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="no-slots-notice" role="status">
                    <p>
                      {{
                        currentLang() === 'km'
                          ? 'មិនមានការណាត់ជួបទំនេរនៅថ្ងៃនេះទេ។ កាលវិភាគវេជ្ជបណ្ឌិត: '
                          : "No appointments available on this date. Doctor's schedule: "
                      }}
                      <strong>{{ formatSchedule(facade.booking().doctor) }}</strong>
                      {{
                        currentLang() === 'km'
                          ? '។ សូមជ្រើសរើសថ្ងៃធ្វើការផ្សេងទៀត។'
                          : '. Please select another working date.'
                      }}
                    </p>
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- ── STEP 3: CARE NOTES & CONFIRM ─────────────────────────── -->
        @if (step() === 3) {
          <section class="section" aria-labelledby="booking-review-label">
            <div class="section-header-row">
              <h3 id="booking-review-label" class="section-title">
                {{
                  currentLang() === 'km' ? '៣. កំណត់សម្គាល់ និងបញ្ជាក់' : '3. Care Notes & Confirm'
                }}
              </h3>
              <span class="step-hint">{{
                currentLang() === 'km'
                  ? 'ផ្ទៀងផ្ទាត់ព័ត៌មានកក់ និងចែករំលែកតម្រូវការសម្របសម្រួលញ្ញាណ'
                  : 'Verify your booking details and share sensory accommodations'
              }}</span>
            </div>

            <!-- Booking Summary Review Card -->
            <div class="review-card">
              <div class="review-item">
                <span class="review-key">{{
                  currentLang() === 'km' ? 'អ្នកជំងឺ' : 'Patient'
                }}</span>
                <strong class="review-val">{{ selectedChildName() }}</strong>
              </div>
              <div class="review-item">
                <span class="review-key">{{
                  currentLang() === 'km' ? 'អ្នកឯកទេស' : 'Specialist'
                }}</span>
                <strong class="review-val">{{
                  facade.booking().doctor?.fullName ??
                    (currentLang() === 'km' ? 'អ្នកឯកទេស' : 'Specialist')
                }}</strong>
              </div>
              <div class="review-item">
                <span class="review-key">{{
                  currentLang() === 'km' ? 'កាលបរិច្ឆេទ និងម៉ោង' : 'Date & Time'
                }}</span>
                <strong class="review-val">
                  {{ formatSelectedDate(facade.booking().date!) }}
                  {{ currentLang() === 'km' ? 'នៅម៉ោង' : 'at' }} {{ facade.booking().time }}
                </strong>
              </div>
              @if (facade.booking().visitReason) {
                <div class="review-item">
                  <span class="review-key">{{
                    currentLang() === 'km' ? 'ប្រភេទជួប' : 'Visit Type'
                  }}</span>
                  <strong class="review-val">{{
                    formatVisitReason(facade.booking().visitReason!)
                  }}</strong>
                </div>
              }
              @if (selectedSymptomsList().length > 0) {
                <div class="review-item symptoms-summary-item">
                  <span class="review-key">{{
                    currentLang() === 'km' ? 'ចំណុចផ្តោត' : 'Focus Areas'
                  }}</span>
                  <div class="review-symptom-tags">
                    @for (s of selectedSymptomsList(); track s) {
                      <span class="review-symptom-tag">{{ formatSymptomLabel(s) }}</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Care Notes field -->
            <ac-ui-field
              [label]="
                currentLang() === 'km'
                  ? 'ការសម្របសម្រួលញ្ញាណ និងកំណត់សម្គាល់ថែទាំ'
                  : 'Sensory Accommodations & Care Notes'
              "
              [optional]="true"
            >
              <textarea
                class="notes-input"
                rows="3"
                maxlength="2000"
                [placeholder]="
                  currentLang() === 'km'
                    ? 'សូមចែករំលែកពីភាពងាយរងរំញោចញ្ញាណ (សំឡេង ពន្លឺ ការប៉ះពាល់) ឧបករណ៍ជំនួយទំនាក់ទំនង ឬគោលដៅនៃការជួបពិគ្រោះនេះ…'
                    : 'Share any sensory sensitivities (sound, light, tactile), special communication tools, or goals for this session…'
                "
                [value]="facade.booking().notes"
                (input)="facade.setNotes($any($event.target).value)"
              ></textarea>
            </ac-ui-field>
          </section>
        }

        @if (facade.booking().error) {
          <ac-ui-message tone="error">{{ facade.booking().error }}</ac-ui-message>
        }

        <!-- Modal Step Navigation Footer -->
        <div dialogFooter class="modal-footer">
          @if (step() === 1) {
            <button type="button" class="secondary" (click)="close()">
              {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
            </button>
            <button
              type="button"
              class="primary"
              [disabled]="!facade.booking().childId"
              (click)="setStep(2)"
            >
              {{ currentLang() === 'km' ? 'បន្តទៅថ្ងៃ និងម៉ោង →' : 'Continue to Date & Slot →' }}
            </button>
          } @else if (step() === 2) {
            <button type="button" class="secondary" (click)="setStep(1)">
              {{
                currentLang() === 'km' ? '← ត្រឡប់ទៅកុមារ និងមូលហេតុ' : '← Back to Child & Reason'
              }}
            </button>
            <button
              type="button"
              class="primary"
              [disabled]="!facade.booking().date || !facade.booking().time"
              (click)="setStep(3)"
            >
              {{ currentLang() === 'km' ? 'បន្តទៅផ្ទៀងផ្ទាត់ →' : 'Continue to Confirm →' }}
            </button>
          } @else if (step() === 3) {
            <button type="button" class="secondary" (click)="setStep(2)">
              {{ currentLang() === 'km' ? '← ត្រឡប់ទៅថ្ងៃ និងម៉ោង' : '← Back to Date & Slot' }}
            </button>
            <button
              type="button"
              class="primary"
              [disabled]="facade.booking().step === 'submitting'"
              (click)="confirmBooking()"
            >
              {{
                facade.booking().step === 'submitting'
                  ? currentLang() === 'km'
                    ? 'កំពុងផ្ញើសំណើ…'
                    : 'Submitting Request…'
                  : currentLang() === 'km'
                    ? 'បញ្ជាក់ការកក់ណាត់'
                    : 'Confirm Appointment'
              }}
            </button>
          }
        </div>
      }
    </ac-ui-dialog>
  `,
  styles: [
    `
      .wizard-stepper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 20px;
        padding: 6px 4px;
      }

      .wizard-step {
        display: flex;
        align-items: center;
        gap: 6px;
        border: 0;
        background: transparent;
        padding: 4px 6px;
        cursor: pointer;
        font: inherit;
        border-radius: var(--ac-radius-sm);
        transition: all 0.2s ease;
      }

      .wizard-step:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .step-badge {
        width: 26px;
        height: 26px;
        border-radius: var(--ac-radius-pill);
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        background: var(--ac-color-slate-surface-light);
        color: var(--ac-color-text-slate);
      }

      .wizard-step.active .step-badge {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .wizard-step.completed .step-badge {
        background: var(--ac-color-sage);
        color: var(--ac-color-text-on-action);
      }

      .step-label {
        font-size: 13px;
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-muted);
      }

      .wizard-step.active .step-label {
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-bold);
      }

      .step-divider {
        flex: 1;
        height: 2px;
        background: var(--ac-color-border-slate);
        border-radius: var(--ac-radius-pill);
      }

      .step-divider.filled {
        background: var(--ac-color-sage);
      }

      .specialist-context-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: var(--ac-color-tint-blue-soft);
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border-info);
        margin-bottom: 20px;
      }

      .doctor-avatar {
        width: 42px;
        height: 42px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        border: 1.5px solid var(--ac-color-border-info);
        display: grid;
        place-items: center;
        font-weight: var(--ac-font-weight-bold);
        font-size: 14px;
        flex-shrink: 0;
      }

      .doctor-context-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .doctor-name {
        color: var(--ac-color-text-strong);
        font-size: 14px;
      }

      .doctor-specialty {
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
      }

      .doctor-schedule {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
        color: var(--ac-color-action-deep);
        font-size: 12px;
        font-weight: var(--ac-font-weight-medium);
      }

      .section {
        margin-bottom: 22px;
      }

      .section-header-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 12px;
      }

      .section-title {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
      }

      .step-hint {
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .sub-section-title {
        margin: 0;
        color: var(--ac-color-text-dark);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
      }

      .patient-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 12px;
      }

      .patient-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        padding: 14px;
        cursor: pointer;
        text-decoration: none;
        text-align: left;
        font: inherit;
        transition: all 0.2s ease;
      }

      .patient-card:hover {
        border-color: var(--ac-color-border-info);
        background: var(--ac-color-surface-slate);
      }

      .patient-card.selected {
        border-color: var(--ac-color-action);
        background: var(--ac-color-tint-blue-soft);
        box-shadow: 0 0 0 1px var(--ac-color-action);
      }

      .patient-card .avatar {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-dark);
        display: grid;
        place-items: center;
        font-weight: var(--ac-font-weight-bold);
        font-size: 13px;
      }

      .patient-card .avatar.plus {
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action);
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

      .calendar-wrapper {
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: 16px;
        background: var(--ac-color-surface);
        margin-bottom: 18px;
      }

      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
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

      .day-cell.off-day {
        opacity: 0.35;
        cursor: not-allowed;
        text-decoration: line-through;
        background: var(--ac-color-red-tint-50);
        color: var(--ac-color-alert-strong);
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

      .legend-dot.off-duty {
        background: var(--ac-color-red-border);
      }

      .legend-dot.selected {
        background: var(--ac-color-action);
      }

      .slots-container {
        padding: 16px;
        background: var(--ac-color-surface-slate);
        border: 1.5px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
      }

      .slot-groups {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-top: 10px;
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
        border-color: var(--ac-color-border-slate);
        text-decoration: line-through;
      }

      .loading-slots {
        margin: 10px 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-style: italic;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .no-slots-notice {
        padding: 14px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-amber-tint-warm);
        border: 1px solid var(--ac-color-amber-tint-sand);
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
        margin-top: 10px;
      }

      .no-slots-notice p {
        margin: 0;
      }

      .reason-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }

      .reason-chip {
        min-height: 42px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
        padding: 0 18px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }

      .reason-chip:hover {
        background: var(--ac-color-surface-slate);
      }

      .reason-chip.selected {
        border-color: var(--ac-color-sage);
        background: var(--ac-color-sage-light);
        color: var(--ac-color-text-dark);
        box-shadow: var(--ac-shadow-xs);
      }

      .reason-guidance {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
        background: var(--ac-color-tint-blue-soft);
        padding: 12px 14px;
        border-radius: var(--ac-radius-md);
      }

      .reason-section-group {
        margin-top: 24px;
        padding-top: 18px;
        border-top: 1px dashed var(--ac-color-border);
      }

      .sub-header {
        margin-bottom: 12px;
      }

      .symptom-chips-container {
        margin-top: 16px;
      }

      .symptoms-label {
        display: block;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-muted);
        margin-bottom: 8px;
      }

      .symptom-chips-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .symptom-chip {
        min-height: 34px;
        padding: 0 14px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 12px;
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .symptom-chip:hover {
        background: var(--ac-color-tint-blue-soft);
        border-color: var(--ac-color-border-info);
      }

      .symptom-chip.selected {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .symptoms-summary-item {
        grid-column: 1 / -1;
      }

      .review-symptom-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }

      .review-symptom-tag {
        font-size: 11px;
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-semibold);
      }

      .review-card {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
        padding: 16px;
        background: var(--ac-color-tint-blue-soft);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-md);
        margin-bottom: 18px;
      }

      .review-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .review-key {
        font-size: 11px;
        color: var(--ac-color-text-muted);
        text-transform: uppercase;
        font-weight: var(--ac-font-weight-semibold);
        letter-spacing: 0.03em;
      }

      .review-val {
        color: var(--ac-color-text-strong);
        font-size: 14px;
      }

      .notes-input {
        width: 100%;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: 12px 14px;
        font-family: inherit;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text);
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
        align-items: center;
        gap: 12px;
        margin-top: 10px;
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

      @media (max-width: 540px) {
        .wizard-stepper {
          overflow-x: auto;
        }

        .step-label {
          display: none;
        }

        .modal-footer {
          flex-direction: column-reverse;
          align-items: stretch;
        }

        .modal-footer button {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookAppointmentModalComponent implements OnInit {
  protected readonly facade = inject(AppointmentsFacade);
  protected readonly children = inject(ChildrenFacade);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly step = signal<WizardStep>(1);
  protected readonly visitReasons = visitReasons;
  protected readonly commonSymptoms = [
    'Speech & Language Delay',
    'Sensory Sensitivity (Sound/Light)',
    'Social & Peer Communication',
    'Repetitive Motor Behaviors',
    'Emotional Regulation',
    'School Learning Accommodations',
  ] as const;
  protected readonly selectedSymptoms = signal<ReadonlySet<string>>(new Set());
  protected readonly selectedSymptomsList = computed(() => Array.from(this.selectedSymptoms()));

  protected formatVisitReason(reason: VisitReason): string {
    const isKm = this.currentLang() === 'km';
    switch (reason) {
      case 'Consultation':
        return isKm ? 'ការពិគ្រោះយោបល់' : 'Consultation';
      case 'Follow-up':
        return isKm ? 'ការតាមដានបន្ត' : 'Follow-up';
      case 'Test results':
        return isKm ? 'លទ្ធផលតេស្ត' : 'Test results';
      case 'Other':
        return isKm ? 'ផ្សេងៗ' : 'Other';
      default:
        return reason;
    }
  }

  protected formatSymptomLabel(symptom: string): string {
    const isKm = this.currentLang() === 'km';
    switch (symptom) {
      case 'Speech & Language Delay':
        return isKm ? 'ការយឺតយ៉ាវក្នុងការនិយាយ និងភាសា' : 'Speech & Language Delay';
      case 'Sensory Sensitivity (Sound/Light)':
        return isKm ? 'ភាពងាយរងរំញោចញ្ញាណ (សំឡេង/ពន្លឺ)' : 'Sensory Sensitivity (Sound/Light)';
      case 'Social & Peer Communication':
        return isKm ? 'ទំនាក់ទំនងសង្គម និងមិត្តភក្តិ' : 'Social & Peer Communication';
      case 'Repetitive Motor Behaviors':
        return isKm ? 'ចលនារាងកាយច្រំដែល' : 'Repetitive Motor Behaviors';
      case 'Emotional Regulation':
        return isKm ? 'ការគ្រប់គ្រងអារម្មណ៍' : 'Emotional Regulation';
      case 'School Learning Accommodations':
        return isKm ? 'ការសម្របសម្រួលការសិក្សានៅសាលា' : 'School Learning Accommodations';
      default:
        return symptom;
    }
  }

  protected isSymptomSelected(symptom: string): boolean {
    return this.selectedSymptoms().has(symptom);
  }

  protected toggleSymptom(symptom: string): void {
    this.selectedSymptoms.update((current) => {
      const next = new Set(current);
      if (next.has(symptom)) {
        next.delete(symptom);
      } else {
        next.add(symptom);
      }
      return next;
    });
  }

  protected readonly weekdayLabels = computed(() =>
    this.currentLang() === 'km'
      ? ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  );
  private readonly viewMonth = signal(startOfMonth(new Date()));

  protected readonly monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString(this.currentLang() === 'km' ? 'km-KH' : undefined, {
      month: 'long',
      year: 'numeric',
    }),
  );

  protected readonly morningSlots = computed(() =>
    this.facade.booking().slots.filter((slot) => isMorningSlot(slot.time)),
  );

  protected readonly afternoonSlots = computed(() =>
    this.facade.booking().slots.filter((slot) => !isMorningSlot(slot.time)),
  );

  protected readonly selectedChildName = computed(() => {
    const childId = this.facade.booking().childId;
    if (!childId) return this.currentLang() === 'km' ? 'មិនទាន់ជ្រើសរើស' : 'Not selected';
    const child = this.children.children().find((c) => c.id === childId);
    return child
      ? `${child.firstName} ${child.lastName ?? ''}`.trim()
      : this.currentLang() === 'km'
        ? 'អ្នកជំងឺ'
        : 'Patient';
  });

  protected readonly calendarDays = computed<readonly CalendarDay[]>(() => {
    const month = this.viewMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstOfMonth = new Date(year, monthIndex, 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());
    const today = startOfDay(new Date());

    const doctor = this.facade.booking().doctor;
    const availableDaysList = doctor?.availableDays
      ? doctor.availableDays
          .split(',')
          .map((d) => Number.parseInt(d.trim(), 10))
          .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
      : [1, 2, 3, 4, 5];
    const availableDaysSet = new Set(availableDaysList);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const isPast = startOfDay(date).getTime() < today.getTime();
      const isOffDay = !availableDaysSet.has(date.getDay());
      return {
        iso: toIsoDate(date),
        label: date.getDate(),
        isCurrentMonth: date.getMonth() === monthIndex,
        isPast,
        isOffDay,
      };
    });
  });

  protected readonly dialogLabel = computed(() =>
    this.currentLang() === 'km'
      ? `កក់ការណាត់ជួបជាមួយ ${this.facade.booking().doctor?.fullName ?? 'អ្នកឯកទេស'}`
      : `Book appointment with ${this.facade.booking().doctor?.fullName ?? 'specialist'}`,
  );

  ngOnInit() {
    this.children.load();
  }

  protected setStep(step: WizardStep) {
    this.step.set(step);
  }

  protected formatSchedule(
    doctor?: {
      availableDays?: string;
      startHour?: number;
      endHour?: number;
    } | null,
  ): string {
    const isKm = this.currentLang() === 'km';
    if (!doctor) return isKm ? 'ព័ត៌មានលម្អិតកាលវិភាគពេលសាកសួរ' : 'Schedule details upon inquiry';
    const days = doctor.availableDays ?? '1,2,3,4,5';
    const dayNames = isKm
      ? ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activeDays = days
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
      .map((n) => dayNames[n])
      .join(', ');

    const start = doctor.startHour ?? 9;
    const end = doctor.endHour ?? 17;
    const timeRange = `${start.toString().padStart(2, '0')}:00 - ${end.toString().padStart(2, '0')}:00`;

    return activeDays
      ? `${activeDays} (${timeRange})`
      : isKm
        ? `ម៉ោងធ្វើការ: ${timeRange}`
        : `Hours: ${timeRange}`;
  }

  protected formatSelectedDate(isoDate: string): string {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(
      this.currentLang() === 'km' ? 'km-KH' : undefined,
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      },
    );
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

      if (missing === 'child') {
        this.step.set(1);
      } else if (missing === 'date' || missing === 'time') {
        this.step.set(2);
      }

      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-booking-required="${missing}"] button:not(:disabled)`)
        ?.focus();
    });
  }

  protected initials(name: string): string {
    const clean = name.replace(/^Dr\.?\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'CH';
  }

  protected ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
      years -= 1;
    }
    const safeYears = Math.max(years, 0);
    return this.currentLang() === 'km' ? `អាយុ ${safeYears} ឆ្នាំ` : `Age ${safeYears}`;
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
