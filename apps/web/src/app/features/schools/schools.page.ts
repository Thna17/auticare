// schools.page.ts (Parent Side)
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import type {
  AdmissionRequestResponse,
  AdmissionRequestStatus,
  ChildResponse,
  PaginationMeta,
  SchoolResponse,
} from '@auticare/contracts';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { SchoolsApi } from './data-access/schools.api';
import { EnrollmentRequestsApi } from './data-access/enrollment-requests.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';
import {
  CAMBODIAN_INCLUSIVE_SCHOOLS,
  formatFacilityTag,
  formatSchoolName,
} from './cambodia-schools.data';
import { formatCityBilingual } from '../hospitals/cambodia-hospitals.data';

interface SchoolViewModel extends SchoolResponse {
  rating: number | null;
  reviewCount: number;
  isVerified: boolean;
  specializations: string[];
  facilities?: readonly string[] | string[];
  facilityTags?: readonly string[];
}

const SPECIALIZATION_OPTIONS = [
  'ABA',
  'Speech Therapy',
  'Sensory Room',
  'Sensory Integration',
  'Life Skills',
  'Special Education',
  'Occupational Therapy',
  'Social Skills',
] as const;

@Component({
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    UiMessageComponent,
    UiDialogComponent,
    UiPaginationComponent,
    UiSpinnerComponent,
    UiEmptyStateComponent,
  ],
  selector: 'ac-parent-schools-page',
  template: `
    <!-- Page Header -->
    <section class="page-header">
      <div class="header-content">
        <h1>{{ currentLang() === 'km' ? 'សាលារៀនអប់រំពិសេស' : 'Special Education Schools' }}</h1>
        <p>
          {{
            currentLang() === 'km'
              ? 'ស្វែងរក និងភ្ជាប់ទំនាក់ទំនងជាមួយគ្រឹះស្ថានអប់រំពិសេសដែលសមស្របសម្រាប់កុមារដែលមានការលូតលាស់ខុសប្លែក។'
              : 'Discover and connect with specialized educational institutions tailored for neurodivergent children.'
          }}
        </p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            [attr.aria-label]="
              currentLang() === 'km'
                ? 'ស្វែងរកសាលារៀន តាមឈ្មោះ កម្មវិធីសិក្សា ទីក្រុង ឬជំនាញឯកទេស...'
                : 'Search schools by name, curriculum or specialization'
            "
            type="text"
            [placeholder]="
              currentLang() === 'km'
                ? 'ស្វែងរកសាលារៀន តាមឈ្មោះ កម្មវិធីសិក្សា ទីក្រុង ឬជំនាញឯកទេស...'
                : 'Search school name, curriculum, city, or specialization...'
            "
            class="search-input"
            [value]="search()"
            (input)="search.set($any($event.target).value)"
            (keyup.enter)="applyFilters()"
          />
          @if (search()) {
            <button
              type="button"
              class="clear-search-btn"
              (click)="search.set(''); applyFilters()"
              [attr.aria-label]="currentLang() === 'km' ? 'សម្អាតការស្វែងរក' : 'Clear search'"
            >
              ✕
            </button>
          }
        </div>
      </div>
    </section>

    <!-- View Navigation Tabs -->
    <nav
      class="view-tabs"
      role="tablist"
      [attr.aria-label]="currentLang() === 'km' ? 'ជម្រើសទិដ្ឋភាពសាលារៀន' : 'School view selection'"
    >
      <button
        type="button"
        role="tab"
        class="view-tab"
        [class.active]="activeTab() === 'directory'"
        [attr.aria-selected]="activeTab() === 'directory'"
        (click)="setTab('directory')"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>{{ currentLang() === 'km' ? 'បញ្ជីសាលារៀន' : 'School Directory' }}</span>
      </button>
      @if (isParent()) {
        <button
          type="button"
          role="tab"
          class="view-tab"
          [class.active]="activeTab() === 'applications'"
          [attr.aria-selected]="activeTab() === 'applications'"
          (click)="setTab('applications')"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>{{ currentLang() === 'km' ? 'ពាក្យស្នើសុំរបស់ខ្ញុំ' : 'My Applications' }}</span>
          @if (applications().length > 0) {
            <span class="tab-count-badge">{{ applications().length }}</span>
          }
        </button>
      }
    </nav>

    <!-- ── SCHOOL DIRECTORY VIEW ────────────────────────────────────── -->
    @if (activeTab() === 'directory') {
      <div class="content-wrapper">
        <!-- Filters Sidebar -->
        <aside
          class="filters-sidebar"
          [attr.aria-label]="currentLang() === 'km' ? 'តម្រងស្វែងរកបញ្ជីសាលា' : 'Directory Filters'"
        >
          <div class="filters-header">
            <span class="filter-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </span>
            <h2>{{ currentLang() === 'km' ? 'តម្រងស្វែងរក' : 'Filters' }}</h2>
          </div>

          @if (isParent()) {
            <div class="filter-group">
              <label class="filter-label">{{
                currentLang() === 'km' ? 'សាលាដែលបានរក្សាទុក' : 'Saved Schools'
              }}</label>
              <button
                type="button"
                class="saved-toggle-btn"
                [class.active]="savedOnly()"
                (click)="toggleSavedOnly()"
                [attr.aria-pressed]="savedOnly()"
              >
                <span class="star-icon" aria-hidden="true">{{ savedOnly() ? '♥' : '♡' }}</span>
                <span>{{
                  savedOnly()
                    ? currentLang() === 'km'
                      ? 'បង្ហាញតែសាលាដែលបានរក្សាទុក'
                      : 'Showing Saved Only'
                    : currentLang() === 'km'
                      ? 'បង្ហាញតែសាលាដែលបានរក្សាទុក'
                      : 'Show Saved Only'
                }}</span>
              </button>
            </div>
          }

          <div class="filter-group">
            <label class="filter-label">{{
              currentLang() === 'km' ? 'រាជធានី/ខេត្ត' : 'City / Province'
            }}</label>
            <select
              [attr.aria-label]="
                currentLang() === 'km' ? 'ចម្រាញ់សាលាតាមខេត្ត/ក្រុង' : 'Filter schools by province'
              "
              class="filter-select"
              [value]="province()"
              (change)="province.set($any($event.target).value); applyFilters()"
            >
              <option value="">
                {{ currentLang() === 'km' ? 'គ្រប់ខេត្ត/ក្រុង' : 'All provinces' }}
              </option>
              @for (city of cities(); track city) {
                <option [value]="city">{{ formatProvinceLabel(city) }}</option>
              }
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{
              currentLang() === 'km' ? 'ស្ថានភាពទទួល' : 'Availability'
            }}</label>
            <select
              [attr.aria-label]="
                currentLang() === 'km'
                  ? 'ចម្រាញ់សាលាតាមស្ថានភាពទទួល'
                  : 'Filter schools by availability'
              "
              class="filter-select"
              [value]="availability()"
              (change)="availability.set($any($event.target).value); applyFilters()"
            >
              <option value="">
                {{ currentLang() === 'km' ? 'គ្រប់ស្ថានភាពទទួល' : 'Any availability' }}
              </option>
              <option value="IMMEDIATE">
                {{ currentLang() === 'km' ? 'ចូលរៀនបានភ្លាមៗ' : 'Immediate' }}
              </option>
              <option value="WAITLIST">
                {{ currentLang() === 'km' ? 'បញ្ជីរង់ចាំ' : 'Waitlist' }}
              </option>
              <option value="CLOSED">{{ currentLang() === 'km' ? 'បិទការទទួល' : 'Closed' }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{
              currentLang() === 'km' ? 'ជំនាញឯកទេស' : 'Specializations'
            }}</label>
            <div class="tags-group">
              @for (tag of specializationOptions; track tag) {
                <button
                  type="button"
                  class="tag-btn"
                  [class.active]="selectedSpecializations().includes(tag)"
                  (click)="toggleSpecialization(tag)"
                >
                  {{ formatSpecialization(tag) }}
                </button>
              }
            </div>
          </div>

          <button class="apply-filters-btn" (click)="applyFilters()" [disabled]="loading()">
            {{
              loading()
                ? currentLang() === 'km'
                  ? 'កំពុងស្វែងរក…'
                  : 'Searching…'
                : currentLang() === 'km'
                  ? 'អនុវត្តតម្រង'
                  : 'Apply Filters'
            }}
          </button>
          <button class="clear-filters-btn" type="button" (click)="clearFilters()">
            {{ currentLang() === 'km' ? 'កំណត់តម្រងឡើងវិញ' : 'Reset filters' }}
          </button>
        </aside>

        <!-- Schools List -->
        <div class="schools-list">
          @if (loading()) {
            <ac-ui-spinner
              [label]="currentLang() === 'km' ? 'កំពុងផ្ទុកបញ្ជីសាលារៀន…' : 'Loading schools…'"
            />
          } @else if (error()) {
            <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
          } @else if (!schools().length) {
            <ac-ui-empty-state
              [title]="currentLang() === 'km' ? 'រកមិនឃើញសាលារៀនទេ' : 'No schools found'"
              [message]="
                currentLang() === 'km'
                  ? 'សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬតម្រងទីតាំង ដើម្បីស្វែងរកសាលារៀនដែលត្រូវគ្នា។'
                  : 'Try adjusting your search query or location filters to find matching schools.'
              "
            >
              <button type="button" class="btn-secondary" (click)="clearFilters()">
                {{ currentLang() === 'km' ? 'សម្អាតតម្រង' : 'Clear filters' }}
              </button>
            </ac-ui-empty-state>
          } @else {
            <div class="list-header">
              <span class="results-count">
                <strong>{{ pagination()?.total ?? schools().length }}</strong>
                {{
                  currentLang() === 'km' ? ' សាលារៀនក្នុងបញ្ជី' : ' schools available in directory'
                }}
              </span>
              <div class="sort-dropdown">
                <label>{{ currentLang() === 'km' ? 'តម្រៀបតាម:' : 'Sort by:' }}</label>
                <select
                  [attr.aria-label]="currentLang() === 'km' ? 'តម្រៀបសាលារៀន' : 'Sort schools'"
                >
                  <option>
                    {{ currentLang() === 'km' ? 'ការវាយតម្លៃខ្ពស់បំផុត' : 'Highest Rated' }}
                  </option>
                  <option>{{ currentLang() === 'km' ? 'ជិតបំផុត' : 'Nearest' }}</option>
                  <option>
                    {{ currentLang() === 'km' ? 'ការវាយតម្លៃច្រើនបំផុត' : 'Most Reviews' }}
                  </option>
                  <option>{{ currentLang() === 'km' ? 'ឈ្មោះពី A ដល់ Z' : 'Name A-Z' }}</option>
                </select>
              </div>
            </div>

            @for (school of schools(); track school.id) {
              <article class="school-card">
                <div class="school-image-wrapper">
                  <a
                    class="school-link"
                    [routerLink]="['/schools', school.id]"
                    [attr.aria-label]="
                      currentLang() === 'km' ? 'មើលព័ត៌មានលម្អិតសាលា' : 'View school profile'
                    "
                  >
                    <img
                      [src]="
                        school.coverImageUrl ||
                        'https://images.unsplash.com/photo-1562774053-801e4e208e4e?w=600&h=400&fit=crop'
                      "
                      [alt]="school.name + ' campus'"
                      class="school-image"
                    />
                    @if (school.isVerified) {
                      <span class="verified-badge">
                        <svg
                          viewBox="0 0 24 24"
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {{ currentLang() === 'km' ? 'បានផ្ទៀងផ្ទាត់' : 'Verified' }}
                      </span>
                      <span class="accreditation-badge">
                        {{
                          currentLang() === 'km'
                            ? 'ដៃគូអប់រំពិសេសដែលបានបញ្ជាក់'
                            : 'Accredited Special Ed Partner'
                        }}
                      </span>
                    }
                  </a>
                  @if (isParent()) {
                    <button
                      type="button"
                      class="card-favorite-btn"
                      [class.active]="school.isFavorite"
                      [attr.aria-label]="
                        school.isFavorite
                          ? currentLang() === 'km'
                            ? 'លុបចេញពីសាលាដែលបានរក្សាទុក'
                            : 'Remove from saved schools'
                          : currentLang() === 'km'
                            ? 'រក្សាទុកសាលា'
                            : 'Save school to favorites'
                      "
                      (click)="toggleSchoolFavorite(school, $event)"
                    >
                      <span aria-hidden="true">{{ school.isFavorite ? '♥' : '♡' }}</span>
                    </button>
                  }
                </div>

                <div class="school-content">
                  <div class="school-header">
                    <a class="school-link" [routerLink]="['/schools', school.id]">
                      <h3>{{ formatSchoolName(school.name, currentLang()) }}</h3>
                    </a>
                    @if (school.rating !== null) {
                      <div class="rating">
                        <span class="star" aria-hidden="true">★</span>
                        <span class="rating-value">{{ school.rating }}</span>
                        <span class="rating-count">({{ school.reviewCount }})</span>
                      </div>
                    }
                  </div>

                  <div class="school-location">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{{ school.address }}, {{ formatProvinceLabel(school.city) }}</span>
                  </div>

                  @if (school.description) {
                    <p class="school-description">{{ school.description }}</p>
                  }

                  @if (school.specializations.length) {
                    <div class="specializations-list">
                      @for (spec of school.specializations; track spec) {
                        <span class="spec-tag">{{ formatSpecialization(spec) }}</span>
                      }
                    </div>
                  }

                  @if (school.facilities && school.facilities.length) {
                    <div class="facility-tags-list">
                      @for (fac of school.facilities; track fac) {
                        <span class="facility-chip">🏛️ {{ formatFacility(fac) }}</span>
                      }
                    </div>
                  }

                  <div class="school-meta">
                    <div class="meta-item">
                      <span class="meta-icon" aria-hidden="true">👥</span>
                      <div>
                        <span class="meta-label">
                          {{
                            currentLang() === 'km'
                              ? 'សមាមាត្រសិស្សនិងគ្រូ'
                              : 'Student-Teacher Ratio'
                          }}
                        </span>
                        <span class="meta-value">{{ school.studentTeacherRatio ?? '—' }}</span>
                      </div>
                    </div>

                    <div class="meta-item">
                      <span class="meta-icon" aria-hidden="true">📅</span>
                      <div>
                        <span class="meta-label">
                          {{ currentLang() === 'km' ? 'ស្ថានភាពទទួល' : 'AVAILABILITY' }}
                        </span>
                        <span
                          class="meta-value"
                          [class.waitlist]="school.availabilityStatus === 'WAITLIST'"
                          [class.closed]="school.availabilityStatus === 'CLOSED'"
                        >
                          {{ availabilityLabel(school.availabilityStatus) }}
                          @if (school.waitlistEstimate) {
                            <span class="waitlist-time">({{ school.waitlistEstimate }})</span>
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="card-footer-actions">
                    <button
                      type="button"
                      class="enrollment-btn"
                      (click)="openRequestDialog(school)"
                      [disabled]="school.availabilityStatus === 'CLOSED'"
                    >
                      {{
                        school.availabilityStatus === 'CLOSED'
                          ? currentLang() === 'km'
                            ? 'បិទការទទួលពាក្យ'
                            : 'Not accepting requests'
                          : currentLang() === 'km'
                            ? 'ស្នើសុំចុះឈ្មោះ'
                            : 'Request Enrollment'
                      }}
                    </button>
                    <a class="view-details-link" [routerLink]="['/schools', school.id]">
                      {{ currentLang() === 'km' ? 'មើលព័ត៌មានលម្អិត →' : 'View Profile →' }}
                    </a>
                  </div>
                </div>
              </article>
            }

            @if (pagination(); as meta) {
              <ac-ui-pagination
                [page]="meta.page"
                [totalPages]="meta.totalPages"
                [total]="meta.total"
                [perPage]="meta.limit"
                [itemNoun]="currentLang() === 'km' ? 'សាលារៀន' : 'schools'"
                [label]="currentLang() === 'km' ? 'ទំព័របញ្ជីសាលារៀន' : 'School directory pages'"
                (pageChange)="goToPage($event)"
              />
            }
          }
        </div>
      </div>
    }

    <!-- ── APPLICATIONS TRACKER VIEW ───────────────────────────────── -->
    @else if (activeTab() === 'applications') {
      <section
        class="applications-container"
        [attr.aria-label]="
          currentLang() === 'km' ? 'ពាក្យស្នើសុំសាលារបស់ខ្ញុំ' : 'My School Applications'
        "
      >
        <div class="applications-header">
          <h2>
            {{
              currentLang() === 'km' ? 'ពាក្យស្នើសុំចូលរៀនរបស់ខ្ញុំ' : 'My Enrollment Applications'
            }}
          </h2>
          <p class="applications-intro">
            {{
              currentLang() === 'km'
                ? 'តាមដានស្ថានភាពពាក្យស្នើសុំចូលរៀនដែលបានដាក់ទៅកាន់សាលាអប់រំពិសេសសម្រាប់កូនរបស់អ្នក។'
                : 'Track admission requests submitted to special education schools for your children.'
            }}
          </p>
        </div>

        @if (loadingApplications()) {
          <ac-ui-spinner
            [label]="
              currentLang() === 'km'
                ? 'កំពុងផ្ទុកពាក្យស្នើសុំរបស់អ្នក…'
                : 'Loading your applications…'
            "
          />
        } @else if (applicationsError(); as err) {
          <ac-ui-message tone="error">{{ err }}</ac-ui-message>
        } @else if (applications().length === 0) {
          <ac-ui-empty-state
            [title]="
              currentLang() === 'km'
                ? 'មិនទាន់មានពាក្យស្នើសុំចូលរៀននៅឡើយទេ'
                : 'No enrollment applications yet'
            "
            [message]="
              currentLang() === 'km'
                ? 'អ្នកមិនទាន់បានដាក់ពាក្យស្នើសុំចូលរៀនណាមួយនៅឡើយទេ។ សូមចូលទៅកាន់បញ្ជីសាលារៀនដើម្បីស្វែងរកសាលាដែលសមស្របសម្រាប់កូនរបស់អ្នក។'
                : 'You haven’t submitted any enrollment requests yet. Browse the school directory to find a school suited for your child.'
            "
          >
            <button type="button" class="apply-filters-btn" (click)="setTab('directory')">
              {{ currentLang() === 'km' ? 'ស្វែងរកបញ្ជីសាលារៀន' : 'Browse School Directory' }}
            </button>
          </ac-ui-empty-state>
        } @else {
          <!-- Application Status Filter Pills -->
          <div class="applications-filter-bar">
            <div
              class="application-filter-pills"
              role="tablist"
              [attr.aria-label]="
                currentLang() === 'km'
                  ? 'ចម្រាញ់ពាក្យសុំតាមស្ថានភាព'
                  : 'Filter applications by status'
              "
            >
              <button
                type="button"
                role="tab"
                class="app-filter-pill"
                [class.active]="applicationStatusFilter() === 'ALL'"
                (click)="applicationStatusFilter.set('ALL')"
              >
                {{
                  currentLang() === 'km'
                    ? 'ទាំងអស់ (' + applications().length + ')'
                    : 'All (' + applications().length + ')'
                }}
              </button>
              <button
                type="button"
                role="tab"
                class="app-filter-pill"
                [class.active]="applicationStatusFilter() === 'REQUESTED'"
                (click)="applicationStatusFilter.set('REQUESTED')"
              >
                {{
                  currentLang() === 'km'
                    ? 'កំពុងរង់ចាំការពិនិត្យ (' + countByStatus('REQUESTED') + ')'
                    : 'Pending Review (' + countByStatus('REQUESTED') + ')'
                }}
              </button>
              <button
                type="button"
                role="tab"
                class="app-filter-pill"
                [class.active]="applicationStatusFilter() === 'APPROVED'"
                (click)="applicationStatusFilter.set('APPROVED')"
              >
                {{
                  currentLang() === 'km'
                    ? 'បានទទួលយក (' + countByStatus('APPROVED') + ')'
                    : 'Accepted (' + countByStatus('APPROVED') + ')'
                }}
              </button>
              <button
                type="button"
                role="tab"
                class="app-filter-pill"
                [class.active]="applicationStatusFilter() === 'REJECTED'"
                (click)="applicationStatusFilter.set('REJECTED')"
              >
                {{
                  currentLang() === 'km'
                    ? 'បានបដិសេធ (' + countByStatus('REJECTED') + ')'
                    : 'Declined (' + countByStatus('REJECTED') + ')'
                }}
              </button>
            </div>
          </div>

          <div class="applications-grid">
            @for (app of filteredApplications(); track app.id) {
              <article class="application-card">
                <div class="app-card-header">
                  <div class="app-school-info">
                    <a class="app-school-link" [routerLink]="['/schools', app.schoolId]">
                      <h3>{{ formatSchoolName(app.schoolName, currentLang()) }}</h3>
                    </a>
                    <p class="app-school-location">
                      <svg
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{{
                        app.schoolCity ||
                          app.schoolAddress ||
                          (currentLang() === 'km'
                            ? 'ព័ត៌មានលម្អិតទីតាំងលើប្រវត្តិសាលា'
                            : 'Location details on school profile')
                      }}</span>
                    </p>
                  </div>
                  <span class="app-status-badge" [class]="statusBadgeClass(app.status)">
                    {{
                      currentLang() === 'km'
                        ? statusBadgeLabelKm(app.status)
                        : statusBadgeLabel(app.status)
                    }}
                  </span>
                </div>

                <div class="app-card-body">
                  <div class="app-meta-row">
                    <div class="app-meta-item">
                      <span class="app-meta-label">{{
                        currentLang() === 'km' ? 'កុមារ' : 'Child'
                      }}</span>
                      <strong class="app-meta-value">{{ app.childName }}</strong>
                    </div>
                    <div class="app-meta-item">
                      <span class="app-meta-label">{{
                        currentLang() === 'km' ? 'កាលបរិច្ឆេទដាក់ពាក្យ' : 'Submitted On'
                      }}</span>
                      <span class="app-meta-value">{{ app.createdAt | date: 'mediumDate' }}</span>
                    </div>
                  </div>

                  @if (app.message) {
                    <div class="app-message-box">
                      <span class="app-message-label">{{
                        currentLang() === 'km' ? 'កំណត់ចំណាំផ្ញើទៅសាលា:' : 'Note to school:'
                      }}</span>
                      <p class="app-message-text">"{{ app.message }}"</p>
                    </div>
                  }

                  <!-- School Response & Admissions Guidance -->
                  @if (app.status === 'REQUESTED') {
                    <div class="app-response-note-box status-requested">
                      <span class="response-note-title"
                        >⏳
                        {{
                          currentLang() === 'km'
                            ? 'ស្ថានភាពពិនិត្យពាក្យសុំ'
                            : 'Admissions Review Status'
                        }}</span
                      >
                      <p class="response-note-text">
                        {{
                          currentLang() === 'km'
                            ? 'កំពុងរង់ចាំការពិនិត្យ៖ ពាក្យសុំ និងទិន្នន័យការលូតលាស់របស់កុមារកំពុងត្រូវបានពិនិត្យដោយគណៈកម្មការសាលា (៣-៥ ថ្ងៃធ្វើការ)។'
                            : 'Pending Review: Your child’s application and developmental profile are currently under review by the admissions team. Turnaround is typically 3–5 school days.'
                        }}
                      </p>
                    </div>
                  } @else if (app.status === 'APPROVED') {
                    <div class="app-response-note-box status-approved">
                      <span class="response-note-title"
                        >✓
                        {{
                          currentLang() === 'km'
                            ? 'ការឆ្លើយតប និងការសម្រេចរបស់សាលា'
                            : 'School Response & Decision'
                        }}</span
                      >
                      <p class="response-note-text">
                        {{
                          currentLang() === 'km'
                            ? 'ពាក្យសុំត្រូវបានទទួលយក! គណៈកម្មការសាលាបានយល់ព្រមទទួលពាក្យសុំចូលរៀន។ លោកអ្នកនឹងទទួលបានកញ្ចប់ឯកសារចុះឈ្មោះក្នុងពេលឆាប់ៗនេះ។'
                            : 'Application Accepted! The admissions committee has accepted your application. You will receive an enrollment packet and classroom orientation schedule shortly.'
                        }}
                      </p>
                    </div>
                  } @else if (app.status === 'REJECTED') {
                    <div class="app-response-note-box status-rejected">
                      <span class="response-note-title"
                        >✕
                        {{
                          currentLang() === 'km'
                            ? 'ការឆ្លើយតប និងការសម្រេចរបស់សាលា'
                            : 'School Response & Decision'
                        }}</span
                      >
                      <p class="response-note-text">
                        {{
                          currentLang() === 'km'
                            ? 'ពាក្យសុំត្រូវបានបដិសេធ៖ ថ្នាក់រៀនអប់រំពិសេសមានចំនួនកំណត់ពេញសម្រាប់វគ្គនេះ។ សូមទាក់ទងអ្នកសម្របសម្រួលសម្រាប់ព័ត៌មានបញ្ជីរង់ចាំ។'
                            : 'Application Declined: Special education classroom capacity is currently full for this cohort. Please contact the admissions coordinator regarding waitlist opportunities.'
                        }}
                      </p>
                    </div>
                  }
                </div>

                <div class="app-card-footer">
                  <a class="view-profile-link" [routerLink]="['/schools', app.schoolId]">
                    {{ currentLang() === 'km' ? 'មើលព័ត៌មានសាលា →' : 'View School Profile →' }}
                  </a>
                </div>
              </article>
            }
          </div>
        }
      </section>
    }

    <!-- Enrollment request dialog -->
    @if (requestDialogSchool(); as dialogSchool) {
      <ac-ui-dialog
        [heading]="currentLang() === 'km' ? 'ស្នើសុំចុះឈ្មោះចូលរៀន' : 'Request Enrollment'"
        [description]="
          formatSchoolName(dialogSchool.name, currentLang()) +
          ' — ' +
          formatProvinceLabel(dialogSchool.city)
        "
        size="md"
        (close)="closeRequestDialog()"
      >
        @if (children().length === 0) {
          <div class="dialog-empty-notice">
            <p class="dialog-hint">
              {{
                currentLang() === 'km'
                  ? 'សូមបន្ថែមព័ត៌មានកុមារទៅក្នុងគណនីគ្រួសាររបស់អ្នកជាមុនសិន ទើបអាចស្នើសុំចុះឈ្មោះបាន។'
                  : 'Add a child to your family profile first — then you can request enrollment here.'
              }}
            </p>
            <a class="btn-primary" routerLink="/children/new" (click)="closeRequestDialog()">
              {{ currentLang() === 'km' ? '+ បន្ថែមប្រវត្តិកុមារ' : '+ Add Child Profile' }}
            </a>
          </div>
          <div dialogFooter class="dialog-actions">
            <button type="button" class="btn-secondary" (click)="closeRequestDialog()">
              {{ currentLang() === 'km' ? 'បិទ' : 'Close' }}
            </button>
          </div>
        } @else if (requestSubmitted(); as done) {
          <div class="success-box" role="status">
            <strong>{{
              currentLang() === 'km' ? 'បានផ្ញើសំណើដោយជោគជ័យ។' : 'Request sent.'
            }}</strong>
            {{
              currentLang() === 'km'
                ? 'សំណើសុំចុះឈ្មោះសម្រាប់ ' +
                  done.childName +
                  ' ត្រូវបានបញ្ជូនទៅកាន់ ' +
                  formatSchoolName(done.schoolName, currentLang()) +
                  ' រួចហើយ — ក្រុមការងារសាលានឹងពិនិត្យ និងជូនដំណឹងដល់អ្នក។'
                : done.childName +
                  '’s enrollment request was delivered — ' +
                  done.schoolName +
                  ' will review it and respond on your notifications.'
            }}
          </div>
          <div dialogFooter class="dialog-actions">
            <button type="button" class="btn-secondary" (click)="closeRequestDialog()">
              {{ currentLang() === 'km' ? 'រួចរាល់' : 'Done' }}
            </button>
          </div>
        } @else {
          <label class="dialog-field">
            <span class="dialog-label">{{ currentLang() === 'km' ? 'កុមារ' : 'Child' }}</span>
            <select
              class="dialog-input"
              [value]="selectedChildId()"
              (change)="selectedChildId.set($any($event.target).value)"
            >
              @for (child of children(); track child.id) {
                <option [value]="child.id">{{ child.firstName }}</option>
              }
            </select>
          </label>

          <label class="dialog-field">
            <span class="dialog-label">
              {{
                currentLang() === 'km'
                  ? 'សារផ្ញើទៅសាលា (មិនតម្រូវ)'
                  : 'Message to the school (optional)'
              }}
            </span>
            <textarea
              class="dialog-input"
              rows="3"
              maxlength="2000"
              [placeholder]="
                currentLang() === 'km'
                  ? 'ចែករំលែកព័ត៌មានបន្ថែមអំពីកូនរបស់អ្នក តម្រូវការ គោលដៅ ឬសំណួរផ្សេងៗ...'
                  : 'Share anything that helps the school — your child’s needs, goals, or questions.'
              "
              [value]="requestMessage()"
              (input)="requestMessage.set($any($event.target).value)"
            ></textarea>
          </label>

          @if (requestError(); as dialogErr) {
            <ac-ui-message tone="error">{{ dialogErr }}</ac-ui-message>
          }

          <div dialogFooter class="dialog-actions">
            <button type="button" class="btn-secondary" (click)="closeRequestDialog()">
              {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
            </button>
            <button
              type="button"
              class="apply-filters-btn dialog-submit"
              (click)="submitRequest()"
              [disabled]="requestSubmitting() || !selectedChildId()"
            >
              {{
                requestSubmitting()
                  ? currentLang() === 'km'
                    ? 'កំពុងផ្ញើ…'
                    : 'Sending…'
                  : currentLang() === 'km'
                    ? 'ផ្ញើសំណើ'
                    : 'Send request'
              }}
            </button>
          </div>
        }
      </ac-ui-dialog>
    }
  `,
  styles: [
    `
      /* ── Page header ─────────────────────────────────────────── */
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .header-content h1 {
        font-size: var(--ac-type-page-title);
        color: var(--ac-color-text-strong);
        margin: 0 0 6px 0;
        line-height: var(--ac-line-title);
      }

      .header-content p {
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        margin: 0;
        max-width: 580px;
        line-height: var(--ac-line-body);
      }

      .header-actions {
        flex: 1;
        max-width: 440px;
        min-width: 260px;
      }

      .search-box {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        background: var(--ac-color-surface);
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        box-shadow: var(--ac-shadow-xs);
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .search-box:focus-within {
        border-color: var(--ac-color-action);
        box-shadow: 0 0 0 3px var(--ac-color-tint-blue);
      }

      .search-icon {
        color: var(--ac-color-text-slate);
        display: grid;
        place-items: center;
      }

      .search-input {
        flex: 1;
        border: none;
        padding: 12px 0;
        font: inherit;
        font-size: var(--ac-type-meta);
        background: transparent;
        outline: none;
        color: var(--ac-color-text-strong);
      }

      .clear-search-btn {
        border: none;
        background: transparent;
        color: var(--ac-color-text-muted);
        cursor: pointer;
        padding: 4px;
        font-size: 13px;
        border-radius: var(--ac-radius-pill);
      }

      .clear-search-btn:hover {
        color: var(--ac-color-text-strong);
      }

      /* ── View Tabs ────────────────────────────────────────────── */
      .view-tabs {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 24px;
        border-bottom: 1.5px solid var(--ac-color-border-slate);
        padding-bottom: 2px;
      }

      .view-tab {
        padding: 10px 18px;
        border: none;
        background: transparent;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-slate);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }

      .view-tab:hover {
        color: var(--ac-color-action-darkest);
      }

      .view-tab.active {
        color: var(--ac-color-action);
        border-bottom-color: var(--ac-color-action);
      }

      .tab-count-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action);
        border: 1px solid var(--ac-color-border-info);
      }

      /* ── Applications Container ────────────────────────────────── */
      .applications-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 32px;
      }

      .applications-header h2 {
        font-size: var(--ac-type-card-title);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: 0 0 4px;
      }

      .applications-intro {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-body);
        margin: 0;
      }

      .applications-filter-bar {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 4px;
      }

      .application-filter-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .app-filter-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 12.5px;
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all 140ms ease;
      }

      .app-filter-pill:hover {
        background: var(--ac-color-surface-slate);
      }

      .app-filter-pill.active {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .app-response-note-box {
        padding: 10px 14px;
        border-radius: var(--ac-radius-md);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .app-response-note-box.status-approved {
        background: var(--ac-color-sage-light);
        border: 1px solid var(--ac-color-olive-light);
        border-left: 3px solid var(--ac-color-success);
      }

      .app-response-note-box.status-rejected {
        background: var(--ac-color-alert-surface);
        border: 1px solid var(--ac-color-alert-text);
        border-left: 3px solid var(--ac-color-alert-text);
      }

      .app-response-note-box.status-requested {
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-left: 3px solid var(--ac-color-action);
      }

      .response-note-title {
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--ac-color-text-slate-strong);
      }

      .response-note-text {
        margin: 0;
        font-size: 12.5px;
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-body);
      }

      .applications-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 20px;
      }

      .application-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: var(--ac-shadow-sm);
        transition: box-shadow 0.2s ease;
      }

      .application-card:hover {
        box-shadow: var(--ac-shadow-hover);
      }

      .app-card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .app-school-info h3 {
        font-size: 17px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: 0 0 4px;
      }

      .app-school-link {
        text-decoration: none;
        color: inherit;
      }

      .app-school-link:hover h3 {
        color: var(--ac-color-action);
      }

      .app-school-location {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .app-status-badge {
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        letter-spacing: 0.02em;
        white-space: nowrap;
      }

      .status-badge--requested {
        background: var(--ac-color-amber-tint-100);
        color: var(--ac-color-amber-800);
        border: 1px solid var(--ac-color-amber-500);
      }

      .status-badge--approved {
        background: var(--ac-color-green-tint-100);
        color: var(--ac-color-green-600);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      .status-badge--rejected {
        background: var(--ac-color-red-tint-100);
        color: var(--ac-color-red-700);
        border: 1px solid var(--ac-color-red-border);
      }

      .app-card-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .app-meta-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding: 12px;
        background: var(--ac-color-tint-blue-pale);
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border-slate);
      }

      .app-meta-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .app-meta-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-semibold);
      }

      .app-meta-value {
        font-size: 14px;
        color: var(--ac-color-text-strong);
      }

      .app-message-box {
        padding: 10px 14px;
        background: var(--ac-color-tint-blue-soft);
        border-radius: var(--ac-radius-md);
        border-left: 3px solid var(--ac-color-action);
      }

      .app-message-label {
        font-size: 11px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-muted);
        text-transform: uppercase;
      }

      .app-message-text {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--ac-color-text-strong);
        font-style: italic;
      }

      .app-card-footer {
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-border-slate);
        display: flex;
        justify-content: flex-end;
      }

      .view-profile-link {
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-action);
        text-decoration: none;
      }

      .view-profile-link:hover {
        text-decoration: underline;
      }

      .content-wrapper {
        display: flex;
        gap: 24px;
      }

      /* Filters Sidebar */
      .filters-sidebar {
        width: 280px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: 24px;
        box-shadow: var(--ac-shadow-sm);
        height: fit-content;
        position: sticky;
        top: 24px;
      }

      .filters-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .filter-icon {
        color: var(--ac-color-action);
        display: grid;
        place-items: center;
      }

      .filters-header h2 {
        margin: 0;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .filter-group {
        margin-bottom: 20px;
      }

      .filter-label {
        display: block;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
        font-size: 13px;
        margin-bottom: 8px;
      }

      .filter-select {
        width: 100%;
        padding: 10px 12px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        font-size: 14px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        outline: none;
        cursor: pointer;
      }

      .filter-select:focus {
        border-color: var(--ac-color-action);
      }

      .saved-toggle-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: var(--ac-radius-pill);
        border: 1.5px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .saved-toggle-btn:hover {
        background: var(--ac-color-tint-blue-soft);
        border-color: var(--ac-color-border-info);
      }

      .saved-toggle-btn.active {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action);
      }

      .saved-toggle-btn .star-icon {
        color: var(--ac-color-amber-500);
        font-size: 15px;
      }

      .saved-toggle-btn.active .star-icon {
        color: var(--ac-color-text-on-action);
      }

      .tags-group {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .tag-btn {
        padding: 6px 12px;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-pill);
        font-size: 12px;
        color: var(--ac-color-text-body);
        cursor: pointer;
        transition: all 0.2s;
      }

      .tag-btn:hover {
        background: var(--ac-color-tint-blue-soft);
        border-color: var(--ac-color-border-info);
      }

      .tag-btn.active {
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action-deep);
        border-color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
      }

      .apply-filters-btn {
        width: 100%;
        padding: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: var(--ac-radius-md);
        font-weight: var(--ac-font-weight-bold);
        font-size: 14px;
        cursor: pointer;
        box-shadow: var(--ac-shadow-sm);
        transition: background-color 0.2s ease;
      }

      .apply-filters-btn:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
      }

      .apply-filters-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .clear-filters-btn {
        width: 100%;
        margin-top: 8px;
        padding: 10px;
        background: transparent;
        color: var(--ac-color-text-muted);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        font-weight: var(--ac-font-weight-medium);
        font-size: 13px;
        cursor: pointer;
      }

      .clear-filters-btn:hover {
        color: var(--ac-color-text-strong);
        background: var(--ac-color-surface-slate);
      }

      /* Schools List */
      .schools-list {
        flex: 1;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 14px 18px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        box-shadow: var(--ac-shadow-xs);
      }

      .results-count {
        font-size: 14px;
        color: var(--ac-color-text-body);
      }

      .sort-dropdown {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .sort-dropdown select {
        padding: 6px 10px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-sm);
        font-size: 13px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
      }

      .school-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: var(--ac-shadow-sm);
        display: flex;
        gap: 24px;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .school-card:hover {
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-1px);
      }

      .school-image-wrapper {
        position: relative;
        flex-shrink: 0;
      }

      .school-image {
        width: 280px;
        height: 190px;
        object-fit: cover;
        border-radius: var(--ac-radius-md);
        display: block;
      }

      .verified-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        background: var(--ac-color-green-600);
        color: var(--ac-color-text-on-action);
        padding: 4px 9px;
        border-radius: var(--ac-radius-sm);
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: var(--ac-shadow-xs);
      }

      .accreditation-badge {
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
        padding: 4px 9px;
        border-radius: var(--ac-radius-pill);
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        box-shadow: var(--ac-shadow-xs);
      }

      .card-favorite-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-text-slate);
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: var(--ac-shadow-sm);
        transition: all 0.2s ease;
      }

      .card-favorite-btn:hover {
        transform: scale(1.1);
        color: var(--ac-color-amber-500);
      }

      .card-favorite-btn.active {
        color: var(--ac-color-alert-strong);
        border-color: var(--ac-color-red-border);
      }

      .school-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .school-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .school-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .school-link {
        text-decoration: none;
        color: inherit;
      }

      .school-link:hover h3 {
        color: var(--ac-color-action);
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .star {
        color: var(--ac-color-amber-500);
        font-size: 16px;
      }

      .rating-value {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        font-size: 15px;
      }

      .rating-count {
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .school-location {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
      }

      .specializations-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .spec-tag {
        padding: 4px 10px;
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action-deep);
        border-radius: var(--ac-radius-pill);
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        border: 1px solid var(--ac-color-border-info);
      }

      .facility-tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .facility-chip {
        padding: 3px 8px;
        background: var(--ac-color-tint-blue-pale);
        color: var(--ac-color-text-slate-strong);
        border-radius: var(--ac-radius-pill);
        font-size: 11.5px;
        font-weight: var(--ac-font-weight-medium);
        border: 1px solid var(--ac-color-border-slate);
      }

      .badge-km {
        font-weight: var(--ac-font-weight-bold);
      }

      .badge-en {
        font-size: 0.9em;
        opacity: 0.85;
      }

      .note-km {
        display: block;
        margin-bottom: 4px;
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-strong);
      }

      .note-en {
        display: block;
        font-size: 0.92em;
        color: var(--ac-color-text-muted);
      }

      .school-meta {
        display: flex;
        gap: 28px;
        padding-top: 10px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .meta-item {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .meta-icon {
        font-size: 18px;
      }

      .meta-label {
        display: block;
        font-size: 10px;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .meta-value {
        display: block;
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .meta-value.waitlist {
        color: var(--ac-color-amber-500);
      }

      .meta-value.closed {
        color: var(--ac-color-alert-text);
      }

      .school-description {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: var(--ac-line-body);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-footer-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: auto;
        padding-top: 8px;
      }

      .enrollment-btn {
        padding: 10px 20px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: var(--ac-radius-md);
        font-weight: var(--ac-font-weight-semibold);
        font-size: 13px;
        cursor: pointer;
        box-shadow: var(--ac-shadow-xs);
        transition: background-color 0.2s;
      }

      .enrollment-btn:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
      }

      .enrollment-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .view-details-link {
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-action);
        text-decoration: none;
      }

      .view-details-link:hover {
        text-decoration: underline;
      }

      /* Dialog Styles */
      .dialog-field {
        display: block;
        margin-bottom: 14px;
      }

      .dialog-label {
        display: block;
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
        margin-bottom: 6px;
      }

      .dialog-input {
        width: 100%;
        padding: 10px 12px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
      }

      .dialog-input:focus {
        outline: none;
        border-color: var(--ac-color-action);
        box-shadow: 0 0 0 3px var(--ac-color-tint-blue);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      }

      .dialog-submit {
        width: auto;
      }

      .btn-secondary {
        padding: 10px 18px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      .btn-secondary:hover {
        background: var(--ac-color-surface-slate);
      }

      .btn-primary {
        padding: 10px 18px;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
      }

      .btn-primary:hover {
        background: var(--ac-color-action-deep);
      }

      .success-box {
        padding: 14px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-green-tint-100);
        color: var(--ac-color-green-600);
        font-size: 14px;
        line-height: var(--ac-line-body);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      .dialog-empty-notice {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .dialog-hint {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: 14px;
      }

      .waitlist-time {
        font-weight: 500;
        color: var(--ac-color-text-muted);
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .filters-sidebar {
          width: 240px;
        }

        .school-image {
          width: 220px;
          height: 160px;
        }
      }

      @media (max-width: 768px) {
        .filters-sidebar {
          display: none;
        }

        .school-card {
          flex-direction: column;
        }

        .school-image {
          width: 100%;
          height: 200px;
        }

        .page-header {
          flex-direction: column;
          align-items: stretch;
          gap: 16px;
        }

        .header-actions {
          max-width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolsPage implements OnInit {
  private readonly api = inject(SchoolsApi);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly requestsApi = inject(EnrollmentRequestsApi);
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;
  protected readonly formatSchoolName = formatSchoolName;

  readonly schools = signal<readonly SchoolViewModel[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ── Tab Management ─────────────────────────────────────────────────
  readonly activeTab = signal<'directory' | 'applications'>('directory');
  readonly applications = signal<readonly AdmissionRequestResponse[]>([]);
  readonly loadingApplications = signal(false);
  readonly applicationsError = signal<string | null>(null);
  readonly applicationStatusFilter = signal<'ALL' | AdmissionRequestStatus>('ALL');

  readonly filteredApplications = computed(() => {
    const filter = this.applicationStatusFilter();
    const all = this.applications();
    if (filter === 'ALL') return all;
    return all.filter((a) => a.status === filter);
  });

  countByStatus(status: AdmissionRequestStatus): number {
    return this.applications().filter((a) => a.status === status).length;
  }

  // ── Filters ────────────────────────────────────────────────────────
  readonly cities = signal<string[]>([]);
  readonly search = signal('');
  readonly province = signal('');
  readonly availability = signal('');
  readonly selectedSpecializations = signal<string[]>([]);
  readonly specializationOptions = SPECIALIZATION_OPTIONS;
  readonly savedOnly = signal(false);
  readonly isParent = computed(() => this.auth.parent()?.role === 'PARENT');

  // ── Enrollment request dialog ──────────────────────────────────────
  readonly requestDialogSchool = signal<SchoolViewModel | null>(null);
  readonly children = signal<ChildResponse[]>([]);
  readonly selectedChildId = signal('');
  readonly requestMessage = signal('');
  readonly requestSubmitting = signal(false);
  readonly requestError = signal<string | null>(null);
  readonly requestSubmitted = signal<{ childName: string; schoolName: string } | null>(null);

  protected formatProvinceLabel(city: string): string {
    return formatCityBilingual(city, this.currentLang());
  }

  protected formatSpecialization(spec: string): string {
    const s = spec.trim().toLowerCase();
    if (this.currentLang() === 'en') {
      if (s === 'speech therapy') return 'Speech Therapy';
      if (s === 'sensory room') return 'Sensory Room';
      if (s === 'life skills') return 'Life Skills';
      if (s === 'special education') return 'Special Education';
      if (s === 'sensory integration') return 'Sensory Integration';
      if (s === 'occupational therapy') return 'Occupational Therapy';
      if (s === 'social skills') return 'Social Skills';
      if (s === 'aba') return 'ABA';
      return spec;
    }
    switch (s) {
      case 'speech therapy':
        return 'ការព្យាបាលការនិយាយ';
      case 'sensory room':
        return 'បន្ទប់ញាណដឹង';
      case 'sensory integration':
        return 'ការរួមបញ្ចូលញ្ញាណ';
      case 'life skills':
        return 'ជំនាញជីវិត';
      case 'special education':
        return 'ការអប់រំពិសេស';
      case 'occupational therapy':
        return 'ការព្យាបាលការបំពេញមុខងារ';
      case 'social skills':
        return 'ជំនាញសង្គម';
      case 'aba':
        return 'ការព្យាបាលអាកប្បកិរិយា (ABA)';
      default:
        return spec;
    }
  }

  formatFacility(tag: string): string {
    return formatFacilityTag(tag, this.currentLang());
  }

  ngOnInit() {
    void this.loadSchools();
    this.api.listSchoolCities().subscribe({
      next: (cities) =>
        this.cities.set(
          cities.length ? cities : ['Phnom Penh', 'Kandal', 'Siem Reap', 'Battambang'],
        ),
      error: () => this.cities.set(['Phnom Penh', 'Kandal', 'Siem Reap', 'Battambang']),
    });
    if (this.isParent()) {
      this.loadApplications();
    }
  }

  private readonly applicationsLoaded = signal(false);

  setTab(tab: 'directory' | 'applications') {
    this.activeTab.set(tab);
    if (tab === 'applications') {
      this.loadApplications();
    }
  }

  loadApplications(force = false) {
    if (this.applicationsLoaded() && !force) return;
    this.loadingApplications.set(true);
    this.applicationsError.set(null);
    this.requestsApi.listRequests().subscribe({
      next: (requests) => {
        this.applications.set(requests);
        this.applicationsLoaded.set(true);
        this.loadingApplications.set(false);
      },
      error: () => {
        this.applicationsError.set(
          this.currentLang() === 'km'
            ? 'មិនអាចផ្ទុកពាក្យស្នើសុំរបស់អ្នកបានទេ។ សូមព្យាយាមម្តងទៀត។'
            : 'Could not load your applications. Please try again.',
        );
        this.loadingApplications.set(false);
      },
    });
  }

  statusBadgeLabel(status: AdmissionRequestStatus): string {
    switch (status) {
      case 'REQUESTED':
        return 'Pending Review';
      case 'APPROVED':
        return 'Accepted';
      case 'REJECTED':
        return 'Declined';
    }
  }

  statusBadgeLabelKm(status: AdmissionRequestStatus): string {
    switch (status) {
      case 'REQUESTED':
        return 'កំពុងរង់ចាំការពិនិត្យ';
      case 'APPROVED':
        return 'បានទទួលយក';
      case 'REJECTED':
        return 'បានបដិសេធ';
    }
  }

  statusBadgeClass(status: AdmissionRequestStatus): string {
    switch (status) {
      case 'REQUESTED':
        return 'status-badge--requested';
      case 'APPROVED':
        return 'status-badge--approved';
      case 'REJECTED':
        return 'status-badge--rejected';
    }
  }

  readonly pagination = signal<PaginationMeta | null>(null);
  readonly page = signal(1);

  goToPage(page: number) {
    this.page.set(page);
    void this.loadSchools();
  }

  /** Any filter change narrows the directory, so the old page number may not exist. */
  private reloadFromFirstPage() {
    this.page.set(1);
    void this.loadSchools();
  }

  loadSchools() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listSchools({
        search: this.search().trim() || undefined,
        province: this.province() || undefined,
        availability: this.availability() || undefined,
        specializations:
          this.selectedSpecializations().length > 0
            ? this.selectedSpecializations().join(',')
            : undefined,
        isFavorite: this.savedOnly() ? true : undefined,
        page: this.page(),
      })
      .subscribe({
        next: ({ schools, pagination }) => {
          if (
            schools.length === 0 &&
            !this.search().trim() &&
            !this.province() &&
            !this.availability() &&
            this.selectedSpecializations().length === 0 &&
            !this.savedOnly()
          ) {
            this.schools.set(CAMBODIAN_INCLUSIVE_SCHOOLS as unknown as SchoolViewModel[]);
          } else {
            this.schools.set(schools);
          }
          this.pagination.set(pagination);
          this.loading.set(false);
        },
        error: () => {
          this.schools.set(CAMBODIAN_INCLUSIVE_SCHOOLS as unknown as SchoolViewModel[]);
          this.loading.set(false);
        },
      });
  }

  applyFilters() {
    this.reloadFromFirstPage();
  }

  toggleSavedOnly() {
    this.savedOnly.update((v) => !v);
    this.reloadFromFirstPage();
  }

  toggleSchoolFavorite(school: SchoolViewModel, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const wasFavorite = Boolean(school.isFavorite);
    const op = wasFavorite ? this.api.removeFavorite(school.id) : this.api.addFavorite(school.id);
    op.subscribe({
      next: () => {
        this.schools.update((list) =>
          list.map((s) => (s.id === school.id ? { ...s, isFavorite: !wasFavorite } : s)),
        );
        if (this.savedOnly() && wasFavorite) {
          this.reloadFromFirstPage();
        }
      },
    });
  }

  toggleSpecialization(tag: string) {
    const current = this.selectedSpecializations();
    this.selectedSpecializations.set(
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
    this.reloadFromFirstPage();
  }

  clearFilters() {
    this.search.set('');
    this.province.set('');
    this.availability.set('');
    this.selectedSpecializations.set([]);
    this.savedOnly.set(false);
    this.reloadFromFirstPage();
  }

  availabilityLabel(status: SchoolResponse['availabilityStatus']): string {
    if (this.currentLang() === 'km') {
      switch (status) {
        case 'IMMEDIATE':
          return 'ចូលរៀនបានភ្លាមៗ';
        case 'WAITLIST':
          return 'បញ្ជីរង់ចាំ';
        case 'CLOSED':
          return 'បិទការទទួល';
      }
    }
    switch (status) {
      case 'IMMEDIATE':
        return 'Immediate';
      case 'WAITLIST':
        return 'Waitlist';
      case 'CLOSED':
        return 'Closed';
    }
  }

  // ── Enrollment request flow ────────────────────────────────────────

  openRequestDialog(school: SchoolViewModel) {
    this.requestDialogSchool.set(school);
    this.requestSubmitted.set(null);
    this.requestError.set(null);
    this.requestMessage.set('');
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        if (children.length > 0 && this.selectedChildId() === '') {
          this.selectedChildId.set(children[0].id);
        }
      },
      error: () => this.children.set([]),
    });
  }

  closeRequestDialog() {
    this.requestDialogSchool.set(null);
    this.requestSubmitted.set(null);
    this.requestError.set(null);
  }

  submitRequest() {
    const school = this.requestDialogSchool();
    const childId = this.selectedChildId();
    if (!school || !childId || this.requestSubmitting()) {
      return;
    }

    this.requestSubmitting.set(true);
    this.requestError.set(null);

    const message = this.requestMessage().trim();
    this.requestsApi
      .createRequest({
        schoolId: school.id,
        childId,
        ...(message !== '' && { message }),
      })
      .subscribe({
        next: (request) => {
          this.requestSubmitting.set(false);
          this.requestSubmitted.set({
            childName: request.childName,
            schoolName: request.schoolName,
          });
          this.loadApplications(true);
        },
        error: (err) => {
          this.requestSubmitting.set(false);
          const status = err?.status as number | undefined;
          if (status === 409) {
            this.requestError.set(
              this.currentLang() === 'km'
                ? 'កុមារនេះមានពាក្យសុំ ឬបានចុះឈ្មោះនៅសាលានេះរួចរាល់ហើយ។'
                : 'This child already has an enrollment or an open request at this school.',
            );
          } else if (status === 404) {
            this.requestError.set(
              this.currentLang() === 'km'
                ? 'រកមិនឃើញសាលារៀន ឬកុមារនេះទេ។'
                : 'This school or child could not be found.',
            );
          } else {
            this.requestError.set(
              this.currentLang() === 'km'
                ? 'មិនអាចផ្ញើសំណើបានទេ។ សូមព្យាយាមម្តងទៀត។'
                : 'Could not send the request. Please try again.',
            );
          }
        },
      });
  }
}
