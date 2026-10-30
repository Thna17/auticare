import '@angular/compiler';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ChildResponse } from '@auticare/contracts';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { HospitalsApi } from '../hospitals/data-access/hospitals.api';
import { ChildrenApi } from '../children/data-access/children.api';
import { InquiriesApi } from './data-access/inquiries.api';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { getFacilityImageUrl } from './find-support-images';

export interface SupportDetailView {
  id: string;
  type: 'school' | 'hospital';
  name: string;
  city: string;
  address: string;
  description: string;
  services: string[];
  ageGroups?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  isVerified: boolean;
  isFavorite: boolean;
  imageUrl?: string | null;
}

const COPY = {
  en: {
    backToDirectory: 'Back to Support Directory',
    schoolTag: 'School',
    healthcareTag: 'Healthcare Facility',
    verifiedPartner: 'AutiCare Partner',
    saveBtn: 'Save',
    savedBtn: 'Saved',
    sendInquiry: 'Send Inquiry',
    overviewTitle: 'Overview',
    servicesTitle: 'Services & Specializations',
    ageGroupsTitle: 'Age Groups & Admissions',
    contactTitle: 'Contact Information',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    websiteLabel: 'Website',
    openInMaps: 'Open location in Google Maps',
    noDirectContact: 'Direct inquiries can be sent to this facility using the Send Inquiry button.',
    familyNoteTitle: 'AutiCare Care Support',
    familyNoteText:
      'Verified providers collaborate with families to ensure supportive, individualized care for neurodivergent children in Cambodia.',
    loadingText: 'Loading details…',
    loadErrorSchool: 'Failed to load school details.',
    loadErrorHospital: 'Failed to load healthcare facility details.',
    invalidProvider: 'Invalid support provider specified.',
    returnToDirectory: 'Return to Directory',
    modalTitle: (name: string) => `Send Inquiry to ${name}`,
    modalNotice: 'The organization may reply to you directly by email or phone outside AutiCare.',
    regardingChild: 'Regarding Child (Optional)',
    generalInquiry: 'General inquiry (no child mentioned)',
    childPrivacyNote: "Only your child's first name is shared to protect family privacy.",
    subjectLabel: 'Subject *',
    subjectPlaceholder: 'e.g. Inquiring about specialized support programs',
    messageLabel: 'Message *',
    messagePlaceholder: 'Write your questions or message for the organization…',
    cancel: 'Cancel',
    sending: 'Sending…',
    successToast: 'Inquiry sent successfully! The organization has been notified.',
  },
  km: {
    backToDirectory: 'ត្រឡប់ទៅបញ្ជីគាំទ្រវិញ',
    schoolTag: 'សាលារៀន',
    healthcareTag: 'មណ្ឌលសុខភាព',
    verifiedPartner: 'ដៃគូ AutiCare',
    saveBtn: 'រក្សាទុក',
    savedBtn: 'បានរក្សាទុក',
    sendInquiry: 'ផ្ញើសំណួរ/ទំនាក់ទំនង',
    overviewTitle: 'ទិដ្ឋភាពទូទៅ',
    servicesTitle: 'សេវាកម្ម និងជំនាញឯកទេស',
    ageGroupsTitle: 'កម្រិតអាយុ និងការចុះឈ្មោះ',
    contactTitle: 'ព័ត៌មានទំនាក់ទំនង',
    phoneLabel: 'ទូរស័ព្ទ',
    emailLabel: 'អ៊ីមែល',
    websiteLabel: 'គេហទំព័រ',
    openInMaps: 'បើកទីតាំងក្នុង Google Maps',
    noDirectContact: 'អ្នកអាចផ្ញើសំណួរដោយផ្ទាល់ទៅកាន់ស្ថាប័ននេះ តាមរយៈប៊ូតុងខាងលើ។',
    familyNoteTitle: 'ការណែនាំពី AutiCare',
    familyNoteText:
      'ស្ថាប័នក្នុងបញ្ជីនេះ ធ្វើការរួមគ្នាជាមួយក្រុមគ្រួសារ ដើម្បីផ្តល់ការគាំទ្រដល់កុមារអូទីស្សឹមនៅកម្ពុជា។',
    loadingText: 'កំពុងផ្ទុកព័ត៌មានលម្អិត…',
    loadErrorSchool: 'មិនអាចទាញយកព័ត៌មានសាលារៀនបានទេ។',
    loadErrorHospital: 'មិនអាចទាញយកព័ត៌មានមណ្ឌលសុខភាពបានទេ។',
    invalidProvider: 'រកមិនឃើញស្ថាប័នដែលបានបញ្ជាក់ទេ។',
    returnToDirectory: 'ត្រឡប់ទៅបញ្ជីវិញ',
    modalTitle: (name: string) => `ផ្ញើសំណួរទៅកាន់ ${name}`,
    modalNotice:
      'ស្ថាប័នអាចនឹងឆ្លើយតបមកអ្នកវិញដោយផ្ទាល់តាមរយៈអ៊ីមែល ឬលេខទូរស័ព្ទនៅក្រៅប្រព័ន្ធ AutiCare។',
    regardingChild: 'ទាក់ទងនឹងកូន (មិនចាំបាច់)',
    generalInquiry: 'សំណួរទូទៅ (មិនបញ្ជាក់ឈ្មោះកូន)',
    childPrivacyNote:
      'មានតែឈ្មោះដំបូងរបស់កូនប៉ុណ្ណោះដែលត្រូវបានចែករំលែក ដើម្បីរក្សាឯកជនភាពគ្រួសារ។',
    subjectLabel: 'ប្រធានបទ *',
    subjectPlaceholder: 'ឧ. សាកសួរអំពីកម្មវិធីគាំទ្រពិសេស',
    messageLabel: 'សារ *',
    messagePlaceholder: 'សរសេរសំណួរ ឬសាររបស់អ្នកសម្រាប់ស្ថាប័ន…',
    cancel: 'បោះបង់',
    sending: 'កំពុងផ្ញើ…',
    successToast: 'បានផ្ញើសំណួរដោយជោគជ័យ! ស្ថាប័ននឹងទទួលបានដំណឹងនេះ។',
  },
};

@Component({
  selector: 'ac-support-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, UiSpinnerComponent],
  template: `
    <div class="detail-container">
      <nav class="back-nav">
        <a routerLink="/find-support" class="back-link">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>{{ copy().backToDirectory }}</span>
        </a>
      </nav>

      @if (loading()) {
        <div class="loading-state">
          <ac-ui-spinner [label]="copy().loadingText"></ac-ui-spinner>
        </div>
      } @else if (error()) {
        <div class="error-banner" role="alert">
          <p>{{ error() }}</p>
          <a routerLink="/find-support" class="btn-back">{{ copy().returnToDirectory }}</a>
        </div>
      } @else if (detail(); as item) {
        <!-- Single Unified Row: Col 1 is Image, Col 2 is Description & Info -->
        <header class="detail-hero-card">
          <div class="hero-media-col">
            @if (item.imageUrl) {
              <img [src]="item.imageUrl" [alt]="item.name" class="detail-hero-img" />
            } @else {
              <div
                class="detail-hero-fallback"
                [class.hospital-fallback]="item.type === 'hospital'"
                aria-hidden="true"
              >
                <div class="fallback-hero-icon-wrap">
                  @if (item.type === 'school') {
                    <svg
                      width="44"
                      height="44"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
                      ></path>
                      <path d="M6 6h10"></path>
                      <path d="M6 10h10"></path>
                      <path d="M6 14h6"></path>
                    </svg>
                  } @else {
                    <svg
                      width="44"
                      height="44"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M3 21h18"></path>
                      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
                      <path d="M9 10h6"></path>
                      <path d="M12 7v6"></path>
                    </svg>
                  }
                </div>
                <span class="fallback-hero-text">
                  {{ item.type === 'school' ? copy().schoolTag : copy().healthcareTag }}
                </span>
              </div>
            }
          </div>

          <div class="hero-desc-col">
            <div class="hero-top-row">
              <div class="badges-row">
                <span class="type-badge" [class.hospital-badge]="item.type === 'hospital'">
                  {{ item.type === 'school' ? copy().schoolTag : copy().healthcareTag }}
                </span>
                @if (item.isVerified) {
                  <span class="verified-badge">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{{ copy().verifiedPartner }}</span>
                  </span>
                }
              </div>

              <div class="header-actions">
                <button
                  type="button"
                  class="heart-action-btn"
                  [class.favorited]="item.isFavorite"
                  (click)="toggleFavorite()"
                  [attr.aria-label]="item.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    [attr.fill]="item.isFavorite ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                    ></path>
                  </svg>
                  <span>{{ item.isFavorite ? copy().savedBtn : copy().saveBtn }}</span>
                </button>

                <button type="button" class="btn-inquiry" (click)="openInquiryModal()">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z"></path>
                    <path d="M22 2 11 13"></path>
                  </svg>
                  <span>{{ copy().sendInquiry }}</span>
                </button>
              </div>
            </div>

            <div class="hero-body-content">
              <h1 class="item-title">{{ item.name }}</h1>

              <div class="location-line">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="location-icon"
                  aria-hidden="true"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{{ item.address }}, {{ item.city }}</span>
              </div>

              <div class="overview-box">
                <h2 class="overview-heading">{{ copy().overviewTitle }}</h2>
                <p class="overview-desc">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </header>

        <!-- Lower Details Grid: Services on Left, Contact on Right -->
        <main class="detail-grid">
          <div class="detail-main-col">
            <!-- Services Offered Card -->
            <section class="info-card">
              <h2 class="section-title">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2v20"></path>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>{{ copy().servicesTitle }}</span>
              </h2>

              @if (item.services.length === 0) {
                <p class="muted-text">Standard developmental and support services provided.</p>
              } @else {
                <div class="services-list">
                  @for (service of item.services; track service) {
                    <span class="service-chip">{{ service }}</span>
                  }
                </div>
              }
            </section>

            <!-- Google Maps Card -->
            <section class="info-card">
              <h2 class="section-title">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                <span>{{ copy().openInMaps }}</span>
              </h2>

              <div class="maps-section">
                <div class="maps-info">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="maps-icon"
                    aria-hidden="true"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div class="maps-text">
                    <span class="maps-label">{{ item.name }}</span>
                    <span class="maps-address">{{ item.address }}, {{ item.city }}</span>
                  </div>
                </div>
                <a
                  [href]="googleMapsUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="maps-cta-btn"
                >
                  <span>{{ copy().openInMaps }}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            </section>

            <!-- Age Groups (Schools) -->
            @if (item.type === 'school' && item.ageGroups) {
              <section class="info-card">
                <h2 class="section-title">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{{ copy().ageGroupsTitle }}</span>
                </h2>
                <p class="age-groups-text">{{ item.ageGroups }}</p>
              </section>
            }
          </div>

          <!-- Sidebar Column -->
          <div class="detail-sidebar-col">
            <!-- Contact Card -->
            <section class="info-card contact-card">
              <h2 class="section-title">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  ></path>
                </svg>
                <span>{{ copy().contactTitle }}</span>
              </h2>

              <div class="contact-list">
                @if (item.phone) {
                  <div class="contact-row">
                    <span class="contact-row-icon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                        ></path>
                      </svg>
                    </span>
                    <div class="contact-meta">
                      <span class="contact-label">{{ copy().phoneLabel }}</span>
                      <a [href]="'tel:' + item.phone" class="contact-value">{{ item.phone }}</a>
                    </div>
                  </div>
                }

                @if (item.email) {
                  <div class="contact-row">
                    <span class="contact-row-icon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </span>
                    <div class="contact-meta">
                      <span class="contact-label">{{ copy().emailLabel }}</span>
                      <a [href]="'mailto:' + item.email" class="contact-value">{{ item.email }}</a>
                    </div>
                  </div>
                }

                @if (item.website) {
                  <div class="contact-row">
                    <span class="contact-row-icon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path
                          d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                        ></path>
                      </svg>
                    </span>
                    <div class="contact-meta">
                      <span class="contact-label">{{ copy().websiteLabel }}</span>
                      <a
                        [href]="item.website"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="contact-value link-external"
                      >
                        <span>{{ item.website }}</span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  </div>
                }

                @if (!item.phone && !item.email && !item.website) {
                  <p class="muted-text">{{ copy().noDirectContact }}</p>
                }
              </div>

              <button type="button" class="btn-sidebar-inquiry" (click)="openInquiryModal()">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m22 2-7 20-4-9-9-4Z"></path>
                  <path d="M22 2 11 13"></path>
                </svg>
                <span>{{ copy().sendInquiry }}</span>
              </button>
            </section>

            <!-- Family Assurance Card -->
            <section class="info-card assurance-card">
              <div class="assurance-header">
                <span class="assurance-badge-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </span>
                <h3 class="assurance-title">{{ copy().familyNoteTitle }}</h3>
              </div>
              <p class="assurance-body">{{ copy().familyNoteText }}</p>
            </section>
          </div>
        </main>
      }

      <!-- Inquiry Modal -->
      @if (showInquiryModal()) {
        <div class="modal-backdrop" (click)="closeInquiryModal()">
          <div
            class="modal-dialog"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-labelledby="inquiry-title"
          >
            <div class="modal-header">
              <h2 id="inquiry-title" class="modal-title">
                {{ copy().modalTitle(detail()?.name || '') }}
              </h2>
              <button
                type="button"
                class="modal-close-btn"
                (click)="closeInquiryModal()"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div class="notice-callout">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="notice-icon"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p class="notice-text">{{ copy().modalNotice }}</p>
            </div>

            <form (ngSubmit)="submitInquiry()" class="inquiry-form">
              <div class="form-group">
                <label for="child-select" class="form-label">{{ copy().regardingChild }}</label>
                <select
                  id="child-select"
                  class="form-select"
                  [ngModel]="selectedChildId()"
                  (ngModelChange)="selectedChildId.set($event)"
                  name="childSelect"
                >
                  <option value="">{{ copy().generalInquiry }}</option>
                  @for (child of children(); track child.id) {
                    <option [value]="child.id">{{ child.firstName }}</option>
                  }
                </select>
                <span class="field-hint">{{ copy().childPrivacyNote }}</span>
              </div>

              <div class="form-group">
                <label for="inquiry-subject" class="form-label">{{ copy().subjectLabel }}</label>
                <input
                  id="inquiry-subject"
                  type="text"
                  maxlength="120"
                  required
                  class="form-input"
                  [placeholder]="copy().subjectPlaceholder"
                  [ngModel]="inquirySubject()"
                  (ngModelChange)="inquirySubject.set($event)"
                  name="inquirySubject"
                />
                <span class="char-count">{{ inquirySubject().length }}/120</span>
              </div>

              <div class="form-group">
                <label for="inquiry-message" class="form-label">{{ copy().messageLabel }}</label>
                <textarea
                  id="inquiry-message"
                  rows="5"
                  maxlength="2000"
                  required
                  class="form-textarea"
                  [placeholder]="copy().messagePlaceholder"
                  [ngModel]="inquiryMessage()"
                  (ngModelChange)="inquiryMessage.set($event)"
                  name="inquiryMessage"
                ></textarea>
                <span class="char-count">{{ inquiryMessage().length }}/2000</span>
              </div>

              @if (inquiryError()) {
                <div class="form-error" role="alert">{{ inquiryError() }}</div>
              }

              <div class="modal-footer">
                <button
                  type="button"
                  class="btn-cancel"
                  (click)="closeInquiryModal()"
                  [disabled]="inquirySubmitting()"
                >
                  {{ copy().cancel }}
                </button>
                <button
                  type="submit"
                  class="btn-submit"
                  [disabled]="
                    inquirySubmitting() || !inquirySubject().trim() || !inquiryMessage().trim()
                  "
                >
                  {{ inquirySubmitting() ? copy().sending : copy().sendInquiry }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (inquirySuccess()) {
        <div class="toast-success" role="status">
          <span>{{ copy().successToast }}</span>
          <button type="button" class="toast-close" (click)="inquirySuccess.set(false)">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding-bottom: var(--ac-space-12);
      }

      .detail-container {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-6);
        max-width: 1140px;
        margin: 0 auto;
        padding: var(--ac-space-4) 0;
      }

      /* Navigation Bar */
      .back-nav {
        display: flex;
        align-items: center;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
        color: var(--ac-color-action-mid);
        text-decoration: none;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-semibold);
        padding: var(--ac-space-2) var(--ac-space-3);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        transition:
          color var(--ac-motion-fast),
          border-color var(--ac-motion-fast),
          background var(--ac-motion-fast);
      }

      .back-link:hover {
        color: var(--ac-color-action-deep);
        border-color: var(--ac-color-action);
        background: var(--ac-brand-50);
      }

      /* Unified Hero Card: One Row (Col 1 = Image, Col 2 = Description & Info) */
      .detail-hero-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        display: grid;
        grid-template-columns: 380px 1fr;
        gap: var(--ac-space-6);
        padding: var(--ac-space-6);
        box-shadow: var(--ac-shadow-sm);
        align-items: stretch;
      }

      .hero-media-col {
        position: relative;
        min-height: 280px;
        border-radius: var(--ac-radius-md);
        overflow: hidden;
        background: var(--ac-brand-50);
        border: 1px solid var(--ac-color-border);
      }

      .detail-hero-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
      }

      .detail-hero-fallback {
        width: 100%;
        height: 100%;
        min-height: 280px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--ac-space-3);
        background: linear-gradient(
          135deg,
          var(--ac-brand-50) 0%,
          color-mix(in srgb, var(--ac-brand-100) 80%, var(--ac-color-surface)) 100%
        );
        color: var(--ac-brand-700);
      }

      .detail-hero-fallback.hospital-fallback {
        background: linear-gradient(
          135deg,
          var(--ac-color-surface-info) 0%,
          color-mix(in srgb, var(--ac-brand-200) 50%, var(--ac-color-surface)) 100%
        );
        color: var(--ac-brand-900);
      }

      .fallback-hero-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: var(--ac-radius-pill);
        background: color-mix(in srgb, var(--ac-color-surface) 85%, transparent);
        box-shadow: var(--ac-shadow-sm);
      }

      .fallback-hero-text {
        font-size: var(--ac-type-card-title);
        font-weight: var(--ac-font-weight-bold);
        opacity: 0.9;
      }

      .hero-desc-col {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--ac-space-4);
        min-width: 0;
      }

      .hero-top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
      }

      .badges-row {
        display: flex;
        gap: var(--ac-space-2);
        align-items: center;
        flex-wrap: wrap;
      }

      .type-badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: var(--ac-font-weight-semibold);
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-ice-blue-soft);
        color: var(--ac-brand-800);
        border: 1px solid var(--ac-color-ice-blue-border);
      }

      .type-badge.hospital-badge {
        background: var(--ac-color-surface-info);
        color: var(--ac-brand-900);
        border-color: var(--ac-brand-300);
      }

      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        font-weight: var(--ac-font-weight-semibold);
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-tint-50);
        color: var(--ac-color-green-dark);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
      }

      .heart-action-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
        min-height: 42px;
        padding: 0 var(--ac-space-4);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        cursor: pointer;
        font: inherit;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-semibold);
        transition:
          border-color var(--ac-motion-fast),
          color var(--ac-motion-fast),
          background var(--ac-motion-fast);
      }

      .heart-action-btn:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      .heart-action-btn.favorited {
        background: var(--ac-color-amber-tint-50);
        color: var(--ac-color-amber-800);
        border-color: var(--ac-color-amber-tint-sand);
      }

      .btn-inquiry {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
        min-height: 42px;
        padding: 0 var(--ac-space-5);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: var(--ac-radius-md);
        font: inherit;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
        box-shadow: var(--ac-shadow-xs);
        transition:
          background var(--ac-motion-fast),
          transform var(--ac-motion-fast);
      }

      .btn-inquiry:hover {
        background: var(--ac-color-action-deep);
        transform: translateY(-1px);
      }

      .hero-body-content {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-2);
        flex: 1;
      }

      .item-title {
        font-size: var(--ac-type-page-title);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: var(--ac-space-1) 0;
        line-height: var(--ac-line-tight);
      }

      .location-line {
        display: flex;
        align-items: center;
        gap: var(--ac-space-2);
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-muted);
      }

      .location-icon {
        color: var(--ac-color-action-mid);
        flex-shrink: 0;
      }

      .overview-box {
        margin-top: var(--ac-space-2);
        padding-top: var(--ac-space-3);
        border-top: 1px solid var(--ac-color-border);
      }

      .overview-heading {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-muted);
        margin: 0 0 var(--ac-space-1);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .overview-desc {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-body);
        line-height: var(--ac-line-body);
        margin: 0;
      }

      /* Two Column Content Grid */
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: var(--ac-space-6);
        align-items: start;
      }

      .detail-main-col,
      .detail-sidebar-col {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-6);
      }

      .info-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: var(--ac-space-6);
        box-shadow: var(--ac-shadow-xs);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--ac-space-2);
        font-size: var(--ac-type-card-title);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: 0 0 var(--ac-space-4) 0;
      }

      .section-title svg {
        color: var(--ac-color-action-mid);
        flex-shrink: 0;
      }

      /* Google Maps Bar */
      .maps-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--ac-space-3);
        padding: var(--ac-space-4);
        background: var(--ac-brand-50);
        border: 1px solid var(--ac-brand-200);
        border-radius: var(--ac-radius-md);
        flex-wrap: wrap;
      }

      .maps-info {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        flex: 1;
        min-width: 240px;
      }

      .maps-icon {
        color: var(--ac-color-action-mid);
        flex-shrink: 0;
      }

      .maps-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .maps-label {
        font-weight: var(--ac-font-weight-semibold);
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-strong);
      }

      .maps-address {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .maps-cta-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
        min-height: 38px;
        padding: 0 var(--ac-space-4);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-action-mid);
        border-radius: var(--ac-radius-md);
        text-decoration: none;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        white-space: nowrap;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .maps-cta-btn:hover {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      /* Services Chips */
      .services-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ac-space-2);
      }

      .service-chip {
        display: inline-block;
        background: var(--ac-brand-50);
        border: 1px solid var(--ac-brand-200);
        border-radius: var(--ac-radius-pill);
        padding: 6px 14px;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-brand-800);
      }

      .age-groups-text {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-body);
        line-height: var(--ac-line-body);
        margin: 0;
      }

      /* Sidebar Contact Card */
      .contact-card {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-4);
      }

      .contact-list {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-4);
      }

      .contact-row {
        display: flex;
        align-items: flex-start;
        gap: var(--ac-space-3);
      }

      .contact-row-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-brand-50);
        color: var(--ac-color-action-mid);
        flex-shrink: 0;
      }

      .contact-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .contact-label {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .contact-value {
        font-size: var(--ac-type-body);
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-medium);
        text-decoration: none;
        word-break: break-all;
      }

      .contact-value:hover {
        text-decoration: underline;
      }

      .link-external {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .btn-sidebar-inquiry {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--ac-space-2);
        width: 100%;
        min-height: 44px;
        padding: 0 var(--ac-space-4);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: var(--ac-radius-md);
        font: inherit;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
        box-shadow: var(--ac-shadow-xs);
        transition: background var(--ac-motion-fast);
      }

      .btn-sidebar-inquiry:hover {
        background: var(--ac-color-action-deep);
      }

      /* Family Assurance Card */
      .assurance-card {
        background: color-mix(in srgb, var(--ac-brand-50) 60%, var(--ac-color-surface));
        border: 1px solid var(--ac-brand-200);
      }

      .assurance-header {
        display: flex;
        align-items: center;
        gap: var(--ac-space-2);
        margin-bottom: var(--ac-space-2);
      }

      .assurance-badge-icon {
        color: var(--ac-color-action-mid);
        display: flex;
      }

      .assurance-title {
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-brand-900);
        margin: 0;
      }

      .assurance-body {
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-body);
        margin: 0;
      }

      .muted-text {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-muted);
        line-height: var(--ac-line-body);
        margin: 0;
      }

      /* Modal */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--ac-color-overlay);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: var(--ac-space-4);
      }

      .modal-dialog {
        background: var(--ac-color-surface);
        border-radius: var(--ac-radius-lg);
        width: 100%;
        max-width: 580px;
        box-shadow: var(--ac-shadow-lg);
        border: 1px solid var(--ac-color-border);
        overflow: hidden;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--ac-space-5) var(--ac-space-6);
        border-bottom: 1px solid var(--ac-color-border);
      }

      .modal-title {
        font-size: var(--ac-type-card-title);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: 0;
      }

      .modal-close-btn {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        color: var(--ac-color-text-muted);
        cursor: pointer;
        padding: var(--ac-space-1);
        line-height: 1;
      }

      .modal-close-btn:hover {
        color: var(--ac-color-text-strong);
      }

      .notice-callout {
        display: flex;
        align-items: flex-start;
        gap: var(--ac-space-3);
        margin: var(--ac-space-5) var(--ac-space-6) 0;
        padding: var(--ac-space-3) var(--ac-space-4);
        background: var(--ac-brand-50);
        border: 1px solid var(--ac-brand-200);
        border-radius: var(--ac-radius-md);
      }

      .notice-icon {
        color: var(--ac-color-action-mid);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .notice-text {
        font-size: var(--ac-type-meta);
        color: var(--ac-brand-900);
        line-height: var(--ac-line-body);
        margin: 0;
      }

      .inquiry-form {
        padding: var(--ac-space-5) var(--ac-space-6) var(--ac-space-6);
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-4);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-1);
        position: relative;
      }

      .form-label {
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .form-select,
      .form-input,
      .form-textarea {
        width: 100%;
        padding: var(--ac-space-3);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: var(--ac-type-body);
        box-sizing: border-box;
      }

      .form-select:focus,
      .form-input:focus,
      .form-textarea:focus {
        outline: 2px solid var(--ac-color-focus);
        border-color: transparent;
      }

      .field-hint {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .char-count {
        font-size: 0.75rem;
        color: var(--ac-color-text-muted);
        align-self: flex-end;
      }

      .form-error {
        padding: var(--ac-space-3);
        background: var(--ac-color-red-tint-50);
        border: 1px solid var(--ac-color-red-tint-muted);
        border-radius: var(--ac-radius-md);
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--ac-space-3);
        padding-top: var(--ac-space-4);
        border-top: 1px solid var(--ac-color-border);
      }

      .btn-cancel {
        min-height: 40px;
        padding: 0 var(--ac-space-4);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font: inherit;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      .btn-submit {
        min-height: 40px;
        padding: 0 var(--ac-space-5);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: var(--ac-radius-md);
        font: inherit;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }

      .btn-submit:disabled,
      .btn-cancel:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .toast-success {
        position: fixed;
        bottom: var(--ac-space-6);
        right: var(--ac-space-6);
        background: var(--ac-brand-900);
        color: var(--ac-color-white);
        padding: var(--ac-space-4) var(--ac-space-6);
        border-radius: var(--ac-radius-md);
        box-shadow: var(--ac-shadow-lg);
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        z-index: 1100;
        font-size: var(--ac-type-body);
      }

      .toast-close {
        background: transparent;
        border: none;
        color: var(--ac-color-white);
        font-size: 1.25rem;
        cursor: pointer;
        line-height: 1;
      }

      .loading-state {
        padding: var(--ac-space-12);
        display: flex;
        justify-content: center;
      }

      .error-banner {
        padding: var(--ac-space-5);
        background: var(--ac-color-red-tint-50);
        border: 1px solid var(--ac-color-red-tint-muted);
        border-radius: var(--ac-radius-md);
        color: var(--ac-color-alert-text);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--ac-space-4);
      }

      .btn-back {
        color: var(--ac-color-alert-strong);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: underline;
      }

      @media (max-width: 960px) {
        .detail-hero-card {
          grid-template-columns: 1fr;
          padding: var(--ac-space-5);
        }

        .hero-media-col {
          height: 240px;
          min-height: 240px;
        }

        .detail-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .hero-media-col {
          height: 200px;
          min-height: 200px;
        }

        .item-title {
          font-size: 1.5rem;
        }

        .header-actions {
          width: 100%;
        }

        .btn-inquiry,
        .heart-action-btn {
          flex: 1;
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly hospitalsApi = inject(HospitalsApi);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly inquiriesApi = inject(InquiriesApi);
  private readonly i18n = inject(I18nService);

  readonly currentLang = this.i18n.currentLang;
  readonly copy = computed(() => COPY[this.currentLang()] ?? COPY.en);

  readonly detail = signal<SupportDetailView | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly children = signal<ChildResponse[]>([]);

  readonly showInquiryModal = signal(false);
  readonly inquirySubject = signal('');
  readonly inquiryMessage = signal('');
  readonly selectedChildId = signal('');
  readonly inquirySubmitting = signal(false);
  readonly inquiryError = signal<string | null>(null);
  readonly inquirySuccess = signal(false);

  readonly googleMapsUrl = computed(() => {
    const item = this.detail();
    if (!item) return '#';
    const query = encodeURIComponent(`${item.name}, ${item.address}, ${item.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  });

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type');
    const id = this.route.snapshot.paramMap.get('id');

    if (!id || (type !== 'school' && type !== 'hospital')) {
      this.error.set(this.copy().invalidProvider);
      this.loading.set(false);
      return;
    }

    this.loadDetail(type, id);
    this.loadChildren();
  }

  loadDetail(type: 'school' | 'hospital', id: string): void {
    this.loading.set(true);
    this.error.set(null);

    if (type === 'school') {
      this.schoolsApi.getSchoolById(id).subscribe({
        next: (school) => {
          this.detail.set({
            id: school.id,
            type: 'school',
            name: school.name,
            city: school.city,
            address: school.address,
            description:
              school.description ||
              'Inclusive learning environment with specialized educators and supportive programs.',
            services:
              school.specializations && school.specializations.length > 0
                ? school.specializations
                : ['Inclusive Education', 'Sensory Support', 'Speech & Social Programs'],
            ageGroups: school.waitlistEstimate ? `Waitlist: ${school.waitlistEstimate}` : null,
            phone: school.phone ?? null,
            email: school.email,
            website: school.website,
            isVerified: Boolean(school.isVerified),
            isFavorite: Boolean(school.isFavorite),
            imageUrl:
              getFacilityImageUrl(school.name, school.id) ||
              school.coverImageUrl ||
              school.logoUrl ||
              null,
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.copy().loadErrorSchool);
          this.loading.set(false);
        },
      });
    } else {
      this.hospitalsApi.getHospital(id).subscribe({
        next: (hospital) => {
          const serviceList = hospital.services
            ? hospital.services
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : ['Pediatric Assessment', 'Developmental Screening', 'Therapy Consultation'];

          this.detail.set({
            id: hospital.id,
            type: 'hospital',
            name: hospital.name,
            city: hospital.city,
            address: hospital.address,
            description:
              hospital.description ||
              'Healthcare facility offering pediatric medical assessments, diagnostics, and family consultations.',
            services: serviceList,
            ageGroups: null,
            phone: hospital.phone ?? null,
            email: null,
            website: hospital.website ?? null,
            isVerified: false,
            isFavorite: Boolean((hospital as { isFavorite?: boolean }).isFavorite),
            imageUrl: getFacilityImageUrl(hospital.name, hospital.id) || null,
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.copy().loadErrorHospital);
          this.loading.set(false);
        },
      });
    }
  }

  loadChildren(): void {
    this.childrenApi.listChildren().subscribe({
      next: (children) => this.children.set(children),
      error: () => {},
    });
  }

  toggleFavorite(): void {
    const item = this.detail();
    if (!item) return;

    const nextState = !item.isFavorite;
    if (item.type === 'school') {
      const call = nextState
        ? this.schoolsApi.addFavorite(item.id)
        : this.schoolsApi.removeFavorite(item.id);

      call.subscribe({
        next: () =>
          this.detail.update((prev) => (prev ? { ...prev, isFavorite: nextState } : null)),
        error: () => {},
      });
    } else {
      this.hospitalsApi.toggleFavorite(item.id).subscribe({
        next: (res) =>
          this.detail.update((prev) => (prev ? { ...prev, isFavorite: res.isFavorite } : null)),
        error: () => {},
      });
    }
  }

  openInquiryModal(): void {
    this.inquirySubject.set('');
    this.inquiryMessage.set('');
    this.selectedChildId.set('');
    this.inquiryError.set(null);
    this.showInquiryModal.set(true);
  }

  closeInquiryModal(): void {
    this.showInquiryModal.set(false);
  }

  submitInquiry(): void {
    const item = this.detail();
    if (!item) return;

    const subject = this.inquirySubject().trim();
    const message = this.inquiryMessage().trim();

    if (!subject || !message) {
      this.inquiryError.set('Subject and message are required.');
      return;
    }

    let childFirstName: string | null = null;
    if (this.selectedChildId()) {
      const child = this.children().find((c) => c.id === this.selectedChildId());
      if (child) childFirstName = child.firstName;
    }

    this.inquirySubmitting.set(true);
    this.inquiryError.set(null);

    this.inquiriesApi
      .createInquiry({
        schoolId: item.type === 'school' ? item.id : undefined,
        hospitalId: item.type === 'hospital' ? item.id : undefined,
        childFirstName,
        subject,
        message,
      })
      .subscribe({
        next: () => {
          this.inquirySubmitting.set(false);
          this.showInquiryModal.set(false);
          this.inquirySuccess.set(true);
          setTimeout(() => this.inquirySuccess.set(false), 5000);
        },
        error: (err) => {
          this.inquirySubmitting.set(false);
          this.inquiryError.set(
            err?.error?.error?.message || 'Failed to send inquiry. Please try again.',
          );
        },
      });
  }
}
