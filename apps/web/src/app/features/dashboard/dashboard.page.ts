import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChildResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';

type QuickAction = {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly icon: 'screening' | 'school' | 'hospital' | 'activity';
};

const quickActions: readonly QuickAction[] = [
  {
    title: 'Start screening',
    description: 'Update support profile',
    path: '/screening',
    icon: 'screening',
  },
  { title: 'Find school', description: 'Inclusive education', path: '/schools', icon: 'school' },
  { title: 'Find hospital', description: 'Specialist care', path: '/hospitals', icon: 'hospital' },
  {
    title: 'Browse activities',
    description: 'Home-based learning',
    path: '/activities',
    icon: 'activity',
  },
];

interface RecentReport {
  id: string;
  studentName: string;
  initials: string;
  activity: string;
  date: string;
  status: 'Reported' | 'Draft';
}

interface ReportReminder {
  id: string;
  title: string;
  student?: string;
  dueDate: string;
  dueTime?: string;
  urgency: 'today' | 'tomorrow' | 'upcoming';
}

interface StudentActivity {
  id: string;
  studentName: string;
  initials: string;
  description: string;
  timeAgo: string;
  color: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, SchoolTopbarComponent],
  host: {
    '[class.school-dashboard]': 'isSchoolStaff()',
  },
  template: `
    @if (isSchoolStaff()) {
      <!-- SCHOOL DASHBOARD -->
      <div class="page-layout">
        <main class="main-content">
          <ac-school-topbar />

          <!-- Greeting Section -->
          <section class="greeting-section">
            <div>
              <h1>Good {{ dayPart() }}, {{ userFirstName() }}</h1>
              <p>Here's a summary of your classroom's progress today.</p>
            </div>
          </section>

          <!-- Stats Grid -->
          <section class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon students-icon">👥</div>
              <div class="stat-header">
                <span class="stat-trend">+2 this term</span>
              </div>
              <div class="stat-label">TOTAL STUDENTS</div>
              <div class="stat-value">12</div>
            </div>

            <div class="stat-card">
              <div class="stat-icon reports-icon">📋</div>
              <div class="stat-label">REPORTS SUBMITTED</div>
              <div class="stat-value">45</div>
              <div class="stat-footer">Submitted this month</div>
            </div>

            <div class="stat-card">
              <div class="stat-icon pending-icon">⏳</div>
              <div class="stat-label">PENDING REPORTS</div>
              <div class="stat-value warning">03</div>
              <div class="progress-bar-mini">
                <div class="progress-fill" style="width: 60%"></div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon activities-icon">✓</div>
              <div class="stat-header">
                <span class="stat-trend positive">+12% from last week</span>
              </div>
              <div class="stat-label">ACTIVITIES COMPLETED</div>
              <div class="stat-value">128</div>
            </div>
          </section>

          <!-- Main Content Grid -->
          <div class="dashboard-grid">
            <!-- Left Column -->
            <div class="left-column">
              <!-- Recent Reports -->
              <div class="content-card">
                <div class="card-header">
                  <h2>Recent Reports</h2>
                  <a href="#" class="view-all">View All</a>
                </div>
                <table class="reports-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Activity</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (report of recentReports(); track report.id) {
                      <tr>
                        <td>
                          <div class="student-cell">
                            <div
                              class="student-avatar"
                              [style.background]="getAvatarColor(report.initials)"
                            >
                              {{ report.initials }}
                            </div>
                            <span class="student-name">{{ report.studentName }}</span>
                          </div>
                        </td>
                        <td>{{ report.activity }}</td>
                        <td>{{ report.date }}</td>
                        <td>
                          <span class="status-badge" [class]="report.status.toLowerCase()">
                            {{ report.status }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Recent Student Activities -->
              <div class="content-card">
                <div class="card-header">
                  <h2>Recent Student Activities</h2>
                </div>
                <div class="activities-timeline">
                  @for (activity of studentActivities(); track activity.id) {
                    <div class="activity-item">
                      <div class="activity-icon" [style.background]="activity.color">
                        {{ activity.initials }}
                      </div>
                      <div class="activity-content">
                        <p>
                          <strong>{{ activity.studentName }}</strong> {{ activity.description }}
                        </p>
                        <span class="activity-time">{{ activity.timeAgo }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="right-column">
              <!-- Report Reminders -->
              <div class="content-card reminders-card">
                <div class="card-header">
                  <h2>
                    <span class="calendar-icon">📅</span>
                    Report Reminders
                  </h2>
                </div>
                <div class="reminders-list">
                  @for (reminder of reportReminders(); track reminder.id) {
                    <div class="reminder-item" [class]="reminder.urgency">
                      <div class="reminder-header">
                        <span class="reminder-when" [class]="reminder.urgency">
                          {{ getReminderLabel(reminder.urgency) }}
                        </span>
                      </div>
                      <div class="reminder-title">{{ reminder.title }}</div>
                      @if (reminder.dueTime) {
                        <div class="reminder-time">{{ reminder.dueTime }}</div>
                      }
                    </div>
                  }
                </div>
                <button class="manage-calendar-btn">Manage Calendar</button>
              </div>

              <!-- Classroom Engagement -->
              <div class="engagement-card">
                <div class="engagement-header">
                  <h2>Classroom Engagement</h2>
                  <p>Average student engagement is up 18% compared to last week.</p>
                </div>
                <div class="engagement-chart">
                  <div class="chart-bars">
                    @for (day of engagementData(); track $index) {
                      <div class="chart-column">
                        <div
                          class="bar"
                          [style.height.%]="day.value"
                          [class.today]="day.isToday"
                        ></div>
                        <span class="day-label">{{ day.label }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    } @else {
      <!-- PARENT DASHBOARD (Existing Code - Unchanged) -->
      <section class="dashboard-header">
        <div>
          <h1>Good {{ dayPart() }}, {{ parentFirstName() }}</h1>
          <p>
            @if (isParent()) {
              Welcome back to AutiCare.
              @if (selectedChild()) {
                Here's what's happening with {{ selectedChild()!.firstName }} today.
              } @else {
                Create a child profile to personalize your care dashboard.
              }
            } @else {
              Manage the care directory and review family support records from one place.
            }
          </p>
        </div>

        @if (isParent() && selectedChild()) {
          <a class="child-switcher" [routerLink]="['/children', selectedChild()!.id]">
            <span class="child-avatar" aria-hidden="true">{{
              childInitials(selectedChild()!)
            }}</span>
            <span>
              <strong
                >{{ selectedChild()!.firstName }},
                {{ ageLabel(selectedChild()!.dateOfBirth) }}</strong
              >
              <small>Open profile</small>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="m8 10 4 4 4-4"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.4"
              />
            </svg>
          </a>
        } @else if (isParent()) {
          <a class="child-switcher empty" routerLink="/children">
            <span class="child-avatar" aria-hidden="true">+</span>
            <span>
              <strong>No child selected</strong>
              <small>Add child profile</small>
            </span>
          </a>
        }
      </section>

      @if (childrenError()) {
        <p class="error" role="alert">{{ childrenError() }}</p>
      }

      @if (isParent()) {
        <section class="bento-grid" aria-label="Parent dashboard overview">
          <article class="card screening-card">
            <div class="progress-wrap" aria-label="Screening progress 65 percent">
              <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
                <circle cx="60" cy="60" r="48" class="progress-track"></circle>
                <circle cx="60" cy="60" r="48" class="progress-value"></circle>
              </svg>
              <div>
                <strong>65%</strong>
                <span>Progress</span>
              </div>
            </div>

            <div class="screening-copy">
              <span class="status-pill">Status: Active Review</span>
              <h2>Moderate support recommended</h2>
              <p>
                Last screening completed on January 15, 2024. Your care team is currently reviewing
                these results for a personalized roadmap.
              </p>
              <a class="primary-button" routerLink="/screening">View results</a>
            </div>
          </article>

          <article class="card weekly-card">
            <div class="section-title">
              <h2>Weekly Progress</h2>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M4 17 9 12l3 3 7-8M16 7h3v3"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.2"
                />
              </svg>
            </div>
            <div class="bar-chart" aria-label="3 activities completed this week">
              @for (height of weeklyBars; track $index) {
                <span [style.--bar-height.%]="height" [class.active]="height === 100">
                  @if (height === 100) {
                    <strong>3</strong>
                  }
                </span>
              }
            </div>
            <p><strong>3 activities</strong> completed this week. You're on track for your goal!</p>
          </article>

          <article class="card action-card">
            <div class="soft-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  d="M5 6h14v9H8l-3 3V6Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
                <path
                  d="M8 10h8M8 13h5"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                />
              </svg>
            </div>
            <h2>Next Recommended Action</h2>
            <p>
              Based on {{ selectedChild()?.firstName || 'your child' }}'s latest screening, explore
              new communication activities tailored for social engagement.
            </p>
            <a class="text-link" routerLink="/activities">
              Explore communication activities
              <span aria-hidden="true">-&gt;</span>
            </a>
          </article>

          <article class="card appointment-card">
            <div class="appointment-top">
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
                Upcoming Appointment
              </span>
              <strong>Confirmed</strong>
            </div>
            <h2>Angkor Children's Hospital</h2>
            <p>Developmental Assessment with Dr. Somat</p>
            <div class="appointment-meta">
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
                Feb 1, 2024
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
                09:30 AM
              </span>
            </div>
          </article>
        </section>

        @if (!selectedChild() && !childrenLoading()) {
          <section class="empty-state">
            <h2>Personalize your dashboard</h2>
            <p>
              Add your first child profile to connect screenings, activities, school reports, and
              care notes.
            </p>
            <a class="primary-button" routerLink="/children">Open child profiles</a>
          </section>
        }

        <section class="quick-actions" aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title">Quick Actions</h2>
          <div>
            @for (action of quickActions; track action.path) {
              <a class="quick-card" [routerLink]="action.path">
                <span class="quick-icon" [class]="action.icon" aria-hidden="true"></span>
                <span>
                  <strong>{{ action.title }}</strong>
                  <small>{{ action.description }}</small>
                </span>
              </a>
            }
          </div>
        </section>
      } @else {
        <section class="admin-overview" aria-label="Administrator overview">
          <article>
            <span class="admin-icon directory" aria-hidden="true"></span>
            <p class="admin-label">Care directory</p>
            <h2>Keep hospitals current</h2>
            <p>
              Publish hospitals and specialist services so families can make informed care choices.
            </p>
            <a class="primary-button" routerLink="/hospitals">Manage hospitals</a>
          </article>
          <article>
            <span class="admin-icon family" aria-hidden="true"></span>
            <p class="admin-label">Family records</p>
            <h2>{{ children().length }} active child profiles</h2>
            <p>
              Review child profiles across the service to support the care team with accurate
              records.
            </p>
            <a class="text-link" routerLink="/children"
              >Review child profiles <span aria-hidden="true">-&gt;</span></a
            >
          </article>
          <article>
            <span class="admin-icon school" aria-hidden="true"></span>
            <p class="admin-label">School reporting</p>
            <h2>Coordinate activity updates</h2>
            <p>
              Review school participation and keep the support network aligned around each child.
            </p>
            <a class="text-link" routerLink="/schools"
              >Open schools <span aria-hidden="true">-&gt;</span></a
            >
          </article>
        </section>
      }

      <footer class="dashboard-footer">
        <section>
          <h2>AutiCare</h2>
          <p>
            Supporting neurodiverse families with personalized care paths and professional
            resources.
          </p>
        </section>
        <section>
          <h3>Support</h3>
          <a routerLink="/support">Emergency Resources</a>
          <a routerLink="/support">Medical Disclaimer</a>
          <a routerLink="/support">Contact Support</a>
        </section>
        <section>
          <h3>Quick Links</h3>
          <a routerLink="/privacy">Privacy Policy</a>
          <a routerLink="/terms">Terms of Service</a>
        </section>
        <section>
          <h3>Stay Connected</h3>
          <div class="social-row" aria-label="Community links">
            <a routerLink="/support" aria-label="Share AutiCare">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm12 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM8.7 16.3l6.6-3.6M8.7 18.7l6.6 2.6"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
            </a>
            <a routerLink="/support" aria-label="Open community support">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1M12 20v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
            </a>
          </div>
          <p class="copyright">(c) 2024 AutiCare. All rights reserved.</p>
        </section>
      </footer>
    }
  `,
  styles: [
    `
      /* ========== SCHOOL DASHBOARD STYLES ========== */
      .page-layout {
        display: flex;
        gap: 24px;
        padding: 24px 0;
        background: #f8fafc;
        min-height: 100vh;
        width: 100%;
        max-width: 100%;
      }

      .main-content {
        flex: 1;
        min-width: 0;
        width: 100%;
        max-width: 100%;
      }

      .greeting-section {
        margin-bottom: 28px;
      }

      .greeting-section h1 {
        margin: 0 0 8px 0;
        font-size: 32px;
        font-weight: 700;
        color: #0f172a;
      }

      .greeting-section p {
        margin: 0;
        color: #64748b;
        font-size: 15px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 28px;
      }

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        position: relative;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-bottom: 12px;
      }

      .students-icon {
        background: #dbeafe;
      }

      .reports-icon {
        background: #d1fae5;
      }

      .pending-icon {
        background: #fef3c7;
      }

      .activities-icon {
        background: #dbeafe;
      }

      .stat-header {
        position: absolute;
        top: 20px;
        right: 20px;
      }

      .stat-trend {
        font-size: 12px;
        color: #10b981;
        font-weight: 600;
      }

      .stat-trend.positive {
        color: #10b981;
      }

      .stat-label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: #0f172a;
        line-height: 1;
      }

      .stat-value.warning {
        color: #f59e0b;
      }

      .stat-footer {
        font-size: 12px;
        color: #64748b;
        margin-top: 8px;
      }

      .progress-bar-mini {
        width: 100%;
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        margin-top: 12px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #f59e0b;
        border-radius: 2px;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 24px;
      }

      .left-column,
      .right-column {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .content-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .card-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .calendar-icon {
        font-size: 20px;
      }

      .view-all {
        font-size: 13px;
        color: #2d6a7a;
        text-decoration: none;
        font-weight: 600;
      }

      .view-all:hover {
        text-decoration: underline;
      }

      .reports-table {
        width: 100%;
        border-collapse: collapse;
      }

      .reports-table th {
        text-align: left;
        padding: 12px 16px;
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #e2e8f0;
      }

      .reports-table td {
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 14px;
      }

      .reports-table tr:last-child td {
        border-bottom: none;
      }

      .student-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .student-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        color: white;
      }

      .student-name {
        font-weight: 500;
        color: #0f172a;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-badge.reported {
        background: #d1fae5;
        color: #059669;
      }

      .status-badge.draft {
        background: #f1f5f9;
        color: #64748b;
      }

      .activities-timeline {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .activity-item {
        display: flex;
        gap: 14px;
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
      }

      .activity-content {
        flex: 1;
      }

      .activity-content p {
        margin: 0 0 4px 0;
        font-size: 14px;
        color: #0f172a;
        line-height: 1.5;
      }

      .activity-content strong {
        font-weight: 600;
      }

      .activity-time {
        font-size: 12px;
        color: #64748b;
      }

      .reminders-card {
        background: white;
      }

      .reminders-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }

      .reminder-item {
        padding: 16px;
        border-radius: 10px;
        background: #f8fafc;
        border-left: 4px solid #e2e8f0;
      }

      .reminder-item.today {
        background: #fef2f2;
        border-left-color: #ef4444;
      }

      .reminder-item.tomorrow {
        background: #f0f9ff;
        border-left-color: #3b82f6;
      }

      .reminder-item.upcoming {
        background: #f8fafc;
        border-left-color: #64748b;
      }

      .reminder-header {
        margin-bottom: 8px;
      }

      .reminder-when {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
      }

      .reminder-when.today {
        color: #ef4444;
      }

      .reminder-when.tomorrow {
        color: #3b82f6;
      }

      .reminder-title {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 4px;
      }

      .reminder-time {
        font-size: 12px;
        color: #64748b;
      }

      .manage-calendar-btn {
        width: 100%;
        padding: 12px;
        background: white;
        border: 1px solid #2d6a7a;
        color: #2d6a7a;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .manage-calendar-btn:hover {
        background: #2d6a7a;
        color: white;
      }

      .engagement-card {
        background: linear-gradient(135deg, #2d6a7a 0%, #1e4a5a 100%);
        border-radius: 12px;
        padding: 24px;
        color: white;
        box-shadow: 0 4px 12px rgba(45, 106, 122, 0.3);
      }

      .engagement-header h2 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .engagement-header p {
        margin: 0 0 20px 0;
        font-size: 13px;
        opacity: 0.9;
      }

      .engagement-chart {
        margin-top: 20px;
      }

      .chart-bars {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 160px;
        gap: 12px;
      }

      .chart-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .bar {
        width: 100%;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 6px 6px 0 0;
        min-height: 20px;
        transition: all 0.3s;
      }

      .bar.today {
        background: rgba(255, 255, 255, 0.9);
      }

      .day-label {
        font-size: 11px;
        opacity: 0.9;
      }

      /* ========== PARENT DASHBOARD STYLES (Unchanged) ========== */
      :host {
        display: block;
        max-width: 1160px;
        margin: 0 auto;
      }

      :host.school-dashboard {
        max-width: none;
        margin: 0;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 28px;
        margin-bottom: 50px;
      }

      .dashboard-header h1 {
        color: #315d72;
        font-size: 40px;
        line-height: 1.15;
        font-weight: 700;
        letter-spacing: 0;
      }

      .dashboard-header p {
        margin-top: 12px;
        color: #263238;
        font-size: 16px;
        line-height: 1.55;
      }

      .child-switcher {
        min-width: 230px;
        border: 1px solid #b8c2c8;
        border-radius: 24px;
        background: #e8f6ff;
        color: #001e2b;
        display: grid;
        grid-template-columns: 50px minmax(0, 1fr) 20px;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        text-decoration: none;
      }

      .child-switcher.empty {
        grid-template-columns: 50px minmax(0, 1fr);
      }

      .child-avatar {
        width: 50px;
        height: 50px;
        border-radius: 999px;
        background: #d7e9c0;
        color: #3d4b2d;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 20px;
      }

      .child-switcher strong,
      .child-switcher small {
        display: block;
      }

      .child-switcher strong {
        font-size: 15px;
        line-height: 1.2;
      }

      .child-switcher small {
        margin-top: 4px;
        color: #164f68;
        font-size: 13px;
        font-weight: 600;
      }

      .child-switcher svg {
        width: 20px;
        height: 20px;
      }

      .error {
        border-radius: 12px;
        background: #ffdad6;
        color: #93000a;
        padding: 14px 16px;
        margin-bottom: 20px;
      }

      .bento-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 26px;
      }

      .admin-overview {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
      }

      .admin-overview article {
        min-height: 280px;
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 12px 34px rgb(41 74 90 / 0.07);
        display: grid;
        align-content: start;
        gap: 14px;
        padding: 24px;
      }

      .admin-overview article:first-child {
        border-color: #b9d6e5;
        background: #e8f6ff;
      }

      .admin-overview h2 {
        color: #001e2b;
        font-size: 24px;
        line-height: 1.3;
      }

      .admin-overview p:not(.admin-label) {
        color: #41484b;
        line-height: 1.55;
      }

      .admin-label {
        color: #546343;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .admin-icon {
        width: 46px;
        height: 46px;
        border-radius: 8px;
        background: #d7e9c0;
        position: relative;
      }

      .admin-icon::before,
      .admin-icon::after {
        content: '';
        position: absolute;
        box-sizing: border-box;
      }

      .admin-icon.directory::before {
        left: 19px;
        top: 11px;
        width: 8px;
        height: 24px;
        background: #3d4b2d;
      }

      .admin-icon.directory::after {
        left: 11px;
        top: 19px;
        width: 24px;
        height: 8px;
        background: #3d4b2d;
      }

      .admin-icon.family::before {
        left: 10px;
        top: 10px;
        width: 26px;
        height: 26px;
        border: 3px solid #3d4b2d;
        border-radius: 50% 50% 10px 10px;
      }

      .admin-icon.school::before {
        left: 11px;
        top: 15px;
        width: 24px;
        height: 18px;
        border: 3px solid #3d4b2d;
      }

      .admin-icon.school::after {
        left: 10px;
        top: 8px;
        width: 26px;
        height: 26px;
        border-top: 3px solid #3d4b2d;
        border-left: 3px solid #3d4b2d;
        transform: rotate(45deg);
      }

      .card {
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 12px 34px rgb(41 74 90 / 0.07);
        padding: 28px;
      }

      .screening-card {
        grid-column: span 8;
        min-height: 310px;
        display: grid;
        grid-template-columns: 176px minmax(0, 1fr);
        align-items: center;
        gap: 38px;
      }

      .progress-wrap {
        position: relative;
        width: 150px;
        height: 150px;
      }

      .progress-wrap svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .progress-track,
      .progress-value {
        fill: none;
        stroke-width: 10;
      }

      .progress-track {
        stroke: #e7eedf;
      }

      .progress-value {
        stroke: #a8b993;
        stroke-linecap: butt;
        stroke-dasharray: 301.59;
        stroke-dashoffset: 105.56;
      }

      .progress-wrap div {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        justify-items: center;
        color: #4d5f3d;
      }

      .progress-wrap strong {
        font-size: 30px;
        line-height: 1;
      }

      .progress-wrap span {
        margin-top: 6px;
        text-transform: uppercase;
        font-size: 11px;
        font-weight: 700;
      }

      .screening-copy {
        display: grid;
        justify-items: start;
        gap: 14px;
      }

      .status-pill {
        border-radius: 999px;
        background: #d7e9c0;
        color: #4d5f3d;
        padding: 6px 14px;
        font-size: 13px;
        line-height: 1.1;
        font-weight: 700;
      }

      .screening-copy h2,
      .action-card h2,
      .appointment-card h2 {
        color: #001e2b;
        font-size: 26px;
        line-height: 1.3;
        font-weight: 600;
        letter-spacing: 0;
      }

      .screening-copy p,
      .action-card p,
      .appointment-card p,
      .weekly-card p {
        color: #41484b;
        font-size: 16px;
        line-height: 1.58;
      }

      .primary-button {
        min-height: 46px;
        border-radius: 12px;
        background: #3d6375;
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 26px;
        text-decoration: none;
        font-weight: 600;
      }

      .weekly-card {
        grid-column: span 4;
        min-height: 310px;
        display: grid;
        align-content: space-between;
        gap: 18px;
      }

      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        color: #164f68;
      }

      .section-title h2 {
        font-size: 16px;
        line-height: 1.3;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .section-title svg {
        width: 26px;
        height: 26px;
      }

      .bar-chart {
        height: 160px;
        display: flex;
        align-items: end;
        justify-content: center;
        gap: 12px;
        padding-top: 26px;
      }

      .bar-chart span {
        position: relative;
        width: 34px;
        height: var(--bar-height);
        min-height: 2px;
        border-radius: 10px 10px 0 0;
        background: #ceedff;
      }

      .bar-chart span.active {
        background: #3d6375;
      }

      .bar-chart strong {
        position: absolute;
        left: 50%;
        top: -26px;
        color: #164f68;
        transform: translateX(-50%);
      }

      .weekly-card p {
        text-align: center;
      }

      .weekly-card p strong {
        color: #001e2b;
      }

      .action-card {
        position: relative;
        overflow: hidden;
        grid-column: span 6;
        min-height: 300px;
        display: grid;
        align-content: center;
        gap: 20px;
      }

      .action-card::after {
        content: '';
        position: absolute;
        right: -40px;
        top: -40px;
        width: 180px;
        height: 180px;
        border-radius: 0 0 0 180px;
        background: #e7eedf;
        opacity: 0.44;
      }

      .soft-icon {
        width: 58px;
        height: 58px;
        border-radius: 999px;
        background: #d7e9c0;
        color: #5a6949;
        display: grid;
        place-items: center;
      }

      .soft-icon svg {
        width: 30px;
        height: 30px;
      }

      .text-link {
        color: #164f68;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        font-weight: 700;
      }

      .text-link:hover {
        text-decoration: underline;
      }

      .appointment-card {
        grid-column: span 6;
        min-height: 300px;
        border-color: #b6dceb;
        background: #e8f6ff;
        display: grid;
        align-content: center;
        gap: 18px;
      }

      .appointment-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .appointment-top span,
      .appointment-meta span {
        color: #164f68;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .appointment-top svg,
      .appointment-meta svg {
        width: 18px;
        height: 18px;
      }

      .appointment-top strong {
        border-radius: 999px;
        background: #5a6949;
        color: #ffffff;
        padding: 6px 14px;
        font-size: 13px;
      }

      .appointment-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
      }

      .appointment-meta span {
        color: #001e2b;
        font-size: 14px;
        text-transform: none;
      }

      .empty-state {
        margin-top: 26px;
        border: 1px solid #c1c7cc;
        border-radius: 8px;
        background: #ffffff;
        padding: 24px;
        display: grid;
        justify-items: start;
        gap: 12px;
      }

      .empty-state h2 {
        color: #001e2b;
        font-size: 22px;
      }

      .empty-state p {
        color: #41484b;
        line-height: 1.55;
      }

      .quick-actions {
        margin-top: 58px;
      }

      .quick-actions h2 {
        color: #001e2b;
        font-size: 26px;
        line-height: 1.25;
        margin-bottom: 28px;
      }

      .quick-actions > div {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 26px;
      }

      .quick-card {
        min-height: 126px;
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 24px;
        background: #ffffff;
        color: #001e2b;
        box-shadow: 0 12px 34px rgb(41 74 90 / 0.06);
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr);
        align-items: center;
        gap: 18px;
        padding: 22px 26px;
        text-decoration: none;
      }

      .quick-card:hover {
        border-color: #8db4c8;
      }

      .quick-card strong,
      .quick-card small {
        display: block;
      }

      .quick-card strong {
        font-size: 16px;
        line-height: 1.3;
        font-weight: 600;
      }

      .quick-card small {
        margin-top: 4px;
        color: #41484b;
        line-height: 1.35;
      }

      .quick-icon {
        width: 50px;
        height: 50px;
        border-radius: 999px;
        background: #ceedff;
        color: #3d6375;
        display: grid;
        place-items: center;
        position: relative;
      }

      .quick-icon::before,
      .quick-icon::after {
        content: '';
        position: absolute;
        box-sizing: border-box;
      }

      .screening::before {
        width: 18px;
        height: 22px;
        border: 2px solid currentColor;
        border-radius: 3px;
      }

      .screening::after {
        width: 10px;
        height: 7px;
        border-left: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        transform: rotate(-45deg);
      }

      .school::before {
        width: 20px;
        height: 14px;
        border: 2px solid currentColor;
        transform: rotate(45deg) skew(-10deg, -10deg);
      }

      .hospital::before {
        width: 22px;
        height: 22px;
        border: 2px solid currentColor;
        border-radius: 3px;
      }

      .hospital::after {
        width: 12px;
        height: 2px;
        background: currentColor;
        box-shadow: 0 0 0 0 currentColor;
        transform: rotate(90deg);
      }

      .activity::before {
        width: 18px;
        height: 18px;
        border: 2px solid currentColor;
        border-radius: 5px;
      }

      .activity::after {
        width: 8px;
        height: 8px;
        border: 2px solid currentColor;
        border-radius: 3px;
        background: #ceedff;
        transform: translate(8px, -8px);
      }

      .dashboard-footer {
        margin-top: 92px;
        border-top: 1px solid #c1c7cc;
        padding: 54px 0 24px;
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr 1.25fr;
        gap: 48px;
      }

      .dashboard-footer h2 {
        color: #315d72;
        font-size: 26px;
        line-height: 1.2;
      }

      .dashboard-footer h3 {
        color: #001e2b;
        font-size: 16px;
        line-height: 1.2;
        margin-bottom: 18px;
      }

      .dashboard-footer p,
      .dashboard-footer a {
        color: #41484b;
        font-size: 16px;
        line-height: 1.55;
      }

      .dashboard-footer a {
        display: block;
        text-decoration: none;
        margin-bottom: 10px;
      }

      .dashboard-footer a:hover {
        color: #164f68;
        text-decoration: underline;
      }

      .social-row {
        display: flex;
        gap: 14px;
      }

      .social-row a {
        width: 46px;
        height: 46px;
        border-radius: 999px;
        background: #ceedff;
        color: #164f68;
        display: grid;
        place-items: center;
      }

      .social-row svg {
        width: 22px;
        height: 22px;
      }

      .copyright {
        margin-top: 12px;
        font-size: 13px !important;
      }

      @media (max-width: 1180px) {
        .screening-card,
        .weekly-card,
        .action-card,
        .appointment-card {
          grid-column: span 12;
        }

        .weekly-card {
          min-height: 260px;
        }

        .quick-actions > div,
        .dashboard-footer {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
        }

        .right-column {
          order: -1;
        }
      }

      @media (max-width: 720px) {
        .dashboard-header {
          flex-direction: column;
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          font-size: 32px;
        }

        .dashboard-header p {
          font-size: 16px;
        }

        .child-switcher {
          width: 100%;
        }

        .bento-grid {
          gap: 18px;
        }

        .admin-overview {
          grid-template-columns: 1fr;
          gap: 18px;
        }

        .card {
          border-radius: 18px;
          padding: 22px;
        }

        .weekly-card {
          min-height: auto;
        }

        .bar-chart {
          height: 112px;
          gap: 10px;
          padding-top: 22px;
        }

        .bar-chart span {
          width: 30px;
        }

        .screening-card {
          grid-template-columns: 1fr;
          justify-items: center;
          text-align: center;
          gap: 22px;
          margin-bottom: 148px;
        }

        .screening-copy {
          justify-items: center;
        }

        .screening-copy h2,
        .action-card h2,
        .appointment-card h2 {
          font-size: 24px;
        }

        .appointment-top {
          align-items: flex-start;
          flex-direction: column;
        }

        .quick-actions {
          margin-top: 42px;
        }

        .quick-actions h2 {
          font-size: 24px;
        }

        .quick-actions > div,
        .dashboard-footer {
          grid-template-columns: 1fr;
        }

        .quick-card {
          min-height: 100px;
          border-radius: 18px;
        }

        .dashboard-footer {
          margin-top: 62px;
          gap: 26px;
          padding-bottom: 16px;
        }

        .page-layout {
          flex-direction: column;
          gap: 0;
          padding: 0 0 16px;
        }

        .main-content {
          max-width: 100%;
          padding: 0;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly childrenApi = inject(ChildrenApi);

  protected readonly quickActions = quickActions;
  protected readonly weeklyBars = [40, 70, 100, 20, 2, 2, 2] as const;
  protected readonly children = signal<readonly ChildResponse[]>([]);
  protected readonly childrenLoading = signal(false);
  protected readonly childrenError = signal<string | null>(null);
  protected readonly parent = this.auth.parent;
  protected readonly isParent = computed(() => this.parent()?.role === 'PARENT');
  protected readonly isSchoolStaff = computed(() => this.parent()?.role === 'SCHOOL');
  protected readonly selectedChild = computed(
    () => this.children().find((child) => !child.archivedAt) ?? null,
  );
  protected readonly parentFirstName = computed(() => this.parent()?.firstName || 'there');
  protected readonly userFirstName = computed(() => this.parent()?.firstName || 'Sarah');

  // School dashboard data
  protected readonly recentReports = signal<RecentReport[]>([
    {
      id: '1',
      studentName: 'Liam Miller',
      initials: 'LM',
      activity: 'Sensory Integration',
      date: 'Oct 24, 2023',
      status: 'Reported',
    },
    {
      id: '2',
      studentName: 'Emma Chen',
      initials: 'EC',
      activity: 'Social Skills Group',
      date: 'Oct 23, 2023',
      status: 'Draft',
    },
    {
      id: '3',
      studentName: 'Jacob Smith',
      initials: 'JS',
      activity: 'Communication Drill',
      date: 'Oct 23, 2023',
      status: 'Reported',
    },
    {
      id: '4',
      studentName: 'Noah Williams',
      initials: 'NW',
      activity: 'Visual Sequencing',
      date: 'Oct 22, 2023',
      status: 'Draft',
    },
  ]);

  protected readonly reportReminders = signal<ReportReminder[]>([
    {
      id: '1',
      title: 'Weekly Progress: Sophia G.',
      dueDate: 'Today',
      dueTime: 'Due by 5:00 PM',
      urgency: 'today',
    },
    {
      id: '2',
      title: 'IEP Review: Ethan Hunt',
      dueDate: 'Tomorrow',
      dueTime: 'Scheduled for 10:30 AM',
      urgency: 'tomorrow',
    },
    {
      id: '3',
      title: 'Monthly Summary: All Students',
      dueDate: 'Oct 26',
      dueTime: 'Drafting required',
      urgency: 'upcoming',
    },
  ]);

  protected readonly studentActivities = signal<StudentActivity[]>([
    {
      id: '1',
      studentName: 'Liam Miller',
      initials: 'LM',
      description: 'mastered the "Color Sorting" cognitive milestone.',
      timeAgo: '10 minutes ago',
      color: '#3B82F6',
    },
    {
      id: '2',
      studentName: 'Emma Chen',
      initials: 'EC',
      description: 'participated in high-engagement social play for 15 mins.',
      timeAgo: '2 hours ago',
      color: '#10B981',
    },
    {
      id: '3',
      studentName: 'Jacob Smith',
      initials: 'JS',
      description: 'Observation notes added regarding morning routine.',
      timeAgo: '4 hours ago',
      color: '#64748B',
    },
  ]);

  protected readonly engagementData = signal([
    { label: 'Mon', value: 45, isToday: false },
    { label: 'Tue', value: 52, isToday: false },
    { label: 'Wed', value: 48, isToday: false },
    { label: 'Thu', value: 60, isToday: false },
    { label: 'Fri', value: 55, isToday: false },
    { label: 'Today', value: 78, isToday: true },
    { label: 'Sun', value: 30, isToday: false },
  ]);

  ngOnInit() {
    if (!this.parent()) this.auth.loadCurrentUser().subscribe();
    this.loadChildren();
  }

  protected dayPart(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  protected childInitials(child: ChildResponse): string {
    return child.firstName.slice(0, 2).toUpperCase();
  }

  protected ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
      years -= 1;
    }
    const safeYears = Math.max(years, 0);
    return safeYears === 1 ? 'age 1' : `age ${safeYears}`;
  }

  protected getAvatarColor(initials: string): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  }

  protected getReminderLabel(urgency: string): string {
    switch (urgency) {
      case 'today':
        return 'DUE TODAY';
      case 'tomorrow':
        return 'TOMORROW';
      default:
        return 'UPCOMING';
    }
  }

  private loadChildren() {
    this.childrenLoading.set(true);
    this.childrenError.set(null);
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        this.childrenLoading.set(false);
      },
      error: () => {
        this.childrenError.set('Child profiles could not be loaded.');
        this.childrenLoading.set(false);
      },
    });
  }
}
