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
import { SchoolProfileViewComponent } from './components/school-profile-view.component';

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
  imports: [ReactiveFormsModule, UiCardComponent, SchoolProfileViewComponent],
  template: `
    <section class="page-header">
      <p class="eyebrow">School workspace</p>
      <h1>School profile</h1>
      <p>Keep your public profile up to date so families can find and choose your school.</p>
    </section>

    @if (loading()) {
      <ac-ui-card><p>Loading profile...</p></ac-ui-card>
    } @else if (loadError()) {
      <p class="error" role="alert">{{ loadError() }}</p>
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
        <form [formGroup]="form" (ngSubmit)="submit()">
          <!-- BASIC INFO -->
          <fieldset>
            <legend>Basic info</legend>
            <label>
              School name
              <input type="text" formControlName="name" />
              @if (showError('name')) {
                <span class="field-error">School name is required.</span>
              }
            </label>
            <label>
              Description
              <textarea
                rows="4"
                formControlName="description"
                placeholder="A short bio families will see."
              ></textarea>
            </label>
            <label>
              Logo image URL
              <input type="url" formControlName="logoUrl" placeholder="https://…" />
            </label>
            <label>
              Cover image URL
              <input type="url" formControlName="coverImageUrl" placeholder="https://…" />
            </label>
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
            <label>
              City / Province
              <input type="text" formControlName="city" />
              @if (showError('city')) {
                <span class="field-error">City is required.</span>
              }
            </label>
            <label>
              Address
              <input type="text" formControlName="address" />
              @if (showError('address')) {
                <span class="field-error">Address is required.</span>
              }
            </label>
            <label>
              Email
              <input type="email" formControlName="email" placeholder="contact@school.example" />
              @if (showError('email')) {
                <span class="field-error">Enter a valid email address.</span>
              }
            </label>
            <label>
              Website
              <input type="url" formControlName="website" placeholder="https://…" />
            </label>
          </fieldset>

          <!-- ENROLLMENT DETAILS -->
          <fieldset>
            <legend>Enrollment details</legend>
            <label>
              Student : teacher ratio
              <input type="text" formControlName="studentTeacherRatio" placeholder="e.g. 5:1" />
            </label>
            <label>
              Availability status
              <select formControlName="availabilityStatus">
                @for (option of availabilityOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </label>
            @if (form.controls.availabilityStatus.value === 'WAITLIST') {
              <label>
                Estimated waitlist
                <input
                  type="text"
                  formControlName="waitlistEstimate"
                  placeholder="e.g. ~2 months"
                />
              </label>
            }
            <label>
              Admission requirements
              <textarea
                rows="4"
                formControlName="admissionRequirements"
                placeholder="What families need to apply."
              ></textarea>
            </label>
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
            <label>
              Operating hours
              <input
                type="text"
                formControlName="operatingHours"
                placeholder="e.g. Mon–Fri, 8am–4pm"
              />
            </label>
            <label>
              Facilities &amp; amenities
              <textarea
                rows="4"
                formControlName="facilities"
                placeholder="One per line (e.g. Sensory room)"
              ></textarea>
              <span class="hint">One facility per line.</span>
            </label>
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
      /* Center the whole page column, matching the parent detail page (school-detail.page.ts).
         Without this the host is full-width and the 760px children left-align, leaving dead
         space on the right. */
      :host {
        display: block;
        max-width: 760px;
        margin: 0 auto;
      }
      .page-header {
        max-width: 760px;
        margin-bottom: 28px;
      }
      .eyebrow {
        color: #3d6375;
        font-weight: var(--ac-font-weight-bold);
      }
      h1 {
        margin: 0;
        font-size: var(--ac-type-page-title);
      }
      form {
        display: grid;
        gap: 20px;
        max-width: 760px;
      }
      fieldset {
        display: grid;
        gap: 16px;
        border: 1px solid #d4e6ef;
        border-radius: 8px;
        padding: 18px;
        background: #ffffff;
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
        border: 1px solid #c1d3dc;
        border-radius: 8px;
        padding: 12px;
        font: inherit;
        background: #ffffff;
      }
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 3px solid #3d6375;
        outline-offset: 1px;
      }
      .hint {
        margin: 0;
        color: #66747a;
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
        color: #66747a;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
      }
      .previews img {
        width: 120px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid #d4e6ef;
        background: #f4faff;
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
        border: 2px solid #d4e6ef;
        background: #ffffff;
        color: #263238;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }
      .pill:hover:not(.active) {
        border-color: #8db4c8;
      }
      .pill.active {
        border-color: #3d6375;
        background: #3d6375;
        color: #ffffff;
      }
      .pill:focus-visible {
        outline: 3px solid #3d6375;
        outline-offset: 2px;
      }

      /* Read-only status block — visually distinct from editable fields. */
      .readonly {
        background: #f4faff;
        border-style: dashed;
      }
      .ro-badge {
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #66747a;
        background: #e8f6ff;
        border: 1px solid #d4e6ef;
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
        color: #66747a;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
      }
      .ro-value {
        color: #263238;
        font-weight: var(--ac-font-weight-semibold);
      }
      .verify-badge {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 12px;
        font-weight: var(--ac-font-weight-bold);
        font-size: var(--ac-type-label);
        background: #eef1f2;
        color: #66747a;
      }
      .verify-badge.verified {
        background: #72a675;
        color: #ffffff;
      }

      button[type='submit'] {
        width: fit-content;
        border: 0;
        border-radius: 8px;
        background: #3d6375;
        color: #ffffff;
        padding: 12px 22px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }
      button[type='submit']:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        color: #a23434;
        font-weight: var(--ac-font-weight-semibold);
      }
      .field-error {
        color: #a23434;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
      }
      .success {
        color: #236b43;
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
        color: #236b43;
        border: 1px solid #b7d8bd;
      }
      .save-banner.bad {
        background: #fbe9e9;
        color: #a23434;
        border: 1px solid #eec2c2;
      }
      .save-icon {
        font-size: 1.15rem;
      }
      .prompt {
        max-width: 760px;
        margin-bottom: 20px;
        background: #e8f6ff;
        border: 1px solid #d4e6ef;
        border-radius: 10px;
        padding: 14px 18px;
        color: #263238;
        font-weight: var(--ac-font-weight-semibold);
      }
      .form-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .cancel-btn {
        border: 1px solid #c1d3dc;
        border-radius: 8px;
        background: #ffffff;
        color: #263238;
        padding: 12px 22px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }
      .cancel-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .save-banner {
        max-width: 760px;
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
