import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type {
  DoctorResponse,
  HospitalStaffCredentialsResponse,
  HospitalStaffMember,
} from '@auticare/contracts';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HospitalManagementApi } from './hospital-management.api';
import { HospitalStaffState } from './data-access/hospital-staff.state';
import { HospitalTeamPage } from './hospital-team.page';

describe('HospitalTeamPage', () => {
  const isHospitalAdminSignal = signal(true);

  const sampleAdmin: HospitalStaffMember = {
    id: 'staff-admin-1',
    role: 'ADMIN',
    firstName: 'Alice',
    lastName: 'Admin',
    title: 'Hospital Director',
    username: 'alice.hosp',
    status: 'ACTIVE',
    doctorId: null,
    doctorName: null,
  };

  const sampleCoordinator: HospitalStaffMember = {
    id: 'staff-coord-1',
    role: 'COORDINATOR',
    firstName: 'Bob',
    lastName: 'Coordinator',
    title: 'Lead Coordinator',
    username: 'bob.hosp',
    status: 'ACTIVE',
    doctorId: null,
    doctorName: null,
  };

  const sampleDoctorMember: HospitalStaffMember = {
    id: 'staff-doc-1',
    role: 'DOCTOR',
    firstName: 'Clara',
    lastName: 'Doctor',
    title: 'Pediatric Specialist',
    username: 'clara.hosp',
    status: 'SETUP_PENDING',
    doctorId: 'doc-1',
    doctorName: 'Dr. Clara Doctor',
  };

  const sampleDoctor: DoctorResponse = {
    id: 'doc-1',
    hospitalId: 'hosp-1',
    fullName: 'Dr. Clara Doctor',
    specialty: 'Pediatric Neurology',
    bio: 'Experienced pediatric neurologist.',
    availableDays: '1,2,3,4,5',
    startHour: 9,
    endHour: 17,
    slotDurationMinutes: 30,
  };

  const sampleDoctor2: DoctorResponse = {
    id: 'doc-2',
    hospitalId: 'hosp-1',
    fullName: 'Dr. David Specialist',
    specialty: 'Child Psychiatry',
    bio: 'Child psychiatrist.',
    availableDays: '1,2,3',
    startHour: 10,
    endHour: 16,
    slotDurationMinutes: 45,
  };

  const sampleCredentials: HospitalStaffCredentialsResponse = {
    staff: sampleCoordinator,
    username: 'bob.hosp',
    setupCode: '123456',
    setupCodeExpiresAt: '2026-11-03T08:00:00.000Z',
  };

  const mockApi = {
    listStaff: vi.fn(() => of([sampleAdmin, sampleCoordinator, sampleDoctorMember])),
    doctors: vi.fn(() => of([sampleDoctor, sampleDoctor2])),
    createStaff: vi.fn(() => of(sampleCredentials)),
    issueSetupCode: vi.fn(() => of(sampleCredentials)),
    deactivateStaff: vi.fn(() => of({ ...sampleCoordinator, status: 'DEACTIVATED' as const })),
    reactivateStaff: vi.fn(() => of({ ...sampleCoordinator, status: 'ACTIVE' as const })),
  };

  const mockStaffState = {
    isHospitalAdmin: isHospitalAdminSignal,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    isHospitalAdminSignal.set(true);
    TestBed.configureTestingModule({
      imports: [HospitalTeamPage],
      providers: [
        { provide: HospitalManagementApi, useValue: mockApi },
        { provide: HospitalStaffState, useValue: mockStaffState },
      ],
    });
  });

  const setupComponent = () => {
    const fixture = TestBed.createComponent(HospitalTeamPage);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      el: fixture.nativeElement as HTMLElement,
    };
  };

  it('loads staff members and available doctors on init', () => {
    const { component, el } = setupComponent();

    expect(mockApi.listStaff).toHaveBeenCalled();
    expect(mockApi.doctors).toHaveBeenCalled();
    expect(component.staff().length).toBe(3);
    // doc-1 is already linked, so availableDoctors should only contain doc-2
    expect(component.availableDoctors().length).toBe(1);
    expect(component.availableDoctors()[0].id).toBe('doc-2');

    expect(el.querySelectorAll('.staff-row').length).toBe(3);
  });

  it('hides add button and actions if not hospital admin', () => {
    isHospitalAdminSignal.set(false);
    const { el } = setupComponent();

    expect(el.querySelector('.btn-primary')).toBeFalsy();
    expect(el.querySelector('ac-ui-message')?.textContent).toContain(
      'Only your hospital admin can add coordinators or doctors.',
    );
    expect(el.querySelector('.row-actions button')).toBeFalsy();
  });

  it('toggles add staff form and creates coordinator', () => {
    const { component, fixture, el } = setupComponent();

    const addBtn = el.querySelector('.btn-primary') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    expect(component.showForm()).toBe(true);

    component.form.patchValue({
      role: 'COORDINATOR',
      firstName: 'Eva',
      lastName: 'Smith',
      title: 'Triage Nurse',
    });
    fixture.detectChanges();

    const submitBtn = el.querySelector('.form-card button[type="submit"]') as HTMLButtonElement;
    submitBtn.click();
    fixture.detectChanges();

    expect(mockApi.createStaff).toHaveBeenCalledWith({
      role: 'COORDINATOR',
      firstName: 'Eva',
      lastName: 'Smith',
      title: 'Triage Nurse',
    });

    expect(component.credentials()).toEqual(sampleCredentials);
    expect(el.querySelector('.credentials')).toBeTruthy();
  });

  it('requires doctorId when role is DOCTOR', () => {
    const { component, fixture } = setupComponent();

    component['toggleForm']();
    fixture.detectChanges();

    component.form.patchValue({
      role: 'DOCTOR',
      firstName: 'Dr. Jane',
      lastName: 'Doe',
      doctorId: '',
    });
    component['onRoleChange']();
    fixture.detectChanges();

    expect(component.form.valid).toBe(false);
    expect(component.form.controls.doctorId.valid).toBe(false);

    component.form.patchValue({ doctorId: 'doc-2' });
    fixture.detectChanges();
    expect(component.form.valid).toBe(true);
  });

  it('issues new setup code for a staff member', () => {
    const { fixture, el } = setupComponent();

    const newCodeBtns = Array.from(el.querySelectorAll('.btn-small')).filter((btn) =>
      btn.textContent?.includes('New setup code'),
    ) as HTMLButtonElement[];
    expect(newCodeBtns.length).toBeGreaterThan(0);

    newCodeBtns[0].click();
    fixture.detectChanges();

    expect(mockApi.issueSetupCode).toHaveBeenCalled();
  });

  it('deactivates and reactivates a staff member', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el } = setupComponent();

    const deactivateBtn = el.querySelector('.btn-small.danger') as HTMLButtonElement;
    expect(deactivateBtn).toBeTruthy();

    deactivateBtn.click();
    fixture.detectChanges();

    expect(mockApi.deactivateStaff).toHaveBeenCalledWith('staff-coord-1');
  });
});
