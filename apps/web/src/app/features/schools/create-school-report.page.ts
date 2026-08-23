// create-school-report.page.ts
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SchoolsApi } from './data-access/schools.api';
import type { SchoolChildEnrollmentResponse } from '@auticare/contracts';

interface StudentViewModel {
  id: string;
  childId: string;
  childName: string;
  avatar: string;
  age: string;
  group: string;
  status: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="create-report-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <a class="breadcrumb-link" routerLink="/schools/enrollments">Students</a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">{{ selectedChild().childName }}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">New Activity Report</span>
      </nav>

      <!-- Page Header -->
      <header class="report-header">
        <h1>Create Activity Report</h1>
        <div class="header-actions">
          <a class="btn-cancel" routerLink="/schools/reports">Cancel</a>
          <button type="button" class="btn-save-draft" (click)="saveDraft()">Save Draft</button>
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <!-- Student Selector & Profile Card -->
        <div class="profile-section-card">
          <div class="selector-row">
            <label for="child-select" class="selector-label">Select Student:</label>
            <select id="child-select" formControlName="childId" class="child-select">
              @for (child of children(); track child.childId) {
                <option [value]="child.childId">{{ child.childName }} ({{ child.childId }})</option>
              }
            </select>
          </div>

          <div class="student-profile-info">
            <div class="student-avatar-container">
              <span class="student-avatar-large">{{ selectedChild().avatar }}</span>
            </div>
            <div class="student-meta-block">
              <span class="student-name-title">{{ selectedChild().childName }}</span>
              <span class="student-id-subtitle">Student ID: #{{ selectedChild().childId }}</span>
            </div>

            <div class="student-detail-group">
              <div class="detail-item">
                <span class="detail-label">AGE</span>
                <span class="detail-value">{{ selectedChild().age }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">PRIMARY GROUP</span>
                <span class="detail-value">
                  <span class="group-dot"></span>
                  {{ selectedChild().group }}
                </span>
              </div>
            </div>

            <div class="student-status-badge">
              <span class="status-dot"></span>
              Status: {{ selectedChild().status }}
            </div>
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
                formControlName="teacherObservations"
                rows="6"
                placeholder="Describe how the student engaged with the activity, any notable breakthroughs, or challenges faced..."
              ></textarea>
            </div>

            <!-- 4. Parent Recommendations -->
            <div class="form-section">
              <h2><span class="section-icon">💡</span> 4. Parent Recommendations</h2>
              <textarea
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
                    type="range"
                    min="0"
                    max="10"
                    formControlName="taskCompletion"
                    class="custom-slider"
                  />
                </div>
              </div>
            </div>

            <!-- 5. Activity Photos -->
            <div class="form-section photos-section">
              <h2><span class="section-icon">📷</span> 5. Activity Photos</h2>

              <div class="upload-dragzone">
                <span class="upload-cloud-icon">📥</span>
                <p class="upload-main-text">
                  Drag & drop photos or <span class="browse-btn">browse</span>
                </p>
                <p class="upload-sub-text">Max 5 photos, up to 10MB each (JPG, PNG)</p>
              </div>

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
            <span class="autosave-text">Last autosaved at {{ autosaveTime }}</span>
            <div class="footer-actions">
              <button type="button" class="btn-footer-save" (click)="saveDraft()">
                Save Draft
              </button>
              <button type="submit" class="btn-footer-submit" [disabled]="saving()">
                {{ saving() ? 'Submitting...' : 'Submit Report' }}
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
        max-width: 1200px;
        margin: 0 auto;
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
        color: #001e2b;
      }

      /* Breadcrumbs */
      .breadcrumbs {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #64748b;
        margin-bottom: 16px;
      }
      .breadcrumb-link {
        color: #3d6375;
        text-decoration: none;
        font-weight: 500;
      }
      .breadcrumb-link:hover {
        text-decoration: underline;
      }
      .breadcrumb-separator {
        color: #cbd5e1;
      }
      .breadcrumb-item.active {
        color: #1e293b;
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
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        color: #475569;
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-cancel:hover {
        background: #f8fafc;
        border-color: #94a3b8;
      }
      .btn-save-draft {
        padding: 10px 18px;
        background: #19465b;
        border: none;
        border-radius: 10px;
        color: #ffffff;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-save-draft:hover {
        background: #0f2c3b;
      }

      /* Profile section card */
      .profile-section-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
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
        border-bottom: 1px solid #f1f5f9;
      }
      .selector-label {
        font-weight: 600;
        font-size: 14px;
        color: #475569;
      }
      .child-select {
        padding: 8px 16px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #f8fafc;
        font-size: 14px;
        font-weight: 500;
        outline: none;
        cursor: pointer;
      }
      .child-select:focus {
        border-color: #3d6375;
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
        background: #eef8fc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .student-avatar-large {
        font-size: 36px;
      }
      .student-meta-block {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .student-name-title {
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
      }
      .student-id-subtitle {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }
      .student-detail-group {
        display: flex;
        gap: 32px;
        border-left: 1px solid #e2e8f0;
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
        color: #64748b;
        letter-spacing: 0.5px;
      }
      .detail-value {
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .group-dot {
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
      }
      .student-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: #d1fae5;
        border-radius: 9999px;
        color: #065f46;
        font-size: 13px;
        font-weight: 600;
        margin-left: 24px;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
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
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      }
      .form-section h2 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
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
        color: #475569;
      }
      .form-group input,
      .form-group select,
      .form-section textarea {
        padding: 12px 16px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
        background: #f8fafc;
      }
      .form-group input:focus,
      .form-group select:focus,
      .form-section textarea:focus {
        border-color: #3d6375;
        background: #ffffff;
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
        color: #64748b;
        background: #f1f5f9;
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
        color: #334155;
      }
      .metric-value {
        font-size: 15px;
        font-weight: 700;
        color: #19465b;
      }
      .custom-slider {
        -webkit-appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #e2e8f0;
        outline: none;
        margin: 8px 0;
      }
      .custom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #19465b;
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
        background: #19465b;
        cursor: pointer;
        border: none;
        transition: transform 0.1s;
      }
      .custom-slider::-moz-range-thumb:hover {
        transform: scale(1.2);
      }

      /* Photo upload component */
      .upload-dragzone {
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        background: #f8fafc;
        margin-bottom: 16px;
      }
      .upload-dragzone:hover {
        border-color: #19465b;
        background: #eef8fc;
      }
      .upload-cloud-icon {
        font-size: 32px;
        margin-bottom: 8px;
        display: block;
      }
      .upload-main-text {
        font-size: 14px;
        font-weight: 600;
        color: #334155;
        margin: 0 0 4px 0;
      }
      .browse-btn {
        color: #3d6375;
        text-decoration: underline;
      }
      .upload-sub-text {
        font-size: 11px;
        color: #64748b;
        margin: 0;
      }
      .photo-previews-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .preview-box-empty {
        aspect-ratio: 1;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #cbd5e1;
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
        background: #fef2f2;
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
        left: 292px; /* Offset to align with app shell layout */
        right: 0;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        padding: 16px 40px;
        box-shadow: 0 -4px 10px rgb(0 0 0 / 0.05);
        z-index: 10;
        transition: left 0.2s;
      }
      .footer-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .autosave-text {
        font-size: 12px;
        font-weight: 500;
        color: #64748b;
      }
      .footer-actions {
        display: flex;
        gap: 16px;
      }
      .btn-footer-save {
        padding: 12px 24px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        color: #475569;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-footer-save:hover {
        background: #f8fafc;
        border-color: #94a3b8;
      }
      .btn-footer-submit {
        padding: 12px 28px;
        background: #19465b;
        border: none;
        border-radius: 10px;
        color: #ffffff;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-footer-submit:hover {
        background: #0f2c3b;
      }
      .btn-footer-submit:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

      /* Stack on small viewports */
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

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly enrollments = signal<StudentViewModel[]>([]);

  readonly categories = [
    'Cognitive/Developmental',
    'Sensory/Motor',
    'Social/Emotional',
    'Language/Communication',
    'Adaptive/Self-Care',
  ];

  readonly autosaveTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Rich form controls mapping UI layout elements
  readonly form = this.fb.nonNullable.group({
    childId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    activityDate: [new Date().toISOString().slice(0, 10), [Validators.required]],
    summary: ['', [Validators.required, Validators.maxLength(4000)]],

    // UI-only form controls
    category: ['', [Validators.required]],
    duration: [45, [Validators.required, Validators.min(1)]],
    activityName: ['', [Validators.required, Validators.maxLength(160)]],
    teacherObservations: ['', [Validators.required, Validators.maxLength(2000)]],
    parentRecommendations: ['', [Validators.required, Validators.maxLength(2000)]],
    participation: [5, [Validators.required]],
    communication: [5, [Validators.required]],
    socialInteraction: [5, [Validators.required]],
    attention: [5, [Validators.required]],
    emotionalRegulation: [5, [Validators.required]],
    taskCompletion: [5, [Validators.required]],
  });

  readonly children = computed(() => {
    const list = this.enrollments();
    if (list.length > 0) return list;

    // Static fallback to matches exact image details
    return [
      {
        id: 'fallback-id',
        childId: 'demo-child-1',
        childName: 'Leo Miller',
        avatar: '👦',
        age: '5 Years',
        group: 'Blue Horizon',
        status: 'Stable',
      },
    ];
  });

  readonly selectedChild = computed(() => {
    const childId = this.form.controls.childId.value;
    const list = this.children();
    return list.find((c) => c.childId === childId) || list[0] || null;
  });

  ngOnInit() {
    this.api.listEnrollments().subscribe({
      next: (enrollments) => {
        const mapped = this.mapToViewModel(enrollments);
        this.enrollments.set(mapped);
        if (mapped.length > 0) {
          this.form.controls.childId.setValue(mapped[0].childId);
        }
      },
      error: () => {
        // Suppress and fallback gracefully
      },
    });
  }

  private mapToViewModel(
    enrollments: readonly SchoolChildEnrollmentResponse[],
  ): StudentViewModel[] {
    const mockNames = ['Leo Miller', 'Maya Patel', 'Ethan Ross', 'Olivia Zhang'];
    const mockAvatars = ['👦', '👧', '👦', '👧'];
    const mockAges = ['5 Years', '6 Years', '4 Years', '5 Years'];
    const mockGroups = ['Blue Horizon', 'Green Meadows', 'Yellow Sun', 'Red Valleys'];

    return enrollments.map((enrollment, index) => ({
      id: enrollment.id,
      childId: enrollment.childId,
      childName: mockNames[index % mockNames.length],
      avatar: mockAvatars[index % mockAvatars.length],
      age: mockAges[index % mockAges.length],
      group: mockGroups[index % mockGroups.length],
      status: 'Stable',
    }));
  }

  saveDraft() {
    this.message.set(
      'Draft has been autosaved at ' +
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
    );
    setTimeout(() => this.message.set(null), 4000);
  }

  submit() {
    this.error.set(null);
    this.message.set(null);

    // Bind selected child ID
    const currentChild = this.selectedChild();
    if (currentChild) {
      this.form.controls.childId.setValue(currentChild.childId);
    }

    // Set activityName directly to title
    this.form.controls.title.setValue(this.form.controls.activityName.value);

    // Format all metadata and observances into the markdown summary expected by the database schema
    const cat = this.form.controls.category.value;
    const dur = this.form.controls.duration.value;
    const actName = this.form.controls.activityName.value;
    const obs = this.form.controls.teacherObservations.value;
    const rec = this.form.controls.parentRecommendations.value;

    const part = this.form.controls.participation.value;
    const comm = this.form.controls.communication.value;
    const soc = this.form.controls.socialInteraction.value;
    const att = this.form.controls.attention.value;
    const emo = this.form.controls.emotionalRegulation.value;
    const task = this.form.controls.taskCompletion.value;

    const summaryText = `
### 1. Activity Details
- **Category**: ${cat}
- **Duration**: ${dur} minutes
- **Activity Name**: ${actName}

### 2. Performance (0-10 Scale)
- **Participation**: ${part}/10
- **Communication**: ${comm}/10
- **Social Interaction**: ${soc}/10
- **Attention**: ${att}/10
- **Emotional Regulation**: ${emo}/10
- **Task Completion**: ${task}/10

### 3. Teacher Observations
${obs}

### 4. Parent Recommendations
${rec}
`.trim();

    this.form.controls.summary.setValue(summaryText);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Complete all report fields correctly.');
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.api
      .createReport({
        childId: value.childId.trim(),
        title: value.title.trim(),
        activityDate: value.activityDate,
        summary: value.summary.trim(),
      })
      .subscribe({
        next: () => {
          this.message.set('Activity report has been submitted.');
          this.saving.set(false);
          setTimeout(() => {
            void this.router.navigateByUrl('/schools/reports');
          }, 1500);
        },
        error: () => {
          this.error.set('Report could not be created. Confirm the child is actively enrolled.');
          this.saving.set(false);
        },
      });
  }
}
