import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  ChildResponse,
  SchoolAvailabilityStatus,
  SchoolDetailResponse,
  SchoolReviewResponse,
} from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { SchoolsApi } from './data-access/schools.api';
import { EnrollmentRequestsApi } from './data-access/enrollment-requests.api';
import { SchoolProfileViewComponent } from './components/school-profile-view.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { availabilityLabel, availabilityTone } from './school-display.util';
import {
  CAMBODIAN_INCLUSIVE_SCHOOLS,
  formatFacilityTag,
  formatSchoolName,
} from './cambodia-schools.data';
import { formatCityBilingual } from '../hospitals/cambodia-hospitals.data';

/**
 * Parent-facing school detail page (/schools/:id).
 * Features an institutional hero header with facilities overview,
 * student-teacher ratio, programs offered, and an "Apply for Admission" CTA button.
 * Supports viewing profile details, reviews, bookmarking, and submitting admission requests.
 */
@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiCardComponent,
    UiDialogComponent,
    SchoolProfileViewComponent,
    UiMessageComponent,
    UiSpinnerComponent,
  ],
  template: `
    <div class="top-nav-bar">
      <a class="back" routerLink="/schools">
        {{ currentLang() === 'km' ? '← ត្រឡប់ទៅបញ្ជីសាលារៀន' : '← Back to schools' }}
      </a>

      @if (isParent()) {
        <button
          type="button"
          class="btn-favorite"
          [class.saved]="school()?.isFavorite"
          (click)="toggleFavorite()"
          [disabled]="togglingFavorite()"
          [attr.aria-label]="
            school()?.isFavorite
              ? currentLang() === 'km'
                ? 'លុបចេញពីសាលាដែលបានរក្សាទុក'
                : 'Remove from saved schools'
              : currentLang() === 'km'
                ? 'រក្សាទុកសាលា'
                : 'Save school to favorites'
          "
        >
          <span class="star-icon" aria-hidden="true">{{ school()?.isFavorite ? '★' : '☆' }}</span>
          <span>{{
            school()?.isFavorite
              ? currentLang() === 'km'
                ? 'បានរក្សាទុកក្នុងបញ្ជីពេញចិត្ត'
                : 'Saved to Favorites'
              : currentLang() === 'km'
                ? 'រក្សាទុកសាលា'
                : 'Bookmark School'
          }}</span>
        </button>
      }
    </div>

    @if (toastMessage(); as toast) {
      <div class="toast-notice" role="status">
        {{ toast }}
      </div>
    }

    @if (loading()) {
      <ac-ui-card>
        <ac-ui-spinner
          [label]="currentLang() === 'km' ? 'កំពុងផ្ទុកព័ត៌មានសាលា…' : 'Loading school…'"
        />
      </ac-ui-card>
    } @else if (error(); as loadError) {
      <ac-ui-card>
        <ac-ui-message tone="error">{{ loadError }}</ac-ui-message>
      </ac-ui-card>
    } @else if (school(); as s) {
      <!-- School Hero Header -->
      <section
        class="school-hero-header"
        [attr.aria-label]="
          currentLang() === 'km' ? 'បឋមកថាសង្ខេបសាលារៀន' : 'School Overview Header'
        "
      >
        <div class="hero-cover-container">
          @if (s.coverImageUrl) {
            <img class="hero-cover-img" [src]="s.coverImageUrl" [alt]="s.name + ' campus'" />
          } @else {
            <div class="hero-cover-fallback"></div>
          }
          <div class="hero-cover-overlay"></div>
        </div>

        <div class="hero-header-body">
          <div class="hero-header-top">
            <div class="hero-avatar-wrap">
              @if (s.logoUrl) {
                <img class="hero-logo-img" [src]="s.logoUrl" [alt]="s.name + ' logo'" />
              } @else {
                <div class="hero-avatar-fallback">
                  {{ getInitials(s.name) }}
                </div>
              }
            </div>

            <div class="hero-title-meta">
              <div class="hero-title-row">
                <h1 class="hero-title">{{ formatSchoolName(s.name, currentLang()) }}</h1>
                @if (s.isVerified) {
                  <span
                    class="hero-verified-badge"
                    [title]="
                      currentLang() === 'km'
                        ? 'សាលាដៃគូដែលបានផ្ទៀងផ្ទាត់ដោយ AutiCare'
                        : 'Verified AutiCare Partner School'
                    "
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      width="13"
                      height="13"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {{ currentLang() === 'km' ? 'សាលាដែលបានផ្ទៀងផ្ទាត់' : 'Verified School' }}
                  </span>
                  <span class="hero-accredited-badge">
                    {{
                      currentLang() === 'km'
                        ? 'ដៃគូអប់រំពិសេសដែលបានបញ្ជាក់'
                        : 'Accredited Inclusive Partner'
                    }}
                  </span>
                }
                @if (hasSensoryRoom(s)) {
                  <span
                    class="hero-sensory-room-badge"
                    [title]="
                      currentLang() === 'km'
                        ? 'បំពាក់ដោយបន្ទប់សម្រួលវិញ្ញាណស្ងប់ស្ងាត់'
                        : 'Equipped with dedicated sensory calming rooms'
                    "
                  >
                    🌿
                    {{
                      currentLang() === 'km' ? 'មានបន្ទប់សម្រួលវិញ្ញាណ' : 'Sensory Room Available'
                    }}
                  </span>
                }
              </div>

              @if (s.description) {
                <p class="hero-tagline">{{ s.description }}</p>
              }

              <div class="hero-location-rating">
                <span class="hero-location-pin">
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
                  <span>{{ s.address }}, {{ formatProvinceLabel(s.city) }}</span>
                </span>

                <span class="meta-separator">•</span>

                <span
                  class="hero-rating-chip"
                  (click)="selectReviewsTab()"
                  role="button"
                  tabindex="0"
                >
                  <span class="star-gold">★</span>
                  <strong>{{ s.rating !== null ? s.rating.toFixed(1) : '—' }}</strong>
                  <span class="reviews-count">
                    ({{ s.reviewCount }}
                    {{
                      currentLang() === 'km'
                        ? 'ការវាយតម្លៃ'
                        : s.reviewCount === 1
                          ? 'review'
                          : 'reviews'
                    }})
                  </span>
                </span>

                <span class="meta-separator">•</span>

                <span class="hero-avail-badge" [class]="getAvailabilityTone(s.availabilityStatus)">
                  {{ getAvailabilityLabel(s.availabilityStatus) }}
                </span>
              </div>
            </div>

            <div class="hero-cta-action">
              @if (isParent()) {
                <button type="button" class="btn-hero-contact" (click)="openContactModal()">
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    ></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{{ currentLang() === 'km' ? 'ទាក់ទងសាលា' : 'Contact School' }}</span>
                </button>
                <button type="button" class="btn-hero-admission" (click)="openAdmissionModal()">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span>{{
                    currentLang() === 'km' ? 'ដាក់ពាក្យស្នើសុំចូលរៀន' : 'Apply for Admission'
                  }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Highlights row: Teacher-Student Ratio, Programs Offered, Facilities Overview -->
          <div class="hero-highlights-strip">
            <!-- Ratio -->
            <div class="hero-highlight-pill">
              <div class="highlight-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="highlight-content">
                <span class="highlight-caption">
                  {{ currentLang() === 'km' ? 'សមាមាត្រសិស្សនិងគ្រូ' : 'Teacher-Student Ratio' }}
                </span>
                <span class="highlight-val">{{ s.studentTeacherRatio || '1:3' }}</span>
              </div>
            </div>

            <!-- Programs Offered -->
            <div class="hero-highlight-pill programs-pill">
              <div class="highlight-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div class="highlight-content">
                <span class="highlight-caption">
                  {{
                    currentLang() === 'km'
                      ? 'កម្មវិធីសិក្សាផ្ដល់ជូន (' + s.specializations.length + ')'
                      : 'Programs Offered (' + s.specializations.length + ')'
                  }}
                </span>
                <div class="highlight-tags">
                  @for (prog of s.specializations.slice(0, 3); track prog) {
                    <span class="tag-prog">{{ formatSpecialization(prog) }}</span>
                  }
                  @if (s.specializations.length > 3) {
                    <span class="tag-more">+{{ s.specializations.length - 3 }}</span>
                  }
                  @if (s.specializations.length === 0) {
                    <span class="tag-empty">
                      {{
                        currentLang() === 'km'
                          ? 'ផែនការអប់រំបុគ្គល (IEP)'
                          : 'Individualized Education Plans'
                      }}
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Facilities Overview -->
            <div class="hero-highlight-pill facilities-pill">
              <div class="highlight-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <div class="highlight-content">
                <span class="highlight-caption">
                  {{
                    currentLang() === 'km'
                      ? 'ទិដ្ឋភាពទូទៅនៃបរិក្ខារ (' + s.facilities.length + ')'
                      : 'Facilities Overview (' + s.facilities.length + ')'
                  }}
                </span>
                <div class="highlight-tags">
                  @for (fac of s.facilities.slice(0, 3); track fac) {
                    <span class="tag-fac">{{ formatFacility(fac) }}</span>
                  }
                  @if (s.facilities.length > 3) {
                    <span class="tag-more">+{{ s.facilities.length - 3 }}</span>
                  }
                  @if (s.facilities.length === 0) {
                    <span class="tag-empty">
                      {{
                        currentLang() === 'km'
                          ? 'បន្ទប់សម្រួលវិញ្ញាណ និងកន្លែងស្ងប់ស្ងាត់'
                          : 'Sensory & calming spaces'
                      }}
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabs Navigation -->
      <nav
        class="tabs-bar"
        role="tablist"
        [attr.aria-label]="
          currentLang() === 'km' ? 'ផ្ទាំងព័ត៌មានលម្អិតសាលា' : 'School detail tabs'
        "
      >
        <button
          type="button"
          role="tab"
          class="tab-link"
          [class.active]="activeTab() === 'overview'"
          [attr.aria-selected]="activeTab() === 'overview'"
          (click)="activeTab.set('overview')"
        >
          {{ currentLang() === 'km' ? 'ទិដ្ឋភាពទូទៅ និងព័ត៌មានលម្អិត' : 'Overview & Details' }}
        </button>
        <button
          type="button"
          role="tab"
          class="tab-link"
          [class.active]="activeTab() === 'programs'"
          [attr.aria-selected]="activeTab() === 'programs'"
          (click)="selectProgramsTab()"
        >
          {{
            currentLang() === 'km'
              ? 'កម្មវិធីបរិយាបន្ន និងការសម្របសម្រួល'
              : 'Inclusive Programs & Adaptations'
          }}
        </button>
        <button
          type="button"
          role="tab"
          class="tab-link"
          [class.active]="activeTab() === 'reviews'"
          [attr.aria-selected]="activeTab() === 'reviews'"
          (click)="selectReviewsTab()"
        >
          {{
            currentLang() === 'km'
              ? 'ការវាយតម្លៃ (' + totalReviewCount() + ')'
              : 'Reviews (' + totalReviewCount() + ')'
          }}
        </button>
      </nav>

      @if (activeTab() === 'overview') {
        <ac-school-profile-view [school]="s" [editable]="false" />

        <!-- Enrollment CTA Card -->
        @if (isParent()) {
          <ac-ui-card class="enroll-card">
            <div class="enroll-callout-header">
              <div class="enroll-text-block">
                <h2 class="enroll-title">
                  {{
                    currentLang() === 'km'
                      ? 'ការចុះឈ្មោះ និងការទទួលចូលរៀន'
                      : 'Admissions & Enrollment'
                  }}
                </h2>
                <p class="enroll-hint">
                  {{
                    currentLang() === 'km'
                      ? 'ចាប់អារម្មណ៍ក្នុងការចុះឈ្មោះកូនរបស់អ្នកនៅ ' +
                        formatSchoolName(s.name, currentLang()) +
                        ' ឬទេ? ភ្ជាប់ទំនាក់ទំនងផ្ទាល់ជាមួយក្រុមការងារចុះឈ្មោះ។'
                      : 'Interested in enrolling your child at ' +
                        s.name +
                        '? Connect directly with the admissions team.'
                  }}
                </p>
              </div>
              <button type="button" class="btn-primary" (click)="openAdmissionModal()">
                {{ currentLang() === 'km' ? 'ដាក់ពាក្យស្នើសុំចូលរៀន →' : 'Apply for Admission →' }}
              </button>
            </div>

            @if (submitted(); as done) {
              <div class="success-box" role="status">
                <strong>{{
                  currentLang() === 'km' ? 'បានផ្ញើសំណើដោយជោគជ័យ។' : 'Request sent.'
                }}</strong>
                {{
                  currentLang() === 'km'
                    ? 'សំណើសុំចុះឈ្មោះសម្រាប់ ' +
                      done.childName +
                      ' នៅ ' +
                      formatSchoolName(done.schoolName, currentLang()) +
                      ' ត្រូវបានបញ្ជូនរួចហើយ — សាលានឹងពិនិត្យ និងជូនដំណឹងដល់អ្នក។'
                    : done.childName +
                      '’s enrollment request at ' +
                      done.schoolName +
                      ' was delivered — the school will review it and respond on your notifications.'
                }}
              </div>
            }
          </ac-ui-card>
        }
      } @else if (activeTab() === 'programs') {
        <div class="programs-tab-content">
          <!-- 1. Sensory Support Levels -->
          <ac-ui-card class="program-card">
            <div class="program-card-header">
              <span class="program-icon" aria-hidden="true">🌈</span>
              <div>
                <h2>
                  {{
                    currentLang() === 'km'
                      ? 'រចនាសម្ព័ន្ធគាំទ្រ និងសម្រួលវិញ្ញាណ'
                      : 'Sensory Support & Regulation Architecture'
                  }}
                </h2>
                <p class="program-desc">
                  {{
                    currentLang() === 'km'
                      ? 'ក្របខ័ណ្ឌសម្របសម្រួលវិញ្ញាណដ៏ទូលំទូលាយ ដែលរៀបចំឡើងដើម្បីកាត់បន្ថយការភ្ញោចខ្លាំងពេក និងជួយពង្រឹងការគ្រប់គ្រងអារម្មណ៍ខ្លួនឯង។'
                      : 'Comprehensive sensory accommodation framework designed to minimize overstimulation and nurture self-regulation.'
                  }}
                </p>
              </div>
            </div>
            <div class="sensory-levels-grid">
              <div class="sensory-feature-box">
                <span class="feature-title">
                  🌿
                  {{
                    currentLang() === 'km'
                      ? 'បរិយាកាសកាត់បន្ថយការភ្ញោច'
                      : 'Low-Stimulus Environment'
                  }}
                </span>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'បន្ទះស្រូបសំឡេង ពន្លឺភ្លើងស្រទន់មិនចាំង និងការកាត់បន្ថយភាពរញ៉េរញ៉ៃនៅក្នុងថ្នាក់រៀនបឋមទាំងអស់។'
                      : 'Acoustic dampening panels, soft ambient lighting (dimmable non-fluorescent LEDs), and reduced visual clutter in all primary classrooms.'
                  }}
                </p>
              </div>
              <div class="sensory-feature-box">
                <span class="feature-title">
                  🧘
                  {{
                    currentLang() === 'km'
                      ? 'តំបន់សម្រួលអារម្មណ៍ជាក់លាក់'
                      : 'Dedicated Regulation Zones'
                  }}
                </span>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'កន្លែងស្ងប់ស្ងាត់បំពាក់ដោយភួយទម្ងន់ បំពង់ពពុះទឹក ជញ្ជាំងវិញ្ញាណ និងពូកទន់សម្រាប់សម្រួលអារម្មណ៍។'
                      : 'Equipped quiet spaces with weighted blankets, bubble tubes, tactile sensory walls, and crash pads for guided decompression.'
                  }}
                </p>
              </div>
              <div class="sensory-feature-box">
                <span class="feature-title">
                  🎧
                  {{ currentLang() === 'km' ? 'ប្រអប់ឧបករណ៍វិញ្ញាណ' : 'Sensory Toolkits Provided' }}
                </span>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'កាសទប់សំឡេង ឧបករណ៍ទំពារ ឧបករណ៍លេងដៃ និងប័ណ្ណសម្រាកវិញ្ញាណផ្ទាល់ខ្លួនដែលអាចប្រើប្រាស់បានគ្រប់ពេល។'
                      : 'Noise-dampening earmuffs, chewelry, fidget tools, and individualized sensory break passports accessible anytime.'
                  }}
                </p>
              </div>
              <div class="sensory-feature-box">
                <span class="feature-title">
                  🚦
                  {{
                    currentLang() === 'km'
                      ? 'ការផ្លាស់ប្តូរសកម្មភាពដែលមានការដឹងជាមុន'
                      : 'Predictable Transitions'
                  }}
                </span>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'កណ្ដឹងសំឡេង កម្មវិធីរាប់ថយក្រោយតាមរូបភាព និងការជូនដំណឹងផ្លាស់ប្តូរសកម្មភាពជាមុនរវាងម៉ោងសិក្សា។'
                      : 'Auditory chimes, visual countdown timers, and customized transition warnings between learning intervals.'
                  }}
                </p>
              </div>
            </div>
          </ac-ui-card>

          <!-- 2. Specialist Ratios & Multidisciplinary Team -->
          <ac-ui-card class="program-card">
            <div class="program-card-header">
              <span class="program-icon" aria-hidden="true">👥</span>
              <div>
                <h2>
                  {{
                    currentLang() === 'km'
                      ? 'សមាមាត្រអ្នកឯកទេស និងសិស្ស'
                      : 'Inclusive Specialist-to-Student Ratios'
                  }}
                </h2>
                <p class="program-desc">
                  {{
                    currentLang() === 'km'
                      ? 'ក្រុមអ្នកអនុវត្តគ្លីនិក និងអប់រំរួមគ្នា ដើម្បីជួយគាំទ្រដល់ការវិវត្តន៍ផ្ទាល់ខ្លួនរបស់សិស្សគ្រប់រូប។'
                      : 'Integrated clinical and educational practitioners supporting every learner’s individualized progress.'
                  }}
                </p>
              </div>
            </div>
            <div class="ratios-grid">
              <div class="ratio-stat-box">
                <span class="ratio-number">{{ s.studentTeacherRatio || '3:1' }}</span>
                <span class="ratio-label">
                  {{ currentLang() === 'km' ? 'ការគាំទ្រក្នុងថ្នាក់រៀន' : 'Classroom Support' }}
                </span>
                <span class="ratio-sub">
                  {{
                    currentLang() === 'km'
                      ? 'គ្រូអប់រំពិសេស និងជំនួយការគ្រូ'
                      : 'Special educator & paraprofessional staffing'
                  }}
                </span>
              </div>
              <div class="ratio-stat-box">
                <span class="ratio-number">1:3</span>
                <span class="ratio-label">
                  {{
                    currentLang() === 'km' ? 'ការនិយាយ និងភាសា (SLP)' : 'Speech & Language (SLP)'
                  }}
                </span>
                <span class="ratio-sub">
                  {{
                    currentLang() === 'km'
                      ? 'ការព្យាបាលទំនាក់ទំនងក្នុងបរិវេណសាលា'
                      : 'On-campus communication therapy'
                  }}
                </span>
              </div>
              <div class="ratio-stat-box">
                <span class="ratio-number">1:4</span>
                <span class="ratio-label">
                  {{
                    currentLang() === 'km'
                      ? 'ការព្យាបាលការបំពេញមុខងារ (OT)'
                      : 'Occupational Therapy (OT)'
                  }}
                </span>
                <span class="ratio-sub">
                  {{
                    currentLang() === 'km'
                      ? 'ការសម្របសម្រួលវិញ្ញាណ និងចលនាសាច់ដុំតូច'
                      : 'Sensory & fine-motor coordination'
                  }}
                </span>
              </div>
              <div class="ratio-stat-box">
                <span class="ratio-number">1:6</span>
                <span class="ratio-label">
                  {{
                    currentLang() === 'km'
                      ? 'អ្នកឯកទេសអាកប្បកិរិយា (BCBA)'
                      : 'Behavioral Specialist (BCBA)'
                  }}
                </span>
                <span class="ratio-sub">
                  {{
                    currentLang() === 'km'
                      ? 'ផែនការអន្តរាគមន៍អាកប្បកិរិយាវិជ្ជមាន'
                      : 'Positive behavioral intervention plans'
                  }}
                </span>
              </div>
            </div>
          </ac-ui-card>

          <!-- 3. Available Classroom Accommodations -->
          <ac-ui-card class="program-card">
            <div class="program-card-header">
              <span class="program-icon" aria-hidden="true">🛠️</span>
              <div>
                <h2>
                  {{
                    currentLang() === 'km'
                      ? 'ការសម្របសម្រួលក្នុងថ្នាក់រៀនដែលមានស្រាប់'
                      : 'Available Classroom Accommodations'
                  }}
                </h2>
                <p class="program-desc">
                  {{
                    currentLang() === 'km'
                      ? 'ការសម្របសម្រួលបរិស្ថាន ការបង្រៀន និងឧបករណ៍ជំនួយនៅទូទាំងសាលា។'
                      : 'Environmental, instructional, and assistive adaptations available throughout the campus.'
                  }}
                </p>
              </div>
            </div>
            <div class="accommodations-list">
              <div class="accommodation-pill">
                <span class="pill-dot">✓</span>
                <span>
                  {{
                    currentLang() === 'km'
                      ? 'កាលវិភាគប្រចាំថ្ងៃជារូបភាព និងផ្ទាំងមុន/បន្ទាប់'
                      : 'Visual Daily Schedules & First/Then Boards'
                  }}
                </span>
              </div>
              <div class="accommodation-pill">
                <span class="pill-dot">✓</span>
                <span>
                  {{
                    currentLang() === 'km'
                      ? 'ប្រព័ន្ធទំនាក់ទំនងរូបភាព PECS & ឧបករណ៍ AAC'
                      : 'PECS & High-Tech AAC Speech Devices'
                  }}
                </span>
              </div>
              <div class="accommodation-pill">
                <span class="pill-dot">✓</span>
                <span>
                  {{
                    currentLang() === 'km'
                      ? 'កៅអីអង្គុយវិញ្ញាណបត់បែន (កៅអីយោល និងខ្នើយ)'
                      : 'Flexible Sensory Seating (Wobble Stools & Cushions)'
                  }}
                </span>
              </div>
              <div class="accommodation-pill">
                <span class="pill-dot">✓</span>
                <span>
                  {{
                    currentLang() === 'km'
                      ? 'បន្ទះទម្ងន់ដាក់លើភ្លៅ និងខ្សែយឺត'
                      : 'Weighted Lap Pads & Resistance Bands'
                  }}
                </span>
              </div>
              <div class="accommodation-pill">
                <span class="pill-dot">✓</span>
                <span>
                  {{
                    currentLang() === 'km'
                      ? 'ម៉ោងសម្រាកធ្វើចលនា និងលំហាត់កម្លាំងញឹកញាប់'
                      : 'Frequent Movement & Heavy Work Breaks'
                  }}
                </span>
              </div>
              <div class="accommodation-pill">
                <span class="pill-dot">✓</span>
                <span>
                  {{
                    currentLang() === 'km'
                      ? 'ការតាមដានផែនការអប់រំបុគ្គល (IEP)'
                      : 'Individualized Education Plan (IEP) Tracking'
                  }}
                </span>
              </div>
            </div>
          </ac-ui-card>

          <!-- Action CTA inside Programs tab -->
          @if (isParent()) {
            <ac-ui-card class="enroll-card">
              <div class="enroll-callout-header">
                <div class="enroll-text-block">
                  <h2 class="enroll-title">
                    {{
                      currentLang() === 'km'
                        ? 'ត្រៀមខ្លួនដើម្បីពិភាក្សាអំពីការសម្របសម្រួលសម្រាប់កូនរបស់អ្នកហើយឬនៅ?'
                        : 'Ready to Discuss Your Child’s Accommodations?'
                    }}
                  </h2>
                  <p class="enroll-hint">
                    {{
                      currentLang() === 'km'
                        ? 'ណាត់ជួបដើម្បីទស្សនកិច្ចសាលាជាមួយអ្នកសម្របសម្រួលចុះឈ្មោះ ឬដាក់ពាក្យស្នើសុំចូលរៀនដោយផ្ទាល់។'
                        : 'Schedule a tour with the inclusive admissions coordinator or submit an enrollment application directly.'
                    }}
                  </p>
                </div>
                <div class="programs-cta-actions">
                  <button type="button" class="btn-secondary" (click)="openContactModal()">
                    {{
                      currentLang() === 'km'
                        ? 'ទាក់ទងផ្នែកចុះឈ្មោះរបស់សាលា'
                        : 'Contact School Admissions'
                    }}
                  </button>
                  <button type="button" class="btn-primary" (click)="openAdmissionModal()">
                    {{
                      currentLang() === 'km' ? 'ដាក់ពាក្យស្នើសុំចូលរៀន →' : 'Apply for Admission →'
                    }}
                  </button>
                </div>
              </div>
            </ac-ui-card>
          }
        </div>
      } @else {
        <!-- Reviews Tab -->
        <ac-ui-card class="reviews-summary-card">
          <div class="summary-content">
            <div class="rating-overview">
              <div class="rating-big-number">
                {{ averageRating() > 0 ? averageRating().toFixed(1) : '—' }}
              </div>
              <div class="rating-meta">
                <div class="stars-row" [attr.aria-label]="averageRating() + ' out of 5 stars'">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <span class="star" [class.filled]="star <= Math.round(averageRating())">★</span>
                  }
                </div>
                <span class="review-count-caption">
                  {{
                    currentLang() === 'km'
                      ? 'ផ្អែកលើការវាយតម្លៃរបស់មាតាបិតាចំនួន ' + totalReviewCount()
                      : 'Based on ' +
                        totalReviewCount() +
                        ' parent review' +
                        (totalReviewCount() === 1 ? '' : 's')
                  }}
                </span>
              </div>
            </div>

            @if (isParent()) {
              <button type="button" class="btn-primary" (click)="openReviewModal()">
                {{ currentLang() === 'km' ? 'សរសេរការវាយតម្លៃ' : 'Write a Review' }}
              </button>
            }
          </div>
        </ac-ui-card>

        @if (loadingReviews()) {
          <ac-ui-card class="reviews-state-card">
            <ac-ui-spinner
              [label]="currentLang() === 'km' ? 'កំពុងផ្ទុកការវាយតម្លៃ…' : 'Loading reviews…'"
            />
          </ac-ui-card>
        } @else if (reviews().length === 0) {
          <ac-ui-card class="reviews-state-card empty-card">
            <p class="empty-title">
              {{ currentLang() === 'km' ? 'មិនទាន់មានការវាយតម្លៃនៅឡើយទេ' : 'No reviews yet' }}
            </p>
            <p class="empty-subtitle">
              {{
                currentLang() === 'km'
                  ? 'ក្លាយជាមាតាបិតាដំបូងគេដែលចែករំលែកមតិកែលម្អ និងបទពិសោធន៍ជាមួយ ' +
                    formatSchoolName(s.name, currentLang()) +
                    '។'
                  : 'Be the first parent to share feedback and experience with ' + s.name + '.'
              }}
            </p>
            @if (isParent()) {
              <button type="button" class="btn-secondary" (click)="openReviewModal()">
                {{ currentLang() === 'km' ? 'សរសេរការវាយតម្លៃដំបូងគេ' : 'Write the first review' }}
              </button>
            }
          </ac-ui-card>
        } @else {
          <div class="reviews-list">
            @for (review of reviews(); track review.id) {
              <ac-ui-card class="review-item">
                <div class="review-item-header">
                  <div class="reviewer-info">
                    <span class="reviewer-name">{{ review.parentName }}</span>
                    <span class="review-date">{{ formatReviewDate(review.createdAt) }}</span>
                  </div>
                  <div class="review-stars" [attr.aria-label]="review.rating + ' out of 5 stars'">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <span class="star" [class.filled]="star <= review.rating">★</span>
                    }
                  </div>
                </div>
                @if (review.comment) {
                  <p class="review-comment">{{ review.comment }}</p>
                }
              </ac-ui-card>
            }
          </div>
        }
      }

      <!-- Clean Admission Request Modal Dialog -->
      @if (showAdmissionModal()) {
        <ac-ui-dialog
          [heading]="currentLang() === 'km' ? 'ដាក់ពាក្យស្នើសុំចូលរៀន' : 'Apply for Admission'"
          [description]="
            formatSchoolName(s.name, currentLang()) + ' · ' + formatProvinceLabel(s.city)
          "
          size="md"
          (close)="closeAdmissionModal()"
        >
          @if (children().length === 0) {
            <div class="dialog-empty-notice">
              <div class="dialog-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <p class="dialog-hint">
                {{
                  currentLang() === 'km'
                    ? 'សូមបន្ថែមព័ត៌មានកុមារទៅក្នុងគណនីគ្រួសាររបស់អ្នកជាមុនសិន មុនពេលស្នើសុំចុះឈ្មោះចូលរៀន។'
                    : 'Add a child to your family profile first before requesting school admission.'
                }}
              </p>
              <a class="btn-primary" routerLink="/children/new" (click)="closeAdmissionModal()">
                {{ currentLang() === 'km' ? '+ បន្ថែមប្រវត្តិកុមារ' : '+ Add Child Profile' }}
              </a>
            </div>
            <div dialogFooter class="dialog-footer-actions">
              <button type="button" class="btn-secondary" (click)="closeAdmissionModal()">
                {{ currentLang() === 'km' ? 'បិទ' : 'Close' }}
              </button>
            </div>
          } @else if (submitted(); as done) {
            <div class="admission-success-box" role="status">
              <div class="success-icon-wrap">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="22"
                  height="22"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="success-content">
                <strong>{{
                  currentLang() === 'km'
                    ? 'បានផ្ញើសំណើសុំចូលរៀនដោយជោគជ័យ!'
                    : 'Admission Request Sent!'
                }}</strong>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'ពាក្យស្នើសុំសម្រាប់ ' +
                        done.childName +
                        ' នៅ ' +
                        formatSchoolName(done.schoolName, currentLang()) +
                        ' ត្រូវបានបញ្ជូនដោយជោគជ័យ។ គណៈកម្មការសាលានឹងពិនិត្យប្រវត្តិកូនរបស់អ្នក និងជូនដំណឹងដល់អ្នក។'
                      : done.childName +
                        '’s application at ' +
                        done.schoolName +
                        ' was successfully delivered. The admissions committee will review your child’s profile and notify you.'
                  }}
                </p>
              </div>
            </div>
            <div dialogFooter class="dialog-footer-actions">
              <button type="button" class="btn-secondary" (click)="resetForm()">
                {{
                  currentLang() === 'km'
                    ? 'ដាក់ពាក្យសម្រាប់កូនម្នាក់ទៀត'
                    : 'Apply for Another Child'
                }}
              </button>
              <button type="button" class="btn-primary" (click)="closeAdmissionModal()">
                {{ currentLang() === 'km' ? 'រួចរាល់' : 'Done' }}
              </button>
            </div>
          } @else {
            <div class="admission-form">
              <p class="admission-intro">
                {{
                  currentLang() === 'km'
                    ? 'ដាក់ពាក្យស្នើសុំចូលរៀនសម្រាប់កូនរបស់អ្នកទៅកាន់ ' +
                      formatSchoolName(s.name, currentLang()) +
                      '។ ក្រុមការងារសាលានឹងទទួលបានព័ត៌មានទំនាក់ទំនង និងសាររបស់អ្នក។'
                    : 'Submit an admission request for your child to ' +
                      s.name +
                      '. The school team will receive your contact details and message.'
                }}
              </p>

              <label class="field">
                <span class="field-label">{{
                  currentLang() === 'km' ? 'កុមារដែលត្រូវចុះឈ្មោះ *' : 'Child to enroll *'
                }}</span>
                <select
                  class="field-input"
                  [value]="selectedChildId()"
                  (change)="selectedChildId.set($any($event.target).value)"
                >
                  @for (child of children(); track child.id) {
                    <option [value]="child.id">
                      {{ child.firstName }} ({{
                        currentLang() === 'km'
                          ? 'អាយុ ' + calculateChildAge(child.dateOfBirth)
                          : 'Age ' + calculateChildAge(child.dateOfBirth)
                      }})
                    </option>
                  }
                </select>
              </label>

              <label class="field">
                <span class="field-label">
                  {{
                    currentLang() === 'km'
                      ? 'សារ ឬកំណត់ចំណាំផ្ញើទៅក្រុមការងារចុះឈ្មោះ (មិនតម្រូវ)'
                      : 'Message or notes for the admissions team (optional)'
                  }}
                </span>
                <textarea
                  class="field-input"
                  rows="4"
                  maxlength="2000"
                  [placeholder]="
                    currentLang() === 'km'
                      ? 'ចែករំលែកព័ត៌មានលម្អិតទាក់ទងនឹងការលូតលាស់ ការធ្វើរោគវិនិច្ឆ័យ ការសម្របសម្រួលវិញ្ញាណ ឬកាលបរិច្ឆេទចាប់ផ្តើមដែលចង់បាន...'
                      : 'Share details regarding your child’s developmental profile, diagnosis, sensory accommodations, or preferred start dates...'
                  "
                  [value]="message()"
                  (input)="message.set($any($event.target).value)"
                ></textarea>
                <span class="char-count">{{ message().length }} / 2000</span>
              </label>

              @if (formError(); as formErr) {
                <ac-ui-message tone="error">{{ formErr }}</ac-ui-message>
              }
            </div>

            <div dialogFooter class="dialog-footer-actions">
              <button
                type="button"
                class="btn-secondary"
                (click)="closeAdmissionModal()"
                [disabled]="submitting()"
              >
                {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
              </button>
              <button
                type="button"
                class="btn-primary"
                (click)="submitRequest()"
                [disabled]="!canSubmit()"
              >
                {{
                  submitting()
                    ? currentLang() === 'km'
                      ? 'កំពុងផ្ញើ…'
                      : 'Sending…'
                    : currentLang() === 'km'
                      ? 'បញ្ជូនពាក្យសុំ'
                      : 'Submit Application'
                }}
              </button>
            </div>
          }
        </ac-ui-dialog>
      }

      <!-- Add Review Modal Dialog -->
      @if (showReviewModal()) {
        <ac-ui-dialog
          [heading]="currentLang() === 'km' ? 'សរសេរការវាយតម្លៃសាលា' : 'Write a School Review'"
          size="md"
          (close)="closeReviewModal()"
        >
          <div class="review-modal-form">
            <p class="modal-subheading">
              {{
                currentLang() === 'km'
                  ? 'ចែករំលែកបទពិសោធន៍របស់អ្នកនៅ ' +
                    formatSchoolName(s.name, currentLang()) +
                    ' ជាមួយក្រុមគ្រួសារដទៃទៀត។'
                  : 'Share your experience at ' + s.name + ' with other families.'
              }}
            </p>

            <div class="rating-picker-block">
              <span class="field-label" id="star-picker-label">
                {{
                  currentLang() === 'km' ? 'ការវាយតម្លៃសរុប (តម្រូវ)' : 'Overall Rating (required)'
                }}
              </span>
              <div
                class="star-rating-buttons"
                role="radiogroup"
                aria-labelledby="star-picker-label"
              >
                @for (star of [1, 2, 3, 4, 5]; track star) {
                  <button
                    type="button"
                    class="star-picker-btn"
                    [class.active]="star <= reviewRating()"
                    (click)="reviewRating.set(star)"
                    [attr.aria-label]="star + ' star' + (star > 1 ? 's' : '')"
                  >
                    ★
                  </button>
                }
              </div>
              <span class="rating-label-hint">{{ getRatingLabel(reviewRating()) }}</span>
            </div>

            <label class="field">
              <span class="field-label">
                {{
                  currentLang() === 'km' ? 'មតិកែលម្អ (មិនតម្រូវ)' : 'Feedback comments (optional)'
                }}
              </span>
              <textarea
                class="field-input"
                rows="4"
                maxlength="1000"
                [placeholder]="
                  currentLang() === 'km'
                    ? 'ចែករំលែកព័ត៌មានលម្អិតអំពីបរិយាកាសសិក្សា លោកគ្រូអ្នកគ្រូ ការព្យាបាល ឬការទំនាក់ទំនង...'
                    : 'Share details about the learning environment, teachers, therapies, or communication...'
                "
                [value]="reviewComment()"
                (input)="reviewComment.set($any($event.target).value)"
              ></textarea>
              <span class="char-count">{{ reviewComment().length }} / 1000</span>
            </label>

            @if (reviewError(); as rErr) {
              <ac-ui-message tone="error">{{ rErr }}</ac-ui-message>
            }
          </div>

          <div dialogFooter class="modal-footer-actions">
            <button
              type="button"
              class="btn-secondary"
              (click)="closeReviewModal()"
              [disabled]="submittingReview()"
            >
              {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
            </button>
            <button
              type="button"
              class="btn-primary"
              (click)="submitReview()"
              [disabled]="submittingReview()"
            >
              {{
                submittingReview()
                  ? currentLang() === 'km'
                    ? 'កំពុងបញ្ជូន…'
                    : 'Submitting…'
                  : currentLang() === 'km'
                    ? 'បញ្ជូនការវាយតម្លៃ'
                    : 'Submit Review'
              }}
            </button>
          </div>
        </ac-ui-dialog>
      }

      <!-- Contact School Modal Dialog -->
      @if (showContactModal()) {
        <ac-ui-dialog
          [heading]="
            currentLang() === 'km' ? 'ទាក់ទងផ្នែកចុះឈ្មោះរបស់សាលា' : 'Contact School Admissions'
          "
          [description]="
            formatSchoolName(s.name, currentLang()) + ' · ' + formatProvinceLabel(s.city)
          "
          size="md"
          (close)="closeContactModal()"
        >
          @if (contactSubmitted()) {
            <div class="admission-success-box" role="status">
              <div class="success-icon-wrap">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="22"
                  height="22"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="success-content">
                <strong>{{
                  currentLang() === 'km'
                    ? 'បានផ្ញើសារសាកសួរដោយជោគជ័យ!'
                    : 'Inquiry Sent Successfully!'
                }}</strong>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'សារសាកសួររបស់អ្នកត្រូវបានផ្ញើទៅកាន់ ' +
                        formatSchoolName(s.name, currentLang()) +
                        ' រួចហើយ។ ក្រុមការងារចុះឈ្មោះនឹងទាក់ទងមកអ្នកក្នុងពេលឆាប់ៗ។'
                      : 'Your inquiry has been sent to ' +
                        s.name +
                        '. The admissions team will contact you shortly.'
                  }}
                </p>
              </div>
            </div>
            <div dialogFooter class="dialog-footer-actions">
              <button type="button" class="btn-primary" (click)="closeContactModal()">
                {{ currentLang() === 'km' ? 'រួចរាល់' : 'Done' }}
              </button>
            </div>
          } @else {
            <div class="contact-form">
              <p class="dialog-hint">
                {{
                  currentLang() === 'km'
                    ? 'មានសំណួរទាក់ទងនឹងការសម្របសម្រួលវិញ្ញាណ ការព្យាបាលឯកទេស ឬទស្សនកិច្ចសាលា? ផ្ញើសារផ្ទាល់ទៅកាន់ ' +
                      formatSchoolName(s.name, currentLang()) +
                      '។'
                    : 'Have questions about sensory adaptations, specialist therapy, or campus tours? Send a message directly to ' +
                      s.name +
                      '.'
                }}
              </p>

              <label class="field">
                <span class="field-label">{{
                  currentLang() === 'km' ? 'ឈ្មោះរបស់អ្នក *' : 'Your Name *'
                }}</span>
                <input
                  type="text"
                  class="field-input"
                  [placeholder]="
                    currentLang() === 'km'
                      ? 'ឈ្មោះមាតាបិតា ឬអាណាព្យាបាល'
                      : 'Parent or Guardian Name'
                  "
                  [value]="contactName()"
                  (input)="contactName.set($any($event.target).value)"
                />
              </label>

              <label class="field">
                <span class="field-label">{{
                  currentLang() === 'km' ? 'អាសយដ្ឋានអ៊ីមែល *' : 'Email Address *'
                }}</span>
                <input
                  type="email"
                  class="field-input"
                  placeholder="parent@example.com"
                  [value]="contactEmail()"
                  (input)="contactEmail.set($any($event.target).value)"
                />
              </label>

              <label class="field">
                <span class="field-label">{{
                  currentLang() === 'km' ? 'មូលហេតុនៃការសាកសួរ *' : 'Inquiry Reason *'
                }}</span>
                <select
                  class="field-input"
                  [value]="contactSubject()"
                  (change)="contactSubject.set($any($event.target).value)"
                >
                  <option value="Campus Tour Request">
                    {{ currentLang() === 'km' ? 'ស្នើសុំទស្សនកិច្ចសាលា' : 'Campus Tour Request' }}
                  </option>
                  <option value="Tuition & Enrollment">
                    {{
                      currentLang() === 'km' ? 'តម្លៃសិក្សា និងការចុះឈ្មោះ' : 'Tuition & Enrollment'
                    }}
                  </option>
                  <option value="Sensory & Classroom Adaptations">
                    {{
                      currentLang() === 'km'
                        ? 'ការសម្របសម្រួលវិញ្ញាណ និងថ្នាក់រៀន'
                        : 'Sensory & Classroom Adaptations'
                    }}
                  </option>
                  <option value="Therapy Services (OT/Speech)">
                    {{
                      currentLang() === 'km'
                        ? 'សេវាព្យាបាល (OT/ការនិយាយ)'
                        : 'Therapy Services (OT/Speech)'
                    }}
                  </option>
                  <option value="General Question">
                    {{ currentLang() === 'km' ? 'សំណួរទូទៅ' : 'General Question' }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span class="field-label">{{
                  currentLang() === 'km' ? 'សារ *' : 'Message *'
                }}</span>
                <textarea
                  class="field-input"
                  rows="4"
                  [placeholder]="
                    currentLang() === 'km'
                      ? 'សូមបញ្ជាក់សំណួរជាក់លាក់ណាមួយទាក់ទងនឹងការលូតលាស់របស់កូនអ្នក...'
                      : 'Please specify any particular questions regarding your child’s developmental profile...'
                  "
                  [value]="contactMessage()"
                  (input)="contactMessage.set($any($event.target).value)"
                ></textarea>
              </label>
            </div>

            <div dialogFooter class="dialog-footer-actions">
              <button type="button" class="btn-secondary" (click)="closeContactModal()">
                {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
              </button>
              <button
                type="button"
                class="btn-primary"
                [disabled]="!contactMessage().trim()"
                (click)="submitContactInquiry()"
              >
                {{ currentLang() === 'km' ? 'ផ្ញើសារសាកសួរ' : 'Send Inquiry' }}
              </button>
            </div>
          }
        </ac-ui-dialog>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 860px;
        margin: 0 auto;
      }

      .top-nav-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
        gap: 12px;
      }
      .back {
        display: inline-block;
        color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }
      .btn-favorite {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 160ms ease;
      }
      .btn-favorite:hover {
        background: var(--ac-color-amber-tint-50);
        border-color: var(--ac-color-amber-500);
      }
      .btn-favorite.saved {
        background: var(--ac-color-amber-tint-50);
        border-color: var(--ac-color-amber-500);
        color: var(--ac-color-amber-800);
      }
      .btn-favorite .star-icon {
        font-size: 15px;
        color: var(--ac-color-amber-500);
      }
      .btn-favorite:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .toast-notice {
        padding: 10px 16px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
        animation: fadeIn 200ms ease;
      }

      /* ── Hero Header ─────────────────────────────────────────── */
      .school-hero-header {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-lg);
        overflow: hidden;
        box-shadow: var(--ac-shadow-sm);
        margin-bottom: 24px;
      }

      .hero-cover-container {
        position: relative;
        width: 100%;
        height: 170px;
        background: linear-gradient(
          135deg,
          var(--ac-color-surface-info) 0%,
          var(--ac-color-tint-blue-soft) 50%,
          var(--ac-color-tint-steel) 100%
        );
        overflow: hidden;
      }

      .hero-cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hero-cover-fallback {
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          var(--ac-color-action-darkest) 0%,
          var(--ac-color-action) 100%
        );
        opacity: 0.85;
      }

      .hero-cover-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent 40%, var(--ac-color-overlay) 100%);
      }

      .hero-header-body {
        padding: 0 24px 20px;
        position: relative;
      }

      .hero-header-top {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-top: -36px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .hero-avatar-wrap {
        flex-shrink: 0;
        position: relative;
        z-index: 2;
      }

      .hero-logo-img {
        width: 76px;
        height: 76px;
        border-radius: var(--ac-radius-md);
        border: 3px solid var(--ac-color-surface);
        box-shadow: var(--ac-shadow-md);
        object-fit: cover;
        background: var(--ac-color-surface);
      }

      .hero-avatar-fallback {
        width: 76px;
        height: 76px;
        border-radius: var(--ac-radius-md);
        border: 3px solid var(--ac-color-surface);
        box-shadow: var(--ac-shadow-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .hero-title-meta {
        flex: 1 1 300px;
        min-width: 0;
        padding-top: 42px;
      }

      .hero-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 6px;
      }

      .hero-title {
        margin: 0;
        font-size: 22px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
        line-height: 1.25;
      }

      .hero-verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-50);
        border: 1px solid var(--ac-color-green-500);
        color: var(--ac-color-green-700);
        font-size: 11px;
        font-weight: 700;
      }

      .hero-accredited-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-border-info);
        font-size: 11px;
        font-weight: 700;
      }

      .hero-sensory-room-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-tint-pale);
        color: var(--ac-color-green-700);
        border: 1px solid var(--ac-color-green-border-soft);
        font-size: 11px;
        font-weight: 700;
      }

      .hero-tagline {
        margin: 0 0 8px;
        font-size: 13.5px;
        color: var(--ac-color-text-slate);
        line-height: 1.45;
      }

      .hero-location-rating {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }

      .hero-location-pin {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .meta-separator {
        color: var(--ac-color-slate-400);
      }

      .hero-rating-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: var(--ac-radius-sm);
        transition: background 150ms ease;
      }
      .hero-rating-chip:hover {
        background: var(--ac-color-surface-info);
      }

      .star-gold {
        color: var(--ac-color-amber-500);
      }

      .reviews-count {
        color: var(--ac-color-text-slate);
      }

      .hero-avail-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        font-size: 11px;
        font-weight: 700;
      }
      .hero-avail-badge.open {
        background: var(--ac-color-green-tint-pale);
        color: var(--ac-color-green-700);
      }
      .hero-avail-badge.wait {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-800);
      }
      .hero-avail-badge.closed {
        background: var(--ac-color-slate-100);
        color: var(--ac-color-slate-600);
      }

      .hero-cta-action {
        flex-shrink: 0;
        padding-top: 36px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .btn-hero-contact {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: var(--ac-shadow-sm);
        transition: all 180ms ease;
      }
      .btn-hero-contact:hover {
        background: var(--ac-color-tint-blue-soft);
        border-color: var(--ac-color-action);
        box-shadow: var(--ac-shadow-md);
        transform: translateY(-1px);
      }

      .btn-hero-admission {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: var(--ac-shadow-sm);
        transition: all 180ms ease;
      }
      .btn-hero-admission:hover {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-md);
        transform: translateY(-1px);
      }

      /* ── Highlights strip ─────────────────────────────────────── */
      .hero-highlights-strip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding-top: 14px;
        border-top: 1px solid var(--ac-color-tint-steel);
      }

      .hero-highlight-pill {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
      }

      .highlight-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .highlight-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        flex: 1;
      }

      .highlight-caption {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-slate);
      }

      .highlight-val {
        font-size: 15px;
        font-weight: 800;
        color: var(--ac-color-action-darkest);
      }

      .highlight-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .tag-prog {
        display: inline-block;
        padding: 2px 7px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action);
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 140px;
      }

      .tag-fac {
        display: inline-block;
        padding: 2px 7px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-green-50);
        border: 1px solid var(--ac-color-green-100);
        color: var(--ac-color-green-700);
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 140px;
      }

      .tag-more {
        display: inline-block;
        padding: 2px 6px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-slate-100);
        color: var(--ac-color-slate-600);
        font-size: 10px;
        font-weight: 700;
      }

      .tag-empty {
        font-size: 12px;
        color: var(--ac-color-text-muted);
        font-style: italic;
      }

      /* ── Tabs Navigation ─────────────────────────────────────── */
      .tabs-bar {
        display: flex;
        gap: 8px;
        border-bottom: 2px solid var(--ac-color-tint-steel);
        margin-bottom: 20px;
      }
      .tab-link {
        padding: 10px 18px;
        border: 0;
        border-bottom: 3px solid transparent;
        background: transparent;
        color: var(--ac-color-grey-a);
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        margin-bottom: -2px;
        transition: all 160ms ease;
      }
      .tab-link:hover {
        color: var(--ac-color-action);
      }
      .tab-link.active {
        color: var(--ac-color-action);
        border-bottom-color: var(--ac-color-action);
      }

      /* ── Enrollment card ─────────────────────────────────────── */
      .enroll-card {
        margin-top: 18px;
        display: block;
      }
      .enroll-callout-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .enroll-text-block {
        flex: 1 1 300px;
      }
      .enroll-title {
        margin: 0 0 6px;
        font-size: 18px;
        color: var(--ac-color-action-darkest);
      }
      .enroll-hint {
        margin: 0;
        color: var(--ac-color-grey-a);
        font-size: 14px;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .field-label {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-ink-petroleum);
      }
      .field-input {
        width: 100%;
        padding: 9px 12px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: var(--ac-radius-sm);
        font-size: 14px;
        color: var(--ac-color-action-darkest);
        background: var(--ac-color-surface);
        box-sizing: border-box;
      }
      .field-input:focus {
        outline: 2px solid var(--ac-color-sky-pale);
        outline-offset: 1px;
      }
      textarea.field-input {
        resize: vertical;
      }
      .char-count {
        align-self: flex-end;
        font-size: 12px;
        color: var(--ac-color-grey-a);
      }

      .btn-primary {
        padding: 10px 22px;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 160ms ease;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .btn-secondary {
        padding: 8px 18px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-secondary:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .success-box {
        padding: 12px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
        font-size: 14px;
        margin-top: 14px;
      }

      /* ── Admission Modal ─────────────────────────────────────── */
      .admission-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .admission-intro {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-slate);
      }
      .dialog-empty-notice {
        text-align: center;
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      .dialog-empty-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .dialog-hint {
        margin: 0;
        font-size: 14px;
        color: var(--ac-color-text-slate);
        max-width: 320px;
      }
      .admission-success-box {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-green-50);
        border: 1px solid var(--ac-color-green-100);
        color: var(--ac-color-green-700);
      }
      .success-icon-wrap {
        flex-shrink: 0;
        color: var(--ac-color-green-600);
        margin-top: 2px;
      }
      .success-content strong {
        display: block;
        font-size: 15px;
        margin-bottom: 4px;
      }
      .success-content p {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--ac-color-action-darkest);
      }
      .dialog-footer-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      /* ── Reviews section ─────────────────────────────────────── */
      .reviews-summary-card {
        margin-bottom: 16px;
      }
      .summary-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }
      .rating-overview {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .rating-big-number {
        font-size: 36px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
        line-height: 1;
      }
      .rating-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .stars-row {
        display: flex;
        gap: 2px;
      }
      .star {
        font-size: 18px;
        color: var(--ac-color-tint-steel);
      }
      .star.filled {
        color: var(--ac-color-amber-500);
      }
      .review-count-caption {
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }

      .reviews-state-card {
        text-align: center;
        padding: 32px 16px;
      }
      .empty-card .empty-title {
        font-size: 17px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
        margin-bottom: 6px;
      }
      .empty-card .empty-subtitle {
        font-size: 14px;
        color: var(--ac-color-text-slate);
        margin-bottom: 16px;
      }

      .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .review-item {
        display: block;
      }
      .review-item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
        gap: 12px;
      }
      .reviewer-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .reviewer-name {
        font-weight: 700;
        font-size: 15px;
        color: var(--ac-color-text-slate-strong);
      }
      .review-date {
        font-size: 12px;
        color: var(--ac-color-grey-a);
      }
      .review-stars {
        display: flex;
        gap: 2px;
      }
      .review-comment {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-action-darkest);
        white-space: pre-line;
      }

      /* Review Modal Styles */
      .review-modal-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .modal-subheading {
        margin: 0;
        font-size: 14px;
        color: var(--ac-color-text-slate);
      }
      .rating-picker-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .star-rating-buttons {
        display: flex;
        gap: 4px;
      }
      .star-picker-btn {
        background: transparent;
        border: 0;
        padding: 2px 4px;
        font-size: 28px;
        color: var(--ac-color-tint-steel);
        cursor: pointer;
        line-height: 1;
        transition:
          transform 120ms ease,
          color 120ms ease;
      }
      .star-picker-btn:hover {
        transform: scale(1.15);
        color: var(--ac-color-amber-500);
      }
      .star-picker-btn.active {
        color: var(--ac-color-amber-500);
      }
      .rating-label-hint {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-amber-800);
      }
      .modal-footer-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      /* ── Programs Tab Content ────────────────────────────────── */
      .programs-tab-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .program-card {
        display: block;
      }

      .program-card-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
      }

      .program-icon {
        font-size: 24px;
        line-height: 1;
      }

      .program-card-header h2 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-action-darkest);
      }

      .program-desc {
        margin: 0;
        font-size: 13.5px;
        color: var(--ac-color-text-slate);
        line-height: 1.45;
      }

      .sensory-levels-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .sensory-feature-box {
        padding: 14px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
      }

      .feature-title {
        display: block;
        font-weight: 700;
        font-size: 14px;
        color: var(--ac-color-text-slate-strong);
        margin-bottom: 6px;
      }

      .sensory-feature-box p {
        margin: 0;
        font-size: 13px;
        color: var(--ac-color-text-slate);
        line-height: 1.45;
      }

      .ratios-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .ratio-stat-box {
        padding: 14px 10px;
        text-align: center;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-tint-blue-wash);
        border: 1px solid var(--ac-color-border-info);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .ratio-number {
        font-size: 24px;
        font-weight: 800;
        color: var(--ac-color-action);
      }

      .ratio-label {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .ratio-sub {
        font-size: 11px;
        color: var(--ac-color-text-slate);
        line-height: 1.3;
      }

      .accommodations-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .accommodation-pill {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        font-size: 13.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .pill-dot {
        color: var(--ac-color-green-600);
        font-weight: 800;
      }

      .programs-cta-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      /* ── Contact Dialog Styles ───────────────────────────────── */
      .contact-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .hero-highlights-strip {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .hero-header-top {
          flex-direction: column;
          align-items: flex-start;
        }
        .hero-title-meta {
          padding-top: 10px;
        }
        .hero-cta-action {
          padding-top: 10px;
          width: 100%;
        }
        .btn-hero-admission {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetailPage implements OnInit, OnDestroy {
  protected readonly Math = Math;

  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly api = inject(SchoolsApi);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly requestsApi = inject(EnrollmentRequestsApi);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;
  protected readonly formatSchoolName = formatSchoolName;

  readonly school = signal<SchoolDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly children = signal<ChildResponse[]>([]);
  readonly selectedChildId = signal<string>('');
  readonly message = signal('');
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly submitted = signal<{ childName: string; schoolName: string } | null>(null);

  readonly canSubmit = computed(() => this.selectedChildId() !== '' && !this.submitting());
  readonly isParent = computed(() => this.auth.parent()?.role === 'PARENT');

  // Favorites state
  readonly togglingFavorite = signal(false);
  readonly toastMessage = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Tabs state
  readonly activeTab = signal<'overview' | 'programs' | 'reviews'>('overview');

  // Contact modal state
  readonly showContactModal = signal(false);
  readonly contactName = signal('');
  readonly contactEmail = signal('');
  readonly contactSubject = signal('Campus Tour Request');
  readonly contactMessage = signal('');
  readonly contactSubmitted = signal(false);

  // Reviews state
  readonly reviews = signal<SchoolReviewResponse[]>([]);
  readonly loadingReviews = signal(false);
  readonly reviewsLoaded = signal(false);

  // Review modal state
  readonly showReviewModal = signal(false);
  readonly reviewRating = signal(5);
  readonly reviewComment = signal('');
  readonly submittingReview = signal(false);
  readonly reviewError = signal<string | null>(null);

  // Admission modal state
  readonly showAdmissionModal = signal(false);

  readonly totalReviewCount = computed(() => this.school()?.reviewCount ?? 0);
  readonly averageRating = computed(() => this.school()?.rating ?? 0);

  protected formatProvinceLabel(city: string): string {
    return formatCityBilingual(city, this.currentLang());
  }

  protected formatSpecialization(spec: string): string {
    if (this.currentLang() === 'en') return spec;
    switch (spec.trim().toLowerCase()) {
      case 'speech therapy':
        return 'ការព្យាបាលការនិយាយ';
      case 'sensory integration':
        return 'ការរួមបញ្ចូលញ្ញាណ';
      case 'occupational therapy':
        return 'ការព្យាបាលការបំពេញមុខងារ';
      case 'social skills':
        return 'ជំនាញសង្គម';
      default:
        return spec;
    }
  }

  ngOnInit() {
    const schoolId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!schoolId) {
      this.loading.set(false);
      this.error.set(
        this.currentLang() === 'km'
          ? 'មិនអាចរកឃើញសាលារៀននេះទេ។'
          : 'This school could not be found.',
      );
      return;
    }
    this.api.getSchoolById(schoolId).subscribe({
      next: (school) => {
        this.school.set(school);
        this.loading.set(false);
      },
      error: () => {
        const fallback = CAMBODIAN_INCLUSIVE_SCHOOLS.find((s) => s.id === schoolId);
        if (fallback) {
          this.school.set(fallback as unknown as SchoolDetailResponse);
        } else {
          this.error.set(
            this.currentLang() === 'km'
              ? 'មិនអាចផ្ទុកព័ត៌មានលម្អិតនៃសាលារៀននេះបានទេ។'
              : 'This school profile could not be loaded.',
          );
        }
        this.loading.set(false);
      },
    });

    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        const list = Array.isArray(children) ? children : [];
        this.children.set(list);
        if (list.length > 0) {
          this.selectedChildId.set(list[0].id);
        }
      },
      error: () => this.children.set([]),
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  formatFacility(tag: string): string {
    return formatFacilityTag(tag, this.currentLang());
  }

  getInitials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  getAvailabilityLabel(status: SchoolAvailabilityStatus): string {
    return availabilityLabel(status, this.currentLang());
  }

  getAvailabilityTone(status: SchoolAvailabilityStatus): string {
    return availabilityTone(status);
  }

  calculateChildAge(dateOfBirth: string): string {
    if (!dateOfBirth) return '';
    const now = new Date();
    const dob = new Date(dateOfBirth);
    const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (months < 12) return `${Math.max(1, months)}m`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
  }

  private showToast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(msg);
    if (typeof window !== 'undefined') {
      this.toastTimer = setTimeout(() => {
        this.toastMessage.set(null);
      }, 3500);
    }
  }

  toggleFavorite(): void {
    const s = this.school();
    if (!s || this.togglingFavorite()) return;

    this.togglingFavorite.set(true);
    const wasFavorite = Boolean(s.isFavorite);
    const op = wasFavorite ? this.api.removeFavorite(s.id) : this.api.addFavorite(s.id);

    op.subscribe({
      next: () => {
        this.togglingFavorite.set(false);
        this.school.update((curr) => (curr ? { ...curr, isFavorite: !wasFavorite } : null));
        this.showToast(
          wasFavorite
            ? this.currentLang() === 'km'
              ? 'បានដកចេញពីបញ្ជីសាលាដែលបានរក្សាទុក។'
              : 'Removed from saved schools.'
            : this.currentLang() === 'km'
              ? 'បានរក្សាទុកក្នុងបញ្ជីសាលាដែលពេញចិត្ត។'
              : 'Saved to favorite schools.',
        );
      },
      error: () => {
        this.togglingFavorite.set(false);
        this.showToast(
          this.currentLang() === 'km'
            ? 'មិនអាចធ្វើបច្ចុប្បន្នភាពការរក្សាទុកបានទេ។ សូមព្យាយាមម្តងទៀត។'
            : 'Could not update favorites. Please try again.',
        );
      },
    });
  }

  hasSensoryRoom(school: SchoolDetailResponse | null): boolean {
    if (!school) return false;
    return (
      school.facilities.some((f) => f.toLowerCase().includes('sensory')) ||
      school.specializations.some((s) => s.toLowerCase().includes('sensory'))
    );
  }

  selectProgramsTab(): void {
    this.activeTab.set('programs');
  }

  openContactModal(): void {
    const p = this.auth.parent();
    if (p) {
      this.contactName.set(`${p.firstName} ${p.lastName}`.trim());
      this.contactEmail.set(p.email);
    }
    this.contactMessage.set('');
    this.contactSubmitted.set(false);
    this.showContactModal.set(true);
  }

  closeContactModal(): void {
    this.showContactModal.set(false);
    this.contactSubmitted.set(false);
  }

  submitContactInquiry(): void {
    if (!this.contactMessage().trim()) return;
    this.contactSubmitted.set(true);
  }

  selectReviewsTab(): void {
    this.activeTab.set('reviews');
    if (!this.reviewsLoaded()) {
      this.loadReviews();
    }
  }

  loadReviews(): void {
    const s = this.school();
    if (!s) return;

    this.loadingReviews.set(true);
    this.api.listReviews(s.id).subscribe({
      next: (response) => {
        this.reviews.set(response.reviews);
        this.reviewsLoaded.set(true);
        this.loadingReviews.set(false);
        this.school.update((curr) =>
          curr
            ? {
                ...curr,
                rating: response.averageRating,
                reviewCount: response.totalReviews,
              }
            : null,
        );
      },
      error: () => {
        this.loadingReviews.set(false);
        this.reviewsLoaded.set(true);
      },
    });
  }

  openReviewModal(): void {
    this.reviewRating.set(5);
    this.reviewComment.set('');
    this.reviewError.set(null);
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    if (!this.submittingReview()) {
      this.showReviewModal.set(false);
    }
  }

  openAdmissionModal(): void {
    this.formError.set(null);
    this.showAdmissionModal.set(true);
  }

  closeAdmissionModal(): void {
    if (!this.submitting()) {
      this.showAdmissionModal.set(false);
    }
  }

  getRatingLabel(rating: number): string {
    if (this.currentLang() === 'km') {
      switch (rating) {
        case 1:
          return 'ផ្កាយ ១ - ត្រូវការការកែលម្អ';
        case 2:
          return 'ផ្កាយ ២ - មធ្យម';
        case 3:
          return 'ផ្កាយ ៣ - ល្អ';
        case 4:
          return 'ផ្កាយ ៤ - ល្អប្រសើរ';
        case 5:
          return 'ផ្កាយ ៥ - ល្អឥតខ្ចោះ';
        default:
          return '';
      }
    }
    switch (rating) {
      case 1:
        return '1 star - Needs Improvement';
      case 2:
        return '2 stars - Fair';
      case 3:
        return '3 stars - Good';
      case 4:
        return '4 stars - Very Good';
      case 5:
        return '5 stars - Excellent';
      default:
        return '';
    }
  }

  submitReview(): void {
    const s = this.school();
    if (!s || this.submittingReview()) return;

    this.submittingReview.set(true);
    this.reviewError.set(null);

    const comment = this.reviewComment().trim();
    this.api
      .createReview(s.id, {
        rating: this.reviewRating(),
        ...(comment ? { comment } : {}),
      })
      .subscribe({
        next: (newReview) => {
          this.submittingReview.set(false);
          this.showReviewModal.set(false);
          this.reviews.update((curr) => [newReview, ...curr]);
          this.showToast(
            this.currentLang() === 'km'
              ? 'សូមអរគុណសម្រាប់ការបញ្ជូនការវាយតម្លៃរបស់អ្នក!'
              : 'Thank you for submitting your review!',
          );

          // Refresh aggregations
          this.api.listReviews(s.id).subscribe({
            next: (res) => {
              this.reviews.set(res.reviews);
              this.school.update((curr) =>
                curr
                  ? {
                      ...curr,
                      rating: res.averageRating,
                      reviewCount: res.totalReviews,
                    }
                  : null,
              );
            },
          });
        },
        error: (err) => {
          this.submittingReview.set(false);
          const status = err?.status as number | undefined;
          if (status === 409) {
            this.reviewError.set(
              this.currentLang() === 'km'
                ? 'អ្នកបានបញ្ជូនការវាយតម្លៃសម្រាប់សាលានេះរួចហើយ។'
                : 'You have already submitted a review for this school.',
            );
          } else {
            this.reviewError.set(
              this.currentLang() === 'km'
                ? 'មិនអាចបញ្ជូនការវាយតម្លៃបានទេ។ សូមព្យាយាមម្តងទៀត។'
                : 'Could not submit your review. Please try again.',
            );
          }
        },
      });
  }

  formatReviewDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString(this.currentLang() === 'km' ? 'km-KH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  submitRequest() {
    const school = this.school();
    const childId = this.selectedChildId();
    if (!school || !childId) {
      this.formError.set(
        this.currentLang() === 'km' ? 'សូមជ្រើសរើសកុមារជាមុនសិន។' : 'Choose a child first.',
      );
      return;
    }

    if (!this.submitting()) {
      this.submitting.set(true);
    }
    this.formError.set(null);

    const message = this.message().trim();
    this.requestsApi
      .createRequest({
        schoolId: school.id,
        childId,
        ...(message !== '' && { message }),
      })
      .subscribe({
        next: (request) => {
          this.submitting.set(false);
          this.submitted.set({
            childName: request.childName,
            schoolName: request.schoolName,
          });
        },
        error: (err) => {
          this.submitting.set(false);
          const status = err?.status as number | undefined;
          if (status === 409) {
            this.formError.set(
              this.currentLang() === 'km'
                ? 'កុមារនេះមានការចុះឈ្មោះ ឬពាក្យស្នើសុំដែលកំពុងដំណើរការនៅសាលានេះរួចហើយ។'
                : 'This child already has an enrollment or an open request at this school.',
            );
          } else if (status === 404) {
            this.formError.set(
              this.currentLang() === 'km'
                ? 'រកមិនឃើញសាលារៀន ឬកុមារនេះទេ។'
                : 'This school or child could not be found.',
            );
          } else {
            this.formError.set(
              this.currentLang() === 'km'
                ? 'មិនអាចផ្ញើសំណើបានទេ។ សូមព្យាយាមម្តងទៀត។'
                : 'Could not send the request. Please try again.',
            );
          }
        },
      });
  }

  resetForm() {
    this.submitted.set(null);
    this.message.set('');
    this.formError.set(null);
  }
}
