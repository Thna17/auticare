import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChildrenFacade } from '../children/state/children.facade';
import { AppointmentsFacade } from './state/appointments.facade';
import { BookAppointmentModalComponent } from './book-appointment-modal.component';
import { I18nService } from '../../core/i18n/i18n.service';

interface MockChild {
  id: string;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string;
  gender: string;
}

interface TestBookingState {
  isOpen: boolean;
  step: string;
  doctor: {
    id: string;
    fullName: string;
    specialty: string;
    availableDays?: string;
    startHour?: number;
    endHour?: number;
  } | null;
  childId: string | null;
  date: string | null;
  time: string | null;
  slots: { time: string; iso: string; available: boolean }[];
  slotsLoading: boolean;
  visitReason: string | null;
  notes: string;
  error: string | null;
  confirmed: Record<string, unknown> | null;
}

describe('BookAppointmentModalComponent', () => {
  let fixture: ComponentFixture<BookAppointmentModalComponent>;
  let component: BookAppointmentModalComponent;

  let mockChildrenFacade: {
    children: ReturnType<typeof signal<MockChild[]>>;
    load: ReturnType<typeof vi.fn>;
  };

  let bookingSignal: ReturnType<typeof signal<TestBookingState>>;
  let mockAppointmentsFacade: {
    booking: typeof bookingSignal;
    selectChild: ReturnType<typeof vi.fn>;
    selectDate: ReturnType<typeof vi.fn>;
    selectTime: ReturnType<typeof vi.fn>;
    selectVisitReason: ReturnType<typeof vi.fn>;
    setNotes: ReturnType<typeof vi.fn>;
    confirmBooking: ReturnType<typeof vi.fn>;
    closeBooking: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockChildrenFacade = {
      children: signal([
        {
          id: 'child_1',
          firstName: 'Liam',
          lastName: 'Miller',
          dateOfBirth: '2020-05-15',
          gender: 'MALE',
        },
      ]),
      load: vi.fn(),
    };

    bookingSignal = signal<TestBookingState>({
      isOpen: true,
      step: 'select',
      doctor: {
        id: 'doc_1',
        fullName: 'Dr. Sarah Connor',
        specialty: 'Pediatric Neurologist',
        availableDays: '1,2,3,4,5',
        startHour: 9,
        endHour: 17,
      },
      childId: null,
      date: null,
      time: null,
      slots: [
        { time: '09:30 AM', iso: '2026-11-20T09:30:00.000Z', available: true },
        { time: '02:00 PM', iso: '2026-11-20T14:00:00.000Z', available: true },
      ],
      slotsLoading: false,
      visitReason: null,
      notes: '',
      error: null,
      confirmed: null,
    });

    mockAppointmentsFacade = {
      booking: bookingSignal,
      selectChild: vi.fn((id: string) => {
        bookingSignal.update((s) => ({ ...s, childId: id }));
      }),
      selectDate: vi.fn((date: string) => {
        bookingSignal.update((s) => ({ ...s, date }));
      }),
      selectTime: vi.fn((time: string) => {
        bookingSignal.update((s) => ({ ...s, time }));
      }),
      selectVisitReason: vi.fn((reason: string) => {
        bookingSignal.update((s) => ({ ...s, visitReason: reason }));
      }),
      setNotes: vi.fn((notes: string) => {
        bookingSignal.update((s) => ({ ...s, notes }));
      }),
      confirmBooking: vi.fn(),
      closeBooking: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BookAppointmentModalComponent],
      providers: [
        provideRouter([]),
        { provide: ChildrenFacade, useValue: mockChildrenFacade },
        { provide: AppointmentsFacade, useValue: mockAppointmentsFacade },
        I18nService,
      ],
    }).compileComponents();

    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    fixture = TestBed.createComponent(BookAppointmentModalComponent);
    component = fixture.componentInstance;
  });

  it('renders wizard step navigation and doctor context card on initial step', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.wizard-stepper')).not.toBeNull();
    expect(compiled.querySelector('.specialist-context-card')).not.toBeNull();
    expect(compiled.textContent).toContain('Dr. Sarah Connor');
    expect(compiled.textContent).toContain('1. Select Patient');
  });

  it('allows child selection in Step 1 and enables continuation to Step 2', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const childCard = compiled.querySelector<HTMLButtonElement>('.patient-card');
    expect(childCard).not.toBeNull();
    expect(childCard?.textContent).toContain('Liam');

    childCard?.click();
    expect(mockAppointmentsFacade.selectChild).toHaveBeenCalledWith('child_1');

    fixture.detectChanges();
    const nextBtn = compiled.querySelector<HTMLButtonElement>('.modal-footer .primary');
    expect(nextBtn?.disabled).toBe(false);

    nextBtn?.click();
    fixture.detectChanges();
    expect(component['step']()).toBe(2);
    expect(compiled.textContent).toContain('2. Choose Date & Time Slot');
  });

  it('groups available time slots into morning and afternoon sessions', () => {
    bookingSignal.update((s) => ({
      ...s,
      childId: 'child_1',
      date: '2026-11-20',
    }));
    component['step'].set(2);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Morning Sessions');
    expect(compiled.textContent).toContain('Afternoon Sessions');
    expect(compiled.textContent).toContain('09:30 AM');
    expect(compiled.textContent).toContain('02:00 PM');
  });

  it('allows selecting visit reason and symptom chips in Step 1 and navigates to Step 3 for review/notes', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Primary Consultation Reason');

    const reasonChip = compiled.querySelector<HTMLButtonElement>('.reason-chip');
    expect(reasonChip).not.toBeNull();
    reasonChip?.click();
    expect(mockAppointmentsFacade.selectVisitReason).toHaveBeenCalled();

    const symptomChip = compiled.querySelector<HTMLButtonElement>('.symptom-chip');
    expect(symptomChip).not.toBeNull();
    symptomChip?.click();
    fixture.detectChanges();
    expect(component['isSymptomSelected']('Speech & Language Delay')).toBe(true);

    bookingSignal.update((s) => ({
      ...s,
      childId: 'child_1',
      date: '2026-11-20',
      time: '09:30 AM',
      visitReason: 'Consultation',
    }));
    component['step'].set(3);
    fixture.detectChanges();

    expect(compiled.textContent).toContain('3. Care Notes & Confirm');
    expect(compiled.querySelector('.review-card')).not.toBeNull();
    expect(compiled.querySelector('.notes-input')).not.toBeNull();

    const confirmBtn = compiled.querySelector<HTMLButtonElement>('.modal-footer .primary');
    confirmBtn?.click();
    expect(mockAppointmentsFacade.confirmBooking).toHaveBeenCalled();
  });

  it('renders confirmation celebration screen with Google Calendar and iCal export buttons when confirmed', () => {
    bookingSignal.set({
      isOpen: true,
      step: 'confirmed',
      doctor: null,
      childId: 'child_1',
      date: '2026-11-20',
      time: '09:30 AM',
      slots: [],
      slotsLoading: false,
      visitReason: 'Consultation',
      notes: '',
      error: null,
      confirmed: {
        id: 'apt_confirmed_1',
        parentId: 'parent_1',
        childId: 'child_1',
        childName: 'Liam Miller',
        hospitalId: 'hosp_1',
        hospitalName: 'Children Hospital',
        doctorId: 'doc_1',
        doctorName: 'Dr. Sarah Connor',
        scheduledAt: '2026-11-20T09:30:00.000Z',
        status: 'REQUESTED',
        reason: 'Consultation',
        rejectionReason: null,
      },
    });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('ac-appointment-confirmation')).not.toBeNull();
    expect(compiled.textContent).toContain('Appointment Request Submitted');
    expect(compiled.querySelector('.export-btn')).not.toBeNull();
    expect(compiled.querySelector('.google-btn')).not.toBeNull();
    expect(compiled.querySelector('.ical-btn')).not.toBeNull();
  });
});
