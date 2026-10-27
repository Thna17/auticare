import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { DoctorResponse } from '@auticare/contracts';
import { UiButtonComponent } from '../../design-system/components/ui-button.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { HospitalManagementApi } from './hospital-management.api';
import { HospitalStaffState } from './data-access/hospital-staff.state';

@Component({
  standalone: true,
  imports: [
    UiButtonComponent,
    UiDialogComponent,
    UiEmptyStateComponent,
    UiMessageComponent,
    UiSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <span>Hospital</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Doctors</span>
    </nav>

    <section class="page-header">
      <div class="header-main">
        <p class="eyebrow">Clinical Care Team</p>
        <h1>Doctors &amp; Specialists</h1>
        <p class="subtitle">
          Manage clinical specialists, consultation hours, active working days, and booking
          availability.
        </p>
      </div>
    </section>

    <section class="list-section">
      <!-- Add Specialist Card -->
      @if (isHospitalAdmin()) {
        <form class="add-form" (submit)="add($event)">
          <div class="form-title">
            <h2>Add new specialist</h2>
            <p>
              Register a clinical specialist with their expertise, active consultation days, and
              slot duration.
            </p>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Full name *</span>
              <input
                name="fullName"
                [value]="formFullName()"
                (input)="formFullName.set($any($event.target).value)"
                required
                placeholder="Dr. Jane Smith"
              />
            </label>
            <label class="field">
              <span>Specialty *</span>
              <input
                name="specialty"
                [value]="formSpecialty()"
                (input)="formSpecialty.set($any($event.target).value)"
                required
                placeholder="Developmental Pediatrician"
              />
            </label>
            <label class="field field-full">
              <span>Professional bio</span>
              <textarea
                name="bio"
                rows="2"
                [value]="formBio()"
                (input)="formBio.set($any($event.target).value)"
                placeholder="Clinical expertise, certifications, and background..."
              ></textarea>
            </label>

            <div class="field field-full">
              <span>Available days</span>
              <div class="day-chips" role="group" aria-label="Available Days">
                @for (day of weekDays; track day.value) {
                  <button
                    type="button"
                    class="day-chip"
                    [class.active]="selectedDays().has(day.value)"
                    (click)="toggleDay(day.value)"
                  >
                    {{ day.label }}
                  </button>
                }
              </div>
            </div>

            <label class="field">
              <span>Start hour (0–23)</span>
              <input
                type="number"
                min="0"
                max="23"
                [value]="formStartHour()"
                (input)="formStartHour.set(toNumber($any($event.target).value, 9))"
              />
            </label>
            <label class="field">
              <span>End hour (1–24)</span>
              <input
                type="number"
                min="1"
                max="24"
                [value]="formEndHour()"
                (input)="formEndHour.set(toNumber($any($event.target).value, 17))"
              />
            </label>
            <label class="field">
              <span>Slot duration</span>
              <select
                [value]="formSlotDuration()"
                (change)="formSlotDuration.set(toNumber($any($event.target).value, 30))"
              >
                <option [value]="15">15 minutes</option>
                <option [value]="20">20 minutes</option>
                <option [value]="30">30 minutes</option>
                <option [value]="45">45 minutes</option>
                <option [value]="60">60 minutes</option>
              </select>
            </label>
          </div>

          <div class="form-actions">
            <ac-ui-button type="submit" variant="primary" [disabled]="submitting()">
              {{ submitting() ? 'Adding specialist…' : 'Add doctor' }}
            </ac-ui-button>
          </div>
        </form>
      }

      @if (error()) {
        <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
      }

      <!-- Doctors Roster -->
      <div class="roster-header">
        <h2>Specialist Roster ({{ doctors().length }})</h2>
        <p>Active specialists available for parent appointment bookings.</p>
      </div>

      @if (loading()) {
        <ac-ui-spinner label="Loading doctors…" />
      } @else if (doctors().length === 0) {
        <ac-ui-empty-state
          title="No doctors added yet"
          message="Add your first specialist so families can request appointments with them."
        />
      } @else {
        <ul class="doctor-list">
          @for (doctor of doctors(); track doctor.id) {
            <li class="doctor-row">
              <div class="doctor-avatar-box" aria-hidden="true">
                {{ getInitials(doctor.fullName) }}
              </div>

              <div class="doctor-info">
                <div class="doctor-header-line">
                  <h3 class="doctor-name">{{ doctor.fullName }}</h3>
                  <span class="specialty-badge">{{ doctor.specialty }}</span>
                </div>

                <div class="doctor-schedule-block">
                  <p class="doctor-schedule">
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{{ formatSchedule(doctor) }}</span>
                  </p>

                  <div class="active-days-chips" aria-label="Active working days">
                    @for (day of getActiveDayLabels(doctor.availableDays); track day) {
                      <span class="active-day-chip">{{ day }}</span>
                    }
                  </div>
                </div>

                @if (doctor.bio) {
                  <p class="doctor-bio">{{ doctor.bio }}</p>
                }
              </div>

              @if (isHospitalAdmin()) {
                <div class="doctor-actions">
                  <button type="button" class="edit-button" (click)="openEditModal(doctor)">
                    Edit Specialist
                  </button>
                  <button type="button" class="remove-button" (click)="doctorToRemove.set(doctor)">
                    Remove
                  </button>
                </div>
              }
            </li>
          }
        </ul>
      }

      <!-- Edit Specialist Modal Dialog -->
      @if (doctorToEdit() && isHospitalAdmin()) {
        <ac-ui-dialog
          heading="Edit Specialist"
          description="Update doctor profile and clinical appointment schedule."
          size="md"
          (close)="closeEditModal()"
        >
          <form class="edit-form" (submit)="saveDoctorEdit($event)">
            @if (editError()) {
              <ac-ui-message tone="error">{{ editError() }}</ac-ui-message>
            }

            <div class="form-grid">
              <label class="field">
                <span>Full name *</span>
                <input
                  name="editFullName"
                  [value]="editFullName()"
                  (input)="editFullName.set($any($event.target).value)"
                  required
                  placeholder="Dr. Jane Smith"
                />
              </label>
              <label class="field">
                <span>Specialty *</span>
                <input
                  name="editSpecialty"
                  [value]="editSpecialty()"
                  (input)="editSpecialty.set($any($event.target).value)"
                  required
                  placeholder="Developmental Pediatrician"
                />
              </label>
              <label class="field field-full">
                <span>Professional bio</span>
                <textarea
                  name="editBio"
                  rows="2"
                  [value]="editBio()"
                  (input)="editBio.set($any($event.target).value)"
                  placeholder="Clinical expertise, certifications, and background..."
                ></textarea>
              </label>

              <div class="field field-full">
                <span>Available days</span>
                <div class="day-chips" role="group" aria-label="Available Days">
                  @for (day of weekDays; track day.value) {
                    <button
                      type="button"
                      class="day-chip"
                      [class.active]="editSelectedDays().has(day.value)"
                      (click)="toggleEditDay(day.value)"
                    >
                      {{ day.label }}
                    </button>
                  }
                </div>
              </div>

              <label class="field">
                <span>Start hour (0–23)</span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  [value]="editStartHour()"
                  (input)="editStartHour.set(toNumber($any($event.target).value, 9))"
                />
              </label>
              <label class="field">
                <span>End hour (1–24)</span>
                <input
                  type="number"
                  min="1"
                  max="24"
                  [value]="editEndHour()"
                  (input)="editEndHour.set(toNumber($any($event.target).value, 17))"
                />
              </label>
              <label class="field">
                <span>Slot duration</span>
                <select
                  [value]="editSlotDuration()"
                  (change)="editSlotDuration.set(toNumber($any($event.target).value, 30))"
                >
                  <option [value]="15">15 minutes</option>
                  <option [value]="20">20 minutes</option>
                  <option [value]="30">30 minutes</option>
                  <option [value]="45">45 minutes</option>
                  <option [value]="60">60 minutes</option>
                </select>
              </label>
            </div>

            <div class="modal-actions form-actions-spaced">
              <ac-ui-button variant="secondary" (click)="closeEditModal()"> Cancel </ac-ui-button>
              <ac-ui-button type="submit" variant="primary" [disabled]="savingEdit()">
                {{ savingEdit() ? 'Saving changes…' : 'Save changes' }}
              </ac-ui-button>
            </div>
          </form>
        </ac-ui-dialog>
      }

      <!-- Remove Confirmation Modal Dialog -->
      @if (doctorToRemove() && isHospitalAdmin()) {
        <ac-ui-dialog
          heading="Remove Specialist?"
          description="Remove Specialist? This cannot be undone."
          dialogRole="alertdialog"
          size="sm"
          (close)="doctorToRemove.set(null)"
        >
          <div dialogFooter class="modal-actions">
            <ac-ui-button variant="secondary" (click)="doctorToRemove.set(null)">
              Cancel
            </ac-ui-button>
            <ac-ui-button variant="destructive" [disabled]="removing()" (click)="confirmRemove()">
              {{ removing() ? 'Removing…' : 'Remove Specialist' }}
            </ac-ui-button>
          </div>
        </ac-ui-dialog>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1040px;
        margin: 0 auto;
      }

      .breadcrumbs {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .breadcrumbs span[aria-current] {
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
      }

      .page-header {
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: var(--ac-color-action);
        font-size: var(--ac-type-meta);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      h1 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
      }

      .subtitle {
        margin: 0;
        max-width: 640px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      .list-section {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* ── Add Specialist Form Card ────────────────────────────── */
      .add-form {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-title h2 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .form-title p {
        margin: 0;
        font-size: 13.5px;
        color: var(--ac-color-text-slate);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .field span {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .field-full {
        grid-column: 1 / -1;
      }

      .field input,
      .field textarea,
      .field select {
        width: 100%;
        padding: 9px 12px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-sm);
        font-size: 14px;
        color: var(--ac-color-text);
        background: var(--ac-color-surface);
        box-sizing: border-box;
      }

      .field input:focus,
      .field textarea:focus,
      .field select:focus {
        outline: 2px solid var(--ac-color-action);
        outline-offset: -1px;
      }

      textarea {
        resize: vertical;
      }

      .day-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .day-chip {
        padding: 6px 14px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 160ms ease;
      }

      .day-chip:hover {
        background: var(--ac-color-surface-slate);
      }

      .day-chip.active {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
      }

      /* ── Roster Section ──────────────────────────────────────── */
      .roster-header {
        margin-top: 8px;
      }

      .roster-header h2 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .roster-header p {
        margin: 0;
        font-size: 13.5px;
        color: var(--ac-color-text-slate);
      }

      .doctor-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .doctor-row {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        transition:
          transform 140ms ease,
          box-shadow 140ms ease;
      }

      .doctor-row:hover {
        transform: translateY(-1px);
        box-shadow: var(--ac-shadow-md);
      }

      .doctor-avatar-box {
        width: 48px;
        height: 48px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 16px;
        flex-shrink: 0;
      }

      .doctor-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .doctor-header-line {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .doctor-name {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .specialty-badge {
        display: inline-block;
        padding: 3px 9px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action);
        font-size: 12px;
        font-weight: 600;
      }

      .doctor-schedule-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .doctor-schedule {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }

      .doctor-schedule svg {
        color: var(--ac-color-action);
      }

      .active-days-chips {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }

      .active-day-chip {
        display: inline-block;
        padding: 1px 7px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-slate-100);
        color: var(--ac-color-slate-700);
        font-size: 11px;
        font-weight: 600;
      }

      .doctor-bio {
        margin: 4px 0 0;
        font-size: 13px;
        line-height: 1.45;
        color: var(--ac-color-text-body);
      }

      .doctor-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .edit-button {
        min-height: 36px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        padding: 0 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 160ms ease;
      }

      .edit-button:hover {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
      }

      .remove-button {
        min-height: 36px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface);
        color: var(--ac-color-alert-slate);
        padding: 0 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 160ms ease;
      }

      .remove-button:hover {
        border-color: var(--ac-color-alert-slate);
        background: var(--ac-color-red-50);
      }

      /* ── Modal Dialog Styles ─────────────────────────────────── */
      .edit-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-actions-spaced {
        margin-top: 16px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      @media (max-width: 680px) {
        .doctor-row {
          flex-direction: column;
          align-items: stretch;
        }

        .doctor-actions {
          align-self: flex-start;
          margin-top: 8px;
        }
      }
    `,
  ],
})
export class HospitalDoctorsPage {
  private readonly api = inject(HospitalManagementApi);
  readonly isHospitalAdmin = inject(HospitalStaffState).isHospitalAdmin;
  readonly doctors = signal<readonly DoctorResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitting = signal(false);
  readonly removing = signal(false);
  readonly doctorToRemove = signal<DoctorResponse | null>(null);

  // Edit signals
  readonly doctorToEdit = signal<DoctorResponse | null>(null);
  readonly editFullName = signal('');
  readonly editSpecialty = signal('');
  readonly editBio = signal('');
  readonly editSelectedDays = signal<Set<string>>(new Set(['1', '2', '3', '4', '5']));
  readonly editStartHour = signal(9);
  readonly editEndHour = signal(17);
  readonly editSlotDuration = signal(30);
  readonly savingEdit = signal(false);
  readonly editError = signal('');

  // Form signals
  readonly formFullName = signal('');
  readonly formSpecialty = signal('');
  readonly formBio = signal('');
  readonly selectedDays = signal<Set<string>>(new Set(['1', '2', '3', '4', '5']));
  readonly formStartHour = signal(9);
  readonly formEndHour = signal(17);
  readonly formSlotDuration = signal(30);

  readonly weekDays = [
    { label: 'Mon', value: '1' },
    { label: 'Tue', value: '2' },
    { label: 'Wed', value: '3' },
    { label: 'Thu', value: '4' },
    { label: 'Fri', value: '5' },
    { label: 'Sat', value: '6' },
    { label: 'Sun', value: '0' },
  ] as const;

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.doctors().subscribe({
      next: (v) => {
        this.doctors.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load doctors.');
        this.loading.set(false);
      },
    });
  }

  getInitials(name: string): string {
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  getActiveDayLabels(availableDays?: string): string[] {
    if (!availableDays) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const map: Record<string, string> = {
      '1': 'Mon',
      '2': 'Tue',
      '3': 'Wed',
      '4': 'Thu',
      '5': 'Fri',
      '6': 'Sat',
      '0': 'Sun',
    };
    return availableDays
      .split(',')
      .map((d) => map[d.trim()] || d.trim())
      .filter(Boolean);
  }

  toggleDay(dayValue: string) {
    const next = new Set(this.selectedDays());
    if (next.has(dayValue)) {
      if (next.size > 1) {
        next.delete(dayValue);
      }
    } else {
      next.add(dayValue);
    }
    this.selectedDays.set(next);
  }

  toNumber(val: unknown, fallback: number): number {
    const num = Number(val);
    return Number.isNaN(num) ? fallback : num;
  }

  add(event: SubmitEvent) {
    event.preventDefault();
    if (!this.formFullName().trim() || !this.formSpecialty().trim()) return;

    this.submitting.set(true);
    this.error.set('');

    const availableDays = Array.from(this.selectedDays()).sort().join(',');

    this.api
      .createDoctor({
        fullName: this.formFullName().trim(),
        specialty: this.formSpecialty().trim(),
        bio: this.formBio().trim() || null,
        availableDays,
        startHour: this.formStartHour(),
        endHour: this.formEndHour(),
        slotDurationMinutes: this.formSlotDuration(),
      })
      .subscribe({
        next: () => {
          this.formFullName.set('');
          this.formSpecialty.set('');
          this.formBio.set('');
          this.selectedDays.set(new Set(['1', '2', '3', '4', '5']));
          this.formStartHour.set(9);
          this.formEndHour.set(17);
          this.formSlotDuration.set(30);
          this.submitting.set(false);
          this.load();
        },
        error: () => {
          this.error.set('Could not add doctor.');
          this.submitting.set(false);
        },
      });
  }

  confirmRemove() {
    const doc = this.doctorToRemove();
    if (!doc) return;
    this.removing.set(true);
    this.api.deleteDoctor(doc.id).subscribe({
      next: () => {
        this.removing.set(false);
        this.doctorToRemove.set(null);
        this.load();
      },
      error: () => {
        this.removing.set(false);
        this.error.set('Doctors with appointment history cannot be removed.');
        this.doctorToRemove.set(null);
      },
    });
  }

  openEditModal(doctor: DoctorResponse) {
    this.doctorToEdit.set(doctor);
    this.editFullName.set(doctor.fullName);
    this.editSpecialty.set(doctor.specialty);
    this.editBio.set(doctor.bio ?? '');
    const days = doctor.availableDays
      ? doctor.availableDays
          .split(',')
          .map((d) => d.trim())
          .filter((d) => Boolean(d))
      : ['1', '2', '3', '4', '5'];
    this.editSelectedDays.set(new Set(days.length > 0 ? days : ['1', '2', '3', '4', '5']));
    this.editStartHour.set(doctor.startHour ?? 9);
    this.editEndHour.set(doctor.endHour ?? 17);
    this.editSlotDuration.set(doctor.slotDurationMinutes ?? 30);
    this.editError.set('');
  }

  closeEditModal() {
    this.doctorToEdit.set(null);
    this.editError.set('');
  }

  toggleEditDay(dayValue: string) {
    const next = new Set(this.editSelectedDays());
    if (next.has(dayValue)) {
      if (next.size > 1) {
        next.delete(dayValue);
      }
    } else {
      next.add(dayValue);
    }
    this.editSelectedDays.set(next);
  }

  saveDoctorEdit(event: SubmitEvent) {
    event.preventDefault();
    const doc = this.doctorToEdit();
    if (!doc) return;
    if (!this.editFullName().trim() || !this.editSpecialty().trim()) return;

    this.savingEdit.set(true);
    this.editError.set('');

    const availableDays = Array.from(this.editSelectedDays()).sort().join(',');

    this.api
      .updateDoctor(doc.id, {
        fullName: this.editFullName().trim(),
        specialty: this.editSpecialty().trim(),
        bio: this.editBio().trim() || null,
        availableDays,
        startHour: this.editStartHour(),
        endHour: this.editEndHour(),
        slotDurationMinutes: this.editSlotDuration(),
      })
      .subscribe({
        next: (updatedDoctor) => {
          this.savingEdit.set(false);
          this.doctorToEdit.set(null);
          this.doctors.set(
            this.doctors().map((d) => (d.id === updatedDoctor.id ? updatedDoctor : d)),
          );
          this.load();
        },
        error: () => {
          this.savingEdit.set(false);
          this.editError.set('Could not update specialist.');
        },
      });
  }

  protected formatSchedule(doctor: DoctorResponse): string {
    const days = doctor.availableDays ?? '1,2,3,4,5';
    const dayNames: Record<string, string> = {
      '0': 'Sun',
      '1': 'Mon',
      '2': 'Tue',
      '3': 'Wed',
      '4': 'Thu',
      '5': 'Fri',
      '6': 'Sat',
    };
    const activeDays = days
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d in dayNames)
      .map((d) => dayNames[d])
      .join(', ');

    const start = doctor.startHour ?? 9;
    const end = doctor.endHour ?? 17;
    const timeRange = `${start}:00 - ${end}:00`;
    const slotDuration = doctor.slotDurationMinutes
      ? ` (${doctor.slotDurationMinutes}m slots)`
      : '';

    return activeDays
      ? `${activeDays} · ${timeRange}${slotDuration}`
      : `${timeRange}${slotDuration}`;
  }
}
