import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentsApi } from '../data-access/appointments.api';
import type { AppointmentResponse } from '../appointments.types';
import { AppointmentsFacade } from './appointments.facade';

const HOUR = 60 * 60 * 1000;

const appointment = (
  id: string,
  status: AppointmentResponse['status'],
  offsetMs: number,
): AppointmentResponse =>
  ({
    id,
    status,
    scheduledAt: new Date(Date.now() + offsetMs).toISOString(),
  }) as AppointmentResponse;

const makeFacade = (api: Partial<AppointmentsApi>) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: AppointmentsApi,
        useValue: {
          getDoctorSlots: vi.fn(() => of({ doctorId: '', date: '', timezone: '', slots: [] })),
          ...api,
        },
      },
    ],
  });
  return TestBed.inject(AppointmentsFacade);
};

describe('AppointmentsFacade stats', () => {
  let facade: AppointmentsFacade;

  beforeEach(() => {
    facade = makeFacade({});
    facade.appointments.set([
      appointment('a', 'REQUESTED', 2 * HOUR),
      appointment('b', 'CONFIRMED', 48 * HOUR),
      appointment('c', 'CONFIRMED', -48 * HOUR),
      appointment('d', 'CANCELLED', 72 * HOUR),
      appointment('e', 'COMPLETED', -72 * HOUR),
    ]);
  });

  it('counts every appointment as the total, whatever its status', () => {
    expect(facade.stats().total).toBe(5);
  });

  it('counts only REQUESTED as pending review', () => {
    expect(facade.stats().pendingReview).toBe(1);
  });

  it('counts upcoming by time as well as status', () => {
    // Only a (requested, future) and b (confirmed, future). c is confirmed but
    // in the past, and d is in the future but cancelled — counting either would
    // tell a parent they have a visit coming that they do not.
    expect(facade.stats().upcoming).toBe(2);
  });

  it('treats a future REQUESTED appointment as upcoming', () => {
    // It is not confirmed yet, but it is something the family needs to plan
    // around, so it belongs in the count.
    facade.appointments.set([appointment('a', 'REQUESTED', HOUR)]);
    expect(facade.stats().upcoming).toBe(1);
  });
});

describe('AppointmentsFacade paging', () => {
  it('never asks for a page below 1', () => {
    const listAppointments = vi.fn(() =>
      of({ appointments: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } }),
    );
    const facade = makeFacade({ listAppointments } as unknown as Partial<AppointmentsApi>);

    facade.goToPage(0);
    facade.goToPage(-5);

    // The server turns page 0 into a 400, and a negative page would be a
    // negative offset if it ever reached a query.
    expect(facade.page()).toBe(1);
    expect(listAppointments).toHaveBeenCalledWith(1);
  });
});

describe('AppointmentsFacade cancelAppointment', () => {
  it('marks only the row being cancelled as busy, and clears it on success', async () => {
    const updated = { ...appointment('a', 'CANCELLED', HOUR) };
    const facade = makeFacade({
      cancelAppointment: vi.fn(() => of(updated)),
    } as unknown as Partial<AppointmentsApi>);
    facade.appointments.set([
      appointment('a', 'CONFIRMED', HOUR),
      appointment('b', 'CONFIRMED', HOUR),
    ]);

    facade.cancelAppointment('a');

    // The row is replaced rather than removed: a cancelled appointment stays in
    // the list so the parent can see what happened to it.
    expect(facade.appointments().find((row) => row.id === 'a')?.status).toBe('CANCELLED');
    expect(facade.appointments()).toHaveLength(2);
    expect(facade.cancelling()).toEqual([]);
  });

  it('surfaces the server’s own refusal rather than a guess', () => {
    const facade = makeFacade({
      cancelAppointment: vi.fn(() =>
        throwError(() => ({
          error: { error: { message: 'This appointment can no longer be cancelled.' } },
        })),
      ),
    } as unknown as Partial<AppointmentsApi>);
    facade.appointments.set([appointment('a', 'COMPLETED', -HOUR)]);

    facade.cancelAppointment('a');

    // The API decides which transitions are allowed, so repeating its wording is
    // the only way the parent is told the real reason.
    expect(facade.cancelError()).toBe('This appointment can no longer be cancelled.');
    expect(facade.cancelling()).toEqual([]);
  });

  it('falls back to a plain message when the error carries no body', () => {
    const facade = makeFacade({
      cancelAppointment: vi.fn(() => throwError(() => new Error('network down'))),
    } as unknown as Partial<AppointmentsApi>);

    facade.cancelAppointment('a');

    expect(facade.cancelError()).toBe('This appointment could not be cancelled.');
  });
});

describe('AppointmentsFacade doctor filtering', () => {
  it('returns every doctor under the All category', () => {
    const facade = makeFacade({});
    facade.doctors.set([
      { id: '1', specialty: 'Pediatrics' },
      { id: '2', specialty: 'Psychiatry' },
    ] as never);

    expect(facade.filteredDoctors()).toHaveLength(2);
  });

  it('narrows to the chosen specialty', () => {
    const facade = makeFacade({});
    facade.doctors.set([
      { id: '1', specialty: 'Pediatrics' },
      { id: '2', specialty: 'Psychiatry' },
    ] as never);
    facade.categoryFilter.set('Psychiatry' as never);

    expect(facade.filteredDoctors().map((d) => d.id)).toEqual(['2']);
  });
});

describe('AppointmentsFacade slot availability and rescheduling', () => {
  it('fetches real slots when date is selected for booking', () => {
    const getDoctorSlots = vi.fn(() =>
      of({
        doctorId: 'doc-1',
        date: '2026-11-20',
        timezone: 'Asia/Phnom_Penh',
        slots: [{ time: '09:00 AM', iso: '2026-11-20T02:00:00.000Z', available: true }],
      }),
    );
    const facade = makeFacade({ getDoctorSlots } as unknown as Partial<AppointmentsApi>);
    facade.openBooking({
      id: 'doc-1',
      fullName: 'Dr. Test',
      specialty: 'Pediatrics',
      bio: null,
      hospitalId: 'hosp-1',
    });

    facade.selectDate('2026-11-20');

    expect(getDoctorSlots).toHaveBeenCalledWith('doc-1', '2026-11-20');
    expect(facade.booking().slots).toEqual([
      { time: '09:00 AM', iso: '2026-11-20T02:00:00.000Z', available: true },
    ]);
  });

  it('updates appointment scheduledAt on successful reschedule', () => {
    const original = appointment('app-1', 'REQUESTED', HOUR);
    const rescheduled = {
      ...original,
      scheduledAt: new Date(Date.now() + 24 * HOUR).toISOString(),
    };
    const rescheduleAppointment = vi.fn(() => of(rescheduled));
    const facade = makeFacade({ rescheduleAppointment } as unknown as Partial<AppointmentsApi>);

    facade.appointments.set([original]);
    facade.openReschedule(original);
    facade.selectRescheduleDate('2026-11-22');
    facade.selectRescheduleTime('10:00 AM');
    facade.confirmReschedule();

    expect(rescheduleAppointment).toHaveBeenCalled();
    expect(facade.appointments().find((a) => a.id === 'app-1')?.scheduledAt).toBe(
      rescheduled.scheduledAt,
    );
    expect(facade.reschedule().isOpen).toBe(false);
  });

  it('handles off-days without calling API and clears slots', () => {
    const getDoctorSlots = vi.fn();
    const facade = makeFacade({ getDoctorSlots } as unknown as Partial<AppointmentsApi>);
    facade.openBooking({
      id: 'doc-1',
      fullName: 'Dr. Test',
      specialty: 'Pediatrics',
      bio: null,
      hospitalId: 'hosp-1',
      availableDays: '1,2,3,4,5', // Mon - Fri only
    });

    // 2026-11-22 is a Sunday (day 0)
    facade.selectDate('2026-11-22');

    expect(getDoctorSlots).not.toHaveBeenCalled();
    expect(facade.booking().slots).toEqual([]);
    expect(facade.booking().slotsLoading).toBe(false);
  });

  it('refuses to confirm booking when selected time is not in loaded slots', () => {
    const createAppointment = vi.fn();
    const facade = makeFacade({ createAppointment } as unknown as Partial<AppointmentsApi>);
    facade.activeHospital.set({ id: 'hosp-1', name: 'Test Hospital', city: 'Phnom Penh' });
    facade.openBooking({
      id: 'doc-1',
      fullName: 'Dr. Test',
      specialty: 'Pediatrics',
      bio: null,
      hospitalId: 'hosp-1',
    });
    facade.selectChild('child-1');
    facade.selectDate('2026-11-20');
    // Set time without valid loaded slots
    facade.selectTime('09:00 AM');

    facade.confirmBooking();

    expect(createAppointment).not.toHaveBeenCalled();
    expect(facade.booking().error).toBe('Please choose an available appointment slot.');
  });

  it('confirms booking using real slot ISO timestamp', () => {
    const createdAppointment = appointment('app-new', 'REQUESTED', 48 * HOUR);
    const createAppointment = vi.fn(() => of(createdAppointment));
    const facade = makeFacade({ createAppointment } as unknown as Partial<AppointmentsApi>);
    facade.activeHospital.set({ id: 'hosp-1', name: 'Test Hospital', city: 'Phnom Penh' });
    facade.openBooking({
      id: 'doc-1',
      fullName: 'Dr. Test',
      specialty: 'Pediatrics',
      bio: null,
      hospitalId: 'hosp-1',
    });
    facade.selectChild('child-1');
    facade.booking.update((s) => ({
      ...s,
      date: '2026-11-20',
      time: '09:00 AM',
      slots: [{ time: '09:00 AM', iso: '2026-11-20T02:00:00.000Z', available: true }],
    }));

    facade.confirmBooking();

    expect(createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        childId: 'child-1',
        hospitalId: 'hosp-1',
        doctorId: 'doc-1',
        scheduledAt: '2026-11-20T02:00:00.000Z',
      }),
    );
    expect(facade.booking().step).toBe('confirmed');
    expect(facade.booking().confirmed).toEqual(createdAppointment);
  });
});
