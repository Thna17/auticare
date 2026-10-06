import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ActivityReportDetailResponse } from '@auticare/contracts';
import { SchoolsApi, type EnrolledStudentOption } from './data-access/schools.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';
import { attachmentUrl } from '../../core/config/attachment-url';

/** A file that has been accepted but not yet uploaded to the server. */
export interface PendingFile {
  file: File;
  previewUrl: string | null; // object URL for image previews; null for docs
  uploading: boolean;
  uploadedUrl: string | null; // server path, e.g. /uploads/activity-reports/<uuid>.jpg
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SchoolTopbarComponent],
  template: `
    <div class="create-report-container">
      <ac-school-topbar />

      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <a class="breadcrumb-link" routerLink="/schools/enrollments">Students</a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">{{ selectedChild()?.firstName ?? '...' }}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">{{
          editMode() ? 'Edit Activity Report' : 'New Activity Report'
        }}</span>
      </nav>

      <!-- Page Header -->
      <header class="report-header">
        <h1>{{ editMode() ? 'Edit Activity Report' : 'Create Activity Report' }}</h1>
        <div class="header-actions">
          <a class="btn-cancel" routerLink="/schools/reports">Cancel</a>
          <button type="button" class="btn-save-draft" (click)="saveDraft()" [disabled]="saving()">
            {{ saving() ? 'Saving...' : 'Save Draft' }}
          </button>
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <!-- Student Selector & Profile Card -->
        <div class="profile-section-card">
          <div class="selector-row">
            <label for="child-select" class="selector-label">Select Student:</label>
            <select
              id="child-select"
              formControlName="childId"
              class="child-select"
              [disabled]="loadingStudents()"
            >
              @if (loadingStudents()) {
                <option value="" disabled>Loading students…</option>
              } @else {
                <option value="" disabled>Select a student</option>
              }
              @for (student of students(); track student.id) {
                <option [value]="student.id">{{ student.firstName }} {{ student.lastName }}</option>
              }
            </select>
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
                <span class="student-id-subtitle">Student ID: #{{ child.id }}</span>
              </div>

              <div class="student-detail-group">
                <div class="detail-item">
                  <span class="detail-label">AGE</span>
                  <span class="detail-value">{{ child.age }}</span>
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
            <p class="no-student-hint">Select a student above to see their profile.</p>
          }
        </div>

        <!-- Main Form Grid -->
        <div class="report-grid">
          <!-- Left Column -->
          <div class="grid-left">
            <!-- 1. Activity Details -->
            <div class="form-section">
              <h2><span class="section-icon">📝</span> 1. Activity Details</h2>
              <div class="row-2-col">
                <div class="form-group">
                  <label for="category">Activity Category</label>
                  <select id="category" formControlName="category">
                    <option value="" disabled selected>Select a category</option>
                    @for (cat of categories; track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="duration">Duration (Minutes)</label>
                  <input
                    id="duration"
                    type="number"
                    formControlName="duration"
                    placeholder="e.g. 45"
                  />
                </div>
              </div>
              <div class="form-group full-width">
                <label for="activityName">Activity Name</label>
                <input
                  id="activityName"
                  type="text"
                  formControlName="activityName"
                  placeholder="e.g. Cooperative Block Building"
                />
              </div>
            </div>

            <!-- 3. Teacher Observations -->
            <div class="form-section">
              <h2><span class="section-icon">👁️</span> 3. Teacher Observations</h2>
              <textarea
                aria-label="Teacher observations"
                formControlName="teacherObservations"
                rows="6"
                placeholder="Describe how the student engaged with the activity, any notable breakthroughs, or challenges faced..."
              ></textarea>
            </div>

            <!-- 4. Parent Recommendations -->
            <div class="form-section">
              <h2><span class="section-icon">💡</span> 4. Parent Recommendations</h2>
              <textarea
                aria-label="Recommendations for parents"
                formControlName="parentRecommendations"
                rows="6"
                placeholder="Actionable steps for parents to reinforce these skills at home..."
              ></textarea>
            </div>
          </div>

          <!-- Right Column -->
          <div class="grid-right">
            <!-- 2. Performance -->
            <div class="form-section performance-section">
              <div class="section-header-flex">
                <h2><span class="section-icon">📊</span> 2. Performance</h2>
                <span class="scale-badge">0-10 SCALE</span>
              </div>

              <div class="metrics-list">
                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Participation</span>
                    <span class="metric-value">{{ form.controls.participation.value }}</span>
                  </div>
                  <input
                    aria-label="Participation rating, 0 to 10"
                    type="range"
                    min="0"
                    max="10"
                    formControlName="participation"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Communication</span>
                    <span class="metric-value">{{ form.controls.communication.value }}</span>
                  </div>
                  <input
                    aria-label="Communication rating, 0 to 10"
                    type="range"
                    min="0"
                    max="10"
                    formControlName="communication"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Social Interaction</span>
                    <span class="metric-value">{{ form.controls.socialInteraction.value }}</span>
                  </div>
                  <input
                    aria-label="Social interaction rating, 0 to 10"
                    type="range"
                    min="0"
                    max="10"
                    formControlName="socialInteraction"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Attention</span>
                    <span class="metric-value">{{ form.controls.attention.value }}</span>
                  </div>
                  <input
                    aria-label="Attention rating, 0 to 10"
                    type="range"
                    min="0"
                    max="10"
                    formControlName="attention"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Emotional Regulation</span>
                    <span class="metric-value">{{ form.controls.emotionalRegulation.value }}</span>
                  </div>
                  <input
                    aria-label="Emotional regulation rating, 0 to 10"
                    type="range"
                    min="0"
                    max="10"
                    formControlName="emotionalRegulation"
                    class="custom-slider"
                  />
                </div>

                <div class="metric-item">
                  <div class="metric-header">
                    <span class="metric-label">Task Completion</span>
                    <span class="metric-value">{{ form.controls.taskCompletion.value }}</span>
                  </div>
                  <input
                    aria-label="Task completion rating, 0 to 10"
                    type="range"
                    min="0"
                    max="10"
                    formControlName="taskCompletion"
                    class="custom-slider"
                  />
                </div>
              </div>
            </div>

            <!-- 5. Attachments -->
            <div class="form-section photos-section">
              <h2><span class="section-icon">📷</span> 5. Activity Photos</h2>

              <div
                class="upload-dragzone"
                (click)="fileInput.click()"
                (dragover)="$event.preventDefault()"
                (drop)="onFileDrop($event)"
              >
                <span class="upload-cloud-icon">📥</span>
                <p class="upload-main-text">
                  Drag & drop files or <span class="browse-btn">browse</span>
                </p>
                <p class="upload-sub-text">JPG, PNG, PDF, Word, text, CSV — up to 10MB each</p>
              </div>
              <input
                aria-label="Choose files to attach"
                #fileInput
                type="file"
                accept="image/jpeg,image/jpg,image/png,.pdf,.doc,.docx,.txt,.csv"
                multiple
                (change)="onFilesSelected($event)"
                style="display: none"
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
            <span class="autosave-text">{{ footerStatus() }}</span>
            <div class="footer-actions">
              <button
                type="button"
                class="btn-footer-save"
                (click)="saveDraft()"
                [disabled]="saving()"
              >
                {{ saving() ? 'Saving...' : 'Save Draft' }}
              </button>
              <button type="submit" class="btn-footer-submit" [disabled]="saving()">
                {{
                  saving()
                    ? editMode()
                      ? 'Updating...'
                      : 'Submitting...'
                    : editMode()
                      ? 'Update Report'
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
        font-family:
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          Roboto,
          Oxygen,
          Ubuntu,
          Cantarell,
          sans-serif;
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
        color: var(--ac-color-action);
        text-decoration: none;
        font-weight: 500;
      }
      .breadcrumb-link:hover {
        text-decoration: underline;
      }
      .breadcrumb-separator {
        color: var(--ac-color-slate-300);
      }
      .breadcrumb-item.active {
        color: var(--ac-color-slate-800);
        font-weight: 600;
      }

      /* Header */
      .report-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .report-header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }
      .header-actions {
        display: flex;
        gap: 12px;
      }
      .btn-cancel {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 10px 18px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-slate-300);
        border-radius: 10px;
        color: var(--ac-color-slate-600);
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-cancel:hover {
        background: var(--ac-color-surface-slate);
        border-color: var(--ac-color-slate-400);
      }
      .btn-save-draft {
        padding: 10px 18px;
        background: var(--ac-color-ink-b);
        border: none;
        border-radius: 10px;
        color: var(--ac-color-text-on-action);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-save-draft:hover {
        background: #0f2c3b;
      }
      .btn-save-draft:disabled {
        background: var(--ac-color-slate-400);
        cursor: not-allowed;
      }

      /* Profile section card */
      .profile-section-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      }
      .selector-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--ac-color-slate-100);
      }
      .selector-label {
        font-weight: 600;
        font-size: 14px;
        color: var(--ac-color-slate-600);
      }
      .child-select {
        padding: 8px 16px;
        border: 1px solid var(--ac-color-slate-300);
        border-radius: 8px;
        background: var(--ac-color-surface-slate);
        font-size: 14px;
        font-weight: 500;
        outline: none;
        cursor: pointer;
      }
      .child-select:disabled {
        opacity: 0.6;
        cursor: wait;
      }
      .child-select:focus {
        border-color: var(--ac-color-action);
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
        gap: 24px;
      }
      .student-avatar-container {
        width: 64px;
        height: 64px;
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
        font-size: 24px;
        font-weight: 700;
        color: var(--ac-color-ink-b);
      }
      .student-meta-block {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .student-name-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }
      .student-id-subtitle {
        font-size: 13px;
        color: var(--ac-color-text-slate);
        font-weight: 500;
      }
      .student-detail-group {
        display: flex;
        gap: 32px;
        border-left: 1px solid var(--ac-color-border-slate);
        padding-left: 32px;
      }
      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .detail-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        letter-spacing: 0.5px;
      }
      .detail-value {
        font-size: 15px;
        font-weight: 600;
        color: var(--ac-color-slate-800);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .student-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: var(--ac-color-green-100);
        border-radius: 9999px;
        color: #065f46;
        font-size: 13px;
        font-weight: 600;
        margin-left: 24px;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        background: var(--ac-color-green-500);
        border-radius: 50%;
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
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      }
      .form-section h2 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-slate-800);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-icon {
        font-size: 20px;
      }

      /* Fields layout */
      .row-2-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .form-group label {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-slate-600);
      }
      .form-group input,
      .form-group select,
      .form-section textarea {
        padding: 12px 16px;
        border: 1px solid var(--ac-color-slate-300);
        border-radius: 10px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
        background: var(--ac-color-surface-slate);
      }
      .form-group input:focus,
      .form-group select:focus,
      .form-section textarea:focus {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface);
        box-shadow: 0 0 0 3px rgb(61 99 117 / 0.15);
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
        margin-bottom: 20px;
      }
      .section-header-flex h2 {
        margin-bottom: 0;
      }
      .scale-badge {
        font-size: 11px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        background: var(--ac-color-slate-100);
        padding: 4px 8px;
        border-radius: 6px;
        letter-spacing: 0.5px;
      }
      .metrics-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .metric-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .metric-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-slate-700);
      }
      .metric-value {
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-ink-b);
      }
      .custom-slider {
        -webkit-appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--ac-color-border-slate);
        outline: none;
        margin: 8px 0;
      }
      .custom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--ac-color-ink-b);
        cursor: pointer;
        transition: transform 0.1s;
      }
      .custom-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
      .custom-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--ac-color-ink-b);
        cursor: pointer;
        border: none;
        transition: transform 0.1s;
      }
      .custom-slider::-moz-range-thumb:hover {
        transform: scale(1.2);
      }

      /* Attachment upload */
      .upload-dragzone {
        border: 2px dashed var(--ac-color-slate-300);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--ac-color-surface-slate);
        margin-bottom: 16px;
      }
      .upload-dragzone:hover {
        border-color: var(--ac-color-ink-b);
        background: var(--ac-color-tint-blue-mist);
      }
      .upload-cloud-icon {
        font-size: 32px;
        margin-bottom: 8px;
        display: block;
      }
      .upload-main-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-slate-700);
        margin: 0 0 4px 0;
      }
      .browse-btn {
        color: var(--ac-color-action);
        text-decoration: underline;
      }
      .upload-sub-text {
        font-size: 11px;
        color: var(--ac-color-text-slate);
        margin: 0;
      }
      .upload-error {
        margin: 0 0 12px 0;
        font-size: 12px;
        color: var(--ac-color-alert-slate);
        font-weight: 600;
      }
      .photo-previews-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
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
        padding: 8px;
        text-align: center;
      }
      .preview-doc-icon {
        font-size: 22px;
      }
      .preview-doc-name {
        font-size: 9px;
        color: var(--ac-color-slate-600);
        word-break: break-all;
        max-height: 2.6em;
        overflow: hidden;
      }
      .preview-overlay {
        position: absolute;
        inset: 0;
        background: rgb(255 255 255 / 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .spinner {
        width: 22px;
        height: 22px;
        border: 3px solid var(--ac-color-slate-300);
        border-top-color: var(--ac-color-ink-b);
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
        width: 20px;
        height: 20px;
        background: var(--ac-color-green-500);
        color: white;
        border-radius: 50%;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .remove-photo-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 24px;
        height: 24px;
        background: var(--ac-color-red-500);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .remove-photo-btn:disabled {
        opacity: 0.5;
        cursor: wait;
      }
      .preview-box-empty {
        aspect-ratio: 1;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        background: var(--ac-color-surface-slate);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ac-color-slate-300);
      }
      .preview-icon {
        font-size: 24px;
      }

      /* Alert message styles */
      .alert-message {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        margin-top: 24px;
      }
      .alert-message.error {
        background: var(--ac-color-red-50);
        color: #991b1b;
        border: 1px solid #fee2e2;
      }
      .alert-message.success {
        background: #f0fdf4;
        color: #166534;
        border: 1px solid #dcfce7;
      }
      .alert-icon {
        font-size: 18px;
      }

      /* Sticky footer styling */
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 292px;
        right: 0;
        background: var(--ac-color-surface);
        border-top: 1px solid var(--ac-color-border-slate);
        padding: 16px 56px;
        box-shadow: 0 -4px 10px rgb(0 0 0 / 0.05);
        z-index: 10;
      }
      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .autosave-text {
        font-size: 12px;
        font-weight: 500;
        color: var(--ac-color-text-slate);
      }
      .footer-actions {
        display: flex;
        gap: 16px;
      }
      .btn-footer-save {
        padding: 12px 24px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-slate-300);
        border-radius: 10px;
        color: var(--ac-color-slate-600);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-footer-save:hover {
        background: var(--ac-color-surface-slate);
        border-color: var(--ac-color-slate-400);
      }
      .btn-footer-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-footer-submit {
        padding: 12px 28px;
        background: var(--ac-color-ink-b);
        border: none;
        border-radius: 10px;
        color: var(--ac-color-text-on-action);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-footer-submit:hover {
        background: #0f2c3b;
      }
      .btn-footer-submit:disabled {
        background: var(--ac-color-slate-400);
        cursor: not-allowed;
      }

      @media (max-width: 960px) {
        .report-grid {
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
          margin-left: 0;
          width: fit-content;
        }
      }

      @media (max-width: 860px) {
        .sticky-footer {
          left: 0;
          padding: 16px 20px;
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

  readonly categories = [
    'Cognitive/Developmental',
    'Sensory/Motor',
    'Social/Emotional',
    'Language/Communication',
    'Adaptive/Self-Care',
  ];

  readonly form = this.fb.nonNullable.group({
    childId: ['', [Validators.required]],
    category: ['', [Validators.required]],
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

  readonly selectedChild = computed(() => {
    const childId = this.form.controls.childId.value;
    const list = this.students();
    return list.find((s) => s.id === childId) || null;
  });

  readonly footerStatus = computed(() => {
    const files = this.pendingFiles();
    const uploading = files.filter((f) => f.uploading).length;
    const uploaded = files.filter((f) => f.uploadedUrl).length;
    if (uploading > 0) return `Uploading ${uploading} file${uploading === 1 ? '' : 's'}…`;
    if (uploaded > 0) return `${uploaded} file${uploaded === 1 ? '' : 's'} attached`;
    return 'Form ready';
  });

  ngOnInit() {
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

  /**
   * Display URL for an already-saved attachment. existingPhotoUrls deliberately
   * holds the STORED paths, because they are posted straight back in photoUrls
   * on save — only the rendered href is the authorised, report-scoped route.
   */
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

  /** GET /schools/enrolled-students — ACTIVE enrollments with age pre-computed. */
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

  /**
   * Accept files, show previews, and immediately upload each batch to
   * POST /schools/upload/activity-files. The returned URLs are stored on the
   * pending item, so Save/Submit already has everything it needs.
   */
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

    // Reserve UI slots with previews right away, then upload.
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
        // Drop the failed batch from the UI; the user can retry.
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
    this.submitWithStatus('DRAFT');
  }

  submit() {
    this.submitWithStatus('SUBMITTED');
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
    const request = this.editMode()
      ? this.api.updateActivityReport(this.reportId()!, {
          activityCategory: value.category,
          title: value.activityName,
          summary: `${value.activityName} — ${value.category}`,
          activityDate:
            this.editingReport()?.activityDate.slice(0, 10) ??
            new Date().toISOString().slice(0, 10),
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
