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
} from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';
import { SchoolProfileViewComponent } from './components/school-profile-view.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';

// Defined locally (not imported from @auticare/contracts as a runtime value) so the
// web bundle keeps contracts a type-only dependency and never pulls zod client-side.
const availabilityOptions: readonly { value: SchoolAvailabilityStatus; label: string }[] = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'WAITLIST', label: 'Waitlist' },
  { value: 'CLOSED', label: 'Closed' },
];

const specializationOptions: readonly string[] = [
  'ABA',
  'Speech Therapy',
  'Occupational Therapy',
  'Sensory Integration',
  'Social Skills',
  'Music Therapy',
  'Life Skills',
  'Behavioral Therapy',
  'Physical Therapy',
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
  ],
  template: `
    <ac-school-topbar />

    <section class="page-header">
      <p class="eyebrow">School workspace</p>
      <h1>School profile</h1>
      <p>Keep your public profile up to date so families can find and choose your school.</p>
    </section>

    @if (loading()) {
      <ac-ui-card><p>Loading profile...</p></ac-ui-card>
    } @else if (loadError()) {
      <ac-ui-message tone="error">{{ loadError() }}</ac-ui-message>
    } @else if (school(); as current) {
      @if (mode() === 'view') {
        @if (savedFlash()) {
          <div class="save-banner ok" role="status" aria-live="polite">
            <span class="save-icon" aria-hidden="true">✓</span>
            <span>Profile saved — your public profile is now up to date.</span>
          </div>
        }
        <ac-school-profile-view [school]="current" [editable]="true" (edit)="startEditing()" />
      } @else {
        @if (!hasProfileContent(current)) {
          <div class="prompt" role="note">
            Complete your school profile so parents can find and choose your school.
          </div>
        }
        <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
          <!-- BASIC INFO -->
          <fieldset>
            <legend>Basic info</legend>
            <ac-ui-field
              label="School name"
              [required]="true"
              [error]="showError('name') ? 'School name is required.' : null"
            >
              <input type="text" formControlName="name" />
            </ac-ui-field>
            <ac-ui-field label="Description" [optional]="true">
              <textarea
                rows="4"
                formControlName="description"
                placeholder="A short bio families will see."
              ></textarea>
            </ac-ui-field>
            <ac-ui-field label="Logo image URL" [optional]="true">
              <input type="url" formControlName="logoUrl" placeholder="https://…" />
            </ac-ui-field>
            <ac-ui-field label="Cover image URL" [optional]="true">
              <input type="url" formControlName="coverImageUrl" placeholder="https://…" />
            </ac-ui-field>
            @if (form.controls.logoUrl.value || form.controls.coverImageUrl.value) {
              <div class="previews" aria-label="Image previews">
                @if (form.controls.logoUrl.value) {
                  <figure>
                    <figcaption>Logo</figcaption>
                    <img [src]="form.controls.logoUrl.value" alt="Logo preview" />
                  </figure>
                }
                @if (form.controls.coverImageUrl.value) {
                  <figure>
                    <figcaption>Cover</figcaption>
                    <img [src]="form.controls.coverImageUrl.value" alt="Cover preview" />
                  </figure>
                }
              </div>
            }
          </fieldset>

          <!-- LOCATION & CONTACT -->
          <fieldset>
            <legend>Location &amp; contact</legend>
            <ac-ui-field
              label="City / province"
              [required]="true"
              [error]="showError('city') ? 'City is required.' : null"
            >
              <input type="text" formControlName="city" />
            </ac-ui-field>
            <ac-ui-field
              label="Address"
              [required]="true"
              [error]="showError('address') ? 'Address is required.' : null"
            >
              <input type="text" formControlName="address" />
            </ac-ui-field>
            <ac-ui-field
              label="Email"
              [optional]="true"
              [error]="showError('email') ? 'Enter a valid email address.' : null"
            >
              <input type="email" formControlName="email" placeholder="contact@school.example" />
            </ac-ui-field>
            <ac-ui-field label="Website" [optional]="true">
              <input type="url" formControlName="website" placeholder="https://…" />
            </ac-ui-field>
          </fieldset>

          <!-- ENROLLMENT DETAILS -->
          <fieldset>
            <legend>Enrollment details</legend>
            <ac-ui-field label="Student to teacher ratio" [optional]="true">
              <input type="text" formControlName="studentTeacherRatio" placeholder="e.g. 5:1" />
            </ac-ui-field>
            <ac-ui-field label="Availability status">
              <select formControlName="availabilityStatus">
                @for (option of availabilityOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </ac-ui-field>
            @if (form.controls.availabilityStatus.value === 'WAITLIST') {
              <ac-ui-field label="Estimated waitlist" [optional]="true">
                <input
                  type="text"
                  formControlName="waitlistEstimate"
                  placeholder="e.g. ~2 months"
                />
              </ac-ui-field>
            }
            <ac-ui-field label="Admission requirements" [optional]="true">
              <textarea
                rows="4"
                formControlName="admissionRequirements"
                placeholder="What families need to apply."
              ></textarea>
            </ac-ui-field>
          </fieldset>

          <!-- SPECIALIZATIONS & THERAPIES -->
          <fieldset>
            <legend>Specializations &amp; therapies</legend>
            <p class="hint">Select all that your school provides.</p>
            <div class="pills" role="group" aria-label="Specializations">
              @for (option of allSpecializations(); track option) {
                <button
                  type="button"
                  class="pill"
                  [class.active]="isSpecializationSelected(option)"
                  [attr.aria-pressed]="isSpecializationSelected(option)"
                  (click)="toggleSpecialization(option)"
                >
                  {{ option }}
                </button>
              }
            </div>
          </fieldset>

          <!-- OPERATING INFO -->
          <fieldset>
            <legend>Operating info</legend>
            <ac-ui-field label="Operating hours" [optional]="true">
              <input
                type="text"
                formControlName="operatingHours"
                placeholder="e.g. Mon–Fri, 8am–4pm"
              />
            </ac-ui-field>
            <ac-ui-field
              label="Facilities and amenities"
              hint="One facility per line."
              [optional]="true"
            >
              <textarea
                rows="4"
                formControlName="facilities"
                placeholder="One per line (e.g. Sensory room)"
              ></textarea>
            </ac-ui-field>
          </fieldset>

          <!-- READ-ONLY STATUS -->
          <fieldset class="readonly">
            <legend>Status <span class="ro-badge">Read-only</span></legend>
            <p class="hint">
              These are set by AutiCare and parent reviews — they can't be edited from this form.
            </p>
            <div class="ro-grid">
              <div class="ro-field">
                <span class="ro-label">Rating</span>
                <span class="ro-value">
                  @if (current.rating !== null) {
                    {{ current.rating }} / 5 · {{ current.reviewCount }} review{{
                      current.reviewCount === 1 ? '' : 's'
                    }}
                  } @else {
                    No reviews yet
                  }
                </span>
              </div>
              <div class="ro-field">
                <span class="ro-label">Verification</span>
                <span class="ro-value">
                  <span class="verify-badge" [class.verified]="current.isVerified">
                    {{ current.isVerified ? 'Verified' : 'Not verified' }}
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
            <button type="submit" [disabled]="saving()">
              {{ saving() ? 'Saving…' : 'Save profile' }}
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
        margin-bottom: 28px;
      }
      .eyebrow {
        color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
      }
      h1 {
        margin: 0;
        font-size: var(--ac-type-page-title);
      }
      form {
        display: grid;
        gap: 20px;
      }
      fieldset {
        display: grid;
        gap: 16px;
        border: 1px solid var(--ac-color-border-info);
        border-radius: 8px;
        padding: 18px;
        background: var(--ac-color-surface);
      }
      legend {
        font-weight: var(--ac-font-weight-bold);
        padding: 0 8px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      label {
        display: grid;
        gap: 8px;
        font-weight: var(--ac-font-weight-semibold);
      }
      input,
      textarea,
      select {
        border: 1px solid var(--ac-color-grey-pale);
        border-radius: 8px;
        padding: 12px;
        font: inherit;
        background: var(--ac-color-surface);
      }
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 3px solid var(--ac-color-action);
        outline-offset: 1px;
      }
      .hint {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
      }
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
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
      }
      .previews img {
        width: 120px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--ac-color-border-info);
        background: var(--ac-color-tint-blue-wash);
      }
      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .pill {
        min-height: 38px;
        padding: 0 16px;
        border-radius: 999px;
        border: 2px solid var(--ac-color-border-info);
        background: var(--ac-color-surface);
        color: var(--ac-color-text);
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }
      .pill:hover:not(.active) {
        border-color: var(--ac-color-primary);
      }
      .pill.active {
        border-color: var(--ac-color-action);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }
      .pill:focus-visible {
        outline: 3px solid var(--ac-color-action);
        outline-offset: 2px;
      }

      /* Read-only status block — visually distinct from editable fields. */
      .readonly {
        background: var(--ac-color-tint-blue-wash);
        border-style: dashed;
      }
      .ro-badge {
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-body);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 999px;
        padding: 2px 10px;
      }
      .ro-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .ro-field {
        display: grid;
        gap: 6px;
      }
      .ro-label {
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
      }
      .ro-value {
        color: var(--ac-color-text);
        font-weight: var(--ac-font-weight-semibold);
      }
      .verify-badge {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 12px;
        font-weight: var(--ac-font-weight-bold);
        font-size: var(--ac-type-label);
        background: #eef1f2;
        color: var(--ac-color-text-body);
      }
      .verify-badge.verified {
        background: var(--ac-color-success);
        color: var(--ac-color-text-on-action);
      }

      button[type='submit'] {
        width: fit-content;
        border: 0;
        border-radius: 8px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        padding: 12px 22px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }
      button[type='submit']:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        color: var(--ac-color-alert-text);
        font-weight: var(--ac-font-weight-semibold);
      }
      .field-error {
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
      }
      .success {
        color: var(--ac-color-green-700);
        font-weight: var(--ac-font-weight-semibold);
      }
      /* Prominent save confirmation / error banner (hard to miss). */
      .save-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 10px;
        padding: 14px 18px;
        font-weight: var(--ac-font-weight-bold);
        font-size: 1rem;
      }
      .save-banner.ok {
        background: #e2efe3;
        color: var(--ac-color-green-700);
        border: 1px solid #b7d8bd;
      }
      .save-banner.bad {
        background: #fbe9e9;
        color: var(--ac-color-alert-text);
        border: 1px solid var(--ac-color-red-border);
      }
      .save-icon {
        font-size: 1.15rem;
      }
      .prompt {
        margin-bottom: 20px;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 10px;
        padding: 14px 18px;
        color: var(--ac-color-text);
        font-weight: var(--ac-font-weight-semibold);
      }
      .form-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .cancel-btn {
        border: 1px solid var(--ac-color-grey-pale);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text);
        padding: 12px 22px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }
      .cancel-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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

  readonly school = signal<SchoolDetailResponse | null>(null);
  readonly specializations = signal<readonly string[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mode = signal<'view' | 'edit'>('edit');
  readonly savedFlash = signal(false);

  // Predefined options plus any already-saved values not in the list (so custom
  // specializations remain visible/removable).
  readonly allSpecializations = computed(() => {
    const selected = this.specializations();
    const extras = selected.filter((item) => !specializationOptions.includes(item));
    return [...specializationOptions, ...extras];
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
    facilities: [''],
  });

  ngOnInit() {
    this.api.getMySchool().subscribe({
      next: (school) => {
        this.hydrate(school);
        // Completed profile => polished view by default; empty profile => form directly.
        this.mode.set(this.hasProfileContent(school) ? 'view' : 'edit');
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Your school profile could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }

  /** True once the school has saved any real profile content beyond the bare account. */
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
    if (school) this.hydrate(school); // form matches current saved values
    this.error.set(null);
    this.savedFlash.set(false);
    this.mode.set('edit');
  }

  cancelEditing() {
    const school = this.school();
    if (school) this.hydrate(school); // discard unsaved edits
    this.error.set(null);
    this.mode.set('view');
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
    const facilities = value.facilities
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

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
      facilities,
      specializations: [...this.specializations()],
    };

    this.saving.set(true);
    this.api.updateMySchool(payload).subscribe({
      next: (school) => {
        this.saving.set(false);
        try {
          this.hydrate(school);
        } catch {
          // The save succeeded even if re-populating the form failed.
        }
        // Switch to the polished view so the saved data is visibly shown (the fix
        // for "nothing happens on save").
        this.mode.set('view');
        this.savedFlash.set(true);
        this.revealFeedback();
      },
      error: () => {
        this.saving.set(false);
        this.error.set(
          'Your profile could not be saved. Check the highlighted fields (URLs must start with https://) and try again.',
        );
        this.revealFeedback();
      },
    });
  }

  /** Scroll the save confirmation/error banner into view so it's never missed. */
  private revealFeedback() {
    setTimeout(() => {
      this.el.nativeElement
        .querySelector('.save-banner')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  toggleSpecialization(name: string) {
    this.specializations.update((list) =>
      list.includes(name) ? list.filter((item) => item !== name) : [...list, name],
    );
  }

  isSpecializationSelected(name: string): boolean {
    return this.specializations().includes(name);
  }

  protected showError(path: string) {
    const control = this.form.get(path);
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }

  private hydrate(school: SchoolDetailResponse) {
    this.school.set(school);
    this.specializations.set([...school.specializations]);
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
      facilities: school.facilities.join('\n'),
    });
  }
}
