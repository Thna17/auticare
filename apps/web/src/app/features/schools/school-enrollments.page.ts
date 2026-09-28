// school-enrollments.page.ts
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type {
  EnrollmentStatsResponse,
  EnrolledStudent,
  LeadSpecialistResponse,
} from '@auticare/contracts';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';

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
  imports: [UiCardComponent, SchoolTopbarComponent, RouterLink],
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
      <p class="error" role="alert">{{ error() }}</p>
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
                  <button class="kebab-btn" aria-label="Actions"></button>
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
        color: #0f172a;
      }

      .header-text p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
      }

      .btn-primary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: #2d6a7a;
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
        background: #1f4f5c;
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
        color: #64748b;
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
        color: #0f172a;
      }

      .stat-number.warning {
        color: #ef4444;
      }

      .stat-trend {
        font-size: 12px;
        color: #64748b;
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 8px;
      }

      .progress-bar {
        height: 100%;
        background: #10b981;
        border-radius: 4px;
        transition: width 0.3s;
      }

      .progress-bar.warning {
        background: #ef4444;
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
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-btn:hover {
        border-color: #3b82f6;
      }

      .filter-select {
        padding: 10px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        cursor: pointer;
      }

      .filter-select:focus {
        border-color: #3b82f6;
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
        background: #f1f5f9;
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
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #e2e8f0;
      }

      .data-table td {
        padding: 16px 20px;
        border-bottom: 1px solid #f1f5f9;
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
        background: #dbeafe;
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
        color: #0f172a;
      }

      .student-id {
        font-size: 12px;
        color: #64748b;
      }

      .status-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-badge.active {
        background: #d1fae5;
        color: #059669;
      }

      .status-badge.graduated {
        background: #dbeafe;
        color: #2563eb;
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
        color: #0f172a;
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
        color: #0f172a;
      }

      .progress-text.warning {
        color: #ef4444;
      }

      .progress-cell .progress-bar-container {
        flex: 1;
        margin: 0;
      }

      .warning-icon {
        color: #ef4444;
        font-size: 16px;
      }

      .kebab-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        color: #64748b;
      }

      .kebab-btn:hover {
        background: #f1f5f9;
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-top: 1px solid #e2e8f0;
      }

      .pagination-info {
        font-size: 13px;
        color: #64748b;
      }

      .pagination-controls {
        display: flex;
        gap: 8px;
      }

      .page-btn {
        padding: 8px 14px;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .page-btn:hover {
        border-color: #3b82f6;
      }

      .page-btn.active {
        background: #2d6a7a;
        color: white;
        border-color: #2d6a7a;
      }

      .page-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .error {
        color: #a23434;
        font-weight: 600;
        padding: 16px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolEnrollmentsPage implements OnInit {
  readonly Math = Math;
  private readonly api = inject(SchoolsApi);
  readonly enrollments = signal<EnrollmentViewModel[]>([]);
  readonly stats = signal<EnrollmentStatsResponse | null>(null);
  readonly specialists = signal<LeadSpecialistResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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
