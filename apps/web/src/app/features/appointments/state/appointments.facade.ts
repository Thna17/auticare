import { computed, inject, Injectable, signal } from '@angular/core';
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

type BookingState = {
  readonly isOpen: boolean;
  readonly step: BookingStep;
  readonly doctor: DoctorResponse | null;
  readonly childId: string | null;
  readonly date: string | null;
  readonly time: string | null;
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
  visitReason: null,
  notes: '',
  error: null,
  confirmed: null,
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

  loadAppointments() {
    this.loading.set(true);
    this.error.set(null);
    this.api.listAppointments().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
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
    this.booking.update((state) => ({ ...state, date, time: null, error: null }));
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

    const scheduledAt = combineDateAndTime(state.date, state.time);
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
      error: () => {
        this.booking.update((s) => ({
          ...s,
          step: 'select',
          error: 'Booking could not be confirmed. Please try again.',
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
