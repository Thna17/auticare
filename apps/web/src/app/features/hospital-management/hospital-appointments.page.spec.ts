import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AppointmentResponse } from '@auticare/contracts';
import { HospitalManagementApi } from './hospital-management.api';
import { HospitalAppointmentsPage } from './hospital-appointments.page';

describe('HospitalAppointmentsPage', () => {
  let fixture: ComponentFixture<HospitalAppointmentsPage>;
  let component: HospitalAppointmentsPage;
  let mockApi: {
    appointments: ReturnType<typeof vi.fn>;
    changeStatus: ReturnType<typeof vi.fn>;
  };

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
      scheduledAt: '2026-10-15T09:00:00.000Z',
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
      scheduledAt: '2026-10-14T11:00:00.000Z',
      status: 'COMPLETED',
      reason: 'Follow-up behavioral review',
      rejectionReason: null,
      parentName: 'Betty DeVille',
      parentEmail: 'betty@example.com',
      parentPhoneNumber: '+1-555-0201',
      childDateOfBirth: '2021-03-20',
      childNotes: null,
    },
    {
      id: 'apt_4',
      parentId: 'parent_4',
      childId: 'child_4',
      childName: 'Angelica Pickles',
      hospitalId: 'hosp_1',
      hospitalName: 'Children Hospital',
      doctorId: 'doc_2',
      doctorName: 'Dr. Alan Turing',
      scheduledAt: '2026-10-13T14:00:00.000Z',
      status: 'CANCELLED',
      reason: 'Schedule conflict',
      rejectionReason: 'Specialist unavailable',
      parentName: 'Charlotte Pickles',
      parentEmail: 'charlotte@example.com',
      parentPhoneNumber: '+1-555-0202',
      childDateOfBirth: '2019-05-05',
      childNotes: null,
    },
  ];

  beforeEach(async () => {
    mockApi = {
      appointments: vi.fn().mockReturnValue(of(sampleAppointments)),
      changeStatus: vi.fn().mockReturnValue(of({ ...sampleAppointments[0], status: 'CONFIRMED' })),
    };

    await TestBed.configureTestingModule({
      imports: [HospitalAppointmentsPage],
      providers: [provideRouter([]), { provide: HospitalManagementApi, useValue: mockApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalAppointmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders top stats summary grid including completed visits count', () => {
    const counts = component['counts']();
    expect(counts.pending).toBe(1);
    expect(counts.approved).toBe(1);
    expect(counts.completed).toBe(1);
    expect(counts.rejected).toBe(1);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Pending');
    expect(compiled.textContent).toContain('Approved');
    expect(compiled.textContent).toContain('Completed');
    expect(compiled.textContent).toContain('Rejected');
  });

  it('filters to COMPLETED visits when clicking the Completed stat card', () => {
    const statButtons = fixture.nativeElement.querySelectorAll('.stat-card');
    // Button index 2 is Completed: Pending (0), Approved (1), Completed (2), Rejected (3)
    statButtons[2].dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(component['statusFilter']()).toBe('COMPLETED');
    const visible = component['visibleAppointments']();
    expect(visible.length).toBe(1);
    expect(visible[0].childName).toBe('Phil DeVille');
    expect(visible[0].status).toBe('COMPLETED');
  });

  it('supports doctor filter and search in conjunction with status filter', () => {
    // Select COMPLETED status
    component['statusFilter'].set('COMPLETED');
    fixture.detectChanges();
    expect(component['visibleAppointments']().length).toBe(1);

    // Filter by Dr. Jane Smith (who has no completed appointments)
    component['doctorFilter'].set('Dr. Jane Smith');
    fixture.detectChanges();
    expect(component['visibleAppointments']().length).toBe(0);

    // Filter by Dr. Alan Turing (who has Phil's completed visit)
    component['doctorFilter'].set('Dr. Alan Turing');
    fixture.detectChanges();
    expect(component['visibleAppointments']().length).toBe(1);

    // Search query matching patient name
    component['searchQuery'].set('Phil');
    fixture.detectChanges();
    expect(component['visibleAppointments']().length).toBe(1);

    // Search query not matching
    component['searchQuery'].set('Tommy');
    fixture.detectChanges();
    expect(component['visibleAppointments']().length).toBe(0);
  });

  it('allows completing an approved appointment via complete()', () => {
    mockApi.changeStatus.mockReturnValue(of({ ...sampleAppointments[1], status: 'COMPLETED' }));

    component['complete'](sampleAppointments[1]);
    expect(mockApi.changeStatus).toHaveBeenCalledWith('apt_2', 'COMPLETED', undefined);
  });

  it('renders daily patient queue board with patient quick-cards and scheduled time chips', () => {
    expect(component['viewMode']()).toBe('board');
    const cards = fixture.nativeElement.querySelectorAll('.patient-quick-card');
    expect(cards.length).toBe(4);

    const firstCard = cards[0];
    expect(firstCard.textContent).toContain('Tommy Pickles');
    expect(firstCard.textContent).toContain('Developmental screening evaluation');
    expect(firstCard.querySelector('.scheduled-time-chip')).toBeTruthy();
    expect(firstCard.querySelector('.patient-age-badge')).toBeTruthy();
  });

  it('supports one-click check-in with sensory feedback alert and checked-in badge', () => {
    const item = sampleAppointments[1]; // Chuckie Finster (CONFIRMED)
    expect(component['isCheckedIn'](item.id)).toBe(false);

    component['checkIn'](item);
    fixture.detectChanges();

    expect(component['isCheckedIn'](item.id)).toBe(true);
    expect(component['sensoryFeedback']()).toContain('checked in');
    expect(component['sensoryFeedback']()).toContain('Chuckie Finster');

    const feedbackBanner = fixture.nativeElement.querySelector('.sensory-feedback-banner');
    expect(feedbackBanner).toBeTruthy();
    expect(feedbackBanner.textContent).toContain('Chuckie Finster');
  });

  it('toggles between board view and table view smoothly', () => {
    expect(fixture.nativeElement.querySelector('.patient-queue-grid')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.appointments-table')).toBeFalsy();

    component['viewMode'].set('table');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.appointments-table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.patient-queue-grid')).toBeFalsy();
  });
});
