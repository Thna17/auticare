import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { HospitalResponse } from '@auticare/contracts';
import { HospitalManagementApi, type HospitalStaffMember } from './hospital-management.api';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiCardComponent,
    UiFieldComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    AccessibleFormDirective,
  ],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a routerLink="/hospital/dashboard">Dashboard</a>
      <span aria-hidden="true">/</span>
      <span>Hospital profile</span>
    </nav>

    <header class="page-header">
      <div class="header-main">
        <p class="eyebrow">Institutional Governance</p>
        <h1>Hospital profile</h1>
        <p class="subtitle">
          Manage your hospital's public directory profile, address, emergency contact details, and
          clinical departments.
        </p>
      </div>
      @if (mode() === 'view' && hospital()) {
        <button type="button" class="btn-primary" (click)="startEditing()">Edit Profile</button>
      }
    </header>

    @if (loading()) {
      <ac-ui-card>
        <ac-ui-spinner label="Loading hospital profile…" />
      </ac-ui-card>
    } @else if (error(); as err) {
      <ac-ui-message tone="error">{{ err }}</ac-ui-message>
    } @else if (hospital(); as h) {
      @if (savedFlash()) {
        <div class="save-banner ok" role="status" aria-live="polite">
          <span class="save-icon" aria-hidden="true">✓</span>
          <span>Profile saved — your institutional details are now up to date.</span>
        </div>
      }

      @if (mode() === 'view') {
        <!-- VIEW MODE -->
        <div class="profile-layout">
          <!-- Overview Card -->
          <ac-ui-card class="overview-card">
            <div class="overview-header">
              <div class="badge-icon" aria-hidden="true">🏥</div>
              <div class="hospital-identity">
                <div class="identity-name-row">
                  <h2>{{ h.name }}</h2>
                  <span class="verified-partner-pill">✓ Partner Hospital</span>
                </div>
                <p class="location-line">{{ h.address }}, {{ h.city }}</p>
              </div>
            </div>

            <dl class="details-grid">
              <div class="detail-item">
                <dt>City / Province</dt>
                <dd>{{ h.city }}</dd>
              </div>
              <div class="detail-item">
                <dt>Physical Address</dt>
                <dd>{{ h.address }}</dd>
              </div>
              <div class="detail-item">
                <dt>Contact Phone</dt>
                <dd>{{ phone() || 'Not specified' }}</dd>
              </div>
              <div class="detail-item">
                <dt>Last Updated</dt>
                <dd>{{ formatDate(h.updatedAt) }}</dd>
              </div>
            </dl>
          </ac-ui-card>

          <!-- Emergency & Intake Details Card -->
          <ac-ui-card class="emergency-contact-card">
            <div class="card-section-header">
              <div class="emergency-icon-wrap" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  ></path>
                </svg>
              </div>
              <div>
                <h3>Emergency &amp; Intake Desk Contact</h3>
                <p class="section-desc">
                  Primary helpline and staff contacts for patient triage coordination.
                </p>
              </div>
            </div>

            <dl class="emergency-details-grid">
              <div class="detail-item">
                <dt>Hospital Helpline</dt>
                <dd class="helpline-value">{{ phone() || 'Direct line not configured' }}</dd>
              </div>
              <div class="detail-item">
                <dt>Staff Coordinator</dt>
                <dd>{{ staff()?.firstName }} {{ staff()?.lastName }} ({{ staff()?.role }})</dd>
              </div>
              <div class="detail-item">
                <dt>Liaison Email</dt>
                <dd>{{ staff()?.email || 'hospital-desk@auticare.kh' }}</dd>
              </div>
            </dl>
          </ac-ui-card>

          <!-- Departments & Services Tags Card -->
          <ac-ui-card class="services-card">
            <div class="card-section-header">
              <div class="services-icon-wrap" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div>
                <h3>Specialized Services &amp; Programs</h3>
                <p class="section-desc">
                  Clinical therapies, neurodevelopmental screening, and specialized departments.
                </p>
              </div>
            </div>

            <div class="service-tags-wrap">
              @for (tag of getServiceTags(h.services); track tag) {
                <span class="service-tag-pill">{{ tag }}</span>
              }
            </div>

            <p class="services-content">{{ h.services }}</p>
          </ac-ui-card>
        </div>
      } @else {
        <!-- EDIT MODE -->
        <ac-ui-card>
          <form [formGroup]="form" (ngSubmit)="saveProfile()" acAccessibleForm novalidate>
            @if (formError(); as fErr) {
              <div class="form-error-block">
                <ac-ui-message tone="error">{{ fErr }}</ac-ui-message>
              </div>
            }

            <fieldset class="form-fieldset">
              <legend>Institution Information</legend>

              <ac-ui-field
                label="Hospital name"
                [required]="true"
                [error]="showError('name') ? 'Hospital name is required.' : null"
              >
                <input
                  type="text"
                  formControlName="name"
                  placeholder="e.g. National Pediatric Hospital"
                />
              </ac-ui-field>

              <div class="two-col">
                <ac-ui-field
                  label="City / Province"
                  [required]="true"
                  [error]="showError('city') ? 'City is required.' : null"
                >
                  <input type="text" formControlName="city" placeholder="e.g. Phnom Penh" />
                </ac-ui-field>

                <ac-ui-field
                  label="Contact & Emergency phone"
                  [optional]="true"
                  hint="Emergency triage desk or main intake phone."
                  [error]="showError('phone') ? 'Invalid phone format.' : null"
                >
                  <input type="tel" formControlName="phone" placeholder="e.g. +855 23 888 999" />
                </ac-ui-field>
              </div>

              <ac-ui-field
                label="Address"
                [required]="true"
                [error]="showError('address') ? 'Street address is required.' : null"
              >
                <input
                  type="text"
                  formControlName="address"
                  placeholder="e.g. 100 Russian Confederation Blvd"
                />
              </ac-ui-field>

              <ac-ui-field
                label="Description"
                [optional]="true"
                hint="A brief summary for parents discovering your hospital."
              >
                <textarea
                  rows="3"
                  formControlName="description"
                  placeholder="Share your clinic's mission, facilities, or intake procedure..."
                ></textarea>
              </ac-ui-field>

              <ac-ui-field
                label="Services & Specialties"
                [required]="true"
                hint="List specialties separated by commas."
                [error]="showError('services') ? 'Services list is required.' : null"
              >
                <textarea
                  rows="4"
                  formControlName="services"
                  placeholder="e.g. Developmental Pediatrics, Occupational Therapy, Sensory Integration, Child Psychology"
                ></textarea>
              </ac-ui-field>

              <!-- Quick department chips to click and append -->
              <div class="quick-services-block">
                <span class="quick-services-label">Quick Add Department:</span>
                <div class="quick-chips">
                  @for (chip of commonDepartments; track chip) {
                    <button type="button" class="quick-chip-btn" (click)="appendServiceTag(chip)">
                      + {{ chip }}
                    </button>
                  }
                </div>
              </div>
            </fieldset>

            <div class="form-actions">
              <button
                type="button"
                class="btn-secondary"
                (click)="cancelEditing()"
                [disabled]="submitting()"
              >
                Cancel
              </button>
              <button type="submit" class="btn-primary" [disabled]="submitting()">
                {{ submitting() ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </ac-ui-card>
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

      .breadcrumbs {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }
      .breadcrumbs a {
        color: var(--ac-color-text-muted);
        text-decoration: none;
      }
      .breadcrumbs a:hover {
        color: var(--ac-color-action);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        gap: 16px;
        flex-wrap: wrap;
      }
      .eyebrow {
        margin: 0 0 4px;
        font-size: var(--ac-type-meta);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ac-color-action);
        font-weight: 700;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 26px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
      }
      .subtitle {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: 14.5px;
        max-width: 620px;
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
      .btn-primary:hover {
        background: var(--ac-color-action);
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .btn-secondary {
        padding: 9px 20px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-secondary:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .save-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        border-radius: var(--ac-radius-md);
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 600;
      }
      .save-banner.ok {
        background: var(--ac-color-green-50);
        border: 1px solid var(--ac-color-green-100);
        color: var(--ac-color-green-700);
      }
      .save-icon {
        font-size: 16px;
        font-weight: 800;
      }

      .profile-layout {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* ── Overview Card ───────────────────────────────────────── */
      .overview-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--ac-color-border-slate);
        margin-bottom: 20px;
      }
      .badge-icon {
        width: 52px;
        height: 52px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-info);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }

      .identity-name-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .overview-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
      }

      .verified-partner-pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-50);
        border: 1px solid var(--ac-color-green-500);
        color: var(--ac-color-green-700);
        font-size: 11px;
        font-weight: 700;
      }

      .location-line {
        margin: 4px 0 0;
        font-size: 13.5px;
        color: var(--ac-color-text-muted);
      }

      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin: 0;
      }

      .detail-item dt {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
        margin-bottom: 4px;
      }
      .detail-item dd {
        margin: 0;
        font-size: 14.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      /* ── Emergency Card ──────────────────────────────────────── */
      .card-section-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
      }

      .emergency-icon-wrap {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-800);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .services-icon-wrap {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .card-section-header h3 {
        margin: 0 0 2px;
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .section-desc {
        margin: 0;
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }

      .emergency-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin: 0;
        padding-top: 14px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .helpline-value {
        color: var(--ac-color-action);
        font-weight: 700;
      }

      /* ── Services Tags ───────────────────────────────────────── */
      .service-tags-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        padding-top: 14px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .service-tag-pill {
        display: inline-block;
        padding: 5px 12px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action);
        font-size: 12.5px;
        font-weight: 600;
      }

      .services-content {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.55;
        color: var(--ac-color-text-body);
      }

      /* ── Edit Form ───────────────────────────────────────────── */
      .form-fieldset {
        border: 0;
        padding: 0;
        margin: 0 0 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-fieldset legend {
        font-size: 16px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
        margin-bottom: 16px;
      }

      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .form-error-block {
        margin-bottom: 16px;
      }

      .quick-services-block {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .quick-services-label {
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .quick-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .quick-chip-btn {
        padding: 4px 10px;
        border: 1px dashed var(--ac-color-tint-steel);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-action);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 140ms ease;
      }
      .quick-chip-btn:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      @media (max-width: 640px) {
        .two-col {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(HospitalManagementApi);

  readonly hospital = signal<HospitalResponse | null>(null);
  readonly staff = signal<HospitalStaffMember | null>(null);
  readonly phone = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly mode = signal<'view' | 'edit'>('view');
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly savedFlash = signal(false);

  readonly commonDepartments = [
    'Developmental Pediatrics',
    'Pediatric Neurology',
    'Speech & Language Therapy',
    'Occupational Therapy',
    'Sensory Integration Clinic',
    'Child Psychology & Behavior',
    'Autism Clinical Assessment',
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.pattern(/^\+?[\d\s-]{6,20}$/)]],
    address: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['', [Validators.maxLength(2000)]],
    services: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.me().subscribe({
      next: (data) => {
        this.hospital.set(data.hospital);
        this.staff.set(data.staff ?? null);
        const contactPhone = data.staff?.phone || data.staff?.phoneNumber || null;
        this.phone.set(contactPhone);
        this.form.patchValue({
          name: data.hospital.name,
          city: data.hospital.city,
          phone: contactPhone || '',
          address: data.hospital.address,
          description: '',
          services: data.hospital.services,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load hospital profile. Please refresh.');
        this.loading.set(false);
      },
    });
  }

  getServiceTags(services: string): string[] {
    if (!services) return [];
    return services
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => Boolean(s) && s.length > 1);
  }

  appendServiceTag(tag: string): void {
    const current = this.form.get('services')?.value || '';
    if (current.includes(tag)) return;
    const next = current.trim() ? `${current.trim()}, ${tag}` : tag;
    this.form.patchValue({ services: next });
    this.form.get('services')?.markAsDirty();
  }

  startEditing(): void {
    this.savedFlash.set(false);
    this.formError.set(null);
    this.mode.set('edit');
  }

  cancelEditing(): void {
    this.formError.set(null);
    const h = this.hospital();
    if (h) {
      this.form.patchValue({
        name: h.name,
        city: h.city,
        phone: this.phone() || '',
        address: h.address,
        services: h.services,
      });
    }
    this.mode.set('view');
  }

  showError(field: 'name' | 'city' | 'phone' | 'address' | 'services'): boolean {
    const control = this.form.get(field);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Please check the form for errors before saving.');
      return;
    }

    this.submitting.set(true);
    this.formError.set(null);

    const raw = this.form.value;
    const payload = {
      name: raw.name?.trim(),
      city: raw.city?.trim(),
      phone: raw.phone?.trim() || null,
      address: raw.address?.trim(),
      description: raw.description?.trim() || null,
      services: raw.services?.trim(),
    };

    this.api.updateProfile(payload).subscribe({
      next: (data) => {
        this.hospital.set(data.hospital);
        this.staff.set(data.staff ?? null);
        this.phone.set(payload.phone);
        this.submitting.set(false);
        this.mode.set('view');
        this.savedFlash.set(true);
      },
      error: () => {
        this.formError.set('Could not save hospital profile. Please try again.');
        this.submitting.set(false);
      },
    });
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
