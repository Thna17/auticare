import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChildResponse, ParentResponse, SchoolDetailResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { API_BASE_URL } from '../../core/config/api.config';
import { SchoolDetailPage } from './school-detail.page';
import { I18nService } from '../../core/i18n/i18n.service';

describe('SchoolDetailPage', () => {
  let httpTesting: HttpTestingController;
  let i18nService: I18nService;

  const mockSchool: SchoolDetailResponse = {
    id: 'school_1',
    name: 'Phnom Penh Early Steps',
    city: 'Phnom Penh',
    address: '123 Monivong Blvd',
    phone: null,
    description: 'Specialized inclusive early education.',
    email: 'contact@earlysteps.edu.kh',
    logoUrl: null,
    coverImageUrl: null,
    availabilityStatus: 'IMMEDIATE',
    waitlistEstimate: null,
    studentTeacherRatio: '3:1',
    specializations: ['Early Intervention', 'Occupational Therapy'],
    isVerified: true,
    rating: 4.8,
    reviewCount: 3,
    website: null,
    admissionRequirements: null,
    operatingHours: null,
    facilities: ['Sensory Room', 'Therapy Gym'],
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const mockChild: ChildResponse = {
    id: 'child_1',
    firstName: 'Bopha',
    lastName: 'Sok',
    dateOfBirth: '2021-06-15',
    notes: null,
    archivedAt: null,
  };

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
      imports: [SchoolDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'school_1' : null),
              },
            },
          },
        },
        I18nService,
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('en');
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('renders school profile, hero header, and displays bookmark button for parents', () => {
    const fixture = TestBed.createComponent(SchoolDetailPage);
    fixture.detectChanges();

    // 1. School fetch
    const reqSchool = httpTesting.expectOne('/api/v1/schools/school_1');
    expect(reqSchool.request.method).toBe('GET');
    reqSchool.flush({ data: mockSchool });

    // 2. Children list fetch
    const reqChildren = httpTesting.expectOne('/api/v1/children');
    expect(reqChildren.request.method).toBe('GET');
    reqChildren.flush({ data: [] });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Phnom Penh Early Steps');
    const bookmarkBtn = compiled.querySelector('.btn-favorite');
    expect(bookmarkBtn).toBeTruthy();
    expect(bookmarkBtn?.textContent).toContain('Bookmark School');

    // Hero Header verification
    const heroHeader = compiled.querySelector('.school-hero-header');
    expect(heroHeader).toBeTruthy();
    expect(heroHeader?.textContent).toContain('3:1');
    expect(heroHeader?.textContent).toContain('Early Intervention');
    expect(heroHeader?.textContent).toContain('Occupational Therapy');
    expect(heroHeader?.textContent).toContain('Sensory Room');
    expect(heroHeader?.textContent).toContain('Therapy Gym');
    expect(heroHeader?.textContent).toContain('Verified School');
    expect(heroHeader?.textContent).toContain('Apply for Admission');
  });

  it('toggles favorite on click', () => {
    const fixture = TestBed.createComponent(SchoolDetailPage);
    fixture.detectChanges();

    const reqSchool = httpTesting.expectOne('/api/v1/schools/school_1');
    reqSchool.flush({ data: mockSchool });

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: [] });

    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.toggleFavorite();

    const favReq = httpTesting.expectOne('/api/v1/schools/school_1/favorites');
    expect(favReq.request.method).toBe('POST');
    favReq.flush({ data: { schoolId: 'school_1', parentId: 'parent_1', favorited: true } });

    fixture.detectChanges();
    expect(component.school()?.isFavorite).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Saved to Favorites');
  });

  it('switches to reviews tab and loads reviews', () => {
    const fixture = TestBed.createComponent(SchoolDetailPage);
    fixture.detectChanges();

    const reqSchool = httpTesting.expectOne('/api/v1/schools/school_1');
    reqSchool.flush({ data: mockSchool });

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: [] });

    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.selectReviewsTab();
    fixture.detectChanges();

    const reviewsReq = httpTesting.expectOne('/api/v1/schools/school_1/reviews');
    expect(reviewsReq.request.method).toBe('GET');
    reviewsReq.flush({
      data: {
        reviews: [
          {
            id: 'rev_1',
            schoolId: 'school_1',
            parentId: 'parent_99',
            parentName: 'Sreymom',
            rating: 5,
            comment: 'Wonderful environment for sensory needs.',
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
        averageRating: 5.0,
        totalReviews: 1,
      },
    });

    fixture.detectChanges();
    expect(component.reviews().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Sreymom');
    expect(fixture.nativeElement.textContent).toContain('Wonderful environment for sensory needs.');
  });

  it('opens review dialog and submits a review', () => {
    const fixture = TestBed.createComponent(SchoolDetailPage);
    fixture.detectChanges();

    const reqSchool = httpTesting.expectOne('/api/v1/schools/school_1');
    reqSchool.flush({ data: mockSchool });

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: [] });

    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.selectReviewsTab();

    const reviewsReq = httpTesting.expectOne('/api/v1/schools/school_1/reviews');
    reviewsReq.flush({ data: { reviews: [], averageRating: 0, totalReviews: 0 } });

    fixture.detectChanges();

    // Open review modal
    component.openReviewModal();
    fixture.detectChanges();
    expect(component.showReviewModal()).toBe(true);

    component.reviewRating.set(4);
    component.reviewComment.set('Very supportive teachers and clean facilities.');
    component.submitReview();

    const postReq = httpTesting.expectOne('/api/v1/schools/school_1/reviews');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({
      rating: 4,
      comment: 'Very supportive teachers and clean facilities.',
    });

    postReq.flush({
      data: {
        id: 'rev_new',
        schoolId: 'school_1',
        parentId: 'parent_1',
        parentName: 'Dara Sok',
        rating: 4,
        comment: 'Very supportive teachers and clean facilities.',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
    });

    // Aggregations refresh
    const refreshReq = httpTesting.expectOne('/api/v1/schools/school_1/reviews');
    refreshReq.flush({
      data: {
        reviews: [
          {
            id: 'rev_new',
            schoolId: 'school_1',
            parentId: 'parent_1',
            parentName: 'Dara Sok',
            rating: 4,
            comment: 'Very supportive teachers and clean facilities.',
            createdAt: '2026-03-01T00:00:00.000Z',
          },
        ],
        averageRating: 4.0,
        totalReviews: 1,
      },
    });

    fixture.detectChanges();
    expect(component.showReviewModal()).toBe(false);
    expect(component.reviews().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Dara Sok');
  });

  it('opens admission modal and submits enrollment application', () => {
    const fixture = TestBed.createComponent(SchoolDetailPage);
    fixture.detectChanges();

    const reqSchool = httpTesting.expectOne('/api/v1/schools/school_1');
    reqSchool.flush({ data: mockSchool });

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: [mockChild] });

    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.children().length).toBe(1);
    expect(component.selectedChildId()).toBe('child_1');

    // Open admission modal
    component.openAdmissionModal();
    fixture.detectChanges();
    expect(component.showAdmissionModal()).toBe(true);

    component.message.set('Looking forward to touring your inclusive campus.');
    component.submitRequest();

    const postReq = httpTesting.expectOne('/api/v1/parents/enrollment-requests');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({
      schoolId: 'school_1',
      childId: 'child_1',
      message: 'Looking forward to touring your inclusive campus.',
    });

    postReq.flush({
      data: {
        id: 'req_1',
        parentId: 'parent_1',
        schoolId: 'school_1',
        childId: 'child_1',
        childName: 'Bopha',
        schoolName: 'Phnom Penh Early Steps',
        status: 'PENDING',
        message: 'Looking forward to touring your inclusive campus.',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    });

    fixture.detectChanges();

    expect(component.submitted()).toEqual({
      childName: 'Bopha',
      schoolName: 'Phnom Penh Early Steps',
    });
    expect(fixture.nativeElement.textContent).toContain('Admission Request Sent!');
    expect(fixture.nativeElement.textContent).toContain('Bopha');
  });

  it('renders accreditation badge, sensory room indicator, and allows switching to Inclusive Programs tab', () => {
    const fixture = TestBed.createComponent(SchoolDetailPage);
    fixture.detectChanges();

    const reqSchool = httpTesting.expectOne('/api/v1/schools/school_1');
    reqSchool.flush({ data: mockSchool });

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: [] });

    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-accredited-badge')?.textContent).toContain(
      'Accredited Inclusive Partner',
    );

    // Verify Khmer parity
    i18nService.setLanguage('km');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-accredited-badge')?.textContent).toContain(
      'ដៃគូអប់រំពិសេសដែលបានបញ្ជាក់',
    );

    // Reset back to English
    i18nService.setLanguage('en');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-sensory-room-badge')?.textContent).toContain(
      'Sensory Room Available',
    );

    const component = fixture.componentInstance;
    component.selectProgramsTab();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('programs');
    expect(compiled.textContent).toContain('Sensory Support & Regulation Architecture');
    expect(compiled.textContent).toContain('Inclusive Specialist-to-Student Ratios');
    expect(compiled.textContent).toContain('Available Classroom Accommodations');
    expect(compiled.textContent).toContain('Visual Daily Schedules');
  });

  it('opens and submits contact school inquiry modal', () => {
    const fixture = TestBed.createComponent(SchoolDetailPage);
    fixture.detectChanges();

    const reqSchool = httpTesting.expectOne('/api/v1/schools/school_1');
    reqSchool.flush({ data: mockSchool });

    const reqChildren = httpTesting.expectOne('/api/v1/children');
    reqChildren.flush({ data: [] });

    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.showContactModal()).toBe(false);

    component.openContactModal();
    fixture.detectChanges();

    expect(component.showContactModal()).toBe(true);
    expect(component.contactName()).toBe('Dara Sok');
    expect(component.contactEmail()).toBe('parent@example.com');

    component.contactMessage.set('We would like to request an on-campus tour next Monday.');
    component.submitContactInquiry();
    fixture.detectChanges();

    expect(component.contactSubmitted()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Inquiry Sent Successfully!');

    component.closeContactModal();
    fixture.detectChanges();
    expect(component.showContactModal()).toBe(false);
  });
});
