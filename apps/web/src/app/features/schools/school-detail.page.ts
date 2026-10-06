import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ChildResponse, SchoolDetailResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { SchoolsApi } from './data-access/schools.api';
import { EnrollmentRequestsApi } from './data-access/enrollment-requests.api';
import { SchoolProfileViewComponent } from './components/school-profile-view.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';

/**
 * Parent-facing, fully READ-ONLY school detail page (/schools/:id). It renders
 * the shared profile view with `editable = false`, plus the "Request
 * Enrollment" action, which creates an AdmissionRequest and notifies the
 * school (ENROLLMENT_REQUEST) for approval on the school's Notifications page.
 */
@Component({
  standalone: true,
  imports: [RouterLink, UiCardComponent, SchoolProfileViewComponent, UiMessageComponent],
  template: `
    <a class="back" routerLink="/schools">← Back to schools</a>

    @if (loading()) {
      <ac-ui-card><p>Loading school…</p></ac-ui-card>
    } @else if (error(); as loadError) {
      <ac-ui-card
        ><ac-ui-message tone="error">{{ loadError }}</ac-ui-message></ac-ui-card
      >
    } @else if (school(); as s) {
      <ac-school-profile-view [school]="s" [editable]="false" />

      <!-- Enrollment request -->
      <ac-ui-card class="enroll-card">
        <h2 class="enroll-title">Enrollment</h2>

        @if (children().length === 0) {
          <p class="enroll-hint">
            Add a child to your family profile first — then you can request enrollment here.
          </p>
        } @else if (submitted(); as done) {
          <div class="success-box" role="status">
            <strong>Request sent.</strong>
            {{ done.childName }}'s enrollment request at {{ done.schoolName }} was delivered — the
            school will review it and respond on your notifications.
          </div>
          <button type="button" class="btn-secondary" (click)="resetForm()">
            Request for another child
          </button>
        } @else {
          <div class="enroll-form">
            <label class="field">
              <span class="field-label">Child</span>
              <select [(value)]="selectedChildId" class="field-input">
                @for (child of children(); track child.id) {
                  <option [value]="child.id">{{ child.firstName }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="field-label">Message to the school (optional)</span>
              <textarea
                class="field-input"
                rows="3"
                maxlength="2000"
                placeholder="Share anything that helps the school — your child's needs, goals, or questions."
                [(value)]="message"
              ></textarea>
            </label>

            @if (formError(); as formErr) {
              <ac-ui-message tone="error">{{ formErr }}</ac-ui-message>
            }

            <div class="actions-row">
              <button
                type="button"
                class="btn-primary"
                (click)="submitRequest()"
                [disabled]="submitting()"
              >
                {{ submitting() ? 'Sending…' : 'Request Enrollment' }}
              </button>
            </div>
          </div>
        }
      </ac-ui-card>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 760px;
        margin: 0 auto;
      }
      .back {
        display: inline-block;
        margin-bottom: 18px;
        color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
        text-decoration: none;
      }
      .error {
        color: var(--ac-color-alert-text);
        font-weight: var(--ac-font-weight-semibold);
      }

      .enroll-card {
        margin-top: 18px;
        display: block;
      }
      .enroll-title {
        margin: 0 0 10px;
        font-size: 18px;
        color: var(--ac-color-action-darkest);
      }
      .enroll-hint {
        margin: 0;
        color: var(--ac-color-grey-a);
        font-size: 14px;
      }
      .enroll-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .field-label {
        font-size: 13px;
        font-weight: 700;
        color: #334e5c;
      }
      .field-input {
        width: 100%;
        padding: 9px 12px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 8px;
        font-size: 14px;
        color: var(--ac-color-action-darkest);
        background: var(--ac-color-surface);
        box-sizing: border-box;
      }
      .field-input:focus {
        outline: 2px solid #9ec9d8;
        outline-offset: 1px;
      }
      textarea.field-input {
        resize: vertical;
      }
      .actions-row {
        display: flex;
        gap: 10px;
      }
      .btn-primary {
        padding: 10px 22px;
        border: 0;
        border-radius: 9px;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .btn-secondary {
        padding: 8px 18px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 9px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .success-box {
        padding: 12px 16px;
        border-radius: 9px;
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
        font-size: 14px;
        margin-bottom: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolsApi);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly requestsApi = inject(EnrollmentRequestsApi);

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

  ngOnInit() {
    const schoolId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!schoolId) {
      this.loading.set(false);
      this.error.set('This school could not be found.');
      return;
    }
    this.api.getSchoolById(schoolId).subscribe({
      next: (school) => {
        this.school.set(school);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This school profile could not be loaded.');
        this.loading.set(false);
      },
    });

    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        if (children.length > 0) {
          this.selectedChildId.set(children[0].id);
        }
      },
      error: () => this.children.set([]),
    });
  }

  submitRequest() {
    const school = this.school();
    const childId = this.selectedChildId();
    if (!school || !childId) {
      this.formError.set('Choose a child first.');
      return;
    }

    this.submitting.set(true);
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
              'This child already has an enrollment or an open request at this school.',
            );
          } else if (status === 404) {
            this.formError.set('This school or child could not be found.');
          } else {
            this.formError.set('Could not send the request. Please try again.');
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
