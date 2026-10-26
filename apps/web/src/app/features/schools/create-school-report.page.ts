import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ActivityReportDetailResponse } from '@auticare/contracts';
import { SchoolsApi, type EnrolledStudentOption } from './data-access/schools.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';
import { attachmentUrl } from '../../core/config/attachment-url';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { I18nService } from '../../core/i18n/i18n.service';

/** A file that has been accepted but not yet uploaded to the server. */
export interface PendingFile {
  file: File;
  previewUrl: string | null; // object URL for image previews; null for docs
  uploading: boolean;
  uploadedUrl: string | null; // server path, e.g. /uploads/activity-reports/<uuid>.jpg
}

export interface DomainOption {
  id: string;
  name: string;
  categoryValue: string;
  icon: string;
  description: string;
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    SchoolTopbarComponent,
    UiFieldComponent,
    AccessibleFormDirective,
  ],
  template: `
    <div class="create-report-container">
      <ac-school-topbar />

      <!-- Breadcrumbs -->
      <nav class="breadcrumbs" aria-label="Breadcrumb navigation">
        <a class="breadcrumb-link" routerLink="/schools/reports">Activity Reports</a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">{{ selectedChild()?.firstName ?? 'Student' }}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">{{
          editMode() ? 'Edit Observation Report' : 'New Observation Report'
        }}</span>
      </nav>

      <!-- Page Header -->
      <header class="report-header">
        <div class="report-header-titles">
          <div class="header-badge-row">
            <span class="header-badge">Clinical Observation</span>
            <span class="header-badge-sub">{{
              editMode() ? 'Editing Mode' : 'Authoring Mode'
            }}</span>
          </div>
          <h1>
            {{
              editMode() ? 'Edit Activity & Observation Report' : 'Create Clinical Activity Report'
            }}
          </h1>
          <p class="header-sub">
            Document developmental observations, sensory milestones, and home recommendations.
          </p>
        </div>
        <div class="header-actions">
          <div
            class="status-indicator-badge"
            [class.draft]="targetStatus() === 'DRAFT'"
            [class.published]="targetStatus() === 'SUBMITTED'"
          >
            <span class="status-dot"></span>
            <span>{{ targetStatus() === 'DRAFT' ? '📝 Draft Mode' : '🚀 Publish Ready' }}</span>
          </div>
          <div class="publish-mode-toggle" role="group" aria-label="Report publication mode">
            <button
              type="button"
              class="mode-toggle-btn"
              [class.active]="targetStatus() === 'DRAFT'"
              (click)="targetStatus.set('DRAFT')"
            >
              📝 Draft
            </button>
            <button
              type="button"
              class="mode-toggle-btn"
              [class.active]="targetStatus() === 'SUBMITTED'"
              (click)="targetStatus.set('SUBMITTED')"
            >
              🚀 Publish
            </button>
          </div>
          <a class="btn-cancel" routerLink="/schools/reports">Cancel</a>
          <button type="button" class="btn-save-draft" (click)="saveDraft()" [disabled]="saving()">
            {{ saving() && targetStatus() === 'DRAFT' ? 'Saving…' : 'Save Draft' }}
          </button>
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" acAccessibleForm novalidate>
        <!-- Student Selector & Profile Card -->
        <div class="profile-section-card">
          <div class="selector-row">
            <ac-ui-field
              label="Select enrolled student"
              [required]="true"
              [error]="showError('childId') ? 'Select an enrolled student.' : null"
            >
              <select formControlName="childId" class="child-select" [disabled]="loadingStudents()">
                @if (loadingStudents()) {
                  <option value="" disabled>Loading students…</option>
                } @else {
                  <option value="" disabled>Choose student from active roster</option>
                }
                @for (student of students(); track student.id) {
                  <option [value]="student.id">
                    {{ student.firstName }} {{ student.lastName }}
                  </option>
                }
              </select>
            </ac-ui-field>

            <ac-ui-field
              label="Activity session date"
              [required]="true"
              [error]="showError('activityDate') ? 'Select activity date.' : null"
            >
              <input
                type="date"
                formControlName="activityDate"
                class="activity-date-input"
                aria-label="Activity session date"
              />
            </ac-ui-field>

            @if (studentsError()) {
              <span class="selector-error">{{ studentsError() }}</span>
            }
          </div>

          @if (selectedChild(); as child) {
            <div class="student-profile-info">
              <div class="student-avatar-container">
                @if (child.photoUrl) {
                  <img
                    [src]="child.photoUrl"
                    alt="{{ child.firstName }}"
                    class="student-avatar-img"
                  />
                } @else {
                  <span class="student-avatar-large">{{ child.firstName.charAt(0) }}</span>
                }
              </div>
              <div class="student-meta-block">
                <span class="student-name-title">{{ child.firstName }} {{ child.lastName }}</span>
                <span class="student-id-subtitle">Student ID: #{{ child.id.slice(0, 8) }}</span>
              </div>

              <div class="student-detail-group">
                <div class="detail-item">
                  <span class="detail-label">AGE</span>
                  <span class="detail-value">{{ child.age }} yrs</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">DATE OF BIRTH</span>
                  <span class="detail-value">{{ child.dateOfBirth }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">ENROLLED SINCE</span>
                  <span class="detail-value">{{ child.startDate }}</span>
                </div>
              </div>

              <div class="student-status-badge">
                <span class="status-dot"></span>
                Status: {{ child.enrollmentStatus }}
              </div>
            </div>
          } @else if (!loadingStudents()) {
            <p class="no-student-hint">
              Select a student above to review their active developmental profile.
            </p>
          }
        </div>

        <!-- Developmental Domain Checkboxes Section -->
        <div class="form-section domains-section">
          <h2><span class="section-icon">🎯</span> Developmental Domains Observed</h2>
          <p class="section-hint">
            Select all therapeutic domains targeted or observed during this activity session:
          </p>

          <div class="domain-checkboxes-grid">
            @for (domain of domainList; track domain.id) {
              <button
                type="button"
                class="domain-check-card"
                [class.checked]="isDomainSelected(domain.id)"
                (click)="toggleDomain(domain)"
                [attr.aria-pressed]="isDomainSelected(domain.id)"
              >
                <div class="domain-card-header">
                  <span class="domain-check-icon">{{
                    isDomainSelected(domain.id) ? '☑' : '☐'
                  }}</span>
                  <span class="domain-icon">{{ domain.icon }}</span>
                  <span class="domain-title">{{ domain.name }}</span>
                </div>
                <p class="domain-desc">{{ domain.description }}</p>
              </button>
            }
          </div>
        </div>

        <!-- Main Form Grid -->
        <div class="report-grid">
          <!-- Left Column -->
          <div class="grid-left">
            <!-- 1. Activity Details -->
            <div class="form-section">
              <h2><span class="section-icon">📝</span> 1. Activity Details</h2>
              <div class="row-2-col">
                <ac-ui-field
                  label="Primary developmental category"
                  [required]="true"
                  [error]="showError('category') ? 'Select an activity category.' : null"
                >
                  <select formControlName="category">
                    <option value="" disabled selected>Select category</option>
                    @for (cat of categories; track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </ac-ui-field>
                <ac-ui-field
                  label="Session duration (minutes)"
                  [required]="true"
                  [error]="showError('duration') ? 'Enter duration (min 1).' : null"
                >
                  <input type="number" formControlName="duration" placeholder="e.g. 45" />
                </ac-ui-field>
              </div>
              <ac-ui-field
                label="Activity title / intervention name"
                [required]="true"
                [full]="true"
                [error]="showError('activityName') ? 'Enter an activity name.' : null"
              >
                <input
                  type="text"
                  formControlName="activityName"
                  placeholder="e.g. Cooperative Block Building & Sensory Sand Play"
                />
              </ac-ui-field>
            </div>

            <!-- 2. Teacher Observations with Prompt Guidance -->
            <div class="form-section">
              <div class="section-header-flex">
                <h2><span class="section-icon">👁️</span> 2. Teacher & Clinical Observations</h2>
                <span class="char-count"
                  >{{ form.controls.teacherObservations.value.length }} / 4,000</span
                >
              </div>
              <p class="section-hint">Click a prompt below to insert helpful starter notes:</p>
              <div class="prompt-chips-row">
                <button
                  type="button"
                  class="prompt-chip"
                  (click)="insertPrompt('teacherObservations', '• Academic focus & milestone: ')"
                >
                  + Academic focus
                </button>
                <button
                  type="button"
                  class="prompt-chip"
                  (click)="
                    insertPrompt(
                      'teacherObservations',
                      currentLang() === 'km'
                        ? '• ការសម្របសម្រួលញាណដឹង៖ '
                        : '• Sensory accommodation used: '
                    )
                  "
                >
                  {{
                    currentLang() === 'km' ? '+ ការសម្របសម្រួលញាណដឹង' : '+ Sensory accommodation'
                  }}
                </button>
                <button
                  type="button"
                  class="prompt-chip"
                  (click)="
                    insertPrompt(
                      'teacherObservations',
                      currentLang() === 'km'
                        ? '• ភាពរីកចម្រើនក្នុងទំនាក់ទំនងសង្គម៖ '
                        : '• Social breakthrough observed: '
                    )
                  "
                >
                  {{
                    currentLang() === 'km'
                      ? '+ ភាពរីកចម្រើនក្នុងទំនាក់ទំនងសង្គម'
                      : '+ Social breakthrough'
                  }}
                </button>
                <button
                  type="button"
                  class="prompt-chip"
                  (click)="
                    insertPrompt(
                      'teacherObservations',
                      currentLang() === 'km'
                        ? '• ភាពជោគជ័យក្នុងការប្រាស្រ័យទាក់ទង៖ '
                        : '• Communication win & gestures: '
                    )
                  "
                >
                  {{
                    currentLang() === 'km'
                      ? '+ ភាពជោគជ័យក្នុងការប្រាស្រ័យទាក់ទង'
                      : '+ Communication win'
                  }}
                </button>
                <button
                  type="button"
                  class="prompt-chip"
                  (click)="insertPrompt('teacherObservations', '• Regulation trigger & response: ')"
                >
                  + Emotional trigger
                </button>
              </div>

              <ac-ui-field
                label="Clinical observation notes"
                [required]="true"
                [error]="
                  showError('teacherObservations') ? 'Enter detailed observation notes.' : null
                "
              >
                <textarea
                  formControlName="teacherObservations"
                  rows="6"
                  placeholder="Describe how the student engaged with the activity, notable breakthroughs, regulation strategies, or peer interactions..."
                ></textarea>
              </ac-ui-field>
            </div>

            <!-- 3. Parent Recommendations -->
            <div class="form-section">
              <div class="section-header-flex">
                <h2><span class="section-icon">💡</span> 3. Home & Parent Recommendations</h2>
                <span class="char-count"
                  >{{ form.controls.parentRecommendations.value.length }} / 4,000</span
                >
              </div>
              <p class="section-hint">
                Provide actionable, encouraging steps for caregivers to practice at home:
              </p>
              <div class="prompt-chips-row">
                <button
                  type="button"
                  class="prompt-chip"
                  (click)="insertPrompt('parentRecommendations', '• Home practice activity: ')"
                >
                  + Home activity
                </button>
                <button
                  type="button"
                  class="prompt-chip"
                  (click)="insertPrompt('parentRecommendations', '• Sensory soothing routine: ')"
                >
                  + Soothing routine
                </button>
                <button
                  type="button"
                  class="prompt-chip"
                  (click)="insertPrompt('parentRecommendations', '• Positive reinforcement tip: ')"
                >
                  + Reinforcement tip
                </button>
              </div>

              <ac-ui-field
                label="Recommendations for home practice"
                [required]="true"
                [error]="
                  showError('parentRecommendations') ? 'Enter recommendations for parents.' : null
                "
              >
                <textarea
                  formControlName="parentRecommendations"
                  rows="5"
                  placeholder="Actionable steps for parents to reinforce these developmental skills in daily home routines..."
                ></textarea>
              </ac-ui-field>
            </div>
          </div>

          <!-- Right Column -->
          <div class="grid-right">
            <!-- 4. Performance Metrics -->
            <div class="form-section performance-section">
              <div class="section-header-flex">
                <h2><span class="section-icon">📊</span> 4. Performance Scoring</h2>
                <span class="scale-badge">0–10 SCALE</span>
              </div>

              <div class="metrics-list">
                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Participation & Engagement</span>
                    <span class="metric-value">{{ form.controls.participation.value }}/10</span>
                  </div>
                  <input
                    aria-label="Participation rating, 0 to 10"
                    type="range"
                    required
                    min="0"
                    max="10"
                    formControlName="participation"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Communication & Speech</span>
                    <span class="metric-value">{{ form.controls.communication.value }}/10</span>
                  </div>
                  <input
                    aria-label="Communication rating, 0 to 10"
                    type="range"
                    required
                    min="0"
                    max="10"
                    formControlName="communication"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Social & Peer Interaction</span>
                    <span class="metric-value">{{ form.controls.socialInteraction.value }}/10</span>
                  </div>
                  <input
                    aria-label="Social interaction rating, 0 to 10"
                    type="range"
                    required
                    min="0"
                    max="10"
                    formControlName="socialInteraction"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Attention & Focus</span>
                    <span class="metric-value">{{ form.controls.attention.value }}/10</span>
                  </div>
                  <input
                    aria-label="Attention rating, 0 to 10"
                    type="range"
                    required
                    min="0"
                    max="10"
                    formControlName="attention"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Emotional Regulation</span>
                    <span class="metric-value"
                      >{{ form.controls.emotionalRegulation.value }}/10</span
                    >
                  </div>
                  <input
                    aria-label="Emotional regulation rating, 0 to 10"
                    type="range"
                    required
                    min="0"
                    max="10"
                    formControlName="emotionalRegulation"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Task Completion & Persistence</span>
                    <span class="metric-value">{{ form.controls.taskCompletion.value }}/10</span>
                  </div>
                  <input
                    aria-label="Task completion rating, 0 to 10"
                    type="range"
                    required
                    min="0"
                    max="10"
                    formControlName="taskCompletion"
                    class="custom-slider"
                  />
                </div>
              </div>
            </div>

            <!-- 5. Supporting Attachments & Photos -->
            <div class="form-section photos-section">
              <h2><span class="section-icon">📷</span> 5. Activity Photos & Work Samples</h2>

              <label
                class="upload-dragzone"
                for="activity-attachments"
                (dragover)="$event.preventDefault()"
                (drop)="onFileDrop($event)"
              >
                <span class="upload-cloud-icon">📥</span>
                <p class="upload-main-text">
                  Drag & drop files or <span class="browse-btn">browse files</span>
                </p>
                <p class="upload-sub-text">JPG, PNG, PDF, Word, text, CSV — up to 10MB each</p>
              </label>
              <input
                id="activity-attachments"
                aria-label="Choose files to attach"
                #fileInput
                class="visually-hidden-file"
                type="file"
                accept="image/jpeg,image/jpg,image/png,.pdf,.doc,.docx,.txt,.csv"
                multiple
                (change)="onFilesSelected($event)"
              />

              @if (uploadError()) {
                <p class="upload-error">{{ uploadError() }}</p>
              }

              @if (pendingFiles().length > 0) {
                <div class="photo-previews-row">
                  @for (item of pendingFiles(); track $index; let i = $index) {
                    <div class="preview-box">
                      @if (item.previewUrl) {
                        <img
                          [src]="item.previewUrl"
                          class="preview-image"
                          alt="Attachment preview"
                        />
                      } @else {
                        <div class="preview-doc">
                          <span class="preview-doc-icon">📄</span>
                          <span class="preview-doc-name">{{ item.file.name }}</span>
                        </div>
                      }
                      @if (item.uploading) {
                        <div class="preview-overlay">
                          <span class="spinner"></span>
                        </div>
                      } @else if (item.uploadedUrl) {
                        <span class="preview-uploaded" title="Uploaded">✓</span>
                      }
                      <button
                        type="button"
                        class="remove-photo-btn"
                        (click)="removeFile(i)"
                        [disabled]="item.uploading"
                        aria-label="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              } @else {
                <div class="photo-previews-row">
                  <div class="preview-box-empty">
                    <span class="preview-icon">🖼️</span>
                  </div>
                  <div class="preview-box-empty">
                    <span class="preview-icon">🖼️</span>
                  </div>
                  <div class="preview-box-empty">
                    <span class="preview-icon">🖼️</span>
                  </div>
                </div>
              }

              @for (url of existingPhotoUrls(); track url; let i = $index) {
                <div class="existing-attachment">
                  <a [href]="attachmentHref(url)" target="_blank" rel="noopener">{{
                    fileNameOf(url)
                  }}</a>
                  <button
                    type="button"
                    class="remove-photo-btn"
                    (click)="removeExistingPhoto(i)"
                    aria-label="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Alert messages -->
        @if (error()) {
          <div class="alert-message error" role="alert">
            <span class="alert-icon">⚠️</span>
            <span>{{ error() }}</span>
          </div>
        }
        @if (message()) {
          <div class="alert-message success" role="status">
            <span class="alert-icon">✅</span>
            <span>{{ message() }}</span>
          </div>
        }

        <!-- Sticky Footer -->
        <footer class="sticky-footer">
          <div class="footer-content">
            <div class="footer-left">
              <span class="autosave-text">{{ footerStatus() }}</span>
              <!-- Draft vs Submit Toggle -->
              <div class="publish-mode-toggle" role="group" aria-label="Report submission mode">
                <button
                  type="button"
                  class="mode-toggle-btn"
                  [class.active]="targetStatus() === 'DRAFT'"
                  (click)="targetStatus.set('DRAFT')"
                >
                  📝 Draft Mode
                </button>
                <button
                  type="button"
                  class="mode-toggle-btn"
                  [class.active]="targetStatus() === 'SUBMITTED'"
                  (click)="targetStatus.set('SUBMITTED')"
                >
                  🚀 Publish to Parents
                </button>
              </div>
            </div>

            <div class="footer-actions">
              <button
                type="button"
                class="btn-footer-save"
                (click)="saveDraft()"
                [disabled]="saving()"
              >
                {{ saving() && targetStatus() === 'DRAFT' ? 'Saving…' : 'Save as Draft' }}
              </button>
              <button type="submit" class="btn-footer-submit" [disabled]="saving()">
                {{
                  saving()
                    ? editMode()
                      ? 'Updating…'
                      : 'Submitting…'
                    : targetStatus() === 'DRAFT'
                      ? 'Save Draft Report'
                      : editMode()
                        ? 'Update & Publish'
                        : 'Submit Report'
                }}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  `,
  styles: [
    `
      .create-report-container {
        padding-bottom: 120px;
        color: var(--ac-color-text-strong);
      }

      /* Breadcrumbs */
      .breadcrumbs {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--ac-color-text-slate);
        margin-bottom: 16px;
      }
      .breadcrumb-link {
        color: var(--ac-color-action-alt);
        text-decoration: none;
        font-weight: 600;
      }
      .breadcrumb-link:hover {
        text-decoration: underline;
      }
      .breadcrumb-separator {
        color: var(--ac-color-border-slate);
      }
      .breadcrumb-item.active {
        color: var(--ac-color-text-slate-strong);
        font-weight: 700;
      }

      /* Header */
      .report-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        gap: 16px;
        flex-wrap: wrap;
      }
      .header-badge-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
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
      .report-header h1 {
        margin: 0;
        font-size: var(--ac-type-page-title);
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
        letter-spacing: -0.02em;
      }
      .header-sub {
        margin: 4px 0 0;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }
      .header-actions {
        display: flex;
        gap: 10px;
      }
      .btn-cancel {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 10px 18px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        color: var(--ac-color-text-slate);
        font-weight: 600;
        font-size: 13.5px;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-cancel:hover {
        background: var(--ac-color-surface-slate);
        border-color: var(--ac-color-slate-400);
      }
      .btn-save-draft {
        padding: 10px 18px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        color: var(--ac-color-action-alt);
        font-weight: 700;
        font-size: 13.5px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .btn-save-draft:hover {
        background: var(--ac-color-tint-blue-wash);
      }
      .btn-save-draft:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .status-indicator-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }
      .status-indicator-badge.draft {
        background: var(--ac-color-amber-tint-100);
        color: var(--ac-color-amber-600);
        border: 1px solid var(--ac-color-amber-border-soft);
      }
      .status-indicator-badge.published {
        background: var(--ac-color-green-100);
        color: var(--ac-color-emerald-600);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      /* Profile section card */
      .profile-section-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: var(--ac-shadow-sm);
      }
      .selector-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--ac-color-slate-100);
      }
      .child-select,
      .activity-date-input {
        padding: 8px 16px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        background: var(--ac-color-surface);
        font-size: 14px;
        font-weight: 500;
        outline: none;
        cursor: pointer;
        color: var(--ac-color-text-slate-strong);
      }
      .child-select:focus,
      .activity-date-input:focus {
        border-color: var(--ac-color-action-alt);
      }
      .selector-error {
        font-size: 12px;
        color: var(--ac-color-alert-slate);
        font-weight: 600;
      }
      .no-student-hint {
        margin: 0;
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }

      /* Profile info grid */
      .student-profile-info {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        align-items: center;
        gap: 20px;
      }
      .student-avatar-container {
        width: 56px;
        height: 56px;
        background: var(--ac-color-tint-blue-mist);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .student-avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .student-avatar-large {
        font-size: 22px;
        font-weight: 800;
        color: var(--ac-color-action-alt);
      }
      .student-meta-block {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .student-name-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }
      .student-id-subtitle {
        font-size: 12px;
        color: var(--ac-color-text-slate);
        font-weight: 500;
      }
      .student-detail-group {
        display: flex;
        gap: 28px;
        border-left: 1px solid var(--ac-color-border-slate);
        padding-left: 28px;
      }
      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .detail-label {
        font-size: 10.5px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        letter-spacing: 0.05em;
      }
      .detail-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }
      .student-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        background: var(--ac-color-green-100);
        border-radius: 9999px;
        color: var(--ac-color-emerald-800);
        font-size: 12.5px;
        font-weight: 700;
      }
      .status-dot {
        width: 7px;
        height: 7px;
        background: var(--ac-color-emerald-600);
        border-radius: 50%;
      }

      /* Domains Section Checkboxes */
      .domains-section {
        margin-bottom: 24px;
      }
      .section-hint {
        margin: 0 0 14px 0;
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }
      .domain-checkboxes-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .domain-check-card {
        padding: 14px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        background: var(--ac-color-surface);
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: all 0.15s ease;
      }
      .domain-check-card:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
      }
      .domain-check-card.checked {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-blue-tint-pure);
        box-shadow: 0 0 0 1px var(--ac-color-action-alt);
      }
      .domain-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .domain-check-icon {
        font-size: 16px;
        color: var(--ac-color-action-alt);
      }
      .domain-icon {
        font-size: 16px;
      }
      .domain-title {
        font-size: 13.5px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }
      .domain-desc {
        margin: 0;
        font-size: 12px;
        color: var(--ac-color-text-slate);
        line-height: 1.4;
      }

      /* Form Grid */
      .report-grid {
        display: grid;
        grid-template-columns: 3fr 2fr;
        gap: 24px;
      }
      .grid-left,
      .grid-right {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* Card Section Styling */
      .form-section {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        padding: 22px;
        box-shadow: var(--ac-shadow-sm);
      }
      .form-section h2 {
        margin: 0 0 16px 0;
        font-size: 16.5px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-icon {
        font-size: 18px;
      }

      /* Prompt guidance chips */
      .prompt-chips-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .prompt-chip {
        padding: 4px 10px;
        background: var(--ac-color-tint-blue-mist);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 999px;
        color: var(--ac-color-action-alt);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .prompt-chip:hover {
        background: var(--ac-color-tint-blue-wash);
      }
      .chip-km {
        font-weight: 700;
      }
      .chip-en {
        font-size: 0.9em;
        opacity: 0.85;
      }
      .char-count {
        font-size: 11.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
      }

      /* Fields layout */
      .row-2-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }
      .form-section input[type='text'],
      .form-section input[type='number'],
      .form-section select,
      .form-section textarea {
        padding: 10px 14px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 13.5px;
        outline: none;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
      }
      .form-section input:focus,
      .form-section select:focus,
      .form-section textarea:focus {
        border-color: var(--ac-color-action-alt);
      }
      .form-section textarea {
        width: 100%;
        box-sizing: border-box;
        font-family: inherit;
        resize: vertical;
      }

      /* Performance Section */
      .section-header-flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .section-header-flex h2 {
        margin-bottom: 0;
      }
      .scale-badge {
        font-size: 11px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        background: var(--ac-color-slate-100);
        padding: 3px 8px;
        border-radius: 6px;
      }
      .metrics-list {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .metric-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .metric-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }
      .metric-value {
        font-size: 13px;
        font-weight: 800;
        color: var(--ac-color-action-alt);
      }
      .custom-slider {
        -webkit-appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--ac-color-border-slate);
        outline: none;
        margin: 4px 0;
      }
      .custom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--ac-color-action-alt);
        cursor: pointer;
        transition: transform 0.1s;
      }
      .custom-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
      }

      /* Attachment upload */
      .upload-dragzone {
        border: 2px dashed var(--ac-color-border-slate);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--ac-color-surface-slate);
        margin-bottom: 14px;
      }
      .upload-dragzone:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
      }
      .visually-hidden-file {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .upload-cloud-icon {
        font-size: 28px;
        margin-bottom: 6px;
        display: block;
      }
      .upload-main-text {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
        margin: 0 0 3px 0;
      }
      .browse-btn {
        color: var(--ac-color-action-alt);
        text-decoration: underline;
      }
      .upload-sub-text {
        font-size: 11px;
        color: var(--ac-color-text-slate);
        margin: 0;
      }
      .upload-error {
        margin: 0 0 10px 0;
        font-size: 12px;
        color: var(--ac-color-alert-slate);
        font-weight: 600;
      }
      .photo-previews-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .preview-box {
        aspect-ratio: 1;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        background: var(--ac-color-surface-slate);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .preview-doc {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 6px;
        text-align: center;
      }
      .preview-doc-icon {
        font-size: 20px;
      }
      .preview-doc-name {
        font-size: 9px;
        color: var(--ac-color-text-slate);
        word-break: break-all;
        max-height: 2.6em;
        overflow: hidden;
      }
      .preview-overlay {
        position: absolute;
        inset: 0;
        background: var(--ac-color-surface);
        opacity: 0.85;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 3px solid var(--ac-color-border-slate);
        border-top-color: var(--ac-color-action-alt);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .preview-uploaded {
        position: absolute;
        left: 4px;
        bottom: 4px;
        width: 18px;
        height: 18px;
        background: var(--ac-color-emerald-600);
        color: var(--ac-color-text-on-action);
        border-radius: 50%;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .remove-photo-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 28px;
        height: 28px;
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: 50%;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .preview-box-empty {
        aspect-ratio: 1;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        background: var(--ac-color-surface-slate);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ac-color-border-slate);
      }
      .preview-icon {
        font-size: 22px;
      }
      .existing-attachment {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 10px;
        background: var(--ac-color-surface-slate);
        border-radius: 6px;
        font-size: 12px;
        margin-top: 8px;
      }

      /* Alert messages */
      .alert-message {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 13.5px;
        margin-top: 20px;
      }
      .alert-message.error {
        background: var(--ac-color-red-50);
        color: var(--ac-color-alert-strong);
        border: 1px solid var(--ac-color-red-border);
      }
      .alert-message.success {
        background: var(--ac-color-green-50);
        color: var(--ac-color-emerald-800);
        border: 1px solid var(--ac-color-green-border-soft);
      }
      .alert-icon {
        font-size: 16px;
      }

      /* Sticky footer */
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 292px;
        right: 0;
        background: var(--ac-color-surface);
        border-top: 1px solid var(--ac-color-border-slate);
        padding: 14px 48px;
        box-shadow: var(--ac-shadow-lg);
        z-index: 10;
      }
      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }
      .footer-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .autosave-text {
        font-size: 12.5px;
        font-weight: 500;
        color: var(--ac-color-text-slate);
      }
      .publish-mode-toggle {
        display: inline-flex;
        background: var(--ac-color-slate-100);
        padding: 3px;
        border-radius: 8px;
        border: 1px solid var(--ac-color-border-slate);
      }
      .mode-toggle-btn {
        padding: 6px 12px;
        border: none;
        background: none;
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .mode-toggle-btn.active {
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        box-shadow: var(--ac-shadow-xs);
      }
      .footer-actions {
        display: flex;
        gap: 12px;
      }
      .btn-footer-save {
        padding: 10px 20px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        color: var(--ac-color-text-slate-strong);
        font-weight: 600;
        font-size: 13.5px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-footer-save:hover {
        background: var(--ac-color-surface-slate);
      }
      .btn-footer-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-footer-submit {
        padding: 10px 24px;
        background: var(--ac-color-action-alt);
        border: none;
        border-radius: 10px;
        color: var(--ac-color-text-on-action);
        font-weight: 700;
        font-size: 13.5px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .btn-footer-submit:hover {
        background: var(--ac-color-ink-a);
      }
      .btn-footer-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 960px) {
        .report-grid {
          grid-template-columns: 1fr;
        }
        .domain-checkboxes-grid {
          grid-template-columns: 1fr;
        }
        .student-profile-info {
          grid-template-columns: auto 1fr;
        }
        .student-detail-group {
          border-left: none;
          padding-left: 0;
          grid-column: 1 / span 2;
        }
        .student-status-badge {
          grid-column: 1 / span 2;
        }
      }

      @media (max-width: 860px) {
        .sticky-footer {
          left: 0;
          padding: 14px 20px;
        }
        .footer-content {
          flex-direction: column;
          align-items: stretch;
        }
        .footer-left {
          justify-content: space-between;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSchoolReportPage implements OnInit {
  private readonly api = inject(SchoolsApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);
  readonly currentLang = this.i18n.currentLang;

  readonly reportId = signal<string | null>(null);
  readonly editMode = computed(() => this.reportId() !== null);
  readonly existingPhotoUrls = signal<string[]>([]);
  private readonly editingReport = signal<ActivityReportDetailResponse | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly students = signal<EnrolledStudentOption[]>([]);
  readonly loadingStudents = signal(true);
  readonly studentsError = signal<string | null>(null);
  /** Files picked but not yet on the server. Uploaded URLs live in each item. */
  readonly pendingFiles = signal<PendingFile[]>([]);
  readonly uploadError = signal<string | null>(null);

  /** Submission Mode toggle: 'DRAFT' vs 'SUBMITTED' */
  readonly targetStatus = signal<'DRAFT' | 'SUBMITTED'>('SUBMITTED');

  readonly domainList: DomainOption[] = [
    {
      id: 'social',
      name: 'Social Interaction & Play',
      categoryValue: 'Social/Emotional',
      icon: '🤝',
      description: 'Peer engagement, turn-taking, joint attention, empathy',
    },
    {
      id: 'sensory',
      name: 'Sensory Processing & Regulation',
      categoryValue: 'Sensory/Motor',
      icon: '🌈',
      description: 'Tactile, auditory, vestibular coping, sensory soothing',
    },
    {
      id: 'communication',
      name: 'Communication & Speech',
      categoryValue: 'Language/Communication',
      icon: '💬',
      description: 'Verbal/non-verbal communication, gestures, vocabulary',
    },
    {
      id: 'motor',
      name: 'Motor & Physical Skills',
      categoryValue: 'Sensory/Motor',
      icon: '🏃',
      description: 'Fine motor precision, gross motor coordination',
    },
    {
      id: 'cognitive',
      name: 'Cognitive & Academic Focus',
      categoryValue: 'Cognitive/Developmental',
      icon: '🧩',
      description: 'Problem solving, task persistence, sequential memory & academic skills',
    },
    {
      id: 'adaptive',
      name: 'Adaptive & Daily Routine',
      categoryValue: 'Adaptive/Self-Care',
      icon: '🌱',
      description: 'Transitions, self-care routines, emotional flexibility',
    },
  ];

  readonly selectedDomainIds = signal<string[]>(['social', 'communication']);

  readonly categories = [
    'Cognitive/Developmental',
    'Sensory/Motor',
    'Social/Emotional',
    'Language/Communication',
    'Adaptive/Self-Care',
  ];

  readonly form = this.fb.nonNullable.group({
    childId: ['', [Validators.required]],
    activityDate: [new Date().toISOString().slice(0, 10), [Validators.required]],
    category: ['Social/Emotional', [Validators.required]],
    duration: [45, [Validators.required, Validators.min(1)]],
    activityName: ['', [Validators.required, Validators.maxLength(160)]],
    teacherObservations: ['', [Validators.required, Validators.maxLength(4000)]],
    parentRecommendations: ['', [Validators.required, Validators.maxLength(4000)]],
    participation: [5, [Validators.required]],
    communication: [5, [Validators.required]],
    socialInteraction: [5, [Validators.required]],
    attention: [5, [Validators.required]],
    emotionalRegulation: [5, [Validators.required]],
    taskCompletion: [5, [Validators.required]],
  });

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  readonly selectedChildId = signal('');
  readonly selectedChild = computed(() => {
    const childId = this.selectedChildId() || this.form.controls.childId.value;
    const list = this.students();
    return list.find((s) => s.id === childId || s.childId === childId) || null;
  });

  readonly footerStatus = computed(() => {
    const files = this.pendingFiles();
    const uploading = files.filter((f) => f.uploading).length;
    const uploaded = files.filter((f) => f.uploadedUrl).length;
    if (uploading > 0) return `Uploading ${uploading} file${uploading === 1 ? '' : 's'}…`;
    if (uploaded > 0) return `${uploaded} file${uploaded === 1 ? '' : 's'} attached`;
    return 'Ready to save';
  });

  isDomainSelected(id: string): boolean {
    return this.selectedDomainIds().includes(id);
  }

  toggleDomain(domain: DomainOption) {
    this.selectedDomainIds.update((current) => {
      const exists = current.includes(domain.id);
      const next = exists ? current.filter((x) => x !== domain.id) : [...current, domain.id];
      // Automatically keep primary category aligned with active selection
      if (!exists && domain.categoryValue) {
        this.form.controls.category.setValue(domain.categoryValue);
      }
      return next;
    });
  }

  insertPrompt(controlName: 'teacherObservations' | 'parentRecommendations', promptText: string) {
    const ctrl = this.form.controls[controlName];
    const current = ctrl.value.trim();
    const updated = current ? `${current}\n${promptText}` : promptText;
    ctrl.setValue(updated);
    ctrl.markAsDirty();
  }

  ngOnInit() {
    this.form.controls.childId.valueChanges.subscribe((id) => this.selectedChildId.set(id));
    this.loadStudents();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.reportId.set(id);
      this.api.getActivityReportById(id).subscribe({
        next: (report) => {
          this.editingReport.set(report);
          const metrics =
            report.performanceMetrics && typeof report.performanceMetrics === 'object'
              ? (report.performanceMetrics as Record<string, unknown>)
              : {};
          this.form.patchValue({
            childId: report.childId,
            activityDate: report.activityDate
              ? report.activityDate.slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            category: report.activityCategory,
            duration: report.duration ?? 45,
            activityName: report.title,
            teacherObservations: report.teacherObservation ?? '',
            parentRecommendations: report.recommendations ?? '',
            participation: this.metricValue(metrics, 'participation'),
            communication: this.metricValue(metrics, 'communication'),
            socialInteraction: this.metricValue(metrics, 'socialInteraction'),
            attention: this.metricValue(metrics, 'attention'),
            emotionalRegulation: this.metricValue(metrics, 'emotionalRegulation'),
            taskCompletion: this.metricValue(metrics, 'taskCompletion'),
          });
          this.targetStatus.set(report.status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED');
          this.existingPhotoUrls.set(report.photoUrls ?? []);
        },
        error: (err) => {
          this.error.set(err?.error?.error?.message ?? 'Could not load this report for editing.');
        },
      });
    }
  }

  private metricValue(metrics: Record<string, unknown>, key: string): number {
    const value = metrics[key];
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.min(10, value))
      : 5;
  }

  removeExistingPhoto(index: number) {
    this.existingPhotoUrls.update((urls) => urls.filter((_, i) => i !== index));
  }

  protected attachmentHref(storedUrl: string): string {
    const id = this.reportId();
    return id === null ? storedUrl : attachmentUrl(id, storedUrl);
  }

  fileNameOf(url: string): string {
    try {
      return decodeURIComponent(
        new URL(url, window.location.origin).pathname.split('/').pop() ?? url,
      );
    } catch {
      return url;
    }
  }

  private loadStudents() {
    this.loadingStudents.set(true);
    this.studentsError.set(null);
    this.api.getEnrolledStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.loadingStudents.set(false);
        if (students.length === 0) {
          this.studentsError.set('No active students found for your school.');
        }
      },
      error: (err) => {
        this.loadingStudents.set(false);
        this.studentsError.set(
          err?.error?.error?.message ?? 'Failed to load students. Please refresh the page.',
        );
      },
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    void this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer?.files) return;
    void this.addFiles(Array.from(event.dataTransfer.files));
  }

  private async addFiles(files: File[]) {
    this.uploadError.set(null);

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxBytes = 10 * 1024 * 1024;

    const valid: File[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        this.uploadError.set(`"${file.name}" is not a supported file type.`);
        continue;
      }
      if (file.size > maxBytes) {
        this.uploadError.set(`"${file.name}" exceeds the 10MB limit.`);
        continue;
      }
      if (valid.length + this.pendingFiles().length + this.existingPhotoUrls().length >= 10) {
        this.uploadError.set('Maximum 10 attachments per report.');
        break;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    const isImage = (file: File) => file.type.startsWith('image/');

    const items: PendingFile[] = valid.map((file) => ({
      file,
      previewUrl: isImage(file) ? URL.createObjectURL(file) : null,
      uploading: true,
      uploadedUrl: null,
    }));
    this.pendingFiles.update((current) => [...current, ...items]);

    const formData = new FormData();
    for (const item of items) {
      formData.append('files', item.file);
    }

    this.api.uploadActivityFiles(formData).subscribe({
      next: (res) => {
        const urls = res.urls;
        this.pendingFiles.update((current) =>
          current.map((entry) => {
            const index = items.indexOf(entry);
            if (index === -1) return entry;
            return { ...entry, uploading: false, uploadedUrl: urls[index] ?? null };
          }),
        );
      },
      error: (err) => {
        this.pendingFiles.update((current) => current.filter((entry) => !items.includes(entry)));
        for (const item of items) {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        }
        this.uploadError.set(err?.error?.error?.message ?? 'Upload failed. Please try again.');
      },
    });
  }

  removeFile(index: number) {
    const files = [...this.pendingFiles()];
    const [removed] = files.splice(index, 1);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    this.pendingFiles.set(files);
  }

  saveDraft() {
    this.targetStatus.set('DRAFT');
    this.submitWithStatus('DRAFT');
  }

  submit() {
    this.submitWithStatus(this.targetStatus());
  }

  private submitWithStatus(status: 'DRAFT' | 'SUBMITTED') {
    this.error.set(null);
    this.message.set(null);

    if (this.form.invalid || !this.form.controls.childId.value) {
      this.form.markAllAsTouched();
      this.error.set('Please select a student and fill in all required fields.');
      return;
    }
    if (this.pendingFiles().some((file) => file.uploading)) {
      this.error.set('Please wait until all files finish uploading.');
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const photoUrls = [
      ...this.existingPhotoUrls(),
      ...this.pendingFiles()
        .map((file) => file.uploadedUrl)
        .filter((url): url is string => url !== null),
    ];

    const metrics = {
      participation: value.participation,
      communication: value.communication,
      socialInteraction: value.socialInteraction,
      attention: value.attention,
      emotionalRegulation: value.emotionalRegulation,
      taskCompletion: value.taskCompletion,
    };

    const reportId = this.reportId();
    const chosenDate =
      value.activityDate?.trim() ||
      this.editingReport()?.activityDate.slice(0, 10) ||
      new Date().toISOString().slice(0, 10);

    const request = reportId
      ? this.api.updateActivityReport(reportId, {
          activityCategory: value.category,
          title: value.activityName,
          summary: `${value.activityName} — ${value.category}`,
          activityDate: chosenDate,
          duration: value.duration,
          performanceMetrics: metrics,
          teacherObservation: value.teacherObservations,
          recommendations: value.parentRecommendations,
          photoUrls,
          status,
        })
      : this.api.createActivityReport({
          childId: value.childId,
          activityCategory: value.category,
          activityName: value.activityName,
          activityDate: chosenDate,
          duration: value.duration,
          performanceMetrics: metrics,
          teacherObservation: value.teacherObservations,
          recommendations: value.parentRecommendations,
          photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
          status,
        });

    request.subscribe({
      next: () => {
        const label = this.editMode()
          ? 'Report updated'
          : status === 'DRAFT'
            ? 'Draft saved'
            : 'Report submitted';
        this.message.set(`${label} successfully.`);
        this.saving.set(false);
        setTimeout(() => void this.router.navigateByUrl('/schools/reports'), 900);
      },
      error: (err) => {
        this.error.set(
          err?.error?.error?.message ??
            'Failed to save report. Check that the student is actively enrolled.',
        );
        this.saving.set(false);
      },
    });
  }
}
