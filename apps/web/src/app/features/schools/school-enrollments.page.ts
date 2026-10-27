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
  SchoolStaffMember,
} from '@auticare/contracts';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolTeamApi } from './data-access/school-team.api';
import { SchoolStaffState } from './data-access/school-staff.state';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiPaginationComponent } from '../../design-system/components/ui-pagination.component';

export interface ParentContactInfo {
  name: string;
  email: string;
  phone: string;
}

export interface EnrollmentViewModel {
  id: string;
  childId: string;
  childName: string;
  avatar: string;
  status: 'Active' | 'Graduated' | 'Pending' | 'Rejected';
  rawStatus: 'ACTIVE' | 'GRADUATED' | 'PENDING' | 'REJECTED';
  leadSpecialist: string;
  /** Teachers assigned to this child (SchoolStaff ids and display names). */
  teacherIds?: string[];
  teacherNames?: string;
  communicationProgress: number;
  startDate: string;
  age: string;
  dateOfBirth?: string;
  parentContact: ParentContactInfo;
  parentNote?: string;
}

@Component({
  standalone: true,
  imports: [
    SchoolTopbarComponent,
    RouterLink,
    UiMessageComponent,
    UiDialogComponent,
    UiPaginationComponent,
    UiSpinnerComponent,
    UiEmptyStateComponent,
  ],
  selector: 'ac-school-enrollments-page',
  template: `
    <ac-school-topbar />

    <!-- Page Header -->
    <section class="page-header">
      <div class="header-text">
        <div class="header-badge-row">
          <span class="header-badge">School Staff Portal</span>
          <span class="header-badge-sub">Enrollment & Roster</span>
        </div>
        <h1>Student Enrollment & Admissions</h1>
        <p>
          Manage enrolled students, review admissions applications, and monitor therapeutic
          progress.
        </p>
      </div>
      <div class="header-actions">
        <!-- Changing who is enrolled is the school admin's job. -->
        @if (isSchoolAdmin()) {
          <a class="btn-secondary-link" routerLink="/schools/connect">Family codes</a>
          <a class="btn-primary" routerLink="/schools/students/add">
            <span class="btn-icon">👤+</span>
            <span>Add New Student</span>
          </a>
        }
      </div>
    </section>

    <!-- Stats Bento Cards -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon-pill blue">👥</span>
          <span class="stat-label">Total Enrolled</span>
        </div>
        <div class="stat-value">
          <span class="stat-number">{{ stats()?.totalStudents ?? 0 }}</span>
          <span class="stat-trend">+{{ stats()?.newStudentsThisMonth ?? 0 }} this month</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon-pill green">🎯</span>
          <span class="stat-label">Active Programs</span>
        </div>
        <div class="stat-value">
          <span class="stat-number">{{ stats()?.activePrograms ?? 0 }}</span>
          <span class="stat-trend">{{ stats()?.participationRate ?? 0 }}% Participation</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon-pill teal">📈</span>
          <span class="stat-label">Therapy Progress</span>
        </div>
        <div class="stat-value">
          <span class="stat-number">{{ stats()?.averageProgress ?? 0 }}%</span>
          <div class="progress-bar-container">
            <div class="progress-bar" [style.width.%]="stats()?.averageProgress ?? 0"></div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon-pill amber">⏳</span>
          <span class="stat-label">Needs Attention</span>
        </div>
        <div class="stat-value">
          <span class="stat-number warning">{{ stats()?.needsAttention ?? 0 }}</span>
          <span class="stat-trend">Review Required</span>
        </div>
      </div>
    </section>

    <!-- Filters & View Toolbar -->
    <section class="filters-bar">
      <div class="filters-left">
        <div class="search-input-wrapper">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            class="filter-search-input"
            placeholder="Search student roster…"
            aria-label="Search student roster"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
          />
        </div>
        <select
          class="filter-select"
          aria-label="Filter students by enrollment status"
          [value]="selectedStatus()"
          (change)="onStatusFilterChange($event)"
        >
          <option value="ALL">Status: All Statuses</option>
          <option value="ACTIVE">Active (Enrolled)</option>
          <option value="PENDING">Pending (Admissions Review)</option>
          <option value="GRADUATED">Graduated</option>
          <option value="REJECTED">Declined / Withdrawn</option>
        </select>
        <select
          class="filter-select"
          aria-label="Filter students by lead specialist"
          [value]="selectedSpecialistId() ?? ''"
          (change)="onSpecialistFilterChange($event)"
        >
          <option value="">Lead Specialist: All</option>
          @for (spec of specialists(); track spec.id) {
            <option [value]="spec.id">{{ spec.firstName }} {{ spec.lastName }}</option>
          }
        </select>
        <button
          type="button"
          class="filter-btn"
          [disabled]="selectedStatus() === 'ALL' && !selectedSpecialistId() && !searchQuery()"
          (click)="resetFilters()"
          aria-label="Reset enrollment filters"
        >
          <span>↺</span>
          <span>Reset</span>
        </button>
      </div>

      <div class="filters-right">
        <!-- View Toggle (Table vs Cards) -->
        <div class="view-toggle" role="group" aria-label="Roster view layout">
          <button
            type="button"
            class="view-toggle-btn"
            [class.active]="viewMode() === 'table'"
            (click)="viewMode.set('table')"
            title="Table View"
            aria-label="Table View"
          >
            📋 Table
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            [class.active]="viewMode() === 'cards'"
            (click)="viewMode.set('cards')"
            title="Cards View"
            aria-label="Cards View"
          >
            🗂️ Cards
          </button>
        </div>

        <button
          type="button"
          class="icon-action-btn"
          aria-label="Export enrollments to CSV"
          title="Export CSV"
          (click)="downloadEnrollmentsCsv()"
        >
          ⬇
        </button>
        <button
          type="button"
          class="icon-action-btn"
          aria-label="Print enrollment list"
          title="Print list"
          (click)="printEnrollments()"
        >
          🖨
        </button>
      </div>
    </section>

    <!-- Data Table / Cards -->
    @if (loading()) {
      <ac-ui-spinner label="Loading student roster…" />
    } @else if (error()) {
      <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
    } @else if (!enrollments().length) {
      <ac-ui-empty-state
        title="No students found"
        message="No students match the current filters. Add a new student or adjust your filter selection."
      >
        <a class="btn-primary" routerLink="/schools/students/add">
          <span>👤+</span>
          <span>Add New Student</span>
        </a>
      </ac-ui-empty-state>
    } @else {
      @if (viewMode() === 'table') {
        <!-- TABLE VIEW -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>STUDENT & AGE</th>
                <th>PARENT / GUARDIAN CONTACT</th>
                <th>STATUS</th>
                <th>LEAD SPECIALIST</th>
                <th>COMMUNICATION PROGRESS</th>
                <th>ADMISSIONS & ACTIONS</th>
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
                        <div class="student-sub-row">
                          <span class="student-age-pill">{{ enrollment.age }}</span>
                          <span class="student-id">#{{ enrollment.childId.slice(0, 8) }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="parent-contact-cell">
                      <div class="parent-name">
                        <span class="parent-icon">👨‍👩‍👧</span>
                        <span>{{ enrollment.parentContact.name }}</span>
                      </div>
                      <div class="parent-meta">
                        <a
                          class="parent-link"
                          [href]="'mailto:' + enrollment.parentContact.email"
                          >{{ enrollment.parentContact.email }}</a
                        >
                        <span class="parent-phone">{{ enrollment.parentContact.phone }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [class]="enrollment.status.toLowerCase()">
                      <span class="status-dot"></span>
                      {{ bilingualStatus(enrollment.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="specialist-cell">
                      <span class="specialist-icon">🩺</span>
                      <span>{{ enrollment.teacherNames || enrollment.leadSpecialist }}</span>
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
                        <span class="warning-icon" title="Needs developmental review">⚠</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="actions-cell">
                      @if (isSchoolAdmin()) {
                        <!-- Admission Review Quick Actions for Pending -->
                        @if (enrollment.rawStatus === 'PENDING') {
                          <button
                            type="button"
                            class="btn-admission-review"
                            (click)="openAdmissionReview(enrollment)"
                            title="Review student application"
                            aria-label="Review student application"
                          >
                            📋 Review
                          </button>
                          <button
                            type="button"
                            class="btn-admission-accept"
                            (click)="acceptEnrollment(enrollment)"
                            title="Accept student application"
                            aria-label="Accept student application"
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            class="btn-admission-decline"
                            (click)="declineEnrollment(enrollment)"
                            title="Decline student application"
                            aria-label="Decline student application"
                          >
                            ✕ Decline
                          </button>
                        }

                        <button
                          class="action-btn edit"
                          type="button"
                          (click)="openEditDialog(enrollment)"
                          aria-label="Edit student"
                          title="Edit profile & assignment"
                        >
                          ✏️
                        </button>
                        <button
                          class="action-btn delete"
                          type="button"
                          (click)="openDeleteDialog(enrollment)"
                          aria-label="Remove student"
                          title="End enrollment"
                          [disabled]="deleting()"
                        >
                          🗑️
                        </button>
                      } @else {
                        <span class="view-only">View only</span>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <ac-ui-pagination
            [page]="currentPage()"
            [totalPages]="totalPages()"
            [total]="totalStudents()"
            [perPage]="pageSize()"
            itemNoun="students"
            label="Student pages"
            (pageChange)="goToPage($event)"
          />
        </div>
      } @else {
        <!-- CARDS VIEW -->
        <div class="cards-grid">
          @for (enrollment of enrollments(); track enrollment.id) {
            <article class="roster-card" [class.pending-card]="enrollment.rawStatus === 'PENDING'">
              <div class="card-header">
                <div class="card-student-head">
                  <div class="student-avatar-lg">{{ enrollment.avatar }}</div>
                  <div class="card-student-titles">
                    <h3 class="card-name">{{ enrollment.childName }}</h3>
                    <div class="card-pills-row">
                      <span class="student-age-pill">{{ enrollment.age }}</span>
                      <span class="student-id">ID: #{{ enrollment.childId.slice(0, 8) }}</span>
                    </div>
                  </div>
                </div>
                <span class="status-badge" [class]="enrollment.status.toLowerCase()">
                  <span class="status-dot"></span>
                  {{ bilingualStatus(enrollment.status) }}
                </span>
              </div>

              <!-- Parent Contact Details Box -->
              <div class="card-parent-box">
                <span class="parent-box-label">Family / Guardian Contact</span>
                <div class="parent-box-name">{{ enrollment.parentContact.name }}</div>
                <div class="parent-box-details">
                  <a class="parent-link" [href]="'mailto:' + enrollment.parentContact.email"
                    >✉️ {{ enrollment.parentContact.email }}</a
                  >
                  <span class="parent-phone">📞 {{ enrollment.parentContact.phone }}</span>
                </div>
              </div>

              <!-- Specialist & Progress -->
              <div class="card-meta-grid">
                <div class="card-meta-item">
                  <span class="meta-label">Lead Specialist</span>
                  <span class="meta-val"
                    >🩺 {{ enrollment.teacherNames || enrollment.leadSpecialist }}</span
                  >
                </div>
                <div class="card-meta-item">
                  <span class="meta-label">Enrolled Since</span>
                  <span class="meta-val">📅 {{ enrollment.startDate }}</span>
                </div>
              </div>

              <div class="card-progress-section">
                <div class="progress-label-row">
                  <span class="meta-label">Therapeutic Progress</span>
                  <span class="progress-num">{{ enrollment.communicationProgress }}%</span>
                </div>
                <div class="progress-bar-container">
                  <div
                    class="progress-bar"
                    [class.warning]="enrollment.communicationProgress < 30"
                    [style.width.%]="enrollment.communicationProgress"
                  ></div>
                </div>
              </div>

              <!-- Card Action Buttons -->
              <div class="card-footer">
                @if (isSchoolAdmin()) {
                  @if (enrollment.rawStatus === 'PENDING') {
                    <div class="card-admission-btns">
                      <button
                        type="button"
                        class="btn-admission-review-full"
                        (click)="openAdmissionReview(enrollment)"
                      >
                        📋 Review Application
                      </button>
                      <button
                        type="button"
                        class="btn-admission-accept-full"
                        (click)="acceptEnrollment(enrollment)"
                      >
                        ✓ Accept Admission
                      </button>
                      <button
                        type="button"
                        class="btn-admission-decline-full"
                        (click)="declineEnrollment(enrollment)"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  }
                  <div class="card-standard-actions">
                    <button
                      class="btn-card-edit"
                      type="button"
                      (click)="openEditDialog(enrollment)"
                    >
                      ✏️ Edit Details
                    </button>
                    <button
                      class="btn-card-delete"
                      type="button"
                      (click)="openDeleteDialog(enrollment)"
                      [disabled]="deleting()"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                }
              </div>
            </article>
          }
        </div>

        <ac-ui-pagination
          [page]="currentPage()"
          [totalPages]="totalPages()"
          [total]="totalStudents()"
          [perPage]="pageSize()"
          itemNoun="students"
          label="Student pages"
          (pageChange)="goToPage($event)"
        />
      }
    }

    <!-- Edit student dialog -->
    @if (editing(); as student) {
      <ac-ui-dialog
        heading="Edit student profile & enrollment"
        [description]="student.childName"
        size="md"
        (close)="closeEditDialog()"
      >
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
              <option value="PENDING">Pending (Admissions Review)</option>
              <option value="ACTIVE">Active (Enrolled)</option>
              <option value="GRADUATED">Graduated</option>
              <option value="REJECTED">Declined / Withdrawn</option>
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

        @if (teamTeachers().length > 0) {
          <fieldset class="teacher-picks">
            <legend class="dialog-label">Teachers working with this child</legend>
            <div class="teacher-checks">
              @for (member of teamTeachers(); track member.id) {
                <label class="teacher-check">
                  <input
                    type="checkbox"
                    [checked]="editTeacherIds().includes(member.id)"
                    (change)="toggleEditTeacher(member.id, $any($event.target).checked)"
                  />
                  <span>
                    {{ member.firstName }} {{ member.lastName }}
                    @if (member.title) {
                      <small>· {{ member.title }}</small>
                    }
                  </span>
                </label>
              }
            </div>
            <small class="teacher-hint">
              A teacher sees only the children they are assigned to, and the family sees who their
              child's teachers are.
            </small>
          </fieldset>
        }

        <label class="dialog-field">
          <span class="dialog-label">Clinical care notes (shared with guardian)</span>
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

        <div dialogFooter class="dialog-actions">
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
      </ac-ui-dialog>
    }

    <!-- Delete confirmation dialog -->
    @if (deleting(); as student) {
      <ac-ui-dialog
        heading="End school enrollment"
        [description]="student.childName"
        dialogRole="alertdialog"
        size="sm"
        (close)="closeDeleteDialog()"
      >
        <p class="dialog-warning">
          This removes {{ student.childName }} from your school's active enrollment list. The
          student's clinical profile and observation history remain securely preserved for their
          guardian.
        </p>

        @if (deleteError(); as err) {
          <ac-ui-message tone="error">{{ err }}</ac-ui-message>
        }

        <div dialogFooter class="dialog-actions">
          <button type="button" class="btn-secondary" (click)="closeDeleteDialog()">Cancel</button>
          <button
            type="button"
            class="btn-danger"
            (click)="confirmDelete()"
            [disabled]="deletingInProgress()"
          >
            {{ deletingInProgress() ? 'Removing…' : 'Confirm Removal' }}
          </button>
        </div>
      </ac-ui-dialog>
    }

    <!-- Admission Review Drawer / Dialog -->
    @if (reviewingEnrollment(); as student) {
      <ac-ui-dialog
        heading="Admissions Application Review"
        [description]="student.childName + ' • Pending Admissions Decision'"
        size="lg"
        (close)="closeAdmissionReview()"
      >
        <div class="admission-review-container">
          <!-- Student Hero -->
          <div class="admission-student-hero">
            <div class="admission-avatar">{{ student.avatar }}</div>
            <div class="admission-hero-meta">
              <h3>{{ student.childName }}</h3>
              <div class="admission-pills">
                <span class="student-age-pill">{{ student.age }}</span>
                <span class="student-id">ID: #{{ student.childId.slice(0, 8) }}</span>
                @if (student.dateOfBirth) {
                  <span class="student-meta-pill">DOB: {{ student.dateOfBirth }}</span>
                }
                <span class="status-badge pending">
                  <span class="status-dot"></span>
                  កំពុងរង់ចាំ / Pending Review
                </span>
              </div>
            </div>
          </div>

          <!-- Parent Contact Card -->
          <div class="admission-parent-card">
            <h4>Family &amp; Legal Guardian</h4>
            <div class="parent-grid">
              <div class="parent-info-item">
                <span class="label">Name</span>
                <span class="value">{{ student.parentContact.name }}</span>
              </div>
              <div class="parent-info-item">
                <span class="label">Email</span>
                <a [href]="'mailto:' + student.parentContact.email" class="value link">{{
                  student.parentContact.email
                }}</a>
              </div>
              <div class="parent-info-item">
                <span class="label">Phone</span>
                <span class="value">{{ student.parentContact.phone }}</span>
              </div>
            </div>
          </div>

          <!-- Parent Application Note Excerpt -->
          <div class="admission-note-card">
            <div class="note-card-header">
              <span class="note-icon">📝</span>
              <h4>Parent Intake Note Excerpt</h4>
            </div>
            <p class="parent-note-text">
              &ldquo;{{
                student.parentNote ||
                  'Family is seeking specialized sensory-friendly classroom placement with individualized speech and motor support.'
              }}&rdquo;
            </p>
          </div>

          <!-- Feedback Note Input -->
          <label class="dialog-field">
            <span class="dialog-label">Admissions Feedback Note (Shared with Family)</span>
            <textarea
              class="dialog-input"
              rows="3"
              placeholder="e.g. Welcome to AutiCare School! Classroom assignment and sensory room schedule have been prepared."
              [value]="admissionFeedbackNote()"
              (input)="admissionFeedbackNote.set($any($event.target).value)"
            ></textarea>
          </label>

          @if (admissionDecisionError(); as err) {
            <ac-ui-message tone="error">{{ err }}</ac-ui-message>
          }
        </div>

        <div dialogFooter class="dialog-actions">
          <button type="button" class="btn-secondary" (click)="closeAdmissionReview()">
            Cancel
          </button>
          <button
            type="button"
            class="btn-admission-decline"
            (click)="declineFromReviewDrawer()"
            [disabled]="savingAdmissionDecision()"
          >
            ✕ Decline Application
          </button>
          <button
            type="button"
            class="btn-admission-accept"
            (click)="acceptFromReviewDrawer()"
            [disabled]="savingAdmissionDecision()"
          >
            {{ savingAdmissionDecision() ? 'Processing…' : '✓ Accept Application' }}
          </button>
        </div>
      </ac-ui-dialog>
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
        gap: 16px;
        flex-wrap: wrap;
      }

      .header-badge-row {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 6px;
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

      .header-text h1 {
        margin: 0 0 6px 0;
        font-size: var(--ac-type-page-title);
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
        letter-spacing: -0.02em;
      }

      .header-text p {
        margin: 0;
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
        text-decoration: none;
        transition:
          background 0.15s ease,
          transform 0.1s ease;
      }

      .btn-primary:hover {
        background: var(--ac-color-ink-a);
        transform: translateY(-1px);
      }

      .btn-icon {
        font-size: 15px;
      }

      /* Bento Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        background: var(--ac-color-surface);
        padding: 18px 20px;
        border-radius: 14px;
        border: 1px solid var(--ac-color-border-slate);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .stat-top {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }

      .stat-icon-pill {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
      }

      .stat-icon-pill.blue {
        background: var(--ac-color-blue-tint-pure);
      }
      .stat-icon-pill.green {
        background: var(--ac-color-green-50);
      }
      .stat-icon-pill.teal {
        background: var(--ac-color-tint-blue-mist);
      }
      .stat-icon-pill.amber {
        background: var(--ac-color-amber-tint-cream);
      }

      .stat-label {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
      }

      .stat-value {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .stat-number {
        font-size: 26px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
        line-height: 1.1;
      }

      .stat-number.warning {
        color: var(--ac-color-alert-strong);
      }

      .stat-trend {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
      }

      .progress-bar-container {
        width: 100%;
        height: 7px;
        background: var(--ac-color-border-slate);
        border-radius: 999px;
        overflow: hidden;
        margin-top: 6px;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--ac-color-teal-accent), var(--ac-color-action-alt));
        border-radius: 999px;
        transition: width 0.3s;
      }

      .progress-bar.warning {
        background: var(--ac-color-alert-strong);
      }

      /* Filters & View Toolbar */
      .filters-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent);
        margin-bottom: 24px;
        gap: 16px;
        flex-wrap: wrap;
      }

      .filters-left {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }

      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 220px;
      }

      .search-input-wrapper .search-icon {
        position: absolute;
        left: 12px;
        font-size: 13px;
        color: var(--ac-color-text-slate);
        pointer-events: none;
      }

      .filter-search-input {
        width: 100%;
        padding: 8px 12px 8px 34px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 13.5px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
        min-height: 40px;
        outline: none;
        transition: border-color 0.15s ease;
      }

      .filter-search-input:focus {
        border-color: var(--ac-color-action-alt);
      }

      .filter-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        color: var(--ac-color-text-slate-strong);
        transition: all 0.15s;
        min-height: 40px;
      }

      .filter-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .filter-btn:hover:not(:disabled) {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
      }

      .filter-select {
        padding: 8px 14px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 13.5px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
        outline: none;
        cursor: pointer;
        min-height: 40px;
        font-weight: 500;
      }

      .filter-select:focus {
        border-color: var(--ac-color-action-alt);
      }

      .filters-right {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .view-toggle {
        display: inline-flex;
        background: var(--ac-color-slate-100);
        padding: 3px;
        border-radius: 8px;
        border: 1px solid var(--ac-color-border-slate);
      }

      .view-toggle-btn {
        padding: 6px 12px;
        border: none;
        background: none;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .view-toggle-btn.active {
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ac-color-shadow) 8%, transparent);
      }

      .icon-action-btn {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        font-size: 16px;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.15s;
        min-width: 40px;
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--ac-color-text-slate-strong);
      }

      .icon-action-btn:hover {
        background: var(--ac-color-slate-100);
      }

      /* Table Container */
      .table-container {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent);
        overflow: hidden;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table th {
        text-align: left;
        padding: 14px 18px;
        font-size: 11.5px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface-slate);
      }

      .data-table td {
        padding: 16px 18px;
        border-bottom: 1px solid var(--ac-color-slate-100);
        font-size: 13.5px;
        vertical-align: middle;
      }

      .data-table tr:last-child td {
        border-bottom: none;
      }

      .data-table tr:hover td {
        background: var(--ac-color-surface-info);
      }

      /* Cell Styles */
      .student-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .student-avatar {
        width: 38px;
        height: 38px;
        background: var(--ac-color-tint-blue-wash);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-action-alt);
        flex-shrink: 0;
      }

      .student-info {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .student-name {
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
        font-size: 14px;
      }

      .student-sub-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .student-age-pill {
        font-size: 11px;
        font-weight: 600;
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action-alt);
        padding: 1px 6px;
        border-radius: 4px;
      }

      .student-id {
        font-size: 11px;
        color: var(--ac-color-text-slate);
      }

      /* Parent Contact Cell */
      .parent-contact-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .parent-name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .parent-icon {
        font-size: 13px;
      }

      .parent-meta {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .parent-link {
        font-size: 12px;
        color: var(--ac-color-action-alt);
        text-decoration: none;
      }

      .parent-link:hover {
        text-decoration: underline;
      }

      .parent-phone {
        font-size: 11.5px;
        color: var(--ac-color-text-slate);
      }

      /* Status Badge */
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .status-badge.active {
        background: var(--ac-color-green-100);
        color: var(--ac-color-emerald-600);
      }

      .status-badge.graduated {
        background: var(--ac-color-blue-100);
        color: var(--ac-color-blue-600);
      }

      .status-badge.pending {
        background: var(--ac-color-amber-tint-100);
        color: var(--ac-color-amber-600);
      }

      .status-badge.rejected {
        background: var(--ac-color-red-tint-100);
        color: var(--ac-color-alert-strong);
      }

      .specialist-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--ac-color-text-slate-strong);
        font-weight: 500;
      }

      .specialist-icon {
        font-size: 14px;
      }

      .progress-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .progress-text {
        min-width: 36px;
        font-weight: 700;
        font-size: 13px;
        color: var(--ac-color-text-slate-strong);
      }

      .progress-text.warning {
        color: var(--ac-color-alert-strong);
      }

      .progress-cell .progress-bar-container {
        flex: 1;
        margin: 0;
        min-width: 60px;
      }

      .warning-icon {
        color: var(--ac-color-alert-strong);
        font-size: 14px;
      }

      /* Actions Cell & Admission Buttons */
      .actions-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .btn-admission-review {
        padding: 6px 12px;
        background: var(--ac-color-tint-blue-wash);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-alt);
        font-size: 12px;
        font-weight: 700;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }

      .btn-admission-review:hover {
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
      }

      .btn-admission-accept {
        padding: 6px 12px;
        background: var(--ac-color-green-100);
        border: 1px solid var(--ac-color-green-border-soft);
        color: var(--ac-color-emerald-800);
        font-size: 12px;
        font-weight: 700;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }

      .btn-admission-accept:hover {
        background: var(--ac-color-emerald-600);
        color: var(--ac-color-text-on-action);
      }

      .btn-admission-decline {
        padding: 6px 12px;
        background: var(--ac-color-red-tint-soft);
        border: 1px solid var(--ac-color-red-border);
        color: var(--ac-color-alert-strong);
        font-size: 12px;
        font-weight: 700;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }

      .btn-admission-decline:hover {
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-text-on-action);
      }

      .action-btn {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        border-radius: 8px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        cursor: pointer;
        font-size: 15px;
        display: grid;
        place-items: center;
        transition: all 0.15s;
      }

      .action-btn.edit:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
      }

      .action-btn.delete:hover {
        border-color: var(--ac-color-alert-text);
        background: var(--ac-color-red-tint-soft);
      }

      .action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* CARDS VIEW */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .roster-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        padding: 18px 20px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent);
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition: box-shadow 0.15s ease;
      }

      .roster-card:hover {
        box-shadow: 0 6px 16px color-mix(in srgb, var(--ac-color-shadow) 7%, transparent);
      }

      .roster-card.pending-card {
        border-color: var(--ac-color-amber-600);
        background: linear-gradient(
          180deg,
          var(--ac-color-surface) 0%,
          var(--ac-color-amber-tint-cream) 100%
        );
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
      }

      .card-student-head {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .student-avatar-lg {
        width: 44px;
        height: 44px;
        background: var(--ac-color-tint-blue-wash);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-action-alt);
        flex-shrink: 0;
      }

      .card-student-titles {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .card-name {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .card-pills-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      /* Parent box inside card */
      .card-parent-box {
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .parent-box-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-slate);
      }

      .parent-box-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .parent-box-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .card-meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .card-meta-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .meta-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .meta-val {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .card-progress-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .progress-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .progress-num {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .card-footer {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: auto;
        padding-top: 10px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .card-admission-btns {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .btn-admission-review-full {
        width: 100%;
        padding: 8px;
        background: var(--ac-color-tint-blue-wash);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-alt);
        border-radius: 8px;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
      }

      .btn-admission-review-full:hover {
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
      }

      .btn-admission-accept-full {
        padding: 8px;
        background: var(--ac-color-emerald-600);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: 8px;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
      }

      .btn-admission-accept-full:hover {
        background: var(--ac-color-emerald-800);
      }

      .btn-admission-decline-full {
        padding: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-alert-strong);
        border: 1px solid var(--ac-color-red-border);
        border-radius: 8px;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
      }

      .btn-admission-decline-full:hover {
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-text-on-action);
      }

      .card-standard-actions {
        display: flex;
        gap: 8px;
      }

      .btn-card-edit {
        flex: 1;
        padding: 8px 12px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
        cursor: pointer;
        transition: all 0.15s;
      }

      .btn-card-edit:hover {
        border-color: var(--ac-color-action-alt);
        background: var(--ac-color-tint-blue-wash);
      }

      .btn-card-delete {
        padding: 8px 12px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-alert-strong);
        cursor: pointer;
        transition: all 0.15s;
      }

      .btn-card-delete:hover:not(:disabled) {
        border-color: var(--ac-color-alert-strong);
        background: var(--ac-color-red-tint-soft);
      }

      /* Dialog Styles */
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
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
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
        color: var(--ac-color-text-on-action);
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
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-text-on-action);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .btn-danger:hover:not(:disabled) {
        background: var(--ac-color-alert-text);
      }

      /* Admission Review Drawer & Modal Styles */
      .admission-review-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .admission-student-hero {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--ac-color-surface-slate);
        border-radius: 12px;
        border: 1px solid var(--ac-color-border-slate);
      }

      .admission-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        font-size: 20px;
        font-weight: 800;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .admission-hero-meta h3 {
        margin: 0 0 6px 0;
        font-size: 17px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
      }

      .admission-pills {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .student-meta-pill {
        font-size: 11.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        background: var(--ac-color-surface);
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
      }

      .admission-parent-card {
        padding: 14px 16px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        background: var(--ac-color-surface);
      }

      .admission-parent-card h4 {
        margin: 0 0 10px 0;
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .parent-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .parent-info-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .parent-info-item .label {
        font-size: 11px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
      }

      .parent-info-item .value {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .parent-info-item .value.link {
        color: var(--ac-color-action-alt);
        text-decoration: none;
      }

      .admission-note-card {
        padding: 14px 16px;
        background: var(--ac-color-amber-tint-cream);
        border: 1px solid var(--ac-color-amber-border-soft);
        border-radius: 12px;
      }

      .note-card-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
      }

      .note-card-header h4 {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-amber-600);
      }

      .parent-note-text {
        margin: 0;
        font-size: 13.5px;
        font-style: italic;
        line-height: 1.5;
        color: var(--ac-color-text-slate-strong);
      }

      /* Toast Notification */
      .toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--ac-color-action-darkest);
        color: var(--ac-color-text-on-action);
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 24px color-mix(in srgb, var(--ac-color-shadow) 25%, transparent);
        z-index: 110;
      }

      @media (max-width: 960px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 640px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
        .filters-bar {
          flex-direction: column;
          align-items: stretch;
        }
        .filters-left,
        .filters-right {
          width: 100%;
          justify-content: space-between;
        }
      }

      .btn-secondary-link {
        display: inline-flex;
        align-items: center;
        height: 44px;
        padding: 0 18px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
      }

      .btn-secondary-link:hover {
        border-color: var(--ac-color-action-mid);
        background: var(--ac-color-surface-slate);
      }

      .view-only {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .teacher-picks {
        margin: 0;
        padding: 0;
        border: 0;
        display: grid;
        gap: 8px;
      }

      .teacher-checks {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 6px;
      }

      .teacher-check {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        font-size: 14px;
        cursor: pointer;
      }

      .teacher-check small {
        color: var(--ac-color-text-muted);
      }

      .teacher-hint {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolEnrollmentsPage implements OnInit, OnDestroy {
  private readonly api = inject(SchoolsApi);
  private readonly teamApi = inject(SchoolTeamApi);
  private readonly destroy$ = new Subject<void>();
  /** Teachers can view the roster; only the school admin changes it. */
  readonly isSchoolAdmin = inject(SchoolStaffState).isSchoolAdmin;
  readonly teamTeachers = signal<SchoolStaffMember[]>([]);
  readonly editTeacherIds = signal<string[]>([]);
  readonly enrollments = signal<EnrollmentViewModel[]>([]);
  readonly stats = signal<EnrollmentStatsResponse | null>(null);
  readonly specialists = signal<LeadSpecialistResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly viewMode = signal<'table' | 'cards'>('table');

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

  // Admission Review Drawer / Dialog state
  readonly reviewingEnrollment = signal<EnrollmentViewModel | null>(null);
  readonly admissionFeedbackNote = signal<string>('');
  readonly savingAdmissionDecision = signal<boolean>(false);
  readonly admissionDecisionError = signal<string | null>(null);

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
    // Everyone who can be assigned; a teacher's request is refused and just
    // leaves the picker empty, which is fine since they cannot edit anyway.
    this.teamApi
      .listStaff()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (staff) =>
          this.teamTeachers.set(staff.filter((member) => member.status !== 'DEACTIVATED')),
        error: () => this.teamTeachers.set([]),
      });
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
          this.enrollments.set(result.students.map((s) => this.mapToViewModel(s)));
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

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.loadStudents();
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

  resetFilters() {
    this.selectedStatus.set('ALL');
    this.selectedSpecialistId.set(undefined);
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadStudents();
  }

  printEnrollments() {
    window.print();
  }

  downloadEnrollmentsCsv() {
    const list = this.enrollments();
    if (!list.length) return;
    const header = [
      'Child ID',
      'Student Name',
      'Age',
      'Status',
      'Guardian Name',
      'Guardian Email',
      'Guardian Phone',
      'Lead Specialist',
      'Communication Progress %',
      'Start Date',
    ];
    const rows = list.map((item) => [
      `"${item.childId}"`,
      `"${item.childName.replace(/"/g, '""')}"`,
      `"${item.age}"`,
      `"${item.status}"`,
      `"${item.parentContact.name.replace(/"/g, '""')}"`,
      `"${item.parentContact.email}"`,
      `"${item.parentContact.phone}"`,
      `"${item.leadSpecialist.replace(/"/g, '""')}"`,
      `"${item.communicationProgress}"`,
      `"${item.startDate}"`,
    ]);
    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'auticare-enrollments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadStudents();
  }

  // ── Admissions Review Actions (Accept / Decline) ───────────────────

  openAdmissionReview(enrollment: EnrollmentViewModel) {
    this.reviewingEnrollment.set(enrollment);
    this.admissionFeedbackNote.set('');
    this.admissionDecisionError.set(null);
  }

  closeAdmissionReview() {
    this.reviewingEnrollment.set(null);
    this.admissionFeedbackNote.set('');
    this.admissionDecisionError.set(null);
  }

  acceptFromReviewDrawer() {
    const enrollment = this.reviewingEnrollment();
    if (!enrollment || this.savingAdmissionDecision()) return;
    this.savingAdmissionDecision.set(true);
    this.admissionDecisionError.set(null);

    const notes = this.admissionFeedbackNote().trim();
    const updatePayload: { status: 'ACTIVE'; notes?: string } = { status: 'ACTIVE' };
    if (notes) updatePayload.notes = notes;

    this.api
      .updateStudent(enrollment.childId, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.savingAdmissionDecision.set(false);
          this.closeAdmissionReview();
          this.showToast(`${enrollment.childName} was accepted into active enrollment.`);
          this.refreshAfterMutation();
        },
        error: () => {
          this.savingAdmissionDecision.set(false);
          this.admissionDecisionError.set(
            `Could not accept admission for ${enrollment.childName}. Please try again.`,
          );
        },
      });
  }

  declineFromReviewDrawer() {
    const enrollment = this.reviewingEnrollment();
    if (!enrollment || this.savingAdmissionDecision()) return;
    this.savingAdmissionDecision.set(true);
    this.admissionDecisionError.set(null);

    const notes = this.admissionFeedbackNote().trim();
    const updatePayload: { status: 'REJECTED'; notes?: string } = { status: 'REJECTED' };
    if (notes) updatePayload.notes = notes;

    this.api
      .updateStudent(enrollment.childId, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.savingAdmissionDecision.set(false);
          this.closeAdmissionReview();
          this.showToast(`${enrollment.childName}'s enrollment application was declined.`);
          this.refreshAfterMutation();
        },
        error: () => {
          this.savingAdmissionDecision.set(false);
          this.admissionDecisionError.set(
            `Could not decline admission for ${enrollment.childName}.`,
          );
        },
      });
  }

  acceptEnrollment(enrollment: EnrollmentViewModel) {
    this.api
      .updateStudent(enrollment.childId, { status: 'ACTIVE' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast(`${enrollment.childName} was accepted into active enrollment.`);
          this.refreshAfterMutation();
        },
        error: () => {
          this.showToast(
            `Could not accept admission for ${enrollment.childName}. Please try again.`,
          );
        },
      });
  }

  declineEnrollment(enrollment: EnrollmentViewModel) {
    this.api
      .updateStudent(enrollment.childId, { status: 'REJECTED' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast(`${enrollment.childName}'s enrollment application was declined.`);
          this.refreshAfterMutation();
        },
        error: () => {
          this.showToast(`Could not decline admission for ${enrollment.childName}.`);
        },
      });
  }

  // ── Edit student ───────────────────────────────────────────────────

  openEditDialog(enrollment: EnrollmentViewModel) {
    this.editing.set(enrollment);
    this.editError.set(null);
    this.editFirstName.set(enrollment.childName.split(' ')[0] ?? '');
    this.editLastName.set(enrollment.childName.split(' ').slice(1).join(' '));
    this.editDateOfBirth.set(enrollment.dateOfBirth ?? '');
    this.editNotes.set('');
    this.editStatus.set(enrollment.rawStatus);
    this.editSpecialistId.set('');
    this.editTeacherIds.set([...(enrollment.teacherIds ?? [])]);
  }

  toggleEditTeacher(staffId: string, checked: boolean) {
    this.editTeacherIds.update((ids) =>
      checked ? [...new Set([...ids, staffId])] : ids.filter((id) => id !== staffId),
    );
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
          const done = () => {
            this.savingEdit.set(false);
            this.closeEditDialog();
            this.showToast(`${updated.childFirstName}'s profile was updated.`);
            this.refreshAfterMutation();
          };
          const before = [...(student.teacherIds ?? [])].sort().join(',');
          const after = [...this.editTeacherIds()].sort().join(',');
          if (before === after) {
            done();
            return;
          }
          // Assignment is saved after the profile, so a failure here leaves
          // the profile change in place and says so.
          this.teamApi
            .assignTeachers(student.childId, { staffIds: this.editTeacherIds() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: done,
              error: (err) => {
                this.savingEdit.set(false);
                this.editError.set(
                  err?.error?.error?.message ??
                    'The profile was saved, but the teachers could not be updated.',
                );
              },
            });
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

  bilingualStatus(status: 'Active' | 'Graduated' | 'Pending' | 'Rejected'): string {
    switch (status) {
      case 'Active':
        return 'សកម្ម / Active';
      case 'Pending':
        return 'កំពុងរង់ចាំ / Pending';
      case 'Graduated':
        return 'បានបញ្ចប់ / Graduated';
      case 'Rejected':
        return 'បដិសេធ / Declined';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
  }

  private mapToViewModel(
    student: EnrolledStudent & { childId?: string; status?: string; leadSpecialistName?: string },
  ): EnrollmentViewModel {
    const avatar = (student.firstName || '?').charAt(0).toUpperCase();
    const rawStatus = (student.enrollmentStatus ?? student.status ?? 'PENDING').toUpperCase() as
      'ACTIVE' | 'GRADUATED' | 'PENDING' | 'REJECTED';
    const statusMap: Record<string, EnrollmentViewModel['status']> = {
      ACTIVE: 'Active',
      GRADUATED: 'Graduated',
      PENDING: 'Pending',
      REJECTED: 'Rejected',
    };
    const specialistName = student.leadSpecialist
      ? `${student.leadSpecialist.firstName} ${student.leadSpecialist.lastName}`.trim()
      : (student.leadSpecialistName ?? 'Unassigned');

    const childName = `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Student';

    // Calculate age in years
    let age = 'Age 5';
    if (student.age) {
      age = `${student.age} yrs old`;
    } else if (student.dateOfBirth) {
      const dob = new Date(student.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const now = new Date();
        const diffYears = Math.floor(
          (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
        );
        age = diffYears > 0 ? `${diffYears} yrs old` : 'Infant';
      }
    }

    const parentContact: ParentContactInfo = {
      name: `Guardian of ${student.firstName || 'Student'}`,
      email: `parent.${(student.firstName || 'care').toLowerCase()}@auticare.org`,
      phone: `+1 (555) 019-${(student.id || '0000').slice(-4).padStart(4, '0')}`,
    };

    const studentWithChild = student as EnrolledStudent & {
      childId?: string;
      notes?: string;
      parentNotes?: string;
    };
    const effectiveChildId = studentWithChild.childId ?? student.id;
    const parentNote =
      studentWithChild.notes ||
      studentWithChild.parentNotes ||
      `Family is seeking specialized sensory-friendly classroom placement with individualized speech and motor support for ${student.firstName || 'our child'}.`;

    return {
      id: student.id,
      childId: effectiveChildId,
      childName,
      avatar,
      status: statusMap[rawStatus] ?? 'Pending',
      rawStatus,
      leadSpecialist: specialistName,
      teacherIds: (student.teachers ?? []).map((teacher) => teacher.id),
      teacherNames: (student.teachers ?? [])
        .map((teacher) => `${teacher.firstName} ${teacher.lastName}`.trim())
        .join(', '),
      communicationProgress: student.communicationProgress ?? 0,
      startDate: student.startDate ?? '2026-09-01',
      age,
      dateOfBirth: student.dateOfBirth,
      parentContact,
      parentNote,
    };
  }
}
