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
import { ParentAnalysisComponent } from './analysis/parent-analysis.component';
import { AdminOverviewComponent } from '../admin/admin-overview.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    SchoolTopbarComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    ParentAnalysisComponent,
    AdminOverviewComponent,
  ],
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
            <!-- Teacher Portal Header -->
            <header class="school-header">
              <div class="header-intro">
                <p class="eyebrow">
                  {{ currentLang() === 'km' ? 'ផ្ទាំងគ្រប់គ្រងគ្រូបង្រៀន' : 'Teacher Portal' }}
                </p>
                <h1>
                  @if (currentLang() === 'km') {
                    សួស្តី {{ greetingName() }}
                  } @else {
                    Good {{ dayPart() }}, {{ greetingName() }}
                  }
                </h1>
                <p class="subtitle">
                  {{
                    currentLang() === 'km'
                      ? 'នេះជាសេចក្តីសង្ខេបនៃការវិវត្ត និងសកម្មភាពក្នុងថ្នាក់រៀនរបស់អ្នកថ្ងៃនេះ។'
                      : "Here's a summary of your classroom's progress and student activities today."
                  }}
                </p>
              </div>
              <div class="header-actions">
                <a class="secondary-btn" routerLink="/schools/reports">
                  {{ currentLang() === 'km' ? 'មើលរបាយការណ៍ទាំងអស់' : 'View all reports' }}
                </a>
                <a class="primary-btn" routerLink="/schools/reports/new">
                  <span aria-hidden="true">+</span>
                  <span>{{ currentLang() === 'km' ? 'របាយការណ៍ថ្មី' : 'New report' }}</span>
                </a>
              </div>
            </header>

            @if (dashboardData(); as data) {
              <!-- Classroom Summary Strip -->
              <section
                class="stats-strip"
                [attr.aria-label]="
                  currentLang() === 'km' ? 'ស្ថិតិសង្ខេបថ្នាក់រៀន' : 'Classroom summary'
                "
              >
                <div class="stat-item">
                  <span class="stat-label">
                    {{ currentLang() === 'km' ? 'សិស្សសរុប' : 'Total students' }}
                  </span>
                  <div class="stat-body">
                    <span class="stat-value">{{ data.stats.totalStudents }}</span>
                    @if (data.stats.studentsDelta) {
                      <span class="stat-meta">
                        +{{ data.stats.studentsDelta }}
                        {{ currentLang() === 'km' ? 'ឆមាសនេះ' : 'this term' }}
                      </span>
                    }
                  </div>
                </div>

                <div class="stat-item">
                  <span class="stat-label">
                    {{ currentLang() === 'km' ? 'របាយការណ៍បានដាក់ស្នើ' : 'Reports submitted' }}
                  </span>
                  <div class="stat-body">
                    <span class="stat-value">{{ data.stats.reportsSubmitted }}</span>
                    <span class="stat-meta">
                      {{ currentLang() === 'km' ? 'ខែនេះ' : 'this month' }}
                    </span>
                  </div>
                </div>

                <div class="stat-item">
                  <span class="stat-label">
                    {{ currentLang() === 'km' ? 'របាយការណ៍រង់ចាំ' : 'Pending reports' }}
                  </span>
                  <div class="stat-body">
                    <span class="stat-value" [class.warning]="data.stats.pendingReports > 0">
                      {{ formatPending(data.stats.pendingReports) }}
                    </span>
                    @if (data.stats.pendingReports > 0) {
                      <span class="stat-meta warning">
                        {{ currentLang() === 'km' ? 'ត្រូវពិនិត្យ' : 'action needed' }}
                      </span>
                    }
                  </div>
                </div>

                <div class="stat-item">
                  <span class="stat-label">
                    {{ currentLang() === 'km' ? 'សកម្មភាពបានបញ្ចប់' : 'Activities completed' }}
                  </span>
                  <div class="stat-body">
                    <span class="stat-value">{{ data.stats.activitiesCompleted }}</span>
                    @if (data.stats.weekDelta != null) {
                      <span class="stat-meta positive">
                        +{{ data.stats.weekDelta }}%
                        {{ currentLang() === 'km' ? 'ពីសប្តាហ៍មុន' : 'vs last week' }}
                      </span>
                    }
                  </div>
                </div>
              </section>

              <!-- Main Content Grid -->
              <div class="dashboard-grid">
                <!-- Left Column -->
                <div class="left-column">
                  <!-- Recent Reports -->
                  <div class="content-card">
                    <div class="card-header">
                      <h2>
                        {{ currentLang() === 'km' ? 'របាយការណ៍ថ្មីៗ' : 'Recent Reports' }}
                      </h2>
                      <a routerLink="/schools/reports" class="view-all">
                        {{ currentLang() === 'km' ? 'មើលទាំងអស់' : 'View all' }}
                      </a>
                    </div>
                    @if (data.recentReports.length) {
                      <table class="reports-table">
                        <thead>
                          <tr>
                            <th>{{ currentLang() === 'km' ? 'ឈ្មោះសិស្ស' : 'Student Name' }}</th>
                            <th>{{ currentLang() === 'km' ? 'សកម្មភាព' : 'Activity' }}</th>
                            <th>{{ currentLang() === 'km' ? 'កាលបរិច្ឆេទ' : 'Date' }}</th>
                            <th>{{ currentLang() === 'km' ? 'ស្ថានភាព' : 'Status' }}</th>
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
                                  {{
                                    currentLang() === 'km'
                                      ? report.status === 'SUBMITTED'
                                        ? 'បានដាក់ស្នើ'
                                        : report.status === 'DRAFT'
                                          ? 'ព្រាង'
                                          : report.status
                                      : report.status
                                  }}
                                </span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    } @else {
                      <p class="empty-message">
                        {{
                          currentLang() === 'km' ? 'មិនទាន់មានរបាយការណ៍នៅឡើយទេ។' : 'No reports yet.'
                        }}
                      </p>
                    }
                  </div>

                  <!-- Recent Student Activities (derived from recent reports) -->
                  <div class="content-card">
                    <div class="card-header">
                      <h2>
                        {{
                          currentLang() === 'km'
                            ? 'សកម្មភាពសិស្សថ្មីៗ'
                            : 'Recent Student Activities'
                        }}
                      </h2>
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
                      <p class="empty-message">
                        {{
                          currentLang() === 'km'
                            ? 'មិនទាន់មានសកម្មភាពថ្មីៗនៅឡើយទេ។'
                            : 'No recent activities.'
                        }}
                      </p>
                    }
                  </div>
                </div>

                <!-- Right Column -->
                <div class="right-column">
                  <!-- Report Reminders -->
                  <div class="content-card reminders-card">
                    <div class="card-header">
                      <h2>
                        {{ currentLang() === 'km' ? 'ការរំលឹករបាយការណ៍' : 'Report Reminders' }}
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
                      <p class="empty-message">
                        {{
                          currentLang() === 'km'
                            ? 'មិនមានការរំលឹកនៅពេលនេះទេ។'
                            : 'No reminders right now.'
                        }}
                      </p>
                    }
                  </div>

                  <!-- Classroom Engagement -->
                  <div class="engagement-card">
                    <div class="engagement-header">
                      <h2>
                        {{
                          currentLang() === 'km'
                            ? 'ការចូលរួមក្នុងថ្នាក់រៀន'
                            : 'Classroom Engagement'
                        }}
                      </h2>
                      @if (data.stats.weekDelta != null) {
                        <p>
                          {{
                            currentLang() === 'km'
                              ? 'ការចូលរួមជាមធ្យមរបស់សិស្សកើនឡើង ' +
                                data.stats.weekDelta +
                                '% បើធៀបនឹងសប្តាហ៍មុន។'
                              : 'Average student engagement is up ' +
                                data.stats.weekDelta +
                                '% compared to last week.'
                          }}
                        </p>
                      } @else {
                        <p>
                          {{
                            currentLang() === 'km'
                              ? 'តាមដានការចូលរួមរបស់សិស្សក្នុងថ្នាក់រៀនរបស់អ្នកពេញមួយសប្តាហ៍។'
                              : 'Track your classroom engagement over the week.'
                          }}
                        </p>
                      }
                    </div>
                    <div class="engagement-chart">
                      <div class="chart-bars">
                        @for (day of engagementData(); track $index) {
                          <div class="chart-column">
                            <div class="bar-track">
                              <div
                                class="bar"
                                [style.height.%]="day.value"
                                [class.today]="day.isToday"
                              ></div>
                            </div>
                            <span class="day-label" [class.today]="day.isToday">
                              {{ formatDayLabel(day) }}
                            </span>
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
      @if (!isParent()) {
        <section class="dashboard-hero-wrapper" aria-label="Dashboard Welcome">
          <div class="hero-content">
            <div class="hero-text-block">
              <div class="hero-meta-bar">
                <span class="hero-date-badge">{{ activeDateFormatted() }}</span>
              </div>
              <h1>
                @if (currentLang() === 'km') {
                  <span class="greeting-km">សូមស្វាគមន៍មកកាន់ AutiCare</span>
                  <span class="greeting-subtext">, {{ parentFirstName() }}</span>
                } @else {
                  <span class="greeting-en">Welcome to AutiCare</span>
                  <span class="greeting-subtext">
                    · Good {{ dayPart() }}, {{ parentFirstName() }}</span
                  >
                }
              </h1>
              <p class="hero-subtitle">
                {{
                  currentLang() === 'km'
                    ? 'គ្រប់គ្រងបញ្ជីថែទាំ និងពិនិត្យកំណត់ត្រាគាំទ្រគ្រួសារពីកន្លែងតែមួយ។'
                    : 'Manage the care directory and review family support records from one place.'
                }}
              </p>
            </div>
          </div>
        </section>
      }

      @if (childrenError()) {
        <ac-ui-message tone="error">{{ childrenError() }}</ac-ui-message>
      }

      @if (isParent()) {
        <!-- PARENT OVERVIEW: a greeting, one next step, two calm cards. -->
        <div class="parent-overview">
          <header class="ov-hero">
            <div class="ov-hero-text">
              <span class="hero-date-badge">{{ activeDateFormatted() }}</span>
              <h1>
                @if (currentLang() === 'km') {
                  សួស្តី {{ parentFirstName() }}
                } @else {
                  Good {{ dayPart() }}, {{ parentFirstName() }}
                }
              </h1>
              <p class="ov-subtitle">
                @if (selectedChild(); as child) {
                  {{
                    currentLang() === 'km'
                      ? 'នេះជាអ្វីដែលកំពុងកើតឡើងជាមួយ ' + child.firstName + ' ថ្ងៃនេះ។'
                      : "Here's what's happening with " + child.firstName + ' today.'
                  }}
                } @else {
                  {{
                    currentLang() === 'km'
                      ? 'បង្កើតប្រវត្តិកុមារដើម្បីចាប់ផ្តើម។'
                      : 'Add a child profile to get started.'
                  }}
                }
              </p>
            </div>

            @if (selectedChild(); as child) {
              <div class="care-context-pill-wrapper">
                <button
                  type="button"
                  class="care-context-pill"
                  (click)="toggleChildDropdown()"
                  [attr.aria-expanded]="childDropdownOpen()"
                  [attr.aria-label]="
                    currentLang() === 'km' ? 'កំពុងមើលការថែទាំកុមារ' : 'Viewing care for child'
                  "
                >
                  <span class="dropdown-item-avatar" aria-hidden="true">{{
                    childInitials(child)
                  }}</span>
                  <span class="care-label">
                    {{ currentLang() === 'km' ? 'កំពុងមើលការថែទាំសម្រាប់៖ ' : 'Viewing care for: '
                    }}<strong>{{ child.firstName }}</strong>
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
                      [routerLink]="['/children', child.id]"
                      class="dropdown-add-link"
                      (click)="closeChildDropdown()"
                    >
                      {{ currentLang() === 'km' ? 'បើកប្រវត្តិរូប' : 'Open profile' }}
                    </a>
                    <a
                      routerLink="/children/new"
                      class="dropdown-add-link"
                      (click)="closeChildDropdown()"
                    >
                      +
                      {{ currentLang() === 'km' ? 'បន្ថែមទិន្នន័យកុមារ' : 'Add another child' }}
                    </a>
                  </div>
                }
              </div>
            }
          </header>

          @if (selectedChild(); as child) {
            @if (questionnaireLocked()) {
              <!-- Each child finishes their own questionnaire before their personalized dashboard opens. -->
              <section class="empty-state questionnaire-gate" aria-labelledby="gate-title">
                <h2 id="gate-title">
                  {{
                    currentLang() === 'km'
                      ? 'បំពេញកម្រងសំណួររបស់ ' + child.firstName + ' ដើម្បីបើកផ្ទាំងគ្រប់គ្រង'
                      : 'Finish ' + child.firstName + "'s questionnaire to open their dashboard"
                  }}
                </h2>
                <p>
                  {{
                    parentDashboard()?.questionnaireStatus === 'IN_PROGRESS'
                      ? currentLang() === 'km'
                        ? 'ចម្លើយរបស់អ្នកត្រូវបានរក្សាទុក។ បន្តពីកន្លែងដែលអ្នកឈប់។'
                        : 'Your answers are saved. Pick up where you left off.'
                      : currentLang() === 'km'
                        ? 'សំណួរខ្លីៗអំពីការប្រាស្រ័យទាក់ទង ទម្លាប់ និងអារម្មណ៍។ វាជាការណែនាំអប់រំ មិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ។'
                        : 'A few questions about communication, routines and senses. It guides learning activities; it is not a diagnosis.'
                  }}
                </p>
                <a
                  class="primary-button"
                  routerLink="/screening/history"
                  [queryParams]="{ childId: child.id }"
                  >{{
                    parentDashboard()?.questionnaireStatus === 'IN_PROGRESS'
                      ? currentLang() === 'km'
                        ? 'បន្តកម្រងសំណួរ'
                        : 'Continue questionnaire'
                      : currentLang() === 'km'
                        ? 'ចាប់ផ្តើមកម្រងសំណួរ'
                        : 'Start questionnaire'
                  }}</a
                >
              </section>
            } @else {
              <!-- Quick Actions: a slim toolbar under the greeting, not another row of cards. -->
              <section class="quick-actions-section" aria-labelledby="quick-actions-title">
                <h2 id="quick-actions-title" class="visually-hidden">
                  {{ currentLang() === 'km' ? 'សកម្មភាពរហ័ស' : 'Quick Actions' }}
                </h2>
                <div class="quick-actions-grid">
                  <a
                    class="quick-action-card"
                    routerLink="/observations"
                    [queryParams]="{ childId: child.id, action: 'new' }"
                  >
                    <span class="action-text">{{
                      currentLang() === 'km' ? 'កត់ត្រាការសង្កេត' : 'Add Behaviour Log'
                    }}</span>
                  </a>
                  <a
                    class="quick-action-card"
                    routerLink="/reports"
                    [queryParams]="{ childId: child.id }"
                  >
                    <span class="action-text">{{
                      currentLang() === 'km' ? 'មើលរបាយការណ៍' : 'View Reports'
                    }}</span>
                  </a>
                  <a
                    class="quick-action-card"
                    routerLink="/ai"
                    [queryParams]="{ childId: child.id }"
                  >
                    <span class="action-text">{{
                      currentLang() === 'km' ? 'សួរ AI' : 'Ask AI'
                    }}</span>
                  </a>
                </div>
              </section>

              <ac-parent-analysis [childId]="child.id" [childName]="child.firstName" />

              <!-- Widgets Grid: three plain columns separated by space, no boxes. -->
              <div class="parent-cards-grid">
                <!-- Recent Behaviour Records -->
                <section class="dashboard-widget-card" aria-label="Recent Behaviour Records">
                  <div class="widget-header">
                    <h2>
                      {{ currentLang() === 'km' ? 'ការសង្កេតថ្មីៗ' : 'Recent Behaviour Records' }}
                    </h2>
                    <a
                      routerLink="/observations"
                      [queryParams]="{ childId: child.id }"
                      class="widget-link"
                    >
                      {{ currentLang() === 'km' ? 'មើលទាំងអស់' : 'View all' }} &rarr;
                    </a>
                  </div>
                  @if (parentDashboard()?.recentObservations?.length) {
                    <ul class="widget-list">
                      @for (obs of parentDashboard()?.recentObservations; track obs.id) {
                        <li class="widget-item">
                          <div class="item-meta">
                            <span class="category-pill">{{ obs.category }}</span>
                            <span class="item-date">{{ formatDate(obs.occurredAt) }}</span>
                          </div>
                          @if (obs.note) {
                            <p class="item-text">{{ obs.note }}</p>
                          }
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="widget-empty">
                      {{
                        currentLang() === 'km'
                          ? 'មិនទាន់មានកំណត់ត្រាការសង្កេតនៅឡើយទេ។'
                          : 'No behaviour records yet for this child.'
                      }}
                    </p>
                  }
                </section>

                <!-- Recent Notifications -->
                <section class="dashboard-widget-card" aria-label="Recent Notifications">
                  <div class="widget-header">
                    <h2>
                      {{ currentLang() === 'km' ? 'ការជូនដំណឹងថ្មីៗ' : 'Recent Notifications' }}
                    </h2>
                    <a routerLink="/notifications" class="widget-link">
                      {{ currentLang() === 'km' ? 'មើលទាំងអស់' : 'View all' }} &rarr;
                    </a>
                  </div>
                  @if (parentDashboard()?.recentNotifications?.length) {
                    <ul class="widget-list">
                      @for (notif of parentDashboard()?.recentNotifications; track notif.id) {
                        <li class="widget-item">
                          <span class="item-title">{{ notif.title }}</span>
                          <p class="item-text">{{ notif.body }}</p>
                          <span class="item-date">{{ formatDate(notif.createdAt) }}</span>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="widget-empty">
                      {{
                        currentLang() === 'km'
                          ? 'មិនទាន់មានការជូនដំណឹងនៅឡើយទេ។'
                          : 'No notifications yet.'
                      }}
                    </p>
                  }
                </section>

                <!-- Recommended Activities -->
                <section class="dashboard-widget-card" aria-label="Recommended Activities">
                  <div class="widget-header">
                    <h2>
                      {{ currentLang() === 'km' ? 'សកម្មភាពណែនាំ' : 'Recommended Activities' }}
                    </h2>
                    <a
                      routerLink="/activities"
                      [queryParams]="{ childId: child.id }"
                      class="widget-link"
                    >
                      {{ currentLang() === 'km' ? 'ស្វែងរកទាំងអស់' : 'Explore all' }} &rarr;
                    </a>
                  </div>
                  @if (parentDashboard()?.recommendedActivities?.length) {
                    <ul class="widget-list">
                      @for (act of parentDashboard()?.recommendedActivities; track act.id) {
                        <li class="widget-item">
                          <div class="item-meta">
                            <span class="category-pill">{{ act.category }}</span>
                            <span class="age-pill"
                              >{{ act.minAgeMonths }}–{{ act.maxAgeMonths }}m</span
                            >
                          </div>
                          <span class="item-title">{{ act.title }}</span>
                          <p class="item-text">{{ act.summary }}</p>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="widget-empty">
                      {{
                        currentLang() === 'km'
                          ? 'មិនទាន់មានសកម្មភាពណែនាំនៅឡើយទេ។'
                          : 'No activities found for this age range.'
                      }}
                    </p>
                  }
                </section>
              </div>
            }
          } @else {
            <section class="empty-state">
              <h2>
                {{
                  currentLang() === 'km'
                    ? 'កំណត់ផ្ទាំងគ្រប់គ្រងផ្ទាល់ខ្លួនរបស់អ្នក'
                    : 'Personalize your dashboard'
                }}
              </h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'បន្ថែមប្រវត្តិកុមារដំបូងរបស់អ្នកដើម្បីភ្ជាប់ការវាយតម្លៃ សកម្មភាព របាយការណ៍សាលា និងកំណត់ត្រាថែទាំ។'
                    : 'Add your first child profile to connect screenings, activities, school reports, and care notes.'
                }}
              </p>
              <a class="primary-button" routerLink="/children">{{
                currentLang() === 'km' ? 'បើកប្រវត្តិកុមារ' : 'Open child profiles'
              }}</a>
            </section>
          }
        </div>
      } @else if (isAdmin()) {
        <!-- ADMINISTRATOR REAL DASHBOARD -->
        <ac-admin-overview />
        @if (adminDashboardLoading()) {
          <div class="dashboard-state-center">
            <ac-ui-spinner label="Loading administrative dashboard…" />
          </div>
        } @else if (adminDashboardError()) {
          <ac-ui-message tone="error">{{ adminDashboardError() }}</ac-ui-message>
        } @else if (adminDashboard(); as adminData) {
          <!-- Stats Summary Grid -->
          <section
            class="admin-stats-grid"
            [attr.aria-label]="
              currentLang() === 'km' ? 'រង្វាស់ស្ថិតិរដ្ឋបាល' : 'Administrative metrics'
            "
          >
            <div class="admin-stat-card">
              <span class="admin-stat-label">
                {{ currentLang() === 'km' ? 'គ្រួសារសរុប' : 'Total Families' }}
              </span>
              <span class="admin-stat-val">{{ adminData.stats.totalFamilies }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">
                {{ currentLang() === 'km' ? 'កុមារសកម្ម' : 'Active Children' }}
              </span>
              <span class="admin-stat-val">{{ adminData.stats.activeChildren }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">
                {{ currentLang() === 'km' ? 'មន្ទីរពេទ្យដៃគូ' : 'Partner Hospitals' }}
              </span>
              <span class="admin-stat-val">{{ adminData.stats.totalHospitals }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">
                {{ currentLang() === 'km' ? 'សាលារៀនដៃគូ' : 'Partner Schools' }}
              </span>
              <span class="admin-stat-val">{{ adminData.stats.totalSchools }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">
                {{ currentLang() === 'km' ? 'ការណាត់ជួបសរុប' : 'Total Appointments' }}
              </span>
              <span class="admin-stat-val">{{ adminData.stats.totalAppointments }}</span>
            </div>
            <div class="admin-stat-card">
              <span class="admin-stat-label">
                {{ currentLang() === 'km' ? 'សំណើកំពុងរង់ចាំ' : 'Pending Requests' }}
              </span>
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
                <h2>{{ currentLang() === 'km' ? 'ការណាត់ជួបថ្មីៗ' : 'Recent Appointments' }}</h2>
                <a routerLink="/appointments" class="text-link">
                  {{ currentLang() === 'km' ? 'មើលទាំងអស់' : 'View all' }}
                </a>
              </div>
              @if (adminData.recentAppointments.length) {
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>{{ currentLang() === 'km' ? 'គ្រួសារ' : 'Family' }}</th>
                      <th>{{ currentLang() === 'km' ? 'មន្ទីរពេទ្យ' : 'Hospital' }}</th>
                      <th>{{ currentLang() === 'km' ? 'កាលបរិច្ឆេទ' : 'Date' }}</th>
                      <th>{{ currentLang() === 'km' ? 'ស្ថានភាព' : 'Status' }}</th>
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
                            {{
                              currentLang() === 'km'
                                ? appt.status === 'CONFIRMED'
                                  ? 'បានបញ្ជាក់'
                                  : appt.status === 'COMPLETED'
                                    ? 'បានបញ្ចប់'
                                    : appt.status === 'REQUESTED'
                                      ? 'បានស្នើសុំ'
                                      : appt.status === 'CANCELLED'
                                        ? 'បានបោះបង់'
                                        : appt.status
                                : appt.status
                            }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p class="empty-message">
                  {{
                    currentLang() === 'km'
                      ? 'មិនទាន់មានការណាត់ជួបនៅឡើយទេ។'
                      : 'No appointments recorded yet.'
                  }}
                </p>
              }
            </div>

            <!-- Recent Security & Audit Events -->
            <div class="admin-content-card">
              <div class="admin-card-header">
                <h2>
                  {{ currentLang() === 'km' ? 'កំណត់ហេតុសវនកម្មថ្មីៗ' : 'Recent Audit Events' }}
                </h2>
              </div>
              @if (adminData.recentAuditEvents.length) {
                <div class="audit-timeline">
                  @for (evt of adminData.recentAuditEvents; track evt.id) {
                    <div class="audit-item">
                      <div>
                        <div class="audit-action">{{ evt.action }}</div>
                        <div class="audit-meta">
                          @if (evt.actorEmail) {
                            {{ currentLang() === 'km' ? 'ដោយ៖ ' : 'By: ' }}{{ evt.actorEmail }}
                          }
                          @if (evt.targetEmail) {
                            | {{ currentLang() === 'km' ? 'គោលដៅ៖ ' : 'Target: '
                            }}{{ evt.targetEmail }}
                          }
                        </div>
                      </div>
                      <span class="audit-time">{{ formatDate(evt.createdAt) }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="empty-message">
                  {{
                    currentLang() === 'km'
                      ? 'មិនទាន់មានកំណត់ហេតុសវនកម្មនៅឡើយទេ។'
                      : 'No audit events recorded.'
                  }}
                </p>
              }
            </div>
          </div>

          <section
            class="admin-overview"
            [attr.aria-label]="
              currentLang() === 'km'
                ? 'ផ្លូវកាត់គ្រប់គ្រងរដ្ឋបាល'
                : 'Administrator management shortcuts'
            "
          >
            <article>
              <span class="admin-icon directory" aria-hidden="true"></span>
              <p class="admin-label">
                {{ currentLang() === 'km' ? 'បញ្ជីថែទាំ' : 'Care directory' }}
              </p>
              <h2>{{ currentLang() === 'km' ? 'គ្រប់គ្រងមន្ទីរពេទ្យ' : 'Manage Hospitals' }}</h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'ផ្សព្វផ្សាយមន្ទីរពេទ្យ និងសេវាកម្មឯកទេស ដើម្បីឱ្យក្រុមគ្រួសារអាចធ្វើការសម្រេចចិត្តថែទាំបានត្រឹមត្រូវ។'
                    : 'Publish hospitals and specialist services so families can make informed care choices.'
                }}
              </p>
              <a class="primary-button" routerLink="/hospitals">
                {{ currentLang() === 'km' ? 'គ្រប់គ្រងមន្ទីរពេទ្យ' : 'Manage hospitals' }}
              </a>
            </article>
            <article>
              <span class="admin-icon family" aria-hidden="true"></span>
              <p class="admin-label">
                {{ currentLang() === 'km' ? 'កំណត់ត្រាគ្រួសារ' : 'Family records' }}
              </p>
              <h2>
                {{ adminData.stats.activeChildren }}
                {{ currentLang() === 'km' ? 'ប្រវត្តិរូបកុមារសកម្ម' : 'active child profiles' }}
              </h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'ពិនិត្យប្រវត្តិរូបកុមារទូទាំងប្រព័ន្ធ ដើម្បីគាំទ្រក្រុមការងារថែទាំជាមួយនឹងកំណត់ត្រាត្រឹមត្រូវ។'
                    : 'Review child profiles across the service to support the care team with accurate records.'
                }}
              </p>
              <a class="text-link" routerLink="/children">
                {{ currentLang() === 'km' ? 'ពិនិត្យប្រវត្តិរូបកុមារ' : 'Review child profiles' }}
                <span aria-hidden="true">-&gt;</span>
              </a>
            </article>
            <article>
              <span class="admin-icon school" aria-hidden="true"></span>
              <p class="admin-label">
                {{ currentLang() === 'km' ? 'របាយការណ៍សាលារៀន' : 'School reporting' }}
              </p>
              <h2>{{ currentLang() === 'km' ? 'សាលារៀនដៃគូ' : 'Partner Schools' }}</h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'ពិនិត្យការចូលរួមរបស់សាលារៀន និងរក្សាបណ្តាញគាំទ្រឱ្យស្របគ្នាជុំវិញកុមារម្នាក់ៗ។'
                    : 'Review school participation and keep the support network aligned around each child.'
                }}
              </p>
              <a class="text-link" routerLink="/schools">
                {{ currentLang() === 'km' ? 'បើកបញ្ជីសាលារៀន' : 'Open schools' }}
                <span aria-hidden="true">-&gt;</span>
              </a>
            </article>
          </section>
        }
      } @else if (isHospital()) {
        <div class="dashboard-state-center">
          <ac-ui-spinner
            [label]="
              currentLang() === 'km'
                ? 'កំពុងបញ្ជូនទៅផ្ទាំងគ្រប់គ្រងមន្ទីរពេទ្យ…'
                : 'Redirecting to Hospital Dashboard…'
            "
          />
        </div>
      }

      <!-- The overview stays short for parents; help and crisis stay one click away in the shell. -->
      @if (!isParent()) {
        <footer class="dashboard-footer">
          <section>
            <h2>AutiCare</h2>
            <p>
              {{
                currentLang() === 'km'
                  ? 'គាំទ្រក្រុមគ្រួសារដែលមានតម្រូវការពិសេស ជាមួយនឹងមាគ៌ាថែទាំផ្ទាល់ខ្លួន និងធនធានជំនាញវិជ្ជាជីវៈ។'
                  : 'Supporting neurodiverse families with personalized care paths and professional resources.'
              }}
            </p>
          </section>
          <section>
            <h3>{{ currentLang() === 'km' ? 'ជំនួយ' : 'Support' }}</h3>
            <a routerLink="/support">
              {{ currentLang() === 'km' ? 'ធនធានសង្គ្រោះបន្ទាន់' : 'Emergency Resources' }}
            </a>
            <a routerLink="/support">
              {{
                currentLang() === 'km'
                  ? 'ការមិនទទួលខុសត្រូវផ្នែកវេជ្ជសាស្ត្រ'
                  : 'Medical Disclaimer'
              }}
            </a>
            <a routerLink="/support">
              {{ currentLang() === 'km' ? 'ទាក់ទងផ្នែកគាំទ្រ' : 'Contact Support' }}
            </a>
          </section>
          <section>
            <h3>{{ currentLang() === 'km' ? 'តំណភ្ជាប់រហ័ស' : 'Quick Links' }}</h3>
            <a routerLink="/privacy">
              {{ currentLang() === 'km' ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy' }}
            </a>
            <a routerLink="/terms">
              {{ currentLang() === 'km' ? 'លក្ខខណ្ឌប្រើប្រាស់' : 'Terms of Service' }}
            </a>
          </section>
          <section>
            <h3>{{ currentLang() === 'km' ? 'ទំនាក់ទំនងជាមួយយើង' : 'Stay Connected' }}</h3>
            <div
              class="social-row"
              [attr.aria-label]="currentLang() === 'km' ? 'តំណភ្ជាប់សហគមន៍' : 'Community links'"
            >
              <a
                routerLink="/support"
                [attr.aria-label]="currentLang() === 'km' ? 'ចែករំលែក AutiCare' : 'Share AutiCare'"
              >
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
              <a
                routerLink="/support"
                [attr.aria-label]="
                  currentLang() === 'km' ? 'បើកការគាំទ្រសហគមន៍' : 'Open community support'
                "
              >
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
            <p class="copyright">
              (c) {{ currentYear }} AutiCare.
              {{ currentLang() === 'km' ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង។' : 'All rights reserved.' }}
            </p>
          </section>
        </footer>
      }
    }
  `,
  styles: [
    `
      /* ========== SCHOOL DASHBOARD STYLES ========== */
      .page-layout {
        display: flex;
        gap: var(--ac-space-6);
        padding: var(--ac-space-6) 0;
        width: 100%;
        max-width: 100%;
      }

      .main-content {
        flex: 1;
        min-width: 0;
        width: 100%;
        max-width: 100%;
      }

      .school-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--ac-space-6);
        margin-bottom: var(--ac-space-6);
        flex-wrap: wrap;
      }

      .school-header .header-intro {
        flex: 1;
        min-width: 280px;
      }

      .school-header .eyebrow {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ac-color-action-mid);
        margin: 0 0 var(--ac-space-1) 0;
      }

      .school-header h1 {
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: 0 0 var(--ac-space-2) 0;
      }

      .school-header .subtitle {
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-body);
        max-width: 680px;
        margin: 0;
      }

      .school-header .header-actions {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
      }

      .school-header .primary-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--ac-space-2);
        min-height: 44px;
        padding: 0 var(--ac-space-4);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: 1px solid transparent;
        border-radius: var(--ac-radius-md);
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition: background var(--ac-motion-fast);
      }

      .school-header .primary-btn:hover {
        background: var(--ac-color-action-deep);
      }

      .school-header .secondary-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 var(--ac-space-4);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition:
          border-color var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .school-header .secondary-btn:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      /* Unified flat stats strip replacing big cards */
      .stats-strip {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg);
        margin-bottom: var(--ac-space-6);
      }

      .stat-item {
        padding: var(--ac-space-4) var(--ac-space-5);
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-1);
      }

      .stat-item + .stat-item {
        border-left: 1px solid var(--ac-color-border-slate);
      }

      .stat-label {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .stat-body {
        display: flex;
        align-items: baseline;
        gap: var(--ac-space-2);
        flex-wrap: wrap;
      }

      .stat-value {
        font-size: 28px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        line-height: 1;
      }

      .stat-value.warning {
        color: var(--ac-color-alert-strong);
      }

      .stat-meta {
        font-size: 12px;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
      }

      .stat-meta.positive {
        color: var(--ac-color-green-600);
      }

      .stat-meta.warning {
        color: var(--ac-color-alert-strong);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: var(--ac-space-6);
      }

      .left-column,
      .right-column {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-6);
      }

      .content-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg);
        padding: var(--ac-space-6);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--ac-space-4);
      }

      .card-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .view-all {
        font-size: 13px;
        color: var(--ac-color-action-mid);
        text-decoration: none;
        font-weight: var(--ac-font-weight-semibold);
      }

      .view-all:hover {
        color: var(--ac-color-action-deep);
        text-decoration: underline;
      }

      .reports-table {
        width: 100%;
        border-collapse: collapse;
      }

      .reports-table th {
        text-align: left;
        padding: var(--ac-space-3) var(--ac-space-4);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-slate);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .reports-table td {
        padding: var(--ac-space-3) var(--ac-space-4);
        border-bottom: 1px solid var(--ac-color-slate-100);
        font-size: 14px;
        color: var(--ac-color-text-strong);
      }

      .reports-table tr:last-child td {
        border-bottom: none;
      }

      .student-cell {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
      }

      .student-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--ac-font-weight-semibold);
        font-size: 11px;
        color: var(--ac-color-text-on-action);
        flex-shrink: 0;
      }

      .student-name {
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-strong);
      }

      .status-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: var(--ac-radius-pill);
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .status-badge.submitted {
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-700);
        border: 1px solid var(--ac-color-green-100);
      }

      .status-badge.draft {
        background: var(--ac-color-slate-100);
        color: var(--ac-color-text-slate);
        border: 1px solid var(--ac-color-border-slate);
      }

      .activities-timeline {
        display: flex;
        flex-direction: column;
      }

      .activity-item {
        display: flex;
        gap: var(--ac-space-3);
        padding: var(--ac-space-3) 0;
        border-bottom: 1px solid var(--ac-color-slate-100);
      }

      .activity-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .activity-item:first-child {
        padding-top: 0;
      }

      .activity-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-semibold);
        flex-shrink: 0;
      }

      .activity-content {
        flex: 1;
      }

      .activity-content p {
        margin: 0 0 2px 0;
        font-size: 14px;
        color: var(--ac-color-text-strong);
        line-height: var(--ac-line-body);
      }

      .activity-content strong {
        font-weight: var(--ac-font-weight-semibold);
      }

      .activity-time {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .reminders-card {
        background: var(--ac-color-surface);
      }

      .reminders-list {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-3);
      }

      .reminder-item {
        padding: var(--ac-space-3) var(--ac-space-4);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-left: 3px solid var(--ac-color-border-slate);
      }

      .reminder-item.today {
        background: var(--ac-color-red-50);
        border-left-color: var(--ac-color-alert-strong);
      }

      .reminder-item.tomorrow {
        background: var(--ac-color-blue-100);
        border-left-color: var(--ac-color-blue-500);
      }

      .reminder-item.upcoming {
        background: var(--ac-color-surface);
        border-left-color: var(--ac-color-text-slate);
      }

      .reminder-header {
        margin-bottom: var(--ac-space-1);
      }

      .reminder-when {
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-slate);
      }

      .reminder-when.today {
        color: var(--ac-color-alert-strong);
      }

      .reminder-when.tomorrow {
        color: var(--ac-color-blue-600);
      }

      .reminder-title {
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
        margin-bottom: 2px;
      }

      .reminder-time {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      /* Classroom Engagement: calmed from harsh dark gradient to flat clean panel */
      .engagement-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-lg);
        padding: var(--ac-space-6);
        color: var(--ac-color-text-strong);
      }

      .engagement-header h2 {
        margin: 0 0 var(--ac-space-2) 0;
        font-size: 18px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .engagement-header p {
        margin: 0 0 var(--ac-space-4) 0;
        font-size: 13px;
        color: var(--ac-color-text-body);
        line-height: var(--ac-line-body);
      }

      .engagement-chart {
        margin-top: var(--ac-space-3);
      }

      .chart-bars {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 140px;
        gap: var(--ac-space-2);
      }

      .chart-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ac-space-2);
        height: 100%;
      }

      .bar-track {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        background: var(--ac-color-slate-100);
        border-radius: var(--ac-radius-sm);
        padding: 0;
      }

      .bar {
        width: 100%;
        background: var(--ac-brand-300);
        border-radius: var(--ac-radius-sm);
        min-height: 8px;
        transition: height 0.3s ease;
      }

      .bar.today {
        background: var(--ac-color-action);
      }

      .day-label {
        font-size: 11px;
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-muted);
      }

      .day-label.today {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-action-deep);
      }

      .empty-message {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        text-align: center;
        color: var(--ac-color-text-muted);
        font-size: 14px;
        padding: var(--ac-space-6);
      }

      @media (max-width: 900px) {
        .stats-strip {
          grid-template-columns: repeat(2, 1fr);
        }

        .stat-item:nth-child(3) {
          border-left: none;
          border-top: 1px solid var(--ac-color-border-slate);
        }

        .stat-item:nth-child(4) {
          border-top: 1px solid var(--ac-color-border-slate);
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 600px) {
        .stats-strip {
          grid-template-columns: 1fr;
        }

        .stat-item + .stat-item {
          border-left: none;
          border-top: 1px solid var(--ac-color-border-slate);
        }
      }

      /* ========== PARENT DASHBOARD STYLES (Unchanged) ========== */
      :host {
        display: block;
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

      .error {
        border-radius: 12px;
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
        padding: 14px 16px;
        margin-bottom: 20px;
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
        background: var(--ac-color-action);
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

      /* Parent overview: a short greeting, one next step, two cards. */
      .parent-overview {
        display: flex;
        flex-direction: column;
        gap: 22px;
        padding-bottom: 32px;
      }

      .ov-hero {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .ov-hero-text {
        min-width: 0;
      }

      .ov-hero h1 {
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .ov-subtitle {
        margin-top: 6px;
        font-size: var(--ac-type-page-subtitle);
        color: var(--ac-color-text-body);
        line-height: var(--ac-line-body);
      }

      .parent-overview .care-context-pill {
        padding: 4px 12px 4px 4px;
      }

      .parent-overview .care-dropdown-menu {
        left: auto;
        right: 0;
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

      @media (max-width: 900px) {
      }

      @media (max-width: 540px) {
      }

      .gradient-screening {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--ac-color-white) 95%, transparent) 0%,
          var(--ac-color-surface-info) 100%
        );
        border-color: var(--ac-color-border-info);
      }

      .gradient-milestone {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--ac-color-white) 95%, transparent) 0%,
          var(--ac-color-green-50) 100%
        );
        border-color: var(--ac-color-border);
      }

      .gradient-hospital {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--ac-color-white) 95%, transparent) 0%,
          var(--ac-color-ice-blue-soft) 100%
        );
        border-color: var(--ac-color-ice-blue-border);
      }

      .gradient-trajectory {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--ac-color-white) 95%, transparent) 0%,
          var(--ac-color-tint-blue-mist) 100%
        );
        border-color: var(--ac-color-border-info);
      }

      .roster-child-card.active-child {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
        box-shadow: var(--ac-shadow-sm);
      }

      .roster-badge.screened {
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-deep);
      }

      .admin-overview {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
      }

      .admin-overview article {
        min-height: 280px;
        border: 1px solid color-mix(in srgb, var(--ac-color-border) 72%, transparent);
        border-radius: 8px;
        background: var(--ac-color-surface);
        box-shadow: 0 12px 34px color-mix(in srgb, var(--ac-brand-800) 7%, transparent);
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

      .bar-chart span.active {
        background: var(--ac-color-action);
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
        .dashboard-hero-wrapper {
          margin-bottom: 18px;
        }

        .hero-content {
          gap: 16px;
        }

        .hero-text-block {
          min-width: 0;
          width: 100%;
        }

        .hero-text-block h1 {
          font-size: var(--ac-type-page-title);
          line-height: 1.35;
          margin-bottom: 6px;
          word-break: break-word;
        }

        .greeting-subtext {
          font-size: 0.9em;
          font-weight: 500;
        }

        .hero-subtitle {
          font-size: 13.5px;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .dashboard-footer {
          grid-template-columns: 1fr;
          margin-top: 40px;
          gap: 24px;
          padding-bottom: 24px;
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

      @media (max-width: 480px) {
        .hero-text-block h1 {
          font-size: var(--ac-type-page-title);
        }
      }

      .dashboard-state-center {
        display: flex;
        justify-content: center;
        padding: 48px 0;
      }

      .admin-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
        margin-bottom: 28px;
      }

      .admin-stat-card {
        background: var(--ac-color-surface);
        border: 1px solid color-mix(in srgb, var(--ac-color-border) 72%, transparent);
        border-radius: 16px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 4px 16px color-mix(in srgb, var(--ac-brand-800) 4%, transparent);
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
        border: 1px solid color-mix(in srgb, var(--ac-color-border) 72%, transparent);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 16px color-mix(in srgb, var(--ac-brand-800) 4%, transparent);
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

      /* ========== PARENT DASHBOARD: QUICK ACTIONS & RECENT LISTS ========== */
      /* Kept flat on purpose: the next-step panel is the only highlighted block. */
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }

      .quick-actions-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ac-space-2);
      }

      /* Same size and shape as the next-step button in ac-parent-analysis. */
      .quick-action-card {
        display: inline-flex;
        align-items: center;
        min-height: 36px;
        padding: 0 var(--ac-space-4);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition:
          border-color var(--ac-motion-fast) var(--ac-ease-standard),
          color var(--ac-motion-fast) var(--ac-ease-standard);
      }

      .quick-action-card:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      .quick-action-card:focus-visible,
      .widget-link:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .parent-cards-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--ac-space-8);
        margin-top: var(--ac-space-4);
      }

      .dashboard-widget-card {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-3);
        min-width: 0;
        padding-top: var(--ac-space-4);
        border-top: 2px solid var(--ac-color-border-slate);
      }

      .widget-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--ac-space-3);
      }

      .widget-header h2 {
        margin: 0;
        font-size: 16px;
        line-height: var(--ac-line-tight);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .widget-link {
        flex-shrink: 0;
        border-radius: var(--ac-radius-xs);
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
      }

      .widget-link:hover {
        text-decoration: underline;
      }

      .widget-list {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .widget-item {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-1);
        padding: var(--ac-space-3) 0;
        border-bottom: 1px solid var(--ac-color-slate-line-faint);
      }

      .widget-item:first-child {
        padding-top: 0;
      }

      .widget-item:last-child {
        border-bottom: 0;
      }

      .item-meta {
        display: flex;
        align-items: center;
        gap: var(--ac-space-2);
        flex-wrap: wrap;
      }

      .category-pill,
      .age-pill {
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .category-pill {
        color: var(--ac-color-action-deep);
      }

      .age-pill,
      .item-date {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .item-title {
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .item-text {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        margin: 0;
        overflow: hidden;
        font-size: 14px;
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-body);
        overflow-wrap: anywhere;
      }

      .widget-empty {
        margin: 0;
        font-size: 14px;
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-muted);
      }

      @media (max-width: 900px) {
        .parent-cards-grid {
          grid-template-columns: 1fr;
          gap: var(--ac-space-6);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .quick-action-card {
          transition: none;
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
  protected readonly selectedChildId = signal<string | null>(null);

  protected readonly activeChildren = computed(() => {
    return this.parentDashboard()?.children ?? [];
  });

  /**
   * The selected child has not finished their questionnaire yet. Older API
   * responses without the field leave the dashboard open, as before.
   */
  protected readonly questionnaireLocked = computed(() => {
    const status = this.parentDashboard()?.questionnaireStatus;
    return status === 'NOT_STARTED' || status === 'IN_PROGRESS';
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
    const isKm = this.currentLang() === 'km';
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
      description: isKm
        ? `បានបញ្ចប់ «${r.title}» ក្នុង ${r.activityCategory}។`
        : `completed "${r.title}" in ${r.activityCategory}.`,
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

  protected formatDayLabel(day: { label: string; isToday: boolean }): string {
    if (this.currentLang() !== 'km') {
      return day.isToday ? 'Today' : day.label;
    }
    if (day.isToday) return 'ថ្ងៃនេះ';
    const kmDays: Record<string, string> = {
      Mon: 'ច័ន្ទ',
      Tue: 'អង្គារ',
      Wed: 'ពុធ',
      Thu: 'ព្រហ',
      Fri: 'សុក្រ',
      Sat: 'សៅរ៍',
      Sun: 'អាទិត្យ',
    };
    return kmDays[day.label] ?? day.label;
  }

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
    let months = today.getMonth() - birthDate.getMonth();
    if (today.getDate() < birthDate.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    const safeYears = Math.max(years, 0);
    const safeMonths = Math.max(months, 0);
    const isKm = this.currentLang() === 'km';
    if (isKm) {
      if (safeYears > 0 && safeMonths > 0) return `${safeYears} ឆ្នាំ ${safeMonths} ខែ`;
      if (safeYears > 0) return `${safeYears} ឆ្នាំ`;
      return `${safeMonths} ខែ`;
    }
    if (safeYears > 0 && safeMonths > 0) {
      return `${safeYears} ${safeYears === 1 ? 'year' : 'years'} ${safeMonths} ${safeMonths === 1 ? 'month' : 'months'}`;
    }
    if (safeYears > 0) {
      return `${safeYears} ${safeYears === 1 ? 'year' : 'years'}`;
    }
    return `${safeMonths} ${safeMonths === 1 ? 'month' : 'months'}`;
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
    const isKm = this.currentLang() === 'km';
    switch (urgency) {
      case 'today':
        return isKm ? 'ថ្ងៃនេះ' : 'DUE TODAY';
      case 'tomorrow':
        return isKm ? 'ថ្ងៃស្អែក' : 'TOMORROW';
      default:
        return isKm ? 'ខាងមុខ' : 'UPCOMING';
    }
  }

  protected formatDate(dateStr: string): string {
    const isKm = this.currentLang() === 'km';
    const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isKm) {
      return new Intl.DateTimeFormat('km-KH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected formatPending(value: number | undefined): string {
    const n = value ?? 0;
    return n < 10 ? `0${n}` : `${n}`;
  }

  onSelectChild(childId: string) {
    if (this.selectedChildId() === childId) return;
    this.selectedChildId.set(childId);
    this.loadParentDashboard(childId);
  }

  loadParentDashboard(childId?: string) {
    const targetChildId = childId ?? this.selectedChildId() ?? undefined;
    this.dashboardApi.getParentDashboard(targetChildId).subscribe({
      next: (data) => {
        this.parentDashboard.set(data);
        if (data.selectedChild) {
          this.selectedChildId.set(data.selectedChild.id);
        }
      },
      error: () => {
        // The analysis panel reports its own failures; nothing here renders the
        // roster, so a failed fetch simply leaves the previous selection in place.
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
