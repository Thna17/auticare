import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { HospitalResponse } from '@auticare/contracts';
import { HospitalManagementApi } from './hospital-management.api';
import { HospitalProfilePage } from './hospital-profile.page';
import { HospitalStaffState } from './data-access/hospital-staff.state';
import { provideRouter } from '@angular/router';

describe('HospitalProfilePage', () => {
  let fixture: ComponentFixture<HospitalProfilePage>;
  let component: HospitalProfilePage;
  let mockApi: {
    me: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };

  const sampleHospital: HospitalResponse = {
    id: 'hosp_1',
    name: 'Metropolitan Pediatric Center',
    city: 'Phnom Penh',
    address: '100 Russian Blvd',
    services: 'Developmental Pediatrics, Speech Therapy',
    description: null,
    phone: null,
    website: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockApi = {
      me: vi.fn().mockReturnValue(
        of({
          hospital: sampleHospital,
          staff: {
            id: 'staff_1',
            email: 'admin@metro-pediatrics.org',
            firstName: 'Sarah',
            lastName: 'Connor',
            role: 'HOSPITAL',
            phone: '+855 12 345 678',
          },
        }),
      ),
      updateProfile: vi.fn().mockReturnValue(
        of({
          hospital: {
            ...sampleHospital,
            name: 'Updated Pediatric Center',
            city: 'Siem Reap',
          },
          staff: {
            id: 'staff_1',
            email: 'admin@metro-pediatrics.org',
            firstName: 'Sarah',
            lastName: 'Connor',
            role: 'HOSPITAL',
            phone: '+855 99 888 777',
          },
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [HospitalProfilePage],
      providers: [
        provideRouter([]),
        { provide: HospitalManagementApi, useValue: mockApi },
        {
          provide: HospitalStaffState,
          useValue: {
            isHospitalAdmin: signal(true),
            isDoctor: signal(false),
            role: signal('ADMIN'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders hospital profile in view mode upon initialization', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Metropolitan Pediatric Center');
    expect(compiled.textContent).toContain('100 Russian Blvd, Phnom Penh');
    expect(compiled.textContent).toContain('Developmental Pediatrics, Speech Therapy');
    expect(compiled.textContent).toContain('+855 12 345 678');
    expect(component.mode()).toBe('view');
  });

  it('switches to edit mode and cancels edit cleanly', () => {
    component.startEditing();
    fixture.detectChanges();
    expect(component.mode()).toBe('edit');

    const form = fixture.nativeElement.querySelector('form');
    expect(form).not.toBeNull();

    component.cancelEditing();
    fixture.detectChanges();
    expect(component.mode()).toBe('view');
  });

  it('submits updated profile data and updates view mode with flash banner', () => {
    component.startEditing();
    fixture.detectChanges();

    component.form.patchValue({
      name: 'Updated Pediatric Center',
      city: 'Siem Reap',
      phone: '+855 99 888 777',
    });

    component.saveProfile();
    fixture.detectChanges();

    expect(mockApi.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Pediatric Center',
        city: 'Siem Reap',
        phone: '+855 99 888 777',
      }),
    );
    expect(component.mode()).toBe('view');
    expect(component.savedFlash()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Profile saved');
    expect(compiled.textContent).toContain('Updated Pediatric Center');
  });

  it('handles load errors gracefully', async () => {
    mockApi.me.mockReturnValue(throwError(() => new Error('Network error')));
    const errorFixture = TestBed.createComponent(HospitalProfilePage);
    errorFixture.detectChanges();

    const compiled = errorFixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Could not load hospital profile. Please refresh.');
  });
});
