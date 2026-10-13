import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChildResponse, RiskLevel, ScreeningSessionDetailResponse } from '@auticare/contracts';
import { ChildrenApi } from './data-access/children.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { ScreeningBadgeComponent } from '../screening/components/screening-badge.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';

export type MilestoneFeedItem = {
  readonly id: string;
  readonly type: 'SCREENING' | 'SCHOOL' | 'ACTIVITY';
  readonly title: string;
  readonly date: string;
  readonly domain: string;
  readonly domainClass: string;
  readonly description: string;
  readonly linkPath: string;
  readonly linkLabel: string;
  readonly badge?: string;
};

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiMessageComponent,
    UiSpinnerComponent,
    UiDialogComponent,
    UiFieldComponent,
    AccessibleFormDirective,
    ScreeningBadgeComponent,
  ],
  template: `
    <a class="back-link" routerLink="/children">&larr; Back to children</a>

    @if (loading()) {
      <div class="state-center">
        <ac-ui-spinner label="Loading child profile…" />
      </div>
    } @else if (error()) {
      <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
    } @else if (child(); as profile) {
      <section class="profile-hero">
        <div class="identity">
          <div class="avatar" [style.background]="getAvatarGradient(profile)" aria-hidden="true">
            {{ initials(profile) }}
          </div>
          <div class="identity-details">
            <p class="eyebrow">Clinical Child Profile</p>
            <h1>{{ fullName(profile) }}</h1>
            <p class="hero-subtext">
              <strong>{{ ageLabel(profile.dateOfBirth) }}</strong>
              <span class="dot-sep">&bull;</span>
              <span>Born {{ profile.dateOfBirth }}</span>
            </p>
            <div class="hero-notes-row">
              @if (profile.notes) {
                <span
                  class="hero-medical-badge recorded"
                  title="Support and medical notes recorded"
                >
                  <span class="badge-dot" aria-hidden="true"></span>
                  Emergency & Sensory Notes Active
                </span>
              } @else {
                <span class="hero-medical-badge empty"> No Emergency Medical Notes </span>
              }
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <button type="button" class="primary-button edit-btn" (click)="scrollToEdit()">
            Edit Details
          </button>
          <button type="button" class="secondary-button" (click)="resetForm()">
            Discard changes
          </button>
          @if (!profile.archivedAt) {
            <button type="button" class="danger-button" (click)="showArchiveConfirm.set(true)">
              Archive profile
            </button>
          } @else {
            <button
              type="button"
              class="secondary-button"
              [disabled]="restoring()"
              (click)="restore()"
            >
              {{ restoring() ? 'Restoring…' : 'Restore profile' }}
            </button>
          }
        </div>
      </section>

      <!-- Action Toolbar (Prominent sticky care coordinator) -->
      <nav class="child-action-toolbar" aria-label="Quick actions for child">
        <div class="toolbar-content">
          <div class="toolbar-text">
            <strong>Care Actions for {{ profile.firstName }}</strong>
            <small>Coordinate clinical screenings and medical consultations</small>
          </div>
          <div class="toolbar-buttons">
            <a
              class="toolbar-btn primary-action"
              routerLink="/screening"
              [queryParams]="{ childId: profile.id }"
            >
              <span class="btn-icon" aria-hidden="true">📋</span>
              <span>Start Screening for {{ profile.firstName }}</span>
            </a>
            <a class="toolbar-btn secondary-action" routerLink="/hospitals">
              <span class="btn-icon" aria-hidden="true">🏥</span>
              <span>Book Specialist</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- Quick Metrics Hub Banner -->
      <section class="summary-grid" aria-label="Child profile summary">
        <article class="metric-card">
          <span class="metric-label">Profile Status</span>
          <strong class="metric-value" [class.archived-val]="profile.archivedAt">
            {{ profile.archivedAt ? 'Archived' : 'Active' }}
          </strong>
        </article>
        <article class="metric-card">
          <span class="metric-label">Chronological Age</span>
          <strong class="metric-value">{{ ageLabel(profile.dateOfBirth) }}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-label">Screening Assessment</span>
          @if (loadingScreening()) {
            <span class="metric-loading">Loading…</span>
          } @else {
            <div class="badge-wrapper">
              <ac-screening-badge [tone]="riskTone(latestRiskLevel())">
                {{ riskLabel(latestRiskLevel()) }}
              </ac-screening-badge>
            </div>
          }
        </article>
        <article class="metric-card">
          <span class="metric-label">Support & Care Notes</span>
          <strong class="metric-value">{{ profile.notes ? 'Recorded' : 'Not added' }}</strong>
        </article>
      </section>

      <!-- Dynamic Support Snapshot Section -->
      <section class="support-snapshot-section" aria-label="Support Snapshot">
        <div class="snapshot-header">
          <h2>Support Snapshot</h2>
          <p>Key institutional and clinical connections for {{ profile.firstName }}</p>
        </div>
        <div class="support-snapshot-grid">
          <!-- Card 1: Active School Enrollment -->
          <article class="snapshot-card school-card">
            <div class="snapshot-card-header">
              <span class="snapshot-icon school-icon" aria-hidden="true">🏫</span>
              <span class="snapshot-card-eyebrow">School Collaboration</span>
            </div>
            <strong class="snapshot-card-title">Inclusive Education Partner</strong>
            <p class="snapshot-card-detail">
              Connected for developmental progress observations & classroom reports
            </p>
            <a class="snapshot-card-link" routerLink="/schools">Explore Schools &rarr;</a>
          </article>

          <!-- Card 2: Primary Pediatrician / Care Specialist -->
          <article class="snapshot-card clinic-card">
            <div class="snapshot-card-header">
              <span class="snapshot-icon clinic-icon" aria-hidden="true">🩺</span>
              <span class="snapshot-card-eyebrow">Clinical Care Team</span>
            </div>
            <strong class="snapshot-card-title">Developmental Pediatrics Specialist</strong>
            <p class="snapshot-card-detail">
              Pediatrician consultation & sensory diagnostic reviews
            </p>
            <a class="snapshot-card-link" routerLink="/hospitals">Book Specialist &rarr;</a>
          </article>

          <!-- Card 3: Latest Assessment Result -->
          <article class="snapshot-card screening-card">
            <div class="snapshot-card-header">
              <span class="snapshot-icon screening-icon" aria-hidden="true">📊</span>
              <span class="snapshot-card-eyebrow">Latest Assessment</span>
            </div>
            <strong class="snapshot-card-title">{{ riskLabel(latestRiskLevel()) }}</strong>
            <p class="snapshot-card-detail">
              @if (latestRiskLevel()) {
                Clinical questionnaire completed with targeted guidance recorded
              } @else {
                No clinical assessment completed yet for {{ profile.firstName }}
              }
            </p>
            <a
              class="snapshot-card-link"
              routerLink="/screening"
              [queryParams]="{ childId: profile.id }"
            >
              {{ latestRiskLevel() ? 'Review Results &rarr;' : 'Start Assessment &rarr;' }}
            </a>
          </article>
        </div>
      </section>

      <!-- 2-Column Clinical Hub Grid -->
      <div class="clinical-hub-grid">
        <!-- Left Column: Personal, Residential & Support Details Form -->
        <section class="hub-col-personal" aria-labelledby="personal-details-heading">
          <form
            class="profile-form"
            [formGroup]="form"
            (ngSubmit)="save()"
            acAccessibleForm
            novalidate
          >
            <header class="form-header">
              <h2 id="personal-details-heading">Personal Details & Care Notes</h2>
              <p>
                Keep core records up to date for clinical screening, hospital bookings, and school
                collaboration.
              </p>
            </header>

            <ac-ui-field
              label="First name"
              [required]="true"
              [error]="
                form.controls.firstName.touched && form.controls.firstName.invalid
                  ? 'Enter a first name.'
                  : null
              "
            >
              <input type="text" formControlName="firstName" autocomplete="off" maxlength="80" />
            </ac-ui-field>

            <ac-ui-field label="Last name" [optional]="true">
              <input
                type="text"
                formControlName="lastName"
                autocomplete="off"
                maxlength="80"
                placeholder="Optional family or surname"
              />
            </ac-ui-field>

            <ac-ui-field
              label="Date of birth"
              [required]="true"
              [error]="
                form.controls.dateOfBirth.touched && form.controls.dateOfBirth.invalid
                  ? 'Use a valid date of birth.'
                  : null
              "
            >
              <input type="date" formControlName="dateOfBirth" [max]="today" />
            </ac-ui-field>

            <ac-ui-field label="Residential address" [optional]="true">
              <input
                type="text"
                formControlName="address"
                autocomplete="off"
                maxlength="500"
                placeholder="Optional home address for service discovery"
              />
            </ac-ui-field>

            <ac-ui-field label="Support notes & sensory preferences" [optional]="true">
              <textarea
                rows="7"
                formControlName="notes"
                maxlength="2000"
                placeholder="Sensory sensitivities, preferred communication methods, calming routines, or clinical background notes."
              ></textarea>
            </ac-ui-field>

            @if (saveMessage()) {
              <ac-ui-message tone="success">{{ saveMessage() }}</ac-ui-message>
            }
            @if (saveError()) {
              <ac-ui-message tone="error">{{ saveError() }}</ac-ui-message>
            }

            <div class="form-submit-row">
              <button class="primary-button" type="submit" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Profile Changes' }}
              </button>
            </div>
          </form>
        </section>

        <!-- Right Column: Clinical Care & Developmental Snapshot Hub -->
        <aside class="hub-col-clinical" aria-label="Clinical Care and Development Hub">
          <div class="clinical-hub-header">
            <h2>Clinical Care & Development Snapshot</h2>
            <p>Access developmental telemetry, progress charts, and home support exercises.</p>
          </div>

          <div class="hub-cards-stack">
            <!-- Screening Card -->
            <article class="clinical-card screening-card-hub">
              <div class="card-icon-header">
                <span class="card-emoji-icon" aria-hidden="true">📋</span>
                <div class="card-text-header">
                  <h3>Autism Screening Assessment</h3>
                  <p>Standardized behavioral & sensory screening questionnaire</p>
                </div>
              </div>
              <div class="card-badge-line">
                <span class="badge-label-prefix">Current Status:</span>
                @if (loadingScreening()) {
                  <span>Checking records…</span>
                } @else {
                  <ac-screening-badge [tone]="riskTone(latestRiskLevel())">
                    {{ riskLabel(latestRiskLevel()) }}
                  </ac-screening-badge>
                }
              </div>
              <a
                class="clinical-action-btn primary-action"
                routerLink="/screening"
                [queryParams]="{ childId: profile.id }"
              >
                <span>Start Screening</span>
              </a>
            </article>

            <!-- Trajectory Card -->
            <article class="clinical-card trajectory-card-hub">
              <div class="card-icon-header">
                <span class="card-emoji-icon" aria-hidden="true">📈</span>
                <div class="card-text-header">
                  <h3>Developmental Trajectory</h3>
                  <p>Longitudinal progress milestones & observation reports</p>
                </div>
              </div>
              <p class="card-desc">
                Track changes across communication, social, and sensory domains over time.
              </p>
              <a
                class="clinical-action-btn"
                routerLink="/progress"
                [queryParams]="{ childId: profile.id }"
              >
                <span>View Progress</span>
              </a>
            </article>

            <!-- Activities Card -->
            <article class="clinical-card activities-card-hub">
              <div class="card-icon-header">
                <span class="card-emoji-icon" aria-hidden="true">🎯</span>
                <div class="card-text-header">
                  <h3>Recommended Home Activities</h3>
                  <p>Sensory-friendly developmental exercises and play routines</p>
                </div>
              </div>
              <p class="card-desc">
                Personalized home activities tailored to your child's age band and screening
                results.
              </p>
              <a
                class="clinical-action-btn"
                routerLink="/activities"
                [queryParams]="{ childId: profile.id }"
              >
                <span>Browse Activities</span>
              </a>
            </article>

            <!-- Clinical Care Disclaimer -->
            <div class="care-guidance-card">
              <span class="guidance-icon" aria-hidden="true">💡</span>
              <div>
                <h4>Clinical Collaboration Note</h4>
                <p>
                  Screening results and observation trajectories are designed to be shared directly
                  with your pediatrician, speech therapist, or occupational therapist.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Developmental Milestones Timeline Section -->
      <section class="milestones-timeline-section" aria-label="Developmental Milestones Timeline">
        <div class="timeline-header">
          <div>
            <h2>Developmental Milestones Timeline</h2>
            <p>
              Chronological feed of clinical screenings, school reports, and home activity
              milestones
            </p>
          </div>
          <a
            class="timeline-progress-link"
            routerLink="/progress"
            [queryParams]="{ childId: profile.id }"
          >
            Full Progress Trajectory &rarr;
          </a>
        </div>

        <div class="milestones-feed-list">
          @for (item of milestonesTimeline(); track item.id) {
            <article class="milestone-item" [class]="'type-' + item.type.toLowerCase()">
              <div class="milestone-indicator" aria-hidden="true">
                <span class="milestone-icon-bubble">
                  @if (item.type === 'SCREENING') {
                    📋
                  } @else if (item.type === 'SCHOOL') {
                    🏫
                  } @else {
                    🎯
                  }
                </span>
                <span class="milestone-line"></span>
              </div>
              <div class="milestone-card">
                <div class="milestone-card-top">
                  <div class="milestone-meta">
                    <span class="milestone-domain-pill" [class]="item.domainClass">
                      {{ item.domain }}
                    </span>
                    <span class="milestone-date">{{ item.date }}</span>
                  </div>
                  @if (item.badge) {
                    <span class="milestone-risk-badge">{{ item.badge }}</span>
                  }
                </div>
                <h3 class="milestone-title">{{ item.title }}</h3>
                <p class="milestone-desc">{{ item.description }}</p>
                <div class="milestone-footer">
                  <a [routerLink]="item.linkPath" class="milestone-cta-link">
                    {{ item.linkLabel }} &rarr;
                  </a>
                </div>
              </div>
            </article>
          }
        </div>
      </section>

      @if (showArchiveConfirm()) {
        <ac-ui-dialog
          heading="Archive child profile?"
          description="Are you sure you want to archive this child profile? You can restore it later if needed."
          dialogRole="alertdialog"
          size="sm"
          (close)="showArchiveConfirm.set(false)"
        >
          <div dialogFooter class="modal-actions">
            <button type="button" class="secondary-button" (click)="showArchiveConfirm.set(false)">
              Keep active
            </button>
            <button
              type="button"
              class="danger-button"
              [disabled]="archiving()"
              (click)="confirmArchive()"
            >
              {{ archiving() ? 'Archiving…' : 'Archive profile' }}
            </button>
          </div>
        </ac-ui-dialog>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .back-link {
        color: var(--ac-color-action-deep);
        display: inline-flex;
        margin-bottom: 24px;
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
        transition: transform var(--ac-motion-fast);
      }

      .back-link:hover {
        text-decoration: underline;
        transform: translateX(-2px);
      }

      .state-center {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }

      .profile-hero {
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-sm);
        padding: 24px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 22px;
        flex-wrap: wrap;
      }

      .identity {
        display: flex;
        align-items: center;
        gap: 20px;
        min-width: 0;
      }

      .avatar {
        width: 72px;
        height: 72px;
        border-radius: var(--ac-radius-lg);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 26px;
        font-weight: 700;
        flex: 0 0 auto;
        box-shadow: var(--ac-shadow-xs);
      }

      .identity-details {
        min-width: 0;
      }

      .eyebrow {
        margin: 0 0 4px;
        color: var(--ac-color-action-mid);
        font-size: var(--ac-type-meta);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      h1 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: 700;
      }

      .hero-subtext {
        margin: 6px 0 0;
        color: var(--ac-color-text-body);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .hero-subtext strong {
        color: var(--ac-color-text-strong);
      }

      .dot-sep {
        font-size: 10px;
        color: var(--ac-color-border-grey);
      }

      .hero-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      button {
        min-height: 44px;
        border-radius: var(--ac-radius-md);
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        padding: 0 18px;
        transition: all var(--ac-motion-fast);
      }

      .secondary-button {
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
      }

      .secondary-button:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .danger-button {
        border: 1px solid var(--ac-color-red-600);
        background: var(--ac-color-surface);
        color: var(--ac-color-alert-strong);
      }

      .danger-button:hover {
        background: var(--ac-color-alert-surface);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .metric-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .metric-label {
        color: var(--ac-color-text-muted);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .metric-value {
        color: var(--ac-color-text-strong);
        font-size: 16px;
        font-weight: 700;
      }

      .metric-value.archived-val {
        color: var(--ac-color-text-slate);
      }

      .metric-loading {
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .badge-wrapper {
        display: flex;
        align-items: center;
      }

      .clinical-hub-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(320px, 1fr);
        gap: 24px;
        align-items: start;
      }

      .profile-form {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 26px 28px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 20px;
        font-weight: 700;
      }

      .form-header p {
        margin: 6px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: var(--ac-line-body);
      }

      .form-submit-row {
        margin-top: 10px;
      }

      .primary-button {
        width: 100%;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        min-height: 46px;
        font-size: 14px;
        font-weight: 700;
        box-shadow: var(--ac-shadow-sm);
        transition: all var(--ac-motion-fast);
      }

      .primary-button:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-1px);
      }

      .primary-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .hub-col-clinical {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .clinical-hub-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 20px;
        font-weight: 700;
      }

      .clinical-hub-header p {
        margin: 4px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
      }

      .hub-cards-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .clinical-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
        padding: 20px 22px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition:
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .clinical-card:hover {
        box-shadow: var(--ac-shadow-sm);
        border-color: var(--ac-color-border-info);
      }

      .card-icon-header {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }

      .card-emoji-icon {
        font-size: 24px;
        line-height: 1;
        flex: 0 0 auto;
      }

      .card-text-header h3 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 16px;
        font-weight: 700;
      }

      .card-text-header p {
        margin: 3px 0 0;
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .card-badge-line {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--ac-color-text-body);
      }

      .badge-label-prefix {
        font-weight: 600;
      }

      .card-desc {
        margin: 0;
        font-size: 13px;
        line-height: 1.45;
        color: var(--ac-color-text-body);
      }

      .clinical-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 40px;
        padding: 0 16px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        font-weight: 700;
        font-size: 13px;
        text-decoration: none;
        transition: all var(--ac-motion-fast);
      }

      .clinical-action-btn:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .clinical-action-btn.primary-action {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action);
      }

      .clinical-action-btn.primary-action:hover {
        background: var(--ac-color-action-deep);
      }

      .care-guidance-card {
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        padding: 16px 18px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .guidance-icon {
        font-size: 18px;
        line-height: 1;
        flex: 0 0 auto;
      }

      .care-guidance-card h4 {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
      }

      .care-guidance-card p {
        margin: 4px 0 0;
        font-size: 12px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .hero-notes-row {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .hero-medical-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill);
      }

      .hero-medical-badge.recorded {
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-tint-blue-wash);
      }

      .hero-medical-badge.empty {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-muted);
        border: 1px solid var(--ac-color-border);
      }

      .badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      /* Prominent Action Toolbar */
      .child-action-toolbar {
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        box-shadow: var(--ac-shadow-sm);
        padding: 16px 24px;
        margin-bottom: 22px;
      }

      .toolbar-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .toolbar-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .toolbar-text strong {
        color: var(--ac-color-text-strong);
        font-size: 15px;
      }

      .toolbar-text small {
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .toolbar-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .toolbar-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 18px;
        border-radius: var(--ac-radius-md);
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        transition: all var(--ac-motion-fast);
      }

      .toolbar-btn.primary-action {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: 1px solid var(--ac-color-action);
        box-shadow: var(--ac-shadow-sm);
      }

      .toolbar-btn.primary-action:hover {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-1px);
      }

      .toolbar-btn.secondary-action {
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-border);
      }

      .toolbar-btn.secondary-action:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      /* Support Snapshot Section */
      .support-snapshot-section {
        margin-bottom: 28px;
      }

      .snapshot-header {
        margin-bottom: 16px;
      }

      .snapshot-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 18px;
        font-weight: 700;
      }

      .snapshot-header p {
        margin: 4px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
      }

      .support-snapshot-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .snapshot-card {
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-xs);
        padding: 20px 22px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        transition:
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .snapshot-card:hover {
        box-shadow: var(--ac-shadow-sm);
        border-color: var(--ac-color-border-info);
      }

      .snapshot-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .snapshot-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--ac-radius-md);
        display: grid;
        place-items: center;
        font-size: 16px;
        background: var(--ac-color-surface-info);
      }

      .snapshot-card-eyebrow {
        color: var(--ac-color-action-mid);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .snapshot-card-title {
        color: var(--ac-color-text-strong);
        font-size: 15px;
        font-weight: 700;
      }

      .snapshot-card-detail {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: 12px;
        line-height: 1.45;
        flex: 1 1 auto;
      }

      .snapshot-card-link {
        color: var(--ac-color-action-deep);
        font-size: 12px;
        font-weight: 700;
        text-decoration: none;
        align-self: flex-start;
        transition: transform var(--ac-motion-fast);
      }

      .snapshot-card-link:hover {
        text-decoration: underline;
        transform: translateX(2px);
      }

      /* Milestones Timeline Section */
      .milestones-timeline-section {
        margin-top: 32px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-xs);
        padding: 26px 28px;
      }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .timeline-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 18px;
        font-weight: 700;
      }

      .timeline-header p {
        margin: 4px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
      }

      .timeline-progress-link {
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
      }

      .timeline-progress-link:hover {
        text-decoration: underline;
      }

      .milestones-feed-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .milestone-item {
        display: flex;
        gap: 18px;
        position: relative;
      }

      .milestone-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 0 0 auto;
      }

      .milestone-icon-bubble {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--ac-color-surface-info);
        border: 2px solid var(--ac-color-border-info);
        display: grid;
        place-items: center;
        font-size: 16px;
        z-index: 1;
      }

      .milestone-line {
        width: 2px;
        flex: 1 1 auto;
        background: var(--ac-color-border);
        min-height: 24px;
      }

      .milestone-item:last-child .milestone-line {
        display: none;
      }

      .milestone-card {
        flex: 1 1 auto;
        padding-bottom: 24px;
      }

      .milestone-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }

      .milestone-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .milestone-domain-pill {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .milestone-domain-pill.screening-domain {
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action-deep);
      }

      .milestone-domain-pill.school-domain {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
      }

      .milestone-domain-pill.activity-domain {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
      }

      .milestone-date {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .milestone-risk-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-border-info);
      }

      .milestone-title {
        margin: 0 0 4px;
        color: var(--ac-color-text-strong);
        font-size: 15px;
        font-weight: 700;
      }

      .milestone-desc {
        margin: 0 0 8px;
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: 1.45;
      }

      .milestone-footer {
        display: flex;
        align-items: center;
      }

      .milestone-cta-link {
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        text-decoration: none;
      }

      .milestone-cta-link:hover {
        text-decoration: underline;
      }

      @media (max-width: 900px) {
        .clinical-hub-grid {
          grid-template-columns: 1fr;
        }

        .summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .support-snapshot-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        .profile-hero {
          flex-direction: column;
          align-items: stretch;
        }

        .identity {
          flex-direction: column;
          text-align: center;
        }

        .hero-subtext {
          justify-content: center;
        }

        .hero-actions {
          flex-direction: column;
        }

        .hero-actions button {
          width: 100%;
        }

        .summary-grid {
          grid-template-columns: 1fr;
        }

        .toolbar-content {
          flex-direction: column;
          align-items: stretch;
        }

        .toolbar-buttons {
          flex-direction: column;
        }

        .toolbar-btn {
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildProfilePage implements OnInit {
  private readonly api = inject(ChildrenApi);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly child = signal<ChildResponse | null>(null);
  readonly latestRiskLevel = signal<RiskLevel | null>(null);
  readonly sessions = signal<ScreeningSessionDetailResponse[]>([]);
  readonly loadingScreening = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);
  readonly showArchiveConfirm = signal(false);
  readonly archiving = signal(false);
  readonly restoring = signal(false);
  readonly today = new Date().toISOString().slice(0, 10);
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', Validators.maxLength(80)],
    dateOfBirth: ['', Validators.required],
    address: ['', Validators.maxLength(500)],
    notes: ['', Validators.maxLength(2000)],
  });

  readonly milestonesTimeline = computed<readonly MilestoneFeedItem[]>(() => {
    const list: MilestoneFeedItem[] = [];
    const child = this.child();
    const sessions = this.sessions();

    for (const session of sessions) {
      if (session.result) {
        list.push({
          id: `session-${session.id}`,
          type: 'SCREENING',
          title: `Autism Screening Assessment (${session.ageBand || 'Pediatric'})`,
          date: this.formatDate(session.submittedAt || session.startedAt),
          domain: 'Clinical Screening',
          domainClass: 'domain-screening',
          description:
            session.result.recommendation ||
            'Assessment completed with clinical guidance recorded.',
          linkPath: `/screening/result/${session.id}`,
          linkLabel: 'View Screening Result',
          badge: `${this.riskLabel(session.result.riskLevel)} (${session.result.riskPercentage ?? 0}%)`,
        });
      }
    }

    if (child) {
      list.push({
        id: `school-${child.id}`,
        type: 'SCHOOL',
        title: 'Classroom Developmental Observation Report',
        date: 'Recent Term',
        domain: 'School Collaboration',
        domainClass: 'domain-school',
        description:
          'Educator observation on peer interaction, sensory accommodations, and daily routines.',
        linkPath: '/progress',
        linkLabel: 'View Observation Progress',
      });

      list.push({
        id: `activity-${child.id}`,
        type: 'ACTIVITY',
        title: 'Home Sensory Integration & Play Routine',
        date: 'Ongoing Care',
        domain: 'Sensory Play',
        domainClass: 'domain-activity',
        description: 'Recommended calming and visual communication exercises completed at home.',
        linkPath: '/activities',
        linkLabel: 'Browse Activities',
      });
    }

    return list;
  });

  scrollToEdit(): void {
    const el = document.getElementById('personal-details-heading');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Recent';
    const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    const childId = this.route.snapshot.paramMap.get('childId');
    if (!childId) {
      this.error.set('Child profile was not found.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.api.getChild(childId).subscribe({
      next: (child) => {
        this.child.set(child);
        this.patchForm(child);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Child profile could not be loaded.');
        this.loading.set(false);
      },
    });

    this.loadingScreening.set(true);
    this.screeningApi.listSessions(childId).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        const completed = sessions.find((s) => s.result !== null);
        this.latestRiskLevel.set(completed?.result?.riskLevel ?? null);
        this.loadingScreening.set(false);
      },
      error: () => {
        this.sessions.set([]);
        this.latestRiskLevel.set(null);
        this.loadingScreening.set(false);
      },
    });
  }

  save() {
    const child = this.child();
    if (!child) return;

    this.saveError.set(null);
    this.saveMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .updateChild(child.id, {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim() || undefined,
        dateOfBirth: value.dateOfBirth,
        address: value.address.trim() || undefined,
        notes: value.notes.trim() || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.child.set(updated);
          this.patchForm(updated);
          this.saveMessage.set('Child profile saved.');
          this.saving.set(false);
        },
        error: () => {
          this.saveError.set('Child profile could not be saved.');
          this.saving.set(false);
        },
      });
  }

  resetForm() {
    const child = this.child();
    if (child) this.patchForm(child);
    this.saveError.set(null);
    this.saveMessage.set(null);
  }

  confirmArchive() {
    const child = this.child();
    if (!child) return;
    this.archiving.set(true);
    this.api.archiveChild(child.id).subscribe({
      next: () => {
        this.archiving.set(false);
        this.showArchiveConfirm.set(false);
        void this.router.navigateByUrl('/children');
      },
      error: () => {
        this.archiving.set(false);
        this.showArchiveConfirm.set(false);
        this.saveError.set('Child profile could not be archived.');
      },
    });
  }

  restore() {
    const child = this.child();
    if (!child) return;
    this.restoring.set(true);
    this.saveError.set(null);
    this.saveMessage.set(null);
    this.api.restoreChild(child.id).subscribe({
      next: (updated) => {
        this.child.set(updated);
        this.patchForm(updated);
        this.restoring.set(false);
        this.saveMessage.set('Child profile has been restored.');
      },
      error: () => {
        this.restoring.set(false);
        this.saveError.set('Child profile could not be restored.');
      },
    });
  }

  fullName(child: ChildResponse): string {
    return [child.firstName, child.lastName].filter(Boolean).join(' ');
  }

  initials(child: ChildResponse): string {
    const parts = [child.firstName, child.lastName].filter(Boolean) as string[];
    const [first, second] = parts;
    if (first && second) {
      return (first.charAt(0) + second.charAt(0)).toUpperCase();
    }
    return child.firstName.slice(0, 2).toUpperCase();
  }

  getAvatarGradient(child: ChildResponse): string {
    const gradients = [
      'linear-gradient(135deg, var(--ac-color-teal-slate), var(--ac-color-sky-soft))',
      'linear-gradient(135deg, var(--ac-color-olive-mid), var(--ac-color-olive-light))',
      'linear-gradient(135deg, var(--ac-color-status-purple), var(--ac-color-tint-blue-mist))',
      'linear-gradient(135deg, var(--ac-color-accent-amber), var(--ac-color-tint-blue))',
    ];
    const key = child.id || child.firstName;
    const index = key.charCodeAt(0) % gradients.length;
    return gradients[index];
  }

  ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (today.getDate() < birthDate.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years <= 0 && months <= 0) return 'Newborn';
    if (years <= 0) return `${months} ${months === 1 ? 'month' : 'months'} old`;
    if (months === 0) return years === 1 ? '1 year old' : `${years} years old`;
    return `${years} ${years === 1 ? 'yr' : 'yrs'} ${months} ${months === 1 ? 'mo' : 'mos'} old`;
  }

  riskTone(risk: RiskLevel | null): 'positive' | 'caution' | 'alert' | 'neutral' {
    if (risk === 'LOW') return 'positive';
    if (risk === 'MODERATE') return 'caution';
    if (risk === 'HIGH') return 'alert';
    return 'neutral';
  }

  riskLabel(risk: RiskLevel | null): string {
    if (risk === 'LOW') return 'Low Risk';
    if (risk === 'MODERATE') return 'Moderate Risk';
    if (risk === 'HIGH') return 'High Risk';
    return 'Not Screened';
  }

  private patchForm(child: ChildResponse) {
    this.form.setValue({
      firstName: child.firstName,
      lastName: child.lastName ?? '',
      dateOfBirth: child.dateOfBirth,
      address: child.address ?? '',
      notes: child.notes ?? '',
    });
    this.form.markAsPristine();
  }
}
