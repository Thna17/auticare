import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DoctorResponse } from '@auticare/contracts';
import { HospitalManagementApi } from './hospital-management.api';
import { HospitalDoctorsPage } from './hospital-doctors.page';

describe('HospitalDoctorsPage', () => {
  let fixture: ComponentFixture<HospitalDoctorsPage>;
  let component: HospitalDoctorsPage;
  let mockApi: {
    doctors: ReturnType<typeof vi.fn>;
    createDoctor: ReturnType<typeof vi.fn>;
    updateDoctor: ReturnType<typeof vi.fn>;
    deleteDoctor: ReturnType<typeof vi.fn>;
  };

  const sampleDoctor: DoctorResponse = {
    id: 'doc_1',
    hospitalId: 'hosp_1',
    fullName: 'Dr. Jane Smith',
    specialty: 'Developmental Pediatrician',
    bio: 'Expert in early neurodevelopment.',
    availableDays: '1,2,3,4,5',
    startHour: 9,
    endHour: 17,
    slotDurationMinutes: 30,
    timezone: 'Asia/Phnom_Penh',
  };

  beforeEach(async () => {
    mockApi = {
      doctors: vi.fn().mockReturnValue(of([sampleDoctor])),
      createDoctor: vi.fn().mockReturnValue(of(sampleDoctor)),
      updateDoctor: vi.fn().mockReturnValue(
        of({
          ...sampleDoctor,
          fullName: 'Dr. Jane Smith-Jones',
          specialty: 'Pediatric Neurologist',
        }),
      ),
      deleteDoctor: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [HospitalDoctorsPage],
      providers: [{ provide: HospitalManagementApi, useValue: mockApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalDoctorsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders doctors list and displays formatted schedule and bio', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dr. Jane Smith');
    expect(compiled.textContent).toContain('Developmental Pediatrician');
    expect(compiled.textContent).toContain('Mon, Tue, Wed, Thu, Fri · 9:00 - 17:00 (30m slots)');
    expect(compiled.textContent).toContain('Expert in early neurodevelopment.');
  });

  it('submits doctor creation with full contract fields', () => {
    component.formFullName.set('Dr. Alan Turing');
    component.formSpecialty.set('Child Neurologist');
    component.formBio.set('Specialist in pediatric neuroimaging.');
    component.selectedDays.set(new Set(['1', '3', '5']));
    component.formStartHour.set(8);
    component.formEndHour.set(16);
    component.formSlotDuration.set(45);

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(mockApi.createDoctor).toHaveBeenCalledWith({
      fullName: 'Dr. Alan Turing',
      specialty: 'Child Neurologist',
      bio: 'Specialist in pediatric neuroimaging.',
      availableDays: '1,3,5',
      startHour: 8,
      endHour: 16,
      slotDurationMinutes: 45,
    });
  });

  it('opens confirmation modal before removing specialist and calls deleteDoctor on confirm', () => {
    expect(component.doctorToRemove()).toBeNull();

    // Click remove button on first doctor
    const removeBtn = fixture.nativeElement.querySelector('.remove-button') as HTMLButtonElement;
    removeBtn.click();
    fixture.detectChanges();

    expect(component.doctorToRemove()?.id).toBe('doc_1');
    const dialogText = fixture.nativeElement.textContent;
    expect(dialogText).toContain('Remove Specialist?');
    expect(dialogText).toContain('This cannot be undone.');

    // Confirm removal
    component.confirmRemove();
    expect(mockApi.deleteDoctor).toHaveBeenCalledWith('doc_1');
    expect(component.doctorToRemove()).toBeNull();
  });

  it('opens edit modal with doctor details populated', () => {
    expect(component.doctorToEdit()).toBeNull();

    const editBtn = fixture.nativeElement.querySelector('.edit-button') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();

    expect(component.doctorToEdit()?.id).toBe('doc_1');
    expect(component.editFullName()).toBe('Dr. Jane Smith');
    expect(component.editSpecialty()).toBe('Developmental Pediatrician');
    expect(component.editBio()).toBe('Expert in early neurodevelopment.');
    expect(component.editStartHour()).toBe(9);
    expect(component.editEndHour()).toBe(17);
    expect(component.editSlotDuration()).toBe(30);

    const dialogText = fixture.nativeElement.textContent;
    expect(dialogText).toContain('Edit Specialist');
    expect(dialogText).toContain('Update doctor profile and clinical appointment schedule.');
  });

  it('submits doctor updates and refreshes doctors list', () => {
    component.openEditModal(sampleDoctor);
    component.editFullName.set('Dr. Jane Smith-Jones');
    component.editSpecialty.set('Pediatric Neurologist');
    component.editStartHour.set(10);
    component.editEndHour.set(18);
    component.editSlotDuration.set(45);

    component.saveDoctorEdit(new Event('submit') as SubmitEvent);

    expect(mockApi.updateDoctor).toHaveBeenCalledWith('doc_1', {
      fullName: 'Dr. Jane Smith-Jones',
      specialty: 'Pediatric Neurologist',
      bio: 'Expert in early neurodevelopment.',
      availableDays: '1,2,3,4,5',
      startHour: 10,
      endHour: 18,
      slotDurationMinutes: 45,
    });
    expect(component.doctorToEdit()).toBeNull();
    expect(mockApi.doctors).toHaveBeenCalled();
  });

  it('handles doctor update error gracefully', () => {
    mockApi.updateDoctor.mockReturnValue(throwError(() => new Error('Server error')));

    component.openEditModal(sampleDoctor);
    component.saveDoctorEdit(new Event('submit') as SubmitEvent);

    expect(component.editError()).toBe('Could not update specialist.');
    expect(component.doctorToEdit()?.id).toBe('doc_1');
  });

  it('cancels edit modal and clears doctorToEdit state', () => {
    component.openEditModal(sampleDoctor);
    expect(component.doctorToEdit()?.id).toBe('doc_1');

    component.closeEditModal();
    expect(component.doctorToEdit()).toBeNull();
  });
});
