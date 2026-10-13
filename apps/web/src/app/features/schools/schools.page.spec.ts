import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AdmissionRequestResponse, ParentResponse, SchoolResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { API_BASE_URL } from '../../core/config/api.config';
import { SchoolsPage } from './schools.page';
import { I18nService } from '../../core/i18n/i18n.service';

describe('SchoolsPage', () => {
  let httpTesting: HttpTestingController;
  let i18nService: I18nService;

  const mockSchools: SchoolResponse[] = [
    {
      id: 'sch_1',
      name: 'Hope Bridge Academy',
      city: 'Phnom Penh',
      address: '77 Norodom Blvd',
      description: 'Inclusive education and therapy center.',
      logoUrl: null,
      coverImageUrl: null,
      availabilityStatus: 'IMMEDIATE',
      waitlistEstimate: null,
      studentTeacherRatio: '4:1',
      specializations: ['ABA', 'Speech Therapy'],
      isVerified: true,
      rating: 4.9,
      reviewCount: 5,
      isFavorite: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockApplications: AdmissionRequestResponse[] = [
    {
      id: 'adm_1',
      schoolId: 'sch_1',
      schoolName: 'Hope Bridge Academy',
      schoolCity: 'Phnom Penh',
      schoolAddress: '77 Norodom Blvd',
      childId: 'child_1',
      childName: 'Bopha Sok',
      status: 'REQUESTED',
      message: 'Looking forward to touring the facility.',
      createdAt: '2026-10-01T08:30:00.000Z',
    },
    {
      id: 'adm_2',
      schoolId: 'sch_2',
      schoolName: 'Sunflower Learning Center',
      schoolCity: 'Siem Reap',
      schoolAddress: '12 Wat Bo Rd',
      childId: 'child_1',
      childName: 'Bopha Sok',
      status: 'APPROVED',
      message: null,
      createdAt: '2026-09-15T10:00:00.000Z',
    },
  ];

  const mockAuthService = {
    parent: signal<ParentResponse | null>({
      id: 'parent_1',
      email: 'parent@example.com',
      firstName: 'Dara',
      lastName: 'Sok',
      role: 'PARENT',
      phoneNumber: null,
      socialMediaAccount: null,
    }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SchoolsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: AuthService, useValue: mockAuthService },
        I18nService,
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('en');
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  function flushInitialRequests(
    fixture: ComponentFixture<SchoolsPage>,
    applications = mockApplications,
  ) {
    fixture.detectChanges();

    const listReq = httpTesting.expectOne((r) => r.url === '/api/v1/schools');
    listReq.flush({
      data: {
        schools: mockSchools,
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
      },
    });

    const citiesReq = httpTesting.expectOne('/api/v1/schools/cities');
    citiesReq.flush({ data: ['Phnom Penh', 'Siem Reap'] });

    const appsReq = httpTesting.expectOne('/api/v1/parents/enrollment-requests');
    appsReq.flush({ data: applications });

    fixture.detectChanges();
  }

  it('renders unified page-header with search input and view navigation tabs', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.page-header')).toBeTruthy();
    expect(root.querySelector('.header-actions .search-input')).toBeTruthy();
    expect(root.querySelector('.topbar')).toBeNull();
    expect(root.querySelector('a[href="/help"]')).toBeNull();

    const tabs = root.querySelectorAll('.view-tab');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('School Directory');
    expect(tabs[1].textContent).toContain('My Applications');
    expect(tabs[1].textContent).toContain('2'); // Tab count badge
  });

  it('filters by saved schools when toggle button is clicked', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture);

    const savedToggle = fixture.nativeElement.querySelector(
      '.saved-toggle-btn',
    ) as HTMLButtonElement;
    expect(savedToggle).toBeTruthy();

    savedToggle.click();
    fixture.detectChanges();

    const listReq2 = httpTesting.expectOne((r) => r.url === '/api/v1/schools');
    expect(listReq2.request.params.get('isFavorite')).toBe('true');
    listReq2.flush({
      data: {
        schools: [{ ...mockSchools[0], isFavorite: true }],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
      },
    });
  });

  it('toggles school bookmark directly from directory card', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture);

    const favBtn = fixture.nativeElement.querySelector('.card-favorite-btn') as HTMLButtonElement;
    expect(favBtn).toBeTruthy();

    favBtn.click();
    fixture.detectChanges();

    const addFavReq = httpTesting.expectOne('/api/v1/schools/sch_1/favorites');
    expect(addFavReq.request.method).toBe('POST');
    addFavReq.flush({ data: { favorited: true, schoolId: 'sch_1' } });

    fixture.detectChanges();
    expect(fixture.componentInstance.schools()[0].isFavorite).toBe(true);
  });

  it('switches to My Applications tab and renders submitted enrollment requests', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture);

    const appTab = fixture.nativeElement.querySelectorAll('.view-tab')[1] as HTMLButtonElement;
    appTab.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe('applications');

    const appCards = fixture.nativeElement.querySelectorAll('.application-card');
    expect(appCards.length).toBe(2);

    // First card: Hope Bridge Academy, Pending Review, with message
    expect(appCards[0].textContent).toContain('Hope Bridge Academy');
    expect(appCards[0].textContent).toContain('Phnom Penh');
    expect(appCards[0].textContent).toContain('Pending Review');
    expect(appCards[0].textContent).toContain('Bopha Sok');
    expect(appCards[0].textContent).toContain('Looking forward to touring the facility.');

    // Second card: Sunflower Learning Center, Accepted
    expect(appCards[1].textContent).toContain('Sunflower Learning Center');
    expect(appCards[1].textContent).toContain('Accepted');
  });

  it('displays empty state when parent has no submitted applications and allows returning to directory', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture, []); // No applications

    const appTab = fixture.nativeElement.querySelectorAll('.view-tab')[1] as HTMLButtonElement;
    appTab.click();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('No enrollment applications yet');

    const browseBtn = root.querySelector(
      '.applications-container .apply-filters-btn',
    ) as HTMLButtonElement;
    expect(browseBtn).toBeTruthy();
    expect(browseBtn.textContent).toContain('Browse School Directory');

    browseBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe('directory');
    expect(root.querySelector('.filters-sidebar')).toBeTruthy();
  });

  it('renders school cards with hero image, verified badge, inclusive support ratio, and action buttons', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture);

    const root = fixture.nativeElement as HTMLElement;
    const card = root.querySelector('.school-card');
    expect(card).toBeTruthy();

    expect(card?.querySelector('.school-image')).toBeTruthy();
    expect(card?.querySelector('.verified-badge')?.textContent).toContain('Verified');
    expect(card?.querySelector('.meta-item')?.textContent).toContain('Student-Teacher Ratio');
    expect(card?.querySelector('.meta-item')?.textContent).toContain('4:1');

    const enrollBtn = card?.querySelector('.enrollment-btn');
    expect(enrollBtn).toBeTruthy();
    expect(enrollBtn?.textContent).toContain('Request Enrollment');

    const viewProfileLink = card?.querySelector('.view-details-link');
    expect(viewProfileLink).toBeTruthy();
    expect(viewProfileLink?.textContent).toContain('View Profile');

    const searchInput = root.querySelector('.search-input') as HTMLInputElement;
    expect(searchInput.placeholder).toContain('curriculum');

    // Accreditation badge and special education tags
    expect(card?.querySelector('.accreditation-badge')?.textContent).toContain(
      'Accredited Special Ed Partner',
    );
    expect(card?.querySelector('.specializations-list')?.textContent).toContain('ABA');
    expect(card?.querySelector('.card-favorite-btn')).toBeTruthy();
  });

  it('renders school response notes and supports application status filtering', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture);

    // Switch to Applications tab
    const appTab = fixture.nativeElement.querySelectorAll('.view-tab')[1] as HTMLButtonElement;
    appTab.click();
    fixture.detectChanges();

    // Check filter pills
    const pills = fixture.nativeElement.querySelectorAll('.app-filter-pill');
    expect(pills.length).toBe(4);
    expect(pills[0].textContent).toContain('All (2)');
    expect(pills[1].textContent).toContain('Pending Review (1)');
    expect(pills[2].textContent).toContain('Accepted (1)');
    expect(pills[3].textContent).toContain('Declined (0)');

    // Check school response notes
    const cards = fixture.nativeElement.querySelectorAll('.application-card');
    expect(cards[0].querySelector('.app-response-note-box')).toBeTruthy();
    expect(cards[0].textContent).toContain('Admissions Review Status');
    expect(cards[0].textContent).toContain('Pending Review');

    expect(cards[1].querySelector('.app-response-note-box')).toBeTruthy();
    expect(cards[1].textContent).toContain('School Response & Decision');
    expect(cards[1].textContent).toContain('Application Accepted!');

    // Filter to Accepted only
    pills[2].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.applicationStatusFilter()).toBe('APPROVED');
    const filteredCards = fixture.nativeElement.querySelectorAll('.application-card');
    expect(filteredCards.length).toBe(1);
    expect(filteredCards[0].textContent).toContain('Sunflower Learning Center');
  });

  it('renders bilingual Cambodian accreditation badge and bilingual admissions review notes', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture);

    let root = fixture.nativeElement as HTMLElement;
    let card = root.querySelector('.school-card');
    expect(card).toBeTruthy();

    // In English mode ('en')
    let badge = card?.querySelector('.accreditation-badge');
    expect(badge?.textContent).toContain('Accredited Special Ed Partner');

    // Switch to Applications tab in English
    let appTab = root.querySelectorAll('.view-tab')[1] as HTMLButtonElement;
    appTab.click();
    fixture.detectChanges();

    let appCards = root.querySelectorAll('.application-card');
    expect(appCards[0].textContent).toContain('Admissions Review Status');
    expect(appCards[0].textContent).toContain('Pending Review');
    expect(appCards[1].textContent).toContain('School Response & Decision');
    expect(appCards[1].textContent).toContain('Application Accepted!');

    // Switch to Khmer mode ('km')
    i18nService.setLanguage('km');
    fixture.detectChanges();

    root = fixture.nativeElement as HTMLElement;
    appCards = root.querySelectorAll('.application-card');
    expect(appCards[0].textContent).toContain('ស្ថានភាពពិនិត្យពាក្យសុំ');
    expect(appCards[0].textContent).toContain('កំពុងរង់ចាំការពិនិត្យ');
    expect(appCards[1].textContent).toContain('ការឆ្លើយតប និងការសម្រេចរបស់សាលា');
    expect(appCards[1].textContent).toContain('ពាក្យសុំត្រូវបានទទួលយក');

    // Directory card badge in Khmer
    appTab = root.querySelectorAll('.view-tab')[0] as HTMLButtonElement;
    appTab.click();
    fixture.detectChanges();
    card = root.querySelector('.school-card');
    badge = card?.querySelector('.accreditation-badge');
    expect(badge?.textContent).toContain('ដៃគូអប់រំពិសេសដែលបានបញ្ជាក់');

    // Reset back to English
    i18nService.setLanguage('en');
    fixture.detectChanges();
  });

  it('renders authentic Cambodian inclusive schools fallback when directory has no server listings', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    fixture.detectChanges();

    const listReq = httpTesting.expectOne((r) => r.url === '/api/v1/schools');
    listReq.flush({
      data: {
        schools: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
      },
    });

    const citiesReq = httpTesting.expectOne('/api/v1/schools/cities');
    citiesReq.flush({ data: [] });

    const appsReq = httpTesting.expectOne('/api/v1/parents/enrollment-requests');
    appsReq.flush({ data: [] });

    fixture.detectChanges();

    const schools = fixture.componentInstance.schools();
    expect(schools.length).toBeGreaterThanOrEqual(4);
    expect(schools[0].name).toContain('Rabbit School Organization');
    expect(schools[0].name).toContain('អង្គការសាលាទន្សាយ');

    // In English mode
    let root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Rabbit School Organization');
    expect(root.textContent).toContain('Hands of Hope Community');
    expect(root.textContent).toContain('National Institute of Special Education');

    // In Khmer mode
    i18nService.setLanguage('km');
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('អង្គការសាលាទន្សាយ');
    expect(root.textContent).toContain('សហគមន៍ដៃនៃក្តីសង្ឃឹម');
    expect(root.textContent).toContain('វិទ្យាស្ថានជាតិអប់រំពិសេស');

    // Reset back to English
    i18nService.setLanguage('en');
    fixture.detectChanges();
  });

  it('correctly translates availability badges, student-teacher ratio label, and specializations in Khmer and English modes', () => {
    const fixture = TestBed.createComponent(SchoolsPage);
    flushInitialRequests(fixture);
    const comp = fixture.componentInstance;

    // English mode
    i18nService.setLanguage('en');
    fixture.detectChanges();
    let root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Student-Teacher Ratio');
    expect(comp.availabilityLabel('IMMEDIATE')).toBe('Immediate');
    expect(comp.availabilityLabel('WAITLIST')).toBe('Waitlist');
    expect(comp['formatSpecialization']('Sensory Room')).toBe('Sensory Room');
    expect(comp['formatSpecialization']('Speech Therapy')).toBe('Speech Therapy');
    expect(comp['formatSpecialization']('Life Skills')).toBe('Life Skills');
    expect(comp['formatSpecialization']('Special Education')).toBe('Special Education');

    // Khmer mode
    i18nService.setLanguage('km');
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('សមាមាត្រសិស្សនិងគ្រូ');
    expect(comp.availabilityLabel('IMMEDIATE')).toBe('ចូលរៀនបានភ្លាមៗ');
    expect(comp.availabilityLabel('WAITLIST')).toBe('បញ្ជីរង់ចាំ');
    expect(comp['formatSpecialization']('Sensory Room')).toBe('បន្ទប់ញាណដឹង');
    expect(comp['formatSpecialization']('Speech Therapy')).toBe('ការព្យាបាលការនិយាយ');
    expect(comp['formatSpecialization']('Life Skills')).toBe('ជំនាញជីវិត');
    expect(comp['formatSpecialization']('Special Education')).toBe('ការអប់រំពិសេស');

    // Reset back to English
    i18nService.setLanguage('en');
    fixture.detectChanges();
  });
});
