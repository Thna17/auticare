import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AppointmentResponse } from '@auticare/contracts';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { UiButtonComponent } from '../../design-system/components/ui-button.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { statusPresentation, statusTone } from '../appointments/appointments.types';

/**
 * Specialist consultation dossier and appointment drawer.
 * Displays patient developmental dossier, sensory accommodations,
 * clinical consultation note pad, and instant parent summary generator.
 */
@Component({
  standalone: true,
  selector: 'ac-appointment-detail-drawer',
  imports: [UiBadgeComponent, UiButtonComponent, UiDialogComponent, RouterLink],
  template: `
    <ac-ui-dialog
      [heading]="appointment().childName ?? 'Patient TBD'"
      variant="drawer"
      (close)="close.emit()"
    >
      <div dialogHeader>
        <p class="eyebrow">Specialist Consultation Dossier</p>
      </div>

      <div class="badge-wrapper">
        <ac-ui-badge [tone]="statusTone[appointment().status]">
          {{ statusPresentation[appointment().status].label }}
        </ac-ui-badge>
        <span class="dossier-age-chip">{{ formattedAge() }}</span>
      </div>

      @if (appointment().status === 'COMPLETED') {
        <div class="completed-summary-banner">
          <div class="completed-check-badge" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div class="completed-summary-content">
            <strong>Visit Concluded</strong>
            <p>
              This appointment has been marked as completed. Clinical consultation with
              {{ appointment().doctorName ?? 'the specialist' }} was concluded.
            </p>
          </div>
        </div>
      }

      <!-- ── Section 1: Patient Developmental Dossier ── -->
      <section class="drawer-section dossier-section">
        <h3 class="section-title">Patient Developmental Dossier</h3>

        <!-- Screening Risk Overview -->
        <div class="dossier-card screening-overview-card">
          <div class="dossier-card-header">
            <span class="dossier-sub-label">Screening Risk Profile</span>
            <ac-ui-badge [tone]="screeningRisk().tone">
              {{ screeningRisk().label }}
            </ac-ui-badge>
          </div>
          <p class="dossier-desc">
            {{ screeningRisk().description }}
          </p>
          <div class="domain-tags-row">
            @for (domain of screeningRisk().domains; track $index) {
              <span class="domain-tag-pill">{{ domain }}</span>
            }
          </div>
        </div>

        <!-- School Enrollment Link & Coordination -->
        <div class="dossier-card school-coordination-card">
          <div class="dossier-card-header">
            <span class="dossier-sub-label">Educational Program Link</span>
            <ac-ui-badge tone="neutral">Active Inclusive School Partner</ac-ui-badge>
          </div>
          <p class="dossier-desc">
            Enrolled in partner inclusive education facility. Classroom teacher observations and
            daily accommodation logs are linked to student record.
          </p>
          <a routerLink="/progress" class="school-records-link">
            <span>View School Observation Reports</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <!-- Sensory Triggers & Accommodations -->
        <div class="dossier-card sensory-triggers-card">
          <div class="dossier-card-header">
            <span class="dossier-sub-label">Sensory Triggers &amp; Accommodations</span>
          </div>
          <div class="sensory-tags-grid">
            @for (tag of sensoryTriggers(); track $index) {
              <div class="sensory-tag-chip">
                <svg
                  class="sensory-icon"
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>{{ tag }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Patient Demographics & Intake Notes -->
        <div class="patient-intake-card">
          <dl class="detail-list">
            <div>
              <dt>Date of birth</dt>
              <dd>{{ formattedDob() }}</dd>
            </div>
            <div>
              <dt>Age</dt>
              <dd>{{ formattedAge() }}</dd>
            </div>
          </dl>

          <div class="intake-block">
            <dt class="intake-label">Reason for visit</dt>
            <dd class="intake-val">
              {{ appointment().reason ?? 'No reason provided at booking.' }}
            </dd>
          </div>

          <div class="intake-block">
            <dt class="intake-label">Care notes</dt>
            <dd class="intake-val">{{ appointment().childNotes || 'No notes on file.' }}</dd>
          </div>
        </div>

        <!-- Parent & Guardian Contact -->
        <div class="guardian-contact-card">
          <span class="dossier-sub-label">Parent &amp; Guardian Contact</span>
          <dl class="detail-list">
            @if (appointment().parentName) {
              <div>
                <dt>Guardian name</dt>
                <dd>{{ appointment().parentName }}</dd>
              </div>
            }
            <div>
              <dt>Email</dt>
              <dd>
                @if (appointment().parentEmail) {
                  <a [href]="'mailto:' + appointment().parentEmail" class="contact-link">
                    {{ appointment().parentEmail }}
                  </a>
                } @else {
                  <span>Not provided</span>
                }
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                @if (appointment().parentPhoneNumber) {
                  <a [href]="'tel:' + appointment().parentPhoneNumber" class="contact-link">
                    {{ appointment().parentPhoneNumber }}
                  </a>
                } @else {
                  <span>Not provided</span>
                }
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- ── Section 2: Clinical Consultation Note Pad ── -->
      <section class="drawer-section clinical-notepad-section">
        <div class="notepad-header">
          <h3 class="section-title">Clinical Consultation Note Pad</h3>
          <span class="confidential-pill">Clinical In-Session</span>
        </div>

        <!-- Diagnosis Impression & Quick Prompts -->
        <div class="notepad-group">
          <label for="clinical-impression-input" class="notepad-label">
            Diagnosis Impression &amp; Clinical Focus
          </label>
          <div class="prompt-chips-row">
            @for (prompt of diagnosisPrompts; track prompt) {
              <button
                type="button"
                class="prompt-chip-btn"
                (click)="addImpressionPrompt(prompt)"
                title="Add clinical impression prompt"
              >
                + {{ prompt }}
              </button>
            }
          </div>
          <textarea
            id="clinical-impression-input"
            class="notepad-textarea"
            rows="3"
            placeholder="Record clinical impressions, behavioral observations, sensory sensitivities, and developmental trajectory notes..."
            [value]="clinicalImpression()"
            (input)="clinicalImpression.set($any($event.target).value)"
          ></textarea>
        </div>

        <!-- Recommended Therapy Domains -->
        <div class="notepad-group">
          <label class="notepad-label">Recommended Therapy Domains</label>
          <div class="therapy-domains-grid">
            @for (domain of therapyDomainOptions; track domain) {
              <button
                type="button"
                class="therapy-domain-pill"
                [class.selected]="isTherapySelected(domain)"
                (click)="toggleTherapyDomain(domain)"
              >
                <span class="check-indicator">{{ isTherapySelected(domain) ? '✓' : '+' }}</span>
                <span>{{ domain }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Follow-up Scheduler -->
        <div class="notepad-group">
          <label for="followup-interval-select" class="notepad-label">Follow-up Interval</label>
          <select
            id="followup-interval-select"
            class="followup-select"
            [value]="selectedFollowUp()"
            (change)="selectedFollowUp.set($any($event.target).value)"
          >
            @for (option of followUpOptions; track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </div>

        <!-- Instant Parent Summary Generator -->
        <div class="parent-summary-action-wrap">
          <button type="button" class="generate-summary-btn" (click)="generateParentSummary()">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Generate Parent Consultation Summary</span>
          </button>
        </div>

        @if (parentSummary(); as summary) {
          <div class="parent-summary-card">
            <div class="parent-summary-top">
              <span class="summary-card-title">Family Takeaway &amp; Care Guidance</span>
              <button
                type="button"
                class="copy-summary-btn"
                (click)="copyParentSummary()"
                [class.copied]="copiedSummary()"
              >
                {{ copiedSummary() ? '✓ Copied to clipboard' : 'Copy Summary' }}
              </button>
            </div>
            <pre class="parent-summary-text">{{ summary }}</pre>
          </div>
        }
      </section>

      <!-- ── Section 3: Visit Details & History ── -->
      <section class="drawer-section">
        <h3 class="section-title">Visit Details</h3>
        <dl class="detail-list">
          <div>
            <dt>Hospital</dt>
            <dd>{{ appointment().hospitalName }}</dd>
          </div>
          <div>
            <dt>Doctor</dt>
            <dd>{{ appointment().doctorName ?? 'Unassigned' }}</dd>
          </div>
          <div>
            <dt>Date &amp; time</dt>
            <dd>{{ formattedDate() }}</dd>
          </div>
        </dl>
      </section>

      <section class="drawer-section">
        <h3 class="section-title">History with this Hospital</h3>
        @if (history().length === 0) {
          <p class="body-text muted">No other appointments on file.</p>
        } @else {
          <ul class="history-list">
            @for (item of history(); track item.id) {
              <li>
                <span>{{ formattedShortDate(item.scheduledAt) }}</span>
                <ac-ui-badge [tone]="statusTone[item.status]">
                  {{ statusPresentation[item.status].label }}
                </ac-ui-badge>
              </li>
            }
          </ul>
        }
      </section>

      @if (appointment().status === 'REQUESTED') {
        <div dialogFooter class="drawer-footer">
          <ac-ui-button variant="destructive" (click)="reject.emit()">Reject</ac-ui-button>
          <ac-ui-button variant="primary" (click)="approve.emit()">Approve</ac-ui-button>
        </div>
      } @else if (appointment().status === 'CONFIRMED') {
        <div dialogFooter class="drawer-footer">
          <ac-ui-button variant="primary" (click)="complete.emit()">Mark Completed</ac-ui-button>
        </div>
      }
    </ac-ui-dialog>
  `,
  styles: [
    `
      .eyebrow {
        margin: 0 0 var(--ac-space-1);
        color: var(--ac-color-action);
        font-size: var(--ac-type-meta);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: var(--ac-font-weight-semibold);
      }

      .badge-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: var(--ac-space-4);
      }

      .dossier-age-chip {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        font-size: 11.5px;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
      }

      .completed-summary-banner {
        display: flex;
        align-items: flex-start;
        gap: var(--ac-space-3);
        padding: 14px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-sage-light);
        border: 1px solid var(--ac-color-olive-light);
        margin-bottom: var(--ac-space-5);
      }

      .completed-check-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: var(--ac-color-success);
        color: var(--ac-color-surface);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .completed-summary-content strong {
        display: block;
        color: var(--ac-color-olive-darkest);
        font-size: var(--ac-type-meta);
        margin-bottom: 2px;
      }

      .completed-summary-content p {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
      }

      .drawer-section {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-3);
        margin-bottom: var(--ac-space-5);
        padding-bottom: var(--ac-space-4);
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .section-title {
        margin: 0;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-slate-strong);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      /* ── Dossier Cards ─────────────────────────────────────── */
      .dossier-card {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-slate);
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .dossier-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .dossier-sub-label {
        font-size: 11.5px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
      }

      .dossier-desc {
        margin: 0;
        font-size: 12.5px;
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-body);
      }

      .domain-tags-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .domain-tag-pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        font-size: 11px;
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-medium);
      }

      .school-records-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-action-deep);
        text-decoration: none;
      }

      .school-records-link:hover {
        text-decoration: underline;
      }

      .sensory-tags-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .sensory-tag-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-sage-light);
        border: 1px solid var(--ac-color-olive-light);
        font-size: 11.5px;
        color: var(--ac-color-olive-darkest);
        font-weight: var(--ac-font-weight-medium);
      }

      .sensory-icon {
        color: var(--ac-color-success);
      }

      .patient-intake-card,
      .guardian-contact-card {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .intake-block {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .intake-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-bold);
      }

      .intake-val {
        margin: 0;
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-strong);
      }

      .contact-link {
        color: var(--ac-color-action-deep);
        text-decoration: none;
      }

      .contact-link:hover {
        text-decoration: underline;
      }

      /* ── Clinical Consultation Note Pad ─────────────────────── */
      .clinical-notepad-section {
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        padding: 14px;
      }

      .notepad-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 4px;
      }

      .confidential-pill {
        display: inline-block;
        padding: 1px 7px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-blue-100);
        color: var(--ac-color-action-darkest);
        font-size: 10.5px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .notepad-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .notepad-label {
        font-size: 11.5px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-slate-strong);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .prompt-chips-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .prompt-chip-btn {
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-text-body);
        font-size: 11px;
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all 140ms ease;
      }

      .prompt-chip-btn:hover {
        background: var(--ac-color-sage-light);
        border-color: var(--ac-color-olive-light);
        color: var(--ac-color-olive-darkest);
      }

      .notepad-textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-sm);
        padding: 8px 10px;
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text);
        background: var(--ac-color-surface);
        resize: vertical;
        font-family: inherit;
      }

      .notepad-textarea:focus {
        outline: 2px solid var(--ac-color-action);
        outline-offset: -1px;
      }

      .therapy-domains-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .therapy-domain-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 11.5px;
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: all 140ms ease;
      }

      .therapy-domain-pill.selected {
        background: var(--ac-color-action-alt);
        border-color: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
      }

      .check-indicator {
        font-weight: var(--ac-font-weight-bold);
      }

      .followup-select {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-sm);
        padding: 6px 10px;
        font-size: var(--ac-type-meta);
        background: var(--ac-color-surface);
        color: var(--ac-color-text);
      }

      .parent-summary-action-wrap {
        padding-top: 4px;
      }

      .generate-summary-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        justify-content: center;
        padding: 8px 14px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-action);
        border: 1px solid var(--ac-color-action-deep);
        color: var(--ac-color-text-on-action);
        font-size: 12.5px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        transition: background 140ms ease;
      }

      .generate-summary-btn:hover {
        background: var(--ac-color-action-deep);
      }

      .parent-summary-card {
        border: 1px solid var(--ac-color-olive-light);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-sage-light);
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .parent-summary-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .summary-card-title {
        font-size: 11.5px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-olive-darkest);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .copy-summary-btn {
        padding: 3px 8px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-olive-light);
        background: var(--ac-color-surface);
        color: var(--ac-color-olive-darkest);
        font-size: 11px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      .copy-summary-btn.copied {
        background: var(--ac-color-success);
        color: var(--ac-color-surface);
        border-color: var(--ac-color-success);
      }

      .parent-summary-text {
        margin: 0;
        font-family: inherit;
        font-size: 11.5px;
        line-height: 1.45;
        color: var(--ac-color-text-strong);
        white-space: pre-wrap;
      }

      /* ── General Text & Detail Lists ───────────────────────── */
      .body-text {
        margin: 0;
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-strong);
      }

      .body-text.muted {
        color: var(--ac-color-text-muted);
      }

      .detail-list {
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: var(--ac-space-3);
      }

      .detail-list dt {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .detail-list dd {
        margin: var(--ac-space-1) 0 0;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-strong);
      }

      .history-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-2);
      }

      .history-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--ac-space-2) 0;
        border-bottom: 1px solid var(--ac-color-border-slate);
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--ac-space-3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetailDrawerComponent {
  readonly appointment = input.required<AppointmentResponse>();
  readonly allAppointments = input<readonly AppointmentResponse[]>([]);
  readonly close = output<void>();
  readonly approve = output<void>();
  readonly reject = output<void>();
  readonly complete = output<void>();

  protected readonly statusTone = statusTone;
  protected readonly statusPresentation = statusPresentation;

  protected readonly clinicalImpression = signal('');
  protected readonly selectedTherapyDomains = signal<string[]>([
    'Occupational Therapy (OT)',
    'Speech & Language (SLP)',
  ]);
  protected readonly selectedFollowUp = signal('1 Month (Therapy Review)');
  protected readonly parentSummary = signal('');
  protected readonly copiedSummary = signal(false);

  protected readonly diagnosisPrompts: readonly string[] = [
    'Sensory Processing Sensitivity',
    'Speech & Language Delay',
    'Autism Spectrum Presentation',
    'Social Communication Focus',
    'Motor Planning Consideration',
  ];

  protected readonly therapyDomainOptions: readonly string[] = [
    'Speech & Language (SLP)',
    'Occupational Therapy (OT)',
    'Behavioral Support (BCBA)',
    'Sensory Integration',
    'Adaptive Daily Living',
  ];

  protected readonly followUpOptions: readonly string[] = [
    '2 Weeks (Immediate Re-eval)',
    '1 Month (Therapy Review)',
    '3 Months (Quarterly Progress)',
    '6 Months (Annual Clinical Review)',
    'As Needed / PRN',
  ];

  protected readonly history = computed(() =>
    this.allAppointments()
      .filter(
        (item) => item.childId === this.appointment().childId && item.id !== this.appointment().id,
      )
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
  );

  protected readonly formattedDob = computed(() => {
    const dob = this.appointment().childDateOfBirth;
    if (!dob) return 'Not on file';
    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) return dob;
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

  protected readonly formattedAge = computed(() => {
    const dob = this.appointment().childDateOfBirth;
    if (!dob) return 'Age unrecorded';
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return 'Age unrecorded';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 0) return 'Infant';
    if (years === 0) return `${months} mo${months === 1 ? '' : 's'} old`;
    if (months === 0) return `${years} yr${years === 1 ? '' : 's'} old`;
    return `${years}y ${months}m`;
  });

  protected readonly formattedDate = computed(() => {
    return new Date(this.appointment().scheduledAt).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  });

  protected readonly screeningRisk = computed(() => {
    const notes = (this.appointment().childNotes ?? '').toLowerCase();
    const reason = (this.appointment().reason ?? '').toLowerCase();
    const combined = `${notes} ${reason}`;

    if (
      combined.includes('severe') ||
      combined.includes('high') ||
      combined.includes('elevated') ||
      combined.includes('critical')
    ) {
      return {
        label: 'Elevated Concern',
        tone: 'error' as const,
        description:
          'Screening indicators highlight elevated developmental support needs. Coordinated multi-disciplinary specialist consultation is recommended.',
        domains: ['Sensory Modulation', 'Speech & Language', 'Behavioral Regulation'],
      };
    }

    if (
      combined.includes('delay') ||
      combined.includes('anxious') ||
      combined.includes('sensitiv') ||
      combined.includes('speech') ||
      combined.includes('moderate')
    ) {
      return {
        label: 'Moderate Concern',
        tone: 'warning' as const,
        description:
          'Screening indicators highlight moderate focus areas in sensory processing and communication milestones. Ongoing therapy support recommended.',
        domains: ['Sensory Processing', 'Social Communication', 'Adaptive Routine'],
      };
    }

    return {
      label: 'Low Concern / Baseline',
      tone: 'success' as const,
      description:
        'Screening indicators show consistent developmental trajectory. Routine clinical monitoring and home sensory activities recommended.',
      domains: ['Routine Exploration', 'Fine Motor Play', 'Peer Interaction'],
    };
  });

  protected readonly sensoryTriggers = computed(() => {
    const notes = (this.appointment().childNotes ?? '').toLowerCase();
    const tags: string[] = [];

    if (notes.includes('light') || notes.includes('bright')) {
      tags.push('Sensitive to Bright Lights / Fluorescents');
    }
    if (notes.includes('sound') || notes.includes('loud') || notes.includes('noise')) {
      tags.push('Auditory Sensitivity / Low Decibel Room');
    }
    if (notes.includes('anxious') || notes.includes('room') || notes.includes('new')) {
      tags.push('New Environment / Transition Buffer');
    }
    if (notes.includes('touch') || notes.includes('tactile')) {
      tags.push('Tactile Sensitivity / Gentle Handling');
    }

    // Baseline soothing accommodations
    tags.push('Caregiver Presence Encouraged');
    tags.push('Predictable Visual Schedule');
    tags.push('Low Stimulus Decompression Space');

    return Array.from(new Set(tags));
  });

  protected addImpressionPrompt(prompt: string) {
    const current = this.clinicalImpression().trim();
    if (!current) {
      this.clinicalImpression.set(`• ${prompt}: `);
    } else {
      this.clinicalImpression.set(`${current}\n• ${prompt}: `);
    }
  }

  protected isTherapySelected(domain: string): boolean {
    return this.selectedTherapyDomains().includes(domain);
  }

  protected toggleTherapyDomain(domain: string) {
    const current = this.selectedTherapyDomains();
    if (current.includes(domain)) {
      this.selectedTherapyDomains.set(current.filter((d) => d !== domain));
    } else {
      this.selectedTherapyDomains.set([...current, domain]);
    }
  }

  protected generateParentSummary() {
    const apt = this.appointment();
    const patientName = apt.childName ?? 'Patient';
    const dateStr = this.formattedDate();
    const doctorStr = apt.doctorName ?? 'Clinical Specialist';
    const impressionText =
      this.clinicalImpression().trim() ||
      'Developmental milestones and sensory accommodations discussed during consultation.';
    const domains = this.selectedTherapyDomains();
    const followUp = this.selectedFollowUp();

    const summary = [
      `CLINICAL CONSULTATION SUMMARY`,
      `=============================`,
      `Patient: ${patientName} (${this.formattedAge()})`,
      `Date & Time: ${dateStr}`,
      `Specialist: ${doctorStr} | ${apt.hospitalName}`,
      ``,
      `Clinical Takeaway:`,
      impressionText,
      ``,
      `Recommended Therapy Domains:`,
      domains.length > 0
        ? domains.map((d) => `- ${d}`).join('\n')
        : '- General developmental monitoring',
      ``,
      `Next Follow-up:`,
      `${followUp}`,
      ``,
      `Care Team Note:`,
      `Thank you for trusting ${apt.hospitalName}. Please continue supportive home sensory routines.`,
    ].join('\n');

    this.parentSummary.set(summary);
  }

  protected copyParentSummary() {
    const summary = this.parentSummary();
    if (!summary) return;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    this.copiedSummary.set(true);
    setTimeout(() => this.copiedSummary.set(false), 2500);
  }

  protected formattedShortDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
