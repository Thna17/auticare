import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type {
  SchoolAvailabilityStatus,
  SchoolDetailResponse,
  UpdateSchoolProfileRequest,
  EnrollmentStatsResponse,
} from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';
import { SchoolProfileViewComponent } from './components/school-profile-view.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

const availabilityOptions: readonly { value: SchoolAvailabilityStatus; label: string }[] = [
  { value: 'IMMEDIATE', label: 'Immediate Openings' },
  { value: 'WAITLIST', label: 'Waitlist Available' },
  { value: 'CLOSED', label: 'Enrollment Closed' },
];

const PRESET_PROGRAMS: readonly string[] = [
  'ABA Therapy',
  'Speech & Language Therapy',
  'Occupational Therapy',
  'Sensory Integration',
  'Social Skills Groups',
  'Music Therapy',
  'Life Skills Training',
  'Behavioral Intervention',
  'Physical Therapy',
  'Early Intervention',
  'Adaptive Physical Education',
  'Vocational Readiness',
];

const PRESET_FACILITIES: readonly string[] = [
  'Sensory Room',
  'Adaptive Playground',
  'Quiet Calming Zone',
  'Speech Therapy Lab',
  'Occupational Therapy Gym',
  'Hydrotherapy Pool',
  'Music Therapy Studio',
  'Assistive Tech Station',
  'Gross Motor Arena',
  'Observation Suites',
  'Therapeutic Garden',
];

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiCardComponent,
    SchoolTopbarComponent,
    SchoolProfileViewComponent,
    UiMessageComponent,
    UiFieldComponent,
    AccessibleFormDirective,
    UiSpinnerComponent,
  ],
  template: `
    <ac-school-topbar />

    <section class="page-header">
      <div class="header-titles">
        <div class="header-badge-row">
          <span class="header-badge">School Institution Workspace</span>
          <span class="header-badge-sub">Institutional Management</span>
        </div>
        <h1>School Profile & Institutional Hub</h1>
        <p>
          Maintain your clinical profile, specialized programs, student capacity, and therapeutic
          facilities.
        </p>
      </div>
      <div class="header-actions">
        @if (mode() === 'view') {
          <button type="button" class="btn-primary" (click)="startEditing()">
            ✏️ Edit Profile
          </button>
        } @else {
          <button type="button" class="btn-secondary-head" (click)="cancelEditing()">
            ✕ Cancel Edits
          </button>
        }
      </div>
    </section>

    @if (loading()) {
      <ac-ui-card><ac-ui-spinner label="Loading school profile…" /></ac-ui-card>
    } @else if (loadError()) {
      <ac-ui-message tone="error">{{ loadError() }}</ac-ui-message>
    } @else if (school(); as current) {
      @if (mode() === 'view') {
        @if (savedFlash()) {
          <div class="save-banner ok" role="status" aria-live="polite">
            <span class="save-icon" aria-hidden="true">✓</span>
            <span>Profile saved successfully — your institutional details are now live.</span>
          </div>
        }

        <!-- Institutional Overview & Capacity Card -->
        <div class="institutional-overview-card">
          <div class="overview-header">
            <div class="overview-title-block">
              <span class="overview-badge">Institutional Operations Dossier</span>
              <h2>Institutional Overview &amp; Campus Capacity</h2>
            </div>
            <div
              class="overview-status-pill"
              [class.immediate]="current.availabilityStatus === 'IMMEDIATE'"
              [class.waitlist]="current.availabilityStatus === 'WAITLIST'"
              [class.closed]="current.availabilityStatus === 'CLOSED'"
            >
              <span class="status-dot"></span>
              <span>{{
                current.availabilityStatus === 'IMMEDIATE'
                  ? 'Immediate Openings'
                  : current.availabilityStatus === 'WAITLIST'
                    ? 'Waitlist Available'
                    : 'Enrollment Closed'
              }}</span>
            </div>
          </div>

          <!-- Key Metrics Grid -->
          <div class="overview-metrics-grid">
            <div class="metric-card">
              <span class="metric-icon">👥</span>
              <div class="metric-data">
                <span class="metric-label">Enrolled Student Capacity</span>
                <span class="metric-val">{{ enrollmentStats()?.totalStudents ?? 0 }} Students</span>
                <span class="metric-sub">Active program rosters</span>
              </div>
            </div>

            <div class="metric-card">
              <span class="metric-icon">⚖️</span>
              <div class="metric-data">
                <span class="metric-label">Student-to-Teacher Ratio</span>
                <span class="metric-val ratio-val">{{
                  current.studentTeacherRatio || '4:1 Ratio'
                }}</span>
                <span class="metric-sub">Individualized attention</span>
              </div>
            </div>

            <div class="metric-card">
              <span class="metric-icon">🧩</span>
              <div class="metric-data">
                <span class="metric-label">Specialized Programs</span>
                <span class="metric-val"
                  >{{
                    enrollmentStats()?.activePrograms ?? current.specializations.length
                  }}
                  Offerings</span
                >
                <span class="metric-sub">Evidence-based therapies</span>
              </div>
            </div>

            <div class="metric-card">
              <span class="metric-icon">📈</span>
              <div class="metric-data">
                <span class="metric-label">Therapy Participation</span>
                <span class="metric-val">{{ enrollmentStats()?.participationRate ?? 85 }}%</span>
                <span class="metric-sub">Student engagement rate</span>
              </div>
            </div>
          </div>

          <!-- Interactive Specialized Facilities Tag Manager -->
          <div class="facilities-manager-section">
            <div class="facilities-header-row">
              <div class="facilities-title">
                <span class="facilities-icon">🏛️</span>
                <h3>Specialized Facilities &amp; Therapeutic Amenities</h3>
              </div>
              <span class="facilities-count-pill"
                >{{ activeFacilities().length }} Active Amenities</span
              >
            </div>
            <p class="facilities-hint">
              Manage specialized therapy spaces and sensory facilities displayed to prospective
              families and clinical partners:
            </p>

            <!-- Active Tags List -->
            <div class="active-facilities-tags" aria-label="Active facilities list">
              @if (activeFacilities().length === 0) {
                <span class="no-tags-notice"
                  >No specialized facilities tagged yet. Click presets below to add.</span
                >
              } @else {
                @for (facility of activeFacilities(); track facility; let i = $index) {
                  <span class="facility-tag-chip">
                    <span class="facility-chip-icon">🏛️</span>
                    <span class="facility-chip-text">{{ facility }}</span>
                    <button
                      type="button"
                      class="facility-chip-del"
                      (click)="quickRemoveFacility(i)"
                      [attr.aria-label]="'Remove ' + facility"
                      title="Remove facility"
                    >
                      ✕
                    </button>
                  </span>
                }
              }
            </div>

            <!-- Quick Preset Adder -->
            <div class="quick-preset-container">
              <span class="preset-label">Quick-add facility:</span>
              <div class="preset-pills-row">
                @for (preset of presetFacilities; track preset) {
                  @if (!isFacilityActive(preset)) {
                    <button
                      type="button"
                      class="pill-preset-quick"
                      (click)="quickAddFacility(preset)"
                    >
                      + {{ preset }}
                    </button>
                  }
                }
              </div>
            </div>

            <!-- Custom Tag Input -->
            <div class="custom-facility-input-row">
              <input
                type="text"
                class="facility-input-field"
                placeholder="Add custom specialized facility (e.g. Snoezelen Multi-Sensory Room)…"
                [value]="customFacilityInput()"
                (input)="customFacilityInput.set($any($event.target).value)"
                (keydown.enter)="$event.preventDefault(); quickAddCustomFacility()"
              />
              <button
                type="button"
                class="btn-add-facility-quick"
                (click)="quickAddCustomFacility()"
              >
                + Add Facility
              </button>
            </div>
          </div>
        </div>

        <ac-school-profile-view [school]="current" [editable]="true" (edit)="startEditing()" />
      } @else {
        @if (!hasProfileContent(current)) {
          <div class="prompt" role="note">
            👋 Welcome! Complete your school's institutional profile so families and clinical
            coordinators can connect.
          </div>
        }

        <!-- Institutional Capacity Overview Banner -->
        @if (enrollmentStats(); as stats) {
          <div class="capacity-banner">
            <div class="capacity-metric">
              <span class="cap-label">Total Enrolled</span>
              <span class="cap-val">{{ stats.totalStudents }} Students</span>
            </div>
            <div class="capacity-metric">
              <span class="cap-label">Active Programs</span>
              <span class="cap-val">{{ stats.activePrograms }} Programs</span>
            </div>
            <div class="capacity-metric">
              <span class="cap-label">Participation Rate</span>
              <span class="cap-val">{{ stats.participationRate }}%</span>
            </div>
            <div class="capacity-metric">
              <span class="cap-label">Review Attention</span>
              <span class="cap-val warning">{{ stats.needsAttention }} Required</span>
            </div>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
          <!-- BASIC INSTITUTIONAL INFO -->
          <fieldset>
            <legend>🏫 1. Basic Institutional Details</legend>
            <ac-ui-field
              label="School / Center name"
              [required]="true"
              [error]="showError('name') ? 'School name is required.' : null"
            >
              <input
                type="text"
                formControlName="name"
                placeholder="e.g. Horizon Autism Development Center"
              />
            </ac-ui-field>
            <ac-ui-field label="Institutional bio & mission" [optional]="true">
              <textarea
                rows="4"
                formControlName="description"
                placeholder="Describe your school's mission, therapeutic philosophy, and learning environment..."
              ></textarea>
            </ac-ui-field>
            <div class="grid-2-col">
              <ac-ui-field label="Logo image URL" [optional]="true">
                <input type="url" formControlName="logoUrl" placeholder="https://…" />
              </ac-ui-field>
              <ac-ui-field label="Cover banner image URL" [optional]="true">
                <input type="url" formControlName="coverImageUrl" placeholder="https://…" />
              </ac-ui-field>
            </div>
            @if (form.controls.logoUrl.value || form.controls.coverImageUrl.value) {
              <div class="previews" aria-label="Image previews">
                @if (form.controls.logoUrl.value) {
                  <figure>
                    <figcaption>Logo Preview</figcaption>
                    <img [src]="form.controls.logoUrl.value" alt="Logo preview" />
                  </figure>
                }
                @if (form.controls.coverImageUrl.value) {
                  <figure>
                    <figcaption>Cover Banner Preview</figcaption>
                    <img [src]="form.controls.coverImageUrl.value" alt="Cover preview" />
                  </figure>
                }
              </div>
            }
          </fieldset>

          <!-- PROGRAMS & CLINICAL SPECIALIZATIONS -->
          <fieldset>
            <legend>🧩 2. Programs & Specialized Therapies</legend>
            <p class="hint">
              Select all therapeutic modalities and special education programs your school offers:
            </p>
            <div class="pills" role="group" aria-label="Specialized programs">
              @for (option of allSpecializations(); track option) {
                <button
                  type="button"
                  class="pill"
                  [class.active]="isSpecializationSelected(option)"
                  [attr.aria-pressed]="isSpecializationSelected(option)"
                  (click)="toggleSpecialization(option)"
                >
                  <span class="pill-check">{{ isSpecializationSelected(option) ? '✓' : '+' }}</span>
                  <span>{{ option }}</span>
                </button>
              }
            </div>

            <!-- Custom program tag input -->
            <div class="custom-tag-row">
              <input
                type="text"
                class="tag-input"
                placeholder="Add custom program or therapy…"
                [value]="customProgramInput()"
                (input)="customProgramInput.set($any($event.target).value)"
                (keydown.enter)="$event.preventDefault(); addCustomProgram()"
              />
              <button type="button" class="btn-add-tag" (click)="addCustomProgram()">
                + Add Program
              </button>
            </div>
          </fieldset>

          <!-- STUDENT CAPACITY & ADMISSIONS -->
          <fieldset>
            <legend>👥 3. Student Capacity & Enrollment Dynamics</legend>
            <div class="grid-2-col">
              <ac-ui-field label="Student-to-teacher ratio & capacity" [optional]="true">
                <input
                  type="text"
                  formControlName="studentTeacherRatio"
                  placeholder="e.g. 4:1 Ratio · Max 30 Students"
                />
              </ac-ui-field>
              <ac-ui-field label="Admissions availability status">
                <select formControlName="availabilityStatus">
                  @for (option of availabilityOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </ac-ui-field>
            </div>

            @if (form.controls.availabilityStatus.value === 'WAITLIST') {
              <ac-ui-field label="Estimated waitlist timeframe" [optional]="true">
                <input
                  type="text"
                  formControlName="waitlistEstimate"
                  placeholder="e.g. ~2 to 3 months"
                />
              </ac-ui-field>
            }

            <ac-ui-field label="Admission requirements & eligibility" [optional]="true">
              <textarea
                rows="4"
                formControlName="admissionRequirements"
                placeholder="Specify prerequisites, required clinical assessments, age ranges, and documents needed for enrollment..."
              ></textarea>
            </ac-ui-field>
          </fieldset>

          <!-- FACILITIES & AMENITIES TAGS -->
          <fieldset>
            <legend>🏛️ 4. Facilities & Therapeutic Amenities</legend>
            <p class="hint">Active facilities tags on your profile:</p>

            <div class="facility-tags-list" aria-label="Active facilities">
              @if (activeFacilities().length === 0) {
                <span class="no-tags-hint"
                  >No facilities added yet. Click preset chips below to add.</span
                >
              } @else {
                @for (facility of activeFacilities(); track facility; let i = $index) {
                  <span class="facility-chip">
                    <span>{{ facility }}</span>
                    <button
                      type="button"
                      class="facility-chip-remove"
                      (click)="removeFacility(i)"
                      aria-label="Remove facility"
                    >
                      ✕
                    </button>
                  </span>
                }
              }
            </div>

            <p class="hint">Quick-add preset facility amenities:</p>
            <div class="pills preset-chips">
              @for (preset of presetFacilities; track preset) {
                <button
                  type="button"
                  class="pill-preset"
                  [disabled]="isFacilityActive(preset)"
                  (click)="addFacility(preset)"
                >
                  + {{ preset }}
                </button>
              }
            </div>

            <!-- Custom facility tag input -->
            <div class="custom-tag-row">
              <input
                type="text"
                class="tag-input"
                placeholder="Add custom facility (e.g. Sensory Snoezelen Room)…"
                [value]="customFacilityInput()"
                (input)="customFacilityInput.set($any($event.target).value)"
                (keydown.enter)="$event.preventDefault(); addCustomFacility()"
              />
              <button type="button" class="btn-add-tag" (click)="addCustomFacility()">
                + Add Facility
              </button>
            </div>
          </fieldset>

          <!-- LOCATION & CONTACT -->
          <fieldset>
            <legend>📍 5. Location & Contact Details</legend>
            <div class="grid-2-col">
              <ac-ui-field
                label="City / Province"
                [required]="true"
                [error]="showError('city') ? 'City is required.' : null"
              >
                <input type="text" formControlName="city" placeholder="e.g. Jakarta Selatan" />
              </ac-ui-field>
              <ac-ui-field
                label="Physical street address"
                [required]="true"
                [error]="showError('address') ? 'Address is required.' : null"
              >
                <input
                  type="text"
                  formControlName="address"
                  placeholder="e.g. Jl. Kemang Raya No. 12"
                />
              </ac-ui-field>
            </div>

            <div class="grid-2-col">
              <ac-ui-field
                label="Admissions email"
                [optional]="true"
                [error]="showError('email') ? 'Enter a valid email address.' : null"
              >
                <input type="email" formControlName="email" placeholder="admissions@school.org" />
              </ac-ui-field>
              <ac-ui-field label="Official website" [optional]="true">
                <input type="url" formControlName="website" placeholder="https://www.school.org" />
              </ac-ui-field>
            </div>

            <ac-ui-field label="Operating hours & schedule" [optional]="true">
              <input
                type="text"
                formControlName="operatingHours"
                placeholder="e.g. Mon–Fri, 08:00 AM – 04:00 PM"
              />
            </ac-ui-field>
          </fieldset>

          <!-- READ-ONLY STATUS & ACCREDITATION -->
          <fieldset class="readonly">
            <legend>
              ⭐ 6. Platform Accreditation & Community Rating
              <span class="ro-badge">Platform Verified</span>
            </legend>
            <p class="hint">
              These metrics reflect verified parent evaluations and administrative compliance on
              AutiCare:
            </p>
            <div class="ro-grid">
              <div class="ro-field">
                <span class="ro-label">Parent Rating</span>
                <span class="ro-value">
                  @if (current.rating !== null) {
                    ★ {{ current.rating }} / 5 · {{ current.reviewCount }} review{{
                      current.reviewCount === 1 ? '' : 's'
                    }}
                  } @else {
                    No reviews submitted yet
                  }
                </span>
              </div>
              <div class="ro-field">
                <span class="ro-label">Institutional Verification</span>
                <span class="ro-value">
                  <span class="verify-badge" [class.verified]="current.isVerified">
                    {{
                      current.isVerified
                        ? '✓ Verified Partner Institution'
                        : 'Verification In Progress'
                    }}
                  </span>
                </span>
              </div>
            </div>
          </fieldset>

          @if (error()) {
            <div class="save-banner bad" role="alert" aria-live="assertive">
              <span>{{ error() }}</span>
            </div>
          }

          <div class="form-actions">
            <button type="submit" class="btn-submit" [disabled]="saving()">
              {{ saving() ? 'Saving Profile…' : 'Save Institutional Profile' }}
            </button>
            @if (hasProfileContent(current)) {
              <button
                type="button"
                class="cancel-btn"
                [disabled]="saving()"
                (click)="cancelEditing()"
              >
                Cancel
              </button>
            }
          </div>
        </form>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        gap: 16px;
        flex-wrap: wrap;
      }
      .header-titles {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .header-badge-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      .header-badge {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--ac-color-tint-blue-wash);
        color: var(--ac-color-action-alt);
        padding: 2px 8px;
        border-radius: 6px;
        border: 1px solid var(--ac-color-border-info);
      }
      .header-badge-sub {
        font-size: 11px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
      }
      h1 {
        margin: 0;
        font-size: var(--ac-type-page-title);
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
        letter-spacing: -0.02em;
      }
      .page-header p {
        margin: 2px 0 0;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }
      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: 10px;
        font-weight: 700;
        font-size: 13.5px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .btn-primary:hover {
        background: var(--ac-color-ink-a);
      }
      .btn-secondary-head {
        padding: 10px 16px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        color: var(--ac-color-text-slate-strong);
        font-weight: 600;
        font-size: 13.5px;
        cursor: pointer;
      }

      /* Institutional Overview Card */
      .institutional-overview-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: var(--ac-shadow-sm);
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .overview-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
      }

      .overview-badge {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--ac-color-tint-blue-wash);
        color: var(--ac-color-action-alt);
        padding: 2px 8px;
        border-radius: 6px;
        border: 1px solid var(--ac-color-border-info);
        display: inline-block;
        margin-bottom: 6px;
      }

      .overview-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
      }

      .overview-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12.5px;
        font-weight: 700;
      }

      .overview-status-pill.immediate {
        background: var(--ac-color-green-100);
        color: var(--ac-color-emerald-600);
      }

      .overview-status-pill.waitlist {
        background: var(--ac-color-amber-tint-100);
        color: var(--ac-color-amber-600);
      }

      .overview-status-pill.closed {
        background: var(--ac-color-red-tint-soft);
        color: var(--ac-color-alert-strong);
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .overview-metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
      }

      .metric-card {
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        padding: 14px 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .metric-icon {
        font-size: 20px;
        line-height: 1;
        padding-top: 2px;
      }

      .metric-data {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .metric-label {
        font-size: 11.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .metric-val {
        font-size: 18px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
      }

      .metric-sub {
        font-size: 11.5px;
        color: var(--ac-color-text-slate);
      }

      /* Facilities Manager Section */
      .facilities-manager-section {
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .facilities-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .facilities-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .facilities-title h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .facilities-count-pill {
        font-size: 11.5px;
        font-weight: 700;
        padding: 3px 10px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 999px;
        color: var(--ac-color-action-alt);
      }

      .facilities-hint {
        margin: 0;
        font-size: 13px;
        color: var(--ac-color-text-slate);
        line-height: 1.5;
      }

      .active-facilities-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .facility-tag-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 999px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
        box-shadow: var(--ac-shadow-xs);
      }

      .facility-chip-del {
        background: none;
        border: none;
        color: var(--ac-color-text-slate);
        font-size: 12px;
        cursor: pointer;
        padding: 0 2px;
        line-height: 1;
        transition: color 0.15s;
      }

      .facility-chip-del:hover {
        color: var(--ac-color-alert-strong);
      }

      .quick-preset-container {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .preset-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
      }

      .preset-pills-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .pill-preset-quick {
        padding: 4px 10px;
        background: var(--ac-color-surface);
        border: 1px dashed var(--ac-color-border-slate);
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
        cursor: pointer;
        transition: all 0.15s;
      }

      .pill-preset-quick:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
        color: var(--ac-color-action-alt);
      }

      .custom-facility-input-row {
        display: flex;
        gap: 8px;
      }

      .facility-input-field {
        flex: 1;
        padding: 8px 14px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 13px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
        outline: none;
      }

      .facility-input-field:focus {
        border-color: var(--ac-color-action-alt);
      }

      .btn-add-facility-quick {
        padding: 8px 16px;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: 8px;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s;
      }

      .btn-add-facility-quick:hover {
        background: var(--ac-color-ink-a);
      }

      /* Capacity banner */
      .capacity-banner {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        padding: 16px 20px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        margin-bottom: 20px;
      }
      .capacity-metric {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .cap-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--ac-color-text-slate);
        letter-spacing: 0.04em;
      }
      .cap-val {
        font-size: 16px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
      }
      .cap-val.warning {
        color: var(--ac-color-alert-strong);
      }

      form {
        display: grid;
        gap: 22px;
      }
      fieldset {
        display: grid;
        gap: 16px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        padding: 22px;
        background: var(--ac-color-surface);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent);
      }
      legend {
        font-weight: 800;
        font-size: 15px;
        padding: 0 8px;
        color: var(--ac-color-text-slate-strong);
      }
      .grid-2-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      input,
      textarea,
      select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        padding: 10px 14px;
        font: inherit;
        font-size: 13.5px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
      }
      input:focus,
      textarea:focus,
      select:focus {
        border-color: var(--ac-color-action-alt);
        outline: none;
      }
      .hint {
        margin: 0;
        color: var(--ac-color-text-slate);
        font-size: 12.5px;
        font-weight: 500;
      }

      /* Programs / Specializations Pills */
      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .pill:hover:not(.active) {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
      }
      .pill.active {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
      }
      .pill-check {
        font-weight: 800;
      }

      /* Custom Tag Input Row */
      .custom-tag-row {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 8px;
      }
      .tag-input {
        max-width: 320px;
        padding: 8px 12px;
        font-size: 13px;
      }
      .btn-add-tag {
        padding: 8px 14px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-action-alt);
        color: var(--ac-color-action-alt);
        border-radius: 8px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-add-tag:hover {
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
      }

      /* Facilities tags */
      .facility-tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 14px;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        min-height: 44px;
        align-items: center;
      }
      .no-tags-hint {
        font-size: 12.5px;
        color: var(--ac-color-text-slate);
      }
      .facility-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: var(--ac-color-tint-blue-mist);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 6px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }
      .facility-chip-remove {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--ac-color-alert-strong);
        font-size: 12px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .preset-chips {
        margin-top: 6px;
      }
      .pill-preset {
        padding: 5px 12px;
        border-radius: 999px;
        border: 1px dashed var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        cursor: pointer;
        transition: all 0.15s;
      }
      .pill-preset:hover:not(:disabled) {
        border-color: var(--ac-color-action-alt);
        color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
      }
      .pill-preset:disabled {
        opacity: 0.4;
        cursor: default;
      }

      /* Previews */
      .previews {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
      .previews figure {
        margin: 0;
        display: grid;
        gap: 6px;
      }
      .previews figcaption {
        color: var(--ac-color-text-slate);
        font-size: 12px;
        font-weight: 600;
      }
      .previews img {
        width: 120px;
        height: 75px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--ac-color-border-slate);
      }

      /* Read-only status block */
      .readonly {
        background: var(--ac-color-tint-blue-wash);
        border-style: dashed;
      }
      .ro-badge {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ac-color-action-alt);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 999px;
        padding: 2px 8px;
        margin-left: 8px;
      }
      .ro-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .ro-field {
        display: grid;
        gap: 4px;
      }
      .ro-label {
        color: var(--ac-color-text-slate);
        font-size: 11.5px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .ro-value {
        color: var(--ac-color-text-slate-strong);
        font-weight: 600;
        font-size: 13.5px;
      }
      .verify-badge {
        display: inline-block;
        border-radius: 999px;
        padding: 3px 10px;
        font-weight: 700;
        font-size: 12px;
        background: var(--ac-color-slate-100);
        color: var(--ac-color-text-slate);
      }
      .verify-badge.verified {
        background: var(--ac-color-green-100);
        color: var(--ac-color-emerald-800);
      }

      /* Actions */
      .form-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .btn-submit {
        border: 0;
        border-radius: 10px;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        padding: 12px 24px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .btn-submit:hover:not(:disabled) {
        background: var(--ac-color-ink-a);
      }
      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .cancel-btn {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
        padding: 12px 20px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
      }

      .save-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 10px;
        padding: 14px 18px;
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 20px;
      }
      .save-banner.ok {
        background: var(--ac-color-green-50);
        color: var(--ac-color-emerald-800);
        border: 1px solid var(--ac-color-green-border-soft);
      }
      .save-banner.bad {
        background: var(--ac-color-red-50);
        color: var(--ac-color-alert-strong);
        border: 1px solid var(--ac-color-red-border);
      }
      .save-icon {
        font-size: 16px;
      }
      .prompt {
        margin-bottom: 20px;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 10px;
        padding: 14px 18px;
        color: var(--ac-color-text-slate-strong);
        font-weight: 600;
        font-size: 13.5px;
      }

      @media (max-width: 900px) {
        .overview-metrics-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 640px) {
        .overview-metrics-grid {
          grid-template-columns: 1fr;
        }
        .grid-2-col {
          grid-template-columns: 1fr;
        }
        .capacity-banner {
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolProfilePage implements OnInit {
  private readonly api = inject(SchoolsApi);
  private readonly fb = inject(FormBuilder);
  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly availabilityOptions = availabilityOptions;
  protected readonly presetFacilities = PRESET_FACILITIES;

  readonly school = signal<SchoolDetailResponse | null>(null);
  readonly enrollmentStats = signal<EnrollmentStatsResponse | null>(null);
  readonly specializations = signal<readonly string[]>([]);
  readonly activeFacilities = signal<string[]>([]);
  readonly customFacilityInput = signal('');
  readonly customProgramInput = signal('');

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mode = signal<'view' | 'edit'>('edit');
  readonly savedFlash = signal(false);

  readonly allSpecializations = computed(() => {
    const selected = this.specializations();
    const extras = selected.filter((item) => !PRESET_PROGRAMS.includes(item));
    return [...PRESET_PROGRAMS, ...extras];
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.maxLength(2000)]],
    logoUrl: ['', [Validators.maxLength(1000)]],
    coverImageUrl: ['', [Validators.maxLength(1000)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    address: ['', [Validators.required, Validators.maxLength(300)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    website: ['', [Validators.maxLength(500)]],
    studentTeacherRatio: ['', [Validators.maxLength(40)]],
    availabilityStatus: ['IMMEDIATE' as SchoolAvailabilityStatus],
    waitlistEstimate: ['', [Validators.maxLength(120)]],
    admissionRequirements: ['', [Validators.maxLength(4000)]],
    operatingHours: ['', [Validators.maxLength(200)]],
  });

  ngOnInit() {
    this.api.getMySchool().subscribe({
      next: (school) => {
        this.hydrate(school);
        this.mode.set(this.hasProfileContent(school) ? 'view' : 'edit');
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Your school profile could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });

    // Also load live enrollment/capacity stats for the overview banner
    this.api.getEnrollmentStats().subscribe({
      next: (stats) => this.enrollmentStats.set(stats),
      error: () => undefined,
    });
  }

  hasProfileContent(school: SchoolDetailResponse): boolean {
    return Boolean(
      school.description?.trim() ||
      school.email?.trim() ||
      school.website?.trim() ||
      school.studentTeacherRatio?.trim() ||
      school.operatingHours?.trim() ||
      school.admissionRequirements?.trim() ||
      school.specializations.length ||
      school.facilities.length,
    );
  }

  startEditing() {
    const school = this.school();
    if (school) this.hydrate(school);
    this.error.set(null);
    this.savedFlash.set(false);
    this.mode.set('edit');
  }

  cancelEditing() {
    const school = this.school();
    if (school) this.hydrate(school);
    this.error.set(null);
    this.mode.set('view');
  }

  // ── Facility Tag Management ────────────────────────────────────────

  isFacilityActive(facility: string): boolean {
    return this.activeFacilities().some((f) => f.toLowerCase() === facility.toLowerCase());
  }

  addFacility(facility: string) {
    const trimmed = facility.trim();
    if (!trimmed || this.isFacilityActive(trimmed)) return;
    this.activeFacilities.update((list) => [...list, trimmed]);
  }

  removeFacility(index: number) {
    this.activeFacilities.update((list) => list.filter((_, i) => i !== index));
  }

  addCustomFacility() {
    const val = this.customFacilityInput().trim();
    if (val) {
      this.addFacility(val);
      this.customFacilityInput.set('');
    }
  }

  quickAddFacility(facility: string) {
    const trimmed = facility.trim();
    if (!trimmed || this.isFacilityActive(trimmed)) return;
    const updated = [...this.activeFacilities(), trimmed];
    this.activeFacilities.set(updated);
    this.api.updateMySchool({ facilities: updated }).subscribe({
      next: (school) => {
        this.school.set(school);
        this.flashSaved();
      },
      error: () => undefined,
    });
  }

  quickRemoveFacility(index: number) {
    const updated = this.activeFacilities().filter((_, i) => i !== index);
    this.activeFacilities.set(updated);
    this.api.updateMySchool({ facilities: updated }).subscribe({
      next: (school) => {
        this.school.set(school);
        this.flashSaved();
      },
      error: () => undefined,
    });
  }

  quickAddCustomFacility() {
    const val = this.customFacilityInput().trim();
    if (!val) return;
    this.quickAddFacility(val);
    this.customFacilityInput.set('');
  }

  private flashSaved() {
    this.savedFlash.set(true);
    setTimeout(() => this.savedFlash.set(false), 3000);
  }

  // ── Program Management ─────────────────────────────────────────────

  toggleSpecialization(name: string) {
    this.specializations.update((list) =>
      list.includes(name) ? list.filter((item) => item !== name) : [...list, name],
    );
  }

  isSpecializationSelected(name: string): boolean {
    return this.specializations().includes(name);
  }

  addCustomProgram() {
    const val = this.customProgramInput().trim();
    if (val && !this.specializations().includes(val)) {
      this.specializations.update((list) => [...list, val]);
      this.customProgramInput.set('');
    }
  }

  submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fix the highlighted fields before saving.');
      return;
    }

    const value = this.form.getRawValue();
    const availabilityStatus = value.availabilityStatus;

    const payload: UpdateSchoolProfileRequest = {
      name: value.name.trim(),
      city: value.city.trim(),
      address: value.address.trim(),
      description: value.description.trim() || null,
      email: value.email.trim() || null,
      website: value.website.trim() || null,
      logoUrl: value.logoUrl.trim() || null,
      coverImageUrl: value.coverImageUrl.trim() || null,
      studentTeacherRatio: value.studentTeacherRatio.trim() || null,
      availabilityStatus,
      waitlistEstimate:
        availabilityStatus === 'WAITLIST' ? value.waitlistEstimate.trim() || null : null,
      admissionRequirements: value.admissionRequirements.trim() || null,
      operatingHours: value.operatingHours.trim() || null,
      facilities: [...this.activeFacilities()],
      specializations: [...this.specializations()],
    };

    this.saving.set(true);
    this.api.updateMySchool(payload).subscribe({
      next: (school) => {
        this.saving.set(false);
        try {
          this.hydrate(school);
        } catch {
          // ignore
        }
        this.mode.set('view');
        this.savedFlash.set(true);
        this.revealFeedback();
      },
      error: () => {
        this.saving.set(false);
        this.error.set(
          'Your profile could not be saved. Check that website and image URLs start with https:// and try again.',
        );
        this.revealFeedback();
      },
    });
  }

  private revealFeedback() {
    setTimeout(() => {
      this.el.nativeElement
        .querySelector('.save-banner')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  protected showError(path: string) {
    const control = this.form.get(path);
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }

  private hydrate(school: SchoolDetailResponse) {
    this.school.set(school);
    this.specializations.set([...school.specializations]);
    this.activeFacilities.set([...school.facilities]);
    this.form.reset({
      name: school.name,
      description: school.description ?? '',
      logoUrl: school.logoUrl ?? '',
      coverImageUrl: school.coverImageUrl ?? '',
      city: school.city,
      address: school.address,
      email: school.email ?? '',
      website: school.website ?? '',
      studentTeacherRatio: school.studentTeacherRatio ?? '',
      availabilityStatus: school.availabilityStatus,
      waitlistEstimate: school.waitlistEstimate ?? '',
      admissionRequirements: school.admissionRequirements ?? '',
      operatingHours: school.operatingHours ?? '',
    });
  }
}
