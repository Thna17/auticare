import { computed, inject, Injectable, signal } from '@angular/core';
import type { PaginationMeta } from '@auticare/contracts';
import { AppointmentsApi } from '../data-access/appointments.api';
import type {
  AppointmentResponse,
  CreateAppointmentRequest,
  DoctorResponse,
  HospitalContext,
  SpecialtyCategory,
} from '../appointments.types';

export type BookingStep = 'select' | 'submitting' | 'confirmed';

export const visitReasons = ['Consultation', 'Follow-up', 'Test results', 'Other'] as const;
export type VisitReason = (typeof visitReasons)[number];

export type RescheduleState = {
  readonly isOpen: boolean;
  readonly appointment: AppointmentResponse | null;
  readonly date: string | null;
  readonly time: string | null;
  readonly reason: string;
  readonly slots: readonly { time: string; iso: string; available: boolean }[];
  readonly slotsLoading: boolean;
  readonly error: string | null;
  readonly submitting: boolean;
};

type BookingState = {
  readonly isOpen: boolean;
  readonly step: BookingStep;
  readonly doctor: DoctorResponse | null;
  readonly childId: string | null;
  readonly date: string | null;
  readonly time: string | null;
  readonly slots: readonly { time: string; iso: string; available: boolean }[];
  readonly slotsLoading: boolean;
  readonly visitReason: VisitReason | null;
  readonly notes: string;
  readonly error: string | null;
  readonly confirmed: AppointmentResponse | null;
};

const initialBooking: BookingState = {
  isOpen: false,
  step: 'select',
  doctor: null,
  childId: null,
  date: null,
  time: null,
  slots: [],
  slotsLoading: false,
  visitReason: null,
  notes: '',
  error: null,
  confirmed: null,
};

const initialReschedule: RescheduleState = {
  isOpen: false,
  appointment: null,
  date: null,
  time: null,
  reason: '',
  slots: [],
  slotsLoading: false,
  error: null,
  submitting: false,
};

@Injectable({ providedIn: 'root' })
export class AppointmentsFacade {
  private readonly api = inject(AppointmentsApi);

  // Dashboard list state
  readonly appointments = signal<readonly AppointmentResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Discovery state
  readonly activeHospital = signal<HospitalContext | null>(null);
  readonly doctors = signal<readonly DoctorResponse[]>([]);
  readonly doctorsLoading = signal(false);
  readonly categoryFilter = signal<SpecialtyCategory>('All');

  readonly filteredDoctors = computed(() => {
    const category = this.categoryFilter();
    const doctors = this.doctors();
    if (category === 'All') return doctors;
    return doctors.filter((doctor) => doctor.specialty === category);
  });

  // Booking modal state
  readonly booking = signal<BookingState>(initialBooking);

  readonly stats = computed(() => {
    const appointments = this.appointments();
    const now = Date.now();
    return {
      total: appointments.length,
      pendingReview: appointments.filter((a) => a.status === 'REQUESTED').length,
      upcoming: appointments.filter(
        (a) =>
          (a.status === 'CONFIRMED' || a.status === 'REQUESTED') &&
          new Date(a.scheduledAt).getTime() >= now,
      ).length,
    };
  });

  /** Ids currently being cancelled, so each row can disable just its own button. */
  readonly cancelling = signal<readonly string[]>([]);
  readonly cancelError = signal<string | null>(null);

  /**
   * Cancel one of the signed-in parent's own appointments. The API refuses
   * anything that is not REQUESTED or CONFIRMED, so the surfaced message comes
   * from the server rather than being guessed here.
   */
  cancelAppointment(appointmentId: string) {
    this.cancelError.set(null);
    this.cancelling.update((ids) => [...ids, appointmentId]);
    this.api.cancelAppointment(appointmentId).subscribe({
      next: (updated) => {
        this.appointments.update((rows) =>
          rows.map((row) => (row.id === updated.id ? updated : row)),
        );
        this.cancelling.update((ids) => ids.filter((id) => id !== appointmentId));
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        this.cancelError.set(
          err?.error?.error?.message ?? 'This appointment could not be cancelled.',
        );
        this.cancelling.update((ids) => ids.filter((id) => id !== appointmentId));
      },
    });
  }

  /** Current page and the server's counts, so the view can offer paging controls. */
  readonly page = signal(1);
  readonly pagination = signal<PaginationMeta | null>(null);
  goToPage(page: number) {
    this.page.set(Math.max(1, page));
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading.set(true);
    this.error.set(null);
    this.api.listAppointments(this.page()).subscribe({
      next: ({ appointments, pagination }) => {
        this.appointments.set(appointments);
        this.pagination.set(pagination);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Appointments could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  enterHospital(hospital: HospitalContext) {
    this.activeHospital.set(hospital);
    this.categoryFilter.set('All');
    this.doctors.set([]);
    this.doctorsLoading.set(true);
    this.api.listDoctors(hospital.id).subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.doctorsLoading.set(false);
      },
      error: () => {
        this.doctorsLoading.set(false);
      },
    });
  }

  setCategory(category: SpecialtyCategory) {
    this.categoryFilter.set(category);
  }

  readonly reschedule = signal<RescheduleState>(initialReschedule);

  openBooking(doctor: DoctorResponse) {
    this.booking.set({ ...initialBooking, isOpen: true, doctor });
  }

  closeBooking() {
    this.booking.set(initialBooking);
  }

  selectChild(childId: string) {
    this.booking.update((state) => ({ ...state, childId, error: null }));
  }

  selectDate(date: string) {
    this.booking.update((state) => ({
      ...state,
      date,
      time: null,
      error: null,
      slots: [],
      slotsLoading: true,
    }));

    const doctor = this.booking().doctor;
    if (doctor) {
      if (doctor.availableDays) {
        const availableDaysList = doctor.availableDays
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
        const [year, month, day] = date.split('-').map(Number);
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        if (availableDaysList.length > 0 && !availableDaysList.includes(dayOfWeek)) {
          // Off day for this specialist: do not call API or fabricate slots
          this.booking.update((state) => ({
            ...state,
            slots: [],
            slotsLoading: false,
          }));
          return;
        }
      }

      this.api.getDoctorSlots(doctor.id, date).subscribe({
        next: (res) => {
          this.booking.update((state) => ({
            ...state,
            slots: res.slots ?? [],
            slotsLoading: false,
          }));
        },
        error: () => {
          this.booking.update((state) => ({
            ...state,
            slotsLoading: false,
            error: 'Could not load availability for this date.',
          }));
        },
      });
    } else {
      this.booking.update((state) => ({ ...state, slotsLoading: false }));
    }
  }

  selectTime(time: string) {
    this.booking.update((state) => ({ ...state, time, error: null }));
  }

  selectVisitReason(visitReason: VisitReason) {
    this.booking.update((state) => ({ ...state, visitReason, error: null }));
  }

  setNotes(notes: string) {
    this.booking.update((state) => ({ ...state, notes }));
  }

  confirmBooking() {
    const state = this.booking();
    const hospital = this.activeHospital();
    if (!state.doctor || !hospital || !state.childId || !state.date || !state.time) {
      this.booking.update((s) => ({ ...s, error: 'Choose a child, date, and time to continue.' }));
      return;
    }

    // Find the slot's ISO timestamp
    const selectedSlot = state.slots.find((s) => s.time === state.time);
    if (!selectedSlot) {
      this.booking.update((s) => ({
        ...s,
        error: 'Please choose an available appointment slot.',
      }));
      return;
    }
    const scheduledAt = selectedSlot.iso;
    const reason = [state.visitReason, state.notes.trim()].filter(Boolean).join(' — ') || undefined;
    const request: CreateAppointmentRequest = {
      childId: state.childId,
      hospitalId: hospital.id,
      doctorId: state.doctor.id,
      scheduledAt,
      reason,
    };

    this.booking.update((s) => ({ ...s, step: 'submitting', error: null }));
    this.api.createAppointment(request).subscribe({
      next: (appointment) => {
        this.appointments.update((appointments) => [appointment, ...appointments]);
        this.booking.update((s) => ({ ...s, step: 'confirmed', confirmed: appointment }));
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        this.booking.update((s) => ({
          ...s,
          step: 'select',
          error: err?.error?.error?.message ?? 'Booking could not be confirmed. Please try again.',
        }));
      },
    });
  }

  // ── Rescheduling Flow ──────────────────────────────────────────────────
  openReschedule(appointment: AppointmentResponse) {
    this.reschedule.set({
      ...initialReschedule,
      isOpen: true,
      appointment,
      reason: appointment.reason ?? '',
    });
  }

  closeReschedule() {
    this.reschedule.set(initialReschedule);
  }

  selectRescheduleDate(date: string) {
    this.reschedule.update((s) => ({
      ...s,
      date,
      time: null,
      error: null,
      slots: [],
      slotsLoading: true,
    }));

    const appointment = this.reschedule().appointment;
    if (appointment?.doctorId) {
      this.api.getDoctorSlots(appointment.doctorId, date).subscribe({
        next: (res) => {
          this.reschedule.update((s) => ({
            ...s,
            slots: res.slots,
            slotsLoading: false,
          }));
        },
        error: () => {
          this.reschedule.update((s) => ({
            ...s,
            slotsLoading: false,
            error: 'Could not load availability for this date.',
          }));
        },
      });
    } else {
      this.reschedule.update((s) => ({ ...s, slotsLoading: false }));
    }
  }

  selectRescheduleTime(time: string) {
    this.reschedule.update((s) => ({ ...s, time, error: null }));
  }

  setRescheduleReason(reason: string) {
    this.reschedule.update((s) => ({ ...s, reason }));
  }

  confirmReschedule() {
    const state = this.reschedule();
    if (!state.appointment || !state.date || !state.time) {
      this.reschedule.update((s) => ({
        ...s,
        error: 'Choose a date and time slot to reschedule.',
      }));
      return;
    }

    const selectedSlot = state.slots.find((s) => s.time === state.time);
    const scheduledAt = selectedSlot
      ? selectedSlot.iso
      : combineDateAndTime(state.date, state.time);

    this.reschedule.update((s) => ({ ...s, submitting: true, error: null }));
    this.api
      .rescheduleAppointment(state.appointment.id, {
        scheduledAt,
        reason: state.reason.trim() || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.appointments.update((rows) =>
            rows.map((row) => (row.id === updated.id ? updated : row)),
          );
          this.closeReschedule();
        },
        error: (err: { error?: { error?: { message?: string } } }) => {
          this.reschedule.update((s) => ({
            ...s,
            submitting: false,
            error:
              err?.error?.error?.message ??
              'This appointment could not be rescheduled. Please try another slot.',
          }));
        },
      });
  }
}

function combineDateAndTime(isoDate: string, time: string): string {
  const [hoursLabel, meridiem] = time.split(' ');
  const [hoursRaw, minutes] = hoursLabel.split(':').map(Number);
  let hours = hoursRaw % 12;
  if (meridiem === 'PM') hours += 12;
  const date = new Date(`${isoDate}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}
