import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import type { AppointmentResponse } from './appointments.types';
import { I18nService } from '../../core/i18n/i18n.service';
import { formatHospitalName } from '../hospitals/cambodia-hospitals.data';

@Component({
  standalone: true,
  selector: 'ac-appointment-confirmation',
  template: `
    <div class="confirmation">
      <span class="check-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" width="32" height="32">
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

      <h2>
        {{
          currentLang() === 'km' ? 'បានបញ្ជូនសំណើសុំការណាត់ជួប' : 'Appointment Request Submitted'
        }}
      </h2>
      <p class="lead">
        {{
          currentLang() === 'km'
            ? 'សំណើសុំការពិគ្រោះព្យាបាលរបស់អ្នកត្រូវបានទទួលហើយ។ អ្នកសម្របសម្រួលគ្លីនិកនឹងពិនិត្យ និងបញ្ជាក់ម៉ោងណាត់ជួបរបស់អ្នក។'
            : 'Your clinical consultation request has been received. The clinic coordinator will review and confirm your slot.'
        }}
      </p>

      <dl class="summary">
        <div>
          <dt>{{ currentLang() === 'km' ? 'កាលបរិច្ឆេទ' : 'Date' }}</dt>
          <dd>{{ formattedDate() }}</dd>
        </div>
        <div>
          <dt>{{ currentLang() === 'km' ? 'ម៉ោង' : 'Time' }}</dt>
          <dd>{{ formattedTime() }}</dd>
        </div>
        <div>
          <dt>{{ currentLang() === 'km' ? 'មន្ទីរពេទ្យ' : 'Hospital' }}</dt>
          <dd>{{ formatHospitalName(appointment().hospitalName, currentLang()) }}</dd>
        </div>
        <div>
          <dt>{{ currentLang() === 'km' ? 'អ្នកឯកទេស' : 'Specialist' }}</dt>
          <dd>
            {{
              appointment().doctorName ??
                (currentLang() === 'km' ? 'ចាត់តាំងដោយគ្លីនិក' : 'Assigned by clinic')
            }}
          </dd>
        </div>
        @if (appointment().childName) {
          <div>
            <dt>{{ currentLang() === 'km' ? 'អ្នកជំងឺ' : 'Patient' }}</dt>
            <dd>{{ appointment().childName }}</dd>
          </div>
        }
        @if (appointment().reason) {
          <div class="symptoms-row">
            <dt>
              {{
                currentLang() === 'km'
                  ? 'មូលហេតុនៃការពិគ្រោះ និងកំណត់ចំណាំ'
                  : 'Visit Reason & Notes'
              }}
            </dt>
            <dd class="symptoms-text">{{ appointment().reason }}</dd>
          </div>
        }
      </dl>

      <div class="action-buttons">
        <div class="calendar-export-group">
          <button type="button" class="export-btn google-btn" (click)="openGoogleCalendar()">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {{ currentLang() === 'km' ? 'បញ្ចូលទៅក្នុងប្រតិទិន Google' : 'Add to Google Calendar' }}
          </button>
          <button type="button" class="export-btn ical-btn" (click)="exportCalendar()">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {{ currentLang() === 'km' ? 'ទាញយកប្រតិទិន iCal (.ics)' : 'Add to iCal (.ics)' }}
          </button>
        </div>
        <button type="button" class="done-button" (click)="done.emit()">
          {{ currentLang() === 'km' ? 'រួចរាល់' : 'Done' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .confirmation {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 12px 6px 6px;
      }

      .check-badge {
        width: 68px;
        height: 68px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-tint-100);
        color: var(--ac-color-green-700-alt);
        display: grid;
        place-items: center;
        margin-bottom: 20px;
        box-shadow: 0 0 0 8px var(--ac-color-green-tint-50);
        animation: checkBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes checkBounce {
        0% {
          transform: scale(0.6);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      h2 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-card-title);
      }

      .lead {
        margin: 0 0 24px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        max-width: 440px;
        line-height: var(--ac-line-body);
      }

      .summary {
        width: 100%;
        display: grid;
        gap: 12px;
        margin: 0 0 24px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-tint-blue-soft);
        border: 1px solid var(--ac-color-border-info);
        padding: 20px;
        text-align: left;
      }

      .summary div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      dt {
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
      }

      dd {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-semibold);
        text-align: right;
        font-size: var(--ac-type-meta);
      }

      .symptoms-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
        padding-top: 12px;
        border-top: 1px dashed var(--ac-color-border-info);
      }

      .symptoms-text {
        text-align: left;
        font-weight: var(--ac-font-weight-normal);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-body);
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }

      .calendar-export-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        width: 100%;
      }

      @media (max-width: 540px) {
        .calendar-export-group {
          grid-template-columns: 1fr;
        }
      }

      .export-btn {
        width: 100%;
        min-height: 46px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-semibold);
        font-size: var(--ac-type-meta);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
      }

      .export-btn:hover {
        background: var(--ac-color-tint-blue-soft);
        border-color: var(--ac-color-border-info);
      }

      .done-button {
        width: 100%;
        min-height: 46px;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-bold);
        font-size: var(--ac-type-label);
        cursor: pointer;
        box-shadow: var(--ac-shadow-sm);
        transition: background-color 0.2s ease;
      }

      .done-button:hover {
        background: var(--ac-color-action-deep);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentConfirmationComponent {
  readonly appointment = input.required<AppointmentResponse>();
  readonly done = output<void>();

  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;
  protected readonly formatHospitalName = formatHospitalName;

  protected formattedDate(): string {
    const locale = this.currentLang() === 'km' ? 'km-KH' : undefined;
    return new Date(this.appointment().scheduledAt).toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  protected formattedTime(): string {
    const locale = this.currentLang() === 'km' ? 'km-KH' : undefined;
    return new Date(this.appointment().scheduledAt).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  protected exportCalendar(): void {
    const appt = this.appointment();
    const start = new Date(appt.scheduledAt);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatIcsDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AutiCare//Appointment//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${appt.id}@auticare.org`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:Clinical Visit with ${appt.doctorName ?? 'Specialist'}`,
      `DESCRIPTION:Clinical appointment for ${appt.childName ?? 'Child'} at ${appt.hospitalName}. Reason: ${appt.reason ?? 'Developmental Consultation'}`,
      `LOCATION:${appt.hospitalName}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    if (typeof window !== 'undefined' && typeof window.URL !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appointment-${appt.id}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  protected openGoogleCalendar(): void {
    const appt = this.appointment();
    const start = new Date(appt.scheduledAt);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatGDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const title = encodeURIComponent(`Clinical Visit with ${appt.doctorName ?? 'Specialist'}`);
    const details = encodeURIComponent(
      `Clinical appointment for ${appt.childName ?? 'Child'} at ${appt.hospitalName}. Reason: ${appt.reason ?? 'Developmental Consultation'}`,
    );
    const location = encodeURIComponent(appt.hospitalName);
    const dates = `${formatGDate(start)}/${formatGDate(end)}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
