// school-enrollments.page.ts
import type { OnInit, OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type {
  EnrollmentStatsResponse,
  EnrolledStudent,
  LeadSpecialistResponse,
  SchoolChildEnrollmentStatus,
} from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';

interface EnrollmentViewModel {
  id: string;
  childId: string;
  childName: string;
  avatar: string;
  status: 'Active' | 'Graduated' | 'Pending' | 'Rejected';
  leadSpecialist: string;
  communicationProgress: number;
  startDate: string;
}

@Component({
  standalone: true,
  imports: [UiCardComponent, SchoolTopbarComponent, RouterLink, UiMessageComponent],
  selector: 'ac-school-enrollments-page',
  template: `
    <ac-school-topbar />

    <!-- Page Header -->
    <section class="page-header">
      <div class="header-text">
        <h1>Student Enrollment</h1>
        <p>Manage and monitor student engagement and therapeutic progress across all cohorts.</p>
      </div>
      <a class="btn-primary" routerLink="/schools/students/add">
        <span>👤+</span>
        <span>Add New Student</span>
      </a>
    </section>

    <!-- Stats Cards -->
    <section class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total Students</span>
        <div class="stat-value">
          <span class="stat-number">{{ stats()?.totalStudents ?? 0 }}</span>
          <span class="stat-trend">+{{ stats()?.newStudentsThisMonth ?? 0 }} this month</span>
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-label">Active Programs</span>
        <div class="stat-value">
          <span class="stat-number">{{ stats()?.activePrograms ?? 0 }}</span>
          <span class="stat-trend">{{ stats()?.participationRate ?? 0 }}% Participation</span>
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-label">Average Progress</span>
        <div class="stat-value">
          <span class="stat-number">{{ stats()?.averageProgress ?? 0 }}%</span>
          <div class="progress-bar-container">
            <div class="progress-bar" [style.width.%]="stats()?.averageProgress ?? 0"></div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-label">Needs Attention</span>
        <div class="stat-value">
          <span class="stat-number warning">{{ stats()?.needsAttention ?? 0 }}</span>
          <span class="stat-trend">Requires Review</span>
        </div>
      </div>
    </section>

    <!-- Filters Bar -->
    <section class="filters-bar">
      <div class="filters-left">
        <button class="filter-btn">
          <span>⚙</span>
          <span>Filters</span>
        </button>
        <select class="filter-select" (change)="onStatusFilterChange($event)">
          <option value="ALL">Enrollment: All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="GRADUATED">Graduated</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select class="filter-select" (change)="onSpecialistFilterChange($event)">
          <option value="">Lead Specialist: All</option>
          @for (spec of specialists(); track spec.id) {
            <option [value]="spec.id">{{ spec.firstName }} {{ spec.lastName }}</option>
          }
        </select>
      </div>
      <div class="filters-right">
        <button class="icon-action-btn" aria-label="Download">⬇</button>
        <button class="icon-action-btn" aria-label="Print">🖨</button>
      </div>
    </section>

    <!-- Data Table -->
    @if (loading()) {
      <ac-ui-card><p>Loading enrollments...</p></ac-ui-card>
    } @else if (error()) {
      <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
    } @else if (!enrollments().length) {
      <ac-ui-card><p>No active child enrollments are available.</p></ac-ui-card>
    } @else {
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>STUDENT NAME</th>
              <th>STATUS</th>
              <th>LEAD SPECIALIST</th>
              <th>COMMUNICATION PROGRESS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            @for (enrollment of enrollments(); track enrollment.id) {
              <tr>
                <td>
                  <div class="student-cell">
                    <div class="student-avatar">{{ enrollment.avatar }}</div>
                    <div class="student-info">
                      <span class="student-name">{{ enrollment.childName }}</span>
                      <span class="student-id">ID: #{{ enrollment.childId }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="status-badge" [class]="enrollment.status.toLowerCase()">
                    {{ enrollment.status }}
                  </span>
                </td>
                <td>
                  <div class="specialist-cell">
                    <span class="specialist-icon">👤</span>
                    <span>{{ enrollment.leadSpecialist }}</span>
                  </div>
                </td>
                <td>
                  <div class="progress-cell">
                    <span
                      class="progress-text"
                      [class.warning]="enrollment.communicationProgress < 30"
                    >
                      {{ enrollment.communicationProgress }}%
                    </span>
                    <div class="progress-bar-container">
                      <div
                        class="progress-bar"
                        [class.warning]="enrollment.communicationProgress < 30"
                        [style.width.%]="enrollment.communicationProgress"
                      ></div>
                    </div>
                    @if (enrollment.communicationProgress < 30) {
                      <span class="warning-icon">⚠</span>
                    }
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button
                      class="action-btn edit"
                      type="button"
                      (click)="openEditDialog(enrollment)"
                      aria-label="Edit student"
                    >
                      ✏️
                    </button>
                    <button
                      class="action-btn delete"
                      type="button"
                      (click)="openDeleteDialog(enrollment)"
                      aria-label="Remove student"
                      [disabled]="deleting()"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination">
          <span class="pagination-info">
            Showing {{ (currentPage() - 1) * pageSize() + 1 }} to
            {{ Math.min(currentPage() * pageSize(), totalStudents()) }} of
            {{ totalStudents() }} students
          </span>
          <div class="pagination-controls">
            <button
              class="page-btn"
              [disabled]="currentPage() <= 1"
              (click)="goToPage(currentPage() - 1)"
            >
              Previous
            </button>
            @for (p of [].constructor(totalPages()); track p; let i = $index) {
              <button
                class="page-btn"
                [class.active]="currentPage() === i + 1"
                (click)="goToPage(i + 1)"
              >
                {{ i + 1 }}
              </button>
            }
            <button
              class="page-btn"
              [disabled]="currentPage() >= totalPages()"
              (click)="goToPage(currentPage() + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Edit student dialog -->
    @if (editing(); as student) {
      <div class="dialog-backdrop" (click)="closeEditDialog()">
        <div
          class="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-student-title"
          (click)="$event.stopPropagation()"
        >
          <h3 id="edit-student-title">Edit student</h3>
          <p class="dialog-subtitle">{{ student.childName }}</p>

          <label class="dialog-field">
            <span class="dialog-label">First name</span>
            <input
              class="dialog-input"
              type="text"
              maxlength="80"
              [value]="editFirstName()"
              (input)="editFirstName.set($any($event.target).value)"
            />
          </label>

          <label class="dialog-field">
            <span class="dialog-label">Last name</span>
            <input
              class="dialog-input"
              type="text"
              maxlength="80"
              [value]="editLastName()"
              (input)="editLastName.set($any($event.target).value)"
            />
          </label>

          <label class="dialog-field">
            <span class="dialog-label">Date of birth</span>
            <input
              class="dialog-input"
              type="date"
              [value]="editDateOfBirth()"
              (input)="editDateOfBirth.set($any($event.target).value)"
            />
          </label>

          <div class="dialog-row">
            <label class="dialog-field">
              <span class="dialog-label">Enrollment status</span>
              <select
                class="dialog-input"
                [value]="editStatus()"
                (change)="editStatus.set($any($event.target).value)"
              >
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="GRADUATED">Graduated</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>

            <label class="dialog-field">
              <span class="dialog-label">Lead specialist</span>
              <select
                class="dialog-input"
                [value]="editSpecialistId()"
                (change)="editSpecialistId.set($any($event.target).value)"
              >
                <option value="">Unassigned</option>
                @for (spec of specialists(); track spec.id) {
                  <option [value]="spec.id">{{ spec.firstName }} {{ spec.lastName }}</option>
                }
              </select>
            </label>
          </div>

          <label class="dialog-field">
            <span class="dialog-label">Notes (shared with the guardian's profile)</span>
            <textarea
              class="dialog-input"
              rows="3"
              maxlength="2000"
              [value]="editNotes()"
              (input)="editNotes.set($any($event.target).value)"
            ></textarea>
          </label>

          @if (editError(); as err) {
            <ac-ui-message tone="error">{{ err }}</ac-ui-message>
          }

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" (click)="closeEditDialog()">Cancel</button>
            <button
              type="button"
              class="btn-primary-small"
              (click)="saveEdit()"
              [disabled]="savingEdit()"
            >
              {{ savingEdit() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirmation dialog -->
    @if (deleting(); as student) {
      <div class="dialog-backdrop" (click)="closeDeleteDialog()">
        <div
          class="dialog dialog-narrow"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-student-title"
          (click)="$event.stopPropagation()"
        >
          <h3 id="delete-student-title">Remove student</h3>
          <p class="dialog-subtitle">{{ student.childName }}</p>
          <p class="dialog-warning">
            This removes {{ student.childName }} from your school's enrollment list. The student's
            profile and history stay safe with their guardian — only the enrollment at your school
            is ended.
          </p>

          @if (deleteError(); as err) {
            <ac-ui-message tone="error">{{ err }}</ac-ui-message>
          }

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" (click)="closeDeleteDialog()">
              Cancel
            </button>
            <button
              type="button"
              class="btn-danger"
              (click)="confirmDelete()"
              [disabled]="deletingInProgress()"
            >
              {{ deletingInProgress() ? 'Removing…' : 'Remove student' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (actionMessage(); as message) {
      <div class="toast" role="status">{{ message }}</div>
    }
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .header-text h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .header-text p {
        margin: 0;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }

      .btn-primary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: var(--ac-color-action-alt);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.2s;
      }

      .btn-primary:hover {
        background: var(--ac-color-ink-a);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .stat-label {
        display: block;
        font-size: 13px;
        color: var(--ac-color-text-slate);
        margin-bottom: 8px;
      }

      .stat-value {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-number {
        font-size: 28px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .stat-number.warning {
        color: var(--ac-color-red-500);
      }

      .stat-trend {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background: var(--ac-color-border-slate);
        border-radius: 4px;
        overflow: hidden;
        margin-top: 8px;
      }

      .progress-bar {
        height: 100%;
        background: var(--ac-color-green-500);
        border-radius: 4px;
        transition: width 0.3s;
      }

      .progress-bar.warning {
        background: var(--ac-color-red-500);
      }

      .filters-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        margin-bottom: 24px;
      }

      .filters-left {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .filter-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: white;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-btn:hover {
        border-color: var(--ac-color-blue-500);
      }

      .filter-select {
        padding: 10px 16px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        cursor: pointer;
      }

      .filter-select:focus {
        border-color: var(--ac-color-blue-500);
      }

      .filters-right {
        display: flex;
        gap: 8px;
      }

      .icon-action-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .icon-action-btn:hover {
        background: var(--ac-color-slate-100);
      }

      .table-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        overflow: hidden;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table th {
        text-align: left;
        padding: 16px 20px;
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .data-table td {
        padding: 16px 20px;
        border-bottom: 1px solid var(--ac-color-slate-100);
        font-size: 14px;
      }

      .data-table tr:last-child td {
        border-bottom: none;
      }

      .student-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .student-avatar {
        width: 40px;
        height: 40px;
        background: var(--ac-color-blue-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .student-info {
        display: flex;
        flex-direction: column;
      }

      .student-name {
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .student-id {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }

      .status-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-badge.active {
        background: var(--ac-color-green-100);
        color: #059669;
      }

      .status-badge.graduated {
        background: var(--ac-color-blue-100);
        color: var(--ac-color-blue-600);
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #d97706;
      }

      .status-badge.rejected {
        background: #fee2e2;
        color: #dc2626;
      }

      .specialist-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ac-color-text-slate-strong);
      }

      .specialist-icon {
        font-size: 16px;
      }

      .progress-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .progress-text {
        min-width: 40px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .progress-text.warning {
        color: var(--ac-color-red-500);
      }

      .progress-cell .progress-bar-container {
        flex: 1;
        margin: 0;
      }

      .warning-icon {
        color: var(--ac-color-red-500);
        font-size: 16px;
      }

      .kebab-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        color: var(--ac-color-text-slate);
      }

      .kebab-btn:hover {
        background: var(--ac-color-slate-100);
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .pagination-info {
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }

      .pagination-controls {
        display: flex;
        gap: 8px;
      }

      .page-btn {
        padding: 8px 14px;
        border: 1px solid var(--ac-color-border-slate);
        background: white;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .page-btn:hover {
        border-color: var(--ac-color-blue-500);
      }

      .page-btn.active {
        background: var(--ac-color-action-alt);
        color: white;
        border-color: var(--ac-color-action-alt);
      }

      .page-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .error {
        color: var(--ac-color-alert-text);
        font-weight: 600;
        padding: 16px;
      }

      /* ── ACTIONS column ─────────────────────────────────────── */
      .actions-cell {
        display: flex;
        gap: 8px;
      }

      .action-btn {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        border: 1px solid var(--ac-color-border-slate);
        background: white;
        cursor: pointer;
        font-size: 14px;
        display: grid;
        place-items: center;
        transition: all 0.15s;
      }

      .action-btn.edit:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-light);
      }

      .action-btn.delete:hover {
        border-color: var(--ac-color-alert-text);
        background: #fbeaea;
      }

      .action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* ── Dialogs ────────────────────────────────────────────── */
      .dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 16px;
      }

      .dialog {
        width: 100%;
        max-width: 500px;
        background: white;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
        max-height: 90vh;
        overflow-y: auto;
      }

      .dialog-narrow {
        max-width: 420px;
      }

      .dialog h3 {
        margin: 0 0 4px;
        color: var(--ac-color-action-darkest);
        font-size: 18px;
      }

      .dialog-subtitle {
        margin: 0 0 16px;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }

      .dialog-warning {
        margin: 0 0 16px;
        color: var(--ac-color-grey-a);
        font-size: 14px;
        line-height: 1.5;
      }

      .dialog-field {
        display: block;
        margin-bottom: 14px;
      }

      .dialog-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .dialog-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-slate-700);
        margin-bottom: 6px;
      }

      .dialog-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 9px;
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
      }

      .dialog-error {
        margin: 0 0 12px;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
        font-size: 13px;
        font-weight: 600;
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      }

      .btn-primary-small {
        padding: 10px 18px;
        border: none;
        border-radius: 9px;
        background: var(--ac-color-action-alt);
        color: white;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .btn-primary-small:hover:not(:disabled) {
        background: var(--ac-color-ink-a);
      }

      .btn-primary-small:disabled,
      .btn-danger:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .btn-secondary {
        padding: 10px 18px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 9px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .btn-danger {
        padding: 10px 18px;
        border: none;
        border-radius: 9px;
        background: var(--ac-color-alert-text);
        color: white;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .btn-danger:hover:not(:disabled) {
        background: #7d1f1f;
      }

      /* ── Toast ──────────────────────────────────────────────── */
      .toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--ac-color-action-darkest);
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
        z-index: 110;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolEnrollmentsPage implements OnInit, OnDestroy {
  readonly Math = Math;
  private readonly api = inject(SchoolsApi);
  private readonly destroy$ = new Subject<void>();
  readonly enrollments = signal<EnrollmentViewModel[]>([]);
  readonly stats = signal<EnrollmentStatsResponse | null>(null);
  readonly specialists = signal<LeadSpecialistResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Edit dialog state
  readonly editing = signal<EnrollmentViewModel | null>(null);
  readonly editFirstName = signal('');
  readonly editLastName = signal('');
  readonly editDateOfBirth = signal('');
  readonly editNotes = signal('');
  readonly editStatus = signal<string>('PENDING');
  readonly editSpecialistId = signal('');
  readonly savingEdit = signal(false);
  readonly editError = signal<string | null>(null);

  // Delete dialog state
  readonly deleting = signal<EnrollmentViewModel | null>(null);
  readonly deletingInProgress = signal(false);
  readonly deleteError = signal<string | null>(null);

  // Transient success toast
  readonly actionMessage = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Filter state
  readonly selectedStatus = signal<string>('ALL');
  readonly selectedSpecialistId = signal<string | undefined>(undefined);
  readonly searchQuery = signal<string>('');

  // Pagination state
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalPages = signal(1);
  readonly totalStudents = signal(0);

  ngOnInit() {
    this.loading.set(true);
    // Load stats and specialists in parallel
    forkJoin({
      stats: this.api.getEnrollmentStats(),
      specialists: this.api.getEnrollmentSpecialists(),
    }).subscribe({
      next: ({ stats, specialists }) => {
        this.stats.set(stats);
        this.specialists.set(specialists);
        this.loadStudents();
      },
      error: () => {
        this.error.set('Failed to load enrollment data. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }

  loadStudents() {
    this.api
      .getEnrolledStudentsList({
        page: this.currentPage(),
        limit: this.pageSize(),
        status: this.selectedStatus() !== 'ALL' ? this.selectedStatus() : undefined,
        specialistId: this.selectedSpecialistId(),
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.enrollments.set(result.students.map(this.mapToViewModel));
          this.totalPages.set(result.pagination.totalPages);
          this.totalStudents.set(result.pagination.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load enrolled students.');
          this.loading.set(false);
        },
      });
  }

  onStatusFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value);
    this.currentPage.set(1);
    this.loadStudents();
  }

  onSpecialistFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedSpecialistId.set(value || undefined);
    this.currentPage.set(1);
    this.loadStudents();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadStudents();
  }

  // ── Edit student ───────────────────────────────────────────────────

  openEditDialog(enrollment: EnrollmentViewModel) {
    this.editing.set(enrollment);
    this.editError.set(null);
    this.editFirstName.set(enrollment.childName.split(' ')[0] ?? '');
    this.editLastName.set(enrollment.childName.split(' ').slice(1).join(' '));
    this.editDateOfBirth.set('');
    this.editNotes.set('');
    this.editStatus.set(enrollment.status.toUpperCase());
    this.editSpecialistId.set('');
  }

  closeEditDialog() {
    this.editing.set(null);
    this.editError.set(null);
  }

  saveEdit() {
    const student = this.editing();
    if (!student || this.savingEdit()) return;

    const firstName = this.editFirstName().trim();
    if (firstName === '') {
      this.editError.set('First name is required.');
      return;
    }

    const data: {
      firstName?: string;
      lastName?: string | null;
      dateOfBirth?: string;
      notes?: string;
      status?: SchoolChildEnrollmentStatus;
      leadSpecialistId?: string | null;
    } = {
      firstName,
      lastName: this.editLastName().trim() === '' ? null : this.editLastName().trim(),
      status: this.editStatus() as SchoolChildEnrollmentStatus,
      leadSpecialistId: this.editSpecialistId() === '' ? null : this.editSpecialistId(),
    };
    const dob = this.editDateOfBirth().trim();
    if (dob !== '') data.dateOfBirth = dob;
    const notes = this.editNotes().trim();
    if (notes !== '') data.notes = notes;

    this.savingEdit.set(true);
    this.editError.set(null);
    this.api
      .updateStudent(student.childId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.savingEdit.set(false);
          this.closeEditDialog();
          this.showToast(`${updated.childFirstName}'s profile was updated.`);
          this.refreshAfterMutation();
        },
        error: (err) => {
          this.savingEdit.set(false);
          this.editError.set(
            err?.status === 400
              ? (err?.error?.error?.message ?? 'Check the fields and try again.')
              : 'Could not save the changes. Please try again.',
          );
        },
      });
  }

  // ── Remove student ─────────────────────────────────────────────────

  openDeleteDialog(enrollment: EnrollmentViewModel) {
    this.deleting.set(enrollment);
    this.deleteError.set(null);
  }

  closeDeleteDialog() {
    this.deleting.set(null);
    this.deleteError.set(null);
  }

  confirmDelete() {
    const student = this.deleting();
    if (!student || this.deletingInProgress()) return;

    this.deletingInProgress.set(true);
    this.deleteError.set(null);
    this.api
      .deleteStudent(student.childId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ended) => {
          this.deletingInProgress.set(false);
          this.closeDeleteDialog();
          this.showToast(`${ended.childFirstName} was removed from your school's enrollment list.`);
          this.refreshAfterMutation();
        },
        error: () => {
          this.deletingInProgress.set(false);
          this.deleteError.set('Could not remove the student. Please try again.');
        },
      });
  }

  /** Reload stats + list after any mutation so counters stay honest. */
  private refreshAfterMutation() {
    this.api
      .getEnrollmentStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => undefined,
      });
    this.loadStudents();
  }

  private showToast(message: string) {
    this.actionMessage.set(message);
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.actionMessage.set(null), 4000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
  }

  private mapToViewModel(student: EnrolledStudent): EnrollmentViewModel {
    const avatar = student.firstName.charAt(0).toUpperCase();
    const statusMap: Record<string, EnrollmentViewModel['status']> = {
      ACTIVE: 'Active',
      GRADUATED: 'Graduated',
      PENDING: 'Pending',
      REJECTED: 'Rejected',
    };
    const specialistName = student.leadSpecialist
      ? `${student.leadSpecialist.firstName} ${student.leadSpecialist.lastName}`
      : 'Unassigned';

    return {
      id: student.id,
      childId: student.id,
      childName: `${student.firstName} ${student.lastName}`.trim(),
      avatar,
      status: statusMap[student.enrollmentStatus] ?? 'Pending',
      leadSpecialist: specialistName,
      communicationProgress: student.communicationProgress,
      startDate: student.startDate,
    };
  }
}
