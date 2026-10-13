import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationsStateService } from '../../core/notifications/notifications-state.service';
import { SchoolTopbarComponent } from './school-topbar.component';

describe('SchoolTopbarComponent', () => {
  let fixture: ComponentFixture<SchoolTopbarComponent>;
  let component: SchoolTopbarComponent;
  let router: Router;

  const mockAuthService = {
    parent: signal({
      id: 'parent_1',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'SCHOOL',
      email: 'jane@school.org',
      phoneNumber: null,
      socialMediaAccount: null,
    }),
  };

  const mockNotificationsState = {
    unreadCount: signal(2),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolTopbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationsStateService, useValue: mockNotificationsState },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    fixture = TestBed.createComponent(SchoolTopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders Help link pointing to /support', () => {
    const helpLink = fixture.nativeElement.querySelector(
      'a[aria-label="Help"]',
    ) as HTMLAnchorElement;
    expect(helpLink).toBeTruthy();
    expect(helpLink.getAttribute('routerLink') ?? helpLink.getAttribute('href')).toBe('/support');
  });

  it('navigates to /schools/reports with queryParams when executeSearch is called', () => {
    component['searchQuery'].set('Sensory');
    component['executeSearch']();

    expect(router.navigate).toHaveBeenCalledWith(['/schools/reports'], {
      queryParams: { search: 'Sensory' },
    });
  });

  it('navigates to /schools/reports with empty queryParams when executeSearch is called with blank query', () => {
    component['searchQuery'].set('   ');
    component['executeSearch']();

    expect(router.navigate).toHaveBeenCalledWith(['/schools/reports'], {
      queryParams: {},
    });
  });
});
