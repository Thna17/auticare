import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import type { AppointmentResponse } from '@auticare/contracts';
import { AppointmentDetailDrawerComponent } from './appointment-detail-drawer.component';

describe('AppointmentDetailDrawerComponent', () => {
  let fixture: ComponentFixture<AppointmentDetailDrawerComponent>;
  let component: AppointmentDetailDrawerComponent;

  const sampleAppointment: AppointmentResponse = {
    id: 'apt_123',
    parentId: 'parent_1',
    childId: 'child_1',
    childName: 'Tommy Pickles',
    hospitalId: 'hosp_1',
    hospitalName: 'Children Hospital',
    doctorId: 'doc_1',
    doctorName: 'Dr. Jane Smith',
    scheduledAt: '2026-10-15T09:00:00.000Z',
    status: 'REQUESTED',
    reason: 'Routine developmental assessment',
    rejectionReason: null,
    parentName: 'Didi Pickles',
    parentEmail: 'didi@example.com',
    parentPhoneNumber: '+1-555-0199',
    childDateOfBirth: '2021-04-12',
    childNotes: 'Sensitive to bright lights and loud sounds.',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentDetailDrawerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentDetailDrawerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('appointment', sampleAppointment);
    fixture.componentRef.setInput('allAppointments', [sampleAppointment]);
    fixture.detectChanges();
  });

  it('renders child details including formatted date of birth and care notes', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Tommy Pickles');
    expect(text).toContain('Sensitive to bright lights and loud sounds.');
    // Check formatted DOB
    expect(component['formattedDob']()).toContain('2021');
    expect(text).toContain('Apr 12, 2021');
  });

  it('renders parent guardian contact info with name, email, and phone', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Didi Pickles');
    expect(text).toContain('didi@example.com');
    expect(text).toContain('+1-555-0199');
  });

  it('handles missing DOB and notes gracefully', () => {
    const partialAppointment: AppointmentResponse = {
      ...sampleAppointment,
      childDateOfBirth: null,
      childNotes: null,
      parentEmail: null,
      parentPhoneNumber: null,
    };

    fixture.componentRef.setInput('appointment', partialAppointment);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(component['formattedDob']()).toBe('Not on file');
    expect(text).toContain('No notes on file.');
    expect(text).toContain('Not provided');
  });

  it('renders confirmation checkmark badge and visit summary when status is COMPLETED', () => {
    const completedAppointment: AppointmentResponse = {
      ...sampleAppointment,
      status: 'COMPLETED',
    };

    fixture.componentRef.setInput('appointment', completedAppointment);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Visit Concluded');
    expect(text).toContain('This appointment has been marked as completed');
    expect(text).toContain('Dr. Jane Smith');
    expect(fixture.nativeElement.querySelector('.completed-check-badge')).toBeTruthy();
  });

  it('renders patient developmental dossier including screening risk profile, school link, and sensory triggers', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Patient Developmental Dossier');
    expect(text).toContain('Screening Risk Profile');
    expect(text).toContain('Educational Program Link');
    expect(text).toContain('Active Inclusive School Partner');
    expect(text).toContain('View School Observation Reports');
    expect(text).toContain('Sensory Triggers & Accommodations');

    // Child notes contain bright lights and loud sounds
    expect(text).toContain('Sensitive to Bright Lights / Fluorescents');
    expect(text).toContain('Auditory Sensitivity / Low Decibel Room');
  });

  it('supports clinical notepad prompt chip insertion and therapy domain selection', () => {
    expect(component['clinicalImpression']()).toBe('');

    component['addImpressionPrompt']('Sensory Processing Sensitivity');
    expect(component['clinicalImpression']()).toContain('Sensory Processing Sensitivity');

    // Toggle therapy domains
    expect(component['isTherapySelected']('Sensory Integration')).toBe(false);
    component['toggleTherapyDomain']('Sensory Integration');
    expect(component['isTherapySelected']('Sensory Integration')).toBe(true);

    component['toggleTherapyDomain']('Sensory Integration');
    expect(component['isTherapySelected']('Sensory Integration')).toBe(false);
  });

  it('generates instant parent consultation summary with empathetic guidance', () => {
    component['addImpressionPrompt']('Speech & Language Delay');
    component['generateParentSummary']();
    fixture.detectChanges();

    const summary = component['parentSummary']();
    expect(summary).toContain('CLINICAL CONSULTATION SUMMARY');
    expect(summary).toContain('Tommy Pickles');
    expect(summary).toContain('Children Hospital');
    expect(summary).toContain('Dr. Jane Smith');
    expect(summary).toContain('Recommended Therapy Domains:');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.parent-summary-card')).toBeTruthy();
    expect(compiled.textContent).toContain('Family Takeaway & Care Guidance');

    // Copy action
    component['copyParentSummary']();
    expect(component['copiedSummary']()).toBe(true);
  });
});
