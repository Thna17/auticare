import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppointmentResponse, DoctorResponse } from '@auticare/contracts';
import { HospitalManagementApi } from './hospital-management.api';
import { HospitalDashboardPage } from './hospital-dashboard.page';

describe('HospitalDashboardPage', () => {
  let fixture: ComponentFixture<HospitalDashboardPage>;
  let component: HospitalDashboardPage;
  let mockApi: {
    me: ReturnType<typeof vi.fn>;
    appointments: ReturnType<typeof vi.fn>;
    doctors: ReturnType<typeof vi.fn>;
  };

  const sampleDoctors: DoctorResponse[] = [
    {
      id: 'doc_1',
      hospitalId: 'hosp_1',
      fullName: 'Dr. Jane Smith',
      specialty: 'Developmental Pediatrician',
      bio: 'Expert in pediatric neurology.',
      availableDays: '1,2,3,4,5',
      startHour: 9,
      endHour: 17,
      slotDurationMinutes: 30,
      timezone: 'Asia/Phnom_Penh',
    },
    {
      id: 'doc_2',
      hospitalId: 'hosp_1',
      fullName: 'Dr. Alan Turing',
      specialty: 'Child Neurologist',
      bio: null,
      availableDays: '1,3,5',
      startHour: 8,
      endHour: 16,
      slotDurationMinutes: 45,
      timezone: 'Asia/Phnom_Penh',
    },
  ];

  const todayIso = new Date().toISOString().slice(0, 10) + 'T10:00:00.000Z';

  const sampleAppointments: AppointmentResponse[] = [
    {
      id: 'apt_1',
      parentId: 'parent_1',
      childId: 'child_1',
      childName: 'Tommy Pickles',
      hospitalId: 'hosp_1',
      hospitalName: 'Children Hospital',
      doctorId: 'doc_1',
      doctorName: 'Dr. Jane Smith',
      scheduledAt: todayIso,
      status: 'REQUESTED',
      reason: 'Developmental screening evaluation',
      rejectionReason: null,
      parentName: 'Didi Pickles',
      parentEmail: 'didi@example.com',
      parentPhoneNumber: '+1-555-0199',
      childDateOfBirth: '2021-04-12',
      childNotes: 'Sensory sensitivity',
    },
    {
      id: 'apt_2',
      parentId: 'parent_2',
      childId: 'child_2',
      childName: 'Chuckie Finster',
      hospitalId: 'hosp_1',
      hospitalName: 'Children Hospital',
      doctorId: 'doc_1',
      doctorName: 'Dr. Jane Smith',
      scheduledAt: '2026-10-16T10:00:00.000Z',
      status: 'CONFIRMED',
      reason: 'Speech therapy consultation',
      rejectionReason: null,
      parentName: 'Chas Finster',
      parentEmail: 'chas@example.com',
      parentPhoneNumber: '+1-555-0200',
      childDateOfBirth: '2020-08-15',
      childNotes: 'Anxious in new rooms',
    },
    {
      id: 'apt_3',
      parentId: 'parent_3',
      childId: 'child_3',
      childName: 'Phil DeVille',
      hospitalId: 'hosp_1',
      hospitalName: 'Children Hospital',
      doctorId: 'doc_2',
      doctorName: 'Dr. Alan Turing',
      scheduledAt: '2026-10-01T11:00:00.000Z',
      status: 'COMPLETED',
      reason: 'Follow-up behavioral review',
      rejectionReason: null,
      parentName: 'Betty DeVille',
      parentEmail: 'betty@example.com',
      parentPhoneNumber: '+1-555-0201',
      childDateOfBirth: '2021-03-20',
      childNotes: null,
    },
  ];

  beforeEach(async () => {
    mockApi = {
      me: vi.fn().mockReturnValue(
        of({
          hospital: {
            id: 'hosp_1',
            name: 'National Pediatric Hospital',
            city: 'Phnom Penh',
            address: '100 Russian Blvd',
            services: 'Pediatrics',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        }),
      ),
      appointments: vi.fn().mockReturnValue(of(sampleAppointments)),
      doctors: vi.fn().mockReturnValue(of(sampleDoctors)),
    };

    await TestBed.configureTestingModule({
      imports: [HospitalDashboardPage],
      providers: [provideRouter([]), { provide: HospitalManagementApi, useValue: mockApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders clinical operations header and triage alert banner when pending requests exist', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('National Pediatric Hospital');
    expect(compiled.textContent).toContain('Action Required: 1 Pending Appointment Request');
    expect(compiled.textContent).toContain('Review Requests →');

    // KPI stats verification
    expect(component.requested()).toBe(1);
    expect(component.confirmed()).toBe(1);
    expect(component.completed()).toBe(1);
    expect(component.doctors().length).toBe(2);

    expect(compiled.textContent).toContain('Pending Review');
    expect(compiled.textContent).toContain('Approved Visits');
    expect(compiled.textContent).toContain('Completed');
    expect(compiled.textContent).toContain('Active Specialists');
  });

  it('renders daily appointment schedule for today with patient and specialist', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(component.todayAppointments().length).toBe(1);
    expect(compiled.textContent).toContain("Today's Appointment Schedule");
    expect(compiled.textContent).toContain('Tommy Pickles');
    expect(compiled.textContent).toContain('Dr. Jane Smith');
    expect(compiled.textContent).toContain('Developmental screening evaluation');
  });

  it('renders specialist roster and availability breakdown', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Specialist Roster & Availability');
    expect(compiled.textContent).toContain('Dr. Jane Smith');
    expect(compiled.textContent).toContain('Developmental Pediatrician');
    expect(compiled.textContent).toContain('Dr. Alan Turing');
    expect(compiled.textContent).toContain('Child Neurologist');
    expect(compiled.textContent).toContain('Mon');
    expect(compiled.textContent).toContain('Tue');
  });

  it('handles appointment load errors and supports retrying', () => {
    mockApi.appointments.mockReturnValue(throwError(() => new Error('Server error')));
    const errFixture = TestBed.createComponent(HospitalDashboardPage);
    errFixture.detectChanges();

    const compiled = errFixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Your appointment summary could not be loaded.');

    // Retry resets and attempts reloading
    mockApi.appointments.mockReturnValue(of(sampleAppointments));
    errFixture.componentInstance.load();
    errFixture.detectChanges();
    expect(errFixture.componentInstance.requested()).toBe(1);
  });
});
