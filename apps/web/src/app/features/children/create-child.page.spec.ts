import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChildResponse, ParentResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { API_BASE_URL } from '../../core/config/api.config';
import { CreateChildPage } from './create-child.page';

describe('CreateChildPage', () => {
  let httpTesting: HttpTestingController;

  const mockParentUser = signal<ParentResponse | null>({
    id: 'parent-123',
    email: 'parent@auticare.test',
    firstName: 'Alice',
    lastName: 'Walker',
    role: 'PARENT',
    phoneNumber: null,
    socialMediaAccount: null,
  });

  beforeEach(() => {
    mockParentUser.set({
      id: 'parent-123',
      email: 'parent@auticare.test',
      firstName: 'Alice',
      lastName: 'Walker',
      role: 'PARENT',
      phoneNumber: null,
      socialMediaAccount: null,
    });

    TestBed.configureTestingModule({
      imports: [CreateChildPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        {
          provide: AuthService,
          useValue: {
            parent: mockParentUser,
          },
        },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('renders optional last name and residential address inputs alongside required fields', () => {
    const fixture = TestBed.createComponent(CreateChildPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('input[formControlName="firstName"]')).toBeTruthy();
    expect(element.querySelector('input[formControlName="lastName"]')).toBeTruthy();
    expect(element.querySelector('input[formControlName="dateOfBirth"]')).toBeTruthy();
    expect(element.querySelector('input[formControlName="address"]')).toBeTruthy();
    expect(element.querySelector('textarea[formControlName="notes"]')).toBeTruthy();

    const stepCards = element.querySelectorAll('.step-card');
    expect(stepCards.length).toBe(3);
    expect(element.textContent).toContain('Step 1 of 3');
    expect(element.textContent).toContain('Personal Identity');
    expect(element.textContent).toContain('Residential Information');
    expect(element.textContent).toContain('Support & Sensory Care Notes');
  });

  it('submits valid form with optional lastName and address to API', () => {
    const fixture = TestBed.createComponent(CreateChildPage);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.setValue({
      firstName: 'Maya',
      lastName: 'Walker',
      dateOfBirth: '2021-04-12',
      address: '789 Blossom Lane',
      notes: 'Responds well to calm music.',
    });

    component.submit();
    fixture.detectChanges();

    const req = httpTesting.expectOne('/api/v1/children');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      firstName: 'Maya',
      lastName: 'Walker',
      dateOfBirth: '2021-04-12',
      address: '789 Blossom Lane',
      notes: 'Responds well to calm music.',
    });

    const mockResponse: ChildResponse = {
      id: 'child-maya',
      firstName: 'Maya',
      lastName: 'Walker',
      dateOfBirth: '2021-04-12',
      address: '789 Blossom Lane',
      notes: 'Responds well to calm music.',
      archivedAt: null,
    };
    req.flush({ data: mockResponse });
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/children', 'child-maya']);
  });
});
