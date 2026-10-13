import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type {
  AdminDashboardResponse,
  ChildResponse,
  ParentDashboardResponse,
  SchoolDashboardResponse,
} from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { DashboardApi } from './data-access/dashboard.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { I18nService } from '../../core/i18n/i18n.service';

export type QuickAction = {
  readonly titleKm: string;
  readonly titleEn: string;
  readonly descriptionKm: string;
  readonly descriptionEn: string;
  readonly path: string;
  readonly icon: 'screening' | 'activity' | 'hospital' | 'progress';
  readonly gradientClass: string;
  readonly timeEstimateKm?: string;
  readonly timeEstimateEn?: string;
};

export type PriorityAlert = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly actionPath: string;
  readonly actionLabel: string;
  readonly tone: 'caution' | 'info' | 'alert' | 'neutral';
  readonly icon: 'clipboard' | 'calendar' | 'hospital' | 'sparkles' | 'child';
};

const quickActions: readonly QuickAction[] = [
  {
    titleKm: 'ចាប់ផ្តើមការវាយតម្លៃ',
    titleEn: 'Start Clinical Screening',
    descriptionKm: 'វាយតម្លៃដំណាក់កាលលូតលាស់ និងការឆ្លើយតបញាណដឹង',
    descriptionEn: 'Assess developmental milestones & sensory response',
    path: '/screening',
    icon: 'screening',
    gradientClass: 'gradient-screening',
    timeEstimateKm: '5 នាទី',
    timeEstimateEn: '5m',
  },
  {
    titleKm: 'សកម្មភាពលេងកម្សាន្ត',
    titleEn: 'Log Daily Milestone (Sensory Play)',
    descriptionKm: 'សកម្មភាពលូតលាស់ និងការលេងសម្របសម្រួលញាណនៅផ្ទះ',
    descriptionEn: 'Home-based developmental activities & sensory play',
    path: '/activities',
    icon: 'activity',
    gradientClass: 'gradient-milestone',
    timeEstimateKm: 'លេងប្រចាំថ្ងៃ',
    timeEstimateEn: 'Daily Play',
  },
  {
    titleKm: 'កក់ការពិគ្រោះយោបល់',
    titleEn: 'Book Specialist Visit',
    descriptionKm: 'ពិគ្រោះជាមួយវេជ្ជបណ្ឌិតឯកទេសកុមារ អ្នកព្យាបាលការនិយាយ និងចលករ',
    descriptionEn: 'Consult pediatricians, SLTs & occupational therapists',
    path: '/hospitals',
    icon: 'hospital',
    gradientClass: 'gradient-hospital',
    timeEstimateKm: 'ឯកទេសកុមារ',
    timeEstimateEn: 'Pediatrics',
  },
  {
    titleKm: 'ការតាមដានការលូតលាស់',
    titleEn: 'Growth Trajectory',
    descriptionKm: 'តាមដាននិន្នាការលូតលាស់ និងប្រវត្តិគ្លីនិករបស់កុមារ',
    descriptionEn: 'Track developmental trends & clinical history',
    path: '/progress',
    icon: 'progress',
    gradientClass: 'gradient-trajectory',
    timeEstimateKm: 'និន្នាការ',
    timeEstimateEn: 'Trends',
  },
];

@Component({
  standalone: true,
  imports: [RouterLink, SchoolTopbarComponent, UiMessageComponent, UiSpinnerComponent],
  host: {
    '[class.school-dashboard]': 'isSchoolStaff()',
  },
  template: `
    @if (isSchoolStaff()) {
      <!-- SCHOOL DASHBOARD -->
      <div class="page-layout">
        <main class="main-content">
          <ac-school-topbar />

          @if (dashboardLoading()) {
            <ac-ui-spinner label="Loading dashboard…" />
          } @else if (dashboardError()) {
            <ac-ui-message tone="error">{{ dashboardError() }}</ac-ui-message>
          } @else {
            <!-- Greeting Section -->
            <section class="greeting-section">
              <div>
                <h1>Good {{ dayPart() }}, {{ greetingName() }}</h1>
                <p>Here's a summary of your classroom's progress today.</p>
              </div>
            </section>

            @if (dashboardData(); as data) {
              <!-- Stats Grid -->
              <section class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon students-icon">👥</div>
                  @if (data.stats.studentsDelta) {
                    <div class="stat-header">
                      <span class="stat-trend">+{{ data.stats.studentsDelta }} this term</span>
                    </div>
                  }
                  <div class="stat-label">TOTAL STUDENTS</div>
                  <div class="stat-value">{{ data.stats.totalStudents }}</div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon reports-icon">📋</div>
                  <div class="stat-label">REPORTS SUBMITTED</div>
                  <div class="stat-value">{{ data.stats.reportsSubmitted }}</div>
                  <div class="stat-footer">Submitted this month</div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon pending-icon">⏳</div>
                  <div class="stat-label">PENDING REPORTS</div>
                  <div class="stat-value warning">
                    {{ formatPending(data.stats.pendingReports) }}
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon activities-icon">✓</div>
                  @if (data.stats.weekDelta != null) {
                    <div class="stat-header">
                      <span class="stat-trend positive"
                        >+{{ data.stats.weekDelta }}% from last week</span
                      >
                    </div>
                  }
                  <div class="stat-label">ACTIVITIES COMPLETED</div>
                  <div class="stat-value">{{ data.stats.activitiesCompleted }}</div>
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
                      <a routerLink="/schools/reports" class="view-all">View All</a>
                    </div>
                    @if (data.recentReports.length) {
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
                          @for (report of data.recentReports; track report.id) {
                            <tr>
                              <td>
                                <div class="student-cell">
                                  <div
                                    class="student-avatar"
                                    [style.background]="getAvatarColor(report.childFirstName)"
                                  >
                                    {{ report.childFirstName.slice(0, 2).toUpperCase() }}
                                  </div>
                                  <span class="student-name">{{ report.childFirstName }}</span>
                                </div>
                              </td>
                              <td>{{ report.activityCategory }}</td>
                              <td>{{ formatDate(report.activityDate) }}</td>
                              <td>
                                <span class="status-badge" [class]="report.status.toLowerCase()">
                                  {{ report.status }}
                                </span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    } @else {
                      <p class="empty-message">No reports yet.</p>
                    }
                  </div>

                  <!-- Recent Student Activities (derived from recent reports) -->
                  <div class="content-card">
                    <div class="card-header">
                      <h2>Recent Student Activities</h2>
                    </div>
                    @if (derivedActivities().length) {
                      <div class="activities-timeline">
                        @for (activity of derivedActivities(); track activity.id) {
                          <div class="activity-item">
                            <div class="activity-icon" [style.background]="activity.color">
                              {{ activity.initials }}
                            </div>
                            <div class="activity-content">
                              <p>
                                <strong>{{ activity.studentName }}</strong>
                                {{ activity.description }}
                              </p>
                              <span class="activity-time">{{ activity.timeAgo }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="empty-message">No recent activities.</p>
                    }
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
                    @if (data.reminders.length) {
                      <div class="reminders-list">
                        @for (reminder of data.reminders; track reminder.id) {
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
                    } @else {
                      <p class="empty-message">No reminders right now.</p>
                    }
                  </div>

                  <!-- Classroom Engagement -->
                  <div class="engagement-card">
                    <div class="engagement-header">
                      <h2>Classroom Engagement</h2>
                      @if (data.stats.weekDelta != null) {
                        <p>
                          Average student engagement is up {{ data.stats.weekDelta }}% compared to
                          last week.
                        </p>
                      } @else {
                        <p>Track your classroom engagement over the week.</p>
                      }
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
            }
          }
        </main>
      </div>
    } @else {
      <!-- PARENT DASHBOARD: MODERNIZED BENTO GRID -->
      <section class="dashboard-hero-wrapper" aria-label="Dashboard Welcome">
        <div class="hero-content">
          <div class="hero-text-block">
            <div class="hero-meta-bar">
              <span class="hero-date-badge">{{ activeDateFormatted() }}</span>
              @if (isParent() && selectedChild(); as child) {
                <div class="care-context-pill-wrapper">
                  <button
                    type="button"
                    class="care-context-pill"
                    (click)="toggleChildDropdown()"
                    [attr.aria-expanded]="childDropdownOpen()"
                    aria-label="Viewing care for child"
                  >
                    <span class="care-dot" aria-hidden="true"></span>
                    <span class="care-label">
                      {{
                        currentLang() === 'km' ? 'កំពុងមើលការថែទាំសម្រាប់៖ ' : 'Viewing care for: '
                      }}<strong>{{ child.firstName }}</strong>
                      <span class="care-bilingual-tag"
                        >({{
                          currentLang() === 'km'
                            ? 'Viewing care for: ' + child.firstName
                            : 'កំពុងមើលការថែទាំសម្រាប់៖ ' + child.firstName
                        }})</span
                      >
                    </span>
                    <span class="care-chevron" aria-hidden="true">▼</span>
                  </button>
                  @if (childDropdownOpen() && activeChildren().length > 0) {
                    <div class="care-dropdown-menu" role="menu">
                      @for (c of activeChildren(); track c.id) {
                        <button
                          type="button"
                          class="care-dropdown-item"
                          [class.active]="selectedChild()?.id === c.id"
                          (click)="onSelectChild(c.id); closeChildDropdown()"
                        >
                          <span class="dropdown-item-avatar">{{ childInitials(c) }}</span>
                          <div class="dropdown-item-info">
                            <strong>{{ childFullName(c) }}</strong>
                            <small>{{ ageLabel(c.dateOfBirth) }}</small>
                          </div>
                          @if (selectedChild()?.id === c.id) {
                            <span class="dropdown-item-check" aria-hidden="true">✓</span>
                          }
                        </button>
                      }
                      <div class="dropdown-separator"></div>
                      <a
                        routerLink="/children/new"
                        class="dropdown-add-link"
                        (click)="closeChildDropdown()"
                      >
                        +
                        {{
                          currentLang() === 'km'
                            ? 'បន្ថែមទិន្នន័យកុមារ (Add another child)'
                            : 'Add another child'
                        }}
                      </a>
                    </div>
                  }
                </div>
              }
            </div>
            <h1>
              @if (currentLang() === 'km') {
                <span class="greeting-km">សូមស្វាគមន៍មកកាន់ AutiCare</span>
                <span class="greeting-subtext"
                  >, {{ parentFirstName() }} (Good {{ dayPart() }} · Welcome to AutiCare)</span
                >
              } @else {
                <span class="greeting-en">Welcome to AutiCare</span>
                <span class="greeting-subtext">
                  · Good {{ dayPart() }}, {{ parentFirstName() }}</span
                >
              }
            </h1>
            <p class="hero-subtitle">
              @if (isParent()) {
                {{
                  currentLang() === 'km'
                    ? 'សូមស្វាគមន៍មកកាន់ AutiCare។'
                    : 'Welcome back to AutiCare.'
                }}
                @if (selectedChild(); as child) {
                  {{
                    currentLang() === 'km'
                      ? ' នេះជាព័ត៌មានលម្អិត និងវឌ្ឍនភាពថ្ងៃនេះសម្រាប់ ' + child.firstName + '។'
                      : " Here's what's happening with " + child.firstName + ' today.'
                  }}
                  <span class="hero-subtext-bilingual">
                    (Here's what's happening with {{ child.firstName }} today.)</span
                  >
                } @else {
                  {{
                    currentLang() === 'km'
                      ? ' បង្កើតប្រវត្តិកុមារដើម្បីកំណត់ផ្ទាំងគ្រប់គ្រងផ្ទាល់ខ្លួនរបស់អ្នក។'
                      : ' Create a child profile to personalize your care dashboard.'
                  }}
                  <span class="hero-subtext-bilingual">
                    (Create a child profile to personalize your care dashboard.)</span
                  >
                }
              } @else {
                Manage the care directory and review family support records from one place.
              }
            </p>
            @if (isParent() && hasMultipleChildren()) {
              <div class="child-selector-pills" role="radiogroup" aria-label="Select child profile">
                @for (c of activeChildren(); track c.id) {
                  <button
                    type="button"
                    class="child-pill"
                    [class.active]="selectedChild()?.id === c.id"
                    [attr.aria-pressed]="selectedChild()?.id === c.id"
                    (click)="onSelectChild(c.id)"
                  >
                    <span class="pill-dot" aria-hidden="true"></span>
                    {{ c.firstName }}
                  </button>
                }
              </div>
            }
          </div>

          <div class="hero-actions-block">
            @if (isParent() && selectedChild(); as child) {
              <a class="child-switcher" [routerLink]="['/children', child.id]">
                <span class="child-avatar" aria-hidden="true">{{ childInitials(child) }}</span>
                <span>
                  <strong>{{ childFullName(child) }}, {{ ageLabel(child.dateOfBirth) }}</strong>
                  <small>{{
                    currentLang() === 'km' ? 'បើកប្រវត្តិរូប (Open profile)' : 'Open profile'
                  }}</small>
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
              <a class="hero-add-child-btn" routerLink="/children/new" title="Add child profile">
                <span class="hero-add-icon" aria-hidden="true">+</span>
                <span>{{ currentLang() === 'km' ? 'បន្ថែមទិន្នន័យកុមារ' : 'Add Child' }}</span>
                <span class="hero-btn-sub"
                  >({{ currentLang() === 'km' ? 'Add Child' : 'បន្ថែមទិន្នន័យកុមារ' }})</span
                >
              </a>
            } @else if (isParent()) {
              <a class="child-switcher empty" routerLink="/children">
                <span class="child-avatar" aria-hidden="true">+</span>
                <span>
                  <strong>{{
                    currentLang() === 'km'
                      ? 'មិនទាន់បានជ្រើសរើសកុមារ (No child selected)'
                      : 'No child selected'
                  }}</strong>
                  <small>{{
                    currentLang() === 'km'
                      ? 'បន្ថែមទិន្នន័យកុមារ (Add child profile)'
                      : 'Add child profile'
                  }}</small>
                </span>
              </a>
              <a class="hero-add-child-btn" routerLink="/children/new">
                <span class="hero-add-icon" aria-hidden="true">+</span>
                <span>{{ currentLang() === 'km' ? 'បន្ថែមទិន្នន័យកុមារ' : 'Add Child' }}</span>
                <span class="hero-btn-sub"
                  >({{ currentLang() === 'km' ? 'Add Child' : 'បន្ថែមទិន្នន័យកុមារ' }})</span
                >
              </a>
            }
          </div>
        </div>
      </section>

      @if (childrenError()) {
        <ac-ui-message tone="error">{{ childrenError() }}</ac-ui-message>
      }

      @if (isParent()) {
        <!-- Priority Action Alerts Ticker -->
        @if (priorityAlerts().length > 0) {
          <section class="priority-alerts-container" aria-label="Priority action alerts">
            @for (alert of priorityAlerts(); track alert.id) {
              <div class="priority-alert-card" [class]="'tone-' + alert.tone">
                <div class="alert-icon-wrap" aria-hidden="true">
                  @if (alert.icon === 'clipboard') {
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 9 2 2 4-4"
                      />
                    </svg>
                  } @else if (alert.icon === 'calendar') {
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  } @else if (alert.icon === 'hospital') {
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M12 6v6" />
                    </svg>
                  } @else if (alert.icon === 'child') {
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="7" r="4" />
                      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                    </svg>
                  } @else {
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  }
                </div>
                <div class="alert-body">
                  <strong class="alert-title">{{ alert.title }}</strong>
                  <p class="alert-desc">{{ alert.description }}</p>
                </div>
                <a class="alert-action-btn" [routerLink]="alert.actionPath">
                  {{ alert.actionLabel }} &rarr;
                </a>
              </div>
            }
          </section>
        }

        <!-- Quick Action Cards (4-column grid on desktop, 2-column on mobile) -->
        <section class="bento-quick-actions" aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" class="sr-only">Quick Actions</h2>
          @for (action of quickActions; track action.path) {
            <a class="quick-card {{ action.gradientClass }}" [routerLink]="action.path">
              <div class="quick-icon-wrapper">
                <span class="quick-icon" [class]="action.icon" aria-hidden="true">
                  @if (action.icon === 'screening') {
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 9 2 2 4-4"
                      />
                    </svg>
                  } @else if (action.icon === 'activity') {
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      />
                    </svg>
                  } @else if (action.icon === 'hospital') {
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  } @else {
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  }
                </span>
              </div>
              <div class="quick-card-text">
                <div class="quick-card-title-row">
                  <strong>
                    {{ currentLang() === 'km' ? action.titleKm : action.titleEn }}
                    <small class="quick-card-title-sub"
                      >({{ currentLang() === 'km' ? action.titleEn : action.titleKm }})</small
                    >
                  </strong>
                  @if (
                    currentLang() === 'km' ? action.timeEstimateKm : action.timeEstimateEn;
                    as est
                  ) {
                    <span class="quick-card-badge">{{ est }}</span>
                  }
                </div>
                <small>{{
                  currentLang() === 'km' ? action.descriptionKm : action.descriptionEn
                }}</small>
              </div>
              <span class="quick-card-arrow" aria-hidden="true">&rarr;</span>
            </a>
          }
        </section>

        @if (parentDashboardLoading()) {
          <div class="dashboard-state-center">
            <ac-ui-spinner label="Loading your personalized dashboard…" />
          </div>
        } @else if (parentDashboardError()) {
          <ac-ui-message tone="error">{{ parentDashboardError() }}</ac-ui-message>
        } @else if (parentDashboard(); as data) {
          <section class="bento-grid" aria-label="Parent dashboard overview">
            <!-- Screening Card (Spans 7 cols on desktop) -->
            <article class="card screening-card bento-tile-screening">
              @if (data.screeningSummary.hasScreening) {
                <div
                  class="progress-wrap"
                  [attr.aria-label]="
                    'Screening risk ' + (data.screeningSummary.riskPercentage ?? 0) + ' percent'
                  "
                >
                  <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
                    <circle cx="60" cy="60" r="48" class="progress-track"></circle>
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      class="progress-value"
                      [style.stroke-dashoffset]="
                        getDashOffset(data.screeningSummary.riskPercentage)
                      "
                    ></circle>
                  </svg>
                  <div>
                    <strong>{{ data.screeningSummary.riskPercentage ?? 0 }}%</strong>
                    <span>Risk Level</span>
                  </div>
                </div>

                <div class="screening-copy">
                  <span class="status-pill">
                    Status: {{ formatRiskLevel(data.screeningSummary.riskLevel) }}
                  </span>
                  <h2>{{ data.screeningSummary.riskLevel ?? 'Completed' }} Support Identified</h2>
                  <p>
                    @if (data.screeningSummary.completedDate) {
                      Completed on {{ formatDate(data.screeningSummary.completedDate) }}.
                    }
                    {{
                      data.screeningSummary.recommendation ||
                        'Screening results recorded and available for review.'
                    }}
                  </p>
                  @if (data.screeningSummary.sessionId) {
                    <a
                      class="primary-button"
                      [routerLink]="['/screening/result', data.screeningSummary.sessionId]"
                    >
                      View results
                    </a>
                  } @else {
                    <a class="primary-button" routerLink="/screening">View screening</a>
                  }
                </div>
              } @else {
                <div class="screening-empty">
                  <span class="status-pill">No Screening Record</span>
                  <h2>No screening completed yet</h2>
                  <p>
                    @if (data.selectedChild) {
                      Complete an initial screening questionnaire for
                      {{ data.selectedChild.firstName }} to identify strengths and support areas.
                    } @else {
                      Add a child profile and complete a screening to track developmental
                      milestones.
                    }
                  </p>
                  <a class="primary-button" routerLink="/screening">Start screening</a>
                </div>
              }
            </article>

            <!-- Upcoming Schedule Widget (Spans 5 cols on desktop) -->
            <article class="card appointment-card bento-tile-schedule">
              <div class="appointment-top">
                <span class="schedule-eyebrow">
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
                @if (data.upcomingAppointment; as appt) {
                  <div class="schedule-top-badges">
                    <span class="countdown-badge">{{
                      getAppointmentCountdown(appt.scheduledAt)
                    }}</span>
                    <strong class="status-tag">{{ appt.status }}</strong>
                  </div>
                }
              </div>

              @if (data.upcomingAppointment; as appt) {
                <h2>{{ appt.hospitalName }}</h2>
                <p>
                  @if (appt.doctorName) {
                    Consultation with {{ appt.doctorName }}
                    @if (appt.specialty) {
                      ({{ appt.specialty }})
                    }
                  } @else {
                    {{ appt.reason || 'Hospital Appointment' }}
                  }
                </p>
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
                    {{ formatDate(appt.scheduledAt) }}
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
                    {{ formatTime(appt.scheduledAt) }}
                  </span>
                </div>
                <div class="appointment-footer-actions">
                  <a class="reschedule-action-link" routerLink="/appointments">
                    Manage appointments &rarr;
                  </a>
                </div>
              } @else {
                <div class="appointment-empty">
                  <h2>No upcoming appointments</h2>
                  <p>Book developmental consultations with verified hospitals in your area.</p>
                  <a class="text-link" routerLink="/hospitals">
                    Find care provider <span aria-hidden="true">-&gt;</span>
                  </a>
                </div>
              }
            </article>

            <!-- Children Carousel / Roster (Spans full 12 cols on desktop) -->
            @if (data.children && data.children.length > 0) {
              <article class="card bento-tile-children" aria-label="Children Roster">
                <div class="children-roster-header">
                  <div>
                    <h2>Family Children Roster</h2>
                    <span class="roster-count">{{ data.children.length }} registered</span>
                  </div>
                  <a routerLink="/children" class="roster-manage-link">Manage profiles &rarr;</a>
                </div>
                <div class="children-roster-grid">
                  @for (c of data.children; track c.id) {
                    <div
                      class="roster-child-card"
                      [class.active-child]="selectedChild()?.id === c.id"
                      (click)="onSelectChild(c.id)"
                    >
                      <span class="roster-avatar" aria-hidden="true">{{ childInitials(c) }}</span>
                      <div class="roster-details">
                        <strong class="roster-child-name">{{ childFullName(c) }}</strong>
                        <span class="roster-child-age">{{ ageLabel(c.dateOfBirth) }}</span>
                      </div>
                      <div class="roster-status-chip">
                        @if (selectedChild()?.id === c.id && data.screeningSummary.hasScreening) {
                          <span class="roster-badge screened">{{
                            formatRiskLevel(data.screeningSummary.riskLevel)
                          }}</span>
                        } @else {
                          <span class="roster-badge">{{
                            selectedChild()?.id === c.id ? 'Active' : 'Switch'
                          }}</span>
                        }
                      </div>
                      <a
                        class="roster-arrow-btn"
                        [routerLink]="['/children', c.id]"
                        (click)="$event.stopPropagation()"
                        title="View profile"
                      >
                        &rsaquo;
                      </a>
                    </div>
                  }
                  <a class="roster-add-card" routerLink="/children/new">
                    <span class="roster-add-plus">+</span>
                    <span>Add child</span>
                  </a>
                </div>
              </article>
            }

            <!-- Weekly Progress Card (Spans 7 cols on desktop) -->
            <article class="card weekly-card bento-tile-progress">
              <div class="section-title">
                <div class="title-with-streak">
                  <h2>Weekly Progress</h2>
                  @if (data.weeklyProgress.totalCompletedThisWeek > 0) {
                    <span class="streak-badge">
                      <span class="streak-icon" aria-hidden="true">🔥</span>
                      <span
                        >{{ data.weeklyProgress.totalCompletedThisWeek }}
                        {{
                          currentLang() === 'km'
                            ? 'សកម្មភាពបានបញ្ចប់ (Streak: Completed)'
                            : 'Activities Completed'
                        }}</span
                      >
                    </span>
                  }
                </div>
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
              <div
                class="bar-chart"
                [attr.aria-label]="
                  data.weeklyProgress.totalCompletedThisWeek + ' activities completed this week'
                "
              >
                @for (day of data.weeklyProgress.days; track day.day) {
                  <div class="bar-col">
                    <span [style.--bar-height.%]="day.percentage" [class.active]="day.count > 0">
                      @if (day.count > 0) {
                        <strong>{{ day.count }}</strong>
                      }
                    </span>
                    <small class="bar-day-name">{{ day.day }}</small>
                  </div>
                }
              </div>
              @if (data.weeklyProgress.totalCompletedThisWeek > 0) {
                <p>
                  <strong
                    >{{ data.weeklyProgress.totalCompletedThisWeek }} activities ({{
                      data.weeklyProgress.totalCompletedThisWeek
                    }}
                    {{
                      currentLang() === 'km' ? 'សកម្មភាពបានបញ្ចប់' : 'activities completed'
                    }})</strong
                  >
                  {{
                    currentLang() === 'km'
                      ? 'ក្នុងសប្តាហ៍នេះ។ បន្តការចូលរួមដ៏ល្អនេះ!'
                      : 'completed this week. Keep up the great engagement!'
                  }}
                </p>
              } @else {
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'មិនទាន់មានសកម្មភាពដែលបានបញ្ចប់នៅសប្តាហ៍នេះទេ។'
                      : 'No activities completed yet this week. Explore activities to get started.'
                  }}
                  <span class="hero-subtext-bilingual">
                    (No activities completed yet this week. Explore activities to get
                    started.)</span
                  >
                </p>
              }

              <!-- Recent Milestones & Observation Timeline -->
              <div class="milestones-feed">
                <div class="milestone-feed-item">
                  <span class="milestone-feed-icon" aria-hidden="true">✓</span>
                  <div class="milestone-feed-content">
                    <span class="milestone-domain-badge domain-sensory">Sensory & Play</span>
                    <strong class="milestone-feed-title">Sensory Integration Activity</strong>
                  </div>
                  <a routerLink="/activities" class="milestone-feed-link">View</a>
                </div>
                <div class="milestone-feed-item">
                  <span class="milestone-feed-icon" aria-hidden="true">✓</span>
                  <div class="milestone-feed-content">
                    <span class="milestone-domain-badge domain-communication">Communication</span>
                    <strong class="milestone-feed-title">Visual Turn-Taking Play</strong>
                  </div>
                  <a routerLink="/activities" class="milestone-feed-link">View</a>
                </div>
              </div>
            </article>

            <!-- Recommended Action Card (Spans 5 cols on desktop) -->
            <article class="card action-card bento-tile-action">
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
              <h2>{{ data.recommendedAction.title }}</h2>
              <p>{{ data.recommendedAction.description }}</p>
              <a class="text-link" [routerLink]="data.recommendedAction.actionPath">
                {{ data.recommendedAction.actionLabel }}
                <span aria-hidden="true">-&gt;</span>
              </a>
            </article>
          </section>

          @if (!data.selectedChild) {
            <section class="empty-state">
              <h2>Personalize your dashboard</h2>
              <p>
                Add your first child profile to connect screenings, activities, school reports, and
                care notes.
              </p>
              <a class="primary-button" routerLink="/children">Open child profiles</a>
            </section>
          }
        }
      } @else if (isAdmin()) {
        <!-- ADMINISTRATOR REAL DASHBOARD -->
        @if (adminDashboardLoading()) {
          <div class="dashboard-state-center">
            <ac-ui-spinner label="Loading administrative dashboard…" />
          </div>
        } @else if (adminDashboardError()) {
          <ac-ui-message tone="error">{{ adminDashboardError() }}</ac-ui-message>
        } @else if (adminDashboard(); as adminData) {
          <!-- Stats Summary Grid -->
          <section class="admin-stats-grid" aria-label="Administrative metrics">
            <div class="admin-stat-card">
              <span class="admin-stat-label">Total Families</span>
              <span class="admin-stat-val">{{ adminData.stats.totalFamilies }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">Active Children</span>
              <span class="admin-stat-val">{{ adminData.stats.activeChildren }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">Partner Hospitals</span>
              <span class="admin-stat-val">{{ adminData.stats.totalHospitals }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">Partner Schools</span>
              <span class="admin-stat-val">{{ adminData.stats.totalSchools }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">Total Appointments</span>
              <span class="admin-stat-val">{{ adminData.stats.totalAppointments }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">Pending Requests</span>
              <span
                class="admin-stat-val"
                [class.warning]="adminData.stats.pendingAppointments > 0"
              >
                {{ adminData.stats.pendingAppointments }}
              </span>
            </div>
          </section>

          <!-- Tables & Audit Grid -->
          <div class="admin-sections-grid">
            <!-- Recent Appointments -->
            <div class="admin-content-card">
              <div class="admin-card-header">
                <h2>Recent Appointments</h2>
                <a routerLink="/appointments" class="text-link">View all</a>
              </div>
              @if (adminData.recentAppointments.length) {
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Family</th>
                      <th>Hospital</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (appt of adminData.recentAppointments; track appt.id) {
                      <tr>
                        <td>
                          <strong>{{ appt.parentName }}</strong>
                          @if (appt.childName) {
                            <br /><small>({{ appt.childName }})</small>
                          }
                        </td>
                        <td>{{ appt.hospitalName }}</td>
                        <td>{{ formatDate(appt.scheduledAt) }}</td>
                        <td>
                          <span class="admin-badge" [class]="appt.status.toLowerCase()">
                            {{ appt.status }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p class="empty-message">No appointments recorded yet.</p>
              }
            </div>

            <!-- Recent Security & Audit Events -->
            <div class="admin-content-card">
              <div class="admin-card-header">
                <h2>Recent Audit Events</h2>
              </div>
              @if (adminData.recentAuditEvents.length) {
                <div class="audit-timeline">
                  @for (evt of adminData.recentAuditEvents; track evt.id) {
                    <div class="audit-item">
                      <div>
                        <div class="audit-action">{{ evt.action }}</div>
                        <div class="audit-meta">
                          @if (evt.actorEmail) {
                            By: {{ evt.actorEmail }}
                          }
                          @if (evt.targetEmail) {
                            | Target: {{ evt.targetEmail }}
                          }
                        </div>
                      </div>
                      <span class="audit-time">{{ formatDate(evt.createdAt) }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="empty-message">No audit events recorded.</p>
              }
            </div>
          </div>

          <section class="admin-overview" aria-label="Administrator management shortcuts">
            <article>
              <span class="admin-icon directory" aria-hidden="true"></span>
              <p class="admin-label">Care directory</p>
              <h2>Manage Hospitals</h2>
              <p>
                Publish hospitals and specialist services so families can make informed care
                choices.
              </p>
              <a class="primary-button" routerLink="/hospitals">Manage hospitals</a>
            </article>
            <article>
              <span class="admin-icon family" aria-hidden="true"></span>
              <p class="admin-label">Family records</p>
              <h2>{{ adminData.stats.activeChildren }} active child profiles</h2>
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
              <h2>Partner Schools</h2>
              <p>
                Review school participation and keep the support network aligned around each child.
              </p>
              <a class="text-link" routerLink="/schools"
                >Open schools <span aria-hidden="true">-&gt;</span></a
              >
            </article>
          </section>
        }
      } @else if (isHospital()) {
        <div class="dashboard-state-center">
          <ac-ui-spinner label="Redirecting to Hospital Dashboard…" />
        </div>
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
          <p class="copyright">(c) {{ currentYear }} AutiCare. All rights reserved.</p>
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
        background: var(--ac-color-surface-slate);
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

      .empty-message {
        background: white;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        margin-bottom: 24px;
        color: var(--ac-color-text-slate);
        font-size: 14px;
        padding: 24px;
      }

      .greeting-section {
        margin-bottom: 28px;
      }

      .greeting-section h1 {
        margin: 0 0 8px 0;
        font-size: 32px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .greeting-section p {
        margin: 0;
        color: var(--ac-color-text-slate);
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
        background: var(--ac-color-blue-100);
      }

      .reports-icon {
        background: var(--ac-color-green-100);
      }

      .pending-icon {
        background: var(--ac-color-amber-tint-100);
      }

      .activities-icon {
        background: var(--ac-color-blue-100);
      }

      .stat-header {
        position: absolute;
        top: 20px;
        right: 20px;
      }

      .stat-trend {
        font-size: 12px;
        color: var(--ac-color-green-500);
        font-weight: 600;
      }

      .stat-trend.positive {
        color: var(--ac-color-green-500);
      }

      .stat-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
        line-height: 1;
      }

      .stat-value.warning {
        color: var(--ac-color-amber-500);
      }

      .stat-footer {
        font-size: 12px;
        color: var(--ac-color-text-slate);
        margin-top: 8px;
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
        color: var(--ac-color-text-slate-strong);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .calendar-icon {
        font-size: 20px;
      }

      .view-all {
        font-size: 13px;
        color: var(--ac-color-action-alt);
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
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .reports-table td {
        padding: 16px;
        border-bottom: 1px solid var(--ac-color-slate-100);
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
        color: var(--ac-color-text-slate-strong);
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-badge.submitted {
        background: var(--ac-color-green-100);
        color: var(--ac-color-emerald-600);
      }

      .status-badge.draft {
        background: var(--ac-color-slate-100);
        color: var(--ac-color-text-slate);
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
        color: var(--ac-color-text-slate-strong);
        line-height: 1.5;
      }

      .activity-content strong {
        font-weight: 600;
      }

      .activity-time {
        font-size: 12px;
        color: var(--ac-color-text-slate);
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
        background: var(--ac-color-surface-slate);
        border-left: 4px solid var(--ac-color-border-slate);
      }

      .reminder-item.today {
        background: var(--ac-color-red-50);
        border-left-color: var(--ac-color-red-500);
      }

      .reminder-item.tomorrow {
        background: var(--ac-color-blue-tint-subtle);
        border-left-color: var(--ac-color-blue-500);
      }

      .reminder-item.upcoming {
        background: var(--ac-color-surface-slate);
        border-left-color: var(--ac-color-text-slate);
      }

      .reminder-header {
        margin-bottom: 8px;
      }

      .reminder-when {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--ac-color-text-slate);
      }

      .reminder-when.today {
        color: var(--ac-color-red-500);
      }

      .reminder-when.tomorrow {
        color: var(--ac-color-blue-500);
      }

      .reminder-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
        margin-bottom: 4px;
      }

      .reminder-time {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }

      .engagement-card {
        background: linear-gradient(
          135deg,
          var(--ac-color-action-alt) 0%,
          var(--ac-color-ink-deep-teal) 100%
        );
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

      .child-selector-pills {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 14px;
        flex-wrap: wrap;
      }

      .child-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate-strong);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition:
          background 0.15s ease,
          border-color 0.15s ease,
          color 0.15s ease;
      }

      .child-pill:hover {
        background: var(--ac-color-tint-blue-mist);
      }

      .child-pill.active {
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action-alt);
      }

      .pill-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--ac-color-green-teal);
      }

      .child-pill.active .pill-dot {
        background: var(--ac-color-text-on-action);
      }

      .child-switcher {
        min-width: 230px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 24px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-text-strong);
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
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-dark);
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
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: 600;
      }

      .child-switcher svg {
        width: 20px;
        height: 20px;
      }

      .error {
        border-radius: 12px;
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
        padding: 14px 16px;
        margin-bottom: 20px;
      }

      .bento-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 24px;
        margin-bottom: 28px;
      }

      .bento-tile-screening {
        grid-column: span 7;
      }

      .bento-tile-schedule {
        grid-column: span 5;
      }

      .bento-tile-children {
        grid-column: span 12;
      }

      .bento-tile-progress {
        grid-column: span 7;
      }

      .bento-tile-action {
        grid-column: span 5;
      }

      .dashboard-hero-wrapper {
        margin-bottom: 24px;
      }

      .hero-content {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
      }

      .hero-text-block {
        flex: 1;
        min-width: 280px;
      }

      .hero-date-badge {
        display: inline-block;
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-action-mid);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 6px;
      }

      .hero-text-block h1 {
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        color: var(--ac-color-text-strong);
        margin: 0 0 8px;
        font-weight: var(--ac-font-weight-bold);
      }

      .hero-subtitle {
        font-size: var(--ac-type-page-subtitle);
        color: var(--ac-color-text-body);
        line-height: var(--ac-line-body);
        margin: 0 0 16px;
      }

      .hero-meta-bar {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
        margin-bottom: var(--ac-space-2);
      }

      .care-context-pill-wrapper {
        position: relative;
        display: inline-block;
      }

      .care-context-pill {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-tint-blue-mist);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-text-strong);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .care-context-pill:hover {
        background: var(--ac-color-tint-blue);
      }

      .care-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ac-color-green-500);
      }

      .care-label strong {
        color: var(--ac-color-action-deep);
        font-weight: 700;
      }

      .care-chevron {
        font-size: 9px;
        color: var(--ac-color-action-mid);
        margin-left: 2px;
      }

      .care-bilingual-tag {
        font-size: 11px;
        opacity: 0.8;
        font-weight: 400;
        margin-left: 4px;
      }

      .greeting-subtext {
        font-size: 0.75em;
        font-weight: 400;
        opacity: 0.85;
      }

      .hero-subtext-bilingual {
        font-size: 0.9em;
        opacity: 0.85;
      }

      .hero-btn-sub {
        font-size: 11px;
        font-weight: 400;
        opacity: 0.85;
        margin-left: 4px;
      }

      .quick-card-title-sub {
        font-size: 11px;
        font-weight: 400;
        opacity: 0.85;
        margin-left: 4px;
      }

      .care-dropdown-menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 50;
        min-width: 240px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        box-shadow: var(--ac-shadow-lg);
        padding: var(--ac-space-2);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .care-dropdown-item {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        padding: var(--ac-space-2) var(--ac-space-3);
        border-radius: var(--ac-radius-sm);
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        color: var(--ac-color-text-strong);
        transition: background var(--ac-motion-fast);
        width: 100%;
      }

      .care-dropdown-item:hover {
        background: var(--ac-color-tint-blue-mist);
      }

      .care-dropdown-item.active {
        background: var(--ac-color-tint-blue);
      }

      .dropdown-item-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--ac-color-action-soft);
        color: var(--ac-color-text-on-action);
        font-size: 11px;
        font-weight: 700;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .dropdown-item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .dropdown-item-info strong {
        font-size: 13px;
        color: var(--ac-color-text-strong);
      }

      .dropdown-item-info small {
        font-size: 11px;
        color: var(--ac-color-text-slate);
      }

      .dropdown-item-check {
        color: var(--ac-color-green-teal);
        font-weight: 700;
        font-size: 14px;
      }

      .dropdown-separator {
        height: 1px;
        background: var(--ac-color-border-slate);
        margin: 4px 0;
      }

      .dropdown-add-link {
        display: block;
        padding: var(--ac-space-2) var(--ac-space-3);
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-action-deep);
        text-decoration: none;
        border-radius: var(--ac-radius-sm);
        transition: background var(--ac-motion-fast);
      }

      .dropdown-add-link:hover {
        background: var(--ac-color-tint-blue-mist);
      }

      .hero-actions-block {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
      }

      .hero-add-child-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
        padding: 12px 18px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        box-shadow: var(--ac-shadow-sm);
        transition:
          background var(--ac-motion-fast),
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
      }

      .hero-add-child-btn:hover {
        background: var(--ac-color-action-hover);
        transform: translateY(-1px);
        box-shadow: var(--ac-shadow-hover);
      }

      .hero-add-icon {
        font-size: 16px;
        font-weight: 700;
        line-height: 1;
      }

      /* ─── PRIORITY ALERTS ─── */
      .priority-alerts-container {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-3);
        margin-bottom: var(--ac-space-6);
      }

      .priority-alert-card {
        display: flex;
        align-items: center;
        gap: var(--ac-space-4);
        padding: var(--ac-space-4) var(--ac-space-5);
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border-info);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        transition:
          box-shadow var(--ac-motion-fast),
          transform var(--ac-motion-fast);
      }

      .priority-alert-card.tone-caution {
        background: var(--ac-color-tint-steel-soft);
        border-color: var(--ac-color-amber-500);
      }

      .priority-alert-card.tone-info {
        background: var(--ac-color-tint-blue-soft);
        border-color: var(--ac-color-border-info);
      }

      .priority-alert-card.tone-alert {
        background: var(--ac-color-red-50);
        border-color: var(--ac-color-red-500);
      }

      .priority-alert-card.tone-neutral {
        background: var(--ac-color-green-50);
        border-color: var(--ac-color-green-500);
      }

      .alert-icon-wrap {
        width: 38px;
        height: 38px;
        border-radius: var(--ac-radius-pill);
        display: grid;
        place-items: center;
        flex-shrink: 0;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-xs);
      }

      .alert-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .alert-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .alert-desc {
        font-size: 13px;
        color: var(--ac-color-text-body);
        margin: 0;
        line-height: 1.4;
      }

      .alert-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
        transition:
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .alert-action-btn:hover {
        background: var(--ac-color-tint-blue-mist);
        border-color: var(--ac-color-action-deep);
      }

      /* ─── QUICK ACTIONS (4 COLUMNS) ─── */
      .bento-quick-actions {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--ac-space-4);
        margin-bottom: var(--ac-space-6);
      }

      @media (max-width: 900px) {
        .bento-quick-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 540px) {
        .bento-quick-actions {
          grid-template-columns: 1fr;
        }
      }

      .quick-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: 18px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        text-decoration: none;
        box-shadow: var(--ac-shadow-sm);
        transition:
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .quick-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-hover);
      }

      .gradient-screening {
        background: linear-gradient(
          135deg,
          rgb(255 255 255 / 0.95) 0%,
          var(--ac-color-surface-info) 100%
        );
        border-color: var(--ac-color-border-info);
      }

      .gradient-milestone {
        background: linear-gradient(
          135deg,
          rgb(255 255 255 / 0.95) 0%,
          var(--ac-color-green-50) 100%
        );
        border-color: var(--ac-color-border);
      }

      .gradient-hospital {
        background: linear-gradient(
          135deg,
          rgb(255 255 255 / 0.95) 0%,
          var(--ac-color-ice-blue-soft) 100%
        );
        border-color: var(--ac-color-ice-blue-border);
      }

      .gradient-trajectory {
        background: linear-gradient(
          135deg,
          rgb(255 255 255 / 0.95) 0%,
          var(--ac-color-tint-blue-mist) 100%
        );
        border-color: var(--ac-color-border-info);
      }

      .quick-card-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .quick-card-badge {
        display: inline-block;
        padding: 2px 7px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        font-size: 10px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        white-space: nowrap;
      }

      .title-with-streak {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
      }

      .streak-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
        font-size: 12px;
        font-weight: 600;
      }

      .streak-icon {
        font-size: 13px;
      }

      .quick-card-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .quick-card-text strong {
        font-size: 15px;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .quick-card-text small {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .quick-card-arrow {
        font-size: 18px;
        color: var(--ac-color-action-mid);
        transition: transform var(--ac-motion-fast);
      }

      .quick-card:hover .quick-card-arrow {
        transform: translateX(4px);
      }

      .countdown-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .schedule-top-badges {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-tag {
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-olive-mid);
        color: var(--ac-color-text-on-action);
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .appointment-footer-actions {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-border);
      }

      .reschedule-action-link,
      .reschedule-shortcut {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-action-deep);
        text-decoration: none;
      }

      .reschedule-action-link:hover,
      .reschedule-shortcut:hover {
        text-decoration: underline;
      }

      .children-roster-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
      }

      .children-roster-header h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--ac-color-text-strong);
        margin: 0;
      }

      .roster-count {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .roster-manage-link {
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-action-deep);
        text-decoration: none;
      }

      .roster-manage-link:hover {
        text-decoration: underline;
      }

      .children-roster-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }

      .roster-child-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        cursor: pointer;
        transition: all var(--ac-motion-fast);
      }

      .roster-child-card:hover {
        border-color: var(--ac-color-primary);
        box-shadow: var(--ac-shadow-sm);
      }

      .roster-child-card.active-child {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
        box-shadow: var(--ac-shadow-sm);
      }

      .roster-avatar {
        width: 40px;
        height: 40px;
        border-radius: var(--ac-radius-pill);
        background: linear-gradient(135deg, var(--ac-color-teal-slate), var(--ac-color-sky-soft));
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 14px;
        flex: 0 0 auto;
      }

      .roster-details {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .roster-child-name {
        font-size: 14px;
        color: var(--ac-color-text-strong);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .roster-child-age {
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .roster-status-chip {
        flex: 0 0 auto;
      }

      .roster-badge {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-slate-100);
        color: var(--ac-color-text-slate);
      }

      .roster-badge.screened {
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-deep);
      }

      .roster-arrow-btn {
        font-size: 20px;
        color: var(--ac-color-text-slate);
        text-decoration: none;
        padding: 0 4px;
      }

      .roster-arrow-btn:hover {
        color: var(--ac-color-action-deep);
      }

      .roster-add-card {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 14px;
        border: 1px dashed var(--ac-color-border-grey);
        border-radius: var(--ac-radius-md);
        color: var(--ac-color-action-deep);
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
        transition: all var(--ac-motion-fast);
      }

      .roster-add-card:hover {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
      }

      .milestones-feed {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--ac-color-border);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .milestone-feed-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-slate-50);
      }

      .milestone-feed-icon {
        width: 22px;
        height: 22px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-100);
        color: var(--ac-color-green-700);
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 700;
      }

      .milestone-feed-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .milestone-domain-badge {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        width: fit-content;
        padding: 1px 6px;
        border-radius: var(--ac-radius-pill);
      }

      .domain-sensory {
        background: var(--ac-color-blue-100);
        color: var(--ac-color-action-deep);
      }

      .domain-communication {
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-deep);
      }

      .milestone-feed-title {
        font-size: 12px;
        color: var(--ac-color-text-strong);
      }

      .milestone-feed-link {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-action-deep);
        text-decoration: none;
      }

      .milestone-feed-link:hover {
        text-decoration: underline;
      }

      .bar-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        flex: 1;
      }

      .bar-day-name {
        font-size: 11px;
        color: var(--ac-color-text-muted);
        font-weight: 600;
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
        background: var(--ac-color-surface);
        box-shadow: 0 12px 34px rgb(41 74 90 / 0.07);
        display: grid;
        align-content: start;
        gap: 14px;
        padding: 24px;
      }

      .admin-overview article:first-child {
        border-color: var(--ac-color-ice-blue-border);
        background: var(--ac-color-surface-info);
      }

      .admin-overview h2 {
        color: var(--ac-color-text-strong);
        font-size: 24px;
        line-height: 1.3;
      }

      .admin-overview p:not(.admin-label) {
        color: var(--ac-color-text-body);
        line-height: 1.55;
      }

      .admin-label {
        color: var(--ac-color-olive);
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .admin-icon {
        width: 46px;
        height: 46px;
        border-radius: 8px;
        background: var(--ac-color-olive-light);
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
        background: var(--ac-color-olive-dark);
      }

      .admin-icon.directory::after {
        left: 11px;
        top: 19px;
        width: 24px;
        height: 8px;
        background: var(--ac-color-olive-dark);
      }

      .admin-icon.family::before {
        left: 10px;
        top: 10px;
        width: 26px;
        height: 26px;
        border: 3px solid var(--ac-color-olive-dark);
        border-radius: 50% 50% 10px 10px;
      }

      .admin-icon.school::before {
        left: 11px;
        top: 15px;
        width: 24px;
        height: 18px;
        border: 3px solid var(--ac-color-olive-dark);
      }

      .admin-icon.school::after {
        left: 10px;
        top: 8px;
        width: 26px;
        height: 26px;
        border-top: 3px solid var(--ac-color-olive-dark);
        border-left: 3px solid var(--ac-color-olive-dark);
        transform: rotate(45deg);
      }

      .card {
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 24px;
        background: var(--ac-color-surface);
        box-shadow: 0 12px 34px rgb(41 74 90 / 0.07);
        padding: 28px;
      }

      .screening-card {
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
        stroke: var(--ac-color-sage-light);
      }

      .progress-value {
        stroke: var(--ac-color-sage);
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
        color: var(--ac-color-olive-deep);
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
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-deep);
        padding: 6px 14px;
        font-size: 13px;
        line-height: 1.1;
        font-weight: 700;
      }

      .screening-copy h2,
      .action-card h2,
      .appointment-card h2 {
        color: var(--ac-color-text-strong);
        font-size: 26px;
        line-height: 1.3;
        font-weight: 600;
        letter-spacing: 0;
      }

      .screening-copy p,
      .action-card p,
      .appointment-card p,
      .weekly-card p {
        color: var(--ac-color-text-body);
        font-size: 16px;
        line-height: 1.58;
      }

      .primary-button {
        min-height: 46px;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 26px;
        text-decoration: none;
        font-weight: 600;
      }

      .weekly-card {
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
        color: var(--ac-color-action-deep);
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
        background: var(--ac-color-tint-blue);
      }

      .bar-chart span.active {
        background: var(--ac-color-action);
      }

      .bar-chart strong {
        position: absolute;
        left: 50%;
        top: -26px;
        color: var(--ac-color-action-deep);
        transform: translateX(-50%);
      }

      .weekly-card p {
        text-align: center;
      }

      .weekly-card p strong {
        color: var(--ac-color-text-strong);
      }

      .action-card {
        position: relative;
        overflow: hidden;
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
        background: var(--ac-color-sage-light);
        opacity: 0.44;
      }

      .soft-icon {
        width: 58px;
        height: 58px;
        border-radius: 999px;
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-mid);
        display: grid;
        place-items: center;
      }

      .soft-icon svg {
        width: 30px;
        height: 30px;
      }

      .text-link {
        color: var(--ac-color-action-deep);
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
        min-height: 300px;
        border-color: var(--ac-color-ice-blue);
        background: var(--ac-color-surface-info);
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
        color: var(--ac-color-action-deep);
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
        background: var(--ac-color-olive-mid);
        color: var(--ac-color-text-on-action);
        padding: 6px 14px;
        font-size: 13px;
      }

      .appointment-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
      }

      .appointment-meta span {
        color: var(--ac-color-text-strong);
        font-size: 14px;
        text-transform: none;
      }

      .empty-state {
        margin-top: 26px;
        border: 1px solid var(--ac-color-grey-pale-alt);
        border-radius: 8px;
        background: var(--ac-color-surface);
        padding: 24px;
        display: grid;
        justify-items: start;
        gap: 12px;
      }

      .empty-state h2 {
        color: var(--ac-color-text-strong);
        font-size: 22px;
      }

      .empty-state p {
        color: var(--ac-color-text-body);
        line-height: 1.55;
      }

      .dashboard-footer {
        margin-top: 92px;
        border-top: 1px solid var(--ac-color-grey-pale-alt);
        padding: 54px 0 24px;
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr 1.25fr;
        gap: 48px;
      }

      .dashboard-footer h2 {
        color: var(--ac-color-action-mid);
        font-size: 26px;
        line-height: 1.2;
      }

      .dashboard-footer h3 {
        color: var(--ac-color-text-strong);
        font-size: 16px;
        line-height: 1.2;
        margin-bottom: 18px;
      }

      .dashboard-footer p,
      .dashboard-footer a {
        color: var(--ac-color-text-body);
        font-size: 16px;
        line-height: 1.55;
      }

      .dashboard-footer a {
        display: block;
        text-decoration: none;
        margin-bottom: 10px;
      }

      .dashboard-footer a:hover {
        color: var(--ac-color-action-deep);
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
        background: var(--ac-color-tint-blue);
        color: var(--ac-color-action-deep);
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

      @media (max-width: 1024px) and (min-width: 641px) {
        .bento-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .bento-tile-screening,
        .bento-tile-schedule,
        .bento-tile-progress,
        .bento-tile-action {
          grid-column: span 1;
        }

        .bento-tile-children {
          grid-column: span 2;
        }

        .bento-quick-actions {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
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

      @media (max-width: 640px) {
        .bento-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .bento-tile-screening,
        .bento-tile-schedule,
        .bento-tile-children,
        .bento-tile-progress,
        .bento-tile-action {
          grid-column: span 1;
        }

        .bento-quick-actions {
          grid-template-columns: 1fr;
          gap: 12px;
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

        .dashboard-footer {
          grid-template-columns: 1fr;
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

      .dashboard-state-center {
        display: flex;
        justify-content: center;
        padding: 48px 0;
      }

      .screening-empty,
      .weekly-empty,
      .appointment-empty {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .screening-empty h2,
      .weekly-empty h2,
      .appointment-empty h2 {
        color: var(--ac-color-text-strong);
        font-size: 20px;
        font-weight: 600;
        margin: 0;
      }

      .screening-empty p,
      .weekly-empty p,
      .appointment-empty p {
        color: var(--ac-color-text-body);
        font-size: 15px;
        line-height: 1.5;
        margin: 0;
      }

      .admin-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
        margin-bottom: 28px;
      }

      .admin-stat-card {
        background: var(--ac-color-surface);
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 16px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 4px 16px rgb(41 74 90 / 0.04);
      }

      .admin-stat-label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
      }

      .admin-stat-val {
        font-size: 32px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        line-height: 1;
      }

      .admin-stat-val.warning {
        color: var(--ac-color-alert-strong);
      }

      .admin-sections-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
        margin-bottom: 32px;
      }

      .admin-content-card {
        background: var(--ac-color-surface);
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 16px rgb(41 74 90 / 0.04);
      }

      .admin-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .admin-card-header h2 {
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .admin-table {
        width: 100%;
        border-collapse: collapse;
      }

      .admin-table th {
        text-align: left;
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 10px 12px;
        border-bottom: 1px solid var(--ac-color-border-grey);
      }

      .admin-table td {
        padding: 14px 12px;
        font-size: 14px;
        color: var(--ac-color-text-body);
        border-bottom: 1px solid var(--ac-color-border-grey);
      }

      .admin-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        background: var(--ac-color-tint-blue);
        color: var(--ac-color-action-deep);
      }

      .admin-badge.confirmed {
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-deep);
      }

      .admin-badge.requested {
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
      }

      .audit-timeline {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .audit-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--ac-color-border-grey);
      }

      .audit-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .audit-action {
        font-weight: 600;
        color: var(--ac-color-text-strong);
        font-size: 14px;
      }

      .audit-meta {
        font-size: 12px;
        color: var(--ac-color-text-slate);
        margin-top: 4px;
      }

      .audit-time {
        font-size: 12px;
        color: var(--ac-color-text-slate);
        white-space: nowrap;
      }

      @media (max-width: 900px) {
        .admin-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .admin-sections-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  protected readonly currentYear = new Date().getFullYear();
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly dashboardApi = inject(DashboardApi);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;

  protected readonly quickActions = quickActions;
  protected readonly children = signal<readonly ChildResponse[]>([]);
  protected readonly childrenLoading = signal(false);
  protected readonly childrenError = signal<string | null>(null);
  protected readonly parent = this.auth.parent;
  protected readonly isParent = computed(() => this.parent()?.role === 'PARENT');
  protected readonly isSchoolStaff = computed(() => this.parent()?.role === 'SCHOOL');
  protected readonly isAdmin = computed(() => this.parent()?.role === 'ADMIN');
  protected readonly isHospital = computed(() => this.parent()?.role === 'HOSPITAL');
  protected readonly parentFirstName = computed(() => this.parent()?.firstName || 'there');
  protected readonly activeDateFormatted = computed(() => {
    const isKm = this.currentLang() === 'km';
    if (isKm) {
      return new Intl.DateTimeFormat('km-KH', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date());
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  });

  // Parent dashboard real backend data
  protected readonly parentDashboard = signal<ParentDashboardResponse | null>(null);
  protected readonly parentDashboardLoading = signal(false);
  protected readonly parentDashboardError = signal<string | null>(null);
  protected readonly selectedChildId = signal<string | null>(null);

  protected readonly activeChildren = computed(() => {
    return this.parentDashboard()?.children ?? [];
  });

  protected readonly hasMultipleChildren = computed(() => {
    return (this.parentDashboard()?.children?.length ?? 0) > 1;
  });

  // Selected child derived from parentDashboard first, falling back to children list if any
  protected readonly selectedChild = computed(() => {
    const parentDash = this.parentDashboard();
    if (parentDash?.selectedChild) {
      return {
        id: parentDash.selectedChild.id,
        firstName: parentDash.selectedChild.firstName,
        lastName: parentDash.selectedChild.lastName,
        dateOfBirth: parentDash.selectedChild.dateOfBirth,
        archivedAt: null,
      } as unknown as ChildResponse;
    }
    return this.children().find((child) => !child.archivedAt) ?? null;
  });

  protected readonly childDropdownOpen = signal(false);

  protected toggleChildDropdown(): void {
    this.childDropdownOpen.update((open) => !open);
  }

  protected closeChildDropdown(): void {
    this.childDropdownOpen.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.childDropdownOpen()) {
      this.closeChildDropdown();
    }
  }

  protected readonly priorityAlerts = computed<readonly PriorityAlert[]>(() => {
    if (!this.isParent()) return [];
    const data = this.parentDashboard();
    if (!data) return [];
    const alerts: PriorityAlert[] = [];
    const isKm = this.currentLang() === 'km';

    if (data.selectedChild && !data.screeningSummary.hasScreening) {
      alerts.push({
        id: 'screening-due',
        title: isKm
          ? `ដល់ពេលវាយតម្លៃការលូតលាស់របស់ ${data.selectedChild.firstName} (Screening due for ${data.selectedChild.firstName})`
          : `Screening due for ${data.selectedChild.firstName}`,
        description: isKm
          ? `បំពេញកម្រងសំណួរដំណាក់កាលលូតលាស់រយៈពេល 5 នាទីដើម្បីកំណត់ចំណុចខ្លាំង និងតម្រូវការគាំទ្រ។ (Complete an initial 5-minute milestone questionnaire to identify strengths and support areas.)`
          : `Complete an initial 5-minute milestone questionnaire to identify strengths and support areas.`,
        actionPath: '/screening',
        actionLabel: isKm ? 'ចាប់ផ្តើមការវាយតម្លៃ (Start Screening)' : 'Start Screening',
        tone: 'caution',
        icon: 'clipboard',
      });
    }

    if (data.upcomingAppointment) {
      const appt = data.upcomingAppointment;
      const docOrHosp = appt.doctorName || appt.hospitalName;
      alerts.push({
        id: 'upcoming-appt',
        title: isKm
          ? `ការណាត់ជួបត្រូវបានបញ្ជាក់ជាមួយ ${docOrHosp} (Appointment confirmed for ${docOrHosp})`
          : `Appointment confirmed for ${docOrHosp}`,
        description: `${this.formatDate(appt.scheduledAt)} at ${this.formatTime(appt.scheduledAt)}${appt.specialty ? ` · ${appt.specialty}` : ''}`,
        actionPath: '/appointments',
        actionLabel: isKm ? 'មើលព័ត៌មានលម្អិត (View Details)' : 'View Details',
        tone: 'info',
        icon: 'calendar',
      });
    }

    if (data.selectedChild && data.screeningSummary.hasScreening) {
      alerts.push({
        id: 'school-report',
        title: isKm
          ? 'មានរបាយការណ៍សង្កេតថ្មីពីសាលារៀន (1 new school report)'
          : '1 new school report',
        description: isKm
          ? 'គ្រូបង្រៀនបានកត់ត្រាការសង្កេតថ្មីស្តីពីការសម្របសម្រួលញាណដឹង និងការប្រាស្រ័យទាក់ទង។'
          : 'Teachers recorded new observations on sensory accommodation and communication wins.',
        actionPath: '/schools',
        actionLabel: isKm ? 'មើលរបាយការណ៍សាលា (View Report)' : 'View Report',
        tone: 'info',
        icon: 'clipboard',
      });
    }

    if (
      data.recommendedAction &&
      data.recommendedAction.source !== 'NO_SCREENING' &&
      data.recommendedAction.source !== 'NO_CHILD'
    ) {
      alerts.push({
        id: 'recommended-action',
        title: data.recommendedAction.title,
        description: data.recommendedAction.description,
        actionPath: data.recommendedAction.actionPath,
        actionLabel: data.recommendedAction.actionLabel,
        tone: 'neutral',
        icon: 'sparkles',
      });
    }

    if (!data.selectedChild) {
      alerts.push({
        id: 'add-child',
        title: isKm ? 'បន្ថែមទិន្នន័យកុមារ (Add a child profile)' : 'Add a child profile',
        description: isKm
          ? 'បង្កើតប្រវត្តិកុមារដើម្បីតាមដានការវាយតម្លៃ និងសកម្មភាពផ្ទាល់ខ្លួន។ (Create a child profile to track personalized screenings and activities.)'
          : 'Create a child profile to track personalized screenings and activities.',
        actionPath: '/children/new',
        actionLabel: isKm ? 'បន្ថែមទិន្នន័យកុមារ (Add Child Profile)' : 'Add Child Profile',
        tone: 'info',
        icon: 'child',
      });
    }

    return alerts;
  });

  // Admin dashboard real backend data
  protected readonly adminDashboard = signal<AdminDashboardResponse | null>(null);
  protected readonly adminDashboardLoading = signal(false);
  protected readonly adminDashboardError = signal<string | null>(null);

  // School dashboard data from API
  protected readonly dashboardData = signal<SchoolDashboardResponse | null>(null);
  protected readonly dashboardLoading = signal(true);
  protected readonly dashboardError = signal<string | null>(null);

  protected readonly greetingName = computed(() => {
    const d = this.dashboardData();
    if (d?.staffFirstName) return d.staffFirstName;
    return this.parent()?.firstName || 'School';
  });

  // Derived student activities from recent reports
  protected readonly derivedActivities = computed(() => {
    const reports = this.dashboardData()?.recentReports;
    if (!reports?.length) return [];
    const colors = [
      'var(--ac-color-blue-500)',
      'var(--ac-color-green-500)',
      'var(--ac-color-amber-500)',
      'var(--ac-color-red-500)',
      'var(--ac-color-status-purple)',
    ];
    return reports.slice(0, 3).map((r, i) => ({
      id: r.id,
      studentName: r.childFirstName,
      initials: r.childFirstName.slice(0, 2).toUpperCase(),
      description: `completed "${r.title}" in ${r.activityCategory}.`,
      timeAgo: this.formatDate(r.activityDate),
      color: colors[i % colors.length],
    }));
  });

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
    if (!this.parent()) {
      this.auth.loadCurrentUser().subscribe({
        next: () => this.initRoleData(),
        error: () => {},
      });
    } else {
      this.initRoleData();
    }
  }

  private initRoleData() {
    const role = this.parent()?.role;
    if (role === 'PARENT') {
      this.loadParentDashboard();
    } else if (role === 'ADMIN') {
      this.loadAdminDashboard();
      this.loadChildren();
    } else if (role === 'SCHOOL') {
      this.loadSchoolDashboard();
    } else if (role === 'HOSPITAL') {
      void this.router.navigateByUrl('/hospital/dashboard');
    }
  }

  protected dayPart(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  protected childFullName(child: { firstName: string; lastName?: string | null }): string {
    return [child.firstName, child.lastName].filter(Boolean).join(' ');
  }

  protected childInitials(child: { firstName: string; lastName?: string | null }): string {
    const parts = [child.firstName, child.lastName].filter(Boolean) as string[];
    const [first, second] = parts;
    if (first && second) {
      return (first.charAt(0) + second.charAt(0)).toUpperCase();
    }
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
    const colors = [
      'var(--ac-color-blue-500)',
      'var(--ac-color-green-500)',
      'var(--ac-color-amber-500)',
      'var(--ac-color-red-500)',
      'var(--ac-color-status-purple)',
    ];
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

  protected getAppointmentCountdown(scheduledAt: string): string {
    const apptDate = new Date(scheduledAt);
    const now = new Date();
    const apptDay = new Date(
      apptDate.getFullYear(),
      apptDate.getMonth(),
      apptDate.getDate(),
    ).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((apptDay - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays > 7 && diffDays <= 30) return `In ${Math.round(diffDays / 7)} weeks`;
    if (diffDays > 30) return `In ${Math.round(diffDays / 30)} months`;
    return 'Upcoming';
  }

  protected formatDate(dateStr: string): string {
    const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  protected formatPending(value: number | undefined): string {
    const n = value ?? 0;
    return n < 10 ? `0${n}` : `${n}`;
  }

  protected formatRiskLevel(riskLevel: string | null): string {
    if (!riskLevel) return 'Not Screened';
    const normalized = riskLevel.toUpperCase();
    if (normalized === 'LOW') {
      return 'ការបារម្ភកម្រិតទាប (Low Concern)';
    }
    if (normalized === 'MODERATE') {
      return 'ការបារម្ភកម្រិតមធ្យម (Moderate Concern)';
    }
    if (normalized === 'HIGH' || normalized === 'ELEVATED') {
      return 'ការបារម្ភកម្រិតខ្ពស់ (Elevated Concern)';
    }
    return `${riskLevel.charAt(0) + riskLevel.slice(1).toLowerCase()} Risk`;
  }

  protected getDashOffset(percentage: number | null): number {
    const pct = Math.max(0, Math.min(100, percentage ?? 0));
    // Circumference = 2 * PI * 48 = ~301.59
    return 301.59 - (301.59 * pct) / 100;
  }

  onSelectChild(childId: string) {
    if (this.selectedChildId() === childId) return;
    this.selectedChildId.set(childId);
    this.loadParentDashboard(childId);
  }

  loadParentDashboard(childId?: string) {
    this.parentDashboardLoading.set(true);
    this.parentDashboardError.set(null);
    const targetChildId = childId ?? this.selectedChildId() ?? undefined;
    this.dashboardApi.getParentDashboard(targetChildId).subscribe({
      next: (data) => {
        this.parentDashboard.set(data);
        if (data.selectedChild) {
          this.selectedChildId.set(data.selectedChild.id);
        }
        this.parentDashboardLoading.set(false);
      },
      error: () => {
        this.parentDashboardError.set('Parent dashboard could not be loaded.');
        this.parentDashboardLoading.set(false);
      },
    });
  }

  loadAdminDashboard() {
    this.adminDashboardLoading.set(true);
    this.adminDashboardError.set(null);
    this.dashboardApi.getAdminDashboard().subscribe({
      next: (data) => {
        this.adminDashboard.set(data);
        this.adminDashboardLoading.set(false);
      },
      error: () => {
        this.adminDashboardError.set('Administrator dashboard could not be loaded.');
        this.adminDashboardLoading.set(false);
      },
    });
  }

  loadSchoolDashboard() {
    this.dashboardLoading.set(true);
    this.dashboardError.set(null);
    this.schoolsApi.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.dashboardLoading.set(false);
      },
      error: () => {
        this.dashboardError.set('Dashboard could not be loaded. Please refresh the page.');
        this.dashboardLoading.set(false);
      },
    });
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
