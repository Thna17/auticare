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
}

@Component({
  selector: 'ac-support-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, UiSpinnerComponent],
  template: `
    <div class="detail-container">
      <nav class="back-nav">
        <a routerLink="/find-support" class="back-link">&larr; Back to Support Directory</a>
      </nav>

      @if (loading()) {
        <div class="loading-state">
          <ac-ui-spinner label="Loading details..."></ac-ui-spinner>
        </div>
      } @else if (error()) {
        <div class="error-banner" role="alert">
          <p>{{ error() }}</p>
          <a routerLink="/find-support" class="btn-back">Return to Directory</a>
        </div>
      } @else if (detail(); as item) {
        <header class="detail-header">
          <div class="header-main">
            <div class="badges-row">
              <span class="type-badge" [class.hospital-badge]="item.type === 'hospital'">
                {{ item.type === 'school' ? 'School' : 'Healthcare Facility' }}
              </span>
              @if (item.isVerified) {
                <span class="verified-badge">&#x2713; AutiCare Partner</span>
              }
            </div>

            <h1 class="item-title">{{ item.name }}</h1>

            <div class="location-line">
              <span aria-hidden="true">&#x1F4CD;</span>
              <span>{{ item.address }}, {{ item.city }}</span>
            </div>
          </div>

          <div class="header-actions">
            <button
              type="button"
              class="heart-action-btn"
              [class.favorited]="item.isFavorite"
              (click)="toggleFavorite()"
              [attr.aria-label]="item.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
            >
              <span class="heart-icon">&#x2665;</span>
              <span>{{ item.isFavorite ? 'Saved' : 'Save' }}</span>
            </button>

            <button type="button" class="btn-inquiry" (click)="openInquiryModal()">
              Send Inquiry
            </button>
          </div>
        </header>

        <main class="detail-content">
          <section class="info-card">
            <h2 class="section-title">Overview</h2>
            <p class="overview-desc">{{ item.description }}</p>

            <div class="maps-section">
              <span class="maps-icon">&#x1F5FA;</span>
              <a
                [href]="googleMapsUrl()"
                target="_blank"
                rel="noopener noreferrer"
                class="maps-link"
              >
                Open location in Google Maps &rarr;
              </a>
            </div>
          </section>

          <section class="info-card">
            <h2 class="section-title">Services Offered</h2>
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

          @if (item.type === 'school' && item.ageGroups) {
            <section class="info-card">
              <h2 class="section-title">Age Groups Served</h2>
              <p class="age-groups-text">{{ item.ageGroups }}</p>
            </section>
          }

          <section class="info-card">
            <h2 class="section-title">Contact Information</h2>
            <div class="contact-grid">
              @if (item.phone) {
                <div class="contact-item">
                  <span class="contact-label">Phone:</span>
                  <a [href]="'tel:' + item.phone" class="contact-value">{{ item.phone }}</a>
                </div>
              }
              @if (item.email) {
                <div class="contact-item">
                  <span class="contact-label">Email:</span>
                  <a [href]="'mailto:' + item.email" class="contact-value">{{ item.email }}</a>
                </div>
              }
              @if (item.website) {
                <div class="contact-item">
                  <span class="contact-label">Website:</span>
                  <a
                    [href]="item.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="contact-value"
                  >
                    {{ item.website }}
                  </a>
                </div>
              }
              @if (!item.phone && !item.email && !item.website) {
                <p class="muted-text">
                  Direct inquiries can be sent using the Send Inquiry button above.
                </p>
              }
            </div>
          </section>
        </main>
      }

      @if (showInquiryModal()) {
        <div class="modal-backdrop" (click)="closeInquiryModal()">
          <div
            class="modal-dialog"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-labelledby="inquiry-title"
          >
            <div class="modal-header">
              <h2 id="inquiry-title" class="modal-title">Send Inquiry to {{ detail()?.name }}</h2>
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
              <span class="notice-icon">&#x2139;</span>
              <p class="notice-text">
                The organization may reply to you directly by email or phone outside AutiCare.
              </p>
            </div>

            <form (ngSubmit)="submitInquiry()" class="inquiry-form">
              <div class="form-group">
                <label for="child-select" class="form-label">Regarding Child (Optional)</label>
                <select
                  id="child-select"
                  class="form-select"
                  [ngModel]="selectedChildId()"
                  (ngModelChange)="selectedChildId.set($event)"
                  name="childSelect"
                >
                  <option value="">General inquiry (no child mentioned)</option>
                  @for (child of children(); track child.id) {
                    <option [value]="child.id">{{ child.firstName }}</option>
                  }
                </select>
                <span class="field-hint">
                  Only your child&#39;s first name is shared to protect family privacy.
                </span>
              </div>

              <div class="form-group">
                <label for="inquiry-subject" class="form-label">Subject *</label>
                <input
                  id="inquiry-subject"
                  type="text"
                  maxlength="120"
                  required
                  class="form-input"
                  placeholder="e.g. Inquiring about specialized support programs"
                  [ngModel]="inquirySubject()"
                  (ngModelChange)="inquirySubject.set($event)"
                  name="inquirySubject"
                />
                <span class="char-count">{{ inquirySubject().length }}/120</span>
              </div>

              <div class="form-group">
                <label for="inquiry-message" class="form-label">Message *</label>
                <textarea
                  id="inquiry-message"
                  rows="5"
                  maxlength="2000"
                  required
                  class="form-textarea"
                  placeholder="Write your questions or message for the organization..."
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
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn-submit"
                  [disabled]="
                    inquirySubmitting() || !inquirySubject().trim() || !inquiryMessage().trim()
                  "
                >
                  {{ inquirySubmitting() ? 'Sending...' : 'Send Inquiry' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (inquirySuccess()) {
        <div class="toast-success" role="status">
          <span>Inquiry sent successfully! The organization has been notified.</span>
          <button type="button" class="toast-close" (click)="inquirySuccess.set(false)">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .detail-container {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-lg);
        padding: var(--ac-spacing-lg);
        max-width: 960px;
        margin: 0 auto;
      }

      .back-nav {
        margin-bottom: var(--ac-spacing-xs);
      }

      .back-link {
        color: var(--ac-color-primary);
        text-decoration: none;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-medium);
      }

      .back-link:hover {
        text-decoration: underline;
      }

      .detail-header {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-lg);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--ac-spacing-lg);
        flex-wrap: wrap;
      }

      .header-main {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-xs);
        flex: 1;
        min-width: 280px;
      }

      .badges-row {
        display: flex;
        gap: var(--ac-spacing-xs);
        align-items: center;
      }

      .type-badge {
        display: inline-block;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-bold);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
        background: color-mix(in srgb, var(--ac-color-primary) 15%, transparent);
        color: var(--ac-color-primary);
      }

      .type-badge.hospital-badge {
        background: color-mix(
          in srgb,
          var(--ac-color-accent, var(--ac-color-primary)) 15%,
          transparent
        );
        color: var(--ac-color-accent, var(--ac-color-primary));
      }

      .verified-badge {
        display: inline-block;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-medium);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
        background: color-mix(in srgb, var(--ac-color-success) 15%, transparent);
        color: var(--ac-color-success);
      }

      .item-title {
        font-size: var(--ac-type-h1);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
        margin: 0;
        line-height: var(--ac-line-tight);
      }

      .location-line {
        display: flex;
        align-items: center;
        gap: var(--ac-spacing-xs);
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-muted);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--ac-spacing-sm);
      }

      .heart-action-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-spacing-xs);
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-muted);
        cursor: pointer;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-medium);
        transition: all 0.2s;
      }

      .heart-action-btn:hover {
        border-color: var(--ac-color-danger);
        color: var(--ac-color-danger);
      }

      .heart-action-btn.favorited {
        background: color-mix(in srgb, var(--ac-color-danger) 12%, transparent);
        color: var(--ac-color-danger);
        border-color: var(--ac-color-danger);
      }

      .btn-inquiry {
        background: var(--ac-color-primary);
        color: var(--ac-color-surface);
        border: none;
        padding: var(--ac-spacing-sm) var(--ac-spacing-lg);
        border-radius: var(--ac-radius-md);
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-inquiry:hover {
        opacity: 0.92;
      }

      .detail-content {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-md);
      }

      .info-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-lg);
      }

      .section-title {
        font-size: var(--ac-type-h2);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
        margin: 0 0 var(--ac-spacing-sm) 0;
      }

      .overview-desc {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text);
        line-height: 1.6;
        margin: 0 0 var(--ac-spacing-md) 0;
      }

      .maps-section {
        display: flex;
        align-items: center;
        gap: var(--ac-spacing-xs);
        padding-top: var(--ac-spacing-sm);
        border-top: 1px solid var(--ac-color-border);
      }

      .maps-icon {
        font-size: 1.2rem;
      }

      .maps-link {
        color: var(--ac-color-primary);
        text-decoration: none;
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-medium);
      }

      .maps-link:hover {
        text-decoration: underline;
      }

      .services-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ac-spacing-xs);
      }

      .service-chip {
        background: color-mix(in srgb, var(--ac-color-surface) 50%, var(--ac-color-border));
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-full, 9999px);
        padding: var(--ac-spacing-xs) var(--ac-spacing-md);
        font-size: var(--ac-type-small);
        color: var(--ac-color-text);
      }

      .age-groups-text {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text);
        margin: 0;
      }

      .contact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--ac-spacing-md);
      }

      .contact-item {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .contact-label {
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .contact-value {
        font-size: var(--ac-type-body);
        color: var(--ac-color-primary);
        text-decoration: none;
        word-break: break-all;
      }

      .contact-value:hover {
        text-decoration: underline;
      }

      .muted-text {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-muted);
        margin: 0;
      }

      /* Modal */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: color-mix(in srgb, var(--ac-color-text) 50%, transparent);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: var(--ac-spacing-md);
      }

      .modal-dialog {
        background: var(--ac-color-surface);
        border-radius: var(--ac-radius-lg);
        border: 1px solid var(--ac-color-border);
        width: 100%;
        max-width: 540px;
        max-height: 90vh;
        overflow-y: auto;
        padding: var(--ac-spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-md);
        box-shadow: 0 10px 30px color-mix(in srgb, var(--ac-color-text) 15%, transparent);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-title {
        font-size: var(--ac-type-h2);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
        margin: 0;
      }

      .modal-close-btn {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        color: var(--ac-color-text-muted);
        cursor: pointer;
        line-height: 1;
      }

      .notice-callout {
        background: color-mix(in srgb, var(--ac-color-primary) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--ac-color-primary) 30%, transparent);
        border-radius: var(--ac-radius-sm);
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        display: flex;
        align-items: center;
        gap: var(--ac-spacing-sm);
      }

      .notice-icon {
        color: var(--ac-color-primary);
        font-size: 1.2rem;
      }

      .notice-text {
        font-size: var(--ac-type-small);
        color: var(--ac-color-text);
        margin: 0;
      }

      .inquiry-form {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-md);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-xs);
        position: relative;
      }

      .form-label {
        font-size: var(--ac-type-body);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text);
      }

      .form-input,
      .form-select,
      .form-textarea {
        width: 100%;
        padding: var(--ac-spacing-sm);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-background);
        color: var(--ac-color-text);
        font-size: var(--ac-type-body);
      }

      .form-input:focus,
      .form-select:focus,
      .form-textarea:focus {
        outline: 2px solid var(--ac-color-primary);
        border-color: transparent;
      }

      .field-hint {
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .char-count {
        align-self: flex-end;
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .form-error {
        color: var(--ac-color-danger);
        font-size: var(--ac-type-small);
        padding: var(--ac-spacing-xs);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--ac-spacing-sm);
        padding-top: var(--ac-spacing-sm);
        border-top: 1px solid var(--ac-color-border);
      }

      .btn-cancel {
        background: transparent;
        border: 1px solid var(--ac-color-border);
        padding: var(--ac-spacing-sm) var(--ac-spacing-md);
        border-radius: var(--ac-radius-sm);
        color: var(--ac-color-text);
        cursor: pointer;
      }

      .btn-submit {
        background: var(--ac-color-primary);
        color: var(--ac-color-surface);
        border: none;
        padding: var(--ac-spacing-sm) var(--ac-spacing-lg);
        border-radius: var(--ac-radius-sm);
        cursor: pointer;
        font-weight: var(--ac-font-weight-bold);
      }

      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .toast-success {
        position: fixed;
        bottom: var(--ac-spacing-lg);
        right: var(--ac-spacing-lg);
        background: var(--ac-color-success);
        color: var(--ac-color-surface);
        padding: var(--ac-spacing-md) var(--ac-spacing-lg);
        border-radius: var(--ac-radius-md);
        display: flex;
        align-items: center;
        gap: var(--ac-spacing-md);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--ac-color-text) 20%, transparent);
        z-index: 1100;
      }

      .toast-close {
        background: transparent;
        border: none;
        color: var(--ac-color-surface);
        font-size: 1.2rem;
        cursor: pointer;
      }

      .loading-state {
        padding: var(--ac-spacing-xl);
        display: flex;
        justify-content: center;
      }

      .error-banner {
        padding: var(--ac-spacing-md);
        background: color-mix(in srgb, var(--ac-color-danger) 15%, transparent);
        border: 1px solid var(--ac-color-danger);
        border-radius: var(--ac-radius-md);
        color: var(--ac-color-danger);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .btn-back {
        color: var(--ac-color-danger);
        text-decoration: underline;
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
      this.error.set('Invalid support provider specified.');
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
            phone: null,
            email: school.email,
            website: school.website,
            isVerified: Boolean(school.isVerified),
            isFavorite: Boolean(school.isFavorite),
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load school details.');
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
              'Healthcare facility offering pediatric medical assessments, diagnostics, and family consultations.',
            services: serviceList,
            ageGroups: null,
            phone: null,
            email: null,
            website: null,
            isVerified: false,
            isFavorite: Boolean((hospital as { isFavorite?: boolean }).isFavorite),
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load healthcare facility details.');
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
